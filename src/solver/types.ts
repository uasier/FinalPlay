export type Player = "A" | "B";

export type RankValue =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14;

export type Counts = ReadonlyArray<number> & { readonly length: 15 };

export type PlayType =
  | "single"
  | "pair"
  | "triple"
  | "triple_single"
  | "triple_pair"
  | "straight"
  | "straight_pairs"
  | "airplane"
  | "airplane_single"
  | "airplane_pair"
  | "four_two"
  | "four_two_pairs"
  | "bomb"
  | "rocket";

export type Play = {
  type: PlayType;
  keyRank: RankValue;
  length?: number;
  cards: RankValue[];
};

export type Move =
  | { kind: "PASS" }
  | {
      kind: "PLAY";
      play: Play;
    };

export type GameState = {
  a: Counts;
  b: Counts;
  turn: Player;
  constraint: Play | null;
};

