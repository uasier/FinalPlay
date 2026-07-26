import { useEffect, useMemo, useRef, useState } from "react";
import { formatMove } from "../../solver/format";
import { StrategyNode } from "../../solver/solve";
import { Move, PlayType, Player } from "../../solver/types";
import { PLAY_TYPES, PLAY_TYPE_LABEL } from "../../solver/playtype-meta";
import { Button } from "../../ui/Button";
import { usePngExport } from "../../hooks/usePngExport";
import { PLAYER_THEME } from "../players";

const PAGE_SIZE = 60;

type Crumb = { id: string; node: StrategyNode; actor: Player | null; viaMove: Move | null };
type Filter = "ALL" | "PASS" | PlayType;

/**
 * 策略浏览：一次只渲染当前层 + 分页，大策略树也不卡顿。
 * A 层给出策略推荐；B 层可筛选牌型、逐条深入。
 */
export function Explorer({ root }: { root: StrategyNode }) {
  const [path, setPath] = useState<Crumb[]>([{ id: "root", node: root, actor: null, viaMove: null }]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [page, setPage] = useState(1);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const { exporting, message, exportPng } = usePngExport();

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

  const typeCounts = useMemo(() => {
    const counts = new Map<Filter, number>();
    for (const child of children) {
      const k: Filter = child.move.kind === "PASS" ? "PASS" : child.move.play.type;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return counts;
  }, [children]);

  const filteredIdx = useMemo(() => {
    const idx: number[] = [];
    for (let i = 0; i < children.length; i += 1) {
      const k: Filter = children[i].move.kind === "PASS" ? "PASS" : (children[i].move as Extract<Move, { kind: "PLAY" }>).play.type;
      if (filter === "ALL" || k === filter) idx.push(i);
    }
    return idx;
  }, [children, filter]);

  const pageCount = Math.max(1, Math.ceil(filteredIdx.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageIdx = filteredIdx.slice(start, start + PAGE_SIZE);

  function pushChild(i: number) {
    const child = children[i];
    setPath((prev) => [...prev, { id: `${current.id}.${i}`, node: child.next, actor: node.turn, viaMove: child.move }]);
  }

  function crumbLabel(crumb: Crumb, idx: number): string {
    if (!crumb.viaMove || !crumb.actor) return "起始";
    return `${idx}. ${crumb.actor} ${formatMove(crumb.viaMove)}`;
  }

  return (
    <div className="space-y-3">
      {/* 面包屑路径 */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {path.map((crumb, idx) => (
          <button
            key={crumb.id}
            type="button"
            onClick={() => setPath((prev) => prev.slice(0, idx + 1))}
            disabled={exporting}
            className={[
              "shrink-0 rounded-lg border px-2 py-1 font-mono text-xs transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60",
              idx === path.length - 1
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700",
            ].join(" ")}
          >
            {crumbLabel(crumb, idx)}
          </button>
        ))}
      </div>

      <div ref={exportRef} className="space-y-3 rounded-xl bg-white">
        {/* 当前局面 */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs text-slate-600">
          <span
            className={[
              "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-semibold",
              PLAYER_THEME[node.turn].chip,
            ].join(" ")}
          >
            轮到 {node.turn}
          </span>
          <span className="font-mono">
            {node.constraint ? `需跟牌：${formatMove({ kind: "PLAY", play: node.constraint })}` : "自由出牌"}
          </span>
          <span className="text-slate-400">分支 {children.length}</span>
        </div>

        {children.length === 0 ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-900">
            终局：A 手牌出完，获胜。
          </div>
        ) : node.turn === "A" ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2 text-sm text-slate-700">
              <span className="shrink-0 text-slate-500">A 策略推荐</span>
              <span className="min-w-0 truncate rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-sm text-slate-900">
                {formatMove(children[0].move)}
              </span>
            </div>
            <Button variant="primary" size="sm" disabled={exporting} onClick={() => pushChild(0)}>
              进入下一回合
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* 牌型筛选 */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(["ALL", "PASS", ...PLAY_TYPES] as Filter[]).map((k) => {
                const count = k === "ALL" ? children.length : typeCounts.get(k) ?? 0;
                if (count === 0) return null;
                const label = k === "ALL" ? "全部" : k === "PASS" ? "过" : PLAY_TYPE_LABEL[k];
                return (
                  <button
                    key={k}
                    type="button"
                    disabled={exporting}
                    onClick={() => {
                      setFilter(k);
                      setPage(1);
                    }}
                    className={[
                      "rounded-full border px-2.5 py-1 text-xs transition-colors duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60",
                      filter === k
                        ? "border-slate-700 bg-slate-800 text-white"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700",
                    ].join(" ")}
                  >
                    {label} {count}
                  </button>
                );
              })}
            </div>

            {/* B 的应对列表（分页） */}
            <ul className="space-y-1.5">
              {pageIdx.map((i) => {
                const child = children[i];
                const nextPreview = child.next.children[0]?.move ?? null;
                return (
                  <li
                    key={`${current.id}.${i}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${PLAYER_THEME.B.chip}`}>
                          B
                        </span>
                        <span className="min-w-0 truncate font-mono text-sm text-slate-800">
                          {formatMove(child.move)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate pl-[30px] text-xs text-slate-400">
                        {nextPreview ? (
                          <>
                            A 回应 <span className="font-mono text-slate-500">{formatMove(nextPreview)}</span>
                          </>
                        ) : (
                          "随后终局"
                        )}
                      </p>
                    </div>
                    <Button size="sm" disabled={exporting} onClick={() => pushChild(i)}>
                      深入
                    </Button>
                  </li>
                );
              })}
            </ul>

            {pageCount > 1 && (
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <Button size="sm" variant="ghost" disabled={exporting || safePage <= 1} onClick={() => setPage((p) => p - 1)}>
                  上一页
                </Button>
                <span className="tabular-nums">
                  {safePage} / {pageCount}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={exporting || safePage >= pageCount}
                  onClick={() => setPage((p) => p + 1)}
                >
                  下一页
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        {message && <span className="text-xs text-slate-400">{message}</span>}
        <Button
          size="sm"
          disabled={exporting}
          onClick={() => exportRef.current && exportPng(exportRef.current, "strategy-view")}
        >
          {exporting ? "导出中…" : "导出当前视图 PNG"}
        </Button>
      </div>
    </div>
  );
}
