/* dsh-plugin-layout-organizer — GENERATED FILE. Edit the TypeScript under src/ and run `node build.mjs`. */
window.__ModuleLoader__.load({
  id: "dsh-plugin-layout-organizer",
  factory: function (require) {
    var React = require("react");
    var ReactDOM = require("react-dom");
    var h = React.createElement;
    var useState = React.useState;
    var useEffect = React.useEffect;
    var useRef = React.useRef;
    var useMemo = React.useMemo;
    var useCallback = React.useCallback;

// src/types/state.ts
function shortcutIds(shortcuts) {
    const out = [];
    try {
        if (shortcuts.catalog && typeof shortcuts.catalog.getSnapshot === "function") {
            const rows = shortcuts.catalog.getSnapshot() || [];
            for(let i = 0; i < rows.length; i++)out.push(String(rows[i].id));
            return out;
        }
    } catch (err) {}
    try {
        if (shortcuts.registry && typeof shortcuts.registry.definitions === "function") {
            const rows = shortcuts.registry.definitions() || [];
            for(let i = 0; i < rows.length; i++)out.push(String(rows[i].id));
            return out;
        }
    } catch (err) {}
    return null;
}

// src/shared/constants.ts
const PLUGIN_ID = "dsh-plugin-layout-organizer";
const PLUGIN_VERSION = "1.2.4";
const NS = "layout-organizer";
const STORAGE_KEY = "dsh.layout-organizer.state.v5";
const STATE_VERSION = 5;
const SELF_ID = "layout-organizer";
const SHORTCUT_ID = "layout-organizer.stash";
const OVERLAY_ID = "layout-organizer-overlay";
const SORT_MODES = [
    "scope",
    "kind",
    "alpha"
];
const SORT_MODE_KEYS = {
    scope: "sort.scope",
    kind: "sort.kind",
    alpha: "sort.alpha"
};
const LAUNCHER_SIDES = [
    "left",
    "right"
];
const LAUNCHER_MARGIN = 16;
const DIVIDER_SCOPES = [
    "sidebar",
    "tabs",
    "settings"
];
const DIVIDER_SCOPES_ON_DIALOG = [
    "settings"
];
const Z_DIVIDER_DIALOG = 1010;
const SCOPES = [
    {
        key: "sidebar",
        slot: "sidebar.panellist",
        labelKey: "scope.sidebar",
        nav: "click",
        axis: "y",
        outlet: '[data-slot="sidebar.panellist"]'
    },
    {
        key: "footer",
        slot: "sidebar.footer.action",
        labelKey: "scope.footer",
        nav: "click",
        axis: "x",
        outlet: '[data-slot="sidebar.footer.action"]'
    },
    {
        key: "tabs",
        slot: "conversation.view",
        labelKey: "scope.tabs",
        nav: "click",
        axis: "x",
        outlet: "[data-conversation-tabs]"
    },
    {
        key: "composer",
        slot: "conversation.composer.dock",
        labelKey: "scope.composer",
        nav: "click",
        axis: "x",
        outlet: '[data-slot="conversation.composer.dock"]'
    },
    {
        key: "settings",
        slot: "settings.section",
        labelKey: "scope.settings",
        nav: "settings",
        axis: "y",
        outlet: '[data-shortcut-modal="settings"] nav'
    }
];
const SCOPE_KEYS = [];
const SLOT_OF_SCOPE = {};
const SCOPE_OF_KEY = {};
const AXIS_OF_SCOPE = {};
const OUTLET_OF_SCOPE = {};
for(let i = 0; i < SCOPES.length; i++){
    const scope = SCOPES[i];
    SCOPE_KEYS.push(scope.key);
    SLOT_OF_SCOPE[scope.key] = scope.slot;
    SCOPE_OF_KEY[scope.key] = scope;
    AXIS_OF_SCOPE[scope.key] = scope.axis;
    OUTLET_OF_SCOPE[scope.key] = scope.outlet;
}
const OFFICIAL_IDS = {
    sidebar: [
        "plugins",
        "schedules",
        "more"
    ],
    footer: [],
    tabs: [
        "chat",
        "trajectory"
    ],
    composer: [
        "stats",
        "context-meter",
        "activity",
        "usage"
    ],
    settings: [
        "account",
        "general",
        "models",
        "plugins",
        "agent-presets"
    ]
};
const HIDDEN_LEDGER_IDS = [
    "cordis-panel"
];
const MORE_SCOPES = [
    "sidebar",
    "footer",
    "tabs",
    "composer",
    "settings"
];
const MORE_SCOPE_HOME = {
    sidebar: "sidebar",
    footer: "sidebar",
    tabs: "conversation",
    composer: "conversation",
    settings: "sidebar"
};
const MORE_REGIONS = [
    "sidebar",
    "conversation"
];
const SYNTHETIC_IDS = {
    composer: [
        "context-meter"
    ],
    sidebar: [
        "more"
    ]
};
const ROW_HOOKS = {
    composer: {
        stats: {
            selector: "[data-composer-stats]"
        },
        activity: {
            selector: '[data-composer-stat="activity"]'
        },
        usage: {
            selector: '[data-composer-stat="usage"]'
        },
        "save-token-strip": {
            selector: ".st-strip",
            label: "token-saver"
        },
        "dsh-connect-trae-stats-points": {
            selector: ".dsm-trae-composer-points",
            label: "Trae"
        },
        "dsh-connect-workbuddy-stats-credits": {
            selector: ".dsm-workbuddy-composer-credits",
            label: "WorkBuddy"
        }
    }
};
function rowHookOf(scope, id) {
    const table = ROW_HOOKS[scope];
    if (!table) return null;
    return table[id] || null;
}
const ROW_LABELS = {
    composer: {
        activity: "row.activity",
        usage: "row.usage",
        "context-meter": "row.context-meter"
    },
    sidebar: {
        more: "row.more"
    }
};
function rowLabelOf(scope, id) {
    const table = ROW_LABELS[scope];
    if (!table) return "";
    const key = table[id];
    return key ? t(key) : "";
}
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
const MARK_NAMES = [
    MARKS.row,
    MARKS.scope,
    MARKS.id,
    MARKS.kind,
    MARKS.hidden,
    MARKS.drag,
    MARKS.dragging,
    MARKS.over,
    MARKS.overActive
];
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
let __translator = function(key) {
    return key;
};
let __reporter = function() {};
function t(key) {
    return __translator(key);
}
function setTranslator(fn) {
    __translator = fn;
}
function warn(message, error) {
    __reporter(message, error);
}
function setReporter(fn) {
    __reporter = fn;
}
const Z_LAUNCHER = 2147483200;
const Z_MASK = 2147483300;
const Z_STASH = 2147483400;
const Z_MENU = 2147483500;
const Z_DIVIDER = 90;

// src/shared/icons.ts
var MENU_ICON_UP = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\" width=\"14\" height=\"14\" fill=\"currentColor\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M745.376 662.624L512 429.248l-233.376 233.376-45.248-45.248L512 338.752l278.624 278.624z\" fill=\"currentColor\" p-id=\"3477\"></path></svg>";
var MENU_ICON_DOWN = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\" width=\"14\" height=\"14\" fill=\"currentColor\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M512 685.248l-278.624-278.624 45.248-45.248L512 594.752l233.376-233.376 45.248 45.248z\" fill=\"currentColor\" p-id=\"3777\"></path></svg>";
var MENU_ICON_LEFT = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\" width=\"14\" height=\"14\" fill=\"currentColor\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M589.088 790.624L310.464 512l278.624-278.624 45.248 45.248L400.96 512l233.376 233.376z\" fill=\"currentColor\" p-id=\"3627\"></path></svg>";
var MENU_ICON_RIGHT = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\" width=\"14\" height=\"14\" fill=\"currentColor\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M434.944 790.624l-45.248-45.248L623.04 512l-233.376-233.376 45.248-45.248L713.568 512z\" fill=\"currentColor\" p-id=\"3927\"></path></svg>";
var MENU_ICON_ARCHIVE = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\" width=\"14\" height=\"14\" fill=\"currentColor\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M138.688 344.832v540.48h746.624V344.576L767.36 138.688H256.64l-117.952 206.08zM213.312 64h597.376L960 324.736V960H64V324.928L213.312 64zM64 325.312h896V400H64V325.312zM325.312 512h373.376v74.688H325.312V512z\" fill=\"currentColor\" p-id=\"8142\"></path></svg>";
var MENU_ICON_UNARCHIVE = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\" width=\"14\" height=\"14\" fill=\"currentColor\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M 394.24 304.742 c 6.3488 0 12.4928 -2.4576 17.408 -7.168 l 65.536 -65.536 v 312.32 c 0 13.5168 11.0592 24.576 24.576 24.576 s 24.576 -11.0592 24.576 -24.576 V 231.629 l 65.536 65.536 a 24.6579 24.6579 0 0 0 34.816 0 c 9.6256 -9.6256 9.6256 -25.1904 0 -34.816 l -107.315 -107.315 c -4.9152 -4.9152 -11.264 -7.168 -17.408 -7.168 h -0.2048 c -2.048 0 -3.8912 0.6144 -5.7344 1.2288 c -1.024 0.2048 -2.2528 0.2048 -3.2768 0.6144 c -3.2768 1.4336 -6.3488 3.4816 -8.8064 5.9392 l -107.11 107.11 c -9.6256 9.6256 -9.6256 25.1904 0 34.816 c 4.9152 4.7104 11.264 7.168 17.408 7.168 Z\" p-id=\"6117\"></path><path d=\"M 768 139.264 h -81.92 c -13.5168 0 -24.576 11.0592 -24.576 24.576 s 11.0592 24.576 24.576 24.576 h 81.92 c 43.008 0 77.824 34.816 77.824 77.824 v 491.52 c 0 43.008 -34.816 77.824 -77.824 77.824 h -532.48 c -43.008 0 -77.824 -34.816 -77.824 -77.824 V 266.24 c 0 -43.008 34.816 -77.824 77.824 -77.824 h 81.92 c 13.5168 0 24.576 -11.0592 24.576 -24.576 s -11.0592 -24.576 -24.576 -24.576 h -81.92 c -70.0416 0 -126.976 56.9344 -126.976 126.976 v 491.52 c 0 70.0416 56.9344 126.976 126.976 126.976 h 532.48 c 70.0416 0 126.976 -56.9344 126.976 -126.976 V 266.24 c 0 -70.0416 -56.9344 -126.976 -126.976 -126.976 Z\" p-id=\"6118\"></path></svg>";
var MENU_ICON_SWITCH = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\" width=\"14\" height=\"14\" fill=\"currentColor\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M96 416h832c0.32 0 0.576-0.192 0.896-0.192a30.656 30.656 0 0 0 30.976-30.976c-0.064-0.256 0.128-0.512 0.128-0.832a31.424 31.424 0 0 0-14.912-26.368l-188.48-188.48a30.72 30.72 0 1 0-43.456 43.456L852.544 352H96a32 32 0 0 0 0 64z m832 192H96c-0.32 0-0.576 0.192-0.896 0.192a30.528 30.528 0 0 0-30.976 30.976c0.064 0.256-0.128 0.512-0.128 0.832 0 11.264 6.144 20.672 14.912 26.368l188.48 188.48a30.72 30.72 0 1 0 43.456-43.456L171.456 672H928a32 32 0 0 0 0-64z\" p-id=\"3252\"></path></svg>";
var ACTION_ICON_EXPORT = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1030 1024\" width=\"16\" height=\"16\" fill=\"currentColor\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M140.8 1017.6c-38.4 0-70.4-12.8-96-38.4-25.6-25.6-38.4-57.6-38.4-96v-185.6c0-12.8 6.4-25.6 12.8-32s19.2-12.8 32-12.8 25.6 6.4 32 12.8 12.8 19.2 12.8 32v185.6c0 12.8 6.4 32 12.8 38.4 6.4 6.4 19.2 12.8 38.4 12.8h742.4c12.8 0 32-6.4 38.4-12.8 6.4-6.4 12.8-19.2 12.8-38.4v-185.6c0-12.8 6.4-25.6 12.8-32 6.4-6.4 19.2-12.8 32-12.8s25.6 6.4 32 12.8c6.4 6.4 12.8 19.2 12.8 32v185.6c0 38.4-12.8 70.4-38.4 96-25.6 25.6-57.6 38.4-96 38.4H140.8z m377.6-275.2c-12.8 0-25.6-6.4-32-12.8s-12.8-19.2-12.8-32V160s0-6.4-6.4-6.4h-6.4L313.6 313.6c-6.4 6.4-25.6 12.8-25.6 12.8-12.8 0-25.6-6.4-32-12.8-12.8-12.8-19.2-19.2-19.2-25.6 0-12.8 6.4-25.6 12.8-32L480 25.6c12.8-12.8 25.6-19.2 38.4-19.2 12.8 0 25.6 6.4 32 12.8L774.4 256c6.4 6.4 12.8 19.2 12.8 32s-6.4 25.6-12.8 32-19.2 12.8-32 12.8-19.2-12.8-25.6-19.2L563.2 153.6h-6.4s-6.4 0-6.4 6.4V704c0 12.8-6.4 25.6-12.8 32s-12.8 6.4-19.2 6.4z\" p-id=\"1845\"></path></svg>";
var ACTION_ICON_IMPORT = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1030 1024\" width=\"16\" height=\"16\" fill=\"currentColor\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M140.8 1017.6c-38.4 0-70.4-12.8-96-38.4-25.6-25.6-38.4-57.6-38.4-96v-185.6c0-12.8 6.4-25.6 12.8-32s19.2-12.8 32-12.8 25.6 6.4 32 12.8 12.8 19.2 12.8 32v185.6c0 12.8 6.4 32 12.8 38.4s19.2 12.8 38.4 12.8h742.4c12.8 0 32-6.4 38.4-12.8 6.4-6.4 12.8-19.2 12.8-38.4v-185.6c0-12.8 6.4-25.6 12.8-32 6.4-6.4 19.2-12.8 32-12.8s25.6 6.4 32 12.8c6.4 6.4 12.8 19.2 12.8 32v185.6c0 38.4-12.8 70.4-38.4 96-25.6 25.6-57.6 38.4-96 38.4H140.8z\" p-id=\"1694\"></path><path d=\"M537.6 12.8c6.4 6.4 12.8 19.2 12.8 32v544c0 6.4 6.4 6.4 6.4 6.4h6.4l153.6-160c6.4-6.4 12.8-19.2 25.6-19.2s25.6 6.4 32 12.8 12.8 19.2 12.8 32-6.4 25.6-12.8 32l-224 236.8c-6.4 6.4-19.2 12.8-32 12.8s-25.6-6.4-38.4-19.2L249.6 492.8c-6.4-6.4-12.8-19.2-12.8-32 0-6.4 6.4-12.8 19.2-25.6 6.4-6.4 19.2-12.8 32-12.8 0 0 19.2 6.4 25.6 12.8l147.2 160h6.4c6.4 0 6.4-6.4 6.4-6.4V51.2c0-12.8 6.4-25.6 12.8-32s19.2-12.8 32-12.8c6.4 0 12.8 0 19.2 6.4z\" p-id=\"1695\"></path></svg>";
var ACTION_ICON_GITHUB = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\" width=\"16\" height=\"16\" fill=\"currentColor\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M950.857143 512q0 143.428571-83.714286 258T650.857143 928.571429q-15.428571 2.857143-22.571429-4t-7.142857-17.142858v-120.571428q0-55.428571-29.714286-81.142857 32.571429-3.428571 58.571429-10.285715t53.714286-22.285714 46.285714-38 30.285714-60T792 489.142857q0-69.142857-45.142857-117.714286 21.142857-52-4.571429-116.571428-16-5.142857-46.285714 6.285714t-52.571429 25.142857l-21.714285 13.714286q-53.142857-14.857143-109.714286-14.857143t-109.714286 14.857143q-9.142857-6.285714-24.285714-15.428571T330.285714 262.571429 281.142857 254.857143q-25.142857 64.571429-4 116.571428-45.142857 48.571429-45.142857 117.714286 0 48.571429 11.714286 85.714286t30 60 46 38.285714 53.714285 22.285714 58.571429 10.285715q-22.857143 20.571429-28 58.857143-12 5.714286-25.714286 8.571428t-32.571428 2.857143-37.428572-12.285714T276.571429 728q-10.857143-18.285714-27.714286-29.714286t-28.285714-13.714285l-11.428572-1.714286q-12 0-16.571428 2.571428t-2.857143 6.571429 5.142857 8 7.428571 6.857143l4 2.857143q12.571429 5.714286 24.857143 21.714285t18 29.142858l5.714286 13.142857q7.428571 21.714286 25.142857 35.142857t38.285714 17.142857 39.714286 4 31.714286-2l13.142857-2.285714q0 21.714286 0.285714 50.857143t0.285714 30.857142q0 10.285714-7.428571 17.142858t-22.857143 4q-132.571429-44-216.285714-158.571429T73.142857 512q0-119.428571 58.857143-220.285714T291.714286 132 512 73.142857t220.285714 58.857143T892 291.714286 950.857143 512z\" p-id=\"8840\"></path></svg>";
var ACTION_ICON_FEEDBACK = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\" width=\"16\" height=\"16\" fill=\"currentColor\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M800.037628 960.010751 223.962372 960.010751c-52.980346 0-95.983874-43.003528-95.983874-95.983874l0-639.892491c0-52.980346 43.003528-95.983874 95.983874-95.983874l447.924744 0c17.717453 0 31.994625 14.277171 31.994625 31.994625s-14.277171 31.994625-31.994625 31.994625L223.962372 192.139761c-17.545439 0-31.994625 14.449185-31.994625 31.994625l0 639.892491c0 17.717453 14.449185 31.994625 31.994625 31.994625l575.903242 0c17.717453 0 31.994625-14.277171 31.994625-31.994625L831.860239 351.94087c0-17.717453 14.277171-31.994625 31.994625-31.994625 17.717453 0 31.994625 14.277171 31.994625 31.994625l0 511.913993C896.021502 916.835209 852.84596 960.010751 800.037628 960.010751z\" fill=\"currentColor\" p-id=\"9841\"></path><path d=\"M612.026205 447.924744c-8.256677 0-16.341341-3.096254-22.705863-9.460776-12.55703-12.55703-12.55703-32.682681 0-45.239711L907.374433 75.34218c12.55703-12.55703 32.682681-12.55703 45.239711 0s12.55703 32.682681 0 45.239711L634.560054 438.635982C628.367546 444.82849 620.110868 447.924744 612.026205 447.924744z\" fill=\"currentColor\" p-id=\"9842\"></path><path d=\"M479.919368 447.924744 287.951621 447.924744c-17.717453 0-31.994625-14.277171-31.994625-31.994625s14.277171-31.994625 31.994625-31.994625L479.919368 383.935495c17.717453 0 31.994625 14.277171 31.994625 31.994625C511.913993 433.647573 497.636822 447.924744 479.919368 447.924744z\" fill=\"currentColor\" p-id=\"9843\"></path><path d=\"M672.05913 639.892491 287.951621 639.892491c-17.717453 0-31.994625-14.277171-31.994625-31.994625s14.277171-31.994625 31.994625-31.994625l383.935495 0c17.717453 0 31.994625 14.277171 31.994625 31.994625S689.604569 639.892491 672.05913 639.892491z\" fill=\"currentColor\" p-id=\"9844\"></path></svg>";
var UI_ICON_SEARCH = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\" width=\"13\" height=\"13\" fill=\"currentColor\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M446.112323 177.545051c137.567677 0.219798 252.612525 104.59798 266.162424 241.493333 13.562828 136.895354-78.778182 261.818182-213.617777 289.008485-134.852525 27.203232-268.386263-52.156768-308.945455-183.608889s25.018182-272.252121 151.738182-325.779394A267.235556 267.235556 0 0 1 446.112323 177.545051m0-62.060607c-182.794343 0-330.989899 148.195556-330.989899 330.989899s148.195556 330.989899 330.989899 330.989899 330.989899-148.195556 330.989899-330.989899-148.195556-330.989899-330.989899-330.989899z m431.321212 793.341415a30.849293 30.849293 0 0 1-21.94101-9.102223l-157.220202-157.220202c-11.752727-12.179394-11.584646-31.534545 0.37495-43.50707 11.972525-11.972525 31.327677-12.140606 43.494141-0.37495l157.220202 157.220202a31.036768 31.036768 0 0 1 6.723232 33.810101 31.004444 31.004444 0 0 1-28.651313 19.174142z m0 0\" p-id=\"10833\"></path></svg>";
var UI_ICON_CLOSE = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\" width=\"12\" height=\"12\" fill=\"currentColor\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M512 466.944l233.472-233.472a31.744 31.744 0 0 1 45.056 45.056L557.056 512l233.472 233.472a31.744 31.744 0 0 1-45.056 45.056L512 557.056l-233.472 233.472a31.744 31.744 0 0 1-45.056-45.056L466.944 512 233.472 278.528a31.744 31.744 0 0 1 45.056-45.056z\" fill=\"currentColor\" p-id=\"12870\"></path></svg>";
var ACTION_ICON_OUT_OF_MORE = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\" width=\"12\" height=\"12\" fill=\"currentColor\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M608 896H128V128h480c19.2 0 32-12.8 32-32s-12.8-32-32-32H96c-19.2 0-32 12.8-32 32v832c0 19.2 12.8 32 32 32h512c19.2 0 32-12.8 32-32s-12.8-32-32-32z\" p-id=\"3188\"></path><path d=\"M950.4 489.6L768 307.2c-12.8-12.8-32-12.8-44.8 0s-12.8 32 0 44.8l128 124.8H489.6c-19.2 0-32 12.8-32 32s12.8 32 32 32h358.4l-128 124.8c-12.8 12.8-12.8 32 0 44.8 6.4 6.4 16 9.6 22.4 9.6s16-3.2 22.4-9.6l182.4-182.4c6.4-6.4 9.6-12.8 9.6-22.4s0-9.6-6.4-16z\" p-id=\"3189\"></path></svg>";

// src/shared/locale.ts
const ZH = {
    "nav": "插件布局整理",
    "title": "插件布局整理",
    "subtitle": "对 DSH 投放到侧边栏顶部、侧边栏底部、对话标签、输入框停靠行与设置页导航的插件按钮做拖拽排序、官方/第三方分隔线与按钮收纳。只改变显示位置，不改动插件注册表。",
    "version.hint": "当前插件版本",
    "section.options": "通用设置",
    "section.stash": "悬浮框",
    "section.shortcut": "快捷键",
    "tab.general": "通用设置",
    "tab.layout": "位置管理",
    "search.placeholder": "搜索按钮名称或 id",
    "search.clear": "取消搜索",
    "scope.sidebar": "侧边栏顶部按钮",
    "scope.footer": "侧边栏底部按钮",
    "scope.tabs": "对话标签顶部按钮",
    "scope.composer": "对话输入框停靠行按钮",
    "scope.settings": "设置页侧边栏按钮",
    "scope.missing": "当前界面未显示这一组按钮。打开对应页面后即可整理。",
    "opt.allowDragOfficial": "允许拖动官方按钮",
    "opt.allowDragOfficial.hint": "关闭时只有第三方按钮可以拖动，官方按钮保持原位；下属行变灰且不生效，点亮任意一路会自动打开本开关。",
    "opt.mixGroups": "允许官方和第三方混合排序",
    "opt.mixGroups.hint": "打开后官方按钮可以和第三方按钮穿插排列，分隔线在两类混在一起时自动隐藏。",
    "opt.showDivider": "显示官方 / 第三方分隔线",
    "opt.showDivider.hint": "打开后官方按钮整体排在前面，第三方按钮整体排在后面，中间画一条线；关闭时下属行变灰、一条线也不画，点亮任意一路会自动打开本开关。",
    "opt.divider.sidebar": "显示侧边栏顶部按钮分隔线",
    "opt.divider.sidebar.hint": "只影响侧边栏顶部按钮这一组，其余位置不受影响。",
    "opt.divider.tabs": "显示对话标签顶部按钮分隔线",
    "opt.divider.tabs.hint": "只影响对话标签顶部按钮这一组，其余位置不受影响。",
    "opt.divider.settings": "显示设置页侧边栏按钮分隔线",
    "opt.divider.settings.hint": "只影响设置页侧边栏按钮这一组，其余位置不受影响。",
    "opt.showLauncher": "显示悬浮按钮",
    "opt.showLauncher.hint": "关闭后只能用快捷键或本页按钮打开悬浮框。",
    "opt.separateMore": "分开收纳",
    "opt.separateMore.hint": "打开后侧边栏的按钮（含侧边栏底部按钮）只收进侧边栏的「更多」，对话区的按钮只收进对话的「更多」；关闭时两处共用一份清单，收进哪一处都在两处出现。",
    "opt.moreDivider": "在「更多」菜单里画分隔线",
    "opt.moreDivider.hint": "只在「更多」菜单里生效：官方按钮排前面、第三方按钮排后面，中间画一条线。与下面的总开关各管各的。",
    "sort.scope": "按页面",
    "sort.kind": "按分类",
    "sort.alpha": "按名称",
    "kind.official": "官方",
    "kind.third": "第三方",
    "action.toggleGroup": "折叠 / 展开这一组",
    "row.activity": "会话统计",
    "row.usage": "用量统计",
    "row.context-meter": "上下文用量",
    "row.more": "更多",
    "action.toggleKind": "切换官方 / 第三方分类",
    "action.stash": "收起",
    "action.restore": "恢复",
    "action.intoMore": "进更多",
    "action.outOfMore": "出更多",
    "action.intoMore.hint": "从主列表移到「更多」菜单里，仍然可以从那里打开",
    "action.up": "上移",
    "action.down": "下移",
    "action.left": "左移",
    "action.right": "右移",
    "action.reset": "恢复本组默认顺序",
    "action.restoreAll": "全部恢复",
    "action.openStash": "打开已收起的按钮",
    "action.close": "关闭",
    "action.goto": "打开对应页面",
    "action.static": "这一行只是显示，没有可以打开的页面",
    "action.drag": "拖动排序",
    "action.export": "导出配置",
    "action.export.hint": "把顺序、分类与收纳导出成一个 JSON 文件",
    "action.import": "导入配置",
    "action.import.hint": "用之前导出的 JSON 文件覆盖当前配置",
    "action.github": "GitHub",
    "action.github.hint": "打开本项目的 GitHub 仓库",
    "action.feedback": "问题反馈",
    "action.feedback.hint": "在 GitHub Issues 里报告问题或提建议",
    "action.resetAll": "重置所有配置",
    "action.resetAll.hint": "清空顺序、分类、收纳与全部开关，恢复到初次安装的状态。",
    "action.confirmRestore": "再点一次恢复",
    "action.confirmResetGroup": "再点一次恢复本组",
    "action.confirmResetAll": "再点一次重置",
    "action.confirmImport": "再点一次导入",
    "note.exported": "配置已导出。",
    "note.importOk": "导入成功，配置已更新。",
    "note.importFail": "导入失败：这不是本插件导出的配置文件。",
    "empty.stash": "悬浮框里还没有内容。在任意按钮上右键，选择「收纳」即可放进来。",
    "empty.list": "这里还没有按钮。",
    "empty.search": "没有匹配的按钮。清空搜索框即可看到全部。",
    "stash.title": "已收起的按钮",
    "stash.launcher": "已收起的按钮",
    "stash.count": "共 {count} 个按钮",
    "shortcut.open": "打开已收起的按钮",
    "shortcut.none": "未设置",
    "shortcut.record": "点击后按下新的组合键",
    "shortcut.recording": "请按下组合键…",
    "shortcut.reset": "恢复默认",
    "shortcut.saved": "已保存。",
    "shortcut.invalid": "这个组合键不可用：{reason}",
    "shortcut.conflict": "已被占用：{list}",
    "shortcut.failed": "保存失败（{status}），快捷键未改动。",
    "shortcut.hint": "快捷键同样可以在 DSH 的「快捷键」设置里修改。",
    "note.hideOnly": "收纳只影响显示，随时可以在悬浮框里恢复。",
    "note.degrade": "部分能力不可用，已自动降级：",
    "nav.failed": "无法打开「{label}」，该按钮可能已不可用。"
};
const EN = {
    "nav": "Plugin layout organizer",
    "title": "Plugin layout organizer",
    "subtitle": "Drag-and-drop reordering, official/third-party dividers and a stash panel for the buttons DSH renders in the sidebar, the sidebar footer, the conversation tabs, the composer dock and Settings. Only display position changes; the plugin registry is untouched.",
    "version.hint": "Installed plugin version",
    "section.options": "General",
    "section.stash": "Floating frame",
    "section.shortcut": "Shortcut",
    "tab.general": "General",
    "tab.layout": "Layout",
    "search.placeholder": "Search button name or id",
    "search.clear": "Clear search",
    "scope.sidebar": "Sidebar top buttons",
    "scope.footer": "Sidebar bottom buttons",
    "scope.tabs": "Conversation top tabs",
    "scope.composer": "Conversation dock buttons",
    "scope.settings": "Settings navigation buttons",
    "scope.missing": "This group is not on screen right now. Open the matching page to organize it.",
    "opt.allowDragOfficial": "Allow dragging official buttons",
    "opt.allowDragOfficial.hint": "When off, only third-party buttons can be dragged and the row below greys out; lighting it up switches this one on.",
    "opt.mixGroups": "Allow official and third-party rows to mix",
    "opt.mixGroups.hint": "When on, official and third-party buttons can interleave; the divider hides itself once the two kinds are mixed.",
    "opt.showDivider": "Show the official / third-party divider",
    "opt.showDivider.hint": "Official buttons move to the front, third-party buttons to the back, with a line between them. When off the rows below grey out and no line is drawn; lighting one up switches this one on.",
    "opt.divider.sidebar": "Divider for sidebar top buttons",
    "opt.divider.sidebar.hint": "Applies only to the sidebar top button group; other locations are unaffected.",
    "opt.divider.tabs": "Divider for conversation tab buttons",
    "opt.divider.tabs.hint": "Applies only to the conversation tab button group; other locations are unaffected.",
    "opt.divider.settings": "Divider for Settings navigation buttons",
    "opt.divider.settings.hint": "Applies only to the Settings navigation button group; other locations are unaffected.",
    "opt.showLauncher": "Show the floating button",
    "opt.showLauncher.hint": "When off, only the shortcut or this page can open the floating frame.",
    "opt.separateMore": "Keep the two More menus apart",
    "opt.separateMore.hint": "When on, sidebar buttons (including the sidebar footer) only go into the sidebar More, and conversation buttons only into the conversation More. When off, both menus share one list, so anything tucked in shows up in both.",
    "opt.moreDivider": "Draw the divider inside the More menu",
    "opt.moreDivider.hint": "Applies to the More menu only: official buttons come first, third-party buttons after, with a line between them. It works independently of the master switch below.",
    "sort.scope": "By page",
    "sort.kind": "By kind",
    "sort.alpha": "By name",
    "kind.official": "Official",
    "kind.third": "Third-party",
    "action.toggleGroup": "Collapse / expand this group",
    "row.activity": "Session stats",
    "row.usage": "Token usage",
    "row.context-meter": "Context usage",
    "row.more": "More",
    "action.toggleKind": "Toggle official / third-party",
    "action.stash": "Tuck",
    "action.restore": "Restore",
    "action.intoMore": "Into more",
    "action.outOfMore": "Out of more",
    "action.intoMore.hint": "Move it out of the main list and into the More menu, where it stays reachable",
    "action.up": "Move up",
    "action.down": "Move down",
    "action.left": "Move left",
    "action.right": "Move right",
    "action.reset": "Reset this group's order",
    "action.restoreAll": "Restore all",
    "action.openStash": "Open the tucked-away buttons",
    "action.close": "Close",
    "action.goto": "Open the matching page",
    "action.static": "This row is display-only and has no page to open",
    "action.drag": "Drag to reorder",
    "action.export": "Export config",
    "action.export.hint": "Export ordering, kinds and stashed rows as one JSON file",
    "action.import": "Import config",
    "action.import.hint": "Replace the current config with a previously exported JSON file",
    "action.github": "GitHub",
    "action.github.hint": "Open this project's GitHub repository",
    "action.feedback": "Feedback",
    "action.feedback.hint": "Report a problem or suggest an idea on GitHub Issues",
    "action.resetAll": "Reset every setting",
    "action.resetAll.hint": "Clears ordering, kinds, stashed rows and every switch back to a fresh install.",
    "action.confirmRestore": "Click again to restore",
    "action.confirmResetGroup": "Click again to reset",
    "action.confirmResetAll": "Click again to reset",
    "action.confirmImport": "Click again to import",
    "note.exported": "Configuration exported.",
    "note.importOk": "Imported; the configuration is updated.",
    "note.importFail": "Import failed: that is not a configuration file exported by this plugin.",
    "empty.stash": "The floating frame is empty. Right-click any button and choose Stash to put it here.",
    "empty.list": "No buttons here yet.",
    "empty.search": "No matching buttons. Clear the search box to see everything.",
    "stash.title": "Tucked-away buttons",
    "stash.launcher": "Tucked-away buttons",
    "stash.count": "{count} buttons",
    "shortcut.open": "Open the tucked-away buttons",
    "shortcut.none": "Not set",
    "shortcut.record": "Click, then press the new combination",
    "shortcut.recording": "Press a combination…",
    "shortcut.reset": "Restore default",
    "shortcut.saved": "Saved.",
    "shortcut.invalid": "That combination is not usable: {reason}",
    "shortcut.conflict": "Already taken by: {list}",
    "shortcut.failed": "Could not save ({status}); the shortcut is unchanged.",
    "shortcut.hint": "The shortcut can also be changed in the DSH Shortcuts settings.",
    "note.hideOnly": "Stashing affects display only; restore it from the floating frame at any time.",
    "note.degrade": "Some capabilities are unavailable; running degraded:",
    "nav.failed": "Could not open “{label}”; that button may no longer be available."
};

// src/core/store.ts
function defaultState() {
    const state = {
        version: STATE_VERSION,
        options: {
            allowDragOfficial: false,
            mixGroups: true,
            showDivider: false,
            dividers: {},
            showStashLauncher: true,
            separateMore: false,
            moreDivider: false,
            collapsed: {},
            launcherSide: "right",
            launcherX: null,
            launcherY: null
        },
        order: {},
        kinds: {},
        hidden: {},
        intoMore: {},
        moreOrder: {},
        stashSort: SORT_MODES[0]
    };
    let i;
    for(i = 0; i < SCOPES.length; i++)state.order[SCOPES[i].key] = [];
    return state;
}
function asObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function asBoolMap(value) {
    const source = asObject(value);
    const out = {};
    const keys = Object.keys(source);
    let i;
    for(i = 0; i < keys.length; i++)if (source[keys[i]] === true) out[keys[i]] = true;
    return out;
}
function asStringMap(value) {
    const source = asObject(value);
    const out = {};
    const keys = Object.keys(source);
    let i;
    for(i = 0; i < keys.length; i++){
        const list = source[keys[i]];
        if (!Array.isArray(list)) continue;
        const kept = [];
        let j;
        for(j = 0; j < list.length; j++)if (typeof list[j] === "string" && list[j]) kept.push(list[j]);
        out[keys[i]] = kept;
    }
    return out;
}
function normalizeState(raw) {
    const base = defaultState();
    const source = asObject(raw);
    if (source.version !== STATE_VERSION) return base;
    const options = asObject(source.options);
    base.options.allowDragOfficial = options.allowDragOfficial === true;
    base.options.mixGroups = options.mixGroups !== false;
    base.options.showDivider = options.showDivider === true;
    base.options.dividers = asBoolMap(options.dividers);
    base.options.showStashLauncher = options.showStashLauncher !== false;
    base.options.separateMore = options.separateMore === true;
    base.options.moreDivider = options.moreDivider === true;
    base.options.collapsed = asBoolMap(options.collapsed);
    const launcherSide = options.launcherSide;
    base.options.launcherSide = typeof launcherSide === "string" && LAUNCHER_SIDES.indexOf(launcherSide) >= 0 ? launcherSide : "right";
    const launcherX = options.launcherX;
    base.options.launcherX = typeof launcherX === "number" && isFinite(launcherX) ? launcherX : null;
    const launcherY = options.launcherY;
    base.options.launcherY = typeof launcherY === "number" && isFinite(launcherY) ? launcherY : null;
    base.hidden = asBoolMap(source.hidden);
    base.intoMore = asBoolMap(source.intoMore);
    base.moreOrder = asStringMap(source.moreOrder);
    base.kinds = asObject(source.kinds);
    const stashSort = source.stashSort;
    base.stashSort = typeof stashSort === "string" && SORT_MODES.indexOf(stashSort) >= 0 ? stashSort : SORT_MODES[0];
    const order = asObject(source.order);
    let i;
    for(i = 0; i < SCOPES.length; i++){
        const scope = SCOPES[i].key;
        const list = order[scope];
        if (Array.isArray(list)) {
            const clean = [];
            let j;
            for(j = 0; j < list.length; j++){
                const id = list[j];
                if (typeof id === "string" && clean.indexOf(id) < 0) clean.push(id);
            }
            base.order[scope] = clean;
        }
    }
    return base;
}
function readState() {
    try {
        const text = window.localStorage.getItem(STORAGE_KEY);
        if (!text) return defaultState();
        return normalizeState(JSON.parse(text));
    } catch (err) {
        return defaultState();
    }
}
let __storeRevision = 0;
const __revisionListeners = [];
function subscribeRevision(fn) {
    __revisionListeners.push(fn);
    return function() {
        const index = __revisionListeners.indexOf(fn);
        if (index >= 0) __revisionListeners.splice(index, 1);
    };
}
function notifyRevision() {
    const snapshot = __revisionListeners.slice();
    let i;
    for(i = 0; i < snapshot.length; i++){
        try {
            snapshot[i]();
        } catch (err) {}
    }
}
function useRevisionTick() {
    const [tick, setTick] = useState(0);
    useEffect(function() {
        return subscribeRevision(function() {
            setTick(function(value) {
                return value + 1;
            });
        });
    }, []);
    return tick;
}
function createStore() {
    let state = readState();
    const listeners = [];
    let timer = null;
    function persist() {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (err) {}
    }
    function emit() {
        const snapshot = listeners.slice();
        let i;
        for(i = 0; i < snapshot.length; i++){
            try {
                snapshot[i](state);
            } catch (err) {}
        }
    }
    return {
        get: function() {
            return state;
        },
        subscribe: function(listener) {
            listeners.push(listener);
            return function() {
                const index = listeners.indexOf(listener);
                if (index >= 0) listeners.splice(index, 1);
            };
        },
        update: function(mutator) {
            const next = mutator(state);
            if (next) state = next;
            emit();
            __storeRevision += 1;
            notifyRevision();
            if (timer) window.clearTimeout(timer);
            timer = window.setTimeout(function() {
                timer = null;
                persist();
            }, 180);
        },
        replace: function(next) {
            state = next;
            emit();
            persist();
        },
        reset: function() {
            state = defaultState();
            emit();
            persist();
        }
    };
}
function kindOf(state, scope, id) {
    const manual = state.kinds[scope + ":" + id];
    if (manual === "official" || manual === "third") return manual;
    const official = OFFICIAL_IDS[scope] || [];
    return official.indexOf(id) >= 0 ? "official" : "third";
}
function groupOf(state, scope, id) {
    return kindOf(state, scope, id) === "official" ? "official" : "third";
}
function mixedOrder(state) {
    return state.options.allowDragOfficial === true && state.options.mixGroups === true;
}
function hiddenKey(scope, id) {
    return scope + ":" + id;
}
function dividerEnabled(state, scope) {
    if (state.options.showDivider !== true) return false;
    if (DIVIDER_SCOPES.indexOf(scope) < 0) return false;
    const one = state.options.dividers ? state.options.dividers[scope] : undefined;
    return one !== false;
}
function isHidden(state, scope, id) {
    return state.hidden[hiddenKey(scope, id)] === true;
}
function isIntoMore(state, scope, id) {
    return state.intoMore[hiddenKey(scope, id)] === true;
}
function moreScopeOk(scope) {
    return MORE_SCOPES.indexOf(scope) >= 0;
}
function moreRegionOf(scope) {
    const home = MORE_SCOPE_HOME[scope];
    return home ? home : MORE_REGIONS[0];
}
function moreScopesIn(state, region) {
    if (state.options.separateMore !== true) return MORE_SCOPES.slice();
    const out = [];
    let i;
    for(i = 0; i < MORE_SCOPES.length; i++)if (moreRegionOf(MORE_SCOPES[i]) === region) out.push(MORE_SCOPES[i]);
    return out;
}
function moreDividerOn(state) {
    return state.options.moreDivider === true;
}
function moreRowsIn(state, region) {
    const scopes = moreScopesIn(state, region);
    const allowed = {};
    const picked = [];
    const seen = {};
    let i;
    let j;
    for(i = 0; i < scopes.length; i++)allowed[scopes[i]] = true;
    const saved = moreOrderOf(state, region);
    for(i = 0; i < saved.length; i++){
        const key = saved[i];
        const cut = key ? key.indexOf(":") : -1;
        if (cut <= 0) continue;
        const scope = key.slice(0, cut);
        const id = key.slice(cut + 1);
        if (!id || !allowed[scope] || seen[key]) continue;
        if (!isIntoMore(state, scope, id)) continue;
        seen[key] = true;
        picked.push({
            scope: scope,
            id: id
        });
    }
    for(i = 0; i < scopes.length; i++){
        const scope = scopes[i];
        const ids = [];
        const order = state.order[scope] || [];
        for(j = 0; j < order.length; j++)ids.push(order[j]);
        const live = liveOrder(scope) || [];
        for(j = 0; j < live.length; j++)if (ids.indexOf(live[j]) < 0) ids.push(live[j]);
        const map = state.intoMore;
        const keys = Object.keys(map);
        for(j = 0; j < keys.length; j++){
            const cut = keys[j].indexOf(":");
            if (cut <= 0) continue;
            if (keys[j].slice(0, cut) !== scope) continue;
            const id = keys[j].slice(cut + 1);
            if (id && ids.indexOf(id) < 0) ids.push(id);
        }
        for(j = 0; j < ids.length; j++){
            const id = ids[j];
            const key = scope + ":" + id;
            if (seen[key]) continue;
            if (isSynthetic(scope, id)) continue;
            if (!isIntoMore(state, scope, id)) continue;
            seen[key] = true;
            picked.push({
                scope: scope,
                id: id
            });
        }
    }
    const allKeys = Object.keys(state.intoMore);
    for(i = 0; i < allKeys.length; i++){
        const key = allKeys[i];
        const cut = key.indexOf(":");
        if (cut <= 0) continue;
        const scope = key.slice(0, cut);
        const id = key.slice(cut + 1);
        if (!id || seen[key]) continue;
        if (isSynthetic(scope, id)) continue;
        if (!isIntoMore(state, scope, id)) continue;
        seen[key] = true;
        picked.push({
            scope: scope,
            id: id
        });
    }
    if (!moreDividerOn(state)) return picked;
    const official = [];
    const third = [];
    for(i = 0; i < picked.length; i++){
        (kindOf(state, picked[i].scope, picked[i].id) === "official" ? official : third).push(picked[i]);
    }
    return official.concat(third);
}
function moreOrderOf(state, region) {
    return state.moreOrder[region] || [];
}
function setMoreOrder(state, region, keys) {
    state.moreOrder[region] = keys.slice();
}
function moreKeysIn(state, region) {
    const rows = moreRowsIn(state, region);
    const out = [];
    let i;
    for(i = 0; i < rows.length; i++)out.push(rows[i].scope + ":" + rows[i].id);
    return out;
}
function moveMoreRow(store, region, key, delta) {
    const keys = moreKeysIn(store.get(), region);
    const from = keys.indexOf(key);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= keys.length) return;
    keys.splice(from, 1);
    keys.splice(to, 0, key);
    store.update(function(state) {
        setMoreOrder(state, region, keys);
    });
}
function reconcileOrder(state, scope, discovered) {
    const saved = state.order[scope] || [];
    const known = {};
    const official = [];
    const third = [];
    let i;
    for(i = 0; i < discovered.length; i++)known[discovered[i]] = true;
    if (mixedOrder(state)) {
        const mixed = [];
        for(i = 0; i < saved.length; i++)if (known[saved[i]]) mixed.push(saved[i]);
        for(i = 0; i < discovered.length; i++)if (saved.indexOf(discovered[i]) < 0) mixed.push(discovered[i]);
        return mixed;
    }
    for(i = 0; i < saved.length; i++){
        const id = saved[i];
        if (!known[id]) continue;
        (kindOf(state, scope, id) === "official" ? official : third).push(id);
    }
    for(i = 0; i < discovered.length; i++){
        if (saved.indexOf(discovered[i]) >= 0) continue;
        (kindOf(state, scope, discovered[i]) === "official" ? official : third).push(discovered[i]);
    }
    return official.concat(third);
}
function scopeDirty(state, scope) {
    if ((state.order[scope] || []).length > 0) return true;
    const keys = Object.keys(state.hidden).concat(Object.keys(state.intoMore));
    let i;
    for(i = 0; i < keys.length; i++)if (keys[i].indexOf(scope + ":") === 0) return true;
    return false;
}
function stateDirty(state) {
    const fresh = defaultState();
    return JSON.stringify(state.order) !== JSON.stringify(fresh.order) || JSON.stringify(state.kinds) !== JSON.stringify(fresh.kinds) || JSON.stringify(state.hidden) !== JSON.stringify(fresh.hidden) || JSON.stringify(state.intoMore) !== JSON.stringify(fresh.intoMore) || JSON.stringify(state.moreOrder) !== JSON.stringify(fresh.moreOrder) || JSON.stringify(state.options) !== JSON.stringify(fresh.options);
}
function stashCount(state) {
    return Object.keys(state.hidden).length;
}
function stashEntries(state) {
    const out = [];
    const keys = Object.keys(state.hidden);
    let i;
    for(i = 0; i < keys.length; i++){
        const key = keys[i];
        if (state.hidden[key] !== true) continue;
        const cut = key.indexOf(":");
        if (cut < 0) continue;
        out.push({
            scope: key.slice(0, cut),
            id: key.slice(cut + 1),
            key: key
        });
    }
    return out;
}
function setOption(state, key, value) {
    state.options[key] = value;
}
function setHidden(state, scope, id, hidden) {
    const key = hiddenKey(scope, id);
    if (hidden) {
        state.hidden[key] = true;
        delete state.intoMore[key];
    } else delete state.hidden[key];
}
function setIntoMore(state, scope, id, into) {
    const key = hiddenKey(scope, id);
    if (into) {
        state.intoMore[key] = true;
        delete state.hidden[key];
    } else {
        delete state.intoMore[key];
    }
}
function writeOrder(state, scope, ids) {
    state.order[scope] = ids.slice();
}
function moveRow(state, scope, id, delta, group) {
    const saved = state.order[scope] || [];
    let list = saved.slice();
    if (list.indexOf(id) < 0) {
        const live = liveOrder(scope);
        list = [];
        for(let i = 0; i < live.length; i++)if (!isHidden(state, scope, live[i])) list.push(live[i]);
    }
    const from = list.indexOf(id);
    if (from < 0) return false;
    let target = -1;
    const step = delta > 0 ? 1 : -1;
    let cursor = from + step;
    while(cursor >= 0 && cursor < list.length){
        const candidate = list[cursor];
        if (!group || groupOf(state, scope, candidate) === group) {
            target = cursor;
            break;
        }
        cursor += step;
    }
    if (target < 0) return false;
    list.splice(from, 1);
    list.splice(target, 0, id);
    state.order[scope] = list;
    return true;
}
function resetScope(state, scope) {
    state.order[scope] = [];
    const keys = Object.keys(state.hidden);
    let i;
    for(i = 0; i < keys.length; i++)if (keys[i].indexOf(scope + ":") === 0) delete state.hidden[keys[i]];
    const more = Object.keys(state.intoMore);
    for(i = 0; i < more.length; i++)if (more[i].indexOf(scope + ":") === 0) delete state.intoMore[more[i]];
    delete state.moreOrder[moreRegionOf(scope)];
}
function restoreAllHidden(state) {
    state.hidden = {};
}

// src/core/dom-rows.ts
function elementChildren(el) {
    const out = [];
    for(let i = 0; i < el.children.length; i++)out.push(el.children[i]);
    return out;
}
function outletOf(slotKey) {
    return document.querySelector('[data-slot="' + slotKey + '"]');
}
function outletSelector(scope) {
    const selector = OUTLET_OF_SCOPE[scope];
    if (!selector) return null;
    return selector;
}
function outletChildren(slotKey) {
    const outlet = outletOf(slotKey);
    if (!outlet) return null;
    return elementChildren(outlet);
}
function collectSidebarUnits() {
    const units = [];
    const panelRows = [];
    const outlets = document.querySelectorAll('[data-slot="sidebar.panellist"]');
    for(let i = 0; i < outlets.length; i++){
        const row = outlets[i].closest("button");
        if (row && panelRows.indexOf(row) < 0) panelRows.push(row);
    }
    const list = document.querySelector("nav[class*='panelList'], [class*='panelList']");
    if (list) {
        const synthetic = SYNTHETIC_IDS.sidebar || [];
        const kids = elementChildren(list);
        let next = 0;
        for(let i = 0; i < kids.length; i++){
            const kid = kids[i];
            const slotOutlet = kid.querySelector('[data-slot="sidebar.panellist"]');
            const moreButton = slotOutlet ? null : kid.querySelector("[aria-haspopup='menu']");
            if (moreButton || String(kid.className || "").indexOf("moreAnchor") >= 0) {
                units.push({
                    el: kid,
                    id: synthetic[next] !== undefined ? synthetic[next] : "sidebar-" + next
                });
                next++;
                continue;
            }
            if (kid.tagName === "BUTTON" || kid.tagName === "A") {
                units.push({
                    el: kid,
                    id: null
                });
                continue;
            }
            const inner = kid.querySelector("button");
            if (inner && panelRows.indexOf(inner) >= 0) units.push({
                el: kid,
                id: null
            });
        }
        for(let i = 0; i < panelRows.length; i++){
            let seen = false;
            for(let j = 0; j < units.length; j++){
                if (units[j].el === panelRows[i] || units[j].el.contains(panelRows[i])) {
                    seen = true;
                    break;
                }
            }
            if (!seen) units.push({
                el: panelRows[i],
                id: null
            });
        }
    }
    if (units.length === 0) {
        for(let i = 0; i < panelRows.length; i++)units.push({
            el: panelRows[i],
            id: null
        });
    }
    return units.length > 0 ? units : null;
}
function unitElements(units) {
    if (!units) return null;
    const rows = [];
    for(let i = 0; i < units.length; i++)rows.push(units[i].el);
    return rows;
}
function collectSidebarRows() {
    return unitElements(collectSidebarUnits());
}
function settingsPanel() {
    return document.querySelector('[data-shortcut-modal="settings"]');
}
function collectSettingsRows() {
    const panel = settingsPanel();
    if (!panel) return null;
    const nav = panel.querySelector("nav");
    if (!nav) return null;
    const divs = nav.querySelectorAll(":scope > div");
    let best = null;
    let bestCount = 0;
    for(let i = 0; i < divs.length; i++){
        const count = divs[i].querySelectorAll(":scope > button").length;
        if (count > bestCount) {
            best = divs[i];
            bestCount = count;
        }
    }
    if (best) return elementChildren(best);
    const buttons = nav.querySelectorAll("button");
    return buttons.length > 0 ? Array.prototype.slice.call(buttons) : null;
}
function collectFooterRows() {
    return outletChildren("sidebar.footer.action");
}
function collectOutletRows(scope) {
    const selector = outletSelector(scope);
    if (!selector) return null;
    const list = document.querySelector(selector);
    if (!list) return null;
    const kids = elementChildren(list);
    if (kids.length > 0) return kids;
    const buttons = list.querySelectorAll('button, [role="tab"], [role="menuitem"]');
    return buttons.length > 0 ? Array.prototype.slice.call(buttons) : null;
}
function collectTabRows() {
    const list = document.querySelector("[data-conversation-tabs]");
    if (!list) return collectOutletRows("tabs");
    const tabs = list.querySelectorAll(':scope > button[role="tab"]');
    const buttons = tabs.length > 0 ? tabs : list.querySelectorAll(":scope > button");
    if (buttons.length > 0) return Array.prototype.slice.call(buttons);
    const deep = list.querySelectorAll('button[role="tab"], button');
    return deep.length > 0 ? Array.prototype.slice.call(deep) : null;
}
function collectComposerUnits() {
    const outlet = outletOf("conversation.composer.dock");
    if (!outlet) return null;
    const container = outlet.parentElement;
    if (!container) return null;
    const units = [];
    const children = elementChildren(container);
    for(let i = 0; i < children.length; i++){
        const child = children[i];
        if (child === outlet) {
            const inner = elementChildren(outlet);
            for(let j = 0; j < inner.length; j++)units.push({
                el: inner[j],
                id: null
            });
        } else {
            units.push({
                el: child,
                id: null
            });
        }
    }
    if (units.length === 0) return null;
    const synthetic = SYNTHETIC_IDS.composer || [];
    let next = 0;
    const entryEls = [];
    const slotChildren = elementChildren(outlet);
    for(let i = 0; i < slotChildren.length; i++)entryEls.push(slotChildren[i]);
    for(let i = 0; i < units.length; i++){
        if (entryEls.indexOf(units[i].el) >= 0) continue;
        units[i].id = synthetic[next] !== undefined ? synthetic[next] : "composer-" + next;
        next++;
    }
    return units;
}
function collectComposerRows() {
    return unitElements(collectComposerUnits());
}
function collectRowUnits(scope) {
    if (scope === "composer") return collectComposerUnits();
    if (scope === "sidebar") return collectSidebarUnits();
    const rows = collectRows(scope);
    if (!rows) return null;
    const units = [];
    for(let i = 0; i < rows.length; i++)units.push({
        el: rows[i],
        id: null
    });
    return units;
}
function syntheticIdsOf(scope) {
    const units = collectRowUnits(scope);
    const out = [];
    if (!units) return out;
    for(let i = 0; i < units.length; i++){
        const id = units[i].id;
        if (id && out.indexOf(id) < 0) out.push(id);
    }
    return out;
}
function collectRows(scope) {
    if (scope === "sidebar") return collectSidebarRows();
    if (scope === "footer") return collectFooterRows() || collectOutletRows("footer");
    if (scope === "tabs") return collectTabRows();
    if (scope === "composer") return collectComposerRows();
    if (scope === "settings") return collectSettingsRows();
    return null;
}
function readEntries(ctx, scope) {
    const slot = SLOT_OF_SCOPE[scope];
    const out = [];
    let entries = null;
    try {
        entries = scope === "sidebar" || scope === "footer" ? ctx.slots.entriesOfSlot(slot) : ctx.slots.entries(slot);
    } catch (err) {
        return out;
    }
    if (!entries) return out;
    for(let i = 0; i < entries.length; i++){
        const options = entries[i].options || {};
        const id = options.id;
        if (id === undefined || id === null || id === "") continue;
        if (HIDDEN_LEDGER_IDS.indexOf(String(id)) >= 0) continue;
        let label = options.label;
        if (typeof label === "function") {
            try {
                label = label();
            } catch (err2) {
                label = undefined;
            }
        }
        const hasLabel = typeof label === "string" && label.length > 0;
        out.push({
            id: String(id),
            label: hasLabel ? label : String(id),
            hasLabel: hasLabel,
            order: options.order || 0
        });
    }
    if (scope !== "tabs" && scope !== "composer") {
        out.sort(function(a, b) {
            return a.order - b.order;
        });
    }
    return out;
}
function measureAxis(el, scope) {
    let node = el.parentElement;
    let depth = 0;
    while(node && depth < 4){
        const kids = node.querySelectorAll("[" + MARKS.scope + '="' + scope + '"][' + MARKS.id + "]");
        let minLeft = Infinity;
        let maxLeft = -Infinity;
        let minTop = Infinity;
        let maxTop = -Infinity;
        let seen = 0;
        for(let i = 0; i < kids.length; i++){
            const rect = kids[i].getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) continue;
            seen++;
            if (rect.left < minLeft) minLeft = rect.left;
            if (rect.left > maxLeft) maxLeft = rect.left;
            if (rect.top < minTop) minTop = rect.top;
            if (rect.top > maxTop) maxTop = rect.top;
        }
        if (seen >= 2) return maxLeft - minLeft > maxTop - minTop ? "x" : "y";
        node = node.parentElement;
        depth++;
    }
    return "y";
}
function containerAxis(el, scope) {
    const declared = AXIS_OF_SCOPE[scope];
    if (declared === "x" || declared === "y") return declared;
    return measureAxis(el, scope);
}
function rowText(el) {
    const label = el.getAttribute && el.getAttribute("aria-label");
    if (label) return label;
    let node = el.querySelector("[class*='navLabel']");
    if (node && node.textContent) return node.textContent;
    node = el.querySelector("[class*='panelTitle'], [class*='label']");
    if (node && node.textContent) return node.textContent;
    return el.textContent || "";
}
function pairRows(entries, rows, stamped, scope) {
    const pairs = [];
    const used = [];
    for(let i = 0; i < entries.length; i++)pairs.push({
        id: entries[i].id,
        label: entries[i].label,
        el: null,
        extra: []
    });
    if (scope) {
        for(let i = 0; i < entries.length; i++){
            const hook = rowHookOf(scope, entries[i].id);
            if (!hook || !hook.selector) continue;
            for(let j = 0; j < rows.length; j++){
                if (used[j]) continue;
                if (!rows[j].matches || !rows[j].matches(hook.selector)) continue;
                pairs[i].el = rows[j];
                used[j] = true;
                break;
            }
        }
    }
    if (stamped) {
        for(let i = 0; i < entries.length; i++){
            const el = stamped[entries[i].id];
            if (!el) continue;
            const at = rows.indexOf(el);
            if (at < 0 || used[at]) continue;
            pairs[i].el = el;
            used[at] = true;
        }
    }
    for(let i = 0; i < entries.length; i++){
        if (!entries[i].hasLabel) continue;
        for(let j = 0; j < rows.length; j++){
            if (used[j]) continue;
            if (rowText(rows[j]) === entries[i].label) {
                pairs[i].el = rows[j];
                used[j] = true;
                break;
            }
        }
    }
    const freeEntries = [];
    const freeRows = [];
    for(let i = 0; i < entries.length; i++){
        if (pairs[i].el) continue;
        if (scope && rowHookOf(scope, entries[i].id)) continue;
        freeEntries.push(i);
    }
    for(let j = 0; j < rows.length; j++)if (!used[j]) freeRows.push(j);
    if (freeEntries.length !== freeRows.length) return pairs;
    let at = 0;
    for(let i = 0; i < entries.length; i++){
        if (pairs[i].el) continue;
        if (scope && rowHookOf(scope, entries[i].id)) continue;
        pairs[i].el = rows[freeRows[at++]];
    }
    return pairs;
}
const __liveRows = {};
function setLiveRows(scope, rows) {
    __liveRows[scope] = rows;
}
function liveRows(scope) {
    const rows = __liveRows[scope];
    return rows === undefined ? null : rows;
}
function liveRowIds(scope) {
    const rows = liveRows(scope);
    if (!rows) return null;
    const out = [];
    for(let i = 0; i < rows.length; i++)out.push(rows[i].id);
    return out;
}
function listedInScope(live, id) {
    return !!live && live.indexOf(id) >= 0;
}
function liveRowLabel(scope, id) {
    const rows = liveRows(scope);
    if (!rows) return "";
    for(let i = 0; i < rows.length; i++)if (rows[i].id === id) return rows[i].label;
    return "";
}
function rowLabelText(ctx, scope, id) {
    const own = rowLabelOf(scope, id);
    if (own) return own;
    const entries = readEntries(ctx, scope);
    let entry = null;
    for(let i = 0; i < entries.length; i++)if (entries[i].id === id) entry = entries[i];
    if (entry && entry.hasLabel) return entry.label;
    return liveRowLabel(scope, id) || hookLabel(scope, id) || (entry ? entry.label : "") || id;
}
const loRowIcons = {};
function liveRowIcon(scope, id) {
    const key = scope + ":" + id;
    const nodes = document.querySelectorAll("[" + MARKS.scope + '="' + scope + '"][' + MARKS.id + "]");
    for(let i = 0; i < nodes.length; i++){
        const node = nodes[i];
        if (node.getAttribute(MARKS.id) !== id) continue;
        const svg = node.querySelector("svg");
        const html = svg ? svg.outerHTML : "";
        if (html) loRowIcons[key] = html;
        return html || loRowIcons[key] || "";
    }
    return loRowIcons[key] || "";
}
function rowIconOf(scope, id) {
    return scope ? liveRowIcon(scope, id) : "";
}
function rememberRowIcon(scope, id, el) {
    if (!el || !id) return;
    const svg = el.querySelector("svg");
    if (!svg) return;
    const key = scope + ":" + id;
    if (!loRowIcons[key]) loRowIcons[key] = svg.outerHTML;
}
function hookLabel(scope, id) {
    const hook = rowHookOf(scope, id);
    return hook && hook.label ? hook.label : "";
}
function liveOrder(scope) {
    const nodes = document.querySelectorAll("[" + MARKS.scope + '="' + scope + '"][' + MARKS.id + "]");
    const rows = [];
    for(let i = 0; i < nodes.length; i++){
        const node = nodes[i];
        const id = node.getAttribute(MARKS.id);
        if (!id) continue;
        rows.push({
            id: id,
            order: parseInt(node.style.order, 10) || 0,
            at: i
        });
    }
    rows.sort(function(a, b) {
        return a.order - b.order || a.at - b.at;
    });
    const out = [];
    for(let i = 0; i < rows.length; i++)if (out.indexOf(rows[i].id) < 0) out.push(rows[i].id);
    return out;
}
function rowAtPoint(selector, x, y) {
    const stack = document.elementsFromPoint(x, y);
    if (stack.length > 0 && stack[0].closest('.lo-stash, .lo-pop, .lo-launcher, [role="dialog"], [role="menu"], [data-shortcut-modal]')) return null;
    const nodes = document.querySelectorAll(selector);
    let hit = null;
    let best = Infinity;
    for(let i = 0; i < nodes.length; i++){
        const node = nodes[i];
        const rect = node.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) continue;
        const area = rect.width * rect.height;
        if (area < best) {
            best = area;
            hit = node;
        }
    }
    return hit;
}
function topInset() {
    let best = 0;
    const tabs = document.querySelector("[data-conversation-tabs]");
    if (tabs) best = Math.max(best, tabs.getBoundingClientRect().bottom);
    const strips = document.querySelectorAll("[data-window-drag]");
    for(let i = 0; i < strips.length; i++)best = Math.max(best, strips[i].getBoundingClientRect().bottom);
    if (best <= 0) best = 48;
    return Math.round(best) + 8;
}
function clampLauncherY(y, height) {
    const min = topInset();
    let max = window.innerHeight - height - 8;
    if (max < min) max = min;
    if (typeof y !== "number" || !isFinite(y)) y = min + 24;
    return Math.max(min, Math.min(max, y));
}
function clampLauncherX(x, width) {
    let max = window.innerWidth - width - 8;
    if (max < 8) max = 8;
    if (typeof x !== "number" || !isFinite(x)) x = 8;
    return Math.max(8, Math.min(max, x));
}

// src/core/dom-line.ts
const loDividerEls = {};
function createSurface(cls, z) {
    const el = document.createElement("div");
    el.className = cls;
    el.setAttribute("aria-hidden", "true");
    el.style.position = "fixed";
    el.style.pointerEvents = "none";
    el.style.zIndex = String(z);
    el.style.display = "none";
    el.style.right = "auto";
    el.style.bottom = "auto";
    el.style.margin = "0";
    document.body.appendChild(el);
    return el;
}
function hiddenAway(el) {
    let node = el;
    while(node && node !== document.body){
        const style = window.getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden") return true;
        node = node.parentElement;
    }
    return false;
}
function unionBox(a, b) {
    const left = Math.min(a.left, b.left);
    const top = Math.min(a.top, b.top);
    const right = Math.max(a.left + a.width, b.left + b.width);
    const bottom = Math.max(a.top + a.height, b.top + b.height);
    return {
        left: left,
        top: top,
        width: right - left,
        height: bottom - top
    };
}
function containerBox(el) {
    let node = el.parentElement;
    while(node && node !== document.body){
        const style = window.getComputedStyle(node);
        if (style.display !== "none" && style.visibility !== "hidden") {
            const rect = node.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) return rect;
        }
        node = node.parentElement;
    }
    return null;
}
function showDivider(scope, near, far, axis) {
    let node = loDividerEls[scope];
    if (!node || !node.isConnected) {
        node = createSurface(CLASS.divider, Z_DIVIDER);
        loDividerEls[scope] = node;
    }
    node.style.zIndex = String(DIVIDER_SCOPES_ON_DIALOG.indexOf(scope) >= 0 ? Z_DIVIDER_DIALOG : Z_DIVIDER);
    const nearRect = near.getBoundingClientRect();
    if (nearRect.width <= 0 || nearRect.height <= 0 || hiddenAway(near)) {
        node.style.display = "none";
        return;
    }
    const farRect = far ? far.getBoundingClientRect() : null;
    if (far && hiddenAway(far)) {
        node.style.display = "none";
        return;
    }
    const usableFar = farRect && farRect.width > 0 && farRect.height > 0 ? farRect : null;
    const found = containerBox(near);
    const container = found || unionBox(nearRect, usableFar || nearRect);
    if (axis === "x") {
        const edge = usableFar ? (usableFar.right + nearRect.left) / 2 : nearRect.left - 1;
        node.style.left = Math.round(edge) + "px";
        node.style.top = Math.round(container.top) + "px";
        node.style.width = "1px";
        node.style.height = Math.round(container.height) + "px";
    } else {
        const edge = usableFar ? (usableFar.bottom + nearRect.top) / 2 : nearRect.top - 1;
        node.style.left = Math.round(container.left) + "px";
        node.style.top = Math.round(edge) + "px";
        node.style.width = Math.round(container.width) + "px";
        node.style.height = "1px";
    }
    node.style.display = "block";
}
function hideDivider(scope) {
    const node = loDividerEls[scope];
    if (node && node.isConnected) node.style.display = "none";
}
function hideAllDividers() {
    for(const scope in loDividerEls)hideDivider(scope);
}
function hideSurfaces() {
    hideAllDividers();
}
function removeSurfaces() {
    for(const scope in loDividerEls){
        const node = loDividerEls[scope];
        if (node && node.parentNode) node.parentNode.removeChild(node);
        delete loDividerEls[scope];
    }
}

// src/core/dom-menu.ts
let loMenuEl = null;
let loMenuBound = false;
function closeMenu() {
    if (loMenuEl && loMenuEl.parentNode) loMenuEl.parentNode.removeChild(loMenuEl);
    loMenuEl = null;
}
function guardPopEvents(menu) {
    const names = [
        "pointerdown",
        "mousedown",
        "pointerup",
        "mouseup",
        "click",
        "contextmenu"
    ];
    for(let i = 0; i < names.length; i++){
        menu.addEventListener(names[i], function(event) {
            event.stopPropagation();
        });
    }
}
function openMenu(event, actions) {
    closeMenu();
    const menu = document.createElement("div");
    menu.className = CLASS.pop;
    menu.setAttribute("role", "menu");
    menu.setAttribute("data-menu-material", "translucent");
    guardPopEvents(menu);
    menu.style.zIndex = String(Z_MENU);
    const material = document.createElement("div");
    material.className = CLASS.popMaterial;
    material.setAttribute("aria-hidden", "true");
    menu.appendChild(material);
    const viewport = document.createElement("div");
    viewport.className = CLASS.popViewport;
    for(let i = 0; i < actions.length; i++){
        const action = actions[i];
        const wrap = document.createElement("div");
        wrap.className = CLASS.popWrap;
        const item = document.createElement("button");
        item.type = "button";
        item.role = "menuitem";
        item.className = CLASS.popItem;
        if (action.disabled) item.disabled = true;
        if (action.icon) {
            const glyph = document.createElement("span");
            glyph.className = CLASS.popIcon;
            glyph.setAttribute("aria-hidden", "true");
            glyph.innerHTML = action.icon;
            item.appendChild(glyph);
        }
        const text = document.createElement("span");
        text.className = CLASS.popText;
        text.textContent = action.label;
        item.appendChild(text);
        item.onclick = function() {
            closeMenu();
            action.run();
        };
        wrap.appendChild(item);
        viewport.appendChild(wrap);
    }
    menu.appendChild(viewport);
    document.body.appendChild(menu);
    const width = menu.offsetWidth || 144;
    const height = menu.offsetHeight || 60;
    const left = Math.min(event.clientX, window.innerWidth - width - 8);
    const top = Math.min(event.clientY, window.innerHeight - height - 8);
    menu.style.left = Math.max(8, Math.round(left)) + "px";
    menu.style.top = Math.max(8, Math.round(top)) + "px";
    loMenuEl = menu;
}
function insideMenu(target) {
    return !!(loMenuEl && target && target instanceof Node && loMenuEl.contains(target));
}
function onMenuPointerDown(event) {
    if (!loMenuEl) return;
    if (insideMenu(event.target)) return;
    if (event.button !== 0) return;
    closeMenu();
}
function onMenuKeyDown(event) {
    if (event.key === "Escape" && loMenuEl) {
        event.stopPropagation();
        closeMenu();
    }
}
function installMenuBindings() {
    if (loMenuBound) return;
    loMenuBound = true;
    document.addEventListener("pointerdown", onMenuPointerDown, true);
    document.addEventListener("keydown", onMenuKeyDown, true);
}
function uninstallMenuBindings() {
    if (!loMenuBound) return;
    loMenuBound = false;
    document.removeEventListener("pointerdown", onMenuPointerDown, true);
    document.removeEventListener("keydown", onMenuKeyDown, true);
    closeMenu();
}
function menuActionsFor(store, scope, id, group, axis) {
    const state = store.get();
    const hidden = isHidden(state, scope, id);
    const official = kindOf(state, scope, id) === "official";
    const inMoreScope = moreScopeOk(scope) && !isSynthetic(scope, id);
    const intoMore = inMoreScope && isIntoMore(state, scope, id);
    const ids = liveOrder(scope) || [];
    const groupIds = [];
    for(let i = 0; i < ids.length; i++){
        if ((group === "all" || groupOf(state, scope, ids[i]) === group) && !isHidden(state, scope, ids[i])) groupIds.push(ids[i]);
    }
    const at = groupIds.indexOf(id);
    const bound = group === "all" ? undefined : group;
    const horizontal = axis === "x";
    const actions = [
        {
            label: horizontal ? t("action.left") : t("action.up"),
            icon: horizontal ? MENU_ICON_LEFT : MENU_ICON_UP,
            disabled: at <= 0,
            run: function() {
                store.update(function(next) {
                    moveRow(next, scope, id, -1, bound);
                });
            }
        },
        {
            label: horizontal ? t("action.right") : t("action.down"),
            icon: horizontal ? MENU_ICON_RIGHT : MENU_ICON_DOWN,
            disabled: at < 0 || at >= groupIds.length - 1,
            run: function() {
                store.update(function(next) {
                    moveRow(next, scope, id, 1, bound);
                });
            }
        },
        {
            label: official ? t("kind.third") : t("kind.official"),
            icon: MENU_ICON_SWITCH,
            disabled: false,
            run: function() {
                store.update(function(next) {
                    next.kinds[scope + ":" + id] = official ? "third" : "official";
                });
            }
        }
    ];
    if (inMoreScope) {
        actions.push({
            label: intoMore ? t("action.outOfMore") : t("action.intoMore"),
            icon: intoMore ? MENU_ICON_UNARCHIVE : MENU_ICON_ARCHIVE,
            disabled: false,
            run: function() {
                store.update(function(next) {
                    setIntoMore(next, scope, id, !intoMore);
                });
            }
        });
    }
    actions.push({
        label: hidden ? t("action.restore") : t("action.stash"),
        icon: hidden ? MENU_ICON_UNARCHIVE : MENU_ICON_ARCHIVE,
        disabled: false,
        run: function() {
            store.update(function(next) {
                setHidden(next, scope, id, !hidden);
            });
        }
    });
    return actions;
}
function attachMenuAt(event, ctx, store, scope, id, group) {
    event.preventDefault();
    event.stopPropagation();
    const el = event.currentTarget || event.target;
    const axis = el.classList && el.classList.contains("lo-more-row") ? "y" : containerAxis(el, scope);
    openMenu(event, menuActionsFor(store, scope, id, group, axis));
}
function rowSelector() {
    return "[" + MARKS.row + '="1"][' + MARKS.id + "]";
}
function managedRowFrom(target, x, y) {
    if (!target || !(target instanceof Element)) return null;
    if (target.closest("input, textarea, [contenteditable='true'], [contenteditable='']")) return null;
    const selector = rowSelector();
    const row = target.closest(selector);
    if (row) return row;
    if (typeof x !== "number" || typeof y !== "number") return null;
    const stack = document.elementsFromPoint(x, y);
    for(let i = 0; i < stack.length; i++){
        const el = stack[i];
        if (el.matches(selector)) return el;
    }
    return rowAtPoint(selector, x, y);
}
function onWindowContextMenu(event) {
    const row = managedRowFrom(event.target, event.clientX, event.clientY);
    if (!row) return;
    const scope = row.getAttribute(MARKS.scope);
    const id = row.getAttribute(MARKS.id);
    if (!scope || !id) return;
    const store = loMenuStore;
    if (!store) return;
    event.preventDefault();
    event.stopPropagation();
    const axis = containerAxis(row, scope);
    openMenu(event, menuActionsFor(store, scope, id, groupOf(store.get(), scope, id), axis));
}
let loMenuStore = null;
function installRowMenu(store) {
    loMenuStore = store;
    installMenuBindings();
    window.addEventListener("contextmenu", onWindowContextMenu, true);
}
function uninstallRowMenu() {
    window.removeEventListener("contextmenu", onWindowContextMenu, true);
    loMenuStore = null;
    uninstallMenuBindings();
}

// src/core/dom-project.ts
const ICON_SVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\" width=\"16\" height=\"16\" fill=\"currentColor\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M853.333333 96H170.666667C130.133333 96 96 130.133333 96 170.666667v682.666666c0 40.533333 34.133333 74.666667 74.666667 74.666667h682.666666c40.533333 0 74.666667-34.133333 74.666667-74.666667V170.666667c0-40.533333-34.133333-74.666667-74.666667-74.666667z m-682.666666 64h682.666666c6.4 0 10.666667 4.266667 10.666667 10.666667v213.333333h-704V170.666667c0-6.4 4.266667-10.666667 10.666667-10.666667zM160 853.333333V448H341.333333v416H170.666667c-6.4 0-10.666667-4.266667-10.666667-10.666667z m693.333333 10.666667H405.333333V448h458.666667v405.333333c0 6.4-4.266667 10.666667-10.666667 10.666667z\" fill=\"currentColor\" p-id=\"11231\"></path></svg>";
function applySelfIcon(el) {
    const holder = el.querySelector("[class*='navIcon']");
    if (!holder) return;
    if (holder.getAttribute("data-lo-icon") === "1") return;
    if (holder.getAttribute("data-lo-original") === null) {
        holder.setAttribute("data-lo-original", holder.innerHTML);
    }
    holder.innerHTML = ICON_SVG;
    holder.setAttribute("data-lo-icon", "1");
}
function clearSelfIcon(el) {
    const holder = el.querySelector("[class*='navIcon']");
    if (!holder || holder.getAttribute("data-lo-icon") !== "1") return;
    const original = holder.getAttribute("data-lo-original");
    if (original !== null) holder.innerHTML = original;
    holder.removeAttribute("data-lo-icon");
    holder.removeAttribute("data-lo-original");
}
function clearMarks(el) {
    if (!el) return;
    el.style.order = "";
    for(let i = 0; i < MARK_NAMES.length; i++)el.removeAttribute(MARK_NAMES[i]);
    clearSelfIcon(el);
}
function isSynthetic(scope, id) {
    const list = SYNTHETIC_IDS[scope];
    return !!list && list.indexOf(id) >= 0;
}
function displayLabel(scope, id, label) {
    if (label) return label;
    const named = rowLabelOf(scope, id);
    if (named) return named;
    const hooked = hookLabel(scope, id);
    if (hooked) return hooked;
    const live = liveRowLabel(scope, id);
    return live || id;
}
function domIdOf(el) {
    const attrs = [
        "data-action",
        "data-testid",
        "data-panel",
        "data-view",
        "id",
        "aria-label",
        "name",
        "title"
    ];
    for(let i = 0; i < attrs.length; i++){
        const value = el.getAttribute(attrs[i]);
        if (value && value.length <= 64) return attrs[i] + ":" + value;
    }
    const text = rowText(el).replace(/\s+/g, " ").trim();
    if (text && text.length <= 48) return "text:" + text;
    const icon = el.querySelector("svg, [class*='icon']");
    const cls = icon && icon.getAttribute("class");
    if (cls) {
        const parts = cls.split(/\s+/).filter(function(part) {
            return part.length > 0 && part.indexOf("__") < 0 && part.indexOf("--") < 0;
        });
        if (parts.length > 0) return "cls:" + parts[0];
    }
    return "";
}
function claimedPairs(pairs, el) {
    for(let i = 0; i < pairs.length; i++)if (pairs[i].el === el) return true;
    return false;
}
function applyScope(ctx, store, scope) {
    const state = store.get();
    const entries = readEntries(ctx, scope);
    const units = collectRowUnits(scope);
    if (!units) {
        hideDivider(scope);
        setLiveRows(scope, null);
        return {
            mounted: false,
            official: 0,
            third: 0
        };
    }
    const rows = [];
    const syntheticIds = [];
    for(let i = 0; i < units.length; i++){
        rows.push(units[i].el);
        syntheticIds.push(units[i].id || "");
    }
    const ids = [];
    for(let i = 0; i < entries.length; i++)ids.push(entries[i].id);
    for(let i = 0; i < syntheticIds.length; i++){
        if (syntheticIds[i] && ids.indexOf(syntheticIds[i]) < 0) ids.push(syntheticIds[i]);
    }
    const ordered = reconcileOrder(state, scope, ids);
    const byId = {};
    for(let i = 0; i < entries.length; i++)byId[entries[i].id] = entries[i];
    const slotRows = [];
    const slotIds = [];
    for(let i = 0; i < units.length; i++){
        if (syntheticIds[i]) continue;
        slotRows.push(units[i].el);
        slotIds.push("");
    }
    const entryList = [];
    for(let i = 0; i < ordered.length; i++){
        const id = ordered[i];
        if (isSynthetic(scope, id)) continue;
        const entry = byId[id];
        entryList.push({
            id: id,
            label: entry ? entry.label : id,
            hasLabel: entry ? entry.hasLabel : false,
            order: entry ? entry.order : 0
        });
    }
    const stamped = {};
    for(let i = 0; i < slotRows.length; i++){
        const sid = slotRows[i].getAttribute(MARKS.id);
        if (sid && !stamped[sid]) stamped[sid] = slotRows[i];
    }
    const pairs = pairRows(entryList, slotRows, stamped, scope);
    const extraUnits = [];
    for(let i = 0; i < units.length; i++){
        if (syntheticIds[i]) continue;
        if (claimedPairs(pairs, units[i].el)) continue;
        const id = domIdOf(units[i].el);
        if (!id || isSynthetic(scope, id)) continue;
        if (ordered.indexOf(id) < 0) ordered.push(id);
        extraUnits.push({
            el: units[i].el,
            id: id
        });
    }
    const claimed = [];
    const visible = {
        official: [],
        third: []
    };
    const live = [];
    let index = 0;
    const canDragOfficial = state.options.allowDragOfficial === true;
    let pairAt = 0;
    for(let i = 0; i < ordered.length; i++){
        const id = ordered[i];
        let el = null;
        if (isSynthetic(scope, id)) {
            for(let j = 0; j < units.length; j++){
                if (syntheticIds[j] === id) {
                    el = units[j].el;
                    break;
                }
            }
        } else {
            for(let j = 0; j < extraUnits.length; j++){
                if (extraUnits[j].id === id) {
                    el = extraUnits[j].el;
                    break;
                }
            }
            if (!el) {
                const pair = pairs[pairAt++];
                el = pair && pair.el ? pair.el : null;
            }
        }
        if (!el) continue;
        clearMarks(el);
        claimed.push(el);
        const kind = kindOf(state, scope, id);
        const group = kind === "official" ? "official" : "third";
        const entry = byId[id];
        live.push({
            id: id,
            label: displayLabel(scope, id, entry && entry.hasLabel ? entry.label : "")
        });
        el.setAttribute(MARKS.row, "1");
        el.setAttribute(MARKS.scope, scope);
        el.setAttribute(MARKS.id, id);
        el.setAttribute(MARKS.kind, kind);
        rememberRowIcon(scope, id, el);
        if (group === "third" || canDragOfficial) el.setAttribute(MARKS.drag, "1");
        if (isHidden(state, scope, id)) {
            el.setAttribute(MARKS.hidden, "1");
            continue;
        }
        if (moreScopeOk(scope) && isIntoMore(state, scope, id)) {
            el.setAttribute(MARKS.hidden, "1");
            continue;
        }
        if (scope === "settings" && id === SELF_ID) applySelfIcon(el);
        el.style.order = String(index++);
        visible[group].push({
            id: id,
            el: el
        });
    }
    const stale = document.querySelectorAll("[" + MARKS.scope + '="' + scope + '"][' + MARKS.row + "]");
    for(let i = 0; i < stale.length; i++){
        if (claimed.indexOf(stale[i]) < 0) clearMarks(stale[i]);
    }
    setLiveRows(scope, live);
    let tail = index;
    for(let i = 0; i < rows.length; i++){
        if (claimed.indexOf(rows[i]) < 0) rows[i].style.order = String(1000 + tail++);
    }
    let interleaved = false;
    if (dividerEnabled(state, scope) && mixedOrder(state)) {
        const sequence = liveOrder(scope) || [];
        let seenThird = false;
        for(let i = 0; i < sequence.length; i++){
            if (isHidden(state, scope, sequence[i])) continue;
            if (kindOf(state, scope, sequence[i]) === "third") seenThird = true;
            else if (seenThird) interleaved = true;
        }
    }
    if (dividerEnabled(state, scope) && !interleaved && visible.official.length > 0 && visible.third.length > 0) {
        const firstThird = visible.third[0].el;
        const lastOfficial = visible.official[visible.official.length - 1].el;
        showDivider(scope, firstThird, lastOfficial, containerAxis(firstThird, scope));
    } else {
        hideDivider(scope);
    }
    return {
        mounted: true,
        official: visible.official.length,
        third: visible.third.length
    };
}
function clearScope(scope) {
    const rows = document.querySelectorAll("[" + MARKS.scope + '="' + scope + '"][' + MARKS.row + "]");
    for(let i = 0; i < rows.length; i++)clearMarks(rows[i]);
    hideDivider(scope);
    setLiveRows(scope, null);
}

// src/core/dom-navigate.ts
let loActiveStore = null;
function setActiveStore(store) {
    loActiveStore = store;
}
function settingsWord() {
    const label = t("nav");
    const words = [
        label,
        "设置",
        "Settings",
        "settings"
    ];
    for(let i = 0; i < words.length; i++)if (!words[i]) words.splice(i--, 1);
    return words;
}
function menuItems() {
    const nodes = document.querySelectorAll('[role="menu"] [role="menuitem"], [role="listbox"] [role="option"], [role="menu"] button, [class*="menu"] [class*="item"]');
    const out = [];
    for(let i = 0; i < nodes.length; i++)out.push(nodes[i]);
    return out;
}
function openSettingsPanel() {
    if (settingsPanel()) return true;
    let trigger = document.querySelector('[data-slot="sidebar.settings"] button');
    if (!trigger) {
        trigger = document.querySelector('button[aria-haspopup="dialog"][aria-expanded]');
    }
    if (!trigger) trigger = document.querySelector('button[aria-haspopup="menu"]');
    if (!trigger) trigger = document.querySelector("[data-shortcut-modal='settings']");
    if (!trigger) return false;
    trigger.click();
    const items = menuItems();
    const words = settingsWord();
    for(let i = 0; i < items.length; i++){
        const text = rowText(items[i]);
        for(let j = 0; j < words.length; j++){
            if (text.indexOf(words[j]) >= 0) {
                items[i].click();
                return true;
            }
        }
    }
    return true;
}
function closeSettings() {
    const panel = settingsPanel();
    if (!panel) return;
    let close = panel.querySelector("button[class*='close']");
    if (!close) close = panel.querySelector("button[aria-label]");
    if (close) {
        close.click();
        return;
    }
    const mask = panel.querySelector("[class*='mask']");
    if (mask) mask.click();
}
function openSettingsSection(id, label) {
    if (!openSettingsPanel()) {
        warn("open:" + id + " " + t("nav.failed").replace("{label}", label));
        return;
    }
    let tries = 0;
    const attempt = function() {
        if (settingsPanel()) {
            const rows = collectSettingsRows();
            if (rows) {
                for(let i = 0; i < rows.length; i++){
                    const rowId = rows[i].getAttribute(MARKS.id);
                    if (rowId && rowId === id || !rowId && rowText(rows[i]) === label) {
                        clickRevealed(rows[i]);
                        return;
                    }
                }
            }
        }
        tries++;
        if (tries < 40) window.setTimeout(attempt, 50);
        else warn("navigate:" + id + " " + t("nav.failed").replace("{label}", label));
    };
    window.setTimeout(attempt, 0);
}
function isInteractive(el) {
    const tag = el.tagName;
    if (tag === "BUTTON" || tag === "A" || tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return true;
    const role = el.getAttribute("role");
    if (role === "button" || role === "tab" || role === "menuitem" || role === "link") return true;
    return el.hasAttribute("onclick");
}
function clickTargetOf(el) {
    if (isInteractive(el)) return el;
    const nodes = el.querySelectorAll("button, a, [role='button'], [role='tab'], [role='menuitem'], [onclick]");
    for(let i = 0; i < nodes.length; i++){
        const node = nodes[i];
        if (node.disabled) continue;
        return node;
    }
    return el;
}
function clickRevealed(el) {
    const wasHidden = el.hasAttribute(MARKS.hidden);
    if (wasHidden) el.removeAttribute(MARKS.hidden);
    clickTargetOf(el).click();
    if (wasHidden) {
        window.requestAnimationFrame(function() {
            el.setAttribute(MARKS.hidden, "1");
        });
    }
}
function liveRowEl(scope, id) {
    const stamped = document.querySelectorAll("[" + MARKS.scope + '="' + scope + '"][' + MARKS.id + "]");
    for(let i = 0; i < stamped.length; i++){
        if (stamped[i].getAttribute(MARKS.id) === id) return stamped[i];
    }
    return null;
}
function rowClickable(el) {
    return isInteractive(el) || clickTargetOf(el) !== el;
}
function rowNavigable(scope, id) {
    if (scope === "settings") return true;
    if (!liveRowIds(scope)) return false;
    const el = liveRowEl(scope, id);
    if (!el) return false;
    return rowClickable(el);
}
function navigateFromSettings(ctx, scope, id) {
    if (scope === "settings") {
        navigateTo(ctx, scope, id);
        return;
    }
    navigateTo(ctx, scope, id);
    window.requestAnimationFrame(function() {
        closeSettings();
    });
}
function navigateTo(ctx, scope, id) {
    if (scope === "settings") {
        const entries = readEntries(ctx, scope);
        let label = id;
        for(let i = 0; i < entries.length; i++){
            if (entries[i].id === id) {
                label = entries[i].label;
                break;
            }
        }
        openSettingsSection(id, label);
        return;
    }
    if (scope === "sidebar" && !isSynthetic(scope, id)) {
        try {
            const layout = ctx.get("layout");
            if (layout && typeof layout.selectPanel === "function") {
                layout.selectPanel(id);
                return;
            }
        } catch (err) {}
    }
    const stamped = document.querySelectorAll("[" + MARKS.scope + '="' + scope + '"][' + MARKS.id + "]");
    for(let i = 0; i < stamped.length; i++){
        if (stamped[i].getAttribute(MARKS.id) === id) {
            clickRevealed(stamped[i]);
            return;
        }
    }
    const rows = collectRows(scope);
    if (!rows) return;
    const entries = readEntries(ctx, scope);
    const ids = [];
    for(let i = 0; i < entries.length; i++)ids.push(entries[i].id);
    const state = loActiveStore ? loActiveStore.get() : null;
    const ordered = state ? reconcileOrder(state, scope, ids) : ids;
    const byId = {};
    for(let i = 0; i < entries.length; i++)byId[entries[i].id] = entries[i];
    const list = [];
    for(let i = 0; i < ordered.length; i++){
        const entry = byId[ordered[i]];
        list.push(entry ? entry : {
            id: ordered[i],
            label: ordered[i],
            hasLabel: false,
            order: 0
        });
    }
    const pairs = pairRows(list, rows);
    for(let i = 0; i < pairs.length; i++){
        if (pairs[i].id === id && pairs[i].el) {
            clickRevealed(pairs[i].el);
            return;
        }
    }
}

// src/core/organizer.ts
function createOrganizer(ctx, store, report) {
    let disposed = false;
    let muted = false;
    let dirty = false;
    let frame = 0;
    let observer = null;
    let unsubscribe = null;
    const disposers = [];
    function applyAll() {
        if (disposed) return;
        if (dragActive()) return;
        for(let i = 0; i < SCOPES.length; i++){
            const scope = SCOPES[i].key;
            try {
                applyScope(ctx, store, scope);
            } catch (err) {
                report("apply:" + scope, err);
            }
        }
        notifyRevision();
        muted = true;
        window.setTimeout(function() {
            muted = false;
            if (dirty) {
                dirty = false;
                schedule();
            }
        }, 0);
    }
    function schedule() {
        if (disposed || frame) return;
        frame = window.requestAnimationFrame(function() {
            frame = 0;
            applyAll();
        });
    }
    function onMutations() {
        if (muted) {
            dirty = true;
            return;
        }
        schedule();
    }
    function onViewportChange() {
        hideSurfaces();
        schedule();
    }
    function start() {
        disposed = false;
        for(let i = 0; i < SCOPES.length; i++){
            const scope = SCOPES[i];
            try {
                const dispose = ctx.effect(function() {
                    return ctx.slots.subscribe(scope.slot, schedule);
                }, "layout-organizer: watch " + scope.slot);
                if (typeof dispose === "function") disposers.push(dispose);
            } catch (err) {
                report("subscribe:" + scope.slot, err);
            }
        }
        try {
            observer = new MutationObserver(onMutations);
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        } catch (err) {
            report("observer", err);
        }
        window.addEventListener("resize", onViewportChange, true);
        window.addEventListener("scroll", onViewportChange, true);
        window.addEventListener("locationchange", schedule);
        unsubscribe = store.subscribe(schedule);
        schedule();
    }
    function stop() {
        disposed = true;
        if (frame) {
            window.cancelAnimationFrame(frame);
            frame = 0;
        }
        window.removeEventListener("resize", onViewportChange, true);
        window.removeEventListener("scroll", onViewportChange, true);
        window.removeEventListener("locationchange", schedule);
        if (unsubscribe) {
            try {
                unsubscribe();
            } catch (err) {}
            unsubscribe = null;
        }
        for(let i = 0; i < disposers.length; i++){
            try {
                disposers[i]();
            } catch (err) {}
        }
        disposers.length = 0;
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        for(let i = 0; i < SCOPES.length; i++){
            clearScope(SCOPES[i].key);
        }
        hideSurfaces();
        closeMenu();
    }
    return {
        start: start,
        stop: stop,
        schedule: schedule,
        refresh: applyAll
    };
}

// src/drag/drag-frame.ts
function createFrameThrottle(run) {
    let rafId = 0;
    let last = 0;
    function frame() {
        rafId = 0;
        run(last);
    }
    return {
        schedule: function(pointer) {
            last = pointer;
            if (rafId) return;
            rafId = window.requestAnimationFrame(frame);
        },
        flush: function() {
            if (!rafId) return;
            window.cancelAnimationFrame(rafId);
            rafId = 0;
            run(last);
        },
        drop: function() {
            if (!rafId) return;
            window.cancelAnimationFrame(rafId);
            rafId = 0;
        }
    };
}
function bindDragEvents(handlers) {
    const doc = document;
    doc.addEventListener("pointerdown", handlers.down, true);
    doc.addEventListener("pointermove", handlers.move, true);
    doc.addEventListener("pointerup", handlers.up, true);
    doc.addEventListener("pointercancel", handlers.cancel, true);
    doc.addEventListener("click", handlers.click, true);
    window.addEventListener("scroll", handlers.scroll, true);
    if (handlers.resize) window.addEventListener("resize", handlers.scroll, true);
    let bound = true;
    return function() {
        if (!bound) return;
        bound = false;
        doc.removeEventListener("pointerdown", handlers.down, true);
        doc.removeEventListener("pointermove", handlers.move, true);
        doc.removeEventListener("pointerup", handlers.up, true);
        doc.removeEventListener("pointercancel", handlers.cancel, true);
        doc.removeEventListener("click", handlers.click, true);
        window.removeEventListener("scroll", handlers.scroll, true);
        if (handlers.resize) window.removeEventListener("resize", handlers.scroll, true);
    };
}

// src/drag/drag-rows.ts
const LO_DRAG_THRESHOLD = 4;
const LO_CLICK_SUPPRESS_MS = 300;
let loDragActive = false;
function dragActive() {
    return loDragActive;
}
function setDragActive(next) {
    loDragActive = next;
}
function rowsInScope(scope) {
    const nodes = document.querySelectorAll("[" + MARKS.scope + '="' + scope + '"][' + MARKS.row + "]");
    const out = [];
    for(let i = 0; i < nodes.length; i++){
        const node = nodes[i];
        if (node.hasAttribute(MARKS.hidden)) continue;
        out.push(node);
    }
    return out;
}
function visualRows(scope) {
    const rows = rowsInScope(scope);
    const keyed = rows.map(function(el, at) {
        return {
            el: el,
            order: parseInt(el.style.order, 10) || 0,
            at: at
        };
    });
    keyed.sort(function(a, b) {
        return a.order - b.order || a.at - b.at;
    });
    return keyed.map(function(row) {
        return row.el;
    });
}
function groupOfEl(el) {
    return el.getAttribute(MARKS.kind) === "official" ? "official" : "third";
}
function rectsOf(rows, axis) {
    const out = [];
    for(let i = 0; i < rows.length; i++){
        const rect = rows[i].getBoundingClientRect();
        const id = rows[i].getAttribute(MARKS.id) || "";
        out.push({
            el: rows[i],
            id: id,
            mid: axis === "x" ? rect.left + rect.width / 2 : rect.top + rect.height / 2,
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
        });
    }
    return out;
}
function permuteOrder(nodes, sequence) {
    const slots = [];
    for(let i = 0; i < nodes.length; i++)slots.push(parseInt(nodes[i].style.order, 10) || 0);
    slots.sort(function(a, b) {
        return a - b;
    });
    for(let i = 0; i < sequence.length && i < slots.length; i++){
        sequence[i].style.order = String(slots[i]);
    }
}
function previewGroup(scope, group, sequence, mixed) {
    const all = rowsInScope(scope);
    const mine = [];
    if (mixed) {
        for(let i = 0; i < all.length; i++)mine.push(all[i]);
    } else {
        for(let i = 0; i < all.length; i++){
            if (groupOfEl(all[i]) === group) mine.push(all[i]);
        }
    }
    permuteOrder(mine, sequence);
}
function insertionIndex(rects, axis, pointer, dragged) {
    let index = 0;
    for(let i = 0; i < rects.length; i++){
        if (rects[i].id === dragged) continue;
        if (pointer > rects[i].mid) index++;
    }
    return index;
}
function createDragController(store) {
    let pending = null;
    let active = false;
    let scope = "";
    let id = "";
    let group = "";
    let axis = "y";
    let rects = [];
    let sequence = [];
    let draggedEl = null;
    let suppressClickUntil = 0;
    let lastPointer = 0;
    const throttle = createFrameThrottle(function(pointer) {
        if (active && draggedEl) applyAt(pointer);
    });
    function rowFrom(target, x, y) {
        if (!target || !(target instanceof Element)) return null;
        const selector = "[" + MARKS.drag + '="1"][' + MARKS.id + "]";
        const row = target.closest(selector);
        if (row) return row;
        if (typeof x !== "number" || typeof y !== "number") return null;
        const stack = document.elementsFromPoint(x, y);
        for(let i = 0; i < stack.length; i++){
            if (stack[i].matches(selector)) return stack[i];
        }
        return rowAtPoint(selector, x, y);
    }
    function groupRows() {
        const all = visualRows(scope);
        if (mixedOrder(store.get())) return all;
        if (group === "all") return all;
        const mine = [];
        for(let i = 0; i < all.length; i++){
            if (groupOfEl(all[i]) === group) mine.push(all[i]);
        }
        return mine;
    }
    function snapshotGroup() {
        rects = rectsOf(groupRows(), axis);
        sequence = rects.map(function(rect) {
            return rect.el;
        });
    }
    function measureRects() {
        const mine = [];
        const rows = groupRows();
        for(let i = 0; i < rows.length; i++){
            if (rows[i] !== draggedEl) mine.push(rows[i]);
        }
        return rectsOf(mine, axis);
    }
    function begin(event, row) {
        active = true;
        loDragActive = true;
        scope = row.getAttribute(MARKS.scope) || "";
        id = row.getAttribute(MARKS.id) || "";
        group = groupOfEl(row);
        draggedEl = row;
        axis = containerAxis(row, scope);
        row.setAttribute(MARKS.dragging, "1");
        snapshotGroup();
        document.body.style.cursor = "grabbing";
        event.preventDefault();
    }
    function update(event) {
        if (!draggedEl) return;
        lastPointer = axis === "x" ? event.clientX : event.clientY;
        throttle.schedule(lastPointer);
    }
    function flushUpdate() {
        throttle.flush();
    }
    function applyAt(pointer) {
        if (!draggedEl) return;
        const live = measureRects();
        rects = live;
        const at = insertionIndex(live, axis, pointer, id);
        const next = [];
        for(let i = 0; i < live.length; i++)next.push(live[i].el);
        next.splice(at, 0, draggedEl);
        sequence = next;
        previewGroup(scope, group, next, mixedOrder(store.get()));
    }
    function finish() {
        if (!draggedEl) return;
        flushUpdate();
        const finalSequence = sequence.slice();
        const finalScope = scope;
        const ids = finalSequence.map(function(node) {
            return node.getAttribute(MARKS.id) || "";
        });
        const hasRealId = ids.length > 0 && ids.every(function(value) {
            return value !== "";
        });
        const draggedId = id;
        suppressClickUntil = Date.now() + LO_CLICK_SUPPRESS_MS;
        cleanup();
        if (!hasRealId) return;
        const next = [];
        const all = visualRows(finalScope);
        const seen = {};
        for(let i = 0; i < finalSequence.length; i++){
            const rid = finalSequence[i].getAttribute(MARKS.id);
            if (rid && !seen[rid]) {
                seen[rid] = true;
                next.push(rid);
            }
        }
        for(let i = 0; i < all.length; i++){
            const rid = all[i].getAttribute(MARKS.id);
            if (rid && !seen[rid]) {
                seen[rid] = true;
                next.push(rid);
            }
        }
        let savedIds = [];
        try {
            savedIds = (store.get().order[finalScope] || []).slice();
        } catch (err) {
            savedIds = [];
        }
        for(let i = 0; i < savedIds.length; i++){
            if (next.indexOf(savedIds[i]) >= 0) continue;
            next.push(savedIds[i]);
        }
        store.update(function(state) {
            writeOrder(state, finalScope, next);
        });
    }
    function cleanup() {
        throttle.drop();
        if (draggedEl) {
            draggedEl.removeAttribute(MARKS.dragging);
            draggedEl.removeAttribute(MARKS.over);
            draggedEl.removeAttribute(MARKS.overActive);
        }
        document.body.style.cursor = "";
        pending = null;
        active = false;
        loDragActive = false;
        draggedEl = null;
        rects = [];
        sequence = [];
    }
    function onDown(event) {
        if (event.button !== 0) return;
        if (event.target instanceof Element && event.target.closest(".lo-pop, .lo-stash, .lo-launcher")) return;
        const row = rowFrom(event.target, event.clientX, event.clientY);
        if (!row) return;
        pending = {
            row: row,
            scope: row.getAttribute(MARKS.scope) || "",
            id: row.getAttribute(MARKS.id) || "",
            group: groupOfEl(row),
            x: event.clientX,
            y: event.clientY
        };
    }
    function onMove(event) {
        if (!active) {
            if (!pending) return;
            const dx = event.clientX - pending.x;
            const dy = event.clientY - pending.y;
            if (dx * dx + dy * dy < LO_DRAG_THRESHOLD * LO_DRAG_THRESHOLD) return;
            const row = pending.row;
            pending = null;
            begin(event, row);
            return;
        }
        event.preventDefault();
        update(event);
    }
    function onUp() {
        if (active) finish();
        else cleanup();
    }
    function onCancel() {
        if (active) {
            cleanup();
            store.update(function() {});
        } else {
            cleanup();
        }
    }
    function refreshRects() {
        if (active && draggedEl) applyAt(lastPointer);
    }
    function onScroll() {
        if (active) refreshRects();
    }
    function onClickCapture(event) {
        if (Date.now() < suppressClickUntil) {
            event.preventDefault();
            event.stopPropagation();
        }
    }
    let detachEvents = null;
    return {
        attach: function() {
            if (detachEvents) return;
            detachEvents = bindDragEvents({
                down: onDown,
                move: onMove,
                up: onUp,
                cancel: onCancel,
                click: onClickCapture,
                scroll: onScroll,
                resize: true
            });
        },
        detach: function() {
            if (!detachEvents) return;
            detachEvents();
            detachEvents = null;
            cleanup();
        }
    };
}

// src/drag/drag-list.ts
function createListDragController(store) {
    let pending = null;
    let active = false;
    let suppressClickUntil = 0;
    let rects = [];
    let sequence = [];
    let draggedEl = null;
    let containerEl = null;
    let group = "";
    let id = "";
    let touched = [];
    let insertAt = 0;
    let lastPointer = 0;
    const throttle = createFrameThrottle(function(pointer) {
        if (active && draggedEl) applyAt(pointer);
    });
    function rowFrom(target) {
        if (!target || !(target instanceof Element)) return null;
        const row = target.closest(".lo-row[data-lo-list-id]");
        if (!row || row.getAttribute("data-locked") === "1") return null;
        return row;
    }
    function rowsOf(container) {
        const nodes = container.querySelectorAll(":scope > .lo-row[data-lo-list-id]");
        return Array.prototype.slice.call(nodes);
    }
    function groupRows(container, want) {
        const all = rowsOf(container);
        const out = [];
        for(let i = 0; i < all.length; i++){
            if (all[i].getAttribute("data-lo-list-group") === want) out.push(all[i]);
        }
        return out;
    }
    function refreshRects() {
        if (!containerEl) return;
        const mine = groupRows(containerEl, group);
        rects = [];
        for(let i = 0; i < mine.length; i++){
            const rect = mine[i].getBoundingClientRect();
            rects.push({
                el: mine[i],
                id: mine[i].getAttribute("data-lo-list-id") || "",
                mid: rect.top + rect.height / 2,
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
            });
        }
    }
    function previewOrder(container, want, sequence) {
        const all = rowsOf(container);
        const next = [];
        let done = false;
        for(let i = 0; i < all.length; i++){
            if (all[i].getAttribute("data-lo-list-group") === want) {
                if (!done) {
                    done = true;
                    for(let k = 0; k < sequence.length; k++)next.push(sequence[k]);
                }
                continue;
            }
            next.push(all[i]);
        }
        if (!done) return;
        for(let i = 0; i < next.length; i++)next[i].style.order = String(i);
        touched = next;
    }
    function scheduleClearPreview() {
        if (touched.length === 0) return;
        const nodes = touched;
        touched = [];
        requestAnimationFrame(function() {
            if (active) return;
            for(let i = 0; i < nodes.length; i++)nodes[i].style.order = "";
        });
    }
    function begin(row, container) {
        active = true;
        draggedEl = row;
        containerEl = container;
        id = row.getAttribute("data-lo-list-id") || "";
        group = row.getAttribute("data-lo-list-group") || "";
        row.setAttribute("data-lo-dragging", "1");
        setDragActive(true);
        refreshRects();
        sequence = rects.map(function(rect) {
            return rect.el;
        });
        insertAt = 0;
        for(let i = 0; i < rects.length; i++){
            if (rects[i].el === row) insertAt = i;
        }
        document.documentElement.style.cursor = "grabbing";
    }
    function update(event) {
        if (!draggedEl) return;
        lastPointer = event.clientY;
        throttle.schedule(lastPointer);
    }
    function flushUpdate() {
        throttle.flush();
    }
    function applyAt(pointer) {
        if (!draggedEl) return;
        const without = rects.filter(function(rect) {
            return rect.id !== id;
        });
        let at = 0;
        for(let i = 0; i < without.length; i++){
            if (pointer > without[i].mid) at++;
        }
        insertAt = at;
        const next = [];
        for(let i = 0; i < without.length; i++)next.push(without[i].el);
        next.splice(at, 0, draggedEl);
        sequence = next;
        previewOrder(draggedEl.parentElement || containerEl, group, next);
    }
    function cleanup() {
        throttle.drop();
        if (draggedEl) draggedEl.removeAttribute("data-lo-dragging");
        document.documentElement.style.cursor = "";
        setDragActive(false);
        pending = null;
        active = false;
        draggedEl = null;
        containerEl = null;
        rects = [];
        sequence = [];
    }
    function onDown(event) {
        if (event.button !== 0) return;
        if (event.target instanceof Element && event.target.closest(".lo-btn")) return;
        const row = rowFrom(event.target);
        if (!row) return;
        const container = row.parentElement;
        if (!container || !container.getAttribute("data-lo-list-scope")) return;
        pending = {
            row: row,
            container: container,
            scope: container.getAttribute("data-lo-list-scope") || "",
            id: row.getAttribute("data-lo-list-id") || "",
            group: row.getAttribute("data-lo-list-group") || "",
            x: event.clientX,
            y: event.clientY
        };
    }
    function onMove(event) {
        if (!pending && !active) return;
        if (!active) {
            if (!pending) return;
            if (Math.abs(event.clientX - pending.x) < LO_DRAG_THRESHOLD && Math.abs(event.clientY - pending.y) < LO_DRAG_THRESHOLD) return;
            const row = pending.row;
            const container = pending.container;
            pending = null;
            begin(row, container);
        }
        event.preventDefault();
        update(event);
    }
    function onUp() {
        if (!active || !draggedEl || !containerEl) {
            cleanup();
            return;
        }
        flushUpdate();
        const finalSequence = sequence.slice();
        const finalScope = containerEl.getAttribute("data-lo-list-scope") || "";
        const rows = rowsOf(containerEl);
        const allIds = [];
        for(let i = 0; i < rows.length; i++)allIds.push(rows[i].getAttribute("data-lo-list-id") || "");
        const ids = finalSequence.map(function(node) {
            return node.getAttribute("data-lo-list-id") || "";
        });
        cleanup();
        if (ids.length === 0) return;
        suppressClickUntil = Date.now() + LO_CLICK_SUPPRESS_MS;
        scheduleClearPreview();
        const without = allIds.filter(function(rowId) {
            return rowId !== id;
        });
        let low = -1;
        let high = -1;
        for(let i = 0; i < rows.length; i++){
            if (rows[i].getAttribute("data-lo-list-group") !== group) continue;
            const rowId = rows[i].getAttribute("data-lo-list-id") || "";
            if (rowId === id) continue;
            const at = without.indexOf(rowId);
            if (at < 0) continue;
            if (low < 0 || at < low) low = at;
            if (high < 0 || at > high) high = at;
        }
        const merged = [];
        for(let i = 0; i < without.length; i++)merged.push(without[i]);
        if (low < 0) {
            const self = allIds.indexOf(id);
            merged.splice(self < 0 ? merged.length : self, 0, id);
        } else {
            let to = low + insertAt;
            if (to < low) to = low;
            if (to > high + 1) to = high + 1;
            merged.splice(to, 0, id);
        }
        store.update(function(state) {
            writeOrder(state, finalScope, merged);
        });
    }
    function onCancel() {
        const nodes = touched;
        touched = [];
        for(let i = 0; i < nodes.length; i++)nodes[i].style.order = "";
        cleanup();
    }
    function onClickCapture(event) {
        if (Date.now() > suppressClickUntil) return;
        suppressClickUntil = 0;
        event.preventDefault();
        event.stopPropagation();
    }
    function onScroll() {
        if (active) refreshRects();
    }
    let detachEvents = null;
    return {
        attach: function() {
            if (detachEvents) return;
            detachEvents = bindDragEvents({
                down: onDown,
                move: onMove,
                up: onUp,
                cancel: onCancel,
                click: onClickCapture,
                scroll: onScroll,
                resize: false
            });
        },
        detach: function() {
            if (!detachEvents) return;
            detachEvents();
            detachEvents = null;
            cleanup();
        }
    };
}

// src/ui/styles.ts
const CSS_TEXT = [
    "[data-lo-row='1']{position:relative}",
    "[data-lo-draggable='1']{cursor:grab;-webkit-user-select:none;user-select:none;transition:opacity .14s ease,box-shadow .12s ease,transform .14s ease}",
    "[data-lo-draggable='1']:active{cursor:grabbing}",
    "[data-lo-dragging='1']{cursor:grabbing;opacity:.45}",
    "[data-lo-hidden='1']{display:none !important}",
    ".lo-row[data-hidden='1']>*{opacity:.5}",
    ".lo-row[data-hidden='1']>[data-lit='1']{opacity:1}",
    ".lo-divider{background:var(--dsw-alias-border-l2);border-radius:2px}",
    ".lo-pop{position:fixed;z-index:" + Z_MENU + ";box-sizing:border-box;width:max-content;min-width:0;max-width:360px;padding:4px;display:flex;flex-direction:column;gap:0;border:0;border-radius:var(--dsw-radius-lg,16px);isolation:isolate;--dsw-elevation-stroke-color:var(--dsw-alias-border-l1,#0000000a);box-shadow:var(--dsw-elevation-prominent,0 0 0 .5px var(--dsw-alias-border-l1,#0000000a),0 3px 8px 0 #0000000a,0 0 20px 0 #0000000d)}",
    ".lo-pop-material{position:absolute;inset:0;z-index:-1;border-radius:inherit;background:var(--dsw-menu-surface-fill,#f8f9fa94);backdrop-filter:var(--dsw-menu-backdrop-filter,blur(40px) saturate(150%));pointer-events:none}",
    ".lo-pop-viewport{display:flex;flex-direction:column;min-height:0}",
    ".lo-pop-wrap{position:relative}",
    ".lo-pop-item{display:flex;align-items:center;gap:6px;width:100%;min-height:34px;padding:6px 8px;border:0;border-radius:var(--dsw-radius-md,12px);background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:20px;text-align:left;cursor:pointer}",
    ".lo-pop-item:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#2631480f)}",
    ".lo-pop-item:focus-visible:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#2631480f);outline:none}",
    ".lo-pop-item:disabled{opacity:.4;cursor:not-allowed}",
    ".lo-pop-icon{display:inline-flex;flex:none;width:14px;height:14px;align-items:center;justify-content:center;color:var(--dsw-alias-menu-icon,currentColor)}",
    ".lo-pop-icon svg{width:14px;height:14px}",
    ".lo-pop-text{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".lo-launcher{position:fixed;z-index:" + Z_LAUNCHER + ";display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 11px;border:0;border-radius:999px;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-inverted,#fff);font:inherit;font-size:12px;font-weight:600;box-shadow:0 6px 20px rgba(0,0,0,.28);cursor:grab;touch-action:none;-webkit-user-select:none;user-select:none;transition:box-shadow .14s ease,opacity .14s ease}",
    ".lo-launcher:hover{box-shadow:0 10px 26px rgba(0,0,0,.34)}",
    ".lo-launcher[data-dragging='1']{cursor:grabbing;opacity:.85;transition:none}",
    ".lo-launcher-count{display:inline-flex;align-items:center;justify-content:center;min-width:17px;height:17px;padding:0 5px;border-radius:999px;background:rgba(127,127,127,.35);font-size:11px;line-height:1}",
    ".lo-mask{position:fixed;inset:0;z-index:" + Z_MASK + ";background:var(--dsw-alias-bg-mask-1,rgba(0,0,0,.32));backdrop-filter:blur(2px);animation:lo-fade .14s ease}",
    ".lo-stash{position:fixed;z-index:" + Z_STASH + ";top:50%;left:50%;transform:translate(-50%,-50%);width:min(520px,92vw);height:min(720px,84vh);display:flex;flex-direction:column;border-radius:16px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);box-shadow:0 24px 64px rgba(0,0,0,.34);overflow:hidden;animation:lo-rise .16s ease}",
    ".lo-stash-head{display:flex;align-items:center;gap:10px;padding:13px 16px;border-bottom:1px solid var(--dsw-alias-border-l1)}",
    ".lo-stash-title{font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary)}",
    ".lo-stash-count{font-size:12px;color:var(--dsw-alias-label-secondary)}",
    ".lo-stash-close{margin-left:auto;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:16px;line-height:1;cursor:pointer}",
    ".lo-stash-close:hover{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}",
    ".lo-stash-sorts{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:12px 16px 8px}",
    ".lo-stash-search{padding:0 16px 10px}",
    ".lo-stash-actions{display:flex;padding:0 16px 10px}",
    ".lo-stash-actions>.lo-btn{flex:1 1 auto;white-space:nowrap}",
    ".lo-chip{padding:5px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer;text-align:center;transition:background .12s ease,border-color .12s ease,color .12s ease}",
    ".lo-chip[aria-pressed='true']{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-inverted,#fff)}",
    ".lo-chip:hover{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary)}",
    ".lo-chip[aria-pressed='true']:hover{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-inverted,#fff);filter:brightness(1.08)}",
    ".lo-stash-body{flex:1 1 auto;min-height:0;overflow:auto;padding:4px 12px 14px;display:flex;flex-direction:column;gap:4px;scrollbar-gutter:stable}",
    ".lo-stash-body>*{flex:0 0 auto}",
    ".lo-stash-group{display:flex;align-items:center;gap:10px;padding:12px 8px 6px;font-size:11px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;color:var(--dsw-alias-label-secondary);cursor:pointer;-webkit-user-select:none;user-select:none}",
    ".lo-stash-group-title{flex:1 1 auto;min-width:0;display:flex;align-items:center;gap:6px;padding:0;border:0;background:transparent;color:inherit;font:inherit;letter-spacing:inherit;text-transform:inherit;text-align:left;cursor:pointer}",
    ".lo-stash-group:hover{color:var(--dsw-alias-label-primary)}",
    ".lo-stash-group-text{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".lo-stash-group-chev{flex:0 0 auto;display:inline-block;width:10px;font-size:10px;line-height:1;transition:transform .12s ease}",
    ".lo-stash-group[data-open='0'] .lo-stash-group-chev{transform:rotate(-90deg)}",
    ".lo-stash-group .lo-btn{flex:0 0 auto;min-height:22px;padding:0 8px;font-size:11px;font-weight:400;border-radius:6px;text-transform:none;letter-spacing:0;cursor:pointer}",
    ".lo-stash-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px}",
    ".lo-stash-row:hover{background:var(--dsw-alias-bg-layer-1)}",
    ".lo-stash-row>.lo-btn{flex:0 0 auto;white-space:nowrap}",
    ".lo-stash-main{flex:1 1 auto;min-width:0;display:flex;align-items:center;gap:9px;padding:5px 2px;border:0;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:1.45;text-align:left;cursor:pointer}",
    ".lo-stash-main:disabled{cursor:default;color:var(--dsw-alias-label-secondary)}",
    ".lo-stash-label{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".lo-tag{flex:0 0 auto;padding:2px 7px;border-radius:999px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font-size:11px;white-space:nowrap}",
    ".lo-empty{padding:28px 20px;text-align:center;font-size:13px;line-height:1.6;color:var(--dsw-alias-label-secondary)}",
    ".lo-search{display:flex;align-items:center;gap:8px;flex:0 0 auto;padding:7px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-base)}",
    ".lo-search:focus-within{border-color:var(--dsw-alias-brand-primary)}",
    ".lo-search-icon{color:var(--dsw-alias-label-secondary)}",
    ".lo-search-input{flex:1 1 auto;min-width:0;border:0;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;outline:none}",
    ".lo-search-input::placeholder{color:var(--dsw-alias-label-secondary)}",
    ".lo-search-clear{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;padding:0;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);line-height:1;white-space:nowrap;cursor:pointer}",
    ".lo-search-clear:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}",
    ".lo-search-icon[data-ico='search']>svg{transform:scale(1.06)}",
    ".lo-page{display:flex;flex-direction:column;gap:14px;padding:2px 2px 12px;box-sizing:border-box;height:100%;min-height:0}",
    ".lo-page>*{flex:0 0 auto}",
    ".lo-page>.lo-tabpane{flex:1 1 auto;min-height:0}",
    ".lo-title{margin:0;line-height:1.3}",
    ".lo-titlerow{display:flex;align-items:center;gap:10px;flex-wrap:wrap}",
    ".lo-titlerow .lo-title{flex:0 0 auto;min-width:0}",
    ".lo-titlegap{flex:1 1 auto;min-width:0}",
    ".lo-titleacts{flex:0 0 auto;display:flex;gap:8px}",
    ".lo-titleacts .lo-btn{min-height:32px;padding:0 14px;gap:8px;font-size:12.5px;border-radius:9px}",
    ".lo-version{flex:0 0 auto;padding:2px 8px;border-radius:7px;background:var(--dsw-alias-interactive-bg-hover,rgba(38,49,72,.06));color:var(--dsw-alias-label-secondary);font-size:11.5px;font-weight:600;letter-spacing:.02em;white-space:nowrap}",
    ".lo-tabs{flex:0 0 auto;display:flex;gap:2px;padding:4px;border:0;border-radius:var(--dsw-radius-md,12px);background:var(--dsw-alias-interactive-bg-hover,rgba(38,49,72,.06))}",
    ".lo-tab{flex:1 1 auto;display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:34px;padding:0 18px;border:0;border-radius:var(--dsw-radius-sm,8px);background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13.5px;font-weight:500;white-space:nowrap;cursor:pointer;transition:color .12s ease}",
    ".lo-tab:hover:not([data-active='1']){color:var(--dsw-alias-label-primary)}",
    ".lo-tab[data-active='1']{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-weight:700;box-shadow:var(--dsw-elevation-soft,0 1px 3px rgba(0,0,0,.16))}",
    ".lo-tabpane{display:flex;flex-direction:column;gap:12px;flex:1 1 auto;min-height:0}",
    ".lo-scroll{display:flex;flex-direction:column;gap:14px;flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;padding-right:4px;scrollbar-gutter:stable}",
    ".lo-scroll>*{flex:0 0 auto}",
    ".lo-ico{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto}",
    ".lo-ico>svg{display:block}",
    ".lo-ico[data-ico='export']>svg{transform:scale(.88)}",
    ".lo-ico[data-ico='import']>svg{transform:scale(.88)}",
    ".lo-ico[data-ico='github']>svg{transform:scale(1.05)}",
    ".lo-ico[data-ico='feedback']>svg{transform:scale(1)}",
    ".lo-notice{margin:-6px 0;font-size:12px;line-height:1.5;color:var(--dsw-alias-state-success-primary,#2f9e44)}",
    ".lo-notice[data-tone='error']{color:var(--dsw-alias-state-error-primary,#ec1313)}",
    ".lo-lead{margin:-8px 0 -8px;font-size:12.5px;line-height:1.6;color:var(--dsw-alias-label-secondary)}",
    ".lo-card{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);overflow:hidden}",
    ".lo-card-head{padding:11px 14px;border-bottom:1px solid var(--dsw-alias-border-l1);font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary)}",
    ".lo-card-head{display:flex;align-items:center;gap:12px;-webkit-user-select:none;user-select:none}",
    ".lo-card[data-collapsible='1']>.lo-card-head{cursor:pointer}",
    ".lo-card[data-collapsible='1']>.lo-card-head:hover .lo-card-title{color:var(--dsw-alias-brand-primary)}",
    ".lo-card-title{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".lo-card-caret{flex:0 0 auto;display:inline-block;width:10px;font-size:10px;line-height:1;color:var(--dsw-alias-label-secondary);transition:transform .12s ease}",
    ".lo-card[data-open='0'] .lo-card-caret{transform:rotate(-90deg)}",
    ".lo-card-action{flex:0 0 auto;display:flex;align-items:center;gap:8px}",
    ".lo-card-action .lo-btn{min-height:24px;padding:0 9px;font-size:11.5px;font-weight:400;border-radius:7px}",
    ".lo-card-body{display:flex;flex-direction:column}",
    ".lo-card-body>*{flex:0 0 auto}",
    ".lo-field{display:flex;align-items:center;gap:14px;padding:11px 14px;border-top:1px solid var(--dsw-alias-border-l1)}",
    ".lo-field:first-child{border-top:0}",
    ".lo-field[data-collapsible='1']{cursor:pointer;user-select:none}",
    ".lo-field-arrow{flex:0 0 auto;display:flex;align-items:center;justify-content:center;width:20px;color:var(--dsw-alias-label-secondary)}",
    ".lo-caret{display:inline-block;font-size:17px;line-height:1;transform:rotate(0deg);transition:transform .18s ease}",
    ".lo-field[data-collapsed='1'] .lo-caret{transform:rotate(0deg)}",
    ".lo-field:not([data-collapsed='1']) .lo-caret{transform:rotate(180deg)}",
    ".lo-field-sub .lo-field-text{padding-left:14px}",
    ".lo-field-sub .lo-field-label{font-weight:500}",
    ".lo-sub-dash{display:inline-block;width:14px;margin-left:-14px;color:var(--dsw-alias-label-primary);opacity:.45}",
    ".lo-field-sub{background:var(--dsw-alias-bg-layer-2);border-top-style:dashed}",
    ".lo-field[data-gated='1']{opacity:.5}",
    ".lo-field-text{flex:1 1 auto;min-width:0}",
    ".lo-field-label{font-size:13px;color:var(--dsw-alias-label-primary)}",
    ".lo-field-hint{margin-top:3px;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary)}",
    ".lo-field-control{flex:0 0 auto;display:flex;align-items:center;gap:8px}",
    ".lo-field[data-stack='1']{flex-direction:column;align-items:stretch;gap:8px}",
    ".lo-field[data-stack='1'] .lo-field-control{flex-wrap:wrap;justify-content:flex-start;width:100%}",
    ".lo-switch{position:relative;flex:0 0 auto;width:38px;height:22px;padding:0;border:0;border-radius:999px;background:var(--dsw-alias-border-l3);cursor:pointer;transition:background .16s ease}",
    ".lo-switch[aria-checked='true']{background:var(--dsw-alias-brand-primary)}",
    ".lo-switch:disabled{opacity:.5;cursor:default}",
    ".lo-switch::after{content:'';position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:var(--dsw-alias-switch-thumb);box-shadow:0 1px 3px rgba(0,0,0,.28);transition:transform .16s ease,background .16s ease}",
    ".lo-switch[aria-checked='true']::after{transform:translateX(16px);background:var(--dsw-alias-label-primary-foreground)}",
    ".lo-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:28px;padding:0 11px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;white-space:nowrap;cursor:pointer;transition:background .12s ease,border-color .12s ease,color .12s ease}",
    ".lo-btn:hover:not(:disabled){border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2)}",
    ".lo-btn:disabled{opacity:.45;cursor:default}",
    ".lo-btn[data-variant='primary']{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-inverted,#fff)}",
    ".lo-btn[data-variant='primary']:hover:not(:disabled){background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-inverted,#fff);filter:brightness(1.08)}",
    ".lo-btn[data-variant='ghost']{border-color:transparent}",
    ".lo-btn[data-variant='soft']{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l1)}",
    ".lo-btn[data-variant='soft']:hover:not(:disabled){background:var(--dsw-alias-bg-layer-1)}",
    ".lo-btn[data-size='icon']{width:28px;padding:0;font-size:13px}",
    ".lo-btn[data-armed='1']{border-color:var(--dsw-alias-state-warn-primary);color:var(--dsw-alias-state-warn-primary)}",
    ".lo-btn[data-armed='1']:hover:not(:disabled){border-color:var(--dsw-alias-state-warn-primary);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-state-warn-primary)}",
    ".lo-rows{display:flex;flex-direction:column;padding:4px 6px 8px}",
    ".lo-rows>*{flex:0 0 auto}",
    ".lo-row{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:9px;-webkit-user-select:none;user-select:none;transition:background .12s ease}",
    ".lo-row *{-webkit-user-select:none;user-select:none}",
    ".lo-row:hover{background:var(--dsw-alias-bg-layer-2)}",
    ".lo-row[data-dragging='1']{opacity:.4}",
    ".lo-row[data-lo-dragging='1']{cursor:grabbing}",
    ".lo-grip{flex:0 0 auto;width:14px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:1;letter-spacing:-1px;cursor:grab}",
    ".lo-grip[data-locked='1']{opacity:.28;cursor:default}",
    ".lo-row-open{flex:1 1 0;min-width:0;overflow:hidden;display:flex;align-items:center;gap:8px;padding:0;border:0;border-radius:7px;background:transparent;font:inherit;text-align:left;cursor:pointer}",
    ".lo-row-open:hover .lo-row-name{color:var(--dsw-alias-brand-primary)}",
    ".lo-row-open:disabled{cursor:default}",
    ".lo-row-open:disabled:hover .lo-row-name{color:var(--dsw-alias-label-primary)}",
    ".lo-row-name{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;color:var(--dsw-alias-label-primary)}",
    ".lo-row-id{flex:0 0 auto;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--dsw-alias-label-secondary)}",
    ".lo-row-ico{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;overflow:hidden;border-radius:4px;color:var(--dsw-alias-label-secondary)}",
    ".lo-row-ico>svg{width:16px;height:16px}",
    ".lo-row-ico-text{background:var(--dsw-alias-interactive-bg-hover,#2631480f);font-size:10px;font-weight:600}",
    ".lo-groupbar{display:flex;align-items:center;gap:8px;padding:9px 8px 3px;font-size:11px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;color:var(--dsw-alias-label-secondary)}",
    ".lo-groupbar::after{content:'';flex:1 1 auto;height:1px;background:var(--dsw-alias-border-l1)}",
    ".lo-note{padding:8px 14px;font-size:12px;line-height:1.6;color:var(--dsw-alias-label-secondary)}",
    ".lo-warn{margin:0;padding:9px 13px;border:1px solid var(--dsw-alias-state-warn-primary);border-radius:10px;font-size:12px;line-height:1.55;color:var(--dsw-alias-state-warn-primary)}",
    ".lo-keyrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap;width:100%}",
    ".lo-keyrow-end{margin-left:auto}",
    ".lo-keys{display:inline-flex;align-items:center;justify-content:center;gap:4px;min-height:30px;min-width:120px;padding:0 12px;border:1px dashed var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-base);font-size:12px;color:var(--dsw-alias-label-primary);cursor:pointer;transition:border-color .12s ease,color .12s ease}",
    ".lo-keys:hover{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}",
    ".lo-keys[data-recording='1']{border-style:solid;border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}",
    ".lo-keys[data-empty='1']{color:var(--dsw-alias-label-secondary)}",
    ".lo-key{padding:1px 6px;border:1px solid var(--dsw-alias-border-l1);border-radius:5px;background:var(--dsw-alias-bg-layer-2);font-size:11px}",
    ".lo-shortcut-msg{display:block;padding:0 14px 10px;font-size:12px;line-height:1.5}",
    ".lo-keyrow .lo-shortcut-msg{padding:0;flex:0 1 auto}",
    ".lo-shortcut-msg[data-tone='error']{color:var(--dsw-alias-state-error-primary)}",
    ".lo-shortcut-msg[data-tone='warn']{color:var(--dsw-alias-state-warn-primary)}",
    ".lo-shortcut-msg[data-tone='ok']{color:var(--dsw-alias-state-success-primary)}",
    ".lo-row>.lo-btn[data-act='kind']{flex:0 0 auto;width:84px;padding:0 6px;overflow:hidden;text-overflow:ellipsis}",
    ".lo-row>.lo-btn[data-act='more']{flex:0 0 auto;width:96px;padding:0 8px;overflow:hidden;text-overflow:ellipsis}",
    ".lo-row>.lo-btn[data-act='stash']{flex:0 0 auto;width:64px;padding:0 8px;overflow:hidden;text-overflow:ellipsis}",
    ".lo-more-row{display:flex;width:100%;align-items:center;gap:6px;min-height:30px;margin:0;padding:4px 8px;border:0;border-radius:var(--dsw-radius-md,12px);background:transparent;color:inherit;font:inherit;font-size:13px;line-height:20px;text-align:left;cursor:pointer}",
    ".lo-more-row:hover{background:var(--dsw-alias-interactive-bg-hover,#2631480f)}",
    ".lo-more-row:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}",
    ".lo-more-dragging{opacity:.6}",
    ".lo-more-text{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".lo-more-row .lo-row-id{display:none}",
    ".lo-more-divider{height:1px;margin:4px 6px;background:var(--dsw-alias-border-l1)}",
    ".lo-launcher-ico{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px}",
    "@keyframes lo-fade{from{opacity:0}to{opacity:1}}",
    "@keyframes lo-rise{from{opacity:0;transform:translate(-50%,-46%)}to{opacity:1;transform:translate(-50%,-50%)}}"
];
let loStyleEl = null;
function installStyles() {
    const selector = 'style[data-plugin="' + PLUGIN_ID + '"]';
    const existing = document.querySelector(selector);
    if (existing) {
        loStyleEl = existing;
        return;
    }
    const node = document.createElement("style");
    node.setAttribute("data-plugin", PLUGIN_ID);
    node.textContent = CSS_TEXT.join("\n");
    document.head.appendChild(node);
    loStyleEl = node;
}
function removeStyles() {
    const nodes = document.querySelectorAll('style[data-plugin="' + PLUGIN_ID + '"]');
    for(let i = 0; i < nodes.length; i++){
        const node = nodes[i];
        if (node.parentNode) node.parentNode.removeChild(node);
    }
    loStyleEl = null;
}

// src/ui/kit.ts
function Icon(props) {
    return h("span", {
        className: "lo-ico" + (props.className ? " " + props.className : ""),
        "data-ico": props.name || undefined,
        "aria-hidden": "true",
        dangerouslySetInnerHTML: {
            __html: props.svg
        }
    });
}
let loBoundaryBase = null;
function loBoundary() {
    if (loBoundaryBase) return loBoundaryBase;
    const Base = React && React.Component ? React.Component : null;
    if (!Base) return null;
    loBoundaryBase = class LOErrorBoundary extends Base {
        constructor(props){
            super(props);
            this.state = {
                failed: false
            };
        }
        static getDerivedStateFromError() {
            return {
                failed: true
            };
        }
        componentDidCatch(err) {
            warn("render failed; this panel stays empty: " + (err && err.message ? err.message : String(err)));
        }
        render() {
            const self = this;
            if (self.state && self.state.failed) return null;
            return self.props ? self.props.children : null;
        }
    };
    return loBoundaryBase;
}
function Boundary(props) {
    const Base = loBoundary();
    if (!Base) return props.children;
    return h(Base, null, props.children);
}
function RowIcon(props) {
    if (props.svg) return h(Icon, {
        svg: props.svg,
        className: "lo-row-ico"
    });
    return h("span", {
        className: "lo-row-ico lo-row-ico-text",
        "aria-hidden": "true"
    }, rowInitial(props.text));
}
function rowInitial(text) {
    const plain = (text || "").replace(/\s+/g, " ").trim();
    if (!plain) return "";
    const first = Array.from(plain)[0] || "";
    return first.toUpperCase();
}
function useStoreTick(store) {
    const pair = useState(0);
    const tick = pair[0];
    const setTick = pair[1];
    useEffect(function() {
        return store.subscribe(function() {
            setTick(function(value) {
                return value + 1;
            });
        });
    }, [
        store
    ]);
    return tick;
}
function useSlotsTick(ctx) {
    const pair = useState(0);
    const tick = pair[0];
    const setTick = pair[1];
    useEffect(function() {
        const disposers = [];
        let i;
        for(i = 0; i < SCOPE_KEYS.length; i++){
            const slotKey = SLOT_OF_SCOPE[SCOPE_KEYS[i]];
            try {
                disposers.push(ctx.slots.subscribe(slotKey, function() {
                    setTick(function(value) {
                        return value + 1;
                    });
                }));
            } catch (err) {}
        }
        return function() {
            let j;
            for(j = 0; j < disposers.length; j++){
                try {
                    disposers[j]();
                } catch (err) {}
            }
        };
    }, [
        ctx
    ]);
    return tick;
}
function Switch(props) {
    return h("button", {
        type: "button",
        className: "lo-switch",
        role: "switch",
        "aria-checked": props.checked ? "true" : "false",
        "aria-label": props.label || undefined,
        disabled: props.disabled === true,
        onClick: function() {
            if (props.disabled !== true) props.onChange(!props.checked);
        }
    });
}
function Field(props) {
    const toggle = props.onToggleCollapse;
    const arrow = toggle ? h("span", {
        className: "lo-caret",
        "data-collapsed": props.collapsed === false ? undefined : "1",
        "aria-hidden": "true"
    }, "\u25be") : null;
    return h("div", {
        className: "lo-field" + (props.sub ? " lo-field-sub" : ""),
        "data-stack": props.stack ? "1" : undefined,
        "data-collapsible": toggle ? "1" : undefined,
        "data-collapsed": toggle ? props.collapsed === false ? undefined : "1" : undefined,
        "data-gated": props.gated ? "1" : undefined,
        onClick: toggle ? function(event) {
            if (event && event.target && event.target.closest && event.target.closest(".lo-field-control")) return;
            toggle();
        } : undefined
    }, h("div", {
        className: "lo-field-text"
    }, props.sub ? h("div", {
        className: "lo-field-label"
    }, h("span", {
        className: "lo-sub-dash",
        "aria-hidden": "true"
    }, "\u2013"), props.label ?? "") : h("div", {
        className: "lo-field-label"
    }, props.label), props.hint ? h("div", {
        className: "lo-field-hint"
    }, props.hint) : null), toggle ? h("div", {
        className: "lo-field-arrow"
    }, arrow) : null, h("div", {
        className: "lo-field-control"
    }, props.children));
}
function Card(props) {
    const toggle = props.onToggleCollapse;
    const open = props.collapsed !== true;
    return h("section", {
        className: "lo-card",
        "data-collapsible": toggle ? "1" : undefined,
        "data-open": toggle ? open ? "1" : "0" : undefined
    }, props.title || props.action ? h("header", {
        className: "lo-card-head",
        onClick: toggle ? function(event) {
            if (event && event.target && event.target.closest && event.target.closest(".lo-card-action")) return;
            toggle();
        } : undefined,
        role: toggle ? "button" : undefined,
        tabIndex: toggle ? 0 : undefined,
        onKeyDown: toggle ? function(event) {
            if (event && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                toggle();
            }
        } : undefined
    }, props.title ? h("span", {
        className: "lo-card-title"
    }, props.title) : null, props.action ? h("span", {
        className: "lo-card-action"
    }, props.action) : null, toggle ? h("span", {
        className: "lo-card-caret",
        "aria-hidden": "true"
    }, "\u25be") : null) : null, toggle && !open ? null : h("div", {
        className: "lo-card-body"
    }, props.children));
}
function Chip(props) {
    return h("button", {
        type: "button",
        className: "lo-chip",
        "aria-pressed": props.active ? "true" : "false",
        onClick: props.onClick,
        title: props.title || undefined
    }, props.children);
}
function Btn(props) {
    return h("button", {
        type: "button",
        className: "lo-btn",
        "data-variant": props.variant || undefined,
        "data-size": props.size || undefined,
        "data-act": props.act || undefined,
        "data-lit": props.lit ? "1" : undefined,
        "data-armed": props.armed ? "1" : undefined,
        disabled: props.disabled === true,
        title: props.title || undefined,
        onClick: props.onClick
    }, props.icon ? h(Icon, {
        svg: props.icon,
        name: props.iconName
    }) : null, props.children);
}
function ConfirmBtn(props) {
    const pair = useState(false);
    const armed = pair[0];
    const setArmed = pair[1];
    const disabled = props.disabled === true;
    useEffect(function() {
        if (disabled && armed) setArmed(false);
    }, [
        disabled
    ]);
    useEffect(function() {
        if (!armed) return undefined;
        const timer = window.setTimeout(function() {
            setArmed(false);
        }, 3000);
        return function() {
            window.clearTimeout(timer);
        };
    }, [
        armed
    ]);
    return h(Btn, {
        variant: props.variant,
        title: props.title,
        disabled: disabled,
        armed: armed,
        icon: props.icon,
        iconName: props.iconName,
        onClick: function() {
            if (!armed) {
                setArmed(true);
                return;
            }
            setArmed(false);
            props.onConfirm();
        }
    }, armed ? props.confirmLabel : props.label);
}
function RowItem(props) {
    const entry = props.entry;
    const canOpen = props.canOpen === true;
    const icon = rowIconOf(props.scope || "", entry.id);
    return h("div", {
        className: "lo-row",
        "data-lo-list-id": entry.id,
        "data-lo-list-group": props.group,
        "data-locked": props.draggable ? undefined : "1",
        "data-hidden": props.hidden || props.intoMore ? "1" : undefined,
        onContextMenu: props.onMenu
    }, h("span", {
        className: "lo-grip",
        title: props.draggable ? t("action.drag") : undefined
    }, "\u22ee\u22ee"), h("button", {
        type: "button",
        className: "lo-row-open",
        disabled: !canOpen,
        title: props.openTitle || undefined,
        onClick: function() {
            if (canOpen && props.onOpen) props.onOpen();
        }
    }, h(RowIcon, {
        svg: icon,
        text: entry.label
    }), h("span", {
        className: "lo-row-name",
        title: entry.label
    }, entry.label), h("span", {
        className: "lo-row-id"
    }, entry.id)), props.canToggleKind === false ? null : h(Btn, {
        act: "kind",
        onClick: props.onToggleKind,
        title: t("action.toggleKind")
    }, props.kind === "official" ? t("kind.official") : t("kind.third")), h(Btn, {
        act: "up",
        size: "icon",
        onClick: props.onUp,
        disabled: !props.canUp,
        title: t("action.up")
    }, "\u2191"), h(Btn, {
        act: "down",
        size: "icon",
        onClick: props.onDown,
        disabled: !props.canDown,
        title: t("action.down")
    }, "\u2193"), props.onToggleMore ? h(Btn, {
        act: "more",
        lit: props.intoMore,
        variant: props.intoMore ? "soft" : undefined,
        onClick: props.onToggleMore,
        title: props.intoMore ? t("action.outOfMore") : t("action.intoMore")
    }, props.intoMore ? t("action.outOfMore") : t("action.intoMore")) : null, props.canStash === false ? null : h(Btn, {
        act: "stash",
        lit: props.hidden,
        variant: props.hidden ? "soft" : undefined,
        onClick: props.onToggleHidden,
        title: props.hidden ? t("action.restore") : t("action.stash")
    }, props.hidden ? t("action.restore") : t("action.stash")));
}

// src/ui/search.ts
function hitQuery(text, query) {
    if (!query) return true;
    return String(text).toLowerCase().indexOf(query.toLowerCase()) >= 0;
}
function normalizeQuery(raw) {
    return String(raw || "").trim().toLowerCase();
}
function SearchBox(props) {
    return h("div", {
        className: "lo-search"
    }, h(Icon, {
        svg: UI_ICON_SEARCH,
        className: "lo-search-icon",
        name: "search"
    }), h("input", {
        className: "lo-search-input",
        type: "text",
        value: props.value,
        placeholder: props.placeholder,
        spellCheck: false,
        "aria-label": props.placeholder,
        onChange: function(event) {
            const value = event && event.target ? event.target.value : "";
            props.onChange(value === undefined || value === null ? "" : String(value));
        }
    }), props.value ? h("button", {
        type: "button",
        className: "lo-search-clear",
        title: props.clearLabel,
        "aria-label": props.clearLabel,
        onClick: function() {
            props.onChange("");
        }
    }, h(Icon, {
        svg: UI_ICON_CLOSE,
        name: "close"
    })) : null);
}

// src/ui/config-actions.ts
const GITHUB_URL = "https://github.com/var-lin/dsh-plugin-layout-organizer";
const GITHUB_ISSUES_URL = GITHUB_URL + "/issues";
function exportConfig(store) {
    const text = JSON.stringify(store.get(), null, 2);
    const blob = new Blob([
        text
    ], {
        type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dsh-plugin-layout-organizer.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function() {
        URL.revokeObjectURL(url);
    }, 1000);
}
function importConfig(store, done) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.addEventListener("change", function() {
        const file = input.files && input.files[0];
        input.remove();
        if (!file) return;
        const reader = new FileReader();
        reader.addEventListener("load", function() {
            try {
                const raw = JSON.parse(String(reader.result || ""));
                const source = raw && typeof raw === "object" ? raw : null;
                if (!source || source.version !== STATE_VERSION) {
                    done(false);
                    return;
                }
                store.replace(normalizeState(raw));
                done(true);
            } catch (err) {
                done(false);
            }
        });
        reader.addEventListener("error", function() {
            done(false);
        });
        reader.readAsText(file);
    });
    document.body.appendChild(input);
    input.click();
}

// src/ui/scope-card.ts
function scopeEntries(ctx, state, scope) {
    const entries = readEntries(ctx, scope);
    const byId = {};
    let i;
    for(i = 0; i < entries.length; i++)byId[entries[i].id] = entries[i];
    const synthetic = syntheticIdsOf(scope);
    const ids = [];
    for(i = 0; i < entries.length; i++)ids.push(entries[i].id);
    for(i = 0; i < synthetic.length; i++)if (ids.indexOf(synthetic[i]) < 0) ids.push(synthetic[i]);
    const order = reconcileOrder(state, scope, ids);
    const live = liveRowIds(scope);
    const listed = [];
    for(i = 0; i < order.length; i++){
        const id = order[i];
        if (!listedInScope(live, id)) continue;
        if (byId[id] || synthetic.indexOf(id) >= 0) listed.push(id);
    }
    for(i = 0; i < entries.length; i++){
        const id = entries[i].id;
        if (listed.indexOf(id) >= 0) continue;
        if (!listedInScope(live, id)) continue;
        listed.push(id);
    }
    const out = [];
    for(i = 0; i < listed.length; i++){
        const id = listed[i];
        const entry = byId[id];
        const named = rowLabelOf(scope, id);
        if (!entry) {
            out.push({
                id: id,
                label: named || liveRowLabel(scope, id) || hookLabel(scope, id) || id,
                order: 0,
                hasLabel: true
            });
            continue;
        }
        const shown = named || (entry.hasLabel ? entry.label : liveRowLabel(scope, id) || hookLabel(scope, id));
        out.push({
            id: entry.id,
            label: shown || entry.label,
            order: entry.order,
            hasLabel: entry.hasLabel || !!shown
        });
    }
    return out;
}
function entriesHit(entries, title, query) {
    if (!query) return true;
    if (hitQuery(title, query)) return true;
    for(let i = 0; i < entries.length; i++){
        if (hitQuery(entries[i].label, query) || hitQuery(entries[i].id, query)) return true;
    }
    return false;
}
function scopeHit(ctx, state, scope, query) {
    const spec = SCOPE_OF_KEY[scope];
    if (!spec) return true;
    return entriesHit(scopeEntries(ctx, state, scope), t(spec.labelKey), normalizeQuery(query || ""));
}
function ScopeCard(props) {
    const ctx = props.ctx;
    const store = props.store;
    const scope = props.scope;
    const spec = SCOPE_OF_KEY[scope];
    useSlotsTick(ctx);
    useStoreTick(store);
    useRevisionTick();
    const state = store.get();
    const query = props.query ? normalizeQuery(props.query) : "";
    const title = t(spec.labelKey);
    const entries = scopeEntries(ctx, state, scope);
    const mounted = collectRows(scope) !== null;
    const hitAll = !query || hitQuery(title, query);
    const shown = [];
    let i;
    for(i = 0; i < entries.length; i++){
        if (hitAll || hitQuery(entries[i].label, query) || hitQuery(entries[i].id, query)) shown.push(entries[i]);
    }
    if (!entriesHit(entries, title, query)) return null;
    const collapsedMap = state.options.collapsed || {};
    const cardKey = "card:" + scope;
    const cardOpen = collapsedMap[cardKey] !== true;
    const rows = [];
    const mixed = mixedOrder(state);
    const groupIndex = {
        official: 0,
        third: 0
    };
    const groupTotal = {
        official: 0,
        third: 0
    };
    for(i = 0; i < entries.length; i++)groupTotal[groupOf(state, scope, entries[i].id)]++;
    for(i = 0; i < shown.length; i++){
        const entry = shown[i];
        const id = entry.id;
        const kind = kindOf(state, scope, id);
        const group = kind === "official" ? "official" : "third";
        const listGroup = mixed ? "all" : group;
        const hidden = isHidden(state, scope, id);
        const self = scope === "settings" && id === SELF_ID;
        const canOpen = rowNavigable(scope, id);
        const openTitle = canOpen ? t("action.goto") : t("action.static");
        const index = mixed ? entries.indexOf(entry) : groupIndex[group]++;
        const total = mixed ? entries.length : groupTotal[group];
        (function(entry, id, kind, group, index, hidden, self, canOpen, openTitle) {
            rows.push(h(RowItem, {
                key: scope + ":" + id,
                entry: entry,
                scope: scope,
                kind: kind,
                group: group,
                hidden: hidden,
                self: self,
                draggable: true,
                canUp: index > 0,
                canDown: index < total - 1,
                canOpen: canOpen,
                openTitle: openTitle,
                onOpen: function() {
                    navigateFromSettings(ctx, scope, id);
                },
                onToggleKind: function() {
                    store.update(function(next) {
                        next.kinds[scope + ":" + id] = kind === "official" ? "third" : "official";
                    });
                },
                onUp: function() {
                    store.update(function(next) {
                        moveRow(next, scope, id, -1, group === "all" ? undefined : group);
                    });
                },
                onDown: function() {
                    store.update(function(next) {
                        moveRow(next, scope, id, 1, group === "all" ? undefined : group);
                    });
                },
                onToggleHidden: function() {
                    store.update(function(next) {
                        setHidden(next, scope, id, !hidden);
                    });
                },
                intoMore: moreScopeOk(scope) && isIntoMore(state, scope, id),
                onToggleMore: moreScopeOk(scope) ? function() {
                    const into = isIntoMore(store.get(), scope, id);
                    store.update(function(next) {
                        setIntoMore(next, scope, id, !into);
                    });
                } : undefined,
                onMenu: function(event) {
                    attachMenuAt(event, ctx, store, scope, id, group);
                }
            }));
        })(entry, id, kind, listGroup, index, hidden, self, canOpen, openTitle);
    }
    return h(Card, {
        title: title,
        collapsed: !cardOpen,
        onToggleCollapse: function() {
            store.update(function(next) {
                if (!next.options.collapsed) next.options.collapsed = {};
                next.options.collapsed[cardKey] = cardOpen;
            });
        },
        action: h(ConfirmBtn, {
            label: t("action.reset"),
            confirmLabel: t("action.confirmResetGroup"),
            disabled: !scopeDirty(state, scope),
            onConfirm: function() {
                store.update(function(next) {
                    resetScope(next, scope);
                });
            }
        })
    }, mounted ? null : h("div", {
        className: "lo-note"
    }, t("scope.missing")), rows.length > 0 ? h("div", {
        className: "lo-rows",
        "data-lo-list-scope": scope
    }, rows) : h("div", {
        className: "lo-empty"
    }, query && !hitAll ? t("empty.search") : t("empty.list")));
}

// src/ui/shortcut-card.ts
function shortcutSaveOk(status) {
    return status === "saved" || status === "ok";
}
function ShortcutCard(props) {
    const ctx = props.ctx;
    useStoreTick(props.store);
    const pair = useState(null);
    const report = pair[0];
    const setReport = pair[1];
    const tickPair = useState(0);
    const setTick = tickPair[1];
    const recordingPair = useState(false);
    const recording = recordingPair[0];
    const setRecording = recordingPair[1];
    function service() {
        try {
            return ctx.get("shortcuts") || null;
        } catch (err) {
            return null;
        }
    }
    useEffect(function() {
        const shortcuts = service();
        if (!shortcuts || !shortcuts.catalog || !shortcuts.catalog.subscribe) return undefined;
        return shortcuts.catalog.subscribe(function() {
            setTick(function(value) {
                return value + 1;
            });
        });
    }, [
        ctx
    ]);
    const shortcuts = service();
    let keys = [];
    let issue = null;
    let conflicts = [];
    let bound = false;
    if (shortcuts && shortcuts.catalog) {
        const catalog = shortcuts.catalog.getSnapshot() || [];
        let j;
        for(j = 0; j < catalog.length; j++){
            if (catalog[j].id !== SHORTCUT_ID) continue;
            keys = catalog[j].keys || [];
            issue = catalog[j].issue || null;
            conflicts = catalog[j].conflicts || [];
            bound = catalog[j].binding !== null && catalog[j].binding !== undefined;
        }
    }
    function names(ids) {
        const catalog = shortcuts && shortcuts.catalog ? shortcuts.catalog.getSnapshot() || [] : [];
        const out = [];
        let k;
        for(k = 0; k < ids.length; k++){
            let label = null;
            let m;
            for(m = 0; m < catalog.length; m++)if (catalog[m].id === ids[k]) label = catalog[m].label || null;
            out.push(label || ids[k]);
        }
        return out.join(", ");
    }
    function capture(event) {
        event.preventDefault();
        event.stopPropagation();
        const modifiers = [];
        if (event.ctrlKey) modifiers.push("control");
        if (event.altKey) modifiers.push("alt");
        if (event.shiftKey) modifiers.push("shift");
        if (event.metaKey) modifiers.push("meta");
        if ([
            "Control",
            "Alt",
            "Shift",
            "Meta"
        ].indexOf(event.key) >= 0) return;
        const code = event.code;
        const binding = {
            code: code,
            modifiers: modifiers
        };
        if (!shortcuts || !shortcuts.describeBinding) return;
        const described = shortcuts.describeBinding(binding);
        if (described.issue) {
            setReport({
                tone: "error",
                text: t("shortcut.invalid").replace("{reason}", String(described.issue))
            });
            return;
        }
        if (described.conflicts && described.conflicts.length > 0) {
            setReport({
                tone: "error",
                text: t("shortcut.conflict").replace("{list}", names(described.conflicts))
            });
            return;
        }
        const revision = shortcuts.config.getSnapshot().revision;
        setRecording(false);
        shortcuts.edit({
            type: "set",
            id: SHORTCUT_ID,
            binding: binding
        }, revision).then(function(result) {
            if (result && shortcutSaveOk(result.status)) {
                setReport({
                    tone: "ok",
                    text: t("shortcut.saved")
                });
            } else {
                const status = result && result.status !== undefined ? result.status : "write-failed";
                setReport({
                    tone: "error",
                    text: t("shortcut.failed").replace("{status}", String(status))
                });
            }
        }, function() {
            setReport({
                tone: "error",
                text: t("shortcut.failed").replace("{status}", "write-failed")
            });
        });
    }
    useEffect(function() {
        if (!recording) return undefined;
        document.addEventListener("keydown", capture, true);
        return function() {
            document.removeEventListener("keydown", capture, true);
        };
    }, [
        recording,
        ctx
    ]);
    function reset() {
        if (!shortcuts) return;
        const revision = shortcuts.config.getSnapshot().revision;
        shortcuts.edit({
            type: "reset",
            id: SHORTCUT_ID
        }, revision).then(function(result) {
            if (result && shortcutSaveOk(result.status)) setReport({
                tone: "ok",
                text: t("shortcut.saved")
            });
            else setReport({
                tone: "error",
                text: t("shortcut.failed").replace("{status}", String(result && result.status !== undefined ? result.status : "write-failed"))
            });
        }, function() {
            setReport({
                tone: "error",
                text: t("shortcut.failed").replace("{status}", "write-failed")
            });
        });
    }
    function toggleRecording() {
        setReport(null);
        setRecording(!recording);
    }
    function onKeysKeyDown(event) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleRecording();
        }
    }
    let status = null;
    if (report) status = h("span", {
        className: "lo-shortcut-msg",
        "data-tone": report.tone
    }, report.text);
    else if (!bound) status = h("span", {
        className: "lo-shortcut-msg"
    }, t("shortcut.none"));
    else if (issue) status = h("span", {
        className: "lo-shortcut-msg",
        "data-tone": "error"
    }, t("shortcut.invalid").replace("{reason}", String(issue)));
    else if (conflicts.length > 0) status = h("span", {
        className: "lo-shortcut-msg",
        "data-tone": "error"
    }, t("shortcut.conflict").replace("{list}", names(conflicts)));
    return h(Card, {
        title: t("section.shortcut")
    }, h(Field, {
        label: t("shortcut.open"),
        hint: t("shortcut.hint"),
        stack: true,
        children: h("div", {
            className: "lo-keyrow"
        }, h("span", {
            className: "lo-keys",
            role: "button",
            tabIndex: 0,
            "data-recording": recording ? "1" : undefined,
            "data-empty": keys.length > 0 ? undefined : "1",
            title: recording ? t("shortcut.recording") : t("shortcut.record"),
            onClick: toggleRecording,
            onKeyDown: onKeysKeyDown
        }, recording ? t("shortcut.recording") : keys.length > 0 ? keys.join("") : t("shortcut.none")), status, h("span", {
            className: "lo-keyrow-end"
        }, h(Btn, {
            disabled: !bound,
            onClick: reset
        }, t("shortcut.reset"))))
    }));
}

// src/ui/settings-page.ts
const TAB_KEYS = [
    "layout",
    "general"
];
function SettingsPage(props) {
    const ctx = props.ctx;
    const store = props.store;
    useStoreTick(store);
    const state = store.get();
    const noticePair = useState(null);
    const notice = noticePair[0];
    const setNotice = noticePair[1];
    const tabPair = useState("layout");
    const tab = tabPair[0];
    const setTab = tabPair[1];
    const queryPair = useState("");
    const query = queryPair[0];
    const setQuery = queryPair[1];
    const collapsedMap = state.options.collapsed || {};
    const allowOpen = collapsedMap["allowDragOfficial"] !== true;
    const dividerOpen = collapsedMap["showDivider"] !== true;
    function toggleCollapsed(key, open) {
        store.update(function(next) {
            if (!next.options.collapsed) next.options.collapsed = {};
            next.options.collapsed[key] = open;
        });
    }
    const scopeCards = [];
    let i;
    for(i = 0; i < SCOPES.length; i++){
        scopeCards.push(h(ScopeCard, {
            key: SCOPES[i].key,
            ctx: ctx,
            store: store,
            scope: SCOPES[i].key,
            query: query
        }));
    }
    let anyScopeHit = false;
    for(i = 0; i < SCOPES.length; i++){
        if (scopeHit(ctx, state, SCOPES[i].key, query)) anyScopeHit = true;
    }
    const searching = normalizeQuery(query).length > 0;
    const generalBody = [
        h(Card, {
            key: "options",
            title: t("section.options")
        }, h(Field, {
            label: t("opt.allowDragOfficial"),
            hint: t("opt.allowDragOfficial.hint"),
            onToggleCollapse: function() {
                toggleCollapsed("allowDragOfficial", allowOpen);
            },
            collapsed: allowOpen === false,
            children: h(Switch, {
                checked: state.options.allowDragOfficial === true,
                label: t("opt.allowDragOfficial"),
                onChange: function(value) {
                    store.update(function(next) {
                        setOption(next, "allowDragOfficial", value);
                    });
                }
            })
        }), allowOpen ? h(Field, {
            label: t("opt.mixGroups"),
            hint: t("opt.mixGroups.hint"),
            sub: true,
            gated: state.options.allowDragOfficial !== true,
            children: h(Switch, {
                checked: state.options.mixGroups !== false,
                label: t("opt.mixGroups"),
                onChange: function(value) {
                    store.update(function(next) {
                        const lift = next.options.allowDragOfficial !== true;
                        setOption(next, "mixGroups", lift ? true : value);
                        if (lift) setOption(next, "allowDragOfficial", true);
                    });
                }
            })
        }) : null, h(Field, {
            label: t("opt.showDivider"),
            hint: t("opt.showDivider.hint"),
            onToggleCollapse: function() {
                toggleCollapsed("showDivider", dividerOpen);
            },
            collapsed: dividerOpen === false,
            children: h(Switch, {
                checked: state.options.showDivider === true,
                label: t("opt.showDivider"),
                onChange: function(value) {
                    store.update(function(next) {
                        setOption(next, "showDivider", value);
                    });
                }
            })
        }), dividerOpen ? DIVIDER_SCOPES.map(function(scope) {
            const on = state.options.dividers ? state.options.dividers[scope] !== false : true;
            return h(Field, {
                key: "divider:" + scope,
                label: t("opt.divider." + scope),
                hint: t("opt.divider." + scope + ".hint"),
                sub: true,
                gated: state.options.showDivider !== true,
                children: h(Switch, {
                    checked: on,
                    label: t("opt.divider." + scope),
                    onChange: function(scopeKey) {
                        return function(value) {
                            store.update(function(next) {
                                if (!next.options.dividers) next.options.dividers = {};
                                const lift = next.options.showDivider !== true;
                                next.options.dividers[scopeKey] = lift ? true : value;
                                if (lift) setOption(next, "showDivider", true);
                            });
                        };
                    }(scope)
                })
            });
        }) : null, h(Field, {
            label: t("opt.showLauncher"),
            hint: t("opt.showLauncher.hint"),
            children: h(Switch, {
                checked: state.options.showStashLauncher !== false,
                label: t("opt.showLauncher"),
                onChange: function(value) {
                    store.update(function(next) {
                        setOption(next, "showStashLauncher", value);
                    });
                }
            })
        }), h(Field, {
            label: t("opt.separateMore"),
            hint: t("opt.separateMore.hint"),
            children: h(Switch, {
                checked: state.options.separateMore === true,
                label: t("opt.separateMore"),
                onChange: function(value) {
                    store.update(function(next) {
                        setOption(next, "separateMore", value);
                    });
                }
            })
        }), h(Field, {
            label: t("opt.moreDivider"),
            hint: t("opt.moreDivider.hint"),
            children: h(Switch, {
                checked: state.options.moreDivider === true,
                label: t("opt.moreDivider"),
                onChange: function(value) {
                    store.update(function(next) {
                        setOption(next, "moreDivider", value);
                    });
                }
            })
        }), h(Field, {
            label: t("action.resetAll"),
            hint: t("action.resetAll.hint"),
            children: h(ConfirmBtn, {
                label: t("action.resetAll"),
                confirmLabel: t("action.confirmResetAll"),
                disabled: !stateDirty(state),
                onConfirm: function() {
                    store.update(function(next) {
                        const fresh = defaultState();
                        next.order = fresh.order;
                        next.kinds = fresh.kinds;
                        next.hidden = fresh.hidden;
                        next.intoMore = fresh.intoMore;
                        next.options = fresh.options;
                    });
                }
            })
        })),
        h(ShortcutCard, {
            key: "shortcut",
            ctx: ctx,
            store: store
        })
    ];
    const layoutBody = searching ? [] : [
        h(Card, {
            key: "stash",
            title: t("section.stash")
        }, h(Field, {
            label: t("stash.title"),
            hint: t("stash.count").replace("{count}", String(stashCount(state))),
            children: h(Btn, {
                variant: "primary",
                onClick: props.onOpenStash
            }, t("action.openStash"))
        }))
    ];
    for(i = 0; i < scopeCards.length; i++){
        if (scopeCards[i]) layoutBody.push(scopeCards[i]);
    }
    if (searching && !anyScopeHit) layoutBody.push(h("div", {
        key: "no-hit",
        className: "lo-empty"
    }, t("empty.search")));
    const navButtons = [];
    for(i = 0; i < TAB_KEYS.length; i++){
        (function(key) {
            const active = tab === key;
            navButtons.push(h("button", {
                key: key,
                type: "button",
                className: "lo-tab",
                role: "tab",
                "aria-selected": active ? "true" : "false",
                "data-active": active ? "1" : undefined,
                onClick: function() {
                    setTab(key);
                }
            }, t("tab." + key)));
        })(TAB_KEYS[i]);
    }
    return h("div", {
        className: "lo-page"
    }, h("div", {
        className: "lo-titlerow"
    }, h("h2", {
        className: "lo-title"
    }, t("title")), h("span", {
        className: "lo-version",
        title: t("version.hint")
    }, "v" + PLUGIN_VERSION), h("span", {
        className: "lo-titlegap"
    }), h("div", {
        className: "lo-titleacts"
    }, h(Btn, {
        icon: ACTION_ICON_EXPORT,
        iconName: "export",
        title: t("action.export.hint"),
        onClick: function() {
            exportConfig(store);
            setNotice({
                text: t("note.exported"),
                tone: "ok"
            });
        }
    }, t("action.export")), h(ConfirmBtn, {
        label: t("action.import"),
        confirmLabel: t("action.confirmImport"),
        icon: ACTION_ICON_IMPORT,
        iconName: "import",
        title: t("action.import.hint"),
        onConfirm: function() {
            importConfig(store, function(ok) {
                setNotice({
                    text: ok ? t("note.importOk") : t("note.importFail"),
                    tone: ok ? "ok" : "error"
                });
            });
        }
    }), h(Btn, {
        icon: ACTION_ICON_GITHUB,
        iconName: "github",
        title: t("action.github.hint"),
        onClick: function() {
            window.open(GITHUB_URL, "_blank", "noopener");
        }
    }, t("action.github")), h(Btn, {
        icon: ACTION_ICON_FEEDBACK,
        iconName: "feedback",
        title: t("action.feedback.hint"),
        onClick: function() {
            window.open(GITHUB_ISSUES_URL, "_blank", "noopener");
        }
    }, t("action.feedback")))), notice ? h("div", {
        className: "lo-notice",
        "data-tone": notice.tone
    }, notice.text) : null, h("p", {
        className: "lo-lead"
    }, t("subtitle")), props.degraded && props.degraded.length > 0 ? h("div", {
        className: "lo-warn"
    }, h("div", null, t("note.degrade")), props.degraded.map(function(message, index) {
        return h("div", {
            key: index
        }, "\u00b7 " + message);
    })) : null, h("div", {
        className: "lo-tabs",
        role: "tablist"
    }, navButtons), tab === "layout" ? h("div", {
        className: "lo-tabpane",
        role: "tabpanel"
    }, h(SearchBox, {
        value: query,
        placeholder: t("search.placeholder"),
        clearLabel: t("search.clear"),
        onChange: setQuery
    }), h("div", {
        className: "lo-scroll"
    }, layoutBody)) : h("div", {
        className: "lo-tabpane",
        role: "tabpanel"
    }, h("div", {
        className: "lo-scroll"
    }, generalBody)));
}

// src/ui/stash.ts
function stashView(ctx, state) {
    const ledger = {};
    let i;
    let j;
    for(i = 0; i < SCOPES.length; i++)ledger[SCOPES[i].key] = readEntries(ctx, SCOPES[i].key);
    const entries = stashEntries(state);
    const out = [];
    for(i = 0; i < entries.length; i++){
        const item = entries[i];
        const spec = SCOPE_OF_KEY[item.scope];
        const list = ledger[item.scope] || [];
        let entry = null;
        for(j = 0; j < list.length; j++)if (list[j].id === item.id) entry = list[j];
        const label = rowLabelText(ctx, item.scope, item.id);
        const live = liveRowIds(item.scope);
        const missing = !listedInScope(live, item.id);
        const unlisted = missing && item.scope !== "settings";
        const navigable = rowNavigable(item.scope, item.id);
        out.push({
            scope: item.scope,
            id: item.id,
            key: item.key,
            label: label,
            kind: kindOf(state, item.scope, item.id),
            missing: unlisted,
            navigable: navigable,
            scopeLabel: spec ? t(spec.labelKey) : item.scope,
            scopeIndex: SCOPE_KEYS.indexOf(item.scope),
            orderIndex: entry ? entry.order : 0
        });
    }
    return out;
}
function sortStash(rows, mode) {
    const copy = rows.slice();
    copy.sort(function(a, b) {
        if (mode === "alpha") return a.label.localeCompare(b.label);
        if (mode === "kind") {
            if (a.kind !== b.kind) return a.kind === "official" ? -1 : 1;
            return a.scopeIndex - b.scopeIndex || a.orderIndex - b.orderIndex;
        }
        return a.scopeIndex - b.scopeIndex || a.orderIndex - b.orderIndex;
    });
    return copy;
}
function groupStash(rows, mode) {
    if (mode === "alpha") return [
        {
            key: "alpha",
            title: null,
            rows: rows
        }
    ];
    const groups = [];
    const index = {};
    let i;
    for(i = 0; i < rows.length; i++){
        const row = rows[i];
        const key = mode === "kind" ? row.kind : row.scope;
        const title = mode === "kind" ? t(row.kind === "official" ? "kind.official" : "kind.third") : row.scopeLabel;
        if (index[key] === undefined) {
            index[key] = groups.length;
            groups.push({
                key: key,
                title: title,
                rows: []
            });
        }
        groups[index[key]].rows.push(row);
    }
    return groups;
}
function groupScopes(group) {
    const seen = {};
    const list = [];
    let i;
    for(i = 0; i < group.rows.length; i++){
        const scope = group.rows[i].scope;
        if (!seen[scope]) {
            seen[scope] = true;
            list.push(scope);
        }
    }
    return list;
}
function groupDirty(state, group) {
    const scopes = groupScopes(group);
    for(let i = 0; i < scopes.length; i++){
        if (scopeDirty(state, scopes[i])) return true;
    }
    return false;
}
function StashRow(props) {
    const row = props.row;
    const inert = row.missing || !row.navigable;
    let hint = t("action.goto");
    if (row.missing) hint = t("scope.missing");
    else if (!row.navigable) hint = t("action.static");
    const icon = rowIconOf(row.scope, row.id);
    return h("div", {
        className: "lo-stash-row"
    }, h("button", {
        type: "button",
        className: "lo-stash-main",
        disabled: inert,
        title: hint,
        onClick: function() {
            props.onOpen(row);
        }
    }, h(RowIcon, {
        svg: icon,
        text: row.label
    }), h("span", {
        className: "lo-stash-label"
    }, row.label), h("span", {
        className: "lo-tag"
    }, row.id)), props.canIntoMore && props.onIntoMore ? h(Btn, {
        title: t("action.intoMore"),
        onClick: function() {
            props.onIntoMore(row);
        }
    }, t("action.intoMore")) : null, h(Btn, {
        title: t("action.restore"),
        variant: "soft",
        onClick: function() {
            props.onRestore(row);
        }
    }, t("action.restore")));
}
function StashPanel(props) {
    const ctx = props.ctx;
    const store = props.store;
    useStoreTick(store);
    useSlotsTick(ctx);
    const state = store.get();
    const mode = state.stashSort;
    const queryPair = useState("");
    const rawQuery = queryPair[0];
    const setQuery = queryPair[1];
    const query = normalizeQuery(rawQuery);
    const rows = sortStash(stashView(ctx, state), mode);
    const visible = [];
    let v;
    for(v = 0; v < rows.length; v++){
        const row = rows[v];
        if (!query || hitQuery(row.label, query) || hitQuery(row.id, query) || hitQuery(row.scopeLabel, query)) visible.push(row);
    }
    const groups = groupStash(visible, mode);
    useEffect(function() {
        function onKey(event) {
            if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                closeStash();
            }
        }
        document.addEventListener("keydown", onKey, true);
        return function() {
            document.removeEventListener("keydown", onKey, true);
        };
    }, []);
    function restore(row) {
        store.update(function(next) {
            setHidden(next, row.scope, row.id, false);
        });
    }
    function intoMore(row) {
        store.update(function(next) {
            setIntoMore(next, row.scope, row.id, true);
        });
    }
    function open(row) {
        if (row.missing || !row.navigable) return;
        if (row.scope === "settings") {
            closeStash();
            navigateTo(ctx, row.scope, row.id);
            return;
        }
        navigateTo(ctx, row.scope, row.id);
        closeStash();
        window.requestAnimationFrame(function() {
            closeSettings();
        });
    }
    const body = [];
    const collapsedMap = state.options.collapsed || {};
    let i;
    let j;
    for(i = 0; i < groups.length; i++){
        (function(group) {
            if (group.title) {
                const collapsedKey = "stash:" + mode + ":" + group.key;
                const expanded = collapsedMap[collapsedKey] !== true;
                const toggleGroup = function() {
                    store.update(function(next) {
                        if (!next.options.collapsed) next.options.collapsed = {};
                        next.options.collapsed[collapsedKey] = expanded;
                    });
                };
                body.push(h("div", {
                    key: "g" + i,
                    className: "lo-stash-group",
                    "data-open": expanded ? "1" : "0",
                    role: "button",
                    tabIndex: 0,
                    "aria-expanded": expanded ? "true" : "false",
                    title: t("action.toggleGroup"),
                    onClick: function(event) {
                        if (event && event.target && event.target.closest && event.target.closest(".lo-btn")) return;
                        toggleGroup();
                    },
                    onKeyDown: function(event) {
                        if (event && (event.key === "Enter" || event.key === " ")) {
                            event.preventDefault();
                            toggleGroup();
                        }
                    }
                }, h("span", {
                    className: "lo-stash-group-title"
                }, h("span", {
                    className: "lo-stash-group-text"
                }, group.title)), h(ConfirmBtn, {
                    label: t("action.reset"),
                    confirmLabel: t("action.confirmResetGroup"),
                    disabled: !groupDirty(state, group),
                    onConfirm: function() {
                        store.update(function(next) {
                            const scopes = groupScopes(group);
                            for(let k = 0; k < scopes.length; k++)resetScope(next, scopes[k]);
                        });
                    }
                }), h("span", {
                    className: "lo-stash-group-chev",
                    "aria-hidden": "true"
                }, "\u25be")));
                if (!expanded) return;
            }
            for(j = 0; j < group.rows.length; j++){
                (function(row) {
                    body.push(h(StashRow, {
                        key: row.key,
                        row: row,
                        onOpen: open,
                        onRestore: restore,
                        canIntoMore: moreScopeOk(row.scope),
                        onIntoMore: intoMore
                    }));
                })(group.rows[j]);
            }
        })(groups[i]);
    }
    return ReactDOM.createPortal(h(React.Fragment, null, h("div", {
        className: "lo-mask",
        onClick: closeStash
    }), h("div", {
        className: "lo-stash",
        role: "dialog",
        "aria-label": t("stash.title")
    }, h("div", {
        className: "lo-stash-head"
    }, h("span", {
        className: "lo-stash-title"
    }, t("stash.title")), h("span", {
        className: "lo-stash-count"
    }, t("stash.count").replace("{count}", query ? visible.length + " / " + rows.length : String(rows.length))), h("button", {
        type: "button",
        className: "lo-stash-close",
        onClick: closeStash,
        title: t("action.close")
    }, "\u00d7")), h("div", {
        className: "lo-stash-sorts"
    }, SORT_MODES.map(function(item) {
        return h(Chip, {
            key: item,
            active: mode === item,
            onClick: function() {
                store.update(function(next) {
                    next.stashSort = item;
                });
            }
        }, t(SORT_MODE_KEYS[item]));
    })), h("div", {
        className: "lo-stash-search"
    }, h(SearchBox, {
        value: rawQuery,
        placeholder: t("search.placeholder"),
        clearLabel: t("search.clear"),
        onChange: setQuery
    })), h("div", {
        className: "lo-stash-actions"
    }, h(ConfirmBtn, {
        label: t("action.restoreAll"),
        confirmLabel: t("action.confirmRestore"),
        disabled: rows.length === 0,
        onConfirm: function() {
            store.update(function(next) {
                restoreAllHidden(next);
            });
        }
    })), h("div", {
        className: "lo-stash-body"
    }, visible.length === 0 ? h("div", {
        className: "lo-empty"
    }, query ? t("empty.search") : t("empty.stash")) : body))), document.body);
}
function createFlag() {
    const listeners = [];
    let value = false;
    return {
        get: function() {
            return value;
        },
        set: function(next) {
            if (value === next) return;
            value = next;
            const snapshot = listeners.slice();
            let i;
            for(i = 0; i < snapshot.length; i++){
                try {
                    snapshot[i](value);
                } catch (err) {}
            }
        },
        subscribe: function(listener) {
            listeners.push(listener);
            return function() {
                const index = listeners.indexOf(listener);
                if (index >= 0) listeners.splice(index, 1);
            };
        }
    };
}
const stashFlag = createFlag();
function openStash() {
    stashFlag.set(true);
}
function closeStash() {
    stashFlag.set(false);
}
function StashLauncher(props) {
    const ctx = props.ctx;
    const store = props.store;
    useStoreTick(store);
    const state = store.get();
    const count = stashCount(state);
    const sizePair = useState({
        width: 0,
        height: 0
    });
    const size = sizePair[0];
    const setSize = sizePair[1];
    const ref = useRef(null);
    const dragRef = useRef(null);
    const frameRef = useRef(0);
    const tickPair = useState(0);
    const tick = tickPair[0];
    const setTick = tickPair[1];
    useEffect(function() {
        function onResize() {
            setTick(function(value) {
                return value + 1;
            });
        }
        window.addEventListener("resize", onResize);
        return function() {
            window.removeEventListener("resize", onResize);
        };
    }, []);
    useEffect(function() {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            if (rect.width !== size.width || rect.height !== size.height) {
                setSize({
                    width: rect.width,
                    height: rect.height
                });
            }
        }
    });
    useEffect(function() {
        return function() {
            if (frameRef.current) {
                window.cancelAnimationFrame(frameRef.current);
                frameRef.current = 0;
            }
        };
    }, []);
    if (state.options.showStashLauncher === false) return null;
    const side = state.options.launcherSide === "left" ? "left" : "right";
    const width = size.width || 120;
    const height = size.height || 32;
    const y = clampLauncherY(state.options.launcherY, height);
    const liveX = state.options.launcherX;
    const dragged = typeof liveX === "number" && isFinite(liveX);
    const x = dragged ? clampLauncherX(liveX, width) : side === "left" ? LAUNCHER_MARGIN : Math.max(LAUNCHER_MARGIN, window.innerWidth - width - LAUNCHER_MARGIN);
    function onPointerDown(event) {
        if (event.button !== undefined && event.button !== 0) return;
        const rect = ref.current.getBoundingClientRect();
        dragRef.current = {
            dx: event.clientX - rect.left,
            dy: event.clientY - rect.top,
            moved: false,
            width: rect.width,
            height: rect.height,
            x: rect.left,
            y: rect.top
        };
        if (ref.current.setPointerCapture) {
            try {
                ref.current.setPointerCapture(event.pointerId);
            } catch (err) {}
        }
    }
    function onPointerMove(event) {
        const drag = dragRef.current;
        if (!drag) return;
        if (!drag.moved) {
            const rect = ref.current.getBoundingClientRect();
            const dx = Math.abs(event.clientX - (drag.dx + rect.left));
            const dy = Math.abs(event.clientY - (drag.dy + rect.top));
            if (dx < 3 && dy < 3) return;
            drag.moved = true;
        }
        drag.x = clampLauncherX(event.clientX - drag.dx, drag.width);
        drag.y = clampLauncherY(event.clientY - drag.dy, drag.height);
        if (frameRef.current) return;
        frameRef.current = window.requestAnimationFrame(function() {
            frameRef.current = 0;
            const live = dragRef.current;
            const node = ref.current;
            if (!live || !node) return;
            node.style.left = Math.round(live.x) + "px";
            node.style.top = Math.round(live.y) + "px";
        });
    }
    function onPointerUp(event) {
        const drag = dragRef.current;
        dragRef.current = null;
        if (frameRef.current) {
            window.cancelAnimationFrame(frameRef.current);
            frameRef.current = 0;
        }
        if (!drag) return;
        if (drag.moved) {
            const nextSide = event.clientX < window.innerWidth / 2 ? "left" : "right";
            const node = ref.current;
            if (node) {
                node.style.left = Math.round(nextSide === "left" ? LAUNCHER_MARGIN : Math.max(LAUNCHER_MARGIN, window.innerWidth - drag.width - LAUNCHER_MARGIN)) + "px";
                node.style.top = Math.round(drag.y) + "px";
            }
            store.update(function(state2) {
                state2.options.launcherSide = nextSide;
                state2.options.launcherX = null;
                state2.options.launcherY = drag.y;
            });
        } else {
            if (state.options.launcherX !== null) {
                store.update(function(state2) {
                    state2.options.launcherX = null;
                });
            }
            openStash();
        }
    }
    return h("button", {
        type: "button",
        ref: ref,
        className: "lo-launcher",
        "data-dragging": dragRef.current ? "1" : undefined,
        "aria-label": t("stash.launcher"),
        style: {
            left: Math.round(x) + "px",
            top: Math.round(y) + "px"
        },
        onPointerDown: onPointerDown,
        onPointerMove: onPointerMove,
        onPointerUp: onPointerUp,
        onPointerCancel: onPointerUp
    }, h(Icon, {
        svg: ICON_SVG,
        className: "lo-launcher-ico",
        name: "layout"
    }), count > 0 ? h("span", {
        className: "lo-launcher-count"
    }, String(count)) : null);
}
function StashSurface(props) {
    const pair = useState(stashFlag.get());
    const open = pair[0];
    const setOpen = pair[1];
    useEffect(function() {
        return stashFlag.subscribe(setOpen);
    }, []);
    return ReactDOM.createPortal(h(React.Fragment, null, h(StashLauncher, {
        ctx: props.ctx,
        store: props.store
    }), open ? h(StashPanel, {
        ctx: props.ctx,
        store: props.store
    }) : null), document.body);
}

// src/ui/more-menu.ts
let loMoreSuppressClick = 0;
let loMoreMenuCtx = null;
let loMoreMenuStore = null;
let loMoreMenuRegion = "";
let loMoreMenuDismiss = null;
let loMoreGesturesBound = false;
let loMoreGestureRefs = 0;
const loMoreDrag = {
    node: null,
    key: "",
    region: "",
    startY: 0,
    active: false
};
function moreRowOf(target) {
    if (!target || typeof target.closest !== "function") return null;
    return target.closest("[data-lo-more-key]");
}
function moreActivate(ctx, region, key, onDismiss) {
    if (!ctx) return;
    const cut = key ? key.indexOf(":") : -1;
    if (cut <= 0) return;
    const scope = key.slice(0, cut);
    const id = key.slice(cut + 1);
    if (!id) return;
    navigateTo(ctx, scope, id);
    if (onDismiss) onDismiss();
}
function moreRowMenuAt(event, store, region, key) {
    const cut = key ? key.indexOf(":") : -1;
    if (cut <= 0) return;
    const scope = key.slice(0, cut);
    const id = key.slice(cut + 1);
    const actions = moreMoveActions(store, region, key);
    actions.push({
        label: t("action.outOfMore"),
        icon: ACTION_ICON_OUT_OF_MORE,
        disabled: false,
        run: function() {
            store.update(function(state) {
                setIntoMore(state, scope, id, false);
            });
        }
    });
    actions.push({
        label: t("action.stash"),
        icon: MENU_ICON_ARCHIVE,
        disabled: false,
        run: function() {
            store.update(function(state) {
                setHidden(state, scope, id, true);
            });
        }
    });
    openMenu(event, actions);
}
function moreGestureDown(event) {
    if (event.button !== 0) return;
    const row = moreRowOf(event.target);
    if (!row) return;
    event.stopPropagation();
    loMoreDrag.node = row;
    loMoreDrag.key = row.getAttribute("data-lo-more-key") || "";
    loMoreDrag.region = row.getAttribute("data-lo-more-region") || "";
    loMoreDrag.startY = event.clientY;
    loMoreDrag.active = false;
}
function moreGestureMove(event) {
    const node = loMoreDrag.node;
    if (!node) return;
    if (!loMoreDrag.active) {
        if (Math.abs(event.clientY - loMoreDrag.startY) < LO_DRAG_THRESHOLD) return;
        loMoreDrag.active = true;
        node.classList.add("lo-more-dragging");
        document.documentElement.style.cursor = "grabbing";
    }
    event.preventDefault();
    event.stopPropagation();
    const store = loMoreMenuStore;
    if (!store) return;
    const region = loMoreDrag.region;
    const keys = moreKeysNow(store, region);
    const from = keys.indexOf(loMoreDrag.key);
    if (from < 0) return;
    const at = moreDropIndex(region, loMoreDrag.key, event.clientY);
    if (at < 0 || at === from) return;
    keys.splice(from, 1);
    keys.splice(at, 0, loMoreDrag.key);
    store.update(function(state) {
        setMoreOrder(state, region, keys);
    });
}
function moreGestureUp(event) {
    if (!loMoreDrag.node) return;
    if (loMoreDrag.active) {
        loMoreSuppressClick = Date.now() + LO_CLICK_SUPPRESS_MS;
        event.stopPropagation();
    }
    loMoreDrag.node.classList.remove("lo-more-dragging");
    document.documentElement.style.cursor = "";
    loMoreDrag.node = null;
    loMoreDrag.key = "";
    loMoreDrag.active = false;
}
function moreGestureMouseDown(event) {
    if (!moreRowOf(event.target)) return;
    event.stopPropagation();
}
function moreGestureClick(event) {
    const row = moreRowOf(event.target);
    if (!row) return;
    event.preventDefault();
    event.stopPropagation();
    if (Date.now() < loMoreSuppressClick) return;
    moreActivate(loMoreMenuCtx, row.getAttribute("data-lo-more-region") || loMoreMenuRegion, row.getAttribute("data-lo-more-key") || "", loMoreMenuDismiss);
}
function moreGestureContext(event) {
    const row = moreRowOf(event.target);
    if (!row) return;
    event.preventDefault();
    event.stopPropagation();
    const store = loMoreMenuStore;
    if (!store) return;
    moreRowMenuAt(event, store, row.getAttribute("data-lo-more-region") || "", row.getAttribute("data-lo-more-key") || "");
}
function installMoreGestures() {
    loMoreGestureRefs++;
    if (loMoreGesturesBound) return;
    if (typeof window === "undefined") return;
    loMoreGesturesBound = true;
    window.addEventListener("pointerdown", moreGestureDown, true);
    window.addEventListener("mousedown", moreGestureMouseDown, true);
    window.addEventListener("pointermove", moreGestureMove, true);
    window.addEventListener("pointerup", moreGestureUp, true);
    window.addEventListener("pointercancel", moreGestureUp, true);
    window.addEventListener("contextmenu", moreGestureContext, true);
    window.addEventListener("click", moreGestureClick, true);
}
function uninstallMoreGestures() {
    loMoreGestureRefs = Math.max(0, loMoreGestureRefs - 1);
    if (loMoreGestureRefs > 0) return;
    if (!loMoreGesturesBound) return;
    loMoreGesturesBound = false;
    if (typeof window === "undefined") return;
    window.removeEventListener("pointerdown", moreGestureDown, true);
    window.removeEventListener("mousedown", moreGestureMouseDown, true);
    window.removeEventListener("pointermove", moreGestureMove, true);
    window.removeEventListener("pointerup", moreGestureUp, true);
    window.removeEventListener("pointercancel", moreGestureUp, true);
    window.removeEventListener("contextmenu", moreGestureContext, true);
    window.removeEventListener("click", moreGestureClick, true);
}
function moreRowKey(scope, id) {
    return scope + ":" + id;
}
function moreKeysNow(store, region) {
    return moreKeysIn(store.get(), region);
}
function moreRowNodes(region) {
    const nodes = document.querySelectorAll("[data-lo-more-key]");
    const out = [];
    let i;
    for(i = 0; i < nodes.length; i++){
        const node = nodes[i];
        if (node.getAttribute("data-lo-more-region") !== region) continue;
        out.push(node);
    }
    return out;
}
function moreDropIndex(region, key, y) {
    const nodes = moreRowNodes(region);
    let at = 0;
    let dragged = -1;
    let i;
    for(i = 0; i < nodes.length; i++){
        if (nodes[i].getAttribute("data-lo-more-key") === key) {
            dragged = i;
            continue;
        }
        const rect = nodes[i].getBoundingClientRect();
        if (y > rect.top + rect.height / 2) at++;
    }
    if (dragged < 0) return -1;
    return at;
}
function moreMoveActions(store, region, key) {
    const keys = moreKeysIn(store.get(), region);
    const at = keys.indexOf(key);
    function move(delta) {
        moveMoreRow(store, region, key, delta);
    }
    return [
        {
            label: t("action.up"),
            icon: MENU_ICON_UP,
            disabled: at <= 0,
            run: function() {
                move(-1);
            }
        },
        {
            label: t("action.down"),
            icon: MENU_ICON_DOWN,
            disabled: at < 0 || at >= keys.length - 1,
            run: function() {
                move(1);
            }
        }
    ];
}
function MoreMenuRow(props) {
    const ctx = props.ctx;
    const scope = props.scope;
    const id = props.id;
    const key = moreRowKey(scope, id);
    const label = rowLabelText(ctx, scope, id);
    const icon = rowIconOf(scope, id);
    function open() {
        moreActivate(ctx, props.region, key, props.onDismiss ? props.onDismiss : null);
    }
    function menuFor(event) {
        event.preventDefault();
        event.stopPropagation();
        moreRowMenuAt(event, props.store, props.region, key);
    }
    return h("button", {
        type: "button",
        role: "menuitem",
        className: "lo-more-row",
        "data-lo-more-key": key,
        "data-lo-more-scope": scope,
        "data-lo-more-id": id,
        "data-lo-more-region": props.region,
        title: t("action.drag"),
        onClick: open,
        onContextMenu: menuFor
    }, h(RowIcon, {
        svg: icon,
        text: label
    }), h("span", {
        className: "lo-more-text"
    }, label));
}
function MoreMenuContent(props) {
    const ctx = props ? props.loCtx : null;
    const store = props ? props.loStore : null;
    if (!ctx || !store) return null;
    return h(MoreMenuRows, {
        ctx: ctx,
        store: store,
        region: props.loRegion || "sidebar",
        onDismiss: props.onDismiss
    });
}
function MoreMenuRows(props) {
    const ctx = props.ctx;
    const store = props.store;
    const region = props.region;
    useSlotsTick(ctx);
    useStoreTick(store);
    const state = store.get();
    const rows = moreRowsIn(state, region);
    const divider = moreDividerOn(state);
    loMoreMenuCtx = ctx;
    loMoreMenuStore = store;
    loMoreMenuRegion = region;
    loMoreMenuDismiss = props.onDismiss ? props.onDismiss : null;
    React.useEffect(function() {
        installMoreGestures();
        return function() {
            uninstallMoreGestures();
        };
    }, [
        ctx,
        region
    ]);
    const out = [];
    let dividerKey = "";
    let i;
    for(i = 0; i < rows.length; i++){
        const row = rows[i];
        const key = moreRowKey(row.scope, row.id);
        const group = kindOf(state, row.scope, row.id) === "official" ? "official" : "third";
        if (divider && !dividerKey && group === "third") {
            dividerKey = "lo-more-divider";
            out.push(h("div", {
                key: dividerKey,
                className: "lo-more-divider",
                "data-lo-more-divider": ""
            }));
        }
        out.push(h(MoreMenuRow, {
            key: key,
            ctx: ctx,
            store: store,
            region: region,
            scope: row.scope,
            id: row.id,
            group: group,
            onDismiss: props.onDismiss
        }));
    }
    return h(React.Fragment, null, out);
}

// src/main.ts
const inject = [
    "slots",
    "locale"
];
function injectMoreSlot(ctx, store, slot, region, noteDegrade) {
    try {
        ctx.slots.inject(slot, function() {
            return ctx.slots.register({
                name: slot,
                id: SELF_ID,
                order: 40,
                locale: NS
            }, function MoreRows(props) {
                return h(Boundary, null, h(MoreMenuContent, {
                    loCtx: ctx,
                    loStore: store,
                    loRegion: region,
                    onDismiss: props ? props.onDismiss : undefined
                }));
            });
        });
    } catch (err) {
        noteDegrade(slot + " unavailable; rows cannot be tucked into More: " + (err && err.message ? err.message : String(err)));
    }
}
function apply(ctx) {
    const degraded = [];
    setReporter(function(message) {
        try {
            console.warn("[layout-organizer] " + message);
        } catch (err) {}
    });
    function noteDegrade(message) {
        if (degraded.indexOf(message) < 0) degraded.push(message);
        warn(message);
    }
    try {
        boot();
    } catch (err) {
        noteDegrade("startup failed: " + (err && err.message ? err.message : String(err)));
    }
    function boot() {
        ctx.effect(function() {
            if (typeof document === "undefined") return undefined;
            installStyles();
            return function() {
                removeStyles();
            };
        }, "layout-organizer: stylesheet");
        let locale = null;
        try {
            locale = ctx.get("locale");
        } catch (err) {
            locale = null;
        }
        if (locale && typeof locale.register === "function") {
            ctx.effect(function() {
                return locale.register(NS, {
                    zh: ZH,
                    en: EN
                });
            }, "layout-organizer: dictionaries");
            if (typeof locale.bind === "function") {
                const bound = locale.bind(NS);
                setTranslator(function(key) {
                    const value = bound(key);
                    return value === undefined || value === null ? key : value;
                });
            }
        } else {
            noteDegrade("locale service unavailable; falling back to English");
            setTranslator(function(key) {
                return EN[key] === undefined ? key : EN[key];
            });
        }
        const store = createStore();
        setActiveStore(store);
        const organizer = createOrganizer(ctx, store, function(where, err) {
            noteDegrade(where + ": " + (err && err.message ? err.message : String(err)));
        });
        const drag = createDragController(store);
        const listDrag = createListDragController(store);
        ctx.effect(function() {
            installRowMenu(store);
            organizer.start();
            drag.attach();
            listDrag.attach();
            return function() {
                listDrag.detach();
                drag.detach();
                organizer.stop();
                uninstallRowMenu();
                removeSurfaces();
                setActiveStore(null);
            };
        }, "layout-organizer: projection");
        try {
            ctx.slots.inject("shell.overlay", function() {
                return ctx.slots.register({
                    name: "shell.overlay",
                    id: OVERLAY_ID,
                    order: 120
                }, function StashOverlay() {
                    return h(Boundary, null, h(StashSurface, {
                        ctx: ctx,
                        store: store
                    }));
                });
            });
        } catch (err) {
            noteDegrade("shell.overlay unavailable; the stash cannot be shown: " + (err && err.message ? err.message : String(err)));
        }
        const moreSlots = [
            {
                slot: "sidebar.panellist.actions",
                region: "sidebar"
            },
            {
                slot: "conversation.session.header.views.actions",
                region: "conversation"
            }
        ];
        for(let slotAt = 0; slotAt < moreSlots.length; slotAt++){
            const target = moreSlots[slotAt];
            const region = target.region;
            injectMoreSlot(ctx, store, target.slot, region, noteDegrade);
        }
        try {
            ctx.slots.inject("settings.section", function() {
                return ctx.slots.register({
                    name: "settings.section",
                    id: SELF_ID,
                    order: 35,
                    label: function() {
                        return t("nav");
                    },
                    locale: NS
                }, function SettingsSection() {
                    return h(Boundary, null, h(SettingsPage, {
                        ctx: ctx,
                        store: store,
                        degraded: degraded,
                        onOpenStash: openStash
                    }));
                });
            });
        } catch (err) {
            noteDegrade("settings.section unavailable; the settings page cannot be reached: " + (err && err.message ? err.message : String(err)));
        }
        try {
            ctx.slots.inject("plugins.detail.section", function() {
                return ctx.slots.register({
                    name: "plugins.detail.section",
                    id: SELF_ID,
                    order: 10,
                    locale: NS
                }, function PluginDetailSection(props) {
                    const subject = props ? props.subject : null;
                    if (!subject) return null;
                    const name = subject.pkg && subject.pkg.name ? subject.pkg.name : subject.id ? subject.id : "";
                    if (name !== PLUGIN_ID && name !== SELF_ID) return null;
                    return h(Boundary, null, h(SettingsPage, {
                        ctx: ctx,
                        store: store,
                        degraded: degraded,
                        onOpenStash: openStash
                    }));
                });
            });
        } catch (err) {
            noteDegrade("plugins.detail.section unavailable; the plugin detail page has no settings: " + (err && err.message ? err.message : String(err)));
        }
        ctx.effect(function() {
            let disposeCommand = null;
            let timer = 0;
            let tries = 0;
            function stop() {
                if (timer) {
                    window.clearTimeout(timer);
                    timer = 0;
                }
                if (disposeCommand) {
                    try {
                        disposeCommand();
                    } catch (err) {}
                    disposeCommand = null;
                }
            }
            function registerShortcut() {
                if (disposeCommand) return;
                let shortcuts = null;
                try {
                    shortcuts = ctx.get("shortcuts");
                } catch (err) {
                    shortcuts = null;
                }
                if (!shortcuts || typeof shortcuts.register !== "function") {
                    if (tries++ < 10) timer = window.setTimeout(registerShortcut, 200);
                    else noteDegrade("shortcuts service unavailable; the stash has no hotkey (use the floating button)");
                    return;
                }
                const existing = shortcutIds(shortcuts);
                if (existing && existing.indexOf(SHORTCUT_ID) >= 0) return;
                try {
                    const dispose = shortcuts.register({
                        id: SHORTCUT_ID,
                        label: function() {
                            return t("shortcut.open");
                        },
                        aliases: [
                            "stash",
                            "button stash",
                            "layout organizer"
                        ],
                        defaults: {
                            "desktop:windows": {
                                code: "KeyO",
                                modifiers: [
                                    "primary",
                                    "shift"
                                ]
                            },
                            "desktop:macos": {
                                code: "KeyO",
                                modifiers: [
                                    "primary",
                                    "shift"
                                ]
                            },
                            "desktop:linux": {
                                code: "KeyO",
                                modifiers: [
                                    "primary",
                                    "shift"
                                ]
                            },
                            "web:windows": {
                                code: "KeyO",
                                modifiers: [
                                    "primary",
                                    "shift",
                                    "alt"
                                ]
                            },
                            "web:macos": {
                                code: "KeyO",
                                modifiers: [
                                    "primary",
                                    "shift",
                                    "alt"
                                ]
                            },
                            "web:linux": {
                                code: "Comma",
                                modifiers: [
                                    "primary",
                                    "shift"
                                ]
                            }
                        },
                        regions: [
                            "page"
                        ],
                        modals: [
                            "settings"
                        ],
                        resolve: function() {
                            return {
                                status: "handled",
                                run: function() {
                                    openStash();
                                }
                            };
                        }
                    });
                    if (typeof dispose === "function") disposeCommand = dispose;
                } catch (err) {
                    const message = err && err.message ? err.message : String(err);
                    if (message.indexOf("Duplicate shortcut command: " + SHORTCUT_ID) >= 0) return;
                    noteDegrade("shortcut registration failed (likely a keybinding conflict): " + message);
                }
            }
            registerShortcut();
            return stop;
        }, "layout-organizer: shortcut");
    }
}
    return { inject: inject, apply: apply };
  },
});
