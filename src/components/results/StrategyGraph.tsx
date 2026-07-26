import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { StrategyNode } from "../../solver/solve";
import {
  buildStrategyGraph,
  rowAnchorY,
  StrategyGraph as GraphData,
  GraphNode,
  GRAPH_FONT,
} from "../../solver/strategy-graph";
import { Button } from "../../ui/Button";

/** 超过该局面数先提示再渲染，避免超大 DAG 直接卡住页面 */
const RENDER_WARN_THRESHOLD = 1500;
/** 浏览器 canvas 单边尺寸上限（保守值），PNG 导出按此收缩倍率 */
const CANVAS_MAX = 16000;

const FONT_STACK = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

type Viewport = { k: number; tx: number; ty: number };

function edgePath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = Math.max((x2 - x1) / 2, 36);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

/** 单张局面卡片：标题 + 约束 + 双方余牌 + 每行应对（行尾标注去向） */
function NodeCard({ node, onJump }: { node: GraphNode; onJump: (id: number) => void }) {
  const isStart = node.id === 0;
  return (
    <g transform={`translate(${node.x}, ${node.y})`}>
      <rect
        width={node.w}
        height={node.h}
        rx={8}
        fill="#ffffff"
        stroke={isStart ? "#10b981" : "#cbd5e1"}
        strokeWidth={isStart ? 1.6 : 1}
      />
      <text x={10} y={20} fontSize={GRAPH_FONT + 0.5} fontWeight={700} fill="#0f172a" fontFamily={FONT_STACK}>
        {node.title}
        <tspan fontWeight={400} fill="#64748b">
          {"　"}
          {node.constraint}
        </tspan>
      </text>
      <text x={10} y={35} fontSize={GRAPH_FONT - 1} fill="#64748b" fontFamily={FONT_STACK}>
        {node.hands}
      </text>
      {node.rows.map((row, ri) => {
        const y = rowAnchorY(node, ri) - node.y + 3.5;
        const arrowAt = row.text.indexOf(" ⇒ ");
        return (
          <g key={ri}>
            <title>{row.full}</title>
            <text x={10} y={y} fontSize={GRAPH_FONT} fontFamily={FONT_STACK} fill="#1d4ed8">
              {arrowAt >= 0 ? (
                <>
                  <tspan fill="#c2410c">{row.text.slice(0, arrowAt)}</tspan>
                  <tspan fill="#94a3b8"> ⇒ </tspan>
                  {row.text.slice(arrowAt + 3)}
                </>
              ) : (
                row.text
              )}
            </text>
            {row.targetId === null ? (
              <text
                x={node.w - 10}
                y={y}
                fontSize={GRAPH_FONT}
                fontFamily={FONT_STACK}
                fontWeight={700}
                fill="#059669"
                textAnchor="end"
              >
                ✓ 胜
              </text>
            ) : (
              <text
                x={node.w - 10}
                y={y}
                fontSize={GRAPH_FONT}
                fontFamily={FONT_STACK}
                fill="#059669"
                textAnchor="end"
                style={{ cursor: "pointer" }}
                onClick={() => onJump(row.targetId!)}
              >
                → #{row.targetId}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

/**
 * 全局策略图：整棵必胜策略 DAG 的分层总览。
 * 支持拖拽平移、滚轮缩放、点击「→ #n」跳转定位、全屏查看，
 * 并可导出为 SVG（无损矢量）或 PNG 位图。
 */
export function StrategyGraph({ root }: { root: StrategyNode }) {
  const graph: GraphData = useMemo(() => buildStrategyGraph(root), [root]);

  const [confirmed, setConfirmed] = useState(graph.sceneCount <= RENDER_WARN_THRESHOLD);
  const [fullscreen, setFullscreen] = useState(false);
  const [view, setView] = useState<Viewport>({ k: 1, tx: 0, ty: 0 });
  const [message, setMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  useEffect(() => {
    setConfirmed(graph.sceneCount <= RENDER_WARN_THRESHOLD);
  }, [graph]);

  const fit = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const k = Math.min(el.clientWidth / graph.width, el.clientHeight / graph.height, 1);
    setView({
      k,
      tx: (el.clientWidth - graph.width * k) / 2,
      ty: (el.clientHeight - graph.height * k) / 2,
    });
  }, [graph]);

  // 初次渲染与切换全屏后都重新适应窗口
  useEffect(() => {
    if (confirmed) fit();
  }, [confirmed, fullscreen, fit]);

  // 滚轮缩放需要非 passive 监听才能阻止页面滚动
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !confirmed) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      setView((v) => {
        const k = Math.min(Math.max(v.k * (e.deltaY < 0 ? 1.15 : 1 / 1.15), 0.03), 3);
        return { k, tx: px - ((px - v.tx) / v.k) * k, ty: py - ((py - v.ty) / v.k) * k };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [confirmed, fullscreen]);

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    setView((v) => ({ ...v, tx: d.tx + e.clientX - d.x, ty: d.ty + e.clientY - d.y }));
  }
  function onPointerUp() {
    dragRef.current = null;
  }

  /** 点击「→ #n」把目标局面平移到视口中央 */
  const jumpTo = useCallback(
    (id: number) => {
      const el = containerRef.current;
      const node = graph.nodes[id];
      if (!el || !node) return;
      setView((v) => ({
        ...v,
        tx: el.clientWidth / 2 - v.k * (node.x + node.w / 2),
        ty: el.clientHeight / 2 - v.k * (node.y + node.h / 2),
      }));
    },
    [graph],
  );

  function flash(text: string) {
    setMessage(text);
    setTimeout(() => setMessage(null), 2500);
  }

  /** 导出用的独立 SVG 文本：完整画布尺寸、无平移缩放 */
  function serializeSvg(): string {
    const svg = svgRef.current!;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(graph.width));
    clone.setAttribute("height", String(graph.height));
    clone.setAttribute("viewBox", `0 0 ${graph.width} ${graph.height}`);
    clone.querySelector("g[data-graph-root]")?.setAttribute("transform", "");
    return new XMLSerializer().serializeToString(clone);
  }

  function exportSvg() {
    const blob = new Blob([serializeSvg()], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = "必胜策略图.svg";
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
    flash(`已导出 SVG（${graph.sceneCount} 个局面）`);
  }

  function exportPng() {
    const scale = Math.min(2, CANVAS_MAX / graph.width, CANVAS_MAX / graph.height);
    if (scale < 0.4) {
      flash("图幅过大，PNG 会严重压缩，请改用 SVG 导出");
      return;
    }
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(graph.width * scale);
        canvas.height = Math.round(graph.height * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (!blob) {
            flash("PNG 导出失败：画布超限，请改用 SVG");
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.download = "必胜策略图.png";
          a.href = url;
          a.click();
          URL.revokeObjectURL(url);
          flash(`已导出 PNG（${canvas.width}×${canvas.height}）`);
        }, "image/png");
      } catch {
        flash("PNG 导出失败：画布超限，请改用 SVG");
      }
    };
    img.onerror = () => flash("PNG 导出失败，请改用 SVG");
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serializeSvg())}`;
  }

  if (!confirmed) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
        <p>
          该策略共 {graph.sceneCount.toLocaleString()} 个局面，整图渲染可能较慢。
        </p>
        <Button size="sm" className="mt-2" onClick={() => setConfirmed(true)}>
          仍要渲染整图
        </Button>
      </div>
    );
  }

  const canvas = (
    <div
      ref={containerRef}
      className={[
        "relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50",
        fullscreen ? "flex-1" : "h-[420px]",
      ].join(" ")}
      style={{ touchAction: "none", cursor: dragRef.current ? "grabbing" : "grab" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <svg ref={svgRef} className="h-full w-full select-none">
        <defs>
          <marker id="arrow" viewBox="0 0 8 8" refX={7} refY={4} markerWidth={7} markerHeight={7} orient="auto">
            <path d="M 0 0.6 L 7.4 4 L 0 7.4 z" fill="#94a3b8" />
          </marker>
        </defs>
        <g data-graph-root transform={`translate(${view.tx}, ${view.ty}) scale(${view.k})`}>
          <rect x={0} y={0} width={graph.width} height={graph.height} fill="#f8fafc" />
          {graph.edges.map((e, i) => (
            <path
              key={i}
              d={edgePath(e.x1, e.y1, e.x2, e.y2)}
              fill="none"
              stroke="#94a3b8"
              strokeWidth={1.2}
              opacity={0.75}
              markerEnd="url(#arrow)"
            />
          ))}
          {graph.nodes.map((n) => (
            <NodeCard key={n.id} node={n} onJump={jumpTo} />
          ))}
        </g>
      </svg>
    </div>
  );

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-slate-400">
        {message ?? `${graph.sceneCount} 个局面 · 拖拽平移，滚轮缩放，点「→ #n」跳转`}
      </span>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={fit}>
          适应窗口
        </Button>
        <Button size="sm" onClick={() => setFullscreen((f) => !f)}>
          {fullscreen ? "退出全屏" : "全屏查看"}
        </Button>
        <Button size="sm" onClick={exportSvg}>
          导出 SVG
        </Button>
        <Button size="sm" onClick={exportPng}>
          导出 PNG
        </Button>
      </div>
    </div>
  );

  if (fullscreen) {
    // Portal 挂到 body：避免被父级 sticky 容器的层叠上下文困住
    return createPortal(
      <div className="fixed inset-0 z-50 flex flex-col gap-3 bg-white p-4">
        {toolbar}
        {canvas}
      </div>,
      document.body,
    );
  }
  return (
    <div className="space-y-2">
      {toolbar}
      {canvas}
    </div>
  );
}
