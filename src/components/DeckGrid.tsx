import { Card, DECK, Owner } from "../solver/cards";

type Tool = Owner | "erase";

function suitColor(card: Card): string {
  if (card.suit === "JOKER") return "text-amber-200";
  if (card.suit === "♥" || card.suit === "♦") return "text-rose-300";
  return "text-slate-200";
}

function ownerBadge(owner: Owner | null): string {
  if (!owner) return "bg-white/5 text-slate-300 border-white/10";
  if (owner === "A") return "bg-sky-500/20 text-sky-200 border-sky-400/30";
  return "bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/30";
}

export function DeckGrid({
  tool,
  ownerById,
  onAssign
}: {
  tool: Tool;
  ownerById: Record<string, Owner | null>;
  onAssign: (cardId: string) => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-sm text-slate-300">
          全牌库（点击指派 / 擦除） · 当前工具：
          <span className="ml-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs">
            {tool === "erase" ? "橡皮擦" : `指派给 ${tool}`}
          </span>
        </div>
        <div className="text-xs text-slate-400">提示：出牌大小只看点数顺序（3~大王）。</div>
      </div>

      <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
        {DECK.map((card) => {
          const owner = ownerById[card.id] ?? null;
          const disabled = owner !== null && tool !== "erase" && owner !== tool;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onAssign(card.id)}
              className={[
                "group relative flex items-center justify-between gap-2 rounded-lg border px-2 py-2 text-left text-xs transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-base-cta/60",
                disabled ? "opacity-70" : "hover:bg-white/10",
                owner ? "bg-white/10" : "bg-white/5",
                "border-white/10"
              ].join(" ")}
              title={card.longLabel}
              aria-label={`${card.longLabel}${owner ? `，当前属于${owner}` : ""}`}
            >
              <span className={`font-semibold ${suitColor(card)}`}>
                {card.rankLabel}
                <span className="ml-1 opacity-80">{card.suitLabel}</span>
              </span>
              <span className={`rounded-md border px-1.5 py-0.5 ${ownerBadge(owner)}`}>
                {owner ?? "—"}
              </span>
              <span className="pointer-events-none absolute inset-0 rounded-lg opacity-0 ring-1 ring-base-cta/30 transition group-hover:opacity-100" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

