# AGENTS.md

## 工程功能

DSH 客户端插件「插件布局整理」（`dsh-plugin-layout-organizer`）：对 DSH 投放到五处槽位（侧边栏顶部、侧边栏底部、对话标签、输入框停靠行、设置页导航）的插件按钮做**拖拽排序、官方 / 第三方分隔线与按钮收纳**。只改变按钮的显示位置，不改动插件注册表、不卸载也不启停任何插件。

纯 TypeScript 源码，无打包器、无 npm 依赖：构建期按 `build.mjs` 的 `BUILD_ORDER` 清单把 `src/` 拼接成 `lib/client.js`，同时把 `src/` 里的 `@@svg:…@@` 图标占位符替换成 `assets/icons/` 归一化后的 SVG；TS 语法由 Node 自带的 `module.stripTypeScriptTypes` 擦除。包管理器用 pnpm（正常不需要安装任何东西）。

## 关键目录结构

- `src/types/` —— 全局类型：`state.ts`（StateOptions / PluginState / StoreHandle 等）与 `globals.d.ts`（构建前言注入的 `h`、React、各 hook 声明）
- `src/shared/` —— 常量、中英文案、右键菜单图标（`icons.ts`，六个 `@@svg:…@@` 构建占位符）
- `src/core/` —— 状态存储、DOM 行发现 / 分隔线 / 右键菜单 / 投影（设置行自身图标同样是 `@@svg:layout.svg@16@@` 占位符）/ 重新打开、调度中枢
- `src/drag/` —— 指针拖拽控制器
- `src/ui/` —— 样式注入、React 基础控件、配置导入导出（`config-actions.ts`）、设置页、按钮收纳包面板
- `src/main.ts` —— 接线层（注册槽位、快捷键、样式、locale、清理）
- `assets/icons/` —— 从 iconfont 下载的 7 个 SVG 源文件（arrow-up / arrow-down / arrow-left / arrow-right / archive / unarchive / layout），是**构建输入**：`src/` 里的占位符构建时按素材归一化（viewBox 取源文件、宽高默认 14、颜色改 currentColor、补 aria / focusable）成 `<svg>` 内联进 `lib/client.js`；`layout.svg` 另外是 package.json `"icon"` 指向的包图标；该目录在 `files` 白名单里随包发布，装包后可以重新构建
- `lib/client.js` —— 构建产物（单文件，`window.__ModuleLoader__.load` 包裹）
- `test/` —— 三个测试：`smoke.mjs`（无头冒烟）、`navigate.mjs`（设置两步路由行为）、`accept.mjs`（源码形态验收探针）
- `tools/` —— 本地工具：`ts-check.mjs`（用 VS Code 自带的 TypeScript 跑真实类型检查）、`asar-read.mjs`（读 app.asar 内部文件）
- `README.md` / `README.en.md` —— 中文（默认）/ 英文说明，须与代码保持一致；`CHANGELOG.md` 记录版本变更

## 构建与测试

```sh
node build.mjs          # 按 BUILD_ORDER 拼接 src/ 为 lib/client.js，并内联 assets/icons/ 图标
node --check lib/client.js
node test/smoke.mjs
node test/navigate.mjs
node test/accept.mjs
```
