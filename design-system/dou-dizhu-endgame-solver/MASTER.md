# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Dou Dizhu Endgame Solver
**Updated:** 2026-07-26（重构为明亮简洁风）
**Category:** Tool / Gaming

---

## Global Rules

### Color Palette（基于 Tailwind 内置色板，不自定义色值）

| Role | Tailwind Token | Usage |
|------|----------------|-------|
| Background | `slate-100` | 页面底色 |
| Surface | `white` + `border-slate-200` + `shadow-sm` | 面板 / 卡片 |
| Text 主 | `slate-900` | 标题正文 |
| Text 次 | `slate-500` / `slate-400` | 说明、提示 |
| CTA / 品牌 | `emerald-600`（hover `emerald-700`） | 主按钮、选中态、成功 |
| 玩家 A | `blue-600` 系（chip: `blue-50/200/700`） | A 的所有视觉标识 |
| 玩家 B | `orange-500` 系（chip: `orange-50/200/700`） | B 的所有视觉标识 |
| 红花色 | `red-600` | ♥ ♦ 与大王 |
| 黑花色 | `slate-800` | ♠ ♣ 与小王 |
| 警示 | `amber-*`（未必胜）/ `red-*`（错误） | 状态横幅 |

**原则：** 玩家色（蓝 A / 橙 B）在全站唯一且一致——徽标、描边、胶囊、分段控件共用 `src/components/players.ts` 中的 `PLAYER_THEME`，禁止散落硬编码。

### Typography

- 系统字体栈（无外部字体请求）：`-apple-system, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", …`
- 牌面点数 / 出牌文本：`font-mono` + `tabular-nums`
- 标题：`font-semibold`/`font-bold`，不使用装饰性字体

### 组件基元（一律复用 `src/ui/`）

- **Button**：`primary`（emerald 实底）/ `subtle`（白底描边）/ `ghost`（无底）× `sm/md/lg`
- **Segmented**：互斥选项组，选中态白底阴影（或玩家色）
- **Panel**：`rounded-2xl border-slate-200 bg-white shadow-sm`，标题 + 副标题 + 右侧动作

### 圆角 / 阴影

- 面板 `rounded-2xl`，控件 `rounded-lg`/`rounded-xl`，胶囊 `rounded-full`
- 阴影只用 `shadow-sm`，悬停最多 `shadow-md`；禁止霓虹光晕

### 响应式

- 断点走查基线：360 / 375 / 768 / 1024 / 1440，禁止横向溢出
- 桌面（`lg+`）：设置区 3fr + 结果区 2fr 双栏，结果区 `sticky top-5`
- 移动端：单列；求解操作吸底（`fixed bottom-0` + `env(safe-area-inset-bottom)`），页面底部预留 `pb-28`
- 牌库使用 `auto-fill minmax()` 网格自适应任意宽度
- 触控目标：卡牌 ≥ 32×44px，按钮 ≥ 32px 高

---

## Style Guidelines

**Style:** 明亮简洁的工具风（Light, clean, utilitarian）

**Keywords:** 白色面板、留白、低饱和底 + 高对比内容、真实扑克牌隐喻、即时反馈

**Key Patterns:**

- 状态即视觉：成功 emerald 横幅 / 未必胜 amber / 错误 red / 进行中 spinner + 实时计数
- 空态必须给引导（三步开始 + 载入示例）
- 长任务（求解）永不阻塞 UI：Web Worker + 进度 + 取消

---

## Anti-Patterns (Do NOT Use)

- ❌ 暗色 / 霓虹 / 扫描线等装饰效果（已在重构中移除）
- ❌ Emojis as icons — 用内联 SVG（Heroicons 风格）或文本字形（如 ♠）
- ❌ Missing cursor:pointer — 所有可点元素必须有
- ❌ Layout-shifting hovers — 悬停不得引起布局位移
- ❌ Low contrast text — 正文对比度 ≥ 4.5:1
- ❌ Instant state changes — 过渡 150–300ms
- ❌ Invisible focus states — 键盘焦点必须可见（`focus-visible:ring-2 ring-emerald-500/60`）
- ❌ 外部字体 / 不必要的网络请求

---

## Pre-Delivery Checklist

- [ ] 玩家色仅来自 `PLAYER_THEME`
- [ ] 按钮 / 分段控件 / 面板均复用 `src/ui/` 基元
- [ ] `cursor-pointer`、focus ring、150–300ms 过渡齐备
- [ ] `prefers-reduced-motion` 生效（见 `index.css`）
- [ ] 360 / 375 / 768 / 1024 / 1440 无横向滚动
- [ ] 移动端内容不被吸底栏遮挡（`pb-28` + safe-area）
