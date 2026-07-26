import { DECK } from "./cards";
import { PLAY_TYPES } from "./playtype-meta";
import { DEFAULT_RULE_CONFIG, RuleConfig } from "./rule-config";
import { PlayType } from "./types";

/**
 * 分享链接编解码：把双方手牌与规则配置压缩进 URL hash。
 * 格式：#s=v1;a=<牌索引-连接>;b=<牌索引-连接>;r=<牌型开关位串>
 * 牌用其在 DECK 中的下标表示（0..53），顺序稳定；规则位串按 PLAY_TYPES 顺序。
 */
export type SharePayload = {
  a: string[];
  b: string[];
  rules: RuleConfig;
};

const VERSION = "v1";

const ID_TO_INDEX = new Map(DECK.map((c, i) => [c.id, i]));

export function encodeShareHash(aIds: string[], bIds: string[], rules: RuleConfig): string {
  const enc = (ids: string[]) =>
    ids
      .map((id) => ID_TO_INDEX.get(id))
      .filter((n): n is number => n !== undefined)
      .join("-");
  const bits = PLAY_TYPES.map((t) => (rules.allow[t] ? "1" : "0")).join("");
  return `s=${VERSION};a=${enc(aIds)};b=${enc(bIds)};r=${bits}`;
}

/** 解析失败（格式错误、卡牌越界、重复分配）时返回 null，调用方按无分享处理 */
export function decodeShareHash(hash: string): SharePayload | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw.startsWith("s=")) return null;

  const fields = new Map<string, string>();
  for (const part of raw.split(";")) {
    const eq = part.indexOf("=");
    if (eq <= 0) return null;
    fields.set(part.slice(0, eq), part.slice(eq + 1));
  }
  if (fields.get("s") !== VERSION) return null;

  const parseIds = (text: string | undefined): string[] | null => {
    if (!text) return null;
    const out: string[] = [];
    for (const tok of text.split("-")) {
      if (!/^\d{1,2}$/.test(tok)) return null;
      const n = Number(tok);
      if (n >= DECK.length) return null;
      out.push(DECK[n].id);
    }
    return out;
  };

  const a = parseIds(fields.get("a"));
  const b = parseIds(fields.get("b"));
  if (!a || !b || a.length === 0 || b.length === 0) return null;
  const seen = new Set([...a, ...b]);
  if (seen.size !== a.length + b.length) return null;

  let rules = DEFAULT_RULE_CONFIG;
  const bits = fields.get("r");
  if (bits !== undefined) {
    if (bits.length !== PLAY_TYPES.length || !/^[01]+$/.test(bits)) return null;
    rules = {
      allow: PLAY_TYPES.reduce((acc, t, i) => {
        acc[t] = bits[i] === "1";
        return acc;
      }, {} as Record<PlayType, boolean>),
    };
  }

  return { a, b, rules };
}
