import { PlayType } from "./types";

export const PLAY_TYPES: PlayType[] = [
  "single",
  "pair",
  "triple",
  "triple_single",
  "triple_pair",
  "straight",
  "straight_pairs",
  "airplane",
  "airplane_single",
  "airplane_pair",
  "four_two",
  "four_two_pairs",
  "bomb",
  "rocket"
];

export const PLAY_TYPE_LABEL: Record<PlayType, string> = {
  single: "单",
  pair: "对",
  triple: "三",
  triple_single: "三带一",
  triple_pair: "三带二",
  straight: "顺子",
  straight_pairs: "连对",
  airplane: "飞机",
  airplane_single: "飞机带双单",
  airplane_pair: "飞机带双对",
  four_two: "四带二",
  four_two_pairs: "四带两对",
  bomb: "炸弹",
  rocket: "王炸"
};

export const PLAY_TYPE_GROUPS: Array<{ title: string; types: PlayType[] }> = [
  { title: "基础", types: ["single", "pair", "triple"] },
  { title: "三带", types: ["triple_single", "triple_pair"] },
  { title: "连牌", types: ["straight", "straight_pairs"] },
  { title: "飞机", types: ["airplane", "airplane_single", "airplane_pair"] },
  { title: "四带", types: ["four_two", "four_two_pairs"] },
  { title: "炸弹", types: ["bomb", "rocket"] }
];
