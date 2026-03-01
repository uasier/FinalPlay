# 斗地主残局破解（两人版）

可设置 A/B 初始手牌，使用穷举 + 记忆化搜索，寻找 **A 先手必胜**（B 任意应对都会输）的策略，并支持「策略树」与「逐步演示」查看解法。

## 开发启动

```bash
pnpm install
pnpm dev
```

## 自动部署（Vercel + GitHub Actions）

已提供 GitHub Actions 工作流：推送到 `main/master` 自动生产部署；PR 自动预览部署。

1. 在 Vercel 创建/导入项目（可以先在本地运行一次 `vercel link` 绑定项目）
2. 在 GitHub 仓库 Settings → Secrets and variables → Actions 添加 Secrets：
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
3. 工作流文件：`.github/workflows/vercel-deploy.yml`

## 访问统计（Vercel Web Analytics）

已集成 Vercel Analytics（页面访问统计会在 Vercel 项目面板里展示）。

1. Vercel 控制台 → 你的 Project → `Analytics` / `Web Analytics` → 启用
2. 代码侧已添加 `<Analytics />`（`src/main.tsx`），重新部署后开始采集

## 使用方式

1. 选择上方工具：`指派给 A` / `指派给 B` / `橡皮擦`
2. 点击牌库中的牌面完成双方手牌设置（同一张牌不会重复出现）
3. 点击 `求解（A 先手）`
4. 右侧切换：
   - `概览`：是否找到必胜策略 + 搜索统计
   - `逐步`：A 自动按策略走；B 可任选应对分支验证 A 仍必胜
   - `策略树`：
     - `浏览（推荐）`：大数据友好，只看当前层 + 分页（支持导出当前视图 PNG）
     - `树形（重）`：可查看完整分支树（支持「全部展开/折叠」与「导出 PNG」）

## 规则说明（实现约定）

- 仅两方玩家：A 与 B；A 永远先手。
- 花色仅用于区分卡牌唯一性；斗地主比较大小只使用点数顺序（3 < … < A < 2 < 小王 < 大王）。
- 覆盖常见牌型：单/对/三/三带一/三带二/顺子/连对/飞机(含带翅膀)/四带二/四带两对/炸弹/王炸。
