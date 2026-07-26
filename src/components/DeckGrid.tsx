import { useMemo } from "react";
import { Card, DECK } from "../solver/cards";
import { CardFace } from "./CardFace";
import { OwnerById } from "../hooks/useHands";

type RankGroup = { key: string; label: string; cards: Card[] };

function buildGroups(): RankGroup[] {
  const groups = new Map<string, RankGroup>();
  for (const card of DECK) {
    const key = card.suit === "JOKER" ? "JOKER" : card.rankLabel;
    const label = card.suit === "JOKER" ? "王" : card.rankLabel;
    const group = groups.get(key) ?? { key, label, cards: [] };
    group.cards.push(card);
    groups.set(key, group);
  }
  return [...groups.values()];
}

/**
 * 牌库：按点数分组（同点数 4 张花色一组、双王一组），
 * auto-fill 网格自适应任意屏宽。点击行为见 useHands.tapCard。
 */
export function DeckGrid({
  ownerById,
  onTap,
}: {
  ownerById: OwnerById;
  onTap: (cardId: string) => void;
}) {
  const groups = useMemo(buildGroups, []);

  return (
    <div className="grid gap-x-3 gap-y-3 [grid-template-columns:repeat(auto-fill,minmax(142px,1fr))] sm:gap-x-4 sm:[grid-template-columns:repeat(auto-fill,minmax(166px,1fr))]">
      {groups.map((group) => (
        <div key={group.key}>
          <div className="mb-1 text-xs font-semibold text-slate-400">{group.label}</div>
          <div className="flex gap-1 sm:gap-1.5">
            {group.cards.map((card) => {
              const owner = ownerById[card.id] ?? null;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => onTap(card.id)}
                  className="group rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-1"
                  aria-pressed={owner !== null}
                  aria-label={`${card.longLabel}${owner ? `，已归玩家 ${owner}` : ""}`}
                  title={card.longLabel}
                >
                  <CardFace card={card} size="sm" owner={owner} interactive />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
