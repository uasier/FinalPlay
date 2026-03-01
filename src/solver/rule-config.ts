import { PlayType } from "./types";
import { PLAY_TYPES } from "./playtype-meta";

export type RuleConfig = {
  allow: Record<PlayType, boolean>;
};

export const DEFAULT_RULE_CONFIG: RuleConfig = {
  allow: PLAY_TYPES.reduce((acc, t) => {
    acc[t] = true;
    return acc;
  }, {} as Record<PlayType, boolean>)
};

export function ruleKey(config: RuleConfig): string {
  return PLAY_TYPES.map((t) => (config.allow[t] ? "1" : "0")).join("");
}

export function normalizeRuleConfig(raw: unknown): RuleConfig {
  const base = DEFAULT_RULE_CONFIG.allow;
  const input = (raw && typeof raw === "object" ? (raw as any) : null) as any;
  const allowIn = input?.allow && typeof input.allow === "object" ? input.allow : null;

  const allow = PLAY_TYPES.reduce((acc, t) => {
    const v = allowIn?.[t];
    acc[t] = typeof v === "boolean" ? v : base[t];
    return acc;
  }, {} as Record<PlayType, boolean>);

  return { allow };
}

