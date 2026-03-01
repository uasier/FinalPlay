import { RankValue } from "./types";

export const RANK_LABELS: Record<RankValue, string> = {
  0: "3",
  1: "4",
  2: "5",
  3: "6",
  4: "7",
  5: "8",
  6: "9",
  7: "10",
  8: "J",
  9: "Q",
  10: "K",
  11: "A",
  12: "2",
  13: "SJ",
  14: "BJ"
};

export function isStraightRank(v: RankValue): boolean {
  return v >= 0 && v <= 11;
}

export function otherPlayer(p: "A" | "B"): "A" | "B" {
  return p === "A" ? "B" : "A";
}

