import { StrategyNode } from "./solve";
import { formatPlay } from "./format";
import { RANK_LABELS } from "./ranks";
import { Counts, RankValue } from "./types";
import { RuleConfig } from "./rule-config";
import { PLAY_TYPES, PLAY_TYPE_LABEL } from "./playtype-meta";

/**
 * 必胜思路全文导出。
 *
 * 策略树本质是记忆化生成的 DAG：相同局面共享同一个节点对象。
 * 导出时按对象身份去重，给每个「B 决策局面」分配编号；
 * A 的回合只有唯一推荐招法，直接内联到 B 应对行里。
 * 因此全文体积与去重后的局面数成线性关系，不会指数爆炸。
 */
export type StrategyText = {
  /** 完整 Markdown 文本（同时也是可读纯文本） */
  markdown: string;
  /** 去重后的 B 决策局面数量 */
  sceneCount: number;
};

/** 手牌计数转为点数列表文本（从小到大，与界面手牌排序一致） */
export function countsToText(c: Counts): string {
  const parts: string[] = [];
  for (let v = 0; v < c.length; v += 1) {
    for (let k = 0; k < c[v]; k += 1) parts.push(RANK_LABELS[v as RankValue]);
  }
  return parts.length ? parts.join(" ") : "（已出完）";
}

function totalCards(c: Counts): number {
  let n = 0;
  for (const x of c) n += x;
  return n;
}

export function buildStrategyMarkdown(
  root: StrategyNode,
  rules: RuleConfig,
  opts?: { shareUrl?: string | null },
): StrategyText {
  // 局面编号表：仅对「轮到 B 且有分支」的节点编号；queue 按编号顺序待展开
  const sceneId = new Map<StrategyNode, number>();
  const queue: StrategyNode[] = [];

  function refScene(node: StrategyNode): string {
    let id = sceneId.get(node);
    if (id === undefined) {
      id = sceneId.size + 1;
      sceneId.set(node, id);
      queue.push(node);
    }
    return `局面 #${id}`;
  }

  /** 描述 A 在某节点的唯一策略招法，以及其去向（终局或下一个 B 局面） */
  function describeAStep(aNode: StrategyNode): string {
    if (aNode.children.length === 0) return "A 手牌已出完 —— 获胜";
    const { move, next } = aNode.children[0];
    const action = move.kind === "PASS" ? "A 过" : `A 出「${formatPlay(move.play)}」`;
    if (next.children.length === 0) return `${action}，A 手牌出完 —— 获胜`;
    return `${action} → 转入 ${refScene(next)}`;
  }

  const lines: string[] = [];
  lines.push("# 斗地主残局 · A 先手必胜手册");
  lines.push("");
  lines.push(`- A 手牌（${totalCards(root.a)} 张）：${countsToText(root.a)}`);
  lines.push(`- B 手牌（${totalCards(root.b)} 张）：${countsToText(root.b)}`);
  const disabled = PLAY_TYPES.filter((t) => !rules.allow[t]).map((t) => PLAY_TYPE_LABEL[t]);
  lines.push(`- 规则：${disabled.length ? `禁用牌型 —— ${disabled.join("、")}` : "全部牌型可用"}`);
  if (opts?.shareUrl) lines.push(`- 在线复现（打开自动求解）：${opts.shareUrl}`);
  lines.push("");
  lines.push(
    "**结论：A 先手必胜。** 以下穷举 B 的全部合法应对：每条给出 A 的固定回应，" +
      "并跳转到下一个编号局面；相同局面已合并，跟随编号即可执行完整必胜策略。",
  );
  lines.push("");
  lines.push("## 开局（A 自由出牌）");
  lines.push(describeAStep(root));

  // 逐个展开 B 决策局面；展开过程中可能追加新局面，用下标循环
  for (let i = 0; i < queue.length; i += 1) {
    const node = queue[i];
    const constraintText = node.constraint
      ? `B 需大过「${formatPlay(node.constraint)}」`
      : "B 自由出牌";
    lines.push("");
    lines.push(`## 局面 #${i + 1}　${constraintText}`);
    lines.push(`A 余牌：${countsToText(node.a)}　｜　B 余牌：${countsToText(node.b)}`);
    for (const child of node.children) {
      const bAction = child.move.kind === "PASS" ? "B 过" : `B 出「${formatPlay(child.move.play)}」`;
      lines.push(`- ${bAction} ⇒ ${describeAStep(child.next)}`);
    }
  }

  lines.push("");
  lines.push(`> 共 ${queue.length} 个决策局面。由「斗地主残局破解」穷举证明生成。`);

  return { markdown: lines.join("\n"), sceneCount: queue.length };
}
