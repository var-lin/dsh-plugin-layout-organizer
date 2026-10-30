const PLUGIN_ID = "dsh-plugin-layout-organizer";
// 设置页大标题右侧展示的版本号。必须与 package.json 的 version 逐字一致——
// test/accept.mjs 会断言两处相等，改版本时忘了同步这里会当场失败，而不是悄悄显示旧号。
const PLUGIN_VERSION = "1.3.0";
const NS = "layout-organizer";
const STORAGE_KEY = "dsh.layout-organizer.state.v5";
const STATE_VERSION = 5;
// 更早版本写过的存档键（每跨一个状态版本多一个）。读不到当前键时按从新到旧逐个试：
// 读得出来就地升级并挪到当前键，免得升级后用户攒的整套顺序凭空消失。
const LEGACY_STORAGE_KEYS: string[] = [];
for (let legacyVersion = STATE_VERSION - 1; legacyVersion >= 1; legacyVersion -= 1) {
  LEGACY_STORAGE_KEYS.push("dsh.layout-organizer.state.v" + legacyVersion);
}
const SELF_ID = "layout-organizer";
const SHORTCUT_ID = "layout-organizer.stash";
// 浮动界面的挂载点，经 portal 画进 <body>。
const OVERLAY_ID = "layout-organizer-overlay";

// 收纳包的排序方式，共三种。
const SORT_MODES: string[] = ["scope", "kind", "alpha"];
const SORT_MODE_KEYS: Record<string, string> = {
  scope: "sort.scope",
  kind: "sort.kind",
  alpha: "sort.alpha"
};

// 启动器贴靠的边：吸附到一侧并保留拖出的纵向偏移。
const LAUNCHER_SIDE_LEFT = "left";
const LAUNCHER_SIDE_RIGHT = "right";
const LAUNCHER_SIDES: string[] = [LAUNCHER_SIDE_LEFT, LAUNCHER_SIDE_RIGHT];
const LAUNCHER_SIDE_DEFAULT = LAUNCHER_SIDE_RIGHT;
const LAUNCHER_MARGIN = 16;
// 启动器夹紧时的三个边缘量：贴边 8 像素、测不到顶部外壳时按 48 计、纵向默认位置在最低点下 24。
const LAUNCHER_EDGE = 8;
const LAUNCHER_TOP_FALLBACK = 48;
const LAUNCHER_FIRST_Y = 24;
// 「拖出页面 / 拖出菜单 / 拖出面板」共用的判定余量：离开目标这么多像素才算要恢复，
// 贴着边缘点按钮时不会误触（三处都吃这一个值，别再各写一份）。
const OUT_MARGIN = 12;
// 手势管线的两个时间 / 距离量，三个拖拽控制器与「更多」菜单共用（定义放在这里，别散落在某个控制器里）。
const LO_DRAG_THRESHOLD = 4;
const LO_CLICK_SUPPRESS_MS = 300;

// `axis` 靠声明不靠测量（单行容器无可测范围）。
interface ScopeDef {
  key: string;
  slot: string;
  labelKey: string;
  axis: string;
  outlet: string;
}

// 哪些 scope 画分隔线。
// footer 与 composer 这两个 scope 不画：它们是贴着输入框的一排小按钮，一条线会横穿输入区。
// 右侧边栏「开始」页（right）照常画：那里是竖排卡片，官方三张在前、第三方在后。
const DIVIDER_SCOPES: string[] = ["sidebar", "tabs", "right", "settings"];

// settings 的行画在设置弹窗（z-index:1000）里，线取 1010：压过对话框、低于 1100 的官方浮层；其余 scope 的线取 90 让对话框盖住。
const DIVIDER_SCOPES_ON_DIALOG: string[] = ["settings"];
const Z_DIVIDER_DIALOG = 1010;

// 「更多」菜单里那道线的开关。它不在页面的六处槽位里，故不混进 DIVIDER_SCOPES
// （那个数组是投影时按轴算线用的），只在设置页的分隔线开关列表里多出一行。
const DIVIDER_MENU_SCOPES: string[] = ["more"];

// 右侧边栏「开始」页的容器选择器：guide 卡片与「更多工具」都挂在它下面（见 collectRightUnits）。
const RIGHT_LIST_SELECTOR = "[data-sidebar-right-guide]";

const SCOPES: ScopeDef[] = [
  { key: "sidebar", slot: "sidebar.panellist", labelKey: "scope.sidebar", axis: "y", outlet: '[data-slot="sidebar.panellist"]' },
  { key: "footer", slot: "sidebar.footer.action", labelKey: "scope.footer", axis: "x", outlet: '[data-slot="sidebar.footer.action"]' },
  { key: "tabs", slot: "conversation.view", labelKey: "scope.tabs", axis: "x", outlet: "[data-conversation-tabs]" },
  { key: "composer", slot: "conversation.composer.dock", labelKey: "scope.composer", axis: "x", outlet: '[data-slot="conversation.composer.dock"]' },
  // 右侧边栏「开始」页那几张卡片不是 slot 记录：它们是各包在 sidebarRightTabs.register 里声明的
  // guide 卡片，宿主按自己的结构画出来（见 collectRightUnits），因此没有台账、也没有可订阅的槽位。
  { key: "right", slot: "", labelKey: "scope.right", axis: "y", outlet: RIGHT_LIST_SELECTOR },
  { key: "settings", slot: "settings.section", labelKey: "scope.settings", axis: "y", outlet: '[data-shortcut-modal="settings"] nav' }
];

const SCOPE_KEYS: string[] = [];
const SLOT_OF_SCOPE: Record<string, string> = {};
const SCOPE_OF_KEY: Record<string, ScopeDef> = {};
const AXIS_OF_SCOPE: Record<string, string> = {};
const OUTLET_OF_SCOPE: Record<string, string> = {};
for (let i = 0; i < SCOPES.length; i++) {
  const scope = SCOPES[i];
  SCOPE_KEYS.push(scope.key);
  SLOT_OF_SCOPE[scope.key] = scope.slot;
  SCOPE_OF_KEY[scope.key] = scope;
  AXIS_OF_SCOPE[scope.key] = scope.axis;
  OUTLET_OF_SCOPE[scope.key] = scope.outlet;
}

// 官方 id 在此显式列出；未列的一律算第三方，可在设置页重新分类。
// 停靠行的官方记录换过一轮身份：旧宿主注册 stats / context-meter，0.2.1 起注册 activity / usage。
// 四个都列进官方，多列一个不存在的 id 不影响判定（kindOf 只是查数组），一份代码覆盖两代宿主。
// context-meter（用量百分比）不是 slot 记录、没有台账条目（见 SYNTHETIC_IDS），
// 但分类上仍是官方的，两类记录各自收纳、互不牵连。
const OFFICIAL_IDS: Record<string, string[]> = {
  sidebar: ["plugins", "schedules", "more"],
  footer: [],
  tabs: ["chat", "trajectory", "more"],
  composer: ["stats", "context-meter", "activity", "usage"],
  // 右侧栏「开始」页的卡片按 tab kind 认身份：files / browser / terminal 来自 DSH 自带的三个包
  // （dsh-client-ui-sidebar-files / -browser / -terminal 各自 sidebarRightTabs.register 的 guide 卡片），
  // 「更多工具」是宿主自画的那颗菜单按钮，其余 kind 都是第三方插件注册的。
  right: ["files", "browser", "terminal", "more"],
  settings: ["account", "general", "models", "plugins", "agent-presets"]
};

// cordis-panel 从台账这一层就过滤掉。
const HIDDEN_LEDGER_IDS: string[] = ["cordis-panel"];

// 能收进官方「更多」菜单的槽位。
//
// 设置行不在其中：设置弹窗里根本没有「更多」，把导航行挪进左侧边栏那扇菜单等于让它在设置页里
// 凭空消失（用户 m02576#2 定的规则）。同理三颗「更多」入口也不收（见 SYNTHETIC_IDS）——
// 不能收的行不问「能不能收」，只在设置页把「进更多」画成禁用态。
const MORE_SCOPES: string[] = ["sidebar", "footer", "tabs", "composer", "right"];

// 每处「更多」菜单的归属：左侧边栏那一处只列它自己顶部与底部的按钮；
// 对话那一处只列对话页顶部标签与输入框下方的行；右侧边栏「开始」页那一处只列它自己的卡片。
// 只有打开「分开收纳」时才按归属分流，否则三处共用一份清单（见 moreScopesIn）。
const MORE_SCOPE_HOME: Record<string, string> = {
  sidebar: "sidebar",
  footer: "sidebar",
  tabs: "conversation",
  composer: "conversation",
  right: "rightbar"
};

// 「更多」菜单的三处容器，值与 MORE_SCOPE_HOME 里的归属一致。
const MORE_REGIONS: string[] = ["sidebar", "conversation", "rightbar"];

// 右侧栏「开始」页那颗「更多工具」的归属键。
//
// 它与左侧栏、对话那两扇用的是同一套分流规则：打开「分开收纳」时只列本处槽位收进来的行
// （右侧边栏「开始」页那几张卡片），关闭时三处共用一份清单。行顺序三处各存各的
// （`moreOrder` 直接按 region 取键，见 moreOrderOf）。
const MORE_REGION_RIGHT = "rightbar";

// 「更多」那颗入口按钮的合成 id（侧边栏、对话标签条、右侧边栏三处各有一颗，
// 它们都不进 slot 台账，id 只能合成）。三颗都登记在 SYNTHETIC_IDS 里：
// 它们自己就是打开那扇菜单的入口，所以永远不进「更多」，投影与菜单都只按 MORE_ID 挡它们
// （同表里的输入框读数条是正常行，收得进「更多」）。
const MORE_ID = "more";

// 用量百分比不是 slot 记录而是出口的兄弟节点，故合成 id。
// 侧边栏的「更多」同理：它没有 panellist 出口，官方把菜单按钮包进 moreAnchor 包裹层（见 collectSidebarUnits）。
// 右侧边栏「开始」页的「更多工具」也一样：它是那扇菜单自己的入口，不能收进自己（见 more-menu 的进更多判据）。
// 对话页标签条那颗「更多」（三个点）同理：它画在标签条容器的兄弟位置上（见 tabMoreRow），
// 同样是把标签收进自己那扇菜单的入口，不能收进自己。
const SYNTHETIC_IDS: Record<string, string[]> = {
  composer: ["context-meter"],
  right: [MORE_ID],
  sidebar: [MORE_ID],
  tabs: [MORE_ID]
};

// 一条记录的 DOM 认领钩子：正证据，命中即认领，不参与按位置猜。
interface RowHook {
  // 只匹配这条记录渲染出来的根元素的选择器。
  selector: string;
  // 台账没给文案时拿来显示的稳定名字；钩子文案不参与按文字配对。
  label?: string;
}

// 只给「按位置猜会猜错」的 scope 声明：输入框停靠行里有整条渲染成 null 的记录（供应商未登录、
// 额度读数没开时的统计行），于是记录数与屏幕元素数对不上，按位置兜底会把身份错配给另一个插件。
const ROW_HOOKS: Record<string, Record<string, RowHook>> = {
  composer: {
    // 官方药丸的钩子。旧宿主把统计与用量合成一条、属性是复数 data-composer-stats；
    // 0.2.1 起拆成 activity / usage 两条、属性改成单数 data-composer-stat="<id>"。
    // 两代选择器并存：各自只在自己那代宿主上命中，互不误伤。
    stats: { selector: "[data-composer-stats]" },
    activity: { selector: '[data-composer-stat="activity"]' },
    usage: { selector: '[data-composer-stat="usage"]' },
    // token-saver 的条子：台账没有文案，显示名取它在界面上的品牌字样。
    "save-token-strip": { selector: ".st-strip", label: "token-saver" },
    // 两家供应商的额度读数：各有一个稳定的根类名，没渲染时钩子什么也匹配不到。
    "dsh-connect-trae-stats-points": { selector: ".dsm-trae-composer-points", label: "Trae" },
    "dsh-connect-workbuddy-stats-credits": { selector: ".dsm-workbuddy-composer-credits", label: "WorkBuddy" }
  }
};

/**
 * 取某条记录在本 scope 的认领钩子。
 *
 * @param scope scope 键。
 * @param id 记录 id。
 * @returns 声明过的钩子；没声明时返回 null。
 */
function rowHookOf(scope: string, id: string): RowHook | null {
  const table = ROW_HOOKS[scope];
  if (!table) return null;
  return table[id] || null;
}

// 宿主既没给台账文案、屏幕上又只有一串读数（药丸上写着「12.3K tokens」这类动态内容）的记录，
// 由插件补一个稳定名字。值是 locale 词条名，不是 id 的中文直译。
// 台账真给了文案时仍以台账为准（见 rowDisplayLabel）。
const ROW_LABELS: Record<string, Record<string, string>> = {
  composer: {
    activity: "row.activity",
    usage: "row.usage",
    "context-meter": "row.context-meter"
  },
  // 「更多」的文案由宿主给（panels.more），这里只补语言没跟上、或那一行当前不在屏幕上时的稳定名字。
  sidebar: {
    more: "row.more"
  },
  tabs: {
    more: "row.more"
  },
  right: {
    more: "row.more"
  }
};

/**
 * 取某条记录在插件里指定的显示名。
 *
 * @param scope scope 键。
 * @param id 记录 id。
 * @returns 当前语言下的名字；没指定时返回空字符串，由调用方继续往后退。
 */
function rowLabelOf(scope: string, id: string): string {
  const table = ROW_LABELS[scope];
  if (!table) return "";
  const key = table[id];
  return key ? t(key) : "";
}

// 写在受管行上的属性名集中在一处：每个标记在 `applyScope` 设置、`clearMarks` 清除，样式表只针对这些属性。
const MARKS = {
  row: "data-lo-row",
  scope: "data-lo-scope",
  id: "data-lo-id",
  kind: "data-lo-kind",
  hidden: "data-lo-hidden",
  drag: "data-lo-draggable",
  dragging: "data-lo-dragging",
  over: "data-lo-over",
  overActive: "data-lo-over-active"
};

// overActive 不再写入，但老页面里已写上的标记仍要擦掉，故留在清理名单里（over 仍在用）。
const MARK_NAMES: string[] = [
  MARKS.row, MARKS.scope, MARKS.id, MARKS.kind, MARKS.hidden,
  MARKS.drag, MARKS.dragging, MARKS.over, MARKS.overActive
];

// pop 一族照搬官方菜单的结构（面板 / 材质层 / 视口 / 包裹 / 菜单项 / 图标 / 文字）。
const CLASS = {
  pop: "lo-pop",
  popMaterial: "lo-pop-material",
  popViewport: "lo-pop-viewport",
  popWrap: "lo-pop-wrap",
  popItem: "lo-pop-item",
  popIcon: "lo-pop-icon",
  popText: "lo-pop-text",
  divider: "lo-divider"
};

// 翻译与告警上报放 bundle 作用域，用访问函数包住 let 绑定。
let __translator: (key: string) => string = function (key: string) {
  return key;
};
let __reporter: (message: string, error?: unknown) => void = function () {};

/**
 * 取当前 locale 词条；没有注入翻译器时原样返回 key。
 *
 * @param key locale 词条名。
 * @returns 当前语言下的文案。
 */
function t(key: string): string {
  return __translator(key);
}

/**
 * 注入翻译器，由接线层在注册 locale 之后调用。
 *
 * @param fn 把 locale 词条名翻成当前语言的函数。
 */
function setTranslator(fn: (key: string) => string): void {
  __translator = fn;
}

/**
 * 通过注入的上报器记一条告警；未注入时静默丢弃。
 *
 * @param message 告警正文。
 * @param error 可选的异常对象，交给上报器决定怎么呈现。
 */
function warn(message: string, error?: unknown): void {
  __reporter(message, error);
}

/**
 * 注入告警上报器，由接线层在启动时调用。
 *
 * @param fn 接收告警正文与可选异常的函数。
 */
function setReporter(fn: (message: string, error?: unknown) => void): void {
  __reporter = fn;
}

/**
 * 把抛出物转成一句能拼进告警正文的文本。
 *
 * 宿主可能抛 `Error`、也可能抛字符串甚至对象；有 `message` 就用它，否则退到 `String()`。
 *
 * @param error 捕获到的抛出物。
 * @returns 可读的告警片段。
 */
function errText(error: unknown): string {
  return error && (error as Error).message ? (error as Error).message : String(error);
}

// 分割线取 90：压过页面内容（≤40）、低于弹窗(1000)/菜单；收纳包与右键菜单要盖住弹窗取接近上限，启动器低于收纳包。
const Z_LAUNCHER = 2147483200;
const Z_MASK = 2147483300;
const Z_STASH = 2147483400;
const Z_MENU = 2147483500;
const Z_DIVIDER = 90;