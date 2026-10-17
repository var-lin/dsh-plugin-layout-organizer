# AGENTS.md

## 工程功能

DSH 客户端插件「插件布局整理」（`dsh-plugin-layout-organizer`）：对 DSH 投放到五处槽位（侧边栏顶部、侧边栏底部、对话标签、输入框停靠行、设置页导航）的插件按钮做**拖拽排序、官方 / 第三方分隔线与按钮收纳**。只改变按钮的显示位置，不改动插件注册表、不卸载也不启停任何插件。

纯 TypeScript 源码，无打包器、无 npm 依赖：构建期按 `build.mjs` 的 `BUILD_ORDER` 清单把 `src/` 拼接成 `lib/client.js`，同时把 `src/` 里的 `@@svg:…@@` 图标占位符替换成 `assets/icons/` 归一化后的 SVG；TS 语法由 Node 自带的 `module.stripTypeScriptTypes` 擦除。包管理器用 pnpm（正常不需要安装任何东西）。

## 关键目录结构

- `src/types/` —— 全局类型：`state.ts`（StateOptions / PluginState / StoreHandle 等）与 `globals.d.ts`（构建前言注入的 `h`、React、各 hook 声明）
- `src/shared/` —— 常量、中英文案、图标占位符（`icons.ts`：六个右键菜单图标 + 四个标题行动作图标的 `@@svg:…@@` 构建占位符）
- `src/core/` —— 状态存储、DOM 行发现 / 分隔线 / 右键菜单 / 投影（设置行自身图标同样是 `@@svg:layout.svg@16@@` 占位符）/ 重新打开、调度中枢。投影每轮把真正标记到的行记进 `liveRows`（`dom-rows.ts`），设置页与收纳包据此只列屏幕上存在的行；输入框停靠行里渲染成空的台账记录靠 `ROW_HOOKS`（`shared/constants.ts`）的正证据认领，不按位置猜
- `src/drag/` —— 指针拖拽控制器
- `src/ui/` —— 样式注入、React 基础控件（`kit.ts`，含 `Icon`）、搜索框（`search.ts`）、配置导入导出（`config-actions.ts`）、设置页外壳（`settings-page.ts`，顶部分页导航）与拆出的单张位置卡片（`scope-card.ts`）、快捷键编辑器（`shortcut-card.ts`）、按钮收纳包面板（`stash.ts`）
- `src/main.ts` —— 接线层（注册槽位、快捷键、样式、locale、清理）
- `assets/icons/` —— 从 iconfont 下载的 11 个 SVG 源文件（菜单用 arrow-up / arrow-down / arrow-left / arrow-right / archive / unarchive / layout，标题行用 export / import / github / feedback），是**构建输入**：`src/` 里的占位符构建时按素材归一化（viewBox 取源文件、宽高默认 14、占位符可指定尺寸——标题行四个动作图标为 16、颜色改 currentColor、补 aria / focusable）成 `<svg>` 内联进 `lib/client.js`；四份动作素材画布留白差别大，`styles.ts` 按 `data-ico` 做光学校正。`layout.svg` 另外是 package.json `"icon"` 指向的包图标；该目录在 `files` 白名单里随包发布，装包后可以重新构建
- `lib/client.js` —— 构建产物（单文件，`window.__ModuleLoader__.load` 包裹）
- `screenshots/` 与根目录 `screenshots.json` —— 插件市场详情页展示的截图（1-8 张，路径相对 `screenshots.json`，不得以 `/` 开头或含 `..`）。市场直接从仓库读取，不在 `files` 白名单里，不随 npm 包发布
- `test/` —— 三个测试：`smoke.mjs`（无头冒烟）、`navigate.mjs`（设置两步路由行为）、`accept.mjs`（源码形态验收探针）
- `tools/` —— 本地工具：`ts-check.mjs`（用 VS Code 自带的 TypeScript 跑真实类型检查）、`asar-read.mjs`（读 app.asar 内部文件）、`release-notes.mjs`（从 `CHANGELOG.md` 抽指定版本段落，供 CI 建 Release 当说明）
- `.github/workflows/publish.yml` —— 发版自动化：推送 `v*` tag 时构建 → 校验构建产物与源码一致 → 测试 → 发布 npm（Trusted Publishing / OIDC）→ 建同名 GitHub Release（说明取自 CHANGELOG）。npm 上已有该版本则跳过发布，Release 已存在则改写说明，可安全重跑
- `.github/workflows/ci.yml` —— PR 校验：开 PR 或推送 `master` 时跑一遍发版用的同一套闸门（构建 → 语法检查 → 校验已提交的 `lib/client.js` 与源码一致 → 三个测试），再加一次类型检查 `npx -y --package typescript@6.0.3 tsc -p tsconfig.json`（版本与 `tools/ts-check.mjs` 吃的编辑器内置 TS 一致，按需下载，不写进 package.json、不产生锁文件）；只读权限，不发布也不建 Release，同分支的新提交顶掉上一次未跑完的校验
- `README.md` / `README.en.md` —— 中文（默认）/ 英文说明，须与代码保持一致；`CHANGELOG.md` 记录版本变更

## 发版

1. `package.json` 升号；2. `CHANGELOG.md` 新增版本段与底部 `[x.y.z]: …/releases/tag/vx.y.z` 链接定义行；3. `git tag vX.Y.Z` 后推送 tag，其余由 `publish.yml` 完成（tag 名与版本号不一致 CI 直接失败）。

## 构建与测试

```sh
node build.mjs          # 按 BUILD_ORDER 拼接 src/ 为 lib/client.js，并内联 assets/icons/ 图标
node --check lib/client.js
node test/smoke.mjs
node test/navigate.mjs
node test/accept.mjs
```
