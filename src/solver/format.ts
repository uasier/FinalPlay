import { Move, Play, RankValue } from "./types";
import { RANK_LABELS } from "./ranks";

function sortRanks(a: RankValue, b: RankValue): number {
  return a - b;
}

function formatRank(v: RankValue): string {
  return RANK_LABELS[v];
}

export function formatPlay(play: Play): string {
  const cards = [...play.cards].sort(sortRanks);
  const cardsText = cards.map(formatRank).join(" ");
  switch (play.type) {
    case "single":
      return `单 ${cardsText}`;
    case "pair":
      return `对 ${cardsText}`;
    case "triple":
      return `三 ${cardsText}`;
    case "triple_single":
      return `三带一 ${cardsText}`;
    case "triple_pair":
      return `三带二 ${cardsText}`;
    case "straight":
      return `顺子(${play.length}) ${cardsText}`;
    case "straight_pairs":
      return `连对(${play.length}) ${cardsText}`;
    case "airplane":
      return `飞机(${play.length}) ${cardsText}`;
    case "airplane_single":
      return `飞机带双单(${play.length}) ${cardsText}`;
    case "airplane_pair":
      return `飞机带双对(${play.length}) ${cardsText}`;
    case "four_two":
      return `四带二 ${cardsText}`;
    case "four_two_pairs":
      return `四带两对 ${cardsText}`;
    case "bomb":
      return `炸弹 ${cardsText}`;
    case "rocket":
      return `王炸 ${cardsText}`;
    default:
      return cardsText;
  }
}

export function formatMove(move: Move): string {
  if (move.kind === "PASS") return "过";
  return formatPlay(move.play);
}
