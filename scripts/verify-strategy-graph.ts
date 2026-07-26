/**
 * 校验策略图布局的不变量：
 * - 图与文本导出局面数、编号一一对应（共享 collectScenes 的交叉验证）；
 * - 所有连线端点存在，且目标所在列严格在源之后（左→右无回边）；
 * - 应对行总数 = 策略 DAG 全部 B 分支数；获胜行数 = 文本中的获胜行数；
 * - 坐标有限、画布尺寸为正、同列卡片互不重叠。
 * 运行：npx tsx scripts/verify-strategy-graph.ts
 */
import { DECK, cardsToCounts } from "../src/solver/cards";
import { solveGame, StrategyNode } from "../src/solver/solve";
import { buildStrategyGraph } from "../src/solver/strategy-graph";
import { buildStrategyMarkdown } from "../src/solver/strategy-text";
import { DEFAULT_RULE_CONFIG } from "../src/solver/rule-config";
import { PRESETS } from "../src/solver/presets";

let failures = 0;

function check(ok: boolean, label: string) {
  if (ok) {
    console.log(`✅ ${label}`);
  } else {
    failures += 1;
    console.log(`❌ ${label}`);
  }
}

function toCounts(ids: string[]) {
  const byId = new Map(DECK.map((c) => [c.id, c]));
  return cardsToCounts(ids.map((id) => byId.get(id)!));
}

function collectBBranches(root: StrategyNode): number {
  let branches = 0;
  const visited = new Set<StrategyNode>();
  const stack = [root];
  while (stack.length) {
    const n = stack.pop()!;
    if (visited.has(n)) continue;
    visited.add(n);
    if (n.turn === "B" && n.children.length > 0) branches += n.children.length;
    for (const c of n.children) stack.push(c.next);
  }
  return branches;
}

for (const preset of PRESETS) {
  const result = solveGame(toCounts(preset.a), toCounts(preset.b));
  if (!result.ok) {
    check(false, `${preset.name}：求解失败（示例应必胜）`);
    continue;
  }
  const graph = buildStrategyGraph(result.strategy);
  const text = buildStrategyMarkdown(result.strategy, DEFAULT_RULE_CONFIG);

  check(graph.sceneCount === text.sceneCount, `${preset.name}：图局面数 ${graph.sceneCount} = 文本局面数 ${text.sceneCount}`);
  check(
    graph.nodes.length === graph.sceneCount + 1 &&
      graph.nodes.every((n, i) => n.id === i),
    `${preset.name}：节点 id 连续（0 开局 + 1..${graph.sceneCount}）`,
  );

  // 图中行尾「→ #n」的去向必须与文本中对应局面的「转入 局面 #n」一致
  const textTargets = [...text.markdown.matchAll(/转入 局面 #(\d+)/g)].map((m) => Number(m[1]));
  const graphTargets = graph.nodes.flatMap((n) =>
    n.rows.filter((r) => r.targetId !== null).map((r) => r.targetId!),
  );
  check(
    graphTargets.join(",") === textTargets.join(","),
    `${preset.name}：全部去向编号与文本一致（${graphTargets.length} 条）`,
  );

  const bBranches = collectBBranches(result.strategy);
  const sceneRows = graph.nodes.filter((n) => n.id > 0).reduce((s, n) => s + n.rows.length, 0);
  check(sceneRows === bBranches, `${preset.name}：应对行 ${sceneRows} = 全部 B 分支 ${bBranches}`);

  const winRows = graph.nodes.reduce((s, n) => s + n.rows.filter((r) => r.targetId === null).length, 0);
  const textWins = text.markdown.match(/获胜/g)!.length - 0; // 结论行不含「获胜」二字，全部来自行尾
  check(winRows === textWins, `${preset.name}：获胜行 ${winRows} = 文本获胜标注 ${textWins}`);

  const layerOfX = new Map<number, number>();
  for (const n of graph.nodes) layerOfX.set(n.id, n.x);
  check(
    graph.edges.every((e) => layerOfX.get(e.toId)! > layerOfX.get(e.fromId)!),
    `${preset.name}：连线全部指向右侧列（无回边）`,
  );
  check(
    graph.edges.every((e) => [e.x1, e.y1, e.x2, e.y2].every(Number.isFinite)) &&
      graph.nodes.every((n) => [n.x, n.y, n.w, n.h].every(Number.isFinite)) &&
      graph.width > 0 &&
      graph.height > 0,
    `${preset.name}：坐标与画布尺寸有效（${Math.round(graph.width)}×${Math.round(graph.height)}）`,
  );

  // 同列卡片按 y 排序后不得重叠
  const byColumn = new Map<number, typeof graph.nodes>();
  for (const n of graph.nodes) {
    const col = byColumn.get(n.x) ?? [];
    col.push(n);
    byColumn.set(n.x, col);
  }
  let overlap = false;
  for (const col of byColumn.values()) {
    col.sort((a, b) => a.y - b.y);
    for (let i = 1; i < col.length; i += 1) {
      if (col[i].y < col[i - 1].y + col[i - 1].h) overlap = true;
    }
  }
  check(!overlap, `${preset.name}：同列卡片无重叠`);
}

console.log(failures === 0 ? "\n全部通过" : `\n${failures} 项失败`);
process.exit(failures === 0 ? 0 : 1);
