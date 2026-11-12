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
const PLUGIN_VERSION = "1.3.3";
const NS = "layout-organizer";
const STORAGE_KEY = "dsh.layout-organizer.state.v5";
const STATE_VERSION = 5;
const LEGACY_STORAGE_KEYS = [];
for(let legacyVersion = STATE_VERSION - 1; legacyVersion >= 1; legacyVersion -= 1){
    LEGACY_STORAGE_KEYS.push("dsh.layout-organizer.state.v" + legacyVersion);
}
const SELF_ID = "layout-organizer";
const SHORTCUT_ID = "layout-organizer.stash";
const OVERLAY_ID = "layout-organizer-overlay";
const SORT_MODES = [
    "scope",
    "kind",
    "alpha"
];
const MODIFIER_KEYS = [
    "control",
    "alt",
    "shift",
    "meta"
];
const DEFAULT_GESTURE_KEYS = [
    "control"
];
const GESTURE_BUTTONS = [
    "left",
    "right"
];
const SORT_MODE_KEYS = {
    scope: "sort.scope",
    kind: "sort.kind",
    alpha: "sort.alpha"
};
const LAUNCHER_SIDE_LEFT = "left";
const LAUNCHER_SIDE_RIGHT = "right";
const LAUNCHER_SIDES = [
    LAUNCHER_SIDE_LEFT,
    LAUNCHER_SIDE_RIGHT
];
const LAUNCHER_SIDE_DEFAULT = LAUNCHER_SIDE_RIGHT;
const LAUNCHER_MARGIN = 16;
const LAUNCHER_EDGE = 8;
const LAUNCHER_TOP_FALLBACK = 48;
const LAUNCHER_FIRST_Y = 24;
const OUT_MARGIN = 12;
const LO_DRAG_THRESHOLD = 4;
const LO_CLICK_SUPPRESS_MS = 300;
const DIVIDER_SCOPES = [
    "sidebar",
    "tabs",
    "right",
    "settings"
];
const DIVIDER_SCOPES_ON_DIALOG = [
    "settings"
];
const Z_DIVIDER_DIALOG = 1010;
const DIVIDER_MENU_SCOPES = [
    "more"
];
const RIGHT_LIST_SELECTOR = "[data-sidebar-right-guide]";
const SCOPES = [
    {
        key: "sidebar",
        slot: "sidebar.panellist",
        labelKey: "scope.sidebar",
        axis: "y",
        outlet: '[data-slot="sidebar.panellist"]'
    },
    {
        key: "footer",
        slot: "sidebar.footer.action",
        labelKey: "scope.footer",
        axis: "x",
        outlet: '[data-slot="sidebar.footer.action"]'
    },
    {
        key: "tabs",
        slot: "conversation.view",
        labelKey: "scope.tabs",
        axis: "x",
        outlet: "[data-conversation-tabs]"
    },
    {
        key: "composer",
        slot: "conversation.composer.dock",
        labelKey: "scope.composer",
        axis: "x",
        outlet: '[data-slot="conversation.composer.dock"]'
    },
    {
        key: "right",
        slot: "",
        labelKey: "scope.right",
        axis: "y",
        outlet: RIGHT_LIST_SELECTOR
    },
    {
        key: "settings",
        slot: "settings.section",
        labelKey: "scope.settings",
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
        "trajectory",
        "more"
    ],
    composer: [
        "stats",
        "context-meter",
        "activity",
        "usage"
    ],
    right: [
        "files",
        "browser",
        "terminal",
        "forge-panel",
        "more"
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
    "right"
];
const MORE_SCOPE_HOME = {
    sidebar: "sidebar",
    footer: "sidebar",
    tabs: "conversation",
    composer: "conversation",
    right: "rightbar"
};
const MORE_REGIONS = [
    "sidebar",
    "conversation",
    "rightbar"
];
const MORE_REGION_RIGHT = "rightbar";
const MORE_ID = "more";
const SYNTHETIC_IDS = {
    composer: [
        "context-meter"
    ],
    right: [
        MORE_ID
    ],
    sidebar: [
        MORE_ID
    ],
    tabs: [
        MORE_ID
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
    },
    tabs: {
        more: "row.more"
    },
    right: {
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
    popKey: "lo-pop-key",
    divider: "lo-divider"
};
let __translator = function(key) {
    return key;
};
let __reporter = function() {};
function t(key) {
    return __translator(key);
}
function gestureText(keys) {
    const out = [];
    let i;
    for(i = 0; i < MODIFIER_KEYS.length; i++){
        if (keys.indexOf(MODIFIER_KEYS[i]) < 0) continue;
        out.push(t("gesture." + MODIFIER_KEYS[i]));
    }
    return out.join(" + ");
}
function gestureCombo(keys, button) {
    return gestureText(keys) + " + " + t(button === "right" ? "gesture.right" : "gesture.left");
}
function modifierKeysOf(event) {
    const keys = [];
    if (event.ctrlKey === true) keys.push("control");
    if (event.altKey === true) keys.push("alt");
    if (event.shiftKey === true) keys.push("shift");
    if (event.metaKey === true) keys.push("meta");
    return keys;
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
function errText(error) {
    return error && error.message ? error.message : String(error);
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
var ACTION_ICON_UNDO = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\" width=\"16\" height=\"16\" fill=\"currentColor\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M296.704 145.28L100.608 341.333333l196.096 196.096 60.330667-60.330666L263.893333 384h365.44a202.666667 202.666667 0 1 1 0 405.333333H362.666667v85.333334h266.666666a288 288 0 1 0 0-576H263.978667l93.056-93.056-60.330667-60.330667z\" fill=\"currentColor\" p-id=\"7713\"></path></svg>";
var ACTION_ICON_REDO = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\" width=\"16\" height=\"16\" fill=\"currentColor\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M727.296 145.28L923.392 341.333333l-196.096 196.096-60.330667-60.330666L760.106667 384H394.666667a202.666667 202.666667 0 0 0 0 405.333333h266.666666v85.333334H394.666667a288 288 0 1 1 0-576h365.354666l-93.056-93.056 60.330667-60.330667z\" fill=\"currentColor\" p-id=\"8693\"></path></svg>";
var UI_ICON_SEARCH = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\" width=\"13\" height=\"13\" fill=\"currentColor\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M446.112323 177.545051c137.567677 0.219798 252.612525 104.59798 266.162424 241.493333 13.562828 136.895354-78.778182 261.818182-213.617777 289.008485-134.852525 27.203232-268.386263-52.156768-308.945455-183.608889s25.018182-272.252121 151.738182-325.779394A267.235556 267.235556 0 0 1 446.112323 177.545051m0-62.060607c-182.794343 0-330.989899 148.195556-330.989899 330.989899s148.195556 330.989899 330.989899 330.989899 330.989899-148.195556 330.989899-330.989899-148.195556-330.989899-330.989899-330.989899z m431.321212 793.341415a30.849293 30.849293 0 0 1-21.94101-9.102223l-157.220202-157.220202c-11.752727-12.179394-11.584646-31.534545 0.37495-43.50707 11.972525-11.972525 31.327677-12.140606 43.494141-0.37495l157.220202 157.220202a31.036768 31.036768 0 0 1 6.723232 33.810101 31.004444 31.004444 0 0 1-28.651313 19.174142z m0 0\" p-id=\"10833\"></path></svg>";
var UI_ICON_CLOSE = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\" width=\"12\" height=\"12\" fill=\"currentColor\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M512 466.944l233.472-233.472a31.744 31.744 0 0 1 45.056 45.056L557.056 512l233.472 233.472a31.744 31.744 0 0 1-45.056 45.056L512 557.056l-233.472 233.472a31.744 31.744 0 0 1-45.056-45.056L466.944 512 233.472 278.528a31.744 31.744 0 0 1 45.056-45.056z\" fill=\"currentColor\" p-id=\"12870\"></path></svg>";
var ACTION_ICON_OUT_OF_MORE = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\" width=\"12\" height=\"12\" fill=\"currentColor\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M608 896H128V128h480c19.2 0 32-12.8 32-32s-12.8-32-32-32H96c-19.2 0-32 12.8-32 32v832c0 19.2 12.8 32 32 32h512c19.2 0 32-12.8 32-32s-12.8-32-32-32z\" p-id=\"3188\"></path><path d=\"M950.4 489.6L768 307.2c-12.8-12.8-32-12.8-44.8 0s-12.8 32 0 44.8l128 124.8H489.6c-19.2 0-32 12.8-32 32s12.8 32 32 32h358.4l-128 124.8c-12.8 12.8-12.8 32 0 44.8 6.4 6.4 16 9.6 22.4 9.6s16-3.2 22.4-9.6l182.4-182.4c6.4-6.4 9.6-12.8 9.6-22.4s0-9.6-6.4-16z\" p-id=\"3189\"></path></svg>";

// src/shared/locale.ts
const ZH = {
    "nav": "插件布局整理",
    "title": "插件布局整理",
    "version.hint": "当前插件版本",
    "section.options": "通用设置",
    "section.shortcut": "快捷键",
    "section.presets": "布局预设",
    "tab.general": "通用设置",
    "tab.layout": "位置管理",
    "tab.presets": "布局预设",
    "search.placeholder": "搜索按钮名称或 id",
    "search.clear": "取消搜索",
    "scope.sidebar": "左侧边栏·顶部",
    "scope.footer": "左侧边栏·底部",
    "scope.tabs": "对话页·顶部标签",
    "scope.composer": "对话页·输入框下方",
    "scope.right": "右侧边栏·开始页",
    "scope.settings": "设置窗口·左侧导航",
    "scope.missing": "当前界面未显示这一组按钮。打开对应页面后即可整理。",
    "opt.allowDragOfficial": "允许拖动官方按钮",
    "opt.allowDragOfficial.hint": "关闭时只有第三方按钮可以拖动，官方按钮保持原位；下属行变灰且不生效，点亮任意一路会自动打开本开关。",
    "opt.mixGroups": "允许官方和第三方混合排序",
    "opt.mixGroups.hint": "打开后官方按钮可以和第三方按钮穿插排列，分隔线在两类混在一起时自动隐藏。",
    "opt.showDivider": "显示官方 / 第三方分隔线",
    "opt.showDivider.hint": "打开后官方按钮整体排在前面，第三方按钮整体排在后面，中间画一条线；关闭时下属行变灰、一条线也不画，点亮任意一路会自动打开本开关。",
    "opt.divider.sidebar": "显示左侧边栏·顶部的分隔线",
    "opt.divider.sidebar.hint": "只影响左侧边栏·顶部这一组，其余位置不受影响。",
    "opt.divider.tabs": "显示对话页·顶部标签的分隔线",
    "opt.divider.tabs.hint": "只影响对话页·顶部标签这一组，其余位置不受影响。",
    "opt.divider.right": "显示右侧边栏·开始页的分隔线",
    "opt.divider.right.hint": "只影响右侧边栏·开始页这一组，其余位置不受影响。",
    "opt.divider.settings": "显示设置窗口·左侧导航的分隔线",
    "opt.divider.settings.hint": "只影响设置窗口·左侧导航这一组，其余位置不受影响。",
    "opt.showLauncher": "显示悬浮按钮",
    "opt.showLauncher.hint": "关闭后只能用快捷键或本页按钮打开这个面板。",
    "opt.pruneStash": "自动清除已删除的按钮",
    "opt.pruneStash.hint": "插件卸载、或那颗按钮已经不在界面上时，「已收起的按钮」里对应的记录会自动删掉，不必手动去恢复。关闭后这些失效记录会一直留着。",
    "opt.separateMore": "分开收纳",
    "opt.separateMore.hint": "打开后左侧边栏顶部与底部的按钮只收进左侧边栏的「更多」，对话页顶部标签与输入框下方的行只收进对话的「更多」，右侧边栏开始页的卡片只收进右侧边栏的「更多工具」；关闭时三处共用一份清单，收进哪一处都在三处出现。设置页左侧导航不收进任何「更多」。",
    "opt.divider.more": "显示「更多」菜单里的分隔线",
    "opt.divider.more.hint": "官方按钮排前面、第三方按钮排后面，中间画一条线。",
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
    "action.intoMoreBlocked": "这一行不能收进「更多」",
    "action.kindBlocked": "「更多」入口固定算官方，不能改判",
    "action.up": "上移",
    "action.down": "下移",
    "action.left": "左移",
    "action.right": "右移",
    "action.reset": "本组恢复默认",
    "action.bulk": "本组显示",
    "action.bulkHint": "按官方 / 第三方整组收起或进「更多」",
    "action.groupOfficial": "官方",
    "action.groupThird": "第三方",
    "action.groupAll": "全部",
    "action.bulkHide": "全部收起",
    "action.bulkHideOut": "全部恢复",
    "action.bulkHideHint": "把这一类按钮全部收进「已收起的按钮」；「更多」入口保留。",
    "action.bulkHideOutHint": "把这一类按钮全部从「已收起的按钮」恢复。",
    "action.bulkHideEmpty": "这一类没有可收起的按钮",
    "action.bulkMore": "全部进更多",
    "action.bulkMoreOut": "全部出更多",
    "action.bulkMoreHint": "把这一类能进「更多」的按钮全部收进去。",
    "action.bulkMoreOutHint": "把这一类按钮全部从「更多」移出来。",
    "action.bulkMoreEmpty": "这一类没有可进「更多」的按钮",
    "action.bulkMoreBlocked": "这一组没有「更多」菜单，收进去就找不回来",
    "action.sort": "官方在前",
    "action.sortConfirm": "再点一次排序",
    "action.sortHint": "官方按钮排在前面，第三方排在后面；「更多」入口保持最后。",
    "action.sortDone": "已经按官方 / 第三方排好了",
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
    "action.confirmResetGroup": "再点一次恢复默认",
    "action.confirmResetAll": "再点一次重置",
    "action.confirmImport": "再点一次导入",
    "action.undo": "撤销",
    "action.undo.hint": "撤掉最近一次改动（顺序、分类、收起、进更多都算）",
    "action.undo.none": "还没有可以撤销的改动",
    "action.redo": "还原",
    "action.redo.hint": "把刚撤销的那一步重新做回来",
    "action.redo.none": "没有可以还原的步骤",
    "note.exported": "配置已导出。",
    "note.importOk": "导入成功，配置已更新。",
    "note.importFail": "导入失败：这不是本插件导出的配置文件。",
    "note.undone": "已撤销上一步。",
    "note.redone": "已还原上一步。",
    "empty.stash": "这里还没有内容。在任意按钮上右键，选「收起」就会放进来。",
    "empty.list": "这里还没有按钮。",
    "empty.search": "没有匹配的按钮。清空搜索框即可看到全部。",
    "preset.placeholder": "给这套布局起个名字",
    "preset.save": "保存为预设",
    "preset.overwrite": "覆盖同名预设",
    "preset.confirmOverwrite": "再点一次覆盖",
    "preset.overwrite.hint": "已经有一套同名预设，保存会把那一套整份换掉。",
    "preset.apply": "应用",
    "preset.confirmApply": "再点一次应用",
    "preset.apply.hint": "把这套预设的顺序、分类与收纳写回当前布局。开关、悬浮按钮与快捷键不受影响。",
    "preset.delete": "删除",
    "preset.confirmDelete": "再点一次删除",
    "preset.delete.hint": "删掉这套预设，当前布局不受影响。",
    "preset.note": "预设记录各处的顺序、官方 / 第三方分类、收起与「更多」，不含开关与快捷键。",
    "preset.default": "默认",
    "preset.default.hint": "你手调的那套布局：停在它上面时随改动同步；切到别的预设后它会停住，应用它就回到切走前的样子。",
    "preset.default.locked": "「默认」就是你自己手调的那一套，删不掉。",
    "preset.apply.active": "当前正停在这套预设上，应用一次不会有任何变化。",
    "stash.title": "已收起的按钮",
    "stash.launcher": "已收起的按钮",
    "stash.count": "共 {count} 个按钮",
    "shortcut.open": "打开已收起的按钮",
    "shortcut.none": "未设置",
    "shortcut.record": "点击后按下新的组合键",
    "shortcut.recording": "请按下组合键…",
    "shortcut.reset": "恢复默认",
    "shortcut.confirmReset": "再点一次恢复默认",
    "shortcut.openHint": "打开「已收起的按钮」面板。",
    "shortcut.saved": "已保存。",
    "shortcut.invalid": "这个组合键不可用：{reason}",
    "shortcut.conflict": "已被占用：{list}",
    "shortcut.failed": "保存失败（{status}），快捷键未改动。",
    "shortcut.recordFailed": "系统按键保护没启用，录制期间其他快捷键可能仍会触发。",
    "shortcut.hint": "快捷键同样可以在 DSH 的「快捷键」设置里修改。",
    "gesture.control": "Ctrl",
    "gesture.alt": "Alt",
    "gesture.shift": "Shift",
    "gesture.meta": "Meta",
    "gesture.left": "左键",
    "gesture.right": "右键",
    "gesture.stashLabel": "收起 / 恢复",
    "gesture.moreLabel": "进更多 / 出更多",
    "gesture.stashHint": "前缀与鼠标键都可改：按下收起，已收起则恢复。",
    "gesture.moreHint": "前缀与鼠标键都可改：按下进更多，已在更多则出更多。",
    "gesture.buttonTaken": "另一个手势前缀相同时已经占了这个键，换前缀或选另一个键。",
    "gesture.record": "点击后按下修饰键（Ctrl / Alt / Shift / Meta），Enter 或移开焦点保存，Esc 取消",
    "gesture.recording": "按下修饰键…",
    "gesture.saved": "手势已保存。",
    "gesture.prefixEmpty": "前缀不能为空：至少按一个修饰键。",
    "nav.failed": "无法打开「{label}」，该按钮可能已不可用。"
};
const EN = {
    "nav": "Plugin layout organizer",
    "title": "Plugin layout organizer",
    "version.hint": "Installed plugin version",
    "section.options": "General",
    "section.shortcut": "Shortcut",
    "section.presets": "Layout presets",
    "tab.general": "General",
    "tab.layout": "Layout",
    "tab.presets": "Presets",
    "search.placeholder": "Search button name or id",
    "search.clear": "Clear search",
    "scope.sidebar": "Left sidebar · top",
    "scope.footer": "Left sidebar · bottom",
    "scope.tabs": "Conversation page · top tabs",
    "scope.composer": "Conversation page · below composer",
    "scope.right": "Right sidebar · Start page",
    "scope.settings": "Settings window · left navigation",
    "scope.missing": "This group is not on screen right now. Open the matching page to organize it.",
    "opt.allowDragOfficial": "Allow dragging official buttons",
    "opt.allowDragOfficial.hint": "When off, only third-party buttons can be dragged and the row below greys out; lighting it up switches this one on.",
    "opt.mixGroups": "Allow official and third-party rows to mix",
    "opt.mixGroups.hint": "When on, official and third-party buttons can interleave; the divider hides itself once the two kinds are mixed.",
    "opt.showDivider": "Show the official / third-party divider",
    "opt.showDivider.hint": "Official buttons move to the front, third-party buttons to the back, with a line between them. When off the rows below grey out and no line is drawn; lighting one up switches this one on.",
    "opt.divider.sidebar": "Divider for the left sidebar · top group",
    "opt.divider.sidebar.hint": "Applies only to the left sidebar · top group; other locations are unaffected.",
    "opt.divider.tabs": "Divider for the conversation page · top tabs group",
    "opt.divider.tabs.hint": "Applies only to the conversation page · top tabs group; other locations are unaffected.",
    "opt.divider.right": "Divider for the right sidebar · Start page group",
    "opt.divider.right.hint": "Applies only to the right sidebar · Start page group; other locations are unaffected.",
    "opt.divider.settings": "Divider for the settings window · left navigation group",
    "opt.divider.settings.hint": "Applies only to the settings window · left navigation group; other locations are unaffected.",
    "opt.showLauncher": "Show the floating button",
    "opt.showLauncher.hint": "When off, only the shortcut or this page can open this panel.",
    "opt.pruneStash": "Remove records of deleted buttons",
    "opt.pruneStash.hint": "When a plugin is uninstalled, or its button is no longer in the interface, its entry under Tucked-away buttons is deleted automatically instead of waiting for you to restore it. When off, those stale entries stay.",
    "opt.separateMore": "Keep the More menus apart",
    "opt.separateMore.hint": "When on, buttons at the top and bottom of the left sidebar only go into the left sidebar More, rows in the conversation top tabs and below the composer only into the conversation More, and cards on the right sidebar Start page only into the right sidebar \"More tools\". When off, the three menus share one list, so anything tucked in shows up in all three. Settings-window navigation rows never go into any More menu.",
    "opt.divider.more": "Divider inside the More menu",
    "opt.divider.more.hint": "Official buttons first, third-party after, with a line between them.",
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
    "action.intoMoreBlocked": "This row cannot go into the More menu",
    "action.kindBlocked": "A More entry is always official and cannot be reclassified",
    "action.up": "Move up",
    "action.down": "Move down",
    "action.left": "Move left",
    "action.right": "Move right",
    "action.reset": "Reset this group",
    "action.bulk": "Group display",
    "action.bulkHint": "Tuck or move this whole group by official / third-party",
    "action.groupOfficial": "Official",
    "action.groupThird": "Third-party",
    "action.groupAll": "All",
    "action.bulkHide": "Tuck all",
    "action.bulkHideOut": "Restore all",
    "action.bulkHideHint": "Tuck every row of this kind; the More entry stays.",
    "action.bulkHideOutHint": "Restore every tucked-away row of this kind.",
    "action.bulkHideEmpty": "Nothing to tuck away in this group",
    "action.bulkMore": "All into More",
    "action.bulkMoreOut": "All out of More",
    "action.bulkMoreHint": "Move every row of this kind that can go into the More menu.",
    "action.bulkMoreOutHint": "Move every row of this kind out of the More menu.",
    "action.bulkMoreEmpty": "Nothing to move into More in this group",
    "action.bulkMoreBlocked": "This group has no More menu, so rows would be unreachable",
    "action.sort": "Official first",
    "action.sortConfirm": "Click again to sort",
    "action.sortHint": "Put official rows first and third-party rows after; the More entry stays last.",
    "action.sortDone": "Already sorted by official / third-party",
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
    "action.undo": "Undo",
    "action.undo.hint": "Undo the most recent change (ordering, kind, tucking away, into More)",
    "action.undo.none": "Nothing to undo yet",
    "action.redo": "Redo",
    "action.redo.hint": "Reapply the step you just undid",
    "action.redo.none": "Nothing to redo",
    "note.exported": "Configuration exported.",
    "note.importOk": "Imported; the configuration is updated.",
    "note.importFail": "Import failed: that is not a configuration file exported by this plugin.",
    "note.undone": "Undone.",
    "note.redone": "Redone.",
    "empty.stash": "Nothing here yet. Right-click any button and choose Tuck away to put it here.",
    "empty.list": "No buttons here yet.",
    "empty.search": "No matching buttons. Clear the search box to see everything.",
    "preset.placeholder": "Name this layout",
    "preset.save": "Save as preset",
    "preset.overwrite": "Overwrite preset",
    "preset.confirmOverwrite": "Click again to overwrite",
    "preset.overwrite.hint": "A preset with this name already exists; saving replaces it entirely.",
    "preset.apply": "Apply",
    "preset.confirmApply": "Click again to apply",
    "preset.apply.hint": "Write this preset's ordering, kinds and tucked-away rows back into the current layout. Switches, the floating button and shortcuts are untouched.",
    "preset.delete": "Delete",
    "preset.confirmDelete": "Click again to delete",
    "preset.delete.hint": "Delete this preset; the current layout is unaffected.",
    "preset.note": "A preset stores ordering, official / third-party kinds, tucked-away and More rows for every location. Switches and shortcuts are not included.",
    "preset.default": "Default",
    "preset.default.hint": "The layout you arranged by hand: it follows your changes while you stay on it, and freezes once you switch to another preset, so applying it takes you back.",
    "preset.default.locked": "Default is the layout you arranged by hand; it cannot be deleted.",
    "preset.apply.active": "This preset is the one currently in effect; applying it would change nothing.",
    "stash.title": "Tucked-away buttons",
    "stash.launcher": "Tucked-away buttons",
    "stash.count": "{count} buttons",
    "shortcut.open": "Open the tucked-away buttons",
    "shortcut.none": "Not set",
    "shortcut.record": "Click, then press the new combination",
    "shortcut.recording": "Press a combination…",
    "shortcut.reset": "Restore default",
    "shortcut.confirmReset": "Click again to reset",
    "shortcut.openHint": "Opens the tucked-away buttons panel.",
    "shortcut.saved": "Saved.",
    "shortcut.invalid": "That combination is not usable: {reason}",
    "shortcut.conflict": "Already taken by: {list}",
    "shortcut.failed": "Could not save ({status}); the shortcut is unchanged.",
    "shortcut.recordFailed": "System key protection is unavailable; other shortcuts may still fire while recording.",
    "shortcut.hint": "The shortcut can also be changed in the DSH Shortcuts settings.",
    "gesture.control": "Ctrl",
    "gesture.alt": "Alt",
    "gesture.shift": "Shift",
    "gesture.meta": "Meta",
    "gesture.left": "Left click",
    "gesture.right": "Right click",
    "gesture.stashLabel": "Tuck / restore",
    "gesture.moreLabel": "Into / out of more",
    "gesture.stashHint": "The prefix and mouse button are both configurable: click tucks it away, or restores it when already tucked.",
    "gesture.moreHint": "The prefix and mouse button are both configurable: click moves it into “More”, or out when it is already there.",
    "gesture.buttonTaken": "The other gesture already uses this button with the same prefix; change the prefix or pick the other button.",
    "gesture.record": "Click, then press modifiers (Ctrl / Alt / Shift / Meta); Enter or blur saves, Esc cancels",
    "gesture.recording": "Press modifiers…",
    "gesture.saved": "Gesture saved.",
    "gesture.prefixEmpty": "The prefix cannot be empty: press at least one modifier.",
    "nav.failed": "Could not open “{label}”; that button may no longer be available."
};

// src/core/store.ts
function defaultState() {
    const state = {
        version: STATE_VERSION,
        options: {
            allowDragOfficial: true,
            mixGroups: true,
            showDivider: true,
            dividers: {},
            showStashLauncher: true,
            pruneStash: true,
            separateMore: true,
            collapsed: {},
            gestureStash: DEFAULT_GESTURE_KEYS.slice(),
            gestureMore: DEFAULT_GESTURE_KEYS.slice(),
            gestureStashButton: "left",
            gestureMoreButton: "right",
            launcherSide: LAUNCHER_SIDE_DEFAULT,
            launcherY: null
        },
        order: {},
        kinds: {},
        hidden: {},
        intoMore: {},
        moreOrder: {},
        stashSort: SORT_MODES[0],
        known: {},
        presets: {},
        activePreset: "",
        defaultPreset: null
    };
    let i;
    for(i = 0; i < SCOPES.length; i++)state.order[SCOPES[i].key] = [];
    return state;
}
function boolOr(source, key, fallback) {
    const one = source[key];
    return typeof one === "boolean" ? one : fallback;
}
function asObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function asMap(value, keep) {
    const source = asObject(value);
    const out = {};
    const keys = Object.keys(source);
    let i;
    for(i = 0; i < keys.length; i++){
        const kept = keep(source[keys[i]]);
        if (kept !== null) out[keys[i]] = kept;
    }
    return out;
}
function asBoolMap(value) {
    return asMap(value, function(one) {
        return one === true ? true : null;
    });
}
function asStringMap(value) {
    return asMap(value, function(one) {
        if (!Array.isArray(one)) return null;
        const kept = [];
        let j;
        for(j = 0; j < one.length; j++)if (typeof one[j] === "string" && one[j]) kept.push(one[j]);
        return kept;
    });
}
function asFlagMap(value) {
    return asMap(value, function(one) {
        return typeof one === "boolean" ? one : null;
    });
}
function asModifierList(value, fallback) {
    if (!Array.isArray(value)) return fallback.slice();
    const kept = [];
    let i;
    for(i = 0; i < value.length; i++){
        const one = value[i];
        if (typeof one === "string" && MODIFIER_KEYS.indexOf(one) >= 0 && kept.indexOf(one) < 0) kept.push(one);
    }
    return kept.length > 0 ? kept : fallback.slice();
}
function asNumberMap(value) {
    return asMap(value, function(one) {
        return typeof one === "number" && isFinite(one) ? one : null;
    });
}
function asPresets(value) {
    const source = asObject(value);
    const out = {};
    const names = Object.keys(source);
    let i;
    for(i = 0; i < names.length; i++){
        const one = asPreset(source[names[i]]);
        if (one) out[names[i]] = one;
    }
    return out;
}
function asPreset(value) {
    const one = asObject(value);
    if (Object.keys(one).length === 0) return null;
    const savedAt = one.savedAt;
    return {
        order: asStringMap(one.order),
        kinds: asObject(one.kinds),
        hidden: asBoolMap(one.hidden),
        intoMore: asBoolMap(one.intoMore),
        moreOrder: asStringMap(one.moreOrder),
        savedAt: typeof savedAt === "number" && isFinite(savedAt) ? savedAt : 0
    };
}
function dropIntoMoreScopes(intoMore) {
    const keys = Object.keys(intoMore);
    let i;
    for(i = 0; i < keys.length; i++){
        const at = keys[i].indexOf(":");
        const scope = at > 0 ? keys[i].slice(0, at) : keys[i];
        if (MORE_SCOPES.indexOf(scope) < 0) delete intoMore[keys[i]];
    }
}
function normalizeState(raw) {
    const base = defaultState();
    const source = asObject(raw);
    const version = source.version;
    if (typeof version !== "number" || !isFinite(version) || version > STATE_VERSION) {
        if (typeof console !== "undefined" && typeof version === "number") {
            console.warn("[layout-organizer] state version " + version + " is newer than " + STATE_VERSION + ", falling back to defaults");
        }
        return base;
    }
    const options = asObject(source.options);
    base.options.allowDragOfficial = boolOr(options, "allowDragOfficial", base.options.allowDragOfficial);
    base.options.mixGroups = boolOr(options, "mixGroups", base.options.mixGroups);
    base.options.showDivider = boolOr(options, "showDivider", base.options.showDivider);
    base.options.dividers = asFlagMap(options.dividers);
    base.options.showStashLauncher = boolOr(options, "showStashLauncher", base.options.showStashLauncher);
    base.options.pruneStash = boolOr(options, "pruneStash", base.options.pruneStash);
    base.options.separateMore = boolOr(options, "separateMore", base.options.separateMore);
    base.options.collapsed = asFlagMap(options.collapsed);
    base.options.gestureStash = asModifierList(options.gestureStash, base.options.gestureStash);
    base.options.gestureMore = asModifierList(options.gestureMore, base.options.gestureMore);
    const stashButton = options.gestureStashButton;
    base.options.gestureStashButton = typeof stashButton === "string" && GESTURE_BUTTONS.indexOf(stashButton) >= 0 ? stashButton : base.options.gestureStashButton;
    const moreButton = options.gestureMoreButton;
    base.options.gestureMoreButton = typeof moreButton === "string" && GESTURE_BUTTONS.indexOf(moreButton) >= 0 ? moreButton : base.options.gestureMoreButton;
    if (base.options.gestureStash.join("+") === base.options.gestureMore.join("+") && base.options.gestureStashButton === base.options.gestureMoreButton) {
        base.options.gestureStashButton = "left";
        base.options.gestureMoreButton = "right";
    }
    const launcherSide = options.launcherSide;
    base.options.launcherSide = typeof launcherSide === "string" && LAUNCHER_SIDES.indexOf(launcherSide) >= 0 ? launcherSide : LAUNCHER_SIDE_DEFAULT;
    const launcherY = options.launcherY;
    base.options.launcherY = typeof launcherY === "number" && isFinite(launcherY) ? launcherY : null;
    base.hidden = asBoolMap(source.hidden);
    base.intoMore = asBoolMap(source.intoMore);
    dropIntoMoreScopes(base.intoMore);
    base.moreOrder = asStringMap(source.moreOrder);
    base.kinds = asObject(source.kinds);
    const stashSort = source.stashSort;
    base.stashSort = typeof stashSort === "string" && SORT_MODES.indexOf(stashSort) >= 0 ? stashSort : SORT_MODES[0];
    base.known = asNumberMap(source.known);
    base.presets = asPresets(source.presets);
    const active = source.activePreset;
    base.activePreset = typeof active === "string" && active && Object.prototype.hasOwnProperty.call(base.presets, active) ? active : "";
    base.defaultPreset = asPreset(source.defaultPreset);
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
                if (typeof id !== "string" || id.indexOf("text:") === 0 || id.indexOf("cls:") === 0) continue;
                if (clean.indexOf(id) < 0) clean.push(id);
            }
            base.order[scope] = clean;
        }
    }
    return base;
}
function readState() {
    try {
        const text = window.localStorage.getItem(STORAGE_KEY);
        if (text) return normalizeState(JSON.parse(text));
        let i;
        for(i = 0; i < LEGACY_STORAGE_KEYS.length; i++){
            const legacyKey = LEGACY_STORAGE_KEYS[i];
            const legacyText = window.localStorage.getItem(legacyKey);
            if (!legacyText) continue;
            let migrated;
            try {
                const parsed = JSON.parse(legacyText);
                if (!parsed || typeof parsed.version !== "number" || parsed.version > STATE_VERSION) continue;
                migrated = normalizeState(parsed);
            } catch (err) {
                if (typeof console !== "undefined") console.warn("[layout-organizer] legacy state read failed:", legacyKey, err);
                continue;
            }
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
            window.localStorage.removeItem(legacyKey);
            return migrated;
        }
        return defaultState();
    } catch (err) {
        if (typeof console !== "undefined") console.warn("[layout-organizer] state read failed:", err);
        return defaultState();
    }
}

// src/core/store-runtime.ts
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
function useTicker(deps, subscribe) {
    const pair = useState(0);
    const setTick = pair[1];
    useEffect(function() {
        const off = subscribe(function() {
            setTick(function(value) {
                return value + 1;
            });
        });
        return typeof off === "function" ? off : undefined;
    }, deps);
    return pair[0];
}
function useRevisionTick() {
    return useTicker([], function(bump) {
        return subscribeRevision(bump);
    });
}
const __flushStore = [];
window.addEventListener("pagehide", function() {
    for(let i = 0; i < __flushStore.length; i++){
        try {
            __flushStore[i]();
        } catch (err) {}
    }
});
const __history = [];
const __future = [];
const HISTORY_MAX = 20;
function pushHistory(snapshot) {
    if (__history.length > 0 && __history[__history.length - 1] === snapshot) return;
    __history.push(snapshot);
    if (__history.length > HISTORY_MAX) __history.shift();
}
function canUndo() {
    return __history.length > 0;
}
function pushFuture(snapshot) {
    if (__future.length > 0 && __future[__future.length - 1] === snapshot) return;
    __future.push(snapshot);
    if (__future.length > HISTORY_MAX) __future.shift();
}
function undoLast(store) {
    const snapshot = __history.pop();
    if (snapshot === undefined) return false;
    let parsed = null;
    try {
        parsed = JSON.parse(snapshot);
    } catch (err) {
        return false;
    }
    pushFuture(JSON.stringify(store.get()));
    store.replace(normalizeState(parsed));
    return true;
}
function canRedo() {
    return __future.length > 0;
}
function redoLast(store) {
    const snapshot = __future.pop();
    if (snapshot === undefined) return false;
    let parsed = null;
    try {
        parsed = JSON.parse(snapshot);
    } catch (err) {
        return false;
    }
    pushHistory(JSON.stringify(store.get()));
    store.replace(normalizeState(parsed));
    return true;
}
function createStore() {
    let state = readState();
    let timer = null;
    let saveFailed = false;
    function persist() {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (err) {
            if (!saveFailed) {
                saveFailed = true;
                if (typeof console !== "undefined") console.warn("[layout-organizer] state save failed:", err);
            }
        }
    }
    function flush() {
        if (timer) {
            window.clearTimeout(timer);
            timer = null;
        }
        persist();
    }
    __flushStore.push(flush);
    return {
        get: function() {
            return state;
        },
        subscribe: function(listener) {
            return subscribeRevision(function() {
                listener(state);
            });
        },
        update: function(mutator, opts) {
            const before = opts && opts.history === false ? "" : JSON.stringify(state);
            const next = mutator(state);
            if (next) state = next;
            if (state.activePreset === "") {
                try {
                    state.defaultPreset = capturePreset(state);
                } catch (err) {}
            }
            if (before) {
                let after = "";
                try {
                    after = JSON.stringify(state);
                } catch (err) {
                    after = "";
                }
                if (after && after !== before) {
                    pushHistory(before);
                    __future.length = 0;
                }
            }
            notifyRevision();
            if (timer) window.clearTimeout(timer);
            timer = window.setTimeout(function() {
                timer = null;
                persist();
            }, 180);
        },
        replace: function(next) {
            state = next;
            notifyRevision();
            persist();
        },
        reset: function() {
            state = defaultState();
            notifyRevision();
            persist();
        }
    };
}

// src/core/store-kinds.ts
const rightKindOfficial = {};
function noteRightKindOfficial(kind, providerId) {
    if (!kind || !providerId) return;
    if (providerId.indexOf("@deepseek-ai/dsh-client-ui-") === 0) rightKindOfficial[kind] = true;
}
function rightBaseKind(id) {
    const cut = id.lastIndexOf("-");
    if (cut > 0 && /^\d+$/.test(id.slice(cut + 1))) return id.slice(0, cut);
    return id;
}
function kindOf(state, scope, id) {
    const manual = state.kinds[rowKey(scope, id)];
    if (manual === "official" || manual === "third") return manual;
    const official = OFFICIAL_IDS[scope] || [];
    let base = id;
    if (scope === "right") {
        if (rightKindOfficial[id] === true) return "official";
        base = rightBaseKind(id);
        if (base !== id && rightKindOfficial[base] === true) return "official";
    }
    if (official.indexOf(id) >= 0) return "official";
    if (scope === "right" && base !== id && official.indexOf(base) >= 0) return "official";
    return "third";
}
function groupOf(state, scope, id) {
    return kindOf(state, scope, id) === "official" ? "official" : "third";
}
function mixedOrder(state) {
    return state.options.allowDragOfficial === true && state.options.mixGroups === true;
}
function rowKey(scope, id) {
    return scope + ":" + id;
}
function splitRowKey(key) {
    const at = key.indexOf(":");
    if (at <= 0 || at >= key.length - 1) return null;
    return {
        scope: key.slice(0, at),
        id: key.slice(at + 1)
    };
}
function dropScopeKeys(map, scope) {
    const prefix = scope + ":";
    const keys = Object.keys(map);
    for(let i = 0; i < keys.length; i++)if (keys[i].indexOf(prefix) === 0) delete map[keys[i]];
}
function dividerEnabled(state, scope) {
    if (state.options.showDivider !== true) return false;
    if (DIVIDER_SCOPES.indexOf(scope) < 0) return false;
    const one = state.options.dividers ? state.options.dividers[scope] : undefined;
    return one !== false;
}
function isHidden(state, scope, id) {
    return state.hidden[rowKey(scope, id)] === true;
}
function isIntoMore(state, scope, id) {
    return state.intoMore[rowKey(scope, id)] === true;
}
function isIntoMoreRow(state, scope, id) {
    return moreScopeOk(scope) && isIntoMore(state, scope, id);
}
const ORDER_PRUNE_SCOPES = [
    "settings",
    "sidebar",
    "right"
];
function dropStaleOrder(state, scope, ids) {
    if (ORDER_PRUNE_SCOPES.indexOf(scope) < 0 || ids.length === 0) return;
    const saved = state.order[scope] || [];
    if (saved.length === 0) return;
    const keep = {};
    let i;
    for(i = 0; i < ids.length; i++)keep[ids[i]] = true;
    const next = [];
    for(i = 0; i < saved.length; i++){
        const id = saved[i];
        if (keep[id] || isHidden(state, scope, id) || isIntoMoreRow(state, scope, id)) next.push(id);
    }
    if (next.length !== saved.length) state.order[scope] = next;
}

// src/core/store-more.ts
function moreScopeOk(scope) {
    if (MORE_SCOPES.indexOf(scope) < 0) return false;
    return moreAvailableFor(moreRegionOf(scope));
}
function canTuckIntoMore(scope, id) {
    return moreScopeOk(scope) && !isMoreEntry(scope, id);
}
const loMoreSeen = {};
const loMoreProbe = {};
const MORE_PROBE_TTL_MS = 250;
function moreAvailableFor(region) {
    if (loMoreSeen[region] === true) return true;
    if (typeof document === "undefined" || !document.querySelector) return false;
    const now = Date.now();
    const memo = loMoreProbe[region];
    if (memo && now - memo.at < MORE_PROBE_TTL_MS) return memo.ok;
    let host = null;
    if (region === "rightbar") {
        host = document.querySelector(RIGHT_LIST_SELECTOR);
    } else if (region === "conversation") {
        const tabs = document.querySelector("[data-conversation-tabs]");
        host = tabs ? tabs.parentElement : null;
    } else {
        host = document.querySelector("nav[class*='panelList'], [class*='panelList']");
    }
    const ok = !!(host && host.querySelector("button[aria-haspopup='menu']"));
    if (ok) loMoreSeen[region] = true;
    loMoreProbe[region] = {
        at: now,
        ok: ok
    };
    return ok;
}
function moreAvailable() {
    return moreAvailableFor("sidebar") || moreAvailableFor("conversation") || moreAvailableFor("rightbar");
}
function noteMoreAvailable(region) {
    loMoreSeen[region] = true;
}
function moreRegionOf(scope) {
    const home = MORE_SCOPE_HOME[scope];
    return home ? home : MORE_REGIONS[0];
}
function moreScopesIn(state, region) {
    if (!moreAvailableFor(region)) return [];
    if (state.options.separateMore !== true) return MORE_SCOPES.slice();
    const out = [];
    let i;
    for(i = 0; i < MORE_SCOPES.length; i++)if (moreRegionOf(MORE_SCOPES[i]) === region) out.push(MORE_SCOPES[i]);
    return out;
}
function moreDividerOn(state) {
    if (state.options.showDivider !== true) return false;
    const map = state.options.dividers || {};
    return map.more !== false;
}
function pickMoreRow(state, picked, seen, scope, id) {
    const key = rowKey(scope, id);
    if (seen[key]) return;
    if (isMoreEntry(scope, id)) return;
    if (!isIntoMore(state, scope, id)) return;
    seen[key] = true;
    picked.push({
        scope: scope,
        id: id
    });
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
        const live = liveOrder(scope);
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
            pickMoreRow(state, picked, seen, scope, id);
        }
    }
    const allKeys = Object.keys(state.intoMore);
    for(i = 0; i < allKeys.length; i++){
        const key = allKeys[i];
        const cut = key.indexOf(":");
        if (cut <= 0) continue;
        const scope = key.slice(0, cut);
        const id = key.slice(cut + 1);
        if (!id) continue;
        if (!allowed[scope]) continue;
        pickMoreRow(state, picked, seen, scope, id);
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
    for(i = 0; i < rows.length; i++)out.push(rowKey(rows[i].scope, rows[i].id));
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

// src/core/store-edit.ts
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
        const stowed = [];
        for(i = 0; i < discovered.length; i++){
            const id = discovered[i];
            if (saved.indexOf(id) >= 0) continue;
            if (isHidden(state, scope, id) || isIntoMoreRow(state, scope, id)) stowed.push(id);
            else mixed.push(id);
        }
        for(i = 0; i < stowed.length; i++)spliceNear(mixed, discovered, stowed[i]);
        return mixed;
    }
    for(i = 0; i < saved.length; i++){
        const id = saved[i];
        if (!known[id]) continue;
        (kindOf(state, scope, id) === "official" ? official : third).push(id);
    }
    const stowed = [];
    for(i = 0; i < discovered.length; i++){
        const id = discovered[i];
        if (saved.indexOf(id) >= 0) continue;
        if (isHidden(state, scope, id) || isIntoMoreRow(state, scope, id)) stowed.push(id);
        else (kindOf(state, scope, id) === "official" ? official : third).push(id);
    }
    for(i = 0; i < stowed.length; i++){
        spliceNear(kindOf(state, scope, stowed[i]) === "official" ? official : third, discovered, stowed[i]);
    }
    return official.concat(third);
}
function spliceNear(list, ref, id) {
    const at = ref.indexOf(id);
    let to = -1;
    let j;
    for(j = at - 1; j >= 0; j--){
        const found = list.indexOf(ref[j]);
        if (found >= 0) {
            to = found + 1;
            break;
        }
    }
    if (to < 0) {
        for(j = at + 1; j < ref.length; j++){
            const found = list.indexOf(ref[j]);
            if (found >= 0) {
                to = found;
                break;
            }
        }
    }
    list.splice(to < 0 ? list.length : to, 0, id);
}
function scopeDirty(state, scope) {
    if ((state.order[scope] || []).length > 0) return true;
    const keys = Object.keys(state.hidden).concat(Object.keys(state.intoMore));
    let i;
    for(i = 0; i < keys.length; i++)if (keys[i].indexOf(scope + ":") === 0) return true;
    const kinds = Object.keys(state.kinds);
    for(i = 0; i < kinds.length; i++)if (kinds[i].indexOf(scope + ":") === 0) return true;
    return false;
}
function stateDirty(state) {
    const fresh = defaultState();
    return JSON.stringify(state.order) !== JSON.stringify(fresh.order) || JSON.stringify(state.kinds) !== JSON.stringify(fresh.kinds) || JSON.stringify(state.hidden) !== JSON.stringify(fresh.hidden) || JSON.stringify(state.intoMore) !== JSON.stringify(fresh.intoMore) || JSON.stringify(state.moreOrder) !== JSON.stringify(fresh.moreOrder) || JSON.stringify(state.options) !== JSON.stringify(fresh.options);
}
function stashCount(state) {
    return stashEntries(state).length;
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
function setCollapsed(state, key, collapsed) {
    if (!state.options.collapsed) state.options.collapsed = {};
    state.options.collapsed[key] = collapsed;
}
let __visibleOrder = null;
function setVisibleOrderProvider(fn) {
    __visibleOrder = fn;
}
function pinOrder(state, scope, id) {
    const live = __visibleOrder ? __visibleOrder(state, scope) : [];
    if ((state.order[scope] || []).indexOf(id) < 0 && live.indexOf(id) >= 0) writeOrder(state, scope, live);
}
function setHidden(state, scope, id, hidden) {
    const key = rowKey(scope, id);
    if (!hidden) {
        delete state.hidden[key];
        anchorUnsavedRow(state, scope, id);
        return;
    }
    pinOrder(state, scope, id);
    state.hidden[key] = true;
    delete state.intoMore[key];
}
function toggleHidden(state, scope, id) {
    setHidden(state, scope, id, !isHidden(state, scope, id));
}
function setIntoMore(state, scope, id, into) {
    const key = rowKey(scope, id);
    if (!into) {
        delete state.intoMore[key];
        anchorUnsavedRow(state, scope, id);
        return;
    }
    pinOrder(state, scope, id);
    state.intoMore[key] = true;
    delete state.hidden[key];
}
function toggleIntoMore(state, scope, id) {
    setIntoMore(state, scope, id, !isIntoMore(state, scope, id));
}
function writeOrder(state, scope, ids) {
    const saved = state.order[scope] || [];
    const next = [];
    let i;
    for(i = 0; i < ids.length; i++){
        const id = ids[i];
        if (!id || next.indexOf(id) >= 0) continue;
        if (id.indexOf("text:") === 0 || id.indexOf("cls:") === 0) continue;
        next.push(id);
    }
    for(i = 0; i < saved.length; i++){
        if (next.indexOf(saved[i]) < 0) spliceNear(next, saved, saved[i]);
    }
    state.order[scope] = next;
}
function moveRow(state, scope, id, delta, group) {
    const saved = state.order[scope] || [];
    let list = saved.slice();
    if (list.indexOf(id) < 0) {
        const live = liveOrder(scope);
        let i;
        for(i = 0; i < live.length; i++){
            const liveId = live[i];
            if (list.indexOf(liveId) >= 0) continue;
            if (isHidden(state, scope, liveId)) continue;
            list.push(liveId);
        }
    }
    const from = list.indexOf(id);
    if (from < 0) return false;
    let target = -1;
    const step = delta > 0 ? 1 : -1;
    let cursor = from + step;
    while(cursor >= 0 && cursor < list.length){
        const candidate = list[cursor];
        if (isMoreEntry(scope, candidate) || isIntoMoreRow(state, scope, candidate)) {
            cursor += step;
            continue;
        }
        if (!group || groupOf(state, scope, candidate) === group) {
            target = cursor;
            break;
        }
        cursor += step;
    }
    if (target < 0) return false;
    list.splice(from, 1);
    list.splice(target, 0, id);
    writeOrder(state, scope, list);
    return true;
}
function resetScope(state, scope) {
    state.order[scope] = [];
    dropScopeKeys(state.hidden, scope);
    dropScopeKeys(state.intoMore, scope);
    dropScopeKeys(state.kinds, scope);
    let i;
    if (MORE_SCOPES.indexOf(scope) >= 0) {
        const region = moreRegionOf(scope);
        const order = state.moreOrder[region] || [];
        const kept = [];
        for(i = 0; i < order.length; i++)if (order[i].indexOf(scope + ":") !== 0) kept.push(order[i]);
        if (kept.length !== order.length) state.moreOrder[region] = kept;
    }
}
function restoreAllHidden(state) {
    const keys = Object.keys(state.hidden);
    state.hidden = {};
    for(let i = 0; i < keys.length; i++){
        const cut = keys[i].indexOf(":");
        if (cut < 0) continue;
        anchorUnsavedRow(state, keys[i].slice(0, cut), keys[i].slice(cut + 1));
    }
}

// src/core/store-data.ts
const __fresh = {};
function hasUnknownRows(state, scope, ids) {
    const known = state.known || {};
    for(let i = 0; i < ids.length; i++)if (known[rowKey(scope, ids[i])] === undefined) return true;
    return false;
}
function noteKnownRows(state, scope, ids, seed) {
    if (!state.known) state.known = {};
    const now = Date.now();
    let added = false;
    for(let i = 0; i < ids.length; i++){
        const key = rowKey(scope, ids[i]);
        if (state.known[key] !== undefined) continue;
        state.known[key] = now;
        if (!seed) __fresh[key] = true;
        added = true;
    }
    return added;
}
function isFreshRow(scope, id) {
    return __fresh[rowKey(scope, id)] === true;
}
function clearFreshRow(scope, id) {
    delete __fresh[rowKey(scope, id)];
}
function clearAllFresh() {
    const keys = Object.keys(__fresh);
    for(let i = 0; i < keys.length; i++)delete __fresh[keys[i]];
}
function presetNames(state) {
    const map = state.presets || {};
    return Object.keys(map).sort();
}
function capturePreset(state) {
    const order = {};
    let i;
    for(i = 0; i < SCOPES.length; i++){
        const scope = SCOPES[i].key;
        order[scope] = (state.order[scope] || []).slice();
    }
    const kinds = {};
    const kindKeys = Object.keys(state.kinds || {});
    for(i = 0; i < kindKeys.length; i++)kinds[kindKeys[i]] = state.kinds[kindKeys[i]];
    const hidden = {};
    const hiddenKeys = Object.keys(state.hidden || {});
    for(i = 0; i < hiddenKeys.length; i++)hidden[hiddenKeys[i]] = true;
    const intoMore = {};
    const moreKeys = Object.keys(state.intoMore || {});
    for(i = 0; i < moreKeys.length; i++)intoMore[moreKeys[i]] = true;
    const moreOrder = {};
    const regions = Object.keys(state.moreOrder || {});
    for(i = 0; i < regions.length; i++)moreOrder[regions[i]] = state.moreOrder[regions[i]].slice();
    return {
        order: order,
        kinds: kinds,
        hidden: hidden,
        intoMore: intoMore,
        moreOrder: moreOrder,
        savedAt: Date.now()
    };
}
function applyPreset(state, preset) {
    const order = {};
    let i;
    for(i = 0; i < SCOPES.length; i++){
        const scope = SCOPES[i].key;
        order[scope] = (preset.order[scope] || []).slice();
    }
    state.order = order;
    state.kinds = Object.assign({}, preset.kinds);
    state.hidden = Object.assign({}, preset.hidden);
    state.intoMore = Object.assign({}, preset.intoMore);
    const moreOrder = {};
    const regions = Object.keys(preset.moreOrder || {});
    for(i = 0; i < regions.length; i++)moreOrder[regions[i]] = preset.moreOrder[regions[i]].slice();
    state.moreOrder = moreOrder;
}

// src/core/launcher-geom.ts
function rowAtPoint(selector, x, y) {
    const stack = document.elementsFromPoint(x, y);
    if (stack.length > 0) {
        const top = stack[0];
        const drawer = top.closest('[data-shortcut-modal="sidebar"]');
        const blocked = top.closest('.lo-stash, .lo-pop, .lo-launcher, [role="menu"], [role="dialog"]:not([data-shortcut-modal="sidebar"]), [data-shortcut-modal]:not([data-shortcut-modal="sidebar"])');
        if (blocked && !(drawer && top.closest(selector))) return null;
    }
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
    if (best <= 0) best = LAUNCHER_TOP_FALLBACK;
    return Math.round(best) + LAUNCHER_EDGE;
}
function clampLauncherY(y, height) {
    const min = topInset();
    let max = window.innerHeight - height - LAUNCHER_EDGE;
    if (max < min) max = min;
    if (typeof y !== "number" || !isFinite(y)) y = min + LAUNCHER_FIRST_Y;
    return Math.max(min, Math.min(max, y));
}
function clampLauncherX(x, width) {
    let max = window.innerWidth - width - LAUNCHER_EDGE;
    if (max < LAUNCHER_EDGE) max = LAUNCHER_EDGE;
    if (typeof x !== "number" || !isFinite(x)) x = LAUNCHER_EDGE;
    return Math.max(LAUNCHER_EDGE, Math.min(max, x));
}

// src/core/dom-ledger.ts
function readEntries(ctx, scope) {
    const slot = SLOT_OF_SCOPE[scope];
    const out = [];
    if (!slot) return out;
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
        const registrant = options.registrant;
        out.push({
            id: String(id),
            label: hasLabel ? label : String(id),
            hasLabel: hasLabel,
            registrant: typeof registrant === "string" ? registrant : "",
            order: options.order || 0
        });
    }
    if (scope !== "tabs" && scope !== "composer") {
        out.sort(function(a, b) {
            return (a.order || 0) - (b.order || 0);
        });
    }
    return out;
}
function pairRows(entries, rows, stamped, scope) {
    const pairs = [];
    const used = [];
    for(let i = 0; i < entries.length; i++)pairs.push({
        id: entries[i].id,
        el: null
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
const __seenRows = {};
const __liveEls = {};
function setLiveRows(scope, rows) {
    const prefix = scope + ":";
    let key;
    for(key in __liveEls){
        if (key.indexOf(prefix) === 0) delete __liveEls[key];
    }
    __liveRows[scope] = rows;
    if (!rows) return;
    __seenRows[scope] = rows;
    for(let i = 0; i < rows.length; i++){
        const el = rows[i].el;
        if (el) __liveEls[prefix + rows[i].id] = el;
    }
}
function liveElement(scope, id) {
    const key = rowKey(scope, id);
    const cached = __liveEls[key];
    if (cached && cached.isConnected !== false) return cached;
    if (cached) delete __liveEls[key];
    return null;
}
function seenRows(scope) {
    const rows = __seenRows[scope];
    return rows === undefined ? null : rows;
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
function hookLabel(scope, id) {
    const hook = rowHookOf(scope, id);
    return hook && hook.label ? hook.label : "";
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
function isMenuTrigger(el) {
    if (el.matches("[aria-haspopup='menu']")) return true;
    return !!el.querySelector("[aria-haspopup='menu']");
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
            if (!slotOutlet && (isMenuTrigger(kid) || String(kid.className || "").indexOf("moreAnchor") >= 0)) {
                noteMoreAvailable("sidebar");
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
function tabMoreRow() {
    const list = document.querySelector("[data-conversation-tabs]");
    if (!list) return null;
    const holder = list.parentElement;
    if (!holder) return null;
    const kids = elementChildren(holder);
    for(let i = 0; i < kids.length; i++){
        if (kids[i] !== list && isMenuTrigger(kids[i])) return kids[i];
    }
    return null;
}
function collectTabUnits() {
    const rows = collectTabRows();
    const more = tabMoreRow();
    if (!rows && !more) return null;
    const units = [];
    for(let i = 0; rows && i < rows.length; i++)units.push({
        el: rows[i],
        id: null
    });
    if (more) units.push({
        el: more,
        id: MORE_ID,
        label: t("row.more")
    });
    return units.length > 0 ? units : null;
}

// src/core/dom-composer.ts
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

// src/core/dom-right.ts
const RIGHT_CARD_ATTR = "data-sidebar-right-guide-entry";
const RIGHT_CARD_SELECTOR = "[" + RIGHT_CARD_ATTR + "]";
function rightCardKind(wrapper) {
    const own = wrapper.getAttribute(RIGHT_CARD_ATTR);
    if (own) return own;
    const button = wrapper.querySelector(RIGHT_CARD_SELECTOR);
    if (!button) return null;
    const kind = button.getAttribute(RIGHT_CARD_ATTR);
    return kind ? kind : null;
}
function rightRowLabel(wrapper) {
    const title = wrapper.querySelector("[class*='entryTitle']");
    const text = title && title.textContent ? title.textContent : "";
    if (text) return text.replace(/\s+/g, " ").trim();
    return rowText(wrapper);
}
function rightIdOf(kind, nth) {
    return nth <= 1 ? kind : kind + "-" + nth;
}
function rightGuideEl() {
    const nodes = document.querySelectorAll(RIGHT_LIST_SELECTOR);
    for(let i = 0; i < nodes.length; i++){
        const node = nodes[i];
        if (node.closest("[hidden], [aria-hidden='true']")) continue;
        return node;
    }
    return null;
}
function collectRightUnits() {
    const list = rightGuideEl();
    if (!list) return null;
    const children = elementChildren(list);
    const units = [];
    for(let i = 0; i < children.length; i++){
        const child = children[i];
        const kind = rightCardKind(child);
        if (kind) {
            let nth = 1;
            while(units.some(function(unit) {
                return unit.id === rightIdOf(kind, nth);
            }))nth++;
            units.push({
                el: child,
                id: rightIdOf(kind, nth),
                label: rightRowLabel(child)
            });
            continue;
        }
        if (isMenuTrigger(child)) {
            if (units.some(function(unit) {
                return unit.id === "more";
            })) continue;
            units.push({
                el: child,
                id: MORE_ID,
                label: t("row.more")
            });
        }
    }
    return units.length > 0 ? units : null;
}
function collectRightRows() {
    return unitElements(collectRightUnits());
}
function collectRowUnits(scope) {
    if (scope === "composer") return collectComposerUnits();
    if (scope === "sidebar") return collectSidebarUnits();
    if (scope === "right") return collectRightUnits();
    if (scope === "tabs") return collectTabUnits();
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
    if (scope === "footer") return collectOutletRows("footer");
    if (scope === "tabs") return collectTabRows();
    if (scope === "composer") return collectComposerRows();
    if (scope === "right") return collectRightRows();
    if (scope === "settings") return collectSettingsRows();
    return null;
}

// src/core/dom-metrics.ts
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
const loRowIcons = {};
function liveRowIcon(scope, id) {
    const key = rowKey(scope, id);
    const node = liveElement(scope, id);
    if (node) {
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
    const key = rowKey(scope, id);
    if (!loRowIcons[key]) loRowIcons[key] = svg.outerHTML;
}
function liveOrder(scope, state) {
    const nodes = document.querySelectorAll("[" + MARKS.scope + '="' + scope + '"][' + MARKS.id + "]");
    const rows = [];
    for(let i = 0; i < nodes.length; i++){
        const node = nodes[i];
        const id = node.getAttribute(MARKS.id);
        if (!id) continue;
        if (state) {
            if (isHidden(state, scope, id) || isIntoMoreRow(state, scope, id)) continue;
            const order = parseInt(node.style.order, 10);
            if (isNaN(order)) continue;
            rows.push({
                id: id,
                order: order,
                at: i
            });
        } else {
            rows.push({
                id: id,
                order: parseInt(node.style.order, 10) || 0,
                at: i
            });
        }
    }
    rows.sort(function(a, b) {
        return a.order - b.order || a.at - b.at;
    });
    const out = [];
    for(let i = 0; i < rows.length; i++)if (out.indexOf(rows[i].id) < 0) out.push(rows[i].id);
    return out;
}
function visibleOrder(state, scope) {
    return liveOrder(scope, state);
}
function anchorUnsavedRow(state, scope, id) {
    const order = state.order[scope] || [];
    if (order.indexOf(id) >= 0) return;
    const nodes = document.querySelectorAll("[" + MARKS.scope + '="' + scope + '"][' + MARKS.id + "]");
    let at = -1;
    let i;
    for(i = 0; i < nodes.length; i++){
        if (nodes[i].getAttribute(MARKS.id) === id) {
            at = i;
            break;
        }
    }
    let to = -1;
    if (at >= 0) {
        for(i = at - 1; i >= 0 && to < 0; i--){
            const found = order.indexOf(nodes[i].getAttribute(MARKS.id) || "");
            if (found >= 0) to = found + 1;
        }
        for(i = at + 1; i < nodes.length && to < 0; i++){
            const found = order.indexOf(nodes[i].getAttribute(MARKS.id) || "");
            if (found >= 0) to = found;
        }
    }
    const next = order.slice();
    next.splice(to < 0 ? next.length : to, 0, id);
    writeOrder(state, scope, next);
}

// src/core/dom-label.ts
function rowText(el) {
    const label = el.getAttribute && el.getAttribute("aria-label");
    if (label) return label;
    let node = el.querySelector("[class*='navLabel']");
    if (node && node.textContent) return node.textContent;
    node = el.querySelector("[class*='panelTitle'], [class*='label']");
    if (node && node.textContent) return node.textContent;
    return el.textContent || "";
}
function rowDomLabel(el) {
    const text = rowText(el);
    const one = text ? text.replace(/\s+/g, " ").trim() : "";
    if (one && one.length <= 48) return one;
    const nodes = el.querySelectorAll("[aria-label], [title]");
    for(let i = 0; i < nodes.length; i++){
        const node = nodes[i];
        const attr = node.getAttribute("aria-label") || node.getAttribute("title") || "";
        const label = attr.replace(/\s+/g, " ").trim();
        if (label && label.length <= 48) return label;
    }
    return "";
}
function rightGuideEntries(ctx) {
    let tabs = null;
    try {
        tabs = ctx.get("sidebarRightTabs");
    } catch (err) {}
    if (!tabs) {
        try {
            tabs = ctx.get("sidebarRightTabs", false);
        } catch (err) {}
    }
    const registry = tabs;
    if (!registry || typeof registry.guide !== "function") return [];
    let entries = null;
    try {
        entries = registry.guide();
    } catch (err) {
        return [];
    }
    const list = entries;
    if (!list || typeof list.length !== "number") return [];
    for(let i = 0; i < list.length; i++){
        const entry = list[i];
        const kind = entry && typeof entry.kind === "string" ? entry.kind : "";
        const providerId = entry && typeof entry.providerId === "string" ? entry.providerId : "";
        if (kind && providerId) noteRightKindOfficial(kind, providerId);
    }
    if (list.length > 0) noteMoreAvailable(MORE_REGION_RIGHT);
    return list;
}
function rightTitleOf(entry) {
    try {
        const title = typeof entry.title === "function" ? entry.title() : entry.title;
        return typeof title === "string" ? title : "";
    } catch (err) {
        return "";
    }
}
let rightCardsCache = null;
function resetRightCards() {
    rightCardsCache = null;
}
function rightCardList(ctx) {
    if (rightCardsCache) return rightCardsCache;
    const list = rightGuideEntries(ctx);
    const out = [];
    const seen = {};
    let i;
    for(i = 0; i < list.length; i++){
        const entry = list[i];
        const kind = entry && typeof entry.kind === "string" ? entry.kind : "";
        if (!kind) continue;
        const count = (seen[kind] || 0) + 1;
        seen[kind] = count;
        out.push({
            id: rightIdOf(kind, count),
            label: rightTitleOf(entry)
        });
    }
    rightCardsCache = out;
    return out;
}
function firstLabel(id, picks) {
    let i;
    for(i = 0; i < picks.length; i++){
        let value = "";
        try {
            value = picks[i]() || "";
        } catch (err) {
            value = "";
        }
        value = String(value).replace(/\s+/g, " ").trim();
        if (value && value !== id) return value;
    }
    return "";
}
function rightTabLabel(ctx, id) {
    const cards = rightCardList(ctx);
    const kind = rightBaseKind(id);
    return firstLabel(id, [
        function() {
            let i;
            for(i = 0; i < cards.length; i++)if (cards[i].id === id) return cards[i].label;
            return "";
        },
        function() {
            let i;
            for(i = 0; i < cards.length; i++)if (cards[i].id === kind) return cards[i].label;
            return "";
        }
    ]);
}
function rowDisplayLabel(scope, id, fallback, ctx) {
    const found = firstLabel(id, [
        function() {
            return rowLabelOf(scope, id);
        },
        function() {
            return ctx && scope === "right" ? rightTabLabel(ctx, id) : "";
        },
        function() {
            return fallback || "";
        },
        function() {
            return liveRowLabel(scope, id);
        },
        function() {
            return hookLabel(scope, id);
        }
    ]);
    return found || id;
}
function rowLabelText(ctx, scope, id) {
    const entries = readEntries(ctx, scope);
    let entry = null;
    for(let i = 0; i < entries.length; i++)if (entries[i].id === id) entry = entries[i];
    return rowDisplayLabel(scope, id, entry && entry.hasLabel ? entry.label : null, ctx);
}

// src/core/dom-line.ts
const loDividerEls = {};
const loDividerGeom = {};
function setDisplay(node, value) {
    if (node.style.display !== value) node.style.display = value;
}
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
function styleOf(el) {
    if (typeof window.getComputedStyle !== "function") return null;
    return window.getComputedStyle(el);
}
function hiddenAway(el) {
    let node = el;
    while(node && node !== document.body){
        const style = styleOf(node);
        if (style && (style.display === "none" || style.visibility === "hidden")) return true;
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
        const style = styleOf(node);
        if (!style || style.display !== "none" && style.visibility !== "hidden") {
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
    const z = String(DIVIDER_SCOPES_ON_DIALOG.indexOf(scope) >= 0 ? Z_DIVIDER_DIALOG : Z_DIVIDER);
    if (node.style.zIndex !== z) node.style.zIndex = z;
    const nearRect = near.getBoundingClientRect();
    if (nearRect.width <= 0 || nearRect.height <= 0 || hiddenAway(near)) {
        setDisplay(node, "none");
        return;
    }
    const farRect = far ? far.getBoundingClientRect() : null;
    if (far && hiddenAway(far)) {
        setDisplay(node, "none");
        return;
    }
    const usableFar = farRect && farRect.width > 0 && farRect.height > 0 ? farRect : null;
    const found = containerBox(near);
    const union = unionBox(nearRect, usableFar || nearRect);
    const container = scope === "right" ? union : found || union;
    if (axis === "x") {
        const edge = usableFar ? (usableFar.right + nearRect.left) / 2 : nearRect.left - 1;
        placeBox(node, scope, Math.round(edge) + "px", Math.round(container.top) + "px", "1px", Math.round(container.height) + "px");
    } else {
        const edge = usableFar ? (usableFar.bottom + nearRect.top) / 2 : nearRect.top - 1;
        placeBox(node, scope, Math.round(container.left) + "px", Math.round(edge) + "px", Math.round(container.width) + "px", "1px");
    }
    setDisplay(node, "block");
}
function placeBox(node, scope, left, top, width, height) {
    const geom = left + "|" + top + "|" + width + "|" + height;
    if (loDividerGeom[scope] === geom) return;
    loDividerGeom[scope] = geom;
    node.style.left = left;
    node.style.top = top;
    node.style.width = width;
    node.style.height = height;
}
function hideDivider(scope) {
    const node = loDividerEls[scope];
    if (node && node.isConnected) setDisplay(node, "none");
}
function hideSurfaces() {
    for(const scope in loDividerEls)hideDivider(scope);
}
function removeSurfaces() {
    for(const scope in loDividerEls){
        const node = loDividerEls[scope];
        if (node && node.parentNode) node.parentNode.removeChild(node);
        delete loDividerEls[scope];
        delete loDividerGeom[scope];
    }
}

// src/core/dom-menu.ts
let loMenuEl = null;
let loMenuBound = false;
let closeHostMenu = null;
function bindHostMenuCloser(fn) {
    closeHostMenu = fn;
}
function closeHostMenuIfAny() {
    if (!closeHostMenu) return;
    try {
        closeHostMenu();
    } catch (err) {}
}
const MENU_POPUP_SELECTOR = "[role='menu'],[role='menuitem'],[role='menuitemcheckbox'],[role='menuitemradio']";
const POP_MARGIN = 8;
function placePop(menu, x, y) {
    if (!menu) return;
    const width = menu.offsetWidth || 144;
    const height = menu.offsetHeight || 60;
    const left = Math.min(x, window.innerWidth - width - POP_MARGIN);
    const top = Math.min(y, window.innerHeight - height - POP_MARGIN);
    menu.style.left = Math.max(POP_MARGIN, Math.round(left)) + "px";
    menu.style.top = Math.max(POP_MARGIN, Math.round(top)) + "px";
}
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
    closeHostMenuIfAny();
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
        if (action.disabled) {
            item.disabled = true;
            item.setAttribute("aria-disabled", "true");
        }
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
        if (action.shortcut) {
            const hint = document.createElement("span");
            hint.className = CLASS.popKey;
            hint.setAttribute("aria-hidden", "true");
            hint.textContent = action.shortcut;
            item.appendChild(hint);
        }
        item.onclick = function() {
            closeMenu();
            action.run();
        };
        wrap.appendChild(item);
        viewport.appendChild(wrap);
    }
    menu.appendChild(viewport);
    document.body.appendChild(menu);
    placePop(menu, event.clientX, event.clientY);
    loMenuEl = menu;
}
function insideMenu(target) {
    return !!(loMenuEl && target && target instanceof Node && loMenuEl.contains(target));
}
function onMenuPointerDown(event) {
    if (!loMenuEl) return;
    if (insideMenu(event.target)) return;
    if (event.button !== 0 && event.button !== 2) return;
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
    const inMoreScope = canTuckIntoMore(scope, id);
    const intoMore = inMoreScope && isIntoMore(state, scope, id);
    const entry = isMoreEntry(scope, id);
    const ids = liveOrder(scope);
    const groupIds = [];
    for(let i = 0; i < ids.length; i++){
        if (isMoreEntry(scope, ids[i])) continue;
        if (isIntoMoreRow(state, scope, ids[i])) continue;
        if ((group === "all" || groupOf(state, scope, ids[i]) === group) && !isHidden(state, scope, ids[i])) groupIds.push(ids[i]);
    }
    const at = groupIds.indexOf(id);
    const bound = group === "all" ? undefined : group;
    const horizontal = axis === "x";
    const actions = [
        {
            label: horizontal ? t("action.left") : t("action.up"),
            icon: horizontal ? MENU_ICON_LEFT : MENU_ICON_UP,
            disabled: entry || at <= 0,
            run: function() {
                store.update(function(next) {
                    moveRow(next, scope, id, -1, bound);
                });
            }
        },
        {
            label: horizontal ? t("action.right") : t("action.down"),
            icon: horizontal ? MENU_ICON_RIGHT : MENU_ICON_DOWN,
            disabled: entry || at < 0 || at >= groupIds.length - 1,
            run: function() {
                store.update(function(next) {
                    moveRow(next, scope, id, 1, bound);
                });
            }
        }
    ];
    actions.push.apply(actions, menuTailActions(store, scope, id, entry, inMoreScope, intoMore, hidden));
    return actions;
}
function menuTailActions(store, scope, id, entry, inMoreScope, intoMore, hidden) {
    return [
        kindToggleAction(store, scope, id, entry),
        {
            label: intoMore ? t("action.outOfMore") : t("action.intoMore"),
            icon: intoMore ? ACTION_ICON_OUT_OF_MORE : MENU_ICON_ARCHIVE,
            shortcut: gestureCombo(store.get().options.gestureMore, store.get().options.gestureMoreButton),
            disabled: !inMoreScope || entry,
            run: function() {
                if (!inMoreScope || entry) return;
                store.update(function(next) {
                    setIntoMore(next, scope, id, !intoMore);
                });
            }
        },
        {
            label: hidden ? t("action.restore") : t("action.stash"),
            icon: hidden ? MENU_ICON_UNARCHIVE : MENU_ICON_ARCHIVE,
            shortcut: hidden ? undefined : gestureCombo(store.get().options.gestureStash, store.get().options.gestureStashButton),
            disabled: false,
            run: function() {
                store.update(function(next) {
                    setHidden(next, scope, id, !hidden);
                });
            }
        }
    ];
}
function kindToggleAction(store, scope, id, disabled) {
    const official = kindOf(store.get(), scope, id) === "official";
    return {
        label: official ? t("kind.third") : t("kind.official"),
        icon: MENU_ICON_SWITCH,
        disabled: disabled,
        run: function() {
            store.update(function(next) {
                next.kinds[rowKey(scope, id)] = official ? "third" : "official";
            });
        }
    };
}
function attachMenuAt(event, store, scope, id, group) {
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
    if (target.closest(MENU_POPUP_SELECTOR)) return null;
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
function gestureTargetOf(target, x, y) {
    if (!target || !(target instanceof Element)) return null;
    if (target.closest("input, textarea, [contenteditable='true'], [contenteditable='']")) return null;
    let el = target.closest("[data-lo-more-key]");
    if (el) {
        const scope = el.getAttribute("data-lo-more-scope") || "";
        const id = el.getAttribute("data-lo-more-id") || "";
        if (scope && id) return {
            scope: scope,
            id: id
        };
    }
    el = target.closest("[data-lo-stash-scope]");
    if (el) {
        const scope = el.getAttribute("data-lo-stash-scope") || "";
        const id = el.getAttribute("data-lo-stash-id") || "";
        if (scope && id) return {
            scope: scope,
            id: id
        };
    }
    el = target.closest("[data-lo-list-id]");
    if (el) {
        const box = el.closest("[data-lo-list-scope]");
        const scope = box ? box.getAttribute("data-lo-list-scope") || "" : "";
        const id = el.getAttribute("data-lo-list-id") || "";
        if (scope && id) return {
            scope: scope,
            id: id
        };
    }
    el = target.closest(rowSelector());
    if (el) {
        const scope = el.getAttribute(MARKS.scope) || "";
        const id = el.getAttribute(MARKS.id) || "";
        if (scope && id) return {
            scope: scope,
            id: id
        };
    }
    if (typeof x !== "number" || typeof y !== "number") return null;
    const stack = document.elementsFromPoint(x, y);
    for(let i = 0; i < stack.length; i++){
        const hit = gestureTargetOf(stack[i]);
        if (hit) return hit;
    }
    return null;
}
function modifiersMatch(event, keys) {
    for(let i = 0; i < MODIFIER_KEYS.length; i++){
        const key = MODIFIER_KEYS[i];
        let down = event.metaKey === true;
        if (key === "control") down = event.ctrlKey === true;
        else if (key === "alt") down = event.altKey === true;
        else if (key === "shift") down = event.shiftKey === true;
        if (down !== keys.indexOf(key) >= 0) return false;
    }
    return true;
}
let loGesture = null;
let loGestureKind = "";
let loGestureX = 0;
let loGestureY = 0;
let loGestureGuardUntil = 0;
function gestureKindOf(event, button, state) {
    if (state.options.gestureStashButton === button && modifiersMatch(event, state.options.gestureStash)) return "stash";
    if (state.options.gestureMoreButton === button && modifiersMatch(event, state.options.gestureMore)) return "more";
    return "";
}
function runGesture(store, kind, scope, id) {
    store.update(function(next) {
        if (kind === "stash") toggleHidden(next, scope, id);
        else toggleIntoMore(next, scope, id);
    });
    clearFreshRow(scope, id);
}
function onWindowPointerDown(event) {
    loGesture = null;
    loGestureKind = "";
    const store = loMenuStore;
    if (!store || event.button !== 0) return;
    const kind = gestureKindOf(event, "left", store.get());
    if (!kind) return;
    const hit = gestureTargetOf(event.target, event.clientX, event.clientY);
    if (!hit) return;
    if (kind === "more" && !canTuckIntoMore(hit.scope, hit.id)) return;
    loGesture = hit;
    loGestureKind = kind;
    loGestureX = event.clientX;
    loGestureY = event.clientY;
}
function onWindowPointerCancel() {
    loGesture = null;
    loGestureKind = "";
}
function onWindowPointerUp(event) {
    const hit = loGesture;
    const kind = loGestureKind;
    loGesture = null;
    loGestureKind = "";
    const store = loMenuStore;
    if (!hit || !store || event.button !== 0) return;
    const state = store.get();
    const prefix = kind === "stash" ? state.options.gestureStash : state.options.gestureMore;
    if (!modifiersMatch(event, prefix)) return;
    if (kind === "more" && !canTuckIntoMore(hit.scope, hit.id)) return;
    if (Math.abs(event.clientX - loGestureX) > LO_DRAG_THRESHOLD || Math.abs(event.clientY - loGestureY) > LO_DRAG_THRESHOLD) return;
    event.preventDefault();
    loGestureGuardUntil = Date.now() + LO_CLICK_SUPPRESS_MS;
    runGesture(store, kind, hit.scope, hit.id);
}
function onWindowClickGuard(event) {
    if (Date.now() >= loGestureGuardUntil) return;
    loGestureGuardUntil = 0;
    event.preventDefault();
    event.stopPropagation();
}
function onWindowContextMenu(event) {
    const store = loMenuStore;
    if (!store) return;
    const kind = gestureKindOf(event, "right", store.get());
    if (kind) {
        const hit = gestureTargetOf(event.target, event.clientX, event.clientY);
        if (!hit) return;
        if (kind === "more" && !canTuckIntoMore(hit.scope, hit.id)) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        runGesture(store, kind, hit.scope, hit.id);
        return;
    }
    const row = managedRowFrom(event.target, event.clientX, event.clientY);
    if (!row) return;
    const scope = row.getAttribute(MARKS.scope);
    const id = row.getAttribute(MARKS.id);
    if (!scope || !id) return;
    event.preventDefault();
    event.stopPropagation();
    const axis = containerAxis(row, scope);
    const state = store.get();
    const group = mixedOrder(state) ? "all" : groupOf(state, scope, id);
    openMenu(event, menuActionsFor(store, scope, id, group, axis));
}
let loMenuStore = null;
let loRowMenuBound = false;
let loRowMenuOff = null;
function bindWindowCapture(handlers) {
    const types = Object.keys(handlers);
    let i;
    for(i = 0; i < types.length; i++)window.addEventListener(types[i], handlers[types[i]], true);
    return function() {
        for(let j = 0; j < types.length; j++)window.removeEventListener(types[j], handlers[types[j]], true);
    };
}
function installRowMenu(store) {
    loMenuStore = store;
    installMenuBindings();
    if (loRowMenuBound) return;
    loRowMenuBound = true;
    loRowMenuOff = bindWindowCapture({
        contextmenu: onWindowContextMenu,
        pointerdown: onWindowPointerDown,
        pointerup: onWindowPointerUp,
        pointercancel: onWindowPointerCancel,
        click: onWindowClickGuard
    });
}
function uninstallRowMenu() {
    if (loRowMenuOff) {
        loRowMenuOff();
        loRowMenuOff = null;
    }
    loRowMenuBound = false;
    loMenuStore = null;
    uninstallMenuBindings();
}

// src/core/dom-project.ts
const ICON_SVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\" width=\"16\" height=\"16\" fill=\"currentColor\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M853.333333 96H170.666667C130.133333 96 96 130.133333 96 170.666667v682.666666c0 40.533333 34.133333 74.666667 74.666667 74.666667h682.666666c40.533333 0 74.666667-34.133333 74.666667-74.666667V170.666667c0-40.533333-34.133333-74.666667-74.666667-74.666667z m-682.666666 64h682.666666c6.4 0 10.666667 4.266667 10.666667 10.666667v213.333333h-704V170.666667c0-6.4 4.266667-10.666667 10.666667-10.666667zM160 853.333333V448H341.333333v416H170.666667c-6.4 0-10.666667-4.266667-10.666667-10.666667z m693.333333 10.666667H405.333333V448h458.666667v405.333333c0 6.4-4.266667 10.666667-10.666667 10.666667z\" fill=\"currentColor\" p-id=\"11231\"></path></svg>";
function applySelfIcon(el) {
    const holder = el.querySelector("[class*='navIcon']");
    if (!holder) return;
    if (holder.getAttribute("data-lo-icon") === "1" && holder.querySelector("svg")) return;
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
function setMark(el, name, value) {
    if (value === null) {
        if (el.hasAttribute(name)) el.removeAttribute(name);
        return;
    }
    if (el.getAttribute(name) !== value) el.setAttribute(name, value);
}
function setOrder(el, value) {
    if (el.style.order !== value) el.style.order = value;
}
function isSynthetic(scope, id) {
    const list = SYNTHETIC_IDS[scope];
    return !!list && list.indexOf(id) >= 0;
}
function isMoreEntry(scope, id) {
    return id === MORE_ID && (scope === "sidebar" || scope === "tabs" || scope === "right");
}
function moreAnchorOpen(rows) {
    for(let i = 0; i < rows.length; i++){
        const el = rows[i];
        if (el.getAttribute(MARKS.id) !== MORE_ID) continue;
        if (el.getAttribute("aria-expanded") === "true") return true;
        if (el.querySelector("[aria-expanded='true']")) return true;
    }
    return false;
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
function rowFallbackLabel(scope, entry, id, el) {
    if (rowHookOf(scope, id)) return "";
    return firstLabel(id, [
        function() {
            return rowDomLabel(el);
        },
        function() {
            return entry && entry.registrant ? entry.registrant : "";
        }
    ]);
}
function applyScope(ctx, store, scope) {
    const state = store.get();
    if (scope === "right") rightGuideEntries(ctx);
    const entries = readEntries(ctx, scope);
    const units = collectRowUnits(scope);
    if (!units) {
        hideDivider(scope);
        setLiveRows(scope, null);
        return;
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
    dropStaleOrder(state, scope, ids);
    const ordered = reconcileOrder(state, scope, ids);
    const byId = {};
    for(let i = 0; i < entries.length; i++)byId[entries[i].id] = entries[i];
    const slotRows = [];
    for(let i = 0; i < units.length; i++){
        if (syntheticIds[i]) continue;
        slotRows.push(units[i].el);
    }
    const entryList = [];
    for(let i = 0; i < ordered.length; i++){
        const id = ordered[i];
        if (isSynthetic(scope, id)) continue;
        const entry = byId[id];
        entryList.push({
            id: id,
            label: entry ? entry.label : id,
            hasLabel: entry ? entry.hasLabel : false
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
    for(let i = ordered.length - 1; i >= 0; i--){
        if (!isMoreEntry(scope, ordered[i])) continue;
        const pinnedId = ordered.splice(i, 1)[0];
        ordered.push(pinnedId);
    }
    const claimed = [];
    const visible = {
        official: [],
        third: []
    };
    const live = [];
    let index = 0;
    const canDragOfficial = state.options.allowDragOfficial === true;
    const unitLabels = {};
    const unitById = {};
    for(let i = 0; i < units.length; i++){
        const unitLabel = units[i].label;
        const unitId = units[i].id;
        if (!unitId) continue;
        unitById[unitId] = units[i].el;
        if (unitLabel && !unitLabels[unitId]) unitLabels[unitId] = unitLabel;
    }
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
            el = unitById[id] || null;
            if (!el) {
                for(let j = 0; j < extraUnits.length; j++){
                    if (extraUnits[j].id === id) {
                        el = extraUnits[j].el;
                        break;
                    }
                }
            }
            if (!el) {
                const pair = pairs[pairAt++];
                el = pair && pair.el ? pair.el : null;
            }
        }
        if (!el) continue;
        claimed.push(el);
        const kind = kindOf(state, scope, id);
        const group = kind === "official" ? "official" : "third";
        const pinned = isMoreEntry(scope, id);
        const entry = byId[id];
        let fallback = entry && entry.hasLabel ? entry.label : unitLabels[id] || "";
        if (!(entry && entry.hasLabel) && !fallback) fallback = rowFallbackLabel(scope, entry, id, el);
        live.push({
            id: id,
            label: rowDisplayLabel(scope, id, fallback),
            el: el
        });
        setMark(el, MARKS.row, "1");
        setMark(el, MARKS.scope, scope);
        setMark(el, MARKS.id, id);
        setMark(el, MARKS.kind, kind);
        setMark(el, MARKS.dragging, null);
        setMark(el, MARKS.over, null);
        setMark(el, MARKS.overActive, null);
        rememberRowIcon(scope, id, el);
        if (!pinned && (group === "third" || canDragOfficial)) setMark(el, MARKS.drag, "1");
        else setMark(el, MARKS.drag, null);
        if (isHidden(state, scope, id)) {
            setMark(el, MARKS.hidden, "1");
            setOrder(el, "");
            continue;
        }
        if (isIntoMoreRow(state, scope, id)) {
            setMark(el, MARKS.hidden, "1");
            setOrder(el, "");
            continue;
        }
        setMark(el, MARKS.hidden, null);
        if (scope === "settings" && id === SELF_ID) applySelfIcon(el);
        setOrder(el, String(index++));
        if (!pinned) visible[group].push({
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
        if (claimed.indexOf(rows[i]) < 0) setOrder(rows[i], String(1000 + tail++));
    }
    let interleaved = false;
    if (dividerEnabled(state, scope) && mixedOrder(state)) {
        const sequence = liveOrder(scope);
        let seenThird = false;
        for(let i = 0; i < sequence.length; i++){
            if (isHidden(state, scope, sequence[i])) continue;
            if (isIntoMoreRow(state, scope, sequence[i])) continue;
            if (isMoreEntry(scope, sequence[i])) continue;
            if (kindOf(state, scope, sequence[i]) === "third") seenThird = true;
            else if (seenThird) interleaved = true;
        }
    }
    if (scope === "sidebar" && dividerEnabled(state, scope) && moreAnchorOpen(rows)) return;
    if (dividerEnabled(state, scope) && !interleaved && visible.official.length > 0 && visible.third.length > 0) {
        const firstThird = visible.third[0].el;
        const lastOfficial = visible.official[visible.official.length - 1].el;
        showDivider(scope, firstThird, lastOfficial, containerAxis(firstThird, scope));
    } else {
        hideDivider(scope);
    }
}
function clearScope(scope) {
    const rows = document.querySelectorAll("[" + MARKS.scope + '="' + scope + '"][' + MARKS.row + "]");
    for(let i = 0; i < rows.length; i++)clearMarks(rows[i]);
    hideDivider(scope);
    setLiveRows(scope, null);
}

// src/core/dom-right-nav.ts
let loActiveStore = null;
let loActiveCtx = null;
let lastRightError = "";
let loNavEpoch = 0;
let loViewOpener = null;
const RIGHT_NAV_TRIES = 20;
const RIGHT_NAV_GAP_MS = 80;
const RIGHT_ADD_TAB_SELECTOR = "[data-dockkit-add-tab]";
function setActiveStore(store) {
    if (!store) loNavEpoch++;
    loActiveStore = store;
}
function setActiveContext(ctx) {
    if (!ctx) loNavEpoch++;
    loActiveCtx = ctx;
}
function setViewOpener(opener) {
    loViewOpener = opener;
}
function rightService() {
    if (!loActiveCtx) return null;
    const passes = [
        true,
        false
    ];
    for(let i = 0; i < passes.length; i++){
        try {
            const service = loActiveCtx.get("sidebarRight", passes[i]);
            if (service && typeof service.openTab === "function") return service;
        } catch (err) {}
    }
    return null;
}
function rightKindOf(scope, id) {
    const el = liveRowEl(scope, id);
    if (el) {
        const kind = rightCardKind(el);
        if (kind) return kind;
    }
    const stripped = rightBaseKind(id);
    return stripped || null;
}
function rightCardEl(scope, id) {
    const el = liveRowEl(scope, id);
    if (!el) return null;
    if (!rightCardKind(el)) return null;
    return el;
}
function openRightCard(scope, id) {
    const el = rightCardEl(scope, id);
    if (!el) return false;
    clickRevealed(el);
    return true;
}
function openRightCardByService(scope, id) {
    const service = rightService();
    if (!service) {
        lastRightError = "no sidebarRight service";
        return false;
    }
    const kind = rightKindOf(scope, id);
    if (!kind) {
        lastRightError = "no tab kind";
        return false;
    }
    try {
        service.openTab(kind, {
            replaceTab: true
        });
        lastRightError = "";
        return true;
    } catch (err) {
        lastRightError = err instanceof Error ? err.message : String(err);
        return false;
    }
}
function visibleHostEl(selector) {
    const nodes = document.querySelectorAll(selector);
    for(let i = 0; i < nodes.length; i++){
        const node = nodes[i];
        if (!node.closest("[hidden], [aria-hidden='true']")) return node;
    }
    return null;
}
function revealRightBar(ctx) {
    if (visibleHostEl("[data-sidebar-right-open]")) return false;
    const expand = visibleHostEl("button[data-sidebar-right-expand]");
    if (expand) {
        expand.click();
        return true;
    }
    try {
        const layout = ctx.get("layout");
        if (layout && typeof layout.openRightbar === "function") {
            layout.openRightbar(false, false);
            return true;
        }
    } catch (err) {}
    return false;
}
function revealRightGuide() {
    if (rightGuideEl()) return false;
    const add = visibleHostEl(RIGHT_ADD_TAB_SELECTOR);
    if (!add) return false;
    clickRevealed(add);
    return true;
}
function openRightPage(ctx, scope, id) {
    const epoch = loNavEpoch;
    const attempt = function(tries) {
        if (epoch !== loNavEpoch) return;
        if (openRightCard(scope, id)) return;
        if (openRightCardByService(scope, id)) return;
        if (tries === 0) revealRightBar(ctx);
        else if (tries % 4 === 1) revealRightGuide();
        if (tries >= RIGHT_NAV_TRIES) {
            const reason = lastRightError ? " (" + lastRightError + ")" : "";
            warn("navigate:" + id + " " + t("nav.failed").replace("{label}", id) + reason);
            return;
        }
        window.setTimeout(function() {
            attempt(tries + 1);
        }, RIGHT_NAV_GAP_MS);
    };
    attempt(0);
}

// src/core/dom-settings-nav.ts
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
    if (!close) {
        const labelled = panel.querySelectorAll("button[aria-label]");
        for(let i = 0; i < labelled.length; i++){
            const text = labelled[i].getAttribute("aria-label") || "";
            if (text.indexOf("lose") >= 0 || text.indexOf("关闭") >= 0 || text.indexOf("關閉") >= 0) {
                close = labelled[i];
                break;
            }
        }
    }
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
    const epoch = loNavEpoch;
    let tries = 0;
    const attempt = function() {
        if (epoch !== loNavEpoch) return;
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

// src/core/dom-navigate.ts
function liveRowEl(scope, id) {
    const cached = liveElement(scope, id);
    if (cached) return cached;
    const stamped = document.querySelectorAll("[" + MARKS.scope + '="' + scope + '"][' + MARKS.id + "]");
    for(let i = 0; i < stamped.length; i++){
        if (stamped[i].getAttribute(MARKS.id) === id) return stamped[i];
    }
    return null;
}
function rightBarReachable() {
    if (rightService()) return true;
    if (document.querySelector("[data-sidebar-right-open], button[data-sidebar-right-expand]")) return true;
    if (!loActiveCtx) return false;
    try {
        const layout = loActiveCtx.get("layout");
        return !!layout && typeof layout.openRightbar === "function";
    } catch (err) {
        return false;
    }
}
function rowClickable(el) {
    return isInteractive(el) || clickTargetOf(el) !== el;
}
function rowNavigable(scope, id) {
    if (scope === "settings") return true;
    if (scope === "right" && !isMoreEntry(scope, id) && (rightCardEl(scope, id) || rightBarReachable())) return true;
    if (!liveRowIds(scope)) return viewSelectable(scope, id);
    const el = liveRowEl(scope, id);
    if (!el) return viewSelectable(scope, id);
    return rowClickable(el);
}
function viewSelectable(scope, id) {
    if (scope !== "tabs" || !loViewOpener || !loActiveCtx) return false;
    const entries = readEntries(loActiveCtx, scope);
    for(let i = 0; i < entries.length; i++){
        if (entries[i].id === id) return true;
    }
    return false;
}
function navigateFromSettings(ctx, scope, id) {
    navigateTo(ctx, scope, id);
    if (scope === "settings") return;
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
    if (scope === "right" && !isMoreEntry(scope, id)) {
        openRightPage(ctx, scope, id);
        return;
    }
    const stampedEl = liveRowEl(scope, id);
    if (stampedEl) {
        clickRevealed(stampedEl);
        return;
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
            hasLabel: false
        });
    }
    const pairs = pairRows(list, rows, undefined, scope);
    for(let i = 0; i < pairs.length; i++){
        if (pairs[i].id === id && pairs[i].el) {
            clickRevealed(pairs[i].el);
            return;
        }
    }
    if (scope === "tabs" && loViewOpener) {
        try {
            loViewOpener(id);
        } catch (err) {}
    }
}

// src/core/stash-prune.ts
const PRUNE_GRACE_MS = 3000;
const __goneSince = {};
function pruneKnownIds(ctx, scope) {
    if (scope === "right") {
        const cards = rightCardList(ctx);
        if (cards.length === 0) return null;
        const out = [];
        for(let i = 0; i < cards.length; i++)out.push(cards[i].id);
        return out;
    }
    const list = readEntries(ctx, scope);
    if (list.length === 0) return null;
    const out = [];
    for(let i = 0; i < list.length; i++)out.push(list[i].id);
    return out;
}
function pruneStash(ctx, store) {
    const state = store.get();
    if (state.options.pruneStash === false) return 0;
    const entries = stashEntries(state);
    if (entries.length === 0) return 0;
    const known = {};
    const now = Date.now();
    const dead = [];
    for(let i = 0; i < entries.length; i++){
        const item = entries[i];
        if (!(item.scope in known)) known[item.scope] = pruneKnownIds(ctx, item.scope);
        const ids = known[item.scope];
        if (!ids) {
            delete __goneSince[item.key];
            continue;
        }
        if (ids.indexOf(item.id) >= 0) {
            delete __goneSince[item.key];
            continue;
        }
        const since = __goneSince[item.key];
        if (since === undefined) {
            __goneSince[item.key] = now;
            continue;
        }
        if (now - since >= PRUNE_GRACE_MS) dead.push(item.key);
    }
    if (dead.length === 0) return 0;
    for(let i = 0; i < dead.length; i++)delete __goneSince[dead[i]];
    store.update(function(next) {
        for(let i = 0; i < dead.length; i++)delete next.hidden[dead[i]];
    }, {
        history: false
    });
    return dead.length;
}

// src/core/fresh-rows.ts
function noteNewRows(ctx, store) {
    const state = store.get();
    const seed = Object.keys(state.known || {}).length === 0;
    const batch = [];
    let i;
    for(i = 0; i < SCOPES.length; i++){
        const scope = SCOPES[i].key;
        let ids = null;
        try {
            ids = pruneKnownIds(ctx, scope);
        } catch (err) {
            ids = null;
        }
        if (!ids || ids.length === 0) continue;
        if (!hasUnknownRows(state, scope, ids)) continue;
        batch.push({
            scope: scope,
            ids: ids
        });
    }
    if (batch.length === 0) return;
    store.update(function(next) {
        for(let j = 0; j < batch.length; j++)noteKnownRows(next, batch[j].scope, batch[j].ids, seed);
    }, {
        history: false
    });
}

// src/core/organizer.ts
function createOrganizer(ctx, store, report) {
    let disposed = false;
    let muted = false;
    let dirty = false;
    let frame = 0;
    let settle = 0;
    let observer = null;
    let unsubscribe = null;
    const disposers = [];
    function applyAll() {
        if (disposed) return;
        if (dragActive()) return;
        resetRightCards();
        for(let i = 0; i < SCOPES.length; i++){
            const scope = SCOPES[i].key;
            try {
                applyScope(ctx, store, scope);
            } catch (err) {
                report("apply:" + scope, err);
            }
        }
        notifyRevision();
        try {
            pruneStash(ctx, store);
        } catch (err) {
            report("prune", err);
        }
        try {
            noteNewRows(ctx, store);
        } catch (err) {
            report("fresh", err);
        }
        muted = true;
        if (settle) window.clearTimeout(settle);
        settle = window.setTimeout(function() {
            settle = 0;
            if (disposed) return;
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
    function ownMutations(batch) {
        if (batch.length === 0) return false;
        let i;
        for(i = 0; i < batch.length; i++){
            const target = batch[i].target;
            if (!target || target.nodeType !== 1 || typeof target.closest !== "function") return false;
            if (!target.closest(".lo-pop, .lo-stash, .lo-launcher, .lo-page, .lo-row, .lo-more-row, [data-plugin='" + PLUGIN_ID + "']")) return false;
        }
        return true;
    }
    function onMutations(batch) {
        if (muted) {
            dirty = true;
            return;
        }
        if (ownMutations(batch)) return;
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
            if (!scope.slot) continue;
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
        if (settle) {
            window.clearTimeout(settle);
            settle = 0;
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
        stop: stop
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
const DROP_MARK = "data-lo-stash-over";
function createDropSlot(mark) {
    let el = null;
    return {
        hit: function() {
            return el;
        },
        sync: function(next) {
            if (next === el) return;
            if (el) el.removeAttribute(mark);
            el = next;
            if (next) next.setAttribute(mark, "1");
        },
        clear: function() {
            if (el) el.removeAttribute(mark);
            el = null;
        }
    };
}
function stashDropAt(x, y) {
    return firstDropAt(".lo-launcher", x, y);
}
function firstDropAt(selector, x, y) {
    const nodes = document.querySelectorAll(selector);
    for(let i = 0; i < nodes.length; i++){
        const hit = rectDropAt(nodes[i], x, y);
        if (hit) return hit;
    }
    return null;
}
function rectDropAt(el, x, y) {
    if (!el || !rectHit(el, x, y)) return null;
    if (typeof document.elementFromPoint !== "function") return el;
    const top = document.elementFromPoint(x, y);
    if (top && (top === el || el.contains(top))) return el;
    return null;
}
function rectHit(el, x, y) {
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}
function outsideRect(rect, x, y, margin) {
    if (!rect) return false;
    return x < rect.left - margin || x > rect.right + margin || y < rect.top - margin || y > rect.bottom + margin;
}
function belowDragThreshold(x, y, startX, startY) {
    return Math.abs(x - startX) < LO_DRAG_THRESHOLD && Math.abs(y - startY) < LO_DRAG_THRESHOLD;
}
function swallowClick(event, until) {
    if (Date.now() >= until) return false;
    event.preventDefault();
    event.stopPropagation();
    return true;
}
function firstRectHit(nodes, x, y, accept) {
    for(let i = 0; i < nodes.length; i++){
        const el = nodes[i];
        if (accept && !accept(el)) continue;
        if (rectHit(el, x, y)) return el;
    }
    return null;
}
function commitStashOrMore(store, scope, id, moreHit, stashHit) {
    if (!scope || !id) return false;
    if (stashHit) {
        store.update(function(state) {
            setHidden(state, scope, id, true);
        });
        return true;
    }
    if (moreHit) {
        store.update(function(state) {
            setIntoMore(state, scope, id, true);
        });
        return true;
    }
    return false;
}
function pluginPageAt(x, y) {
    return firstDropAt(".lo-page", x, y);
}
function outsidePluginPage(x, y, margin) {
    const nodes = document.querySelectorAll(".lo-page");
    let seen = false;
    for(let i = 0; i < nodes.length; i++){
        const rect = nodes[i].getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;
        seen = true;
        if (!outsideRect(rect, x, y, margin)) return false;
    }
    return seen;
}
function createPointerDrag(spec) {
    let pending = null;
    let drag = null;
    let active = false;
    let suppressClickUntil = 0;
    let detachEvents = null;
    function onDown(event) {
        if (event.button !== 0) return;
        const picked = spec.pick(event.target, event);
        if (picked === null) return;
        pending = {
            picked: picked,
            x: event.clientX,
            y: event.clientY
        };
    }
    function onMove(event) {
        if (!active) {
            if (!pending) return;
            if (belowDragThreshold(event.clientX, event.clientY, pending.x, pending.y)) return;
            const picked = pending.picked;
            pending = null;
            drag = picked;
            active = true;
            spec.begin(picked, event);
            event.preventDefault();
            return;
        }
        if (drag === null) return;
        event.preventDefault();
        spec.move(drag, event);
    }
    function onUp(event) {
        if (!active || drag === null) {
            pending = null;
            spec.end(null);
            return;
        }
        const picked = drag;
        suppressClickUntil = Date.now() + LO_CLICK_SUPPRESS_MS;
        active = false;
        drag = null;
        spec.drop(picked, event);
        spec.end(picked);
    }
    function onCancel() {
        const picked = drag;
        pending = null;
        active = false;
        drag = null;
        if (spec.cancel) spec.cancel(picked);
        else spec.end(picked);
    }
    function onClickCapture(event) {
        if (swallowClick(event, suppressClickUntil)) suppressClickUntil = 0;
    }
    function onScroll() {
        if (active && spec.scroll) spec.scroll();
    }
    return {
        attach: function() {
            if (detachEvents) return;
            detachEvents = bindDragEvents({
                down: onDown,
                move: onMove,
                up: onUp,
                cancel: onCancel,
                click: onClickCapture,
                scroll: spec.scroll ? onScroll : function() {},
                resize: spec.resize === true
            });
        },
        detach: function() {
            if (!detachEvents) return;
            detachEvents();
            detachEvents = null;
            spec.end(drag);
            drag = null;
            pending = null;
            active = false;
        }
    };
}

// src/drag/drag-rows.ts
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
function rectsOf(rows, axis, idAttr) {
    const attr = idAttr || MARKS.id;
    const out = [];
    for(let i = 0; i < rows.length; i++){
        const rect = rows[i].getBoundingClientRect();
        const id = rows[i].getAttribute(attr) || "";
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
function insertionIndex(rects, pointer, dragged) {
    let index = 0;
    for(let i = 0; i < rects.length; i++){
        if (rects[i].id === dragged) continue;
        if (pointer > rects[i].mid) index++;
    }
    return index;
}
function createDragController(store) {
    let scope = "";
    let id = "";
    let group = "";
    let axis = "y";
    let sequence = [];
    let draggedEl = null;
    let lastPointer = 0;
    let lastX = 0;
    let lastY = 0;
    const moreSlot = createDropSlot(MARKS.over);
    const stashSlot = createDropSlot(DROP_MARK);
    const throttle = createFrameThrottle(function(pointer) {
        if (draggedEl) applyAt(pointer);
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
        const out = [];
        const mixed = mixedOrder(store.get());
        for(let i = 0; i < all.length; i++){
            if (isMoreEntry(scope, all[i].getAttribute(MARKS.id) || "")) continue;
            if (mixed || group === "all" || groupOfEl(all[i]) === group) out.push(all[i]);
        }
        return out;
    }
    function moreEntryScope() {
        const region = moreRegionOf(scope);
        if (region === "conversation") return "tabs";
        if (region === "rightbar") return "right";
        return "sidebar";
    }
    function pinnedRowAt(x, y) {
        if (MORE_SCOPES.indexOf(scope) < 0) return null;
        const entry = moreEntryScope();
        const selector = "[" + MARKS.scope + '="' + entry + '"][' + MARKS.row + "][" + MARKS.id + '="' + MORE_ID + '"]';
        return firstRectHit(document.querySelectorAll(selector), x, y, function(el) {
            return !el.hasAttribute(MARKS.hidden);
        });
    }
    function snapshotGroup() {
        const rects = rectsOf(groupRows(), axis);
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
    function startDrag(event, row) {
        setDragActive(true);
        scope = row.getAttribute(MARKS.scope) || "";
        id = row.getAttribute(MARKS.id) || "";
        group = groupOfEl(row);
        draggedEl = row;
        axis = containerAxis(row, scope);
        lastX = event.clientX;
        lastY = event.clientY;
        moreSlot.clear();
        stashSlot.clear();
        row.setAttribute(MARKS.dragging, "1");
        snapshotGroup();
        document.body.style.cursor = "grabbing";
        event.preventDefault();
    }
    function update(event) {
        if (!draggedEl) return;
        lastX = event.clientX;
        lastY = event.clientY;
        lastPointer = axis === "x" ? event.clientX : event.clientY;
        throttle.schedule(lastPointer);
    }
    function flushUpdate() {
        throttle.flush();
    }
    function applyAt(pointer) {
        if (!draggedEl) return;
        const stashHit = stashDropAt(lastX, lastY) || (scope === "settings" ? pluginPageAt(lastX, lastY) : null);
        stashSlot.sync(stashHit);
        if (stashHit) {
            moreSlot.clear();
            return;
        }
        moreSlot.sync(pinnedRowAt(lastX, lastY));
        if (moreSlot.hit()) return;
        const live = measureRects();
        const at = insertionIndex(live, pointer, id);
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
        const dropIntoMore = moreSlot.hit() !== null;
        const dropStash = stashSlot.hit() !== null;
        cleanup();
        if (commitStashOrMore(store, finalScope, draggedId, dropIntoMore, dropStash)) return;
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
        store.update(function(state) {
            writeOrder(state, finalScope, next);
        });
    }
    function cleanup() {
        throttle.drop();
        if (draggedEl) {
            draggedEl.removeAttribute(MARKS.dragging);
            draggedEl.removeAttribute(MARKS.over);
        }
        moreSlot.clear();
        stashSlot.clear();
        document.body.style.cursor = "";
        setDragActive(false);
        draggedEl = null;
        sequence = [];
    }
    function pickRow(target, event) {
        return rowFrom(target, event.clientX, event.clientY);
    }
    function begin(picked, event) {
        startDrag(event, picked);
    }
    function move(picked, event) {
        update(event);
    }
    function drop(picked, event) {
        lastX = event.clientX;
        lastY = event.clientY;
        lastPointer = axis === "x" ? event.clientX : event.clientY;
        throttle.drop();
        applyAt(lastPointer);
        finish();
    }
    function cancel(picked) {
        cleanup();
        if (picked) store.update(function() {});
    }
    function refreshRects() {
        if (draggedEl) applyAt(lastPointer);
    }
    function onScroll() {
        if (draggedEl) refreshRects();
    }
    return createPointerDrag({
        pick: pickRow,
        begin: begin,
        move: move,
        drop: drop,
        end: cleanup,
        cancel: cancel,
        scroll: onScroll,
        resize: true
    });
}

// src/drag/drag-list.ts
function createListDragController(store) {
    let rects = [];
    let sequence = [];
    let draggedEl = null;
    let containerEl = null;
    let group = "";
    let id = "";
    let touched = [];
    let clearFrame = null;
    let insertAt = 0;
    let lastPointer = 0;
    let lastX = 0;
    let lastY = 0;
    const moreSlot = createDropSlot(MARKS.over);
    const stashSlot = createDropSlot(DROP_MARK);
    let outOfPage = false;
    const throttle = createFrameThrottle(function(pointer) {
        if (draggedEl) applyAt(pointer);
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
        rects = rectsOf(groupRows(containerEl, group), "y", "data-lo-list-id");
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
        if (clearFrame !== null) cancelAnimationFrame(clearFrame);
        clearFrame = requestAnimationFrame(function() {
            clearFrame = null;
            if (draggedEl) return;
            for(let i = 0; i < nodes.length; i++)nodes[i].style.order = "";
        });
    }
    function clearPreviewNow() {
        if (clearFrame !== null) {
            cancelAnimationFrame(clearFrame);
            clearFrame = null;
        }
        for(let i = 0; i < touched.length; i++)touched[i].style.order = "";
        touched = [];
    }
    function startDrag(row, container) {
        clearPreviewNow();
        draggedEl = row;
        containerEl = container;
        id = row.getAttribute("data-lo-list-id") || "";
        group = row.getAttribute("data-lo-list-group") || "";
        moreSlot.clear();
        stashSlot.clear();
        if (draggedEl) draggedEl.classList.remove("lo-list-out");
        outOfPage = false;
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
        lastX = event.clientX;
        lastY = event.clientY;
        lastPointer = event.clientY;
        throttle.schedule(lastPointer);
    }
    function moreRowAt(x, y) {
        if (!containerEl) return null;
        const nodes = containerEl.querySelectorAll(":scope > .lo-row[data-lo-list-id='" + MORE_ID + "']");
        return firstRectHit(nodes, x, y);
    }
    function applyAt(pointer) {
        if (!draggedEl) return;
        const stashHit = stashDropAt(lastX, lastY);
        stashSlot.sync(stashHit);
        const out = !stashHit && outsidePluginPage(lastX, lastY, OUT_MARGIN);
        if (out !== outOfPage) {
            outOfPage = out;
            draggedEl.classList.toggle("lo-list-out", out);
        }
        if (stashHit || out) {
            moreSlot.clear();
            return;
        }
        moreSlot.sync(moreRowAt(lastX, lastY));
        if (moreSlot.hit()) return;
        insertAt = insertionIndex(rects, pointer, id);
        const without = rects.filter(function(rect) {
            return rect.id !== id;
        });
        const next = [];
        for(let i = 0; i < without.length; i++)next.push(without[i].el);
        next.splice(insertAt, 0, draggedEl);
        sequence = next;
        previewOrder(draggedEl.parentElement || containerEl, group, next);
    }
    function cleanup() {
        throttle.drop();
        if (draggedEl) {
            draggedEl.removeAttribute("data-lo-dragging");
            draggedEl.classList.remove("lo-list-out");
        }
        moreSlot.clear();
        stashSlot.clear();
        outOfPage = false;
        document.documentElement.style.cursor = "";
        setDragActive(false);
        draggedEl = null;
        containerEl = null;
        rects = [];
        sequence = [];
    }
    function pickRow(target) {
        if (target instanceof Element && target.closest(".lo-btn")) return null;
        const row = rowFrom(target);
        if (!row) return null;
        const container = row.parentElement;
        if (!container || !container.getAttribute("data-lo-list-scope")) return null;
        return {
            row: row,
            container: container
        };
    }
    function begin(picked) {
        startDrag(picked.row, picked.container);
    }
    function move(picked, event) {
        update(event);
    }
    function drop(picked, event) {
        if (!draggedEl || !containerEl) {
            cleanup();
            return;
        }
        lastX = event.clientX;
        lastY = event.clientY;
        lastPointer = event.clientY;
        throttle.drop();
        applyAt(lastPointer);
        const finalSequence = sequence.slice();
        const finalScope = containerEl.getAttribute("data-lo-list-scope") || "";
        const rows = rowsOf(containerEl);
        const allIds = [];
        for(let i = 0; i < rows.length; i++)allIds.push(rows[i].getAttribute("data-lo-list-id") || "");
        const ids = finalSequence.map(function(node) {
            return node.getAttribute("data-lo-list-id") || "";
        });
        const dropIntoMore = moreSlot.hit() !== null;
        const dropStash = stashSlot.hit() !== null;
        const dropRestore = outOfPage && !dropStash;
        const draggedId = id;
        cleanup();
        scheduleClearPreview();
        if (dropRestore) {
            if (draggedId) {
                store.update(function(state) {
                    setHidden(state, finalScope, draggedId, false);
                    setIntoMore(state, finalScope, draggedId, false);
                });
            }
            return;
        }
        if (commitStashOrMore(store, finalScope, draggedId, dropIntoMore, dropStash)) return;
        if (ids.length === 0) return;
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
    function cancel() {
        const nodes = touched;
        touched = [];
        for(let i = 0; i < nodes.length; i++)nodes[i].style.order = "";
        cleanup();
    }
    function onScroll() {
        if (draggedEl) refreshRects();
    }
    return createPointerDrag({
        pick: pickRow,
        begin: begin,
        move: move,
        drop: drop,
        end: cleanup,
        cancel: cancel,
        scroll: onScroll,
        resize: false
    });
}

// src/drag/drag-stash.ts
function createStashDragController(store) {
    let rowEl = null;
    let outside = false;
    function rowFrom(target) {
        if (!target || !(target instanceof Element)) return null;
        if (target.closest(".lo-btn")) return null;
        const row = target.closest(".lo-stash-row");
        if (!row) return null;
        if (!row.closest(".lo-stash")) return null;
        return {
            row: row,
            scope: row.getAttribute("data-lo-stash-scope") || "",
            id: row.getAttribute("data-lo-stash-id") || ""
        };
    }
    function panelRect() {
        const panel = document.querySelector(".lo-stash");
        if (!panel || typeof panel.getBoundingClientRect !== "function") return null;
        const rect = panel.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 ? rect : null;
    }
    function begin(picked) {
        rowEl = picked.row;
        rowEl.setAttribute("data-lo-dragging", "1");
        document.documentElement.style.cursor = "grabbing";
        setDragActive(true);
    }
    function move(picked, event) {
        if (!rowEl) return;
        event.stopPropagation();
        const out = outsideRect(panelRect(), event.clientX, event.clientY, OUT_MARGIN);
        if (out !== outside) {
            outside = out;
            rowEl.classList.toggle("lo-stash-out", out);
        }
    }
    function drop(picked, event) {
        const restore = outsideRect(panelRect(), event.clientX, event.clientY, OUT_MARGIN);
        if (!restore || !picked.scope || !picked.id) return;
        store.update(function(state) {
            setHidden(state, picked.scope, picked.id, false);
        });
    }
    function end() {
        if (rowEl) {
            rowEl.removeAttribute("data-lo-dragging");
            rowEl.classList.remove("lo-stash-out");
        }
        document.documentElement.style.cursor = "";
        setDragActive(false);
        rowEl = null;
        outside = false;
    }
    return createPointerDrag({
        pick: function(target) {
            return rowFrom(target);
        },
        begin: begin,
        move: move,
        drop: drop,
        end: end
    });
}

// src/ui/styles.ts
const CSS_TEXT = [
    "[data-lo-row='1']{position:relative}",
    "[data-lo-draggable='1']{cursor:grab;-webkit-user-select:none;user-select:none;transition:opacity .14s ease,box-shadow .12s ease,transform .14s ease}",
    "[data-lo-draggable='1']:active{cursor:grabbing}",
    "[data-lo-dragging='1']{cursor:grabbing;opacity:.45}",
    "[data-lo-over='1']{box-shadow:0 0 0 2px var(--dsw-alias-brand-primary,#4d6bfe) inset;border-radius:var(--dsw-radius-md,12px)}",
    "[data-lo-hidden='1']{display:none !important}",
    ".lo-row[data-hidden='1']>*{opacity:.5}",
    ".lo-row[data-hidden='1']>[data-lit='1']{opacity:1}",
    "div[data-sidebar-right-guide]::after{order:2147483600}",
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
    ".lo-pop-key{flex:none;margin-left:14px;color:var(--dsw-alias-label-tertiary,#6b7280);font-size:11px;line-height:16px;letter-spacing:.2px;white-space:nowrap}",
    ".lo-launcher{position:fixed;z-index:" + Z_LAUNCHER + ";display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 11px;border:0;border-radius:999px;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-inverted,#fff);font:inherit;font-size:12px;font-weight:600;box-shadow:0 6px 20px rgba(0,0,0,.28);cursor:grab;touch-action:none;-webkit-user-select:none;user-select:none;transition:box-shadow .14s ease,opacity .14s ease}",
    ".lo-launcher:hover{box-shadow:0 10px 26px rgba(0,0,0,.34)}",
    ".lo-launcher[data-lo-stash-over='1']{outline:2px dashed currentColor;outline-offset:3px;box-shadow:0 10px 26px rgba(0,0,0,.34)}",
    ".lo-page[data-lo-stash-over='1']{outline:2px dashed currentColor;outline-offset:-8px;border-radius:10px}",
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
    ".lo-chip[disabled]{opacity:.45;cursor:not-allowed}",
    ".lo-chip[disabled]:hover{border-color:var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary)}",
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
    ".lo-stash-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;touch-action:pan-y;user-select:none}",
    ".lo-stash-row.lo-stash-out{opacity:.45;outline:2px dashed var(--dsw-alias-brand-primary,#4d6bfe);outline-offset:-2px}",
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
    ".lo-titleacts{flex:0 0 auto;display:flex;min-width:0;max-width:100%}",
    ".lo-acts-row{display:flex;gap:8px;flex-wrap:nowrap;min-width:0;max-width:100%;overflow-x:auto;overflow-y:hidden;scrollbar-width:thin}",
    ".lo-acts-row::-webkit-scrollbar{height:6px}",
    ".lo-acts-row::-webkit-scrollbar-thumb{border-radius:3px;background:var(--dsw-alias-interactive-bg-hover,rgba(38,49,72,.16))}",
    ".lo-title-note{flex:0 1 auto;min-width:0;max-width:min(34ch,42vw);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:1.4;color:var(--dsw-alias-state-success-primary,#2f9e44)}",
    ".lo-title-note[data-tone='error']{color:var(--dsw-alias-state-error-primary,#ec1313)}",
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
    ".lo-ico[data-ico='undo']>svg{transform:scale(1)}",
    ".lo-ico[data-ico='redo']>svg{transform:scale(1)}",
    ".lo-card{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);overflow:hidden}",
    ".lo-card-head{padding:11px 14px;border-bottom:1px solid var(--dsw-alias-border-l1);font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary)}",
    ".lo-card-head{display:flex;align-items:center;gap:12px;-webkit-user-select:none;user-select:none}",
    ".lo-card[data-collapsible='1']>.lo-card-head{cursor:pointer}",
    ".lo-card[data-collapsible='1']>.lo-card-head:hover .lo-card-title{color:var(--dsw-alias-brand-primary)}",
    ".lo-card-title{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".lo-card-note{margin-left:8px;font-size:11.5px;font-weight:400;color:var(--dsw-alias-label-secondary)}",
    ".lo-card-caret{flex:0 0 auto;display:inline-block;width:10px;font-size:10px;line-height:1;color:var(--dsw-alias-label-secondary);transition:transform .12s ease}",
    ".lo-card[data-open='0'] .lo-card-caret{transform:rotate(-90deg)}",
    ".lo-card-action{flex:0 0 auto;display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:8px;row-gap:6px}",
    ".lo-bulk{display:inline-flex;align-items:center}",
    ".lo-bulk-trigger{gap:5px}",
    ".lo-bulk-caret{font-size:9px;line-height:1;opacity:.65}",
    ".lo-bulk-pop{width:max-content;min-width:0;max-width:min(320px,calc(100vw - 16px));max-height:calc(100vh - 16px);overflow:auto}",
    ".lo-bulk-list{gap:2px;padding:2px}",
    ".lo-bulk-group{display:flex;flex-direction:column;gap:1px;padding:2px 0}",
    ".lo-bulk-group + .lo-bulk-group{border-top:1px solid var(--dsw-alias-border-l1,#0000000a);margin-top:2px;padding-top:4px}",
    ".lo-bulk-group-title{padding:3px 8px;color:var(--dsw-alias-label-secondary,#6b7280);font-size:11px;line-height:16px}",
    ".lo-card-action .lo-btn{min-height:24px;padding:0 9px;font-size:11.5px;font-weight:400;border-radius:7px}",
    ".lo-card-body{display:flex;flex-direction:column}",
    ".lo-card-headtext{flex:1 1 auto;display:flex;flex-direction:column;gap:4px;min-width:0}",
    ".lo-card-note{font-size:11.5px;font-weight:400;line-height:1.5;color:var(--dsw-alias-label-secondary)}",
    ".lo-card-headtext>.lo-card-note{margin-left:0;font-size:12px}",
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
    ".lo-row.lo-list-out{outline:2px dashed var(--dsw-alias-brand-primary,#4d6bfe);outline-offset:-2px}",
    ".lo-row[data-lo-dragging='1']{cursor:grabbing}",
    ".lo-grip{flex:0 0 auto;width:14px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:1;letter-spacing:-1px;cursor:grab}",
    ".lo-grip[data-locked='1']{visibility:hidden;cursor:default}",
    ".lo-row-open{flex:1 1 0;min-width:0;overflow:hidden;display:flex;align-items:center;gap:8px;padding:0;border:0;border-radius:7px;background:transparent;font:inherit;text-align:left;cursor:pointer}",
    ".lo-row-open:hover .lo-row-name{color:var(--dsw-alias-brand-primary)}",
    ".lo-row-open:disabled{cursor:default}",
    ".lo-row-open:disabled:hover .lo-row-name{color:var(--dsw-alias-label-primary)}",
    ".lo-row-name{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;color:var(--dsw-alias-label-primary)}",
    ".lo-row-id{flex:0 0 auto;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--dsw-alias-label-secondary)}",
    ".lo-row-name[data-fresh='1']{color:var(--dsw-alias-state-error-primary,#e03131);font-weight:600}",
    ".lo-preset-save{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:0 14px}",
    ".lo-input{flex:1 1 160px;min-width:0;height:30px;padding:0 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-base);font:inherit;font-size:12px;color:var(--dsw-alias-label-primary)}",
    ".lo-input:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#4d6bfe);outline-offset:-1px}",
    ".lo-preset-note{padding:6px 14px 0;font-size:12px;line-height:1.6;color:var(--dsw-alias-label-secondary)}",
    ".lo-preset-list{display:flex;flex-direction:column;gap:4px;padding:8px 14px 12px}",
    ".lo-preset-row{display:flex;align-items:center;gap:8px;min-height:30px}",
    ".lo-preset-name{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;color:var(--dsw-alias-label-primary)}",
    ".lo-preset-row-base .lo-preset-name{color:var(--dsw-alias-label-secondary);font-weight:600}",
    ".lo-row-ico{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;overflow:hidden;border-radius:4px;color:var(--dsw-alias-label-secondary)}",
    ".lo-row-ico>svg{width:16px;height:16px}",
    ".lo-row-ico-text{background:var(--dsw-alias-interactive-bg-hover,#2631480f);font-size:10px;font-weight:600}",
    ".lo-note{padding:8px 14px;font-size:12px;line-height:1.6;color:var(--dsw-alias-label-secondary)}",
    ".lo-keyrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap;width:100%}",
    ".lo-keyrow-end{margin-left:auto}",
    ".lo-keys{display:inline-flex;align-items:center;justify-content:center;gap:4px;min-height:30px;min-width:120px;padding:0 12px;border:1px dashed var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-base);font-size:12px;color:var(--dsw-alias-label-primary);cursor:pointer;transition:border-color .12s ease,color .12s ease}",
    ".lo-keys:hover{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}",
    "input.lo-keys{font-family:inherit;font-size:12px;line-height:1;text-align:center;outline:none;cursor:text}",
    ".lo-keys[data-recording='1']{border-style:solid;border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}",
    ".lo-keys[data-empty='1']{color:var(--dsw-alias-label-secondary)}",
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
    ".lo-more-out{opacity:.45;outline:2px dashed var(--dsw-alias-brand-primary,#4d6bfe);outline-offset:-2px}",
    ".lo-more-text{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".lo-more-divider{height:1px;margin:4px 6px;background:var(--dsw-alias-border-l1)}",
    ".lo-launcher-ico{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px}",
    "@keyframes lo-fade{from{opacity:0}to{opacity:1}}",
    "@keyframes lo-rise{from{opacity:0;transform:translate(-50%,-46%)}to{opacity:1;transform:translate(-50%,-50%)}}"
];
function installStyles() {
    const selector = 'style[data-plugin="' + PLUGIN_ID + '"]';
    const css = CSS_TEXT.join("\n");
    const existing = document.querySelector(selector);
    if (existing) {
        if (existing.textContent !== css) existing.textContent = css;
        return;
    }
    const node = document.createElement("style");
    node.setAttribute("data-plugin", PLUGIN_ID);
    node.textContent = css;
    document.head.appendChild(node);
}
function removeStyles() {
    const nodes = document.querySelectorAll('style[data-plugin="' + PLUGIN_ID + '"]');
    for(let i = 0; i < nodes.length; i++){
        const node = nodes[i];
        if (node.parentNode) node.parentNode.removeChild(node);
    }
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
            warn("render failed; this panel stays empty: " + errText(err));
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

// src/ui/kit-controls.ts
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
            if (event && event.target && event.target.closest && event.target.closest(".lo-card-action")) return;
            if (event && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                toggle();
            }
        } : undefined
    }, props.title || props.note ? h("span", {
        className: "lo-card-headtext"
    }, props.title ? h("span", {
        className: "lo-card-title"
    }, props.title) : null, props.note ? h("span", {
        className: "lo-card-note"
    }, props.note) : null) : null, props.action ? h("span", {
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
        disabled: props.disabled === true,
        onClick: props.disabled === true ? undefined : props.onClick,
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
function IntoMoreButton(props) {
    const enabled = typeof props.onToggle === "function";
    if (!enabled && !moreAvailable()) return null;
    return h(Btn, {
        act: "more",
        lit: props.intoMore,
        variant: props.intoMore ? "soft" : undefined,
        disabled: !enabled,
        onClick: props.onToggle,
        title: !enabled ? t("action.intoMoreBlocked") : props.intoMore ? t("action.outOfMore") : t("action.intoMore")
    }, props.intoMore ? t("action.outOfMore") : t("action.intoMore"));
}

// src/ui/kit-rows.ts
function useStoreTick(store) {
    return useTicker([
        store
    ], function(bump) {
        return store.subscribe(bump);
    });
}
function useSlotsTick(ctx) {
    return useTicker([
        ctx
    ], function(bump) {
        const disposers = [];
        let i;
        for(i = 0; i < SCOPE_KEYS.length; i++){
            const slotKey = SLOT_OF_SCOPE[SCOPE_KEYS[i]];
            if (!slotKey) continue;
            try {
                disposers.push(ctx.slots.subscribe(slotKey, function() {
                    bump();
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
    });
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
        "data-locked": props.draggable ? undefined : "1",
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
        title: entry.label,
        "data-fresh": props.fresh ? "1" : undefined
    }, entry.label), h("span", {
        className: "lo-row-id"
    }, entry.id)), h(Btn, {
        act: "kind",
        onClick: props.onToggleKind,
        disabled: props.kindLocked === true,
        title: props.kindLocked ? t("action.kindBlocked") : t("action.toggleKind")
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
    }, "\u2193"), h(IntoMoreButton, {
        intoMore: props.intoMore === true,
        onToggle: props.onToggleMore
    }), h(Btn, {
        act: "stash",
        lit: props.hidden,
        variant: props.hidden ? "soft" : undefined,
        onClick: props.onToggleHidden,
        title: props.hidden ? t("action.restore") : t("action.stash")
    }, props.hidden ? t("action.restore") : t("action.stash")));
}

// src/ui/scope-actions.ts
function groupIds(scope, rows, state, group) {
    const ids = [];
    for(let i = 0; i < rows.length; i++){
        const id = rows[i].id;
        if (isMoreEntry(scope, id)) continue;
        if (group === "all" || kindOf(state, scope, id) === group) ids.push(id);
    }
    return ids;
}
function groupedOrder(state, scope, rows) {
    const official = [];
    const third = [];
    const pinned = [];
    for(let i = 0; i < rows.length; i++){
        const id = rows[i].id;
        if (isMoreEntry(scope, id)) pinned.push(id);
        else if (kindOf(state, scope, id) === "official") official.push(id);
        else third.push(id);
    }
    return official.concat(third, pinned);
}
function sameIds(a, b) {
    if (a.length !== b.length) return false;
    for(let i = 0; i < a.length; i++)if (a[i] !== b[i]) return false;
    return true;
}
function ScopeActionsMenu(props) {
    const scope = props.scope;
    const rows = props.rows || [];
    const openPair = useState(false);
    const open = openPair[0];
    const setOpen = openPair[1];
    const atPair = useState({
        left: 8,
        top: 8
    });
    const at = atPair[0];
    const setAt = atPair[1];
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    useEffect(function() {
        if (!open) return undefined;
        function outside(event) {
            const target = event.target;
            if (menuRef.current && menuRef.current.contains(target)) return;
            if (triggerRef.current && triggerRef.current.contains(target)) return;
            setOpen(false);
        }
        function onKey(event) {
            if (event.key === "Escape") setOpen(false);
        }
        function shut() {
            setOpen(false);
        }
        document.addEventListener("pointerdown", outside, true);
        document.addEventListener("keydown", onKey, true);
        document.addEventListener("scroll", shut, true);
        window.addEventListener("resize", shut);
        return function() {
            document.removeEventListener("pointerdown", outside, true);
            document.removeEventListener("keydown", onKey, true);
            document.removeEventListener("scroll", shut, true);
            window.removeEventListener("resize", shut);
        };
    }, [
        open
    ]);
    useEffect(function() {
        if (!open) return undefined;
        placePop(menuRef.current, at.left, at.top);
        return undefined;
    }, [
        open,
        at.left,
        at.top
    ]);
    const groups = [];
    const defs = [
        {
            key: "official",
            label: t("action.groupOfficial")
        },
        {
            key: "third",
            label: t("action.groupThird")
        },
        {
            key: "all",
            label: t("action.groupAll")
        }
    ];
    for(let g = 0; g < defs.length; g++){
        const hideIds = groupIds(scope, rows, props.state, defs[g].key);
        const moreIds = [];
        for(let i = 0; i < hideIds.length; i++){
            if (canTuckIntoMore(scope, hideIds[i])) moreIds.push(hideIds[i]);
        }
        let hiddenCount = 0;
        let intoCount = 0;
        for(let i = 0; i < hideIds.length; i++)if (isHidden(props.state, scope, hideIds[i])) hiddenCount++;
        for(let i = 0; i < moreIds.length; i++)if (isIntoMore(props.state, scope, moreIds[i])) intoCount++;
        groups.push({
            key: defs[g].key,
            label: defs[g].label,
            hideIds: hideIds,
            moreIds: moreIds,
            allHidden: hideIds.length > 0 && hiddenCount === hideIds.length,
            allMore: moreIds.length > 0 && intoCount === moreIds.length
        });
    }
    const hasMoreScope = moreScopeOk(scope);
    function toggle(event) {
        if (open) {
            setOpen(false);
            return;
        }
        const el = triggerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        setAt({
            left: rect.left,
            top: rect.bottom + 6
        });
        setOpen(true);
    }
    function applyHide(group) {
        if (group.hideIds.length === 0) return;
        const hide = !group.allHidden;
        props.store.update(function(next) {
            for(let i = 0; i < group.hideIds.length; i++)setHidden(next, scope, group.hideIds[i], hide);
        });
        setOpen(false);
    }
    function applyMore(group) {
        if (group.moreIds.length === 0) return;
        const into = !group.allMore;
        props.store.update(function(next) {
            for(let i = 0; i < group.moreIds.length; i++)setIntoMore(next, scope, group.moreIds[i], into);
        });
        setOpen(false);
    }
    const trigger = h("button", {
        type: "button",
        ref: triggerRef,
        className: "lo-btn lo-bulk-trigger",
        "aria-haspopup": "menu",
        "aria-expanded": open ? "true" : "false",
        title: t("action.bulkHint"),
        onClick: toggle
    }, t("action.bulk"), h("span", {
        className: "lo-bulk-caret",
        "aria-hidden": "true"
    }, "\u25be"));
    if (!open) return h("span", {
        className: "lo-bulk"
    }, trigger);
    const blocks = [];
    for(let g = 0; g < groups.length; g++){
        const group = groups[g];
        blocks.push(h("div", {
            className: "lo-bulk-group",
            key: "g" + group.key
        }, h("div", {
            className: "lo-bulk-group-title"
        }, group.label), h("button", {
            type: "button",
            className: CLASS.popItem,
            role: "menuitem",
            disabled: group.hideIds.length === 0,
            title: group.hideIds.length === 0 ? t("action.bulkHideEmpty") : group.allHidden ? t("action.bulkHideOutHint") : t("action.bulkHideHint"),
            onClick: function() {
                applyHide(group);
            }
        }, h("span", {
            className: CLASS.popText
        }, group.allHidden ? t("action.bulkHideOut") : t("action.bulkHide"))), h("button", {
            type: "button",
            className: CLASS.popItem,
            role: "menuitem",
            disabled: group.moreIds.length === 0,
            title: !hasMoreScope ? t("action.bulkMoreBlocked") : group.moreIds.length === 0 ? t("action.bulkMoreEmpty") : group.allMore ? t("action.bulkMoreOutHint") : t("action.bulkMoreHint"),
            onClick: function() {
                applyMore(group);
            }
        }, h("span", {
            className: CLASS.popText
        }, group.allMore ? t("action.bulkMoreOut") : t("action.bulkMore")))));
    }
    const menu = h("div", {
        ref: menuRef,
        className: CLASS.pop + " lo-bulk-pop",
        role: "menu",
        style: {
            left: at.left + "px",
            top: at.top + "px"
        },
        onClick: function(event) {
            if (event && event.stopPropagation) event.stopPropagation();
        }
    }, h("div", {
        className: CLASS.popMaterial,
        "aria-hidden": "true"
    }), h("div", {
        className: CLASS.popViewport + " lo-bulk-list"
    }, blocks));
    const portal = ReactDOM && typeof ReactDOM.createPortal === "function" ? ReactDOM.createPortal(menu, document.body) : menu;
    return h("span", {
        className: "lo-bulk"
    }, trigger, portal);
}
function ScopeSortButton(props) {
    const rows = props.rows || [];
    const next = groupedOrder(props.state, props.scope, rows);
    const current = [];
    for(let i = 0; i < rows.length; i++)current.push(rows[i].id);
    const done = sameIds(current, next);
    return h(ConfirmBtn, {
        label: t("action.sort"),
        confirmLabel: t("action.sortConfirm"),
        title: done ? t("action.sortDone") : t("action.sortHint"),
        disabled: done,
        onConfirm: function() {
            props.store.update(function(state) {
                writeOrder(state, props.scope, next);
            });
        }
    });
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
            const target = event && event.target ? event.target : null;
            props.onChange(target && target.value ? String(target.value) : "");
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
    let cleaned = false;
    function cleanup() {
        if (cleaned) return;
        cleaned = true;
        window.removeEventListener("focus", cleanup);
        if (input.parentNode) input.parentNode.removeChild(input);
    }
    input.addEventListener("change", function() {
        const file = input.files && input.files[0];
        cleanup();
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
    window.addEventListener("focus", cleanup);
    document.body.appendChild(input);
    input.click();
}

// src/ui/scope-card.ts
function markRowSeen(scope, id) {
    clearFreshRow(scope, id);
}
function scopeEntries(ctx, state, scope) {
    const entries = readEntries(ctx, scope);
    const byId = Object.create(null);
    let i;
    for(i = 0; i < entries.length; i++){
        byId[entries[i].id] = {
            id: entries[i].id,
            label: entries[i].label,
            order: entries[i].order || 0,
            hasLabel: entries[i].hasLabel
        };
    }
    const synthetic = syntheticIdsOf(scope);
    const registry = scope === "right" ? rightCardList(ctx) : [];
    const registered = Object.create(null);
    for(i = 0; i < registry.length; i++)registered[registry[i].id] = registry[i].label;
    const live = liveRowIds(scope);
    const seen = live === null && scope !== "right" ? seenRows(scope) : null;
    const ids = [];
    if (seen) {
        for(i = 0; i < seen.length; i++)ids.push(seen[i].id);
    } else {
        for(i = 0; i < entries.length; i++)ids.push(entries[i].id);
        for(i = 0; i < synthetic.length; i++)if (ids.indexOf(synthetic[i]) < 0) ids.push(synthetic[i]);
        for(i = 0; i < registry.length; i++)if (ids.indexOf(registry[i].id) < 0) ids.push(registry[i].id);
    }
    if (scope === "right" && registered[MORE_ID] === undefined) {
        registered[MORE_ID] = rowLabelOf(scope, MORE_ID) || t("row.more");
        if (ids.indexOf(MORE_ID) < 0) ids.push(MORE_ID);
    }
    const order = reconcileOrder(state, scope, ids);
    const seenLabel = Object.create(null);
    if (seen) for(i = 0; i < seen.length; i++)seenLabel[seen[i].id] = seen[i].label;
    const listed = [];
    if (seen) {
        for(i = 0; i < order.length; i++)if (seenLabel[order[i]] !== undefined) listed.push(order[i]);
    } else {
        for(i = 0; i < order.length; i++){
            const id = order[i];
            if (!byId[id] && synthetic.indexOf(id) < 0 && registered[id] === undefined) continue;
            if (registered[id] === undefined && !listedInScope(live, id)) continue;
            listed.push(id);
        }
        for(i = 0; i < entries.length; i++){
            const id = entries[i].id;
            if (listed.indexOf(id) >= 0) continue;
            if (!listedInScope(live, id)) continue;
            listed.push(id);
        }
    }
    for(i = listed.length - 1; i >= 0; i--){
        if (!isMoreEntry(scope, listed[i])) continue;
        const pinnedId = listed.splice(i, 1)[0];
        listed.push(pinnedId);
    }
    const out = [];
    for(i = 0; i < listed.length; i++){
        const id = listed[i];
        const entry = byId[id];
        const named = rowLabelOf(scope, id);
        if (!entry) {
            out.push({
                id: id,
                label: named || registered[id] || seenLabel[id] || liveRowLabel(scope, id) || hookLabel(scope, id) || id,
                order: 0,
                hasLabel: true
            });
            continue;
        }
        const shown = named || (entry.hasLabel ? entry.label : seenLabel[id] || liveRowLabel(scope, id) || hookLabel(scope, id));
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
    const pinnedId = entries.length > 0 && isMoreEntry(scope, entries[entries.length - 1].id) ? entries[entries.length - 1].id : "";
    const pinnedGroup = pinnedId ? groupOf(state, scope, pinnedId) : "";
    let pinnedShown = false;
    for(i = 0; i < shown.length; i++)if (pinnedId && shown[i].id === pinnedId) pinnedShown = true;
    for(i = 0; i < shown.length; i++){
        const entry = shown[i];
        const id = entry.id;
        const kind = kindOf(state, scope, id);
        const group = kind === "official" ? "official" : "third";
        const listGroup = mixed ? "all" : group;
        const hidden = isHidden(state, scope, id);
        const canOpen = rowNavigable(scope, id);
        const openTitle = canOpen ? t("action.goto") : t("action.static");
        const index = mixed ? entries.indexOf(entry) : groupIndex[group]++;
        const total = (mixed ? entries.length : groupTotal[group]) - ((mixed || group === pinnedGroup) && pinnedShown ? 1 : 0);
        rows.push(h(RowItem, {
            key: rowKey(scope, id),
            entry: entry,
            scope: scope,
            kind: kind,
            group: listGroup,
            hidden: hidden,
            fresh: isFreshRow(scope, id),
            draggable: !isMoreEntry(scope, id),
            kindLocked: isMoreEntry(scope, id),
            canUp: !isMoreEntry(scope, id) && index > 0,
            canDown: !isMoreEntry(scope, id) && index < total - 1,
            canOpen: canOpen,
            openTitle: openTitle,
            onOpen: function() {
                navigateFromSettings(ctx, scope, id);
            },
            onToggleKind: function() {
                store.update(function(next) {
                    next.kinds[rowKey(scope, id)] = kind === "official" ? "third" : "official";
                });
                markRowSeen(scope, id);
            },
            onUp: function() {
                store.update(function(next) {
                    moveRow(next, scope, id, -1, listGroup === "all" ? undefined : listGroup);
                });
                markRowSeen(scope, id);
            },
            onDown: function() {
                store.update(function(next) {
                    moveRow(next, scope, id, 1, listGroup === "all" ? undefined : listGroup);
                });
                markRowSeen(scope, id);
            },
            onToggleHidden: function() {
                store.update(function(next) {
                    setHidden(next, scope, id, !hidden);
                });
                markRowSeen(scope, id);
            },
            intoMore: canTuckIntoMore(scope, id) && isIntoMore(state, scope, id),
            onToggleMore: canTuckIntoMore(scope, id) ? function() {
                const into = isIntoMore(store.get(), scope, id);
                store.update(function(next) {
                    setIntoMore(next, scope, id, !into);
                });
                markRowSeen(scope, id);
            } : undefined,
            onMenu: function(event) {
                markRowSeen(scope, id);
                attachMenuAt(event, store, scope, id, listGroup);
            }
        }));
    }
    return h(Card, {
        title: title,
        collapsed: !cardOpen,
        onToggleCollapse: function() {
            store.update(function(next) {
                setCollapsed(next, cardKey, cardOpen);
            });
        },
        action: h(React.Fragment, null, h(ScopeActionsMenu, {
            scope: scope,
            state: state,
            store: store,
            rows: entries
        }), h(ScopeSortButton, {
            scope: scope,
            state: state,
            store: store,
            rows: entries
        }), h(ConfirmBtn, {
            label: t("action.reset"),
            confirmLabel: t("action.confirmResetGroup"),
            disabled: !scopeDirty(state, scope),
            onConfirm: function() {
                store.update(function(next) {
                    resetScope(next, scope);
                });
            }
        }))
    }, mounted || rows.length > 0 ? null : h("div", {
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
let loRecordGuard = null;
function setShortcutRecordGuard(guard) {
    loRecordGuard = guard;
}
function guardRecording(active, fail) {
    if (!loRecordGuard) return;
    try {
        const pending = loRecordGuard(active);
        if (pending && typeof pending.catch === "function") {
            pending.catch(function(err) {
                if (fail) fail(err);
            });
        }
    } catch (err) {
        if (fail) fail(err);
    }
}
function keyCapText(keys) {
    const parts = [];
    let i;
    for(i = 0; i < keys.length; i++){
        const bits = String(keys[i]).split("+");
        let j;
        for(j = 0; j < bits.length; j++){
            const bit = bits[j].trim();
            if (bit) parts.push(bit);
        }
    }
    return parts.join(" + ");
}
function GestureField(props) {
    const pendingPair = useState(null);
    const pending = pendingPair[0];
    const setPending = pendingPair[1];
    const recPair = useState(false);
    const recording = recPair[0];
    const setRecording = recPair[1];
    const committed = useRef(false);
    const current = pending || props.keys;
    const msgPair = useState(null);
    const msg = msgPair[0];
    const setMsg = msgPair[1];
    function taken(candidate) {
        return gestureText(props.keys) === gestureText(props.otherKeys) && props.otherButton === candidate;
    }
    function onKeyDown(event) {
        if (event.key === "Tab") return;
        event.preventDefault();
        event.stopPropagation();
        const target = event.target;
        if (event.key === "Escape") {
            setPending(null);
            target.blur();
            return;
        }
        if (event.key === "Enter") {
            commit();
            target.blur();
            return;
        }
        if ([
            "Control",
            "Alt",
            "Shift",
            "Meta"
        ].indexOf(event.key) < 0) return;
        setPending(modifierKeysOf(event));
    }
    function commit() {
        if (committed.current) return;
        committed.current = true;
        const next = pending;
        setPending(null);
        if (!next) return;
        if (next.length === 0) {
            setMsg({
                tone: "error",
                text: t("gesture.prefixEmpty")
            });
            return;
        }
        if (gestureText(next) === gestureText(props.keys)) {
            setMsg(null);
            return;
        }
        props.onSave(next, props.button);
        setMsg({
            tone: "ok",
            text: t("gesture.saved")
        });
    }
    function pickButton(next) {
        if (taken(next)) return;
        props.onSave(null, next);
        setMsg({
            tone: "ok",
            text: t("gesture.saved")
        });
    }
    const atDefault = gestureText(props.keys) === gestureText(DEFAULT_GESTURE_KEYS) && props.button === props.defaultButton;
    function reset() {
        committed.current = true;
        setPending(null);
        props.onSave(DEFAULT_GESTURE_KEYS.slice(), props.defaultButton);
        setMsg({
            tone: "ok",
            text: t("gesture.saved")
        });
    }
    return h(Field, {
        label: props.label,
        hint: props.hint,
        stack: true,
        children: h("div", {
            className: "lo-keyrow"
        }, h("input", {
            className: "lo-keys",
            type: "text",
            readOnly: true,
            value: recording ? t("gesture.recording") : gestureText(current),
            "data-recording": recording ? "1" : undefined,
            title: t("gesture.record"),
            onFocus: function() {
                committed.current = false;
                setPending(null);
                setMsg(null);
                setRecording(true);
                guardRecording(true);
            },
            onBlur: function() {
                if (!committed.current) commit();
                setRecording(false);
                guardRecording(false);
            },
            onKeyDown: onKeyDown
        }), h(Chip, {
            active: props.button === "left",
            disabled: taken("left"),
            title: taken("left") ? t("gesture.buttonTaken") : undefined,
            onClick: function() {
                pickButton("left");
            }
        }, t("gesture.left")), h(Chip, {
            active: props.button === "right",
            disabled: taken("right"),
            title: taken("right") ? t("gesture.buttonTaken") : undefined,
            onClick: function() {
                pickButton("right");
            }
        }, t("gesture.right")), msg ? h("span", {
            className: "lo-shortcut-msg",
            "data-tone": msg.tone
        }, msg.text) : null, h("span", {
            className: "lo-keyrow-end"
        }, h(ConfirmBtn, {
            label: t("shortcut.reset"),
            confirmLabel: t("shortcut.confirmReset"),
            disabled: atDefault,
            onConfirm: reset
        })))
    });
}
function ShortcutCard(props) {
    const ctx = props.ctx;
    useStoreTick(props.store);
    const pair = useState(null);
    const report = pair[0];
    const setReport = pair[1];
    const setTick = useState(0)[1];
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
    useEffect(function() {
        return function() {
            guardRecording(false);
        };
    }, []);
    const shortcuts = service();
    let keys = [];
    let issue = null;
    let conflicts = [];
    let bound = false;
    let modified = false;
    let modifiedKnown = false;
    if (shortcuts && shortcuts.catalog) {
        const catalog = shortcuts.catalog.getSnapshot() || [];
        let j;
        for(j = 0; j < catalog.length; j++){
            if (catalog[j].id !== SHORTCUT_ID) continue;
            keys = catalog[j].keys || [];
            issue = catalog[j].issue || null;
            conflicts = catalog[j].conflicts || [];
            bound = catalog[j].binding !== null && catalog[j].binding !== undefined;
            if (typeof catalog[j].modified === "boolean") {
                modified = catalog[j].modified;
                modifiedKnown = true;
            }
        }
    }
    const canReset = modifiedKnown ? modified : bound;
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
        if (event.key === "Tab") return;
        event.preventDefault();
        event.stopPropagation();
        const target = event.target;
        if (event.key === "Escape") {
            target.blur();
            return;
        }
        const modifiers = modifierKeysOf(event);
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
        target.blur();
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
    function saveGesture(field, next, button) {
        props.store.update(function(state) {
            const stash = field !== "gestureMore";
            const prefix = next || (stash ? state.options.gestureStash : state.options.gestureMore);
            const otherKeys = stash ? state.options.gestureMore : state.options.gestureStash;
            const otherButton = stash ? state.options.gestureMoreButton : state.options.gestureStashButton;
            let picked = button;
            if (gestureText(prefix) === gestureText(otherKeys) && picked === otherButton) {
                picked = picked === "left" ? "right" : "left";
            }
            if (stash) {
                state.options.gestureStash = prefix;
                state.options.gestureStashButton = picked;
            } else {
                state.options.gestureMore = prefix;
                state.options.gestureMoreButton = picked;
            }
        }, {
            history: false
        });
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
        title: t("section.shortcut"),
        note: t("shortcut.hint")
    }, h(Field, {
        label: t("shortcut.open"),
        hint: t("shortcut.openHint"),
        stack: true,
        children: h("div", {
            className: "lo-keyrow"
        }, h("input", {
            className: "lo-keys",
            type: "text",
            readOnly: true,
            value: recording ? t("shortcut.recording") : keys.length > 0 ? keyCapText(keys) : t("shortcut.none"),
            "data-recording": recording ? "1" : undefined,
            "data-empty": keys.length > 0 ? undefined : "1",
            title: recording ? t("shortcut.recording") : t("shortcut.record"),
            onFocus: function() {
                setReport(null);
                setRecording(true);
                guardRecording(true, function() {
                    setReport({
                        tone: "error",
                        text: t("shortcut.recordFailed")
                    });
                });
            },
            onBlur: function() {
                setRecording(false);
                guardRecording(false);
            },
            onKeyDown: capture
        }), status, h("span", {
            className: "lo-keyrow-end"
        }, h(ConfirmBtn, {
            label: t("shortcut.reset"),
            confirmLabel: t("shortcut.confirmReset"),
            disabled: !canReset,
            onConfirm: reset
        })))
    }), h(GestureField, {
        label: t("gesture.stashLabel"),
        hint: t("gesture.stashHint"),
        keys: props.store.get().options.gestureStash,
        button: props.store.get().options.gestureStashButton,
        defaultButton: "left",
        otherKeys: props.store.get().options.gestureMore,
        otherButton: props.store.get().options.gestureMoreButton,
        onSave: function(next, picked) {
            saveGesture("gestureStash", next, picked);
        }
    }), h(GestureField, {
        label: t("gesture.moreLabel"),
        hint: t("gesture.moreHint"),
        keys: props.store.get().options.gestureMore,
        button: props.store.get().options.gestureMoreButton,
        defaultButton: "right",
        otherKeys: props.store.get().options.gestureStash,
        otherButton: props.store.get().options.gestureStashButton,
        onSave: function(next, picked) {
            saveGesture("gestureMore", next, picked);
        }
    }));
}

// src/ui/presets-card.ts
function clearFreshOfPreset(preset) {
    const scopes = Object.keys(preset.order || {});
    let i;
    for(i = 0; i < scopes.length; i++){
        const ids = preset.order[scopes[i]] || [];
        for(let j = 0; j < ids.length; j++)clearFreshRow(scopes[i], ids[j]);
    }
    const hidden = Object.keys(preset.hidden || {});
    for(i = 0; i < hidden.length; i++){
        const at = hidden[i].indexOf(":");
        if (at > 0) clearFreshRow(hidden[i].slice(0, at), hidden[i].slice(at + 1));
    }
}
function PresetsCard(props) {
    const store = props.store;
    useStoreTick(store);
    const state = store.get();
    const namePair = useState("");
    const nameValue = namePair[0];
    const setNameValue = namePair[1];
    const name = String(nameValue || "").trim();
    const names = presetNames(state);
    const exists = name.length > 0 && names.indexOf(name) >= 0;
    function save() {
        const key = name;
        if (!key) return;
        store.update(function(next) {
            next.presets[key] = capturePreset(next);
        });
        setNameValue("");
    }
    const rows = [];
    const onBase = state.activePreset === "";
    rows.push(h("div", {
        key: "__default",
        className: "lo-preset-row lo-preset-row-base"
    }, h("span", {
        className: "lo-preset-name",
        title: t("preset.default.hint")
    }, t("preset.default")), h(ConfirmBtn, {
        label: t("preset.apply"),
        confirmLabel: t("preset.confirmApply"),
        disabled: onBase,
        title: onBase ? t("preset.apply.active") : t("preset.default.hint"),
        onConfirm: function() {
            store.update(function(next) {
                if (!next.defaultPreset) return;
                applyPreset(next, next.defaultPreset);
                next.activePreset = "";
            });
            if (state.defaultPreset) clearFreshOfPreset(state.defaultPreset);
            notifyRevision();
        }
    }), h(Btn, {
        disabled: true,
        title: t("preset.default.locked")
    }, t("preset.delete"))));
    let i;
    for(i = 0; i < names.length; i++){
        const key = names[i];
        const preset = state.presets[key];
        const current = state.activePreset === key;
        rows.push(h("div", {
            key: key,
            className: "lo-preset-row"
        }, h("span", {
            className: "lo-preset-name",
            title: key
        }, key), h(ConfirmBtn, {
            label: t("preset.apply"),
            confirmLabel: t("preset.confirmApply"),
            disabled: current,
            title: current ? t("preset.apply.active") : t("preset.apply.hint"),
            onConfirm: function(one, presetName) {
                return function() {
                    store.update(function(next) {
                        applyPreset(next, one);
                        next.activePreset = presetName;
                    });
                    clearFreshOfPreset(one);
                    notifyRevision();
                };
            }(preset, key)
        }), h(ConfirmBtn, {
            label: t("preset.delete"),
            confirmLabel: t("preset.confirmDelete"),
            title: t("preset.delete.hint"),
            onConfirm: function(presetName) {
                return function() {
                    store.update(function(next) {
                        delete next.presets[presetName];
                        if (next.activePreset === presetName) next.activePreset = "";
                    });
                };
            }(key)
        })));
    }
    return h(Card, {
        title: t("section.presets")
    }, h("div", {
        className: "lo-preset-save"
    }, h("input", {
        type: "text",
        className: "lo-input",
        value: nameValue,
        placeholder: t("preset.placeholder"),
        maxLength: 24,
        "aria-label": t("preset.placeholder"),
        onChange: function(event) {
            setNameValue(event && event.target ? String(event.target.value || "") : "");
        }
    }), exists ? h(ConfirmBtn, {
        label: t("preset.overwrite"),
        confirmLabel: t("preset.confirmOverwrite"),
        title: t("preset.overwrite.hint"),
        onConfirm: save
    }) : h(Btn, {
        variant: "primary",
        disabled: name.length === 0,
        onClick: save
    }, t("preset.save"))), h("div", {
        className: "lo-preset-note"
    }, t("preset.note")), h("div", {
        className: "lo-preset-list"
    }, rows));
}

// src/ui/settings-page.ts
const TAB_KEYS = [
    "layout",
    "presets",
    "general"
];
function openExternal(url) {
    window.open(url, "_blank", "noopener");
}
function boolRow(spec) {
    return h(Field, {
        key: spec.key,
        label: spec.label,
        hint: spec.hint,
        sub: spec.sub,
        gated: spec.gated,
        collapsed: spec.collapsed,
        onToggleCollapse: spec.onToggleCollapse,
        children: h(Switch, {
            checked: spec.checked,
            label: spec.label,
            onChange: spec.onChange
        })
    });
}
function SettingsPage(props) {
    const ctx = props.ctx;
    const store = props.store;
    useStoreTick(store);
    const state = store.get();
    const noticePair = useState(null);
    const notice = noticePair[0];
    const setNotice = noticePair[1];
    const historyPair = useState("");
    const historyNote = historyPair[0];
    const setHistoryNote = historyPair[1];
    useEffect(function() {
        if (!historyNote && !notice) return undefined;
        const timer = setTimeout(function() {
            setHistoryNote("");
            setNotice(null);
        }, 4000);
        return function() {
            clearTimeout(timer);
        };
    }, [
        historyNote,
        notice
    ]);
    const titleNote = historyNote || (notice ? notice.text : "");
    const titleTone = historyNote ? "ok" : notice ? notice.tone : "ok";
    function sayNotice(text, tone) {
        setHistoryNote("");
        setNotice({
            text: text,
            tone: tone
        });
    }
    function sayHistory(text) {
        setNotice(null);
        setHistoryNote(text);
    }
    const tabPair = useState("layout");
    const tab = tabPair[0];
    const setTab = tabPair[1];
    useEffect(function() {
        if (tab !== "layout") return undefined;
        return function() {
            clearAllFresh();
        };
    }, [
        tab
    ]);
    const queryPair = useState("");
    const query = queryPair[0];
    const setQuery = queryPair[1];
    const collapsedMap = state.options.collapsed || {};
    const allowOpen = collapsedMap["allowDragOfficial"] !== true;
    const dividerOpen = collapsedMap["showDivider"] !== true;
    function toggleCollapsed(key, open) {
        store.update(function(next) {
            setCollapsed(next, key, open);
        }, {
            history: false
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
        }, boolRow({
            label: t("opt.allowDragOfficial"),
            hint: t("opt.allowDragOfficial.hint"),
            onToggleCollapse: function() {
                toggleCollapsed("allowDragOfficial", allowOpen);
            },
            collapsed: allowOpen === false,
            checked: state.options.allowDragOfficial === true,
            onChange: function(value) {
                store.update(function(next) {
                    setOption(next, "allowDragOfficial", value);
                });
            }
        }), allowOpen ? boolRow({
            label: t("opt.mixGroups"),
            hint: t("opt.mixGroups.hint"),
            sub: true,
            gated: state.options.allowDragOfficial !== true,
            checked: state.options.mixGroups !== false,
            onChange: function(value) {
                store.update(function(next) {
                    const lift = next.options.allowDragOfficial !== true;
                    setOption(next, "mixGroups", lift ? true : value);
                    if (lift) setOption(next, "allowDragOfficial", true);
                });
            }
        }) : null, boolRow({
            label: t("opt.showDivider"),
            hint: t("opt.showDivider.hint"),
            onToggleCollapse: function() {
                toggleCollapsed("showDivider", dividerOpen);
            },
            collapsed: dividerOpen === false,
            checked: state.options.showDivider === true,
            onChange: function(value) {
                store.update(function(next) {
                    setOption(next, "showDivider", value);
                });
            }
        }), dividerOpen ? DIVIDER_SCOPES.concat(moreAvailable() ? DIVIDER_MENU_SCOPES : []).map(function(scope) {
            const on = state.options.dividers ? state.options.dividers[scope] !== false : true;
            return boolRow({
                key: "divider:" + scope,
                label: t("opt.divider." + scope),
                hint: t("opt.divider." + scope + ".hint"),
                sub: true,
                gated: state.options.showDivider !== true,
                checked: on,
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
            });
        }) : null, moreAvailable() ? boolRow({
            label: t("opt.separateMore"),
            hint: t("opt.separateMore.hint"),
            checked: state.options.separateMore === true,
            onChange: function(value) {
                store.update(function(next) {
                    setOption(next, "separateMore", value);
                });
            }
        }) : null, boolRow({
            label: t("opt.showLauncher"),
            hint: t("opt.showLauncher.hint"),
            checked: state.options.showStashLauncher !== false,
            onChange: function(value) {
                store.update(function(next) {
                    setOption(next, "showStashLauncher", value);
                });
            }
        }), boolRow({
            label: t("opt.pruneStash"),
            hint: t("opt.pruneStash.hint"),
            checked: state.options.pruneStash !== false,
            onChange: function(value) {
                store.update(function(next) {
                    setOption(next, "pruneStash", value);
                });
            }
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
                        next.moreOrder = fresh.moreOrder;
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
            title: h("span", null, t("stash.title"), h("span", {
                className: "lo-card-note"
            }, t("stash.count").replace("{count}", String(stashCount(state))))),
            action: h(Btn, {
                variant: "primary",
                onClick: props.onOpenStash
            }, t("action.openStash"))
        })
    ];
    for(i = 0; i < scopeCards.length; i++)layoutBody.push(scopeCards[i]);
    if (searching && !anyScopeHit) layoutBody.push(h("div", {
        key: "no-hit",
        className: "lo-empty"
    }, t("empty.search")));
    const navButtons = [];
    TAB_KEYS.forEach(function(key) {
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
    });
    return h("div", {
        className: "lo-page"
    }, h("div", {
        className: "lo-titlerow"
    }, h("h2", {
        className: "lo-title"
    }, t("title")), h("span", {
        className: "lo-version",
        title: t("version.hint")
    }, "v" + PLUGIN_VERSION), titleNote ? h("span", {
        className: "lo-title-note",
        "data-tone": titleTone
    }, titleNote) : null, h("span", {
        className: "lo-titlegap"
    }), h("div", {
        className: "lo-titleacts"
    }, h("div", {
        className: "lo-acts-row"
    }, h(Btn, {
        icon: ACTION_ICON_UNDO,
        iconName: "undo",
        title: canUndo() ? t("action.undo.hint") : t("action.undo.none"),
        disabled: !canUndo(),
        onClick: function() {
            if (!undoLast(store)) return;
            sayHistory(t("note.undone"));
        }
    }, t("action.undo")), h(Btn, {
        icon: ACTION_ICON_REDO,
        iconName: "redo",
        title: canRedo() ? t("action.redo.hint") : t("action.redo.none"),
        disabled: !canRedo(),
        onClick: function() {
            if (!redoLast(store)) return;
            sayHistory(t("note.redone"));
        }
    }, t("action.redo")), h(Btn, {
        icon: ACTION_ICON_EXPORT,
        iconName: "export",
        title: t("action.export.hint"),
        onClick: function() {
            exportConfig(store);
            sayNotice(t("note.exported"), "ok");
        }
    }, t("action.export")), h(ConfirmBtn, {
        label: t("action.import"),
        confirmLabel: t("action.confirmImport"),
        icon: ACTION_ICON_IMPORT,
        iconName: "import",
        title: t("action.import.hint"),
        onConfirm: function() {
            importConfig(store, function(ok) {
                sayNotice(ok ? t("note.importOk") : t("note.importFail"), ok ? "ok" : "error");
            });
        }
    }), h(Btn, {
        icon: ACTION_ICON_GITHUB,
        iconName: "github",
        title: t("action.github.hint"),
        onClick: function() {
            openExternal(GITHUB_URL);
        }
    }, t("action.github")), h(Btn, {
        icon: ACTION_ICON_FEEDBACK,
        iconName: "feedback",
        title: t("action.feedback.hint"),
        onClick: function() {
            openExternal(GITHUB_ISSUES_URL);
        }
    }, t("action.feedback"))))), h("div", {
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
    }, layoutBody)) : tab === "presets" ? h("div", {
        className: "lo-tabpane",
        role: "tabpanel"
    }, h("div", {
        className: "lo-scroll"
    }, [
        h(PresetsCard, {
            key: "presets",
            store: store
        })
    ])) : h("div", {
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
        const navigable = rowNavigable(item.scope, item.id);
        const unlisted = missing && item.scope !== "settings" && !navigable;
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

// src/ui/stash-panel.ts
function StashRow(props) {
    const row = props.row;
    const inert = row.missing || !row.navigable;
    let hint = t("action.goto");
    if (row.missing) hint = t("scope.missing");
    else if (!row.navigable) hint = t("action.static");
    const icon = rowIconOf(row.scope, row.id);
    const onIntoMore = props.canIntoMore ? props.onIntoMore : undefined;
    return h("div", {
        className: "lo-stash-row",
        "data-lo-stash-scope": row.scope,
        "data-lo-stash-id": row.id
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
    }, row.id)), h(IntoMoreButton, {
        intoMore: false,
        onToggle: onIntoMore ? function() {
            onIntoMore(row);
        } : undefined
    }), h(Btn, {
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
    const panelRef = useRef(null);
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
                return;
            }
            if (event.key !== "Tab") return;
            const panel = panelRef.current;
            if (!panel || typeof panel.querySelectorAll !== "function") return;
            const items = panel.querySelectorAll("button, input, [href], select, textarea, [tabindex]:not([tabindex='-1'])");
            const focusable = [];
            let i;
            for(i = 0; i < items.length; i++){
                const el = items[i];
                if (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true") continue;
                focusable.push(el);
            }
            if (focusable.length === 0) {
                event.preventDefault();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const activeEl = document.activeElement;
            if (event.shiftKey && (!activeEl || activeEl === first || !panel.contains(activeEl))) {
                event.preventDefault();
                last.focus();
                return;
            }
            if (!event.shiftKey && (!activeEl || activeEl === last || !panel.contains(activeEl))) {
                event.preventDefault();
                first.focus();
            }
        }
        document.addEventListener("keydown", onKey, true);
        return function() {
            document.removeEventListener("keydown", onKey, true);
        };
    }, []);
    useEffect(function() {
        const panel = panelRef.current;
        if (!panel || typeof panel.querySelectorAll !== "function") return function() {};
        const previous = document.activeElement;
        const items = panel.querySelectorAll("button, input, [href], select, textarea, [tabindex]:not([tabindex='-1'])");
        let target = null;
        let i;
        for(i = 0; i < items.length; i++){
            const el = items[i];
            if (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true") continue;
            target = el;
            break;
        }
        if (target) target.focus();
        return function() {
            if (previous && typeof previous.focus === "function" && previous !== document.body) previous.focus();
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
        navigateFromSettings(ctx, row.scope, row.id);
        closeStash();
    }
    const body = [];
    const collapsedMap = state.options.collapsed || {};
    let i;
    let j;
    for(i = 0; i < groups.length; i++){
        const group = groups[i];
        if (group.title) {
            const collapsedKey = "stash:" + mode + ":" + group.key;
            const expanded = collapsedMap[collapsedKey] !== true;
            const toggleGroup = function() {
                store.update(function(next) {
                    setCollapsed(next, collapsedKey, expanded);
                }, {
                    history: false
                });
            };
            body.push(h("div", {
                key: "g:" + group.key,
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
                    if (event && event.target && event.target.closest && event.target.closest(".lo-btn")) return;
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
            if (!expanded) continue;
        }
        for(j = 0; j < group.rows.length; j++){
            const row = group.rows[j];
            body.push(h(StashRow, {
                key: row.key,
                row: row,
                onOpen: open,
                onRestore: restore,
                canIntoMore: canTuckIntoMore(row.scope, row.id),
                onIntoMore: intoMore
            }));
        }
    }
    return ReactDOM.createPortal(h(React.Fragment, null, h("div", {
        className: "lo-mask",
        onClick: closeStash
    }), h("div", {
        className: "lo-stash",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": t("stash.title"),
        ref: panelRef
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

// src/ui/stash-flag.ts
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

// src/ui/stash-view.ts
function StashLauncher(props) {
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
    const finishRef = useRef(null);
    const setTick = useState(0)[1];
    useEffect(function() {
        function onWindowUp(event) {
            if (finishRef.current) finishRef.current(event);
        }
        window.addEventListener("pointerup", onWindowUp, true);
        window.addEventListener("pointercancel", onWindowUp, true);
        return function() {
            window.removeEventListener("pointerup", onWindowUp, true);
            window.removeEventListener("pointercancel", onWindowUp, true);
        };
    }, []);
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
    }, [
        size.width,
        size.height
    ]);
    useEffect(function() {
        return function() {
            if (frameRef.current) {
                window.cancelAnimationFrame(frameRef.current);
                frameRef.current = 0;
            }
        };
    }, []);
    if (state.options.showStashLauncher === false) return null;
    const side = state.options.launcherSide === LAUNCHER_SIDE_LEFT ? LAUNCHER_SIDE_LEFT : LAUNCHER_SIDE_RIGHT;
    const width = size.width || 120;
    const height = size.height || 32;
    const rawY = state.options.launcherY;
    const y = clampLauncherY(typeof rawY === "number" && isFinite(rawY) ? rawY : null, height);
    const x = side === LAUNCHER_SIDE_LEFT ? LAUNCHER_MARGIN : Math.max(LAUNCHER_MARGIN, window.innerWidth - width - LAUNCHER_MARGIN);
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
            const nextSide = event.clientX < window.innerWidth / 2 ? LAUNCHER_SIDE_LEFT : LAUNCHER_SIDE_RIGHT;
            const node = ref.current;
            if (node) {
                node.style.left = Math.round(nextSide === LAUNCHER_SIDE_LEFT ? LAUNCHER_MARGIN : Math.max(LAUNCHER_MARGIN, window.innerWidth - drag.width - LAUNCHER_MARGIN)) + "px";
                node.style.top = Math.round(drag.y) + "px";
            }
            store.update(function(state2) {
                state2.options.launcherSide = nextSide;
                state2.options.launcherY = drag.y;
            }, {
                history: false
            });
        } else {
            openStash();
        }
    }
    finishRef.current = onPointerUp;
    return h("button", {
        type: "button",
        ref: ref,
        className: "lo-launcher",
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
let loMoreMenuDismiss = null;
let loMoreGesturesBound = false;
let loMoreGestureRefs = 0;
let loMoreGestureOff = null;
const loMoreDrag = {
    node: null,
    key: "",
    region: "",
    startX: 0,
    startY: 0,
    rect: null,
    outside: false,
    active: false
};
const loMoreStashSlot = createDropSlot(DROP_MARK);
function moreRowOf(target) {
    if (!target || typeof target.closest !== "function") return null;
    return target.closest("[data-lo-more-key]");
}
function moreActivate(ctx, key, onDismiss) {
    if (!ctx) return;
    const split = splitRowKey(key);
    if (!split) return;
    navigateTo(ctx, split.scope, split.id);
    if (onDismiss) onDismiss();
}
function moreRowMenuAt(event, store, region, key) {
    const split = splitRowKey(key);
    if (!split) return;
    const scope = split.scope;
    const id = split.id;
    const state = store.get();
    const actions = moreMoveActions(store, region, key);
    actions.push.apply(actions, menuTailActions(store, scope, id, false, canTuckIntoMore(scope, id), isIntoMore(state, scope, id), isHidden(state, scope, id)));
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
    loMoreDrag.startX = event.clientX;
    loMoreDrag.startY = event.clientY;
    loMoreDrag.active = false;
    loMoreDrag.outside = false;
    loMorePointer.x = event.clientX;
    loMorePointer.y = event.clientY;
    loMoreStashSlot.clear();
    loMoreStartOrder = loMoreMenuStore ? moreOrderOf(loMoreMenuStore.get(), loMoreDrag.region).slice() : null;
    const menu = typeof row.closest === "function" ? row.closest('[role="menu"]') : null;
    loMoreDrag.rect = menu && typeof menu.getBoundingClientRect === "function" ? menu.getBoundingClientRect() : null;
}
const loMorePointer = {
    x: 0,
    y: 0
};
let loMorePreviewKeys = null;
let loMorePreviewStored = false;
let loMoreStartOrder = null;

// src/ui/more-menu-gesture.ts
function moreOrderPreviewable(region) {
    const nodes = moreRowNodes(region);
    if (nodes.length === 0) return true;
    const parent = nodes[0].parentElement;
    if (!parent || typeof getComputedStyle !== "function") return true;
    const display = getComputedStyle(parent).display;
    return display === "flex" || display === "inline-flex" || display === "grid";
}
function moreApplyPreview(region, keys) {
    if (!moreOrderPreviewable(region)) {
        const store = loMoreMenuStore;
        loMorePreviewStored = true;
        if (!store) return;
        const next = keys.slice();
        store.update(function(state) {
            setMoreOrder(state, region, next);
        }, {
            history: false
        });
        return;
    }
    loMorePreviewKeys = keys.slice();
    const index = Object.create(null);
    let i;
    for(i = 0; i < keys.length; i++)index[keys[i]] = i;
    const nodes = moreRowNodes(region);
    for(i = 0; i < nodes.length; i++){
        const key = nodes[i].getAttribute("data-lo-more-key") || "";
        const at = index[key];
        if (typeof at === "number") nodes[i].style.order = String(at);
    }
}
function moreClearPreview(region) {
    loMorePreviewKeys = null;
    loMorePreviewStored = false;
    if (region === "") return;
    const nodes = moreRowNodes(region);
    let i;
    for(i = 0; i < nodes.length; i++)nodes[i].style.order = "";
}
function moreRestoreOrder() {
    const start = loMoreStartOrder;
    loMoreStartOrder = null;
    if (!loMorePreviewStored || !start) return;
    const store = loMoreMenuStore;
    const region = loMoreDrag.region;
    if (!store || region === "") return;
    const now = moreOrderOf(store.get(), region);
    if (now.length === start.length && now.every(function(key, i) {
        return key === start[i];
    })) return;
    const next = start.slice();
    store.update(function(state) {
        setMoreOrder(state, region, next);
    }, {
        history: false
    });
}
function moreGestureApply() {
    const node = loMoreDrag.node;
    if (!node || !loMoreDrag.active) return;
    const x = loMorePointer.x;
    const y = loMorePointer.y;
    const stashHit = stashDropAt(x, y);
    loMoreStashSlot.sync(stashHit);
    const rect = loMoreDrag.rect;
    const outside = outsideRect(rect, x, y, OUT_MARGIN);
    if (outside !== loMoreDrag.outside) {
        loMoreDrag.outside = outside;
        node.classList.toggle("lo-more-out", outside);
    }
    if (outside || stashHit) return;
    const store = loMoreMenuStore;
    if (!store) return;
    const region = loMoreDrag.region;
    if (region === "") return;
    const base = loMorePreviewKeys ? loMorePreviewKeys.slice() : moreKeysIn(store.get(), region);
    const from = base.indexOf(loMoreDrag.key);
    if (from < 0) return;
    const at = moreDropIndex(region, loMoreDrag.key, y);
    if (at < 0 || at === from) return;
    base.splice(from, 1);
    base.splice(at, 0, loMoreDrag.key);
    moreApplyPreview(region, base);
}
const loMoreThrottle = createFrameThrottle(moreGestureApply);
function moreGestureMove(event) {
    const node = loMoreDrag.node;
    if (!node) return;
    if (!loMoreDrag.active) {
        if (belowDragThreshold(event.clientX, event.clientY, loMoreDrag.startX, loMoreDrag.startY)) return;
        loMoreDrag.active = true;
        node.classList.add("lo-more-dragging");
        document.documentElement.style.cursor = "grabbing";
    }
    event.preventDefault();
    event.stopPropagation();
    loMorePointer.x = event.clientX;
    loMorePointer.y = event.clientY;
    loMoreThrottle.schedule(event.clientY);
}
function resetMoreDrag() {
    loMoreThrottle.drop();
    moreClearPreview(loMoreDrag.region);
    const node = loMoreDrag.node;
    if (node) {
        node.classList.remove("lo-more-dragging");
        node.classList.remove("lo-more-out");
    }
    loMoreStashSlot.clear();
    document.documentElement.style.cursor = "";
    loMoreDrag.node = null;
    loMoreDrag.key = "";
    loMoreDrag.region = "";
    loMoreDrag.startX = 0;
    loMoreDrag.startY = 0;
    loMoreDrag.rect = null;
    loMoreDrag.outside = false;
    loMoreDrag.active = false;
    loMoreStartOrder = null;
}
function moreGestureCancel(event) {
    if (loMoreDrag.node && event && typeof event.stopPropagation === "function") event.stopPropagation();
    moreRestoreOrder();
    resetMoreDrag();
}
function moreGestureUp(event) {
    const node = loMoreDrag.node;
    if (!node) return;
    loMoreThrottle.flush();
    const key = loMoreDrag.key;
    const region = loMoreDrag.region;
    const active = loMoreDrag.active;
    const outside = loMoreDrag.outside;
    const stashEl = loMoreStashSlot.hit();
    const preview = loMorePreviewKeys;
    const stored = loMorePreviewStored;
    if (active) {
        loMoreSuppressClick = Date.now() + LO_CLICK_SUPPRESS_MS;
        event.stopPropagation();
    }
    resetMoreDrag();
    if (!active) return;
    const store = loMoreMenuStore;
    if (!store) return;
    const split = splitRowKey(key);
    if (!split) return;
    const scope = split.scope;
    const id = split.id;
    if (stashEl) {
        store.update(function(state) {
            setHidden(state, scope, id, true);
        });
        return;
    }
    if (outside) {
        store.update(function(state) {
            setIntoMore(state, scope, id, false);
        });
        return;
    }
    if (stored || !preview || region === "") return;
    const next = preview.slice();
    store.update(function(state) {
        setMoreOrder(state, region, next);
    });
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
    moreActivate(loMoreMenuCtx, row.getAttribute("data-lo-more-key") || "", loMoreMenuDismiss);
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
    if (typeof window === "undefined") return;
    loMoreGestureRefs++;
    if (loMoreGesturesBound) return;
    loMoreGesturesBound = true;
    loMoreGestureOff = bindWindowCapture({
        pointerdown: moreGestureDown,
        mousedown: moreGestureMouseDown,
        pointermove: moreGestureMove,
        pointerup: moreGestureUp,
        pointercancel: moreGestureCancel,
        contextmenu: moreGestureContext,
        click: moreGestureClick
    });
}
function uninstallMoreGestures() {
    loMoreGestureRefs = Math.max(0, loMoreGestureRefs - 1);
    if (loMoreGestureRefs > 0) return;
    if (!loMoreGesturesBound) return;
    loMoreGesturesBound = false;
    if (loMoreGestureOff) {
        loMoreGestureOff();
        loMoreGestureOff = null;
    }
}

// src/ui/more-menu-rows.ts
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
    const key = rowKey(scope, id);
    const label = rowLabelText(ctx, scope, id);
    const icon = rowIconOf(scope, id);
    function open() {
        moreActivate(ctx, key, props.onDismiss ? props.onDismiss : null);
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
    const region = props && props.loRegion ? props.loRegion : "sidebar";
    const onOpen = props ? props.onOpen : null;
    React.useEffect(function() {
        if (region !== "conversation") return;
        setViewOpener(typeof onOpen === "function" ? onOpen : null);
        return function() {
            setViewOpener(null);
        };
    }, [
        onOpen,
        region
    ]);
    const hostViews = [];
    if (props && region === "conversation" && Array.isArray(props.entries)) {
        const entries = props.entries;
        for(let i = 0; i < entries.length; i++){
            const entry = entries[i];
            if (entry && typeof entry.id === "string") hostViews.push(entry.id);
        }
    }
    if (!ctx || !store) return null;
    return h(MoreMenuRows, {
        ctx: ctx,
        store: store,
        region: region,
        hostViews: hostViews,
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
    const hostViews = props.hostViews ? props.hostViews : [];
    const shown = rows.filter(function(row) {
        return !(row.scope === "tabs" && hostViews.indexOf(row.id) >= 0);
    });
    const divider = moreDividerOn(state);
    React.useEffect(function() {
        loMoreMenuCtx = ctx;
        loMoreMenuStore = store;
        loMoreMenuDismiss = props.onDismiss ? props.onDismiss : null;
    });
    React.useEffect(function() {
        installMoreGestures();
        return function() {
            uninstallMoreGestures();
            resetMoreDrag();
        };
    }, [
        ctx,
        region
    ]);
    const out = [];
    let dividerDone = false;
    let i;
    for(i = 0; i < shown.length; i++){
        const row = shown[i];
        const key = rowKey(row.scope, row.id);
        const group = kindOf(state, row.scope, row.id) === "official" ? "official" : "third";
        if (divider && !dividerDone && group === "third") {
            dividerDone = true;
            out.push(h("div", {
                key: "lo-more-divider",
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
                const host = props ? props : {};
                return h(Boundary, null, h(MoreMenuContent, {
                    loCtx: ctx,
                    loStore: store,
                    loRegion: region,
                    onDismiss: host.onDismiss,
                    onOpen: host.onOpen,
                    entries: host.entries
                }));
            });
        });
    } catch (err) {
        noteDegrade(slot + " unavailable; rows cannot be tucked into More: " + errText(err));
    }
}
function apply(ctx) {
    setReporter(function(message) {
        try {
            console.warn("[layout-organizer] " + message);
        } catch (err) {}
    });
    function noteDegrade(message) {
        warn(message);
    }
    try {
        boot();
    } catch (err) {
        noteDegrade("startup failed: " + errText(err));
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
        setVisibleOrderProvider(visibleOrder);
        setActiveStore(store);
        setActiveContext(ctx);
        const organizer = createOrganizer(ctx, store, function(where, err) {
            noteDegrade(where + ": " + errText(err));
        });
        const drag = createDragController(store);
        const listDrag = createListDragController(store);
        const stashDrag = createStashDragController(store);
        bindHostMenuCloser(function() {
            let hostMenus = null;
            try {
                hostMenus = ctx.get("contextMenus");
            } catch (err) {
                hostMenus = null;
            }
            if (hostMenus && typeof hostMenus.close === "function") hostMenus.close();
        });
        setShortcutRecordGuard(function(active) {
            let service = null;
            try {
                service = ctx.get("shortcuts");
            } catch (err) {
                service = null;
            }
            if (!service || typeof service.recording !== "function") return;
            return service.recording(active);
        });
        ctx.effect(function() {
            installRowMenu(store);
            organizer.start();
            drag.attach();
            listDrag.attach();
            stashDrag.attach();
            return function() {
                stashDrag.detach();
                listDrag.detach();
                drag.detach();
                organizer.stop();
                uninstallRowMenu();
                bindHostMenuCloser(null);
                setShortcutRecordGuard(null);
                removeSurfaces();
                setActiveStore(null);
                setActiveContext(null);
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
            noteDegrade("shell.overlay unavailable; the stash cannot be shown: " + errText(err));
        }
        const moreSlots = [
            {
                slot: "sidebar.panellist.actions",
                region: "sidebar"
            },
            {
                slot: "sidebar.right.tab.guide.actions",
                region: MORE_REGION_RIGHT
            },
            {
                slot: "conversation.session.header.views.actions",
                region: "conversation"
            }
        ];
        for(let slotAt = 0; slotAt < moreSlots.length; slotAt++){
            const target = moreSlots[slotAt];
            injectMoreSlot(ctx, store, target.slot, target.region, noteDegrade);
        }
        function settingsSurface() {
            return h(Boundary, null, h(SettingsPage, {
                ctx: ctx,
                store: store,
                onOpenStash: openStash
            }));
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
                    return settingsSurface();
                });
            });
        } catch (err) {
            noteDegrade("settings.section unavailable; the settings page cannot be reached: " + errText(err));
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
                    return settingsSurface();
                });
            });
        } catch (err) {
            noteDegrade("plugins.detail.section unavailable; the plugin detail page has no settings: " + errText(err));
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
                    const message = errText(err);
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
