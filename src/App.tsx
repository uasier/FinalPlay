import { useEffect, useMemo, useRef, useState } from "react";
import { cardsToCounts, DECK } from "./solver/cards";
import { PRESETS } from "./solver/presets";
import { decodeShareHash, encodeShareHash } from "./solver/share";
import { RuleConfig } from "./solver/rule-config";
import { Counts } from "./solver/types";
import { useHands } from "./hooks/useHands";
import { useRuleConfig } from "./hooks/useRuleConfig";
import { useSolver } from "./hooks/useSolver";
import { Button } from "./ui/Button";
import { Panel } from "./ui/Panel";
import { Segmented } from "./ui/Segmented";
import { HandList } from "./components/HandList";
import { DeckGrid } from "./components/DeckGrid";
import { RuleConfigPanel } from "./components/RuleConfigPanel";
import { SolveControls } from "./components/SolveControls";
import { ResultsPanel } from "./components/results/ResultsPanel";
import { PLAYER_THEME } from "./components/players";
import { Owner } from "./solver/cards";

export default function App() {
  const hands = useHands();
  const { ruleConfig, setRuleConfig } = useRuleConfig();
  const solver = useSolver();
  const [presetIndex, setPresetIndex] = useState(0);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  /** 分享链接解析出的待求解局面：先让牌面与规则状态落地，再自动触发求解 */
  const [pendingSolve, setPendingSolve] = useState<{
    a: Counts;
    b: Counts;
    rules: RuleConfig;
  } | null>(null);

  const solving = solver.state.status === "solving";
  const { reset, solve } = solver;
  const { loadPreset } = hands;

  // 首次加载解析分享链接：载入牌面与规则，并登记自动求解
  useEffect(() => {
    const payload = decodeShareHash(window.location.hash);
    if (!payload) return;
    loadPreset({ name: "分享局面", description: "来自分享链接", a: payload.a, b: payload.b });
    setRuleConfig(payload.rules);
    const byId = new Map(DECK.map((c) => [c.id, c]));
    setPendingSolve({
      a: cardsToCounts(payload.a.map((id) => byId.get(id)!)),
      b: cardsToCounts(payload.b.map((id) => byId.get(id)!)),
      rules: payload.rules,
    });
  }, [loadPreset, setRuleConfig]);

  // 手牌或规则变化后，旧结果不再对应当前局面
  useEffect(() => {
    reset();
  }, [hands.ownerById, ruleConfig, reset]);

  // 分享局面自动求解：声明在重置副作用之后，确保同一轮渲染中先重置再求解
  useEffect(() => {
    if (!pendingSolve) return;
    setPendingSolve(null);
    solve(pendingSolve.a, pendingSolve.b, pendingSolve.rules);
  }, [pendingSolve, solve]);

  // 当前牌面与规则对应的分享链接（双方均有手牌时可用）
  const shareUrl = useMemo(() => {
    if (hands.cardsA.length === 0 || hands.cardsB.length === 0) return null;
    const hash = encodeShareHash(
      hands.cardsA.map((c) => c.id),
      hands.cardsB.map((c) => c.id),
      ruleConfig,
    );
    return `${window.location.origin}${window.location.pathname}#${hash}`;
  }, [hands.cardsA, hands.cardsB, ruleConfig]);

  // 移动端求解完成后滚动到结果区
  useEffect(() => {
    if (solver.state.status !== "done") return;
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultsRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }, [solver.state.status]);

  function onSolve() {
    solver.solve(cardsToCounts(hands.cardsA), cardsToCounts(hands.cardsB), ruleConfig);
  }

  function onLoadPreset() {
    hands.loadPreset(PRESETS[presetIndex % PRESETS.length]);
    setPresetIndex((i) => i + 1);
  }

  return (
    <div className="min-h-dvh">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-lg text-white shadow-sm"
              aria-hidden
            >
              ♠
            </span>
            <div className="min-w-0">
              <h1 className="text-lg font-bold leading-tight text-slate-900">斗地主残局破解</h1>
              <p className="truncate text-xs text-slate-500">
                两人残局 · 穷举证明 A 先手必胜策略
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              disabled={solving}
              onClick={onLoadPreset}
              title={`下一个示例：${PRESETS[presetIndex % PRESETS.length].name}`}
            >
              载入示例
            </Button>
            <Button variant="ghost" size="sm" disabled={solving} onClick={hands.clearAll}>
              清空全部
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:pb-10">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {/* 左：设置手牌 */}
          <Panel
            title="设置手牌"
            subtitle="花色仅用于区分卡牌，大小只看点数（3 < … < 2 < 小王 < 大王）"
          >
            <div className={solving ? "pointer-events-none opacity-60" : ""}>
              <div className="grid gap-3 sm:grid-cols-2">
                <HandList
                  owner="A"
                  cards={hands.cardsA}
                  onRemove={hands.removeCard}
                  onClear={() => hands.clearOwner("A")}
                />
                <HandList
                  owner="B"
                  cards={hands.cardsB}
                  onRemove={hands.removeCard}
                  onClear={() => hands.clearOwner("B")}
                />
              </div>

              {/* 选牌工具条：滚动牌库时保持可见 */}
              <div className="sticky top-0 z-10 -mx-1 mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-white/95 px-1 py-2 backdrop-blur">
                <Segmented<Owner>
                  options={[
                    { value: "A", label: "为 A 选牌" },
                    { value: "B", label: "为 B 选牌" },
                  ]}
                  value={hands.active}
                  onChange={hands.setActive}
                  activeClassName={(v) => PLAYER_THEME[v].segActive}
                />
                <span className="text-xs text-slate-400">
                  点击牌面分配给 {hands.active}，再点一次移除
                </span>
              </div>

              <div className="mt-2">
                <DeckGrid ownerById={hands.ownerById} onTap={hands.tapCard} />
              </div>

              <div className="mt-4">
                <RuleConfigPanel config={ruleConfig} onChange={setRuleConfig} disabled={solving} />
              </div>
            </div>

            {/* 桌面端求解按钮 */}
            <div className="mt-5 hidden border-t border-slate-100 pt-4 lg:block">
              <SolveControls
                countA={hands.cardsA.length}
                countB={hands.cardsB.length}
                solving={solving}
                onSolve={onSolve}
                onCancel={solver.cancel}
              />
            </div>
          </Panel>

          {/* 右：求解结果 */}
          <div ref={resultsRef} className="scroll-mt-4 lg:sticky lg:top-5">
            <ResultsPanel
              state={solver.state}
              onCancel={solver.cancel}
              ruleConfig={ruleConfig}
              shareUrl={shareUrl}
            />
          </div>
        </div>
      </main>

      {/* 移动端吸底求解栏 */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur lg:hidden">
        <div className="mx-auto max-w-6xl">
          <SolveControls
            countA={hands.cardsA.length}
            countB={hands.cardsB.length}
            solving={solving}
            onSolve={onSolve}
            onCancel={solver.cancel}
          />
        </div>
      </div>
    </div>
  );
}
