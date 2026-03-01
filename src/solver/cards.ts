import { Counts, RankValue } from "./types";

export type Owner = "A" | "B";

export type Suit = "♠" | "♥" | "♣" | "♦";

export type Card = {
  id: string;
  suit: Suit | "JOKER";
  value: RankValue;
  rankLabel: string;
  suitLabel: string;
  longLabel: string;
};

const SUITS: Suit[] = ["♠", "♥", "♣", "♦"];
const NORMAL_RANKS: Array<{ value: RankValue; label: string }> = [
  { value: 0, label: "3" },
  { value: 1, label: "4" },
  { value: 2, label: "5" },
  { value: 3, label: "6" },
  { value: 4, label: "7" },
  { value: 5, label: "8" },
  { value: 6, label: "9" },
  { value: 7, label: "10" },
  { value: 8, label: "J" },
  { value: 9, label: "Q" },
  { value: 10, label: "K" },
  { value: 11, label: "A" },
  { value: 12, label: "2" }
];

export const DECK: Card[] = [
  ...NORMAL_RANKS.flatMap(({ value, label }) =>
    SUITS.map((suit) => ({
      id: `${label}-${suit}`,
      suit,
      value,
      rankLabel: label,
      suitLabel: suit,
      longLabel: `${label}${suit}`
    })),
  ),
  {
    id: "SJ",
    suit: "JOKER",
    value: 13,
    rankLabel: "SJ",
    suitLabel: "小王",
    longLabel: "小王"
  },
  {
    id: "BJ",
    suit: "JOKER",
    value: 14,
    rankLabel: "BJ",
    suitLabel: "大王",
    longLabel: "大王"
  }
];

export function emptyCounts(): Counts {
  return Array.from({ length: 15 }, () => 0) as Counts;
}

export function cardsToCounts(cards: Card[]): Counts {
  const c = Array.from({ length: 15 }, () => 0);
  for (const card of cards) c[card.value] += 1;
  return c as Counts;
}

