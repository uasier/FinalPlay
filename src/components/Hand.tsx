import { Card, Owner } from "../solver/cards";

function ownerTheme(owner: Owner): { title: string; ring: string; chip: string } {
  if (owner === "A") {
    return {
      title: "玩家 A（先手）",
      ring: "ring-sky-400/30",
      chip: "border-sky-400/30 bg-sky-500/15 text-sky-100"
    };
  }
  return {
    title: "玩家 B",
    ring: "ring-fuchsia-400/30",
    chip: "border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-100"
  };
}

export function Hand({
  owner,
  cards,
  onRemove
}: {
  owner: Owner;
  cards: Card[];
  onRemove: (cardId: string) => void;
}) {
  const theme = ownerTheme(owner);
  const sorted = [...cards].sort((a, b) => a.value - b.value || a.id.localeCompare(b.id));

  return (
    <div className={`rounded-xl border border-white/10 bg-black/20 p-3 ring-1 ${theme.ring}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-display text-sm tracking-wide">{theme.title}</div>
          <div className="mt-0.5 text-xs text-slate-400">{cards.length} 张</div>
        </div>
        {cards.length > 0 ? (
          <button
            type="button"
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs transition hover:bg-white/10"
            onClick={() => {
              for (const c of cards) onRemove(c.id);
            }}
          >
            清空该手牌
          </button>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {sorted.length === 0 ? (
          <div className="text-xs text-slate-400">还没有选择手牌。</div>
        ) : (
          sorted.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => onRemove(card.id)}
              className={[
                "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition",
                "hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-base-cta/60",
                theme.chip
              ].join(" ")}
              title="点击移除"
            >
              <span className="font-semibold">{card.rankLabel}</span>
              <span className="opacity-80">{card.suitLabel}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

