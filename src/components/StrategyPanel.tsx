import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { formatMove } from "../solver/format";
import { SolveResult, StrategyNode } from "../solver/solve";
import { otherPlayer } from "../solver/ranks";
import { Move, PlayType, Player } from "../solver/types";

function turnChip(turn: StrategyNode["turn"]): string {
  return turn === "A"
    ? "border-sky-400/30 bg-sky-500/15 text-sky-100"
    : "border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-100";
}

const PLAY_TYPE_LABEL: Record<PlayType, string> = {
  single: "单",
  pair: "对",
  triple: "三",
  triple_single: "三带一",
  triple_pair: "三带二",
  straight: "顺子",
  straight_pairs: "连对",
  airplane: "飞机",
  airplane_single: "飞机带单",
  airplane_pair: "飞机带对",
  four_two: "四带二",
  four_two_pairs: "四带两对",
  bomb: "炸弹",
  rocket: "王炸"
};

type TreeMeta = { nodes: number; maxDepth: number; truncated: boolean };

function estimateTreeMeta(root: StrategyNode, limitNodes = 2500): TreeMeta {
  let nodes = 0;
  let maxDepth = 0;
  const stack: Array<{ node: StrategyNode; depth: number }> = [{ node: root, depth: 0 }];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    nodes += 1;
    maxDepth = Math.max(maxDepth, cur.depth);
    if (nodes >= limitNodes) return { nodes, maxDepth, truncated: true };
    for (let i = cur.node.children.length - 1; i >= 0; i -= 1) {
      stack.push({ node: cur.node.children[i].next, depth: cur.depth + 1 });
    }
  }
  return { nodes, maxDepth, truncated: false };
}

function NodeView({ node, depth = 0 }: { node: StrategyNode; depth?: number }) {
  const shift = Math.min(depth, 24) * 16;
  const constraintLabel = node.constraint
    ? `需跟牌：${formatMove({ kind: "PLAY", play: node.constraint })}`
    : "自由出牌";
  const detailsRef = useRef<HTMLDetailsElement | null>(null);

  useLayoutEffect(() => {
    if (!detailsRef.current) return;
    detailsRef.current.open = depth <= 1;
  }, [depth]);
  return (
    <div className="w-max" style={{ paddingLeft: shift }}>
      <details
        ref={detailsRef}
        className="group min-w-[340px] rounded-xl border border-white/10 bg-black/20 shadow-sm backdrop-blur sm:min-w-[560px]"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-slate-200 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-base-cta/60">
          <div className="flex min-w-0 items-center gap-2">
            <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${turnChip(node.turn)}`}>
              {node.turn}
            </span>
            <span className="text-slate-300">回合</span>
            <span className="text-slate-600">·</span>
            <span className="min-w-0 font-mono text-xs text-slate-200">{constraintLabel}</span>
          </div>

          <div className="flex shrink-0 items-center gap-2 text-xs text-slate-400">
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5">
              分支 {node.children.length}
            </span>
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 group-open:bg-white/10">
              <span className="inline-block transition group-open:rotate-90">▸</span>
            </span>
          </div>
        </summary>
        <div className="border-t border-white/10 px-3 pb-3 pt-3">
          {node.children.length === 0 ? (
            <div className="text-xs text-slate-400">终局</div>
          ) : (
            <div className="mt-2 space-y-2">
              {node.children.map((child, idx) => (
                <div key={`${child.move.kind}-${idx}`} className="rounded-lg border border-white/10 bg-white/5 p-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                    <span
                      className={`rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${turnChip(node.turn)}`}
                    >
                      {node.turn}
                    </span>
                    <span className="text-slate-400">出牌</span>
                    <span className="font-mono text-slate-200">{formatMove(child.move)}</span>
                  </div>
                  <div className="mt-2">
                    <NodeView node={child.next} depth={depth + 1} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </details>
    </div>
  );
}

function StrategyExplorer({
  root,
  exporting,
  onExport
}: {
  root: StrategyNode;
  exporting: boolean;
  onExport: (el: HTMLElement) => void;
}) {
  type Crumb = { id: string; node: StrategyNode; actor: Player | null; viaMove: Move | null };
  const [path, setPath] = useState<Crumb[]>([{ id: "root", node: root, actor: null, viaMove: null }]);
  const [filter, setFilter] = useState<"ALL" | "PASS" | PlayType>("ALL");
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(1);
  const exportRef = useRef<HTMLDivElement | null>(null);

  const current = path[path.length - 1];
  const node = current.node;
  const children = node.children;

  useEffect(() => {
    setPath([{ id: "root", node: root, actor: null, viaMove: null }]);
  }, [root]);

  useEffect(() => {
    setFilter("ALL");
    setPage(1);
  }, [current.id]);

  useEffect(() => {
    setPage(1);
  }, [filter, pageSize]);

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const child of children) {
      const k = child.move.kind === "PASS" ? "PASS" : child.move.play.type;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return counts;
  }, [children]);

  const filteredIdx = useMemo(() => {
    const idx: number[] = [];
    for (let i = 0; i < children.length; i += 1) {
      const child = children[i];
      const k = child.move.kind === "PASS" ? "PASS" : child.move.play.type;
      if (filter !== "ALL" && k !== filter) continue;
      idx.push(i);
    }
    return idx;
  }, [children, filter]);

  const total = filteredIdx.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const start = (page - 1) * pageSize;
  const end = Math.min(total, start + pageSize);
  const pageIdx = filteredIdx.slice(start, end);

  function pushChild(i: number) {
    const child = children[i];
    setPath((prev) => [
      ...prev,
      { id: `${current.id}.${i}`, node: child.next, actor: node.turn, viaMove: child.move }
    ]);
  }

  function crumbLabel(crumb: Crumb): string {
    if (!crumb.viaMove || !crumb.actor) return "起始";
    return `${crumb.actor}: ${formatMove(crumb.viaMove)}`;
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div ref={exportRef} className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="font-display text-sm tracking-wide">策略浏览（大数据友好）</div>
            <div className="mt-0.5 text-xs text-slate-400">
              只渲染当前层与当前页，避免一次性渲染整棵树导致卡顿。
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => {
                setPath([{ id: "root", node: root, actor: null, viaMove: null }]);
              }}
              disabled={exporting || path.length <= 1}
            >
              回到起始
            </button>
            <button
              type="button"
              className="rounded-lg border border-base-cta/40 bg-base-cta px-3 py-2 text-xs font-semibold text-black shadow-neon transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => exportRef.current && onExport(exportRef.current)}
              disabled={exporting}
            >
              {exporting ? "导出中…" : "导出当前视图 PNG"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-auto pb-1">
          {path.map((crumb, idx) => (
            <button
              key={crumb.id}
              type="button"
              className={[
                "shrink-0 rounded-lg border px-2 py-1 text-xs transition",
                idx === path.length - 1
                  ? "border-base-cta/40 bg-base-cta/15 text-slate-100 shadow-neon"
                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              ].join(" ")}
              onClick={() => setPath((prev) => prev.slice(0, idx + 1))}
              title={crumbLabel(crumb)}
            >
              {idx === 0 ? "起始" : `${idx}. ${crumbLabel(crumb)}`}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${turnChip(node.turn)}`}>
              当前轮到 {node.turn}
            </span>
            <span className="text-slate-500">·</span>
            <span className="font-mono text-slate-200">
              {node.constraint ? `需跟牌：${formatMove({ kind: "PLAY", play: node.constraint })}` : "自由出牌"}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">分支 {children.length}</span>
          </div>
        </div>

        {node.turn === "A" ? (
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            {children.length === 0 ? (
              <div className="text-xs text-slate-400">终局。</div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-slate-300">
                  A 策略推荐：
                  <span className="ml-2 rounded-md border border-white/10 bg-black/20 px-2 py-1 font-mono text-slate-200">
                    {formatMove(children[0].move)}
                  </span>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-base-cta/40 bg-base-cta px-3 py-2 text-xs font-semibold text-black shadow-neon transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={exporting}
                  onClick={() => pushChild(0)}
                >
                  进入下一回合
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className={`rounded-lg border px-2 py-1 text-xs transition ${
                    filter === "ALL"
                      ? "border-base-cta/40 bg-base-cta/15 text-slate-100 shadow-neon"
                      : "border-white/10 bg-black/20 text-slate-200 hover:bg-white/10"
                  }`}
                  onClick={() => setFilter("ALL")}
                  disabled={exporting}
                >
                  全部 ({children.length})
                </button>
                {(["PASS", ...Object.keys(PLAY_TYPE_LABEL)] as Array<"PASS" | PlayType>).map((k) => {
                  const c = typeCounts.get(k) ?? 0;
                  if (c === 0) return null;
                  const label = k === "PASS" ? "过" : PLAY_TYPE_LABEL[k];
                  return (
                    <button
                      key={k}
                      type="button"
                      className={`rounded-lg border px-2 py-1 text-xs transition ${
                        filter === k
                          ? "border-base-cta/40 bg-base-cta/15 text-slate-100 shadow-neon"
                          : "border-white/10 bg-black/20 text-slate-200 hover:bg-white/10"
                      }`}
                      onClick={() => setFilter(k)}
                      disabled={exporting}
                    >
                      {label} ({c})
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="rounded-md border border-white/10 bg-black/20 px-2 py-1">
                  {total === 0 ? "0" : `${start + 1}-${end}`} / {total}
                </span>
                <select
                  className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-xs text-slate-200"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  disabled={exporting}
                  aria-label="每页条数"
                >
                  {[25, 50, 100, 200].map((n) => (
                    <option key={n} value={n}>
                      {n}/页
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-xs text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={exporting || page <= 1}
                >
                  上一页
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-xs text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={exporting || page >= pageCount}
                >
                  下一页
                </button>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {pageIdx.length === 0 ? (
                <div className="text-xs text-slate-400">没有匹配的分支。</div>
              ) : (
                pageIdx.map((i) => {
                  const child = children[i];
                  const nextPreview = child.next.children[0]?.move ?? null;
                  return (
                    <div
                      key={`${current.id}.${i}`}
                      className="flex flex-col gap-2 rounded-lg border border-white/10 bg-black/20 p-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 text-xs text-slate-300">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md border border-fuchsia-400/30 bg-fuchsia-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-fuchsia-100">
                            B 应对
                          </span>
                          <span className="font-mono text-slate-200">{formatMove(child.move)}</span>
                        </div>
                        {nextPreview ? (
                          <div className="mt-1 text-[11px] text-slate-400">
                            A 策略回应：<span className="font-mono text-slate-200">{formatMove(nextPreview)}</span>
                          </div>
                        ) : (
                          <div className="mt-1 text-[11px] text-slate-500">后续：终局</div>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-base-cta/40 bg-base-cta px-3 py-2 text-xs font-semibold text-black shadow-neon transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => pushChild(i)}
                          disabled={exporting}
                        >
                          查看后续
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stepper({ root }: { root: StrategyNode }) {
  type Step = { node: StrategyNode; viaMove: Move | null; chosenIndex: number | null };
  const [path, setPath] = useState<Step[]>([{ node: root, viaMove: null, chosenIndex: null }]);
  const current = path[path.length - 1];
  const node = current.node;
  const canAdvance = node.children.length > 0 && (node.turn === "A" || current.chosenIndex !== null);

  const nextIndex = node.turn === "A" ? 0 : current.chosenIndex ?? 0;

  const next = node.children[nextIndex]?.next ?? null;

  useEffect(() => {
    setPath([{ node: root, viaMove: null, chosenIndex: null }]);
  }, [root]);

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-display text-sm tracking-wide">逐步演示</div>
          <div className="mt-0.5 text-xs text-slate-400">
            A 回合自动选择策略动作；B 回合可任选一个应对，验证 A 仍可必胜。
          </div>
        </div>
        <button
          type="button"
          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs transition hover:bg-white/10"
          onClick={() => setPath([{ node: root, viaMove: null, chosenIndex: null }])}
        >
          重置
        </button>
      </div>

      <ol className="mt-3 space-y-2">
        {path.map((p, idx) => {
          const isLast = idx === path.length - 1;
          const actor = p.viaMove ? otherPlayer(p.node.turn) : null;
          return (
            <li key={idx} className="rounded-lg border border-white/10 bg-white/5 p-2">
              <div className="text-xs text-slate-300">
                <span className="font-semibold text-slate-100">Step {idx + 1}</span> · 当前：
                <span className="ml-1 font-semibold text-base-cta">{p.node.turn}</span> 回合
                <span className="ml-2 text-slate-400">
                  {p.node.constraint ? `需跟牌：${formatMove({ kind: "PLAY", play: p.node.constraint })}` : "自由出牌"}
                </span>
              </div>

              {p.viaMove ? (
                <div className="mt-1 text-xs text-slate-300">
                  上一步：<span className="font-semibold text-base-cta">{actor}</span>{" "}
                  <span className="font-mono">{formatMove(p.viaMove)}</span>
                </div>
              ) : null}

              {isLast ? (
                <div className="mt-2">
                  {p.node.children.length === 0 ? (
                    <div className="text-xs text-slate-400">终局。</div>
                  ) : p.node.turn === "A" ? (
                    <div className="text-xs text-slate-200">
                      A 策略：<span className="font-mono">{formatMove(p.node.children[0].move)}</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-xs text-slate-200">请选择 B 的应对：</div>
                      <div className="flex flex-wrap gap-2">
                        {p.node.children.map((child, cIdx) => (
                          <button
                            key={cIdx}
                            type="button"
                            className={[
                              "rounded-lg border px-2 py-1 text-xs font-mono transition",
                              current.chosenIndex === cIdx
                                ? "border-base-cta/60 bg-base-cta/20 text-base-text shadow-neon"
                                : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                            ].join(" ")}
                            onClick={() => {
                              setPath((prev) => {
                                const copy = [...prev];
                                copy[copy.length - 1] = { ...copy[copy.length - 1], chosenIndex: cIdx };
                                return copy;
                              });
                            }}
                          >
                            {formatMove(child.move)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => setPath((prev) => prev.slice(0, -1))}
          disabled={path.length <= 1}
        >
          上一步
        </button>

        <button
          type="button"
          className="rounded-lg border border-base-cta/40 bg-base-cta px-3 py-2 text-xs font-semibold text-black shadow-neon transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canAdvance || !next}
          onClick={() => {
            if (!next) return;
            setPath((prev) => [
              ...prev,
              { node: next, viaMove: node.children[nextIndex].move, chosenIndex: null }
            ]);
          }}
        >
          下一步
        </button>
      </div>
    </div>
  );
}

export function StrategyPanel({ solving, result }: { solving: boolean; result: SolveResult | null }) {
  const [tab, setTab] = useState<"summary" | "step" | "tree">("summary");
  const [treeMode, setTreeMode] = useState<"explorer" | "tree">("explorer");
  const [allowHeavyTree, setAllowHeavyTree] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const treeContentRef = useRef<HTMLDivElement | null>(null);

  const root = useMemo(() => (result?.ok ? result.strategy : null), [result]);
  const treeMeta = useMemo(() => (root ? estimateTreeMeta(root, 2500) : null), [root]);

  useEffect(() => {
    setAllowHeavyTree(false);
  }, [root]);

  function setAllDetailsOpen(open: boolean) {
    const host = treeContentRef.current;
    if (!host) return;
    host.querySelectorAll("details").forEach((el) => {
      (el as HTMLDetailsElement).open = open;
    });
  }

  async function exportTreePng() {
    const node = treeContentRef.current;
    if (!node || exporting) return;

    setExporting(true);
    setExportMsg(null);

    let details: HTMLDetailsElement[] = [];
    let prevOpen: boolean[] = [];

    try {
      details = Array.from(node.querySelectorAll("details")) as HTMLDetailsElement[];
      prevOpen = details.map((d) => d.open);
      details.forEach((d) => (d.open = true));

      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      const { toPng } = await import("html-to-image");

      const pixelRatios = [2, 1];
      let dataUrl: string | null = null;
      let lastErr: unknown;
      for (const pixelRatio of pixelRatios) {
        try {
          dataUrl = await toPng(node, {
            cacheBust: true,
            pixelRatio,
            backgroundColor: "#0F172A"
          });
          break;
        } catch (err) {
          lastErr = err;
        }
      }

      if (!dataUrl) throw lastErr;

      const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const a = document.createElement("a");
      a.download = `strategy-tree-${stamp}.png`;
      a.href = dataUrl;
      a.click();
      setExportMsg("已导出 PNG（导出时已临时展开全部节点）。");
    } catch (err) {
      console.error(err);
      setExportMsg("导出失败：策略树过大或浏览器限制。可先折叠部分分支后再试。");
    } finally {
      details.forEach((d, i) => {
        const open = prevOpen[i];
        if (typeof open === "boolean") d.open = open;
      });
      setExporting(false);
    }
  }

  async function exportExplorerPng(el: HTMLElement) {
    if (exporting) return;
    setExporting(true);
    setExportMsg(null);
    try {
      const { toPng } = await import("html-to-image");
      const pixelRatios = [2, 1];
      let dataUrl: string | null = null;
      let lastErr: unknown;
      for (const pixelRatio of pixelRatios) {
        try {
          dataUrl = await toPng(el, {
            cacheBust: true,
            pixelRatio,
            backgroundColor: "#0F172A"
          });
          break;
        } catch (err) {
          lastErr = err;
        }
      }
      if (!dataUrl) throw lastErr;
      const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const a = document.createElement("a");
      a.download = `strategy-view-${stamp}.png`;
      a.href = dataUrl;
      a.click();
      setExportMsg("已导出 PNG。");
    } catch (err) {
      console.error(err);
      setExportMsg("导出失败：内容过大或浏览器限制。可减少每页条数后再试。");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg tracking-wide">解法输出</h2>
          <p className="mt-1 text-sm text-slate-300">按钮：展示完整策略树 / 或逐步演示。</p>
        </div>
        <div className="flex rounded-xl border border-white/10 bg-black/20 p-1">
          {(
            [
              ["summary", "概览"],
              ["step", "逐步"],
              ["tree", "策略树"]
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`rounded-lg px-3 py-2 text-xs transition ${
                tab === key ? "bg-white/10 shadow-neon" : "hover:bg-white/5"
              }`}
              onClick={() => setTab(key)}
              disabled={key !== "summary" && !root}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {solving ? (
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-sm text-slate-200">正在穷举搜索中…</div>
            <div className="mt-1 text-xs text-slate-400">
              若手牌较多可能需要一些时间。建议从「残局」规模（每人 3~12 张）开始。
            </div>
          </div>
        ) : result ? (
          tab === "summary" ? (
            <div className="space-y-3">
              <div
                className={[
                  "rounded-xl border p-3",
                  result.ok ? "border-base-cta/40 bg-base-cta/10" : "border-rose-400/30 bg-rose-500/10"
                ].join(" ")}
              >
                <div className="text-sm font-semibold">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={[
                        "h-2 w-2 rounded-full",
                        result.ok ? "bg-base-cta shadow-neon" : "bg-rose-400"
                      ].join(" ")}
                      aria-hidden
                    />
                    {result.ok ? "找到 A 的必胜策略" : "未找到 A 的必胜策略"}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-300">
                  访问状态：{result.stats.statesVisited} · 记忆化命中：{result.stats.memoHits} · 生成出牌集合：{result.stats.playCacheSize}
                </div>
              </div>

              {result.ok ? (
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-xs text-slate-300">提示</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-400">
                    <li>A 回合只展示「策略推荐」的一手牌。</li>
                    <li>B 回合会列出所有合法应对（包含“过”），每条分支都通向 A 的胜局。</li>
                    <li>牌型覆盖：单/对/三/三带一/三带二/顺子/连对/飞机(含带翅膀)/四带二/四带两对/炸弹/王炸。</li>
                  </ul>
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-slate-400">
                  可以尝试减少手牌规模，或调整为更偏向 A 优势的牌面后再求解。
                </div>
              )}
            </div>
          ) : tab === "step" ? (
            root ? (
              <Stepper root={root} />
            ) : (
              <div className="text-xs text-slate-400">暂无策略可演示。</div>
            )
          ) : root ? (
            <div className="space-y-3">
              <div className="text-xs text-slate-400">
                策略树可能较大；建议结合「逐步」查看关键分支。
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="rounded-md border border-white/10 bg-black/20 px-2 py-1">
                    {treeMeta
                      ? `节点估算：${treeMeta.truncated ? `≥${treeMeta.nodes}` : treeMeta.nodes} · 最大深度：${treeMeta.maxDepth}`
                      : "节点估算：—"}
                  </span>
                  {exportMsg ? <span className="text-slate-300">{exportMsg}</span> : null}
                </div>
                <div className="flex rounded-xl border border-white/10 bg-black/20 p-1">
                  {(
                    [
                      ["explorer", "浏览（推荐）"],
                      ["tree", "树形（重）"]
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      className={`rounded-lg px-3 py-2 text-xs transition ${
                        treeMode === key ? "bg-white/10 shadow-neon" : "hover:bg-white/5"
                      }`}
                      onClick={() => setTreeMode(key)}
                      disabled={exporting}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {treeMode === "explorer" ? (
                <StrategyExplorer root={root} exporting={exporting} onExport={exportExplorerPng} />
              ) : treeMeta && (treeMeta.truncated || treeMeta.nodes >= 1200) && !allowHeavyTree ? (
                <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-amber-100">
                  <div className="font-semibold">树形视图在大数据下可能非常卡顿</div>
                  <div className="mt-1 text-amber-200/80">
                    当前估算节点数较多，建议使用「浏览」模式；如果仍要查看树形，请点击继续。
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-50 transition hover:bg-amber-300/15"
                      onClick={() => setAllowHeavyTree(true)}
                      disabled={exporting}
                    >
                      仍然渲染树形
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-slate-400">
                      树形模式会渲染更多节点；深层分支会自动启用横向滚动。导出会临时展开全部节点。
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => setAllDetailsOpen(true)}
                        disabled={exporting}
                      >
                        全部展开
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => setAllDetailsOpen(false)}
                        disabled={exporting}
                      >
                        全部折叠
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-base-cta/40 bg-base-cta px-3 py-2 text-xs font-semibold text-black shadow-neon transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={exportTreePng}
                        disabled={exporting}
                      >
                        {exporting ? "导出中…" : "导出 PNG"}
                      </button>
                    </div>
                  </div>

                  <div
                    className={`mt-3 max-h-[65vh] overflow-auto pr-2 ${
                      exporting ? "pointer-events-none opacity-80" : ""
                    }`}
                  >
                    <div ref={treeContentRef} className="w-max min-w-full space-y-3">
                      <NodeView node={root} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-400">暂无策略树。</div>
          )
        ) : (
          <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-300">
            还没有求解结果。请先设置双方手牌，然后点击「求解」。
          </div>
        )}
      </div>
    </div>
  );
}
