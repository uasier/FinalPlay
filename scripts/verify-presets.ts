/**
 * 校验候选示例残局：必须 A 必胜；同时统计 B 是否有真实分支（演示更有趣）。
 * 运行：pnpm dlx tsx scripts/verify-presets.ts（或 node --experimental-strip-types）
 */
import { DECK, cardsToCounts } from "../src/solver/cards";
import { solveGame, StrategyNode } from "../src/solver/solve";

type Candidate = { name: string; a: string[]; b: string[] };

const CANDIDATES: Candidate[] = [
  { name: "顺子收尾", a: ["3-♠", "4-♠", "5-♠", "6-♠", "7-♠", "K-♠"], b: ["10-♥", "J-♥", "2-♥"] },
  { name: "王炸+对A vs 三个9", a: ["SJ", "BJ", "A-♠", "A-♥"], b: ["9-♠", "9-♥", "9-♣"] },
  { name: "对K压制", a: ["K-♠", "K-♥", "3-♠"], b: ["Q-♠", "Q-♥", "4-♠"] },
  { name: "三带二直接走", a: ["3-♠", "3-♥", "3-♣", "4-♠", "4-♥", "5-♠"], b: ["2-♠", "2-♥", "A-♠"] },
  { name: "连对拉扯", a: ["5-♠", "5-♥", "6-♠", "6-♥", "7-♠", "7-♥", "2-♠"], b: ["8-♠", "8-♥", "9-♠", "9-♥", "SJ"] },
  { name: "单牌博弈", a: ["4-♠", "9-♠", "A-♠", "2-♠"], b: ["8-♥", "K-♥", "2-♥"] },
  { name: "炸弹清场", a: ["6-♠", "6-♥", "6-♣", "6-♦", "3-♠"], b: ["A-♠", "A-♥", "K-♠", "K-♥"] },
  { name: "七对三", a: ["3-♠", "4-♠", "5-♠", "6-♠", "7-♠", "8-♠", "9-♠"], b: ["J-♥", "Q-♥", "K-♥"] },
  { name: "小规模拉锯", a: ["7-♠", "7-♥", "J-♠", "2-♠"], b: ["9-♥", "9-♦", "Q-♠"] },
  { name: "飞机演示", a: ["8-♠", "8-♥", "8-♣", "9-♠", "9-♥", "9-♣", "3-♠", "4-♠"], b: ["2-♠", "2-♥", "A-♠", "A-♥", "K-♠"] },
];

function toCounts(ids: string[]) {
  const byId = new Map(DECK.map((c) => [c.id, c]));
  const cards = ids.map((id) => {
    const c = byId.get(id);
    if (!c) throw new Error(`未知卡牌 id: ${id}`);
    return c;
  });
  return cardsToCounts(cards);
}

/** B 节点分支数分布：max children + 有选择的 B 节点数，衡量演示互动性 */
function interactivity(root: StrategyNode): { maxB: number; bChoiceNodes: number; nodes: number } {
  let maxB = 0;
  let bChoiceNodes = 0;
  let nodes = 0;
  const stack = [root];
  while (stack.length) {
    const n = stack.pop()!;
    nodes += 1;
    if (n.turn === "B") {
      maxB = Math.max(maxB, n.children.length);
      if (n.children.length >= 2) bChoiceNodes += 1;
    }
    for (const c of n.children) stack.push(c.next);
  }
  return { maxB, bChoiceNodes, nodes };
}

for (const cand of CANDIDATES) {
  const started = Date.now();
  const result = solveGame(toCounts(cand.a), toCounts(cand.b));
  const ms = Date.now() - started;
  if (result.ok) {
    const meta = interactivity(result.strategy);
    console.log(
      `✅ ${cand.name} | ${ms}ms | states=${result.stats.statesVisited} | 树节点=${meta.nodes} | B最大分支=${meta.maxB} | B选择点=${meta.bChoiceNodes}`,
    );
  } else {
    console.log(`❌ ${cand.name} | ${ms}ms | A 无必胜策略 (states=${result.stats.statesVisited})`);
  }
}
