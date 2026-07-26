import { StrategyNode } from "./solve";
import { collectScenes, sceneAfter } from "./strategy-scenes";
import { formatPlay } from "./format";
import { countsToText } from "./strategy-text";

/**
 * 全局策略图布局：把必胜策略 DAG 排成从左到右的分层图。
 * - 每个「B 决策局面」一张卡片，卡片内每行是 B 的一种应对及 A 的固定回应；
 * - 行若指向后续局面则产生一条连线，否则该分支就地标注获胜；
 * - 分层取「距开局的最长路径」，保证连线永远指向右侧列，无回边；
 * - 输出纯几何数据，渲染层不做任何计算，便于脚本验证布局不变量。
 */
export type GraphRow = {
  /** 行主体（B 应对 ⇒ A 回应），已按卡片宽度截断 */
  text: string;
  /** 完整未截断文本，用于悬停提示 */
  full: string;
  /** 指向的局面编号；null 表示该分支直接获胜 */
  targetId: number | null;
};

export type GraphNode = {
  /** 0 为开局节点，1..n 与文本导出的局面编号一致 */
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  /** 局面约束说明（需跟牌 / 自由出牌） */
  constraint: string;
  /** 双方余牌概览 */
  hands: string;
  rows: GraphRow[];
};

export type GraphEdge = {
  fromId: number;
  fromRow: number;
  toId: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type StrategyGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width: number;
  height: number;
  sceneCount: number;
};

// —— 布局常量（与渲染层共享） ——
export const GRAPH_FONT = 11;
export const CARD_W = 320;
const CARD_PAD = 10;
const TITLE_H = 16;
const HANDS_H = 15;
const HEADER_H = CARD_PAD + TITLE_H + HANDS_H + 4;
export const ROW_H = 17;
const COL_GAP = 120;
const NODE_GAP = 18;
const MARGIN = 28;

/** 估算等宽排版下的文本像素宽度：非 ASCII（含中文、全角符号）按全宽计 */
function textWidth(text: string, fontSize: number): number {
  let units = 0;
  for (const ch of text) units += ch.charCodeAt(0) > 0x7f ? 1 : 0.62;
  return units * fontSize;
}

/** 超宽文本截断并追加省略号 */
function truncateText(text: string, maxPx: number, fontSize: number): string {
  if (textWidth(text, fontSize) <= maxPx) return text;
  let out = "";
  for (const ch of text) {
    if (textWidth(out + ch + "…", fontSize) > maxPx) break;
    out += ch;
  }
  return out + "…";
}

/** 行主体可用宽度：卡片内边距之外再给行尾的「→ #n / ✓ 胜」留位置 */
const ROW_TEXT_MAX = CARD_W - CARD_PAD * 2 - 56;

function nodeHeight(rowCount: number): number {
  return HEADER_H + rowCount * ROW_H + CARD_PAD;
}

/** 行锚点（连线起点）的纵坐标 */
export function rowAnchorY(node: GraphNode, rowIndex: number): number {
  return node.y + HEADER_H + rowIndex * ROW_H + ROW_H / 2;
}

export function buildStrategyGraph(root: StrategyNode): StrategyGraph {
  const { scenes, idOf } = collectScenes(root);

  /** 描述 A 的固定回应；返回行文本与目标局面 */
  function aStepOf(aNode: StrategyNode): { text: string; targetId: number | null } {
    if (aNode.children.length === 0) return { text: "A 已出完", targetId: null };
    const { move, next } = aNode.children[0];
    const action = move.kind === "PASS" ? "A 过" : `A 出「${formatPlay(move.play)}」`;
    if (next.children.length === 0) return { text: `${action}，出完`, targetId: null };
    return { text: action, targetId: idOf.get(next)! };
  }

  // —— 组装节点（含开局节点 0），坐标稍后填充 ——
  const nodes: GraphNode[] = [];

  const opening = aStepOf(root);
  nodes.push({
    id: 0,
    x: 0,
    y: 0,
    w: CARD_W,
    h: nodeHeight(1),
    title: "开局",
    constraint: "A 自由出牌",
    hands: `A：${countsToText(root.a)}　B：${countsToText(root.b)}`,
    rows: [
      {
        text: truncateText(opening.text, ROW_TEXT_MAX, GRAPH_FONT),
        full: opening.text,
        targetId: opening.targetId,
      },
    ],
  });

  for (let i = 0; i < scenes.length; i += 1) {
    const scene = scenes[i];
    const rows: GraphRow[] = scene.children.map((child) => {
      const bAction = child.move.kind === "PASS" ? "B 过" : `B 出「${formatPlay(child.move.play)}」`;
      const reply = aStepOf(child.next);
      const full = `${bAction} ⇒ ${reply.text}`;
      return {
        text: truncateText(full, ROW_TEXT_MAX, GRAPH_FONT),
        full,
        targetId: reply.targetId,
      };
    });
    nodes.push({
      id: i + 1,
      x: 0,
      y: 0,
      w: CARD_W,
      h: nodeHeight(rows.length),
      title: `局面 #${i + 1}`,
      constraint: scene.constraint ? `B 需大过「${formatPlay(scene.constraint)}」` : "B 自由出牌",
      hands: `A：${countsToText(scene.a)}　B：${countsToText(scene.b)}`,
      rows,
    });
  }

  // —— 分层：距开局节点的最长路径（DAG 上按拓扑序松弛） ——
  const adjacency: number[][] = nodes.map((n) =>
    n.rows.filter((r) => r.targetId !== null).map((r) => r.targetId!),
  );
  const topo: number[] = [];
  const visited = new Array<boolean>(nodes.length).fill(false);
  const dfsStack: Array<{ id: number; nextChild: number }> = [{ id: 0, nextChild: 0 }];
  visited[0] = true;
  while (dfsStack.length > 0) {
    const frame = dfsStack[dfsStack.length - 1];
    const targets = adjacency[frame.id];
    if (frame.nextChild < targets.length) {
      const t = targets[frame.nextChild];
      frame.nextChild += 1;
      if (!visited[t]) {
        visited[t] = true;
        dfsStack.push({ id: t, nextChild: 0 });
      }
    } else {
      topo.push(frame.id);
      dfsStack.pop();
    }
  }
  topo.reverse();

  const layerOf = new Array<number>(nodes.length).fill(0);
  for (const u of topo) {
    for (const v of adjacency[u]) {
      layerOf[v] = Math.max(layerOf[v], layerOf[u] + 1);
    }
  }

  // —— 同层排序与纵向放置：按父节点行锚点均值排序，贪心堆叠避免重叠 ——
  const layerCount = Math.max(...layerOf) + 1;
  const layers: number[][] = Array.from({ length: layerCount }, () => []);
  for (const n of nodes) layers[layerOf[n.id]].push(n.id);

  for (let l = 0; l < layerCount; l += 1) {
    // 父节点期望位置：所有指向本节点的行锚点的均值（父层均已放置）
    const desired = new Map<number, number>();
    for (const id of layers[l]) {
      const anchors: number[] = [];
      for (const p of nodes) {
        if (layerOf[p.id] >= l) continue;
        p.rows.forEach((row, ri) => {
          if (row.targetId === id) anchors.push(rowAnchorY(p, ri));
        });
      }
      desired.set(
        id,
        anchors.length > 0 ? anchors.reduce((s, v) => s + v, 0) / anchors.length : MARGIN,
      );
    }
    layers[l].sort((a, b) => desired.get(a)! - desired.get(b)!);

    let cursor = MARGIN;
    for (const id of layers[l]) {
      const node = nodes[id];
      node.x = MARGIN + l * (CARD_W + COL_GAP);
      node.y = Math.max(desired.get(id)! - node.h / 2, cursor);
      cursor = node.y + node.h + NODE_GAP;
    }
  }

  // —— 连线几何：行锚点 → 目标卡片左侧中上部 ——
  const edges: GraphEdge[] = [];
  for (const node of nodes) {
    node.rows.forEach((row, ri) => {
      if (row.targetId === null) return;
      const target = nodes[row.targetId];
      edges.push({
        fromId: node.id,
        fromRow: ri,
        toId: target.id,
        x1: node.x + node.w,
        y1: rowAnchorY(node, ri),
        x2: target.x,
        y2: target.y + Math.min(HEADER_H, target.h / 2),
      });
    });
  }

  const width = MARGIN * 2 + layerCount * (CARD_W + COL_GAP) - COL_GAP;
  const height = Math.max(...nodes.map((n) => n.y + n.h)) + MARGIN;

  return { nodes, edges, width, height, sceneCount: scenes.length };
}
