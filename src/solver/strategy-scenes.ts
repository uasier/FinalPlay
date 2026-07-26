import { StrategyNode } from "./solve";

/**
 * 策略 DAG 的「B 决策局面」收集与编号。
 * 文本导出与策略图共用同一遍历顺序，保证两边的局面编号完全一致：
 * 先登记开局招法指向的局面，再按编号顺序逐个展开其每行应对指向的局面。
 */
export type SceneIndex = {
  /** 按编号顺序排列的局面节点（下标 i 对应局面 #i+1） */
  scenes: StrategyNode[];
  /** 节点 → 局面编号（从 1 开始） */
  idOf: Map<StrategyNode, number>;
};

/** A 节点走完唯一策略招法后到达的下一个 B 决策局面；直接终局则返回 null */
export function sceneAfter(aNode: StrategyNode): StrategyNode | null {
  if (aNode.children.length === 0) return null;
  const next = aNode.children[0].next;
  return next.children.length > 0 ? next : null;
}

export function collectScenes(root: StrategyNode): SceneIndex {
  const idOf = new Map<StrategyNode, number>();
  const scenes: StrategyNode[] = [];
  const ref = (node: StrategyNode) => {
    if (!idOf.has(node)) {
      idOf.set(node, idOf.size + 1);
      scenes.push(node);
    }
  };

  const first = sceneAfter(root);
  if (first) ref(first);
  for (let i = 0; i < scenes.length; i += 1) {
    for (const child of scenes[i].children) {
      const next = sceneAfter(child.next);
      if (next) ref(next);
    }
  }
  return { scenes, idOf };
}
