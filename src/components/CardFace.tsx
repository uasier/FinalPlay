import { Card, Owner } from "../solver/cards";
import { PLAYER_THEME } from "./players";

function suitClass(card: Card): string {
  if (card.suit === "JOKER") return card.id === "BJ" ? "text-red-600" : "text-slate-700";
  if (card.suit === "♥" || card.suit === "♦") return "text-red-600";
  return "text-slate-800";
}

const SIZES = {
  sm: {
    box: "h-11 w-8 rounded-md sm:h-12 sm:w-9",
    rank: "text-[13px] sm:text-sm",
    suit: "text-[10px] leading-none sm:text-[11px]",
    joker: "text-[10px] sm:text-[11px]",
  },
  md: {
    box: "h-14 w-10 rounded-lg",
    rank: "text-base",
    suit: "text-xs leading-none",
    joker: "text-xs",
  },
} as const;

/**
 * 扑克牌牌面：白底、圆角、点数 + 花色。
 * 王牌以竖排「小王 / 大王」呈现（大王红、小王黑）。
 */
export function CardFace({
  card,
  size = "md",
  owner = null,
  interactive = false,
}: {
  card: Card;
  size?: keyof typeof SIZES;
  owner?: Owner | null;
  interactive?: boolean;
}) {
  const s = SIZES[size];
  const color = suitClass(card);
  const ownerCls = owner ? PLAYER_THEME[owner].cardRing : "border-slate-300";

  return (
    <span
      className={[
        "relative inline-flex select-none flex-col items-center justify-center border bg-white",
        s.box,
        ownerCls,
        interactive ? "transition-shadow duration-150 group-hover:shadow-md" : "shadow-[0_1px_2px_rgba(15,23,42,0.08)]",
      ].join(" ")}
    >
      {card.suit === "JOKER" ? (
        <span className={`flex flex-col items-center font-bold ${s.joker} ${color}`}>
          <span>{card.id === "BJ" ? "大" : "小"}</span>
          <span>王</span>
        </span>
      ) : (
        <>
          <span className={`font-bold tabular-nums ${s.rank} ${color}`}>{card.rankLabel}</span>
          <span className={`${s.suit} ${color}`}>{card.suitLabel}</span>
        </>
      )}
      {owner && (
        <span
          className={[
            "absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold shadow-sm",
            PLAYER_THEME[owner].badge,
          ].join(" ")}
        >
          {owner}
        </span>
      )}
    </span>
  );
}
