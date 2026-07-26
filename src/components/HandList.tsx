import { Card, Owner } from "../solver/cards";
import { CardFace } from "./CardFace";
import { PLAYER_THEME } from "./players";
import { Button } from "../ui/Button";

/** 某位玩家当前的手牌：横向排列可点击移除，空态给出引导。 */
export function HandList({
  owner,
  cards,
  onRemove,
  onClear,
}: {
  owner: Owner;
  cards: Card[];
  onRemove: (cardId: string) => void;
  onClear: () => void;
}) {
  const theme = PLAYER_THEME[owner];

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${theme.dot}`} aria-hidden />
          <span className="text-sm font-semibold text-slate-800">{theme.title}</span>
          <span className={`rounded-md border px-1.5 py-0.5 text-xs font-medium tabular-nums ${theme.chip}`}>
            {cards.length} 张
          </span>
        </div>
        {cards.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            清空
          </Button>
        )}
      </div>

      <div className="mt-2.5 min-h-[3rem]">
        {cards.length === 0 ? (
          <div className="flex h-12 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">
            在下方牌库点击牌面添加
          </div>
        ) : (
          <div className="flex flex-wrap gap-y-1.5 pl-2">
            {cards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => onRemove(card.id)}
                className="group -ml-2 rounded-md transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
                title={`点击移除 ${card.longLabel}`}
                aria-label={`移除 ${card.longLabel}`}
              >
                <CardFace card={card} size="sm" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
