import { useEffect, useMemo, useState } from "react";
import { formatMove } from "../../solver/format";
import { StrategyNode } from "../../solver/solve";
import { Move, Player } from "../../solver/types";
import { Button } from "../../ui/Button";
import { copyText } from "../../utils/clipboard";
import { PLAYER_THEME } from "../players";

type PathEntry = { node: StrategyNode; viaMove: Move | null };

function PlayerBadge({ player }: { player: Player }) {
  return (
    <span
      className={[
        "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
        PLAYER_THEME[player].badge,
      ].join(" ")}
    >
      {player}
    </span>
  );
}

/**
 * 逐步演示：A 按策略自动出牌，B 的每个合法应对由用户任选，
 * 无论 B 怎么选，走到终局都是 A 获胜。
 */
export function Stepper({ root }: { root: StrategyNode }) {
  const [path, setPath] = useState<PathEntry[]>([{ node: root, viaMove: null }]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPath([{ node: root, viaMove: null }]);
  }, [root]);

  const current = path[path.length - 1];
  const node = current.node;
  const finished = node.children.length === 0;

  /** 已走过的出牌记录：第 i 步由 path[i-1].node.turn 打出 path[i].viaMove */
  const history = useMemo(
    () =>
      path.slice(1).map((entry, i) => ({
        actor: path[i].node.turn,
        move: entry.viaMove!,
      })),
    [path],
  );

  function advance(childIndex: number) {
    const child = node.children[childIndex];
    if (!child) return;
    setPath((prev) => [...prev, { node: child.next, viaMove: child.move }]);
  }

  async function copyHistory() {
    const lines = history.map((h, i) => `${i + 1}. ${h.actor} ${formatMove(h.move)}`);
    if (finished) lines.push("—— A 手牌出完，获胜 ——");
    const text = lines.join("\n");
    if (await copyText(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <div className="space-y-3">
      {history.length > 0 && (
        <ol className="space-y-1.5">
          {history.map((h, i) => (
            <li
              key={i}
              className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <span className="w-5 shrink-0 text-right text-xs tabular-nums text-slate-400">{i + 1}</span>
              <PlayerBadge player={h.actor} />
              <span className="min-w-0 truncate font-mono text-sm text-slate-800">{formatMove(h.move)}</span>
            </li>
          ))}
        </ol>
      )}

      <div
        className={[
          "rounded-xl border p-3.5",
          finished ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50/60",
        ].join(" ")}
      >
        {finished ? (
          <p className="text-sm font-semibold text-emerald-900">A 手牌出完，必胜达成。</p>
        ) : node.turn === "A" ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2 text-sm text-slate-700">
              <PlayerBadge player="A" />
              <span className="shrink-0">策略出牌</span>
              <span className="min-w-0 truncate rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-sm">
                {formatMove(node.children[0].move)}
              </span>
            </div>
            <Button variant="primary" size="sm" onClick={() => advance(0)}>
              出牌
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <PlayerBadge player="B" />
              <span>轮到 B，任选一种应对（{node.children.length} 种）：</span>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {node.children.map((child, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => advance(i)}
                  className={[
                    "rounded-lg border border-orange-200 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-800",
                    "transition-colors duration-150 hover:border-orange-400 hover:bg-orange-50",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60",
                  ].join(" ")}
                >
                  {formatMove(child.move)}
                </button>
              ))}
            </div>
          </div>
        )}
        {!finished && node.constraint && (
          <p className="mt-2 text-xs text-slate-400">
            需跟牌：<span className="font-mono">{formatMove({ kind: "PLAY", play: node.constraint })}</span>
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button size="sm" disabled={path.length <= 1} onClick={() => setPath((p) => p.slice(0, -1))}>
            上一步
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={path.length <= 1}
            onClick={() => setPath((p) => p.slice(0, 1))}
          >
            重置
          </Button>
        </div>
        {history.length > 0 && (
          <Button variant="ghost" size="sm" onClick={copyHistory}>
            {copied ? "已复制" : "复制打法"}
          </Button>
        )}
      </div>
    </div>
  );
}
