## 2026-07-26 必胜思路分享与导出
- 需求：现有 UI 只能交互式浏览策略，无法整体导出或分享必胜思路。
- 决策：主AI 直接实现（本会话无 Codex MCP 可用，已记录为工具缺失补偿）。
- 变更：新增 solver/strategy-text.ts（DAG 去重编号导出全文 Markdown）、solver/share.ts（URL hash 编解码）、components/results/StrategyExport.tsx、utils/clipboard.ts（剪贴板兜底）；App.tsx 支持分享链接自动载入并求解。
- 验证：scripts/verify-strategy-export.ts 全部通过（局面数=DAG B 节点数、引用闭合、应对全覆盖、编解码往返与畸形输入拒绝）；npm run build 通过；浏览器端到端验证分享链接自动求解与复制按钮。

## 2026-07-26 全局策略图
- 需求：一张可总览全部胜牌策略的「巨大策略图」。
- 变更：抽出 strategy-scenes.ts（文本/图共用局面编号）；新增 strategy-graph.ts（最长路径分层 + 父锚点均值排序 + 贪心堆叠，纯几何输出）与 StrategyGraph.tsx（SVG 渲染、拖拽缩放、跳转定位、全屏 Portal、导出 SVG/PNG）；ResultsPanel 增加「策略图」页签。
- 验证：verify-strategy-graph.ts 全过（图文局面编号一致、连线无回边、行数=B 分支数、同列无重叠）；原 verify-strategy-export.ts 确认重构后文本输出不变；浏览器验证全屏（修复 sticky 层叠上下文 Portal 问题）、跳转、SVG/PNG 导出。
