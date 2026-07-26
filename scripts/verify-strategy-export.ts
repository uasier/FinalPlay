/**
 * 校验「必胜思路导出 + 分享链接」两条新能力：
 * 1. 对每个内置示例求解后导出全文，验证：
 *    - 局面编号连续且引用闭合（引用的 #n 都有对应章节）；
 *    - B 决策局面数量与策略 DAG 中去重后的 B 节点数一致（全覆盖，无遗漏）；
 *    - 每个局面列出的应对行数等于该节点的分支数。
 * 2. 分享链接 encode → decode 往返一致，且畸形输入一律返回 null。
 * 运行：node scripts/verify-strategy-export.ts
 */
import { DECK, cardsToCounts } from "../src/solver/cards";
import { solveGame, StrategyNode } from "../src/solver/solve";
import { buildStrategyMarkdown } from "../src/solver/strategy-text";
import { encodeShareHash, decodeShareHash } from "../src/solver/share";
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

/** 独立统计策略 DAG 中去重后的 B 决策节点（与导出逻辑不共享实现，交叉验证） */
function collectBNodes(root: StrategyNode): Set<StrategyNode> {
  const bNodes = new Set<StrategyNode>();
  const visited = new Set<StrategyNode>();
  const stack = [root];
  while (stack.length) {
    const n = stack.pop()!;
    if (visited.has(n)) continue;
    visited.add(n);
    if (n.turn === "B" && n.children.length > 0) bNodes.add(n);
    for (const c of n.children) stack.push(c.next);
  }
  return bNodes;
}

// —— 第 1 部分：导出全文完整性 ——
for (const preset of PRESETS) {
  const result = solveGame(toCounts(preset.a), toCounts(preset.b));
  if (!result.ok) {
    check(false, `${preset.name}：求解失败（示例应必胜）`);
    continue;
  }
  const { markdown, sceneCount } = buildStrategyMarkdown(result.strategy, DEFAULT_RULE_CONFIG, {
    shareUrl: "https://example.com/#s=v1",
  });

  const bNodes = collectBNodes(result.strategy);
  check(sceneCount === bNodes.size, `${preset.name}：局面数 ${sceneCount} = DAG 中 B 决策节点数 ${bNodes.size}`);

  const defined = new Set(
    [...markdown.matchAll(/^## 局面 #(\d+)/gm)].map((m) => Number(m[1])),
  );
  const referenced = new Set(
    [...markdown.matchAll(/局面 #(\d+)/g)].map((m) => Number(m[1])),
  );
  check(defined.size === sceneCount, `${preset.name}：章节数 ${defined.size} 与局面数一致`);
  const unresolved = [...referenced].filter((n) => !defined.has(n));
  check(unresolved.length === 0, `${preset.name}：所有引用闭合（未闭合：${unresolved.join(",") || "无"}）`);
  const orphan = [...defined].filter((n) => n < 1 || n > sceneCount);
  check(orphan.length === 0, `${preset.name}：编号连续 1..${sceneCount}`);

  // 只匹配应对行（B 出/过），排除头部的「- B 手牌（…张）」概览行
  const responseLines = markdown.match(/^- B (出|过)/gm)?.length ?? 0;
  const expectedResponses = [...bNodes].reduce((sum, n) => sum + n.children.length, 0);
  check(
    responseLines === expectedResponses,
    `${preset.name}：应对行 ${responseLines} = 全部 B 分支 ${expectedResponses}`,
  );
  check(markdown.includes("A 先手必胜"), `${preset.name}：全文含必胜结论`);
}

// —— 第 2 部分：分享链接编解码 ——
for (const preset of PRESETS) {
  const hash = encodeShareHash(preset.a, preset.b, DEFAULT_RULE_CONFIG);
  const decoded = decodeShareHash(`#${hash}`);
  const same =
    decoded !== null &&
    decoded.a.join(",") === preset.a.join(",") &&
    decoded.b.join(",") === preset.b.join(",") &&
    JSON.stringify(decoded.rules) === JSON.stringify(DEFAULT_RULE_CONFIG);
  check(same, `${preset.name}：分享链接往返一致`);
}

const rulesOff = {
  allow: { ...DEFAULT_RULE_CONFIG.allow, straight: false, rocket: false },
};
const customDecoded = decodeShareHash(encodeShareHash(["3-♠"], ["4-♥"], rulesOff));
check(
  customDecoded !== null && JSON.stringify(customDecoded.rules) === JSON.stringify(rulesOff),
  "自定义规则往返一致",
);

const badCases: Array<[string, string]> = [
  ["", "空字符串"],
  ["#foo=bar", "无版本字段"],
  ["#s=v2;a=0;b=1;r=11111111111111", "版本不符"],
  ["#s=v1;a=;b=1", "A 手牌为空"],
  ["#s=v1;a=0;b=0", "重复卡牌"],
  ["#s=v1;a=99;b=1", "卡牌索引越界"],
  ["#s=v1;a=0;b=1;r=101", "规则位串长度错误"],
];
for (const [input, label] of badCases) {
  check(decodeShareHash(input) === null, `畸形输入拒绝：${label}`);
}

console.log(failures === 0 ? "\n全部通过" : `\n${failures} 项失败`);
process.exit(failures === 0 ? 0 : 1);
