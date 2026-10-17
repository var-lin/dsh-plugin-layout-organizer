# 变更日志

本项目的所有重要变更都记录在这里。
格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [Semantic Versioning](https://semver.org/spec/v2.0.0.html)。

## [1.2.0] - 2026-10-17

### 新增

- **支持范围下探到 `0.1.7-rc.2`**：`engines.dsh` 从 `>=0.2.0-rc.2` 放宽为 `>=0.1.7-rc.2`，四条宿主 peer 同步放宽为 `>=0.1.7-rc.2 <0.3.0-0`。从 `0.1.7-rc.2` 起的每个 `0.1.x`、`0.2.x` 构建——含 `0.2.1-rc.1` / `0.2.1-rc.2` 与 `0.2.1` 正式版——现在装的是同一份包，不需要为版本切换装不同版本。
- **设置页顶部分页导航**：从原来一整列长页面改成「位置管理」与「通用设置」两页——位置管理放收纳包入口与五张位置卡片，通用设置放各项开关与快捷键编辑器。点击只渲染当前那一页，切换时搜索词保留；默认落在位置管理。
- **搜索**：位置管理页与按钮收纳包顶部各有一个搜索框，按按钮名称或 id 实时过滤。整张卡片都不匹配时卡片一起让位，清空（输入框右侧的 ×）即恢复全部，空结果显示提示而不是留白。
- **问题反馈按钮**：标题行新增「问题反馈」，指向仓库的 Issues 页面，与导出 / 导入 / GitHub 并排。
- **标题行四个动作按钮的图标**：导出、导入、GitHub、问题反馈都从 `assets/icons/` 取图（新增 `export.svg` / `import.svg` / `github.svg` / `feedback.svg` 四份素材，共 11 个），尺寸 16，并按素材画布留白用 `data-ico` 做光学校正，让一排按钮的图标看起来等高。

### 变更

- **按钮收纳包改为固定尺寸**：宽 `min(520px, 92vw)`、高 `min(720px, 84vh)`，标题、搜索、排序与「全部恢复」固定，只有列表区滚动——列表再长也不会把面板撑出屏幕。固定高度同时要求子元素按内容定高：`.lo-page`、`.lo-scroll`、`.lo-card-body`、`.lo-rows`、`.lo-stash-body` 五处滚动区都显式 `flex:0 0 auto`，只让 `.lo-tabpane` 用 `flex:1 1 auto` 吃掉剩余高度，否则卡片会被挤成「只剩卡片头」；`test/accept.mjs` 增第 16 条探针钉住这几条规则。
- **设置页拆成多个文件**：`ui/settings-page.ts` 只保留外壳与分页装配，单张位置卡片移到 `ui/scope-card.ts`、快捷键编辑器移到 `ui/shortcut-card.ts`、搜索框移到 `ui/search.ts`，并全部登记进 `build.mjs` 的 `BUILD_ORDER`。
- **批量操作加二次确认，单行操作不加**：「全部恢复」「恢复本组」「重置所有配置」「导入」改为点两次才执行（3 秒内没有再点就自动还原）；单行恢复、上移 / 下移、切换官方 / 第三方、收纳、导出、GitHub 跳转仍然一点即生效。按钮在变为禁用时自动卸膛，避免「看不见的已上膛」在条件恢复后一点即执行。
- **收纳包行内的「恢复」不再换行**：按钮 `white-space:nowrap` 且不参与收缩，名字过长时只让名字打点，不再把「恢复」压成竖排。

### 兼容性

- **代码未改一行，这是本次适配的结论而不是省略。** 在 `0.1.7-rc.2`、`0.2.0-rc.1`、`0.2.0-rc.2`、`0.2.1-rc.1`、`0.2.1-rc.2` 五个版本上（直接读 npm 上各包 `lib/client.js`）逐个核对，确认本插件依赖的契约在整条 rc 线上同形：`ctx.slots` 的 `register` / `inject` / `entries` / `entriesOfSlot` / `subscribe` / `getVersion` 成员与语义未变；`locale` 服务名始终是 `"locale"`（该包五版逐字节相同）；`shortcuts.register` 的签名与重复 id 报错串 `Duplicate shortcut command: ` 未变；`shell.overlay`、`settings.section`、`plugins.detail.section` 三个声明未变；五个 scope 的出口与 DOM 收集路径未变（`[data-conversation-tabs]` 自 `0.1.7-rc.1` 起、`[class*='panelList']` 自 `0.1.5-alpha.2` 起、`data-shortcut-modal` 自 `0.1.7-rc.2` 起、`data-composer-dock` 自 `0.2.1` 起——后两者缺席的版本上，本插件走的是不依赖它们的选择器）。
- **官方药丸只在 `0.2.1` 那一档换过一次形态**，1.1.0 已经把两代（复数 `data-composer-stats` 与单数 `data-composer-stat="activity"` / `"usage"`）并列进 `ROW_HOOKS`，本次无需再动；`0.1.7-rc.2` 到 `0.2.0-rc.2` 用的是旧形态，落在已有的 `stats` 钩子上。`0.2.1-alpha.1`…`alpha.5` 也已抽查：单数钩子与 `activity` / `usage` 两个 id 从 `alpha.1` 起就与 `rc.2` 一致，没有第三套形态。
- **下限为什么是 `0.1.7-rc.2`**：这是三件事同时成立的最早版本——`shortcuts` 包首次发布（更早的宿主装不上声明了该 peer 的包）、`settings.section` 的导航可被 `data-shortcut-modal` 正证据认领、`conversation.view` 的标签条带 `data-conversation-tabs`。再往前（`0.1.5` 及更早）面板列表与标签条缺少稳定锚点，需要另写一套按位置的收集逻辑，不在本次范围内。

## [1.1.0] - 2026-10-17

### 新增

- **适配 DSH 0.2.1**：对话输入框停靠行的官方记录在新宿主里换了一轮身份——旧宿主注册 `stats` 与 `context-meter`，0.2.1 起改注册 `activity`（性能读数）与 `usage`（用量读数），DOM 钩子也从复数的 `data-composer-stats` 变成单数的 `data-composer-stat="activity"` / `"usage"`。不跟进的话，两个官方药丸会被判成第三方（分类、按种类排序、拖拽开关连带失准），正证据认领也打不中，于是退到按位置兜底——而这两条恰好都会整条渲染成 `null`，记录数与元素数不等时配对直接放弃，设置页与收纳包里就会留下有台账、没元素的幻影条目。
- 官方 id 白名单与认领钩子改为**新旧并存**：`composer` 同时列出 `stats`、`context-meter`、`activity`、`usage`，钩子同时声明 `[data-composer-stats]` 与 `[data-composer-stat="activity"]`／`[data-composer-stat="usage"]`。多列一个在当轮宿主上不存在的 id 不影响判定（分类只查数组），两代选择器也各自只在自己那代宿主上命中，互不误伤。

### 兼容性

- 一份代码同时认两代宿主：`0.2.0-rc.2` 到 `0.2.1-rc.1` 的每个 `0.2.x` 构建都在支持范围内，不需要为版本切换装不同包。宿主的兼容闸门在插件声明了 `engines.dsh` 时**只看这一条**（peer 范围被忽略），而当前范围 `>=0.2.0-rc.2` 已含 `0.2.1-rc.1`，安装侧无需改动。
- 其余契约实测未变，未作改动：五个 scope 的出口与 DOM 收集路径、`ctx.slots` 的 `register` / `inject` / `entries` / `entriesOfSlot` / `subscribe` / `getVersion`、`locale` 服务名、`shortcuts.register` 签名与重复 id 报错串、`shell.overlay` 与 `plugins.detail.section` 声明，以及三条第三方停靠行钩子（`.st-strip`、`.dsm-trae-composer-points`、`.dsm-workbuddy-composer-credits`）。

## [1.0.1] - 2026-10-16

### 修复

- **对话输入框停靠行的身份错配**：停靠行台账里有记录、但组件在开关关闭时整条渲染成 `null`（供应商未登录时的统计读数），于是「记录数 ≠ 屏幕元素数」时按位置兜底配对会把 token-saver 的条子认成别的插件记录。现在这类记录按正证据认领（官方统计的 `data-composer-stats` 钩子、token-saver 的 `.st-strip` 类名），**数量不相等时不再按位置猜**；设置页与按钮收纳包只列屏幕上真实存在的行，渲染成空的那两条不再出现、不再抢名字。
- **收纳官方统计与用量百分比不再互相牵连**：删掉 `LINKED_HIDE` 级联表，官方统计（`stats`）与 7% 用量百分比（`context-meter`）各自收纳、各自恢复；用量百分比分类归官方。

## [1.0.0] - 2026-10-15

首个公开发布。

### 新增

- 五处位置（`sidebar.panellist`、`sidebar.footer.action`、`conversation.view`、`conversation.composer.dock`、`settings.section`）的插件按钮拖拽排序。
- 官方 / 第三方分隔线与分组主序排序：总开关 + 三个位置子开关（侧边栏顶部、对话标签、设置导航），页脚与输入框停靠行永远不画；混合排序下两类按钮真正交错时整条线收起。
- **按钮收纳包**：右键菜单（上移 / 下移 / 收纳，样式对齐 DSH 官方菜单——同款半透明底 `--dsw-menu-surface-fill` + `backdrop-filter`、`--dsw-elevation-prominent` 细描边、12px 圆角、34px 行高、14px 图标列、11px 快捷键提示；图标取自 `assets/icons/` 的 iconfont 素材，构建时归一化内联，客户端包无法 import 官方图标包）或设置页行按钮隐藏按钮，插件不卸载、随时可恢复；悬浮启动器可拖到任意位置，松手吸附到较近的左 / 右边缘并保留纵向位置；三种排序（按页面 / 按分类 / 按名称）与「全部恢复」；条目可点击跳回原按钮（设置页、侧边栏面板、底部图标、对话标签），行缺失时改为「打开对应页面」；快捷键（桌面端默认 `Ctrl/Cmd + Shift + O`，网页端 Windows / macOS 为 `Ctrl/Cmd + Shift + Alt + O`、Linux 为 `Ctrl/Cmd + Shift + ,`）可在设置里重绑，冲突或不可用组合有文字警告。
- **「允许官方和第三方混合排序」**（默认开启，挂在「允许拖动官方按钮」下的子开关）：`mixedOrder()` 成为投影、拖拽、上下移与右键菜单的统一谓词——开启时 `reconcileOrder()` 保留保存顺序原样而非强制官方在前，拖拽引擎把所有行放进同一组、第三方可落到两条官方按钮之间，分隔线在真正交错时收起。
- **分组开关联动**：「允许拖动官方按钮」「显示官方 / 第三方分隔线」各带可折叠子行（混合排序、三个分隔线位置），点击行本身切换而箭头原地旋转 180°；总开关只写自己，子开关位置不动，`mixedOrder()` / `dividerEnabled()` 用 AND 取效；总开关关闭时子行 `opacity:.5` 但仍可点击——点击视为「我要用这一路」，点亮该路并连带打开总开关（行上带 `data-gated`）。
- **导出 / 导入配置与仓库链接**：标题行的「导出配置」把全部持久化状态写成 JSON 文件；「导入配置」读回并整体替换，`version` 与当前 schema 不符的文件整体拒绝，不会半套用；GitHub 按钮打开项目仓库。
- **两步确认重置**：「恢复本组默认顺序」与「重置所有配置」以 `ConfirmBtn` 呈现——首点只进入武装态（标签变为「再点一次确认」），三秒内再点才执行，超时自动复原。
- **折叠状态跨刷新记住**：「有下属行」两行的展开 / 折叠状态存进持久化 `options.collapsed`，缺键仍表示展开。
- 本插件自己的设置入口（设置导航中的「插件布局整理」一行）同样可拖动、可收纳；设置页同时注册在设置导航与本插件的插件管理器详情面板。
- 本地化（简体中文 / 英文），经由 DSH 客户端 locale 服务提供。

### 兼容性

- 要求 DSH `>=0.2.0-rc.2`。声明的宿主 peer 范围覆盖整个 `0.2.x` 发布线，`0.2.0-rc.2` 与之后的每个 `0.2.x` 构建都被接受。

### 已知限制

- 排序与隐藏作用在 DOM 层，不修改 DSH 插件注册表；DSH 界面大改后可能需要跟进适配。
- 官方 / 第三方分类依赖内置 id 白名单，因为槽位条目没有可靠的来源字段；任何行都可以在设置页手动改判。
- 「收纳」不是卸载；被收纳的按钮只是隐藏，其插件仍在运行。

[1.2.0]: https://github.com/var-lin/dsh-plugin-layout-organizer/releases/tag/v1.2.0
[1.1.0]: https://github.com/var-lin/dsh-plugin-layout-organizer/releases/tag/v1.1.0
[1.0.1]: https://github.com/var-lin/dsh-plugin-layout-organizer/releases/tag/v1.0.1
[1.0.0]: https://github.com/var-lin/dsh-plugin-layout-organizer/releases/tag/v1.0.0
