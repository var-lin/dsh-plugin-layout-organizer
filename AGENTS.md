# AGENTS.md

## 工程功能

DSH 客户端插件「插件布局整理」（`dsh-plugin-layout-organizer`）：对 DSH 投放到五处槽位（侧边栏顶部、侧边栏底部、对话标签、输入框停靠行、设置页导航）的插件按钮做**拖拽排序、官方 / 第三方分隔线与两级收纳（「进更多」挪进宿主的「更多」菜单、「收起」挪进「已收起的按钮」）**，左侧栏、右侧栏与对话页「更多」菜单里的按钮同样可以整理。只改变按钮的显示位置，不改动插件注册表、不卸载也不启停任何插件。

纯 TypeScript 源码，无打包器、无 npm 依赖：构建期按 `build.mjs` 的 `BUILD_ORDER` 清单把 `src/` 拼接成 `lib/client.js`，同时把 `src/` 里的 `@@svg:…@@` 图标占位符替换成 `assets/icons/` 归一化后的 SVG；TS 语法由 Node 自带的 `module.stripTypeScriptTypes` 擦除。包管理器用 pnpm（正常不需要安装任何东西）。

## 关键目录结构

- `src/types/` —— 全局类型：`state.ts`（StateOptions / PluginState / StoreHandle 等）与 `globals.d.ts`（构建前言注入的 `h`、React、各 hook 声明）
- `src/shared/` —— 常量（`constants.ts` 里的 `PLUGIN_VERSION` 是设置页大标题右侧展示的版本号，必须与 `package.json` 的 `version` 逐字一致，`test/accept.mjs` 第 23 条断言两处相等）、中英文案、图标占位符（`icons.ts`：七个右键菜单图标 + 四个标题行动作图标 + 两个搜索行图标 + 一个「出更多」动作图标的 `@@svg:…@@` 构建占位符）。`constants.ts` 另有两张按 id 查的表：`ROW_HOOKS`（DOM 认领钩子，把台账记录认到具体元素上；声明过钩子的记录不参与按位置兜底）、`ROW_LABELS`（宿主没给文案时的显示名，如输入框停靠行的 activity / usage / context-meter）；还有三张「更多」相关的表：`MORE_SCOPES`（能收进「更多」的五处槽位）、`MORE_SCOPE_HOME`（每处槽位归哪扇菜单：侧边栏顶部、底部与设置页导航归 `sidebar`，对话标签与停靠行归 `conversation`）、`MORE_REGION_ALL`（右侧栏「开始」页那颗「更多工具」的归属，不参与分流、永远列全部，见 `moreScopesIn`）
- `src/core/` —— 状态存储、DOM 行发现 / 分隔线 / 右键菜单 / 投影（设置行自身图标同样是 `@@svg:layout.svg@16@@` 占位符）/ 重新打开、插件图标查询（`plugin-icons.ts`）、调度中枢。投影每轮把真正标记到的行记进 `liveRows`（`dom-rows.ts`），五处槽位一律只列这些行——`listedInScope` 是唯一判据：台账里有记录、这一轮却没能标记到元素的，不列；整条位置当前不在屏幕上时，对应卡片就是空的，不退守台账。输入框停靠行里渲染成空的台账记录靠 `ROW_HOOKS`（`shared/constants.ts`）认领，不按位置猜。「更多」菜单读哪几处槽位由 `store.ts` 的 `moreScopesIn` 决定：开「分开收纳」时按 `MORE_SCOPE_HOME` 分流，右侧栏那处（`MORE_REGION_ALL`）例外、永远列全部；行顺序按 `moreOrderRegion(region)` 取键，右侧栏与左侧栏共用同一份 `moreOrder`
- `src/drag/` —— 指针拖拽控制器：`drag-rows.ts` 管 DSH 各槽位的按钮行、`drag-list.ts` 管本插件自己的设置页与「已收起的按钮」列表，两者共用的手势管线抽在 `drag-frame.ts`（一帧最多重算一次的重算节流，加一组固定在 capture 阶段的监听——document 上的指针四件套与 click，外加 window 的 scroll、按行排的那套再加 resize）
- `src/ui/` —— 样式注入、React 基础控件（`kit.ts`，含 `Icon`；`Card` 的标题行带可选 `action` 槽，卡片级动作挂这里而不是卡片底部）、搜索框（`search.ts`）、配置导入导出（`config-actions.ts`）、设置页外壳（`settings-page.ts`，顶部分页导航）与拆出的单张位置卡片（`scope-card.ts`，导出 `scopeHit` 供外壳算「整页都没命中」；点卡片标题折叠整个大类，小三角在标题行最右端、动作区之后；行名称区包成 `.lo-row-open` 按钮，按 `rowNavigable` 决定能否点击跳转）、快捷键编辑器（`shortcut-card.ts`）、「已收起的按钮」面板（`stash.ts`，分组标题行右侧依次是组级恢复与折叠小三角、点标题折叠该组，按名称排序时没有标题也就不折叠；每行的灰色标签是插件 id；每行按界面真实可点击性（`rowNavigable`）决定能否导航，点不动的行灰置且不关面板）。两处的折叠状态都存在 `state.options.collapsed`（键前缀分别是 `card:` 与 `stash:`，用 kind / scope 这类稳定键而不是标题文案）；搜索时照旧可折叠，搜索词不会把卡片或分组强行拉开；「更多」菜单里的行由 `more-menu.ts` 画（注册进宿主的 `sidebar.panellist.actions`（左侧栏「更多」）、`sidebar.right.tab.guide.actions`（右侧栏「开始」页的「更多工具」）与 `conversation.session.header.views.actions`（对话顶部「…」）三个槽位，菜单行用自己的 `data-lo-more-*` 属性而不冒充投影标记——否则会被当成幽灵行清掉；宿主自画的两项动作（浏览更多插件 / 创建你的插件）不参与整理，原样留给宿主；手势在 window 的 capture 阶段拦下，否则宿主的「点外面就关」会先一步把菜单关掉）
- `src/main.ts` —— 接线层（注册槽位、快捷键、样式、locale、清理）
- `assets/icons/` —— 从 iconfont 下载的 15 个 SVG 源文件（菜单用 arrow-up / arrow-down / arrow-left / arrow-right / archive / unarchive / switch / layout，标题行用 export / import / github / feedback，搜索行用 search / close，「出更多」动作用 more-out），是**构建输入**：`src/` 里的占位符构建时按素材归一化（viewBox 取源文件、宽高默认 14、占位符可指定尺寸——标题行四个动作图标为 16、搜索行两个为 13 与 12、颜色改 currentColor、补 aria / focusable）成 `<svg>` 内联进 `lib/client.js`；动作素材画布留白差别大，`styles.ts` 按 `data-ico` 做光学校正。`layout.svg` 另外是 package.json `"icon"` 指向的包图标；该目录在 `files` 白名单里随包发布，装包后可以重新构建
- `lib/client.js` —— 构建产物（单文件，`window.__ModuleLoader__.load` 包裹）
- `screenshots/` 与根目录 `screenshots.json` —— 插件市场详情页展示的截图（1-8 张，路径相对 `screenshots.json`，不得以 `/` 开头或含 `..`）。市场直接从仓库读取，不在 `files` 白名单里，不随 npm 包发布
- `test/` —— 三个测试：`smoke.mjs`（无头冒烟）、`navigate.mjs`（设置两步路由行为）、`accept.mjs`（源码形态验收探针）
- `tools/` —— 本地工具：`ts-check.mjs`（用 VS Code 自带的 TypeScript 跑真实类型检查）、`asar-read.mjs`（读 app.asar 内部文件）、`release-notes.mjs`（从 `CHANGELOG.md` 抽指定版本段落，供 CI 建 Release 当说明）
- `.github/workflows/publish.yml` —— 发版自动化：推送 `v*` tag 时构建 → 校验构建产物与源码一致 → 测试 → 发布 npm（Trusted Publishing / OIDC）→ 建同名 GitHub Release（说明取自 CHANGELOG）。npm 上已有该版本则跳过发布，Release 已存在则改写说明，可安全重跑
- `.github/workflows/ci.yml` —— PR 校验：开 PR 或推送 `master` 时跑一遍发版用的同一套闸门（构建 → 语法检查 → 校验已提交的 `lib/client.js` 与源码一致 → 三个测试），再加一次类型检查 `npx -y --package typescript@6.0.3 tsc -p tsconfig.json`（版本与 `tools/ts-check.mjs` 吃的编辑器内置 TS 一致，按需下载，不写进 package.json、不产生锁文件）；只读权限，不发布也不建 Release，同分支的新提交顶掉上一次未跑完的校验
- `README.md` / `README.en.md` —— 中文（默认）/ 英文说明，须与代码保持一致；`CHANGELOG.md` 记录版本变更

## 发版

1. `package.json` 升号；2. `CHANGELOG.md` 新增版本段与底部 `[x.y.z]: …/releases/tag/vx.y.z` 链接定义行；3. `git tag vX.Y.Z` 后推送 tag，其余由 `publish.yml` 完成（tag 名与版本号不一致 CI 直接失败）。

版本段头的 `## [x.y.z] - YYYY-MM-DD` 写的是**发布日**，不是开写日：`CHANGELOG.md` 里这个日期只在推 tag 那一刻定稿，之前写下的日期在发布前改成当天。

## 已知问题

- **Trae / WorkBuddy 的额度读数被归到「对话输入框停靠行」（bug，1.2.1 及更早版本）**：这两个插件（`dsh-connect-trae-stats-points`、`dsh-connect-workbuddy-stats-credits`）登记在 `conversation.composer.dock` 槽位，实际却渲染在对话框里（`conversation.input.left`），不属于底部停靠行。修法是按机制判、不点名：五处槽位只列这一轮投影真正标记到的行（`listedInScope`，`dom-rows.ts`），而 `pairRows` 第 3 步按位置兜底时跳过声明过 `ROW_HOOKS` 的记录——这两条记录在停靠行容器里认不到元素，于是既不出现在卡片里、也不会留下可恢复的影子行；同一规则自动覆盖以后「注册在此、渲染别处」的插件。**对话框内插件的隐藏与收起尚未实现**——要支持得先摸清它们在对话框里的容器与稳定认领方式；将来它们若真的回到停靠行，投影自然标记得到，无需再改任何名单。

## 构建与测试

运行环境要求 **Node.js `>=24`**（`package.json` 的 `engines.node`；构建依赖 Node 自带的 `module.stripTypeScriptTypes`，两个 GitHub 工作流也都固定 Node 24）。

```sh
node build.mjs          # 按 BUILD_ORDER 拼接 src/ 为 lib/client.js，并内联 assets/icons/ 图标
node --check lib/client.js
node test/smoke.mjs
node test/navigate.mjs
node test/accept.mjs
```
