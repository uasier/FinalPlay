import { useEffect, useState } from "react";
import { SolverState } from "../../hooks/useSolver";
import { Panel } from "../../ui/Panel";
import { Button } from "../../ui/Button";
import { Segmented } from "../../ui/Segmented";
import { SummaryBanner } from "./SummaryBanner";
import { Stepper } from "./Stepper";
import { Explorer } from "./Explorer";

function IdleGuide() {
  const steps = [
    "上方选择「为 A / 为 B 选牌」，点击牌库分配手牌",
    "需要时展开「规则配置」调整可用牌型",
    "点击「求解」，查看 A 的必胜策略",
  ];
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-4">
      <p className="text-sm font-medium text-slate-600">三步开始：</p>
      <ol className="mt-3 space-y-2.5">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-500">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
              {i + 1}
            </span>
            {s}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-slate-400">也可以点击右上角「载入示例」直接体验。</p>
    </div>
  );
}

function SolvingCard({ statesVisited, onCancel }: { statesVisited: number; onCancel: () => void }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex items-center gap-3">
        <span
          className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800">正在穷举搜索…</p>
          <p className="mt-0.5 text-xs tabular-nums text-slate-500">
            已访问 {statesVisited.toLocaleString()} 个状态
          </p>
        </div>
        <Button size="sm" className="ml-auto" onClick={onCancel}>
          取消
        </Button>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        求解在后台线程运行，页面不会卡顿。牌数越多耗时越长，建议每方 3～12 张。
      </p>
    </div>
  );
}

/** 右侧（或移动端下方）的求解结果区。 */
export function ResultsPanel({ state, onCancel }: { state: SolverState; onCancel: () => void }) {
  const [tab, setTab] = useState<"step" | "explore">("step");

  useEffect(() => {
    if (state.status === "done") setTab("step");
  }, [state.status]);

  return (
    <Panel title="求解结果" subtitle="A 回合自动按策略出牌；B 的每种应对都已被证明通向 A 的胜局">
      {state.status === "idle" && <IdleGuide />}
      {state.status === "solving" && <SolvingCard statesVisited={state.statesVisited} onCancel={onCancel} />}
      {state.status === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
          求解出错：{state.message}
        </div>
      )}
      {state.status === "done" && (
        <div className="space-y-3">
          <SummaryBanner result={state.result} elapsedMs={state.elapsedMs} />
          {state.result.ok && (
            <>
              <Segmented
                size="sm"
                options={[
                  { value: "step", label: "逐步演示" },
                  { value: "explore", label: "策略浏览" },
                ]}
                value={tab}
                onChange={setTab}
              />
              {tab === "step" ? <Stepper root={state.result.strategy} /> : <Explorer root={state.result.strategy} />}
            </>
          )}
        </div>
      )}
    </Panel>
  );
}
