/**
 * 内置示例残局：一键载入，便于新用户直接体验求解流程。
 * 卡牌以 DECK 中的 id 表示（如 "K-♠"、"SJ"）。
 * 所有示例均已通过 scripts/verify-presets.ts 验证：默认规则下 A 必胜。
 */
export type Preset = {
  name: string;
  description: string;
  a: string[];
  b: string[];
};

export const PRESETS: Preset[] = [
  {
    // B 有多个应对分支（7 个选择点），最适合体验「逐步演示」
    name: "对拉博弈",
    description: "双方来回拉扯，B 有多种应对可选",
    a: ["7-♠", "7-♥", "J-♠", "2-♠"],
    b: ["9-♥", "9-♦", "Q-♠"],
  },
  {
    name: "飞机带翅膀",
    description: "A 用飞机一举奠定胜局",
    a: ["8-♠", "8-♥", "8-♣", "9-♠", "9-♥", "9-♣", "3-♠", "4-♠"],
    b: ["2-♠", "2-♥", "A-♠", "A-♥", "K-♠"],
  },
  {
    name: "王炸开路",
    description: "王炸压制后对 A 收尾",
    a: ["SJ", "BJ", "A-♠", "A-♥"],
    b: ["9-♠", "9-♥", "9-♣"],
  },
];
