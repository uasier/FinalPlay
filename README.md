# 斗地主残局破解（两人版）

设置 A / B 双方初始手牌，穷举 + 记忆化搜索，寻找 **A 先手必胜**（B 任意应对都会输）的策略。
支持「逐步演示」与「策略浏览」两种查看方式。

## 特性

- **不卡界面**：求解在 Web Worker 后台线程运行，实时显示搜索进度，可随时取消
- **简单交互**：选中「为 A / 为 B 选牌」后点击牌库即可分配；再点一次移除
- **内置示例**：右上角「载入示例」一键体验（示例均经 `scripts/verify-presets.ts` 验证必胜）
- **自动保存**：手牌与规则配置存入 localStorage，刷新不丢
- **多端适配**：手机 / 平板 / 桌面自适应，移动端吸底求解栏
- **规则可配**：14 种牌型可独立开关（单/对/三/三带/顺子/连对/飞机/四带/炸弹/王炸）

## 开发启动

```bash
pnpm install
pnpm dev        # 本地端口 10001
pnpm build      # 类型检查 + 生产构建
```

## 项目结构

```
src/
├── solver/          # 纯逻辑层（不依赖 React）
│   ├── types.ts     # 牌值 / 牌型 / 局面类型
│   ├── cards.ts     # 牌库定义
│   ├── playgen.ts   # 出牌枚举
│   ├── rules.ts     # 压牌判定
│   ├── solve.ts     # 记忆化博弈搜索（支持进度回调）
│   ├── worker.ts    # Web Worker 入口
│   └── presets.ts   # 内置示例残局
├── hooks/           # 状态层
│   ├── useSolver.ts     # Worker 生命周期：求解 / 进度 / 取消
│   ├── useHands.ts      # 手牌分配 + 持久化
│   ├── useRuleConfig.ts # 规则配置 + 持久化
│   └── usePngExport.ts  # 视图导出 PNG
├── ui/              # 通用 UI 基元（Button / Segmented / Panel）
└── components/      # 业务组件
    ├── CardFace.tsx     # 扑克牌牌面
    ├── DeckGrid.tsx     # 按点数分组的牌库
    ├── HandList.tsx     # 玩家手牌
    ├── RuleConfigPanel.tsx
    ├── SolveControls.tsx
    └── results/         # 结果区：横幅 / 逐步演示 / 策略浏览
```

## 使用方式

1. 点击「为 A 选牌」或「为 B 选牌」，然后在牌库中点击牌面分配（再点一次移除）
2. 需要时展开「规则配置」调整可用牌型
3. 点击「求解（A 先手）」
4. 结果区查看：
   - **逐步演示**：A 自动按策略出牌；B 的每种应对由你任选，走到终局必是 A 胜（支持复制打法文本）
   - **策略浏览**：逐层浏览策略树，支持按牌型筛选、分页、导出当前视图 PNG

## 规则说明（实现约定）

- 仅两方玩家：A 与 B；A 永远先手
- 花色仅用于区分卡牌唯一性；比较大小只使用点数顺序（3 < … < A < 2 < 小王 < 大王）
- 覆盖牌型：单/对/三/三带一/三带二/顺子/连对/飞机(含带翅膀)/四带二/四带两对/炸弹/王炸

## 自动部署（Vercel + GitHub Actions）

推送到 `main/master` 自动生产部署；PR 自动预览部署。

1. 在 Vercel 创建/导入项目（可先本地 `vercel link` 绑定）
2. 在 GitHub 仓库 Settings → Secrets and variables → Actions 添加：
   - `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID`
3. 工作流文件：`.github/workflows/vercel-deploy.yml`

已集成 Vercel Web Analytics（`src/main.tsx` 中的 `<Analytics />`），在 Vercel 项目面板启用后即可采集。
