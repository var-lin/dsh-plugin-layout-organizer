const PLUGIN_ID = "dsh-plugin-layout-organizer";
const NS = "layout-organizer";
const STORAGE_KEY = "dsh.layout-organizer.state.v5";
const STATE_VERSION = 5;
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
const LAUNCHER_SIDES: string[] = ["left", "right"];
const LAUNCHER_MARGIN = 16;

// `axis` 靠声明不靠测量（单行容器无可测范围）；`nav`：click 临时显现点真按钮，settings 先开设置弹窗。
interface ScopeDef {
  key: string;
  slot: string;
  labelKey: string;
  nav: string;
  axis: string;
  outlet: string;
}

// footer 与 composer 这两个 scope 不画分隔线。
const DIVIDER_SCOPES: string[] = ["sidebar", "tabs", "settings"];

// settings 的行画在设置弹窗（z-index:1000）里，线取 1010：压过对话框、低于 1100 的官方浮层；其余 scope 的线取 90 让对话框盖住。
const DIVIDER_SCOPES_ON_DIALOG: string[] = ["settings"];
const Z_DIVIDER_DIALOG = 1010;

const SCOPES: ScopeDef[] = [
  { key: "sidebar", slot: "sidebar.panellist", labelKey: "scope.sidebar", nav: "click", axis: "y", outlet: '[data-slot="sidebar.panellist"]' },
  { key: "footer", slot: "sidebar.footer.action", labelKey: "scope.footer", nav: "click", axis: "x", outlet: '[data-slot="sidebar.footer.action"]' },
  { key: "tabs", slot: "conversation.view", labelKey: "scope.tabs", nav: "click", axis: "x", outlet: "[data-conversation-tabs]" },
  { key: "composer", slot: "conversation.composer.dock", labelKey: "scope.composer", nav: "click", axis: "x", outlet: '[data-slot="conversation.composer.dock"]' },
  { key: "settings", slot: "settings.section", labelKey: "scope.settings", nav: "settings", axis: "y", outlet: '[data-shortcut-modal="settings"] nav' }
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
// context-meter（用量百分比）与 stats 同属官方停靠行；它不是 slot 记录、没有台账条目（见 SYNTHETIC_IDS），
// 但分类上仍是官方的，两类记录各自收纳、互不牵连。
const OFFICIAL_IDS: Record<string, string[]> = {
  sidebar: ["plugins", "schedules"],
  footer: [],
  tabs: ["chat", "trajectory"],
  composer: ["stats", "context-meter"],
  settings: ["account", "general", "models", "plugins", "agent-presets"]
};

// cordis-panel 从台账这一层就过滤掉。
const HIDDEN_LEDGER_IDS: string[] = ["cordis-panel"];

// 用量百分比不是 slot 记录而是出口的兄弟节点，故合成 id。
const SYNTHETIC_IDS: Record<string, string[]> = {
  composer: ["context-meter"]
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
    // 官方统计药丸自带 data-composer-stats 钩子。
    stats: { selector: "[data-composer-stats]" },
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

// over / overActive 不再写入，但老页面里已写上的标记仍要擦掉，故留在清理名单里。
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
  divider: "lo-divider",
  icon: "lo-navicon"
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

// 分割线取 90：压过页面内容（≤40）、低于弹窗(1000)/菜单；收纳包与右键菜单要盖住弹窗取接近上限，启动器低于收纳包。
const Z_LAUNCHER = 2147483200;
const Z_MASK = 2147483300;
const Z_STASH = 2147483400;
const Z_MENU = 2147483500;
const Z_DIVIDER = 90;