import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, DECK, Owner } from "../solver/cards";
import { Preset } from "../solver/presets";

const STORAGE_KEY = "hands.v1";

export type OwnerById = Record<string, Owner | null>;

function emptyOwners(): OwnerById {
  const base: OwnerById = {};
  for (const c of DECK) base[c.id] = null;
  return base;
}

function loadOwners(): OwnerById {
  const base = emptyOwners();
  if (typeof window === "undefined") return base;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Record<string, unknown>;
    for (const [id, owner] of Object.entries(saved)) {
      if (id in base && (owner === "A" || owner === "B")) base[id] = owner;
    }
  } catch {
    // 忽略损坏的存档
  }
  return base;
}

function sortCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => a.value - b.value || a.id.localeCompare(b.id));
}

/**
 * 手牌设置状态：
 * - active：当前为哪位玩家选牌（代替旧版「工具 + 橡皮擦」）；
 * - 点击牌库：空牌 → 归当前玩家；已归当前玩家 → 移除；归对方 → 改归当前玩家；
 * - 自动持久化到 localStorage，刷新不丢。
 */
export function useHands() {
  const [active, setActive] = useState<Owner>("A");
  const [ownerById, setOwnerById] = useState<OwnerById>(loadOwners);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const slim: Record<string, Owner> = {};
      for (const [id, owner] of Object.entries(ownerById)) {
        if (owner) slim[id] = owner;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
    } catch {
      // 存储失败不影响使用
    }
  }, [ownerById]);

  const tapCard = useCallback(
    (cardId: string) => {
      setOwnerById((prev) => ({
        ...prev,
        [cardId]: prev[cardId] === active ? null : active,
      }));
    },
    [active],
  );

  const removeCard = useCallback((cardId: string) => {
    setOwnerById((prev) => (prev[cardId] === null ? prev : { ...prev, [cardId]: null }));
  }, []);

  const clearOwner = useCallback((owner: Owner) => {
    setOwnerById((prev) => {
      const next = { ...prev };
      for (const [id, o] of Object.entries(next)) {
        if (o === owner) next[id] = null;
      }
      return next;
    });
  }, []);

  const clearAll = useCallback(() => setOwnerById(emptyOwners()), []);

  const loadPreset = useCallback((preset: Preset) => {
    setOwnerById(() => {
      const next = emptyOwners();
      for (const id of preset.a) if (id in next) next[id] = "A";
      for (const id of preset.b) if (id in next) next[id] = "B";
      return next;
    });
  }, []);

  const cardsA = useMemo(() => sortCards(DECK.filter((c) => ownerById[c.id] === "A")), [ownerById]);
  const cardsB = useMemo(() => sortCards(DECK.filter((c) => ownerById[c.id] === "B")), [ownerById]);

  return {
    active,
    setActive,
    ownerById,
    tapCard,
    removeCard,
    clearOwner,
    clearAll,
    loadPreset,
    cardsA,
    cardsB,
  };
}
