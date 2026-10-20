// 图标不手写路径：下面 13 个常量的值是构建占位符（双引号里写 @@svg 后接文件名再 @@），`node build.mjs` 会把每个占位符换成 assets/icons/ 里对应 SVG 归一化后的完整 <svg> 文档（viewBox 取源文件、宽高取占位符 @ 后面的数字，缺省 14、颜色归一为 currentColor、path 数据原样、保留 aria-hidden/focusable）；素材缺失、文件为空或不含 path、占位符没被替换干净，构建都会报错退出。
var MENU_ICON_UP = "@@svg:arrow-up.svg@@";
var MENU_ICON_DOWN = "@@svg:arrow-down.svg@@";
var MENU_ICON_LEFT = "@@svg:arrow-left.svg@@";
var MENU_ICON_RIGHT = "@@svg:arrow-right.svg@@";
var MENU_ICON_ARCHIVE = "@@svg:archive.svg@@";
var MENU_ICON_UNARCHIVE = "@@svg:unarchive.svg@@";
// 改判官方 / 第三方的双向箭头：画布几乎顶满（与导出、导入同档），样式表按 data-ico 缩放让一排图标光学等高。
var MENU_ICON_SWITCH = "@@svg:switch.svg@14@@";
// 标题行的四个动作按钮共用 16px 图标：素材自身留白各不相同（导出 / 导入几乎顶满画布、GitHub 约 86%、
// 问题反馈约 82%），逐个按实测占空比缩放到同一视觉高度，缩放规则在 styles.ts 的 data-ico 段。
var ACTION_ICON_EXPORT = "@@svg:export.svg@16@@";
var ACTION_ICON_IMPORT = "@@svg:import.svg@16@@";
var ACTION_ICON_GITHUB = "@@svg:github.svg@16@@";
var ACTION_ICON_FEEDBACK = "@@svg:feedback.svg@16@@";
// 搜索行的小图标：放大镜与清除都比标题行的动作图标小一号，颜色跟随所在元素的 currentColor。
var UI_ICON_SEARCH = "@@svg:search.svg@13@@";
var UI_ICON_CLOSE = "@@svg:close.svg@12@@";
