// 图标不手写路径：下面 6 个常量的值是构建占位符（双引号里写 @@svg 后接文件名再 @@），`node build.mjs` 会把每个占位符换成 assets/icons/ 里对应 SVG 归一化后的完整 <svg> 文档（viewBox 取源文件、宽高固定 14、颜色归一为 currentColor、path 数据原样、保留 aria-hidden/focusable）；素材缺失、文件为空或不含 path、占位符没被替换干净，构建都会报错退出。
var MENU_ICON_UP = "@@svg:arrow-up.svg@@";
var MENU_ICON_DOWN = "@@svg:arrow-down.svg@@";
var MENU_ICON_LEFT = "@@svg:arrow-left.svg@@";
var MENU_ICON_RIGHT = "@@svg:arrow-right.svg@@";
var MENU_ICON_ARCHIVE = "@@svg:archive.svg@@";
var MENU_ICON_UNARCHIVE = "@@svg:unarchive.svg@@";
