import { Button } from "../ui/Button";
import { PLAYER_THEME } from "./players";

/** 求解操作组：双方计数 + 求解 / 取消。桌面端内嵌在设置面板，移动端吸底。 */
export function SolveControls({
  countA,
  countB,
  solving,
  onSolve,
  onCancel,
}: {
  countA: number;
  countB: number;
  solving: boolean;
  onSolve: () => void;
  onCancel: () => void;
}) {
  const canSolve = countA > 0 && countB > 0 && !solving;
  const heavy = countA + countB > 26;

  return (
    <div className="flex w-full items-center gap-3">
      <div className="flex min-w-0 shrink-0 items-center gap-1.5 text-xs">
        <span className={`rounded-md border px-1.5 py-0.5 font-medium tabular-nums ${PLAYER_THEME.A.chip}`}>
          A {countA}
        </span>
        <span className={`rounded-md border px-1.5 py-0.5 font-medium tabular-nums ${PLAYER_THEME.B.chip}`}>
          B {countB}
        </span>
        {heavy && <span className="hidden text-slate-400 sm:inline">牌数较多，求解可能较久</span>}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {solving && (
          <Button size="md" onClick={onCancel}>
            取消
          </Button>
        )}
        <Button
          variant="primary"
          size="lg"
          disabled={!canSolve}
          onClick={onSolve}
          title={countA === 0 || countB === 0 ? "请先为双方设置手牌" : undefined}
        >
          {solving ? "求解中…" : "求解（A 先手）"}
        </Button>
      </div>
    </div>
  );
}
