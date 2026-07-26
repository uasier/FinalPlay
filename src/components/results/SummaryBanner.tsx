import { SolveResult } from "../../solver/solve";

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-white/70 px-2 py-0.5 text-xs text-slate-600">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </span>
  );
}

/** 求解结果横幅：必胜 / 无必胜 + 搜索统计。 */
export function SummaryBanner({ result, elapsedMs }: { result: SolveResult; elapsedMs: number }) {
  const ok = result.ok;
  return (
    <div
      className={[
        "rounded-xl border p-3.5",
        ok ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        {ok ? (
          <svg className="h-5 w-5 shrink-0 text-emerald-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.86-9.71a.75.75 0 0 0-1.22-.88l-3.24 4.5-1.62-1.62a.75.75 0 1 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.09l3.75-5.22z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg className="h-5 w-5 shrink-0 text-amber-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625l6.28-10.875zM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"
              clipRule="evenodd"
            />
          </svg>
        )}
        <span className={`text-sm font-semibold ${ok ? "text-emerald-900" : "text-amber-900"}`}>
          {ok ? "找到 A 的必胜策略" : "未找到 A 的必胜策略"}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <StatChip label="访问状态" value={result.stats.statesVisited.toLocaleString()} />
        <StatChip label="记忆化命中" value={result.stats.memoHits.toLocaleString()} />
        <StatChip label="用时" value={`${(elapsedMs / 1000).toFixed(elapsedMs < 10000 ? 2 : 1)}s`} />
      </div>
      {!ok && (
        <p className="mt-2 text-xs text-amber-800/80">
          B 存在至少一种应对使 A 无法获胜。可以调整牌面（增强 A）或在规则配置中增减牌型后重试。
        </p>
      )}
    </div>
  );
}
