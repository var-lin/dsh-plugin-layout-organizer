/* 针对两步式设置路由（src/core/dom-navigate.ts）的行为测试：第 1 步从 shell 触发器打开弹窗，
   第 2 步点击弹窗里的导航行（优先按 `data-lo-id` 匹配）；也覆盖被收纳设置行带 `data-lo-hidden` 时的点击：
   样式表用 `display:none !important` 藏住它，点击前必须先显现、下一帧再藏回去。

   用法：node test/navigate.mjs [path-to-lib/client.js]                                  */

import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const file = process.argv[2] || join(dirname(dirname(fileURLToPath(import.meta.url))), "lib", "client.js");

let failures = 0;
function check(name, condition, detail) {
  if (condition) {
    console.log("  ok   " + name);
  } else {
    failures++;
    console.log("  FAIL " + name + (detail === undefined ? "" : "  -> " + detail));
  }
}

/* 极简的选择器支持：插件只要 `[attr]`、`[attr="v"]`、`tag`、`tag[attr="v"]`、`:scope > tag`、`.class`
   和属性前缀这几种，结构化匹配即可，不依赖外部库。 */
function matches(el, selector) {
  selector = selector.trim();
  if (selector.startsWith(":scope > ")) selector = selector.slice(9).trim();
  const parts = selector.split(/(?=[.\[])/);
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith("[")) {
      const body = part.slice(1, -1);
      const eq = body.indexOf("=");
      if (eq < 0) {
        if (!el.hasAttribute(body)) return false;
      } else {
        const name = body.slice(0, eq);
        let want = body.slice(eq + 1);
        if ((want.startsWith('"') && want.endsWith('"')) || (want.startsWith("'") && want.endsWith("'"))) {
          want = want.slice(1, -1);
        }
        if (el.getAttribute(name) !== want) return false;
      }
    } else if (part.startsWith(".")) {
      if (String(el.className || "").split(/\s+/).indexOf(part.slice(1)) < 0) return false;
    } else if (part !== "*") {
      if (el.tagName !== part.toUpperCase()) return false;
    }
  }
  return true;
}

function walk(node, out) {
  for (const child of node.children) {
    out.push(child);
    walk(child, out);
  }
  return out;
}

/* 选择器组（`button, a, [role='button']`）按逗号切开后逐个试：真实 DOM 的
   `querySelectorAll` 支持这种写法，插件点行时正是靠它找行里那颗按钮。 */
function matchesAny(el, selector) {
  const groups = String(selector).split(",");
  for (const group of groups) {
    if (group.trim() && matches(el, group)) return true;
  }
  return false;
}

function makeEl(tag) {
  const el = {
    tagName: String(tag).toUpperCase(),
    style: {},
    children: [],
    attributes: {},
    parentNode: null,
    textContent: "",
    className: "",
    onclick: null,
    offsetWidth: 200,
    offsetHeight: 120,
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
    },
    removeAttribute(name) {
      delete this.attributes[name];
    },
    hasAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name);
    },
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    },
    removeChild(child) {
      const i = this.children.indexOf(child);
      if (i >= 0) this.children.splice(i, 1);
      child.parentNode = null;
      return child;
    },
    insertBefore(child) {
      return this.appendChild(child);
    },
    querySelector(sel) {
      const all = walk(this, []);
      for (const el of all) if (matchesAny(el, sel)) return el;
      return null;
    },
    querySelectorAll(sel) {
      return walk(this, []).filter((el) => matchesAny(el, sel));
    },
    closest(sel) {
      let node = this;
      while (node) {
        if (matchesAny(node, sel)) return node;
        node = node.parentNode;
      }
      return null;
    },
    addEventListener() {},
    removeEventListener() {},
    getBoundingClientRect() {
      return { top: 0, left: 0, right: 200, bottom: 40, width: 200, height: 40 };
    },
    focus() {},
    click() {
      this.clicked = (this.clicked || 0) + 1;
      if (typeof this.onclick === "function") this.onclick({ target: this });
    },
    contains(node) {
      let cur = node;
      while (cur) {
        if (cur === this) return true;
        cur = cur.parentNode;
      }
      return false;
    }
  };
  return el;
}

const docRoot = makeEl("html");
const head = makeEl("head");
const body = makeEl("body");
docRoot.appendChild(head);
docRoot.appendChild(body);

globalThis.document = {
  head,
  body,
  documentElement: docRoot,
  createElement: makeEl,
  querySelector(sel) {
    return docRoot.querySelector(sel);
  },
  querySelectorAll(sel) {
    return docRoot.querySelectorAll(sel);
  },
  addEventListener() {},
  removeEventListener() {},
  elementFromPoint: () => null,
  contains: (n) => docRoot.contains(n)
};

let rafQueue = [];
globalThis.window = {
  innerWidth: 1440,
  innerHeight: 900,
  localStorage: {
    store: new Map(),
    getItem(k) {
      return this.store.has(k) ? this.store.get(k) : null;
    },
    setItem(k, v) {
      this.store.set(k, String(v));
    },
    removeItem(k) {
      this.store.delete(k);
    }
  },
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id),
  requestAnimationFrame: (fn) => {
    rafQueue.push(fn);
    return rafQueue.length;
  },
  cancelAnimationFrame() {},
  addEventListener() {},
  removeEventListener() {},
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} })
};

globalThis.MutationObserver = class {
  observe() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
};
globalThis.requestAnimationFrame = globalThis.window.requestAnimationFrame;
globalThis.cancelAnimationFrame = globalThis.window.cancelAnimationFrame;

function flushFrames() {
  const q = rafQueue;
  rafQueue = [];
  for (const fn of q) fn(Date.now());
}

const hookSlots = [];
let hookIndex = 0;
const React = {
  createElement(type, props, ...children) {
    return { type, props: props || {}, children };
  },
  Fragment: Symbol("Fragment"),
  useState(initial) {
    const i = hookIndex++;
    if (!(i in hookSlots)) hookSlots[i] = typeof initial === "function" ? initial() : initial;
    return [hookSlots[i], (next) => { hookSlots[i] = typeof next === "function" ? next(hookSlots[i]) : next; }];
  },
  useEffect() {
    hookIndex++;
  },
  useRef(initial) {
    const i = hookIndex++;
    if (!(i in hookSlots)) hookSlots[i] = { current: initial };
    return hookSlots[i];
  },
  useMemo(fn) {
    hookIndex++;
    return fn();
  },
  useCallback(fn) {
    hookIndex++;
    return fn;
  }
};
const ReactDOM = { render() {}, unmountComponentAtNode() {} };
const ReactDOMClient = { createRoot: () => ({ render() {}, unmount() {} }) };

function requireStub(spec) {
  if (spec === "react") return React;
  if (spec === "react-dom") return ReactDOM;
  if (spec === "react-dom/client") return ReactDOMClient;
  throw new Error("navigate: unexpected require(" + spec + ")");
}

const settingsEntries = [
  { options: { id: "account", order: -10, label: "Account" } },
  { options: { id: "plugins", order: 20, label: "Marketplace" } },
  { options: { id: "layout-organizer", order: 35, label: () => "Organizer" } }
];

const ctx = {
  get(name) {
    if (name === "locale") {
      let dict = {};
      return {
        register(ns, dicts) {
          dict = dicts.zh || {};
          return () => {};
        },
        bind() {
          return (key) => (dict[key] === undefined ? key : dict[key]);
        },
        subscribe: () => () => {},
        getSnapshot: () => ({ locale: "zh" })
      };
    }
    if (name === "layout") return { selectPanel() {} };
    return undefined;
  },
  effect(fn) {
    fn();
    return () => {};
  },
  on() {},
  slots: {
    register: () => () => {},
    inject(slot, cb) {
      cb();
    },
    subscribe: () => () => {},
    entries: (slot) => (slot === "settings.section" ? settingsEntries : []),
    entriesOfSlot: (slot) => (slot === "settings.section" ? settingsEntries : []),
    getVersion: () => 1,
    snapshot: (slot) => ({ type: "slot", name: slot, occupants: [] }),
    spec: () => ({ kind: "list", scope: "root" })
  }
};

let definition = null;
globalThis.window.__ModuleLoader__ = {
  load(def) {
    definition = def;
  }
};

// 包共用一个作用域、不导出任何东西，`navigateTo` 靠往生成源码里插一个收集器拿到。
const source = readFileSync(file, "utf8");
const anchor = "    return { inject: inject, apply: apply };";
if (source.indexOf(anchor) < 0) {
  console.error("FAIL: could not find the factory return anchor in the bundle");
  process.exit(1);
}
const capture =
  "    try { globalThis.__loNavigateTo = navigateTo; globalThis.__loSetViewOpener = setViewOpener; } catch (err) { /* not present */ }\n" +
  anchor;
const probePath = join(dirname(file), "..", "lib", ".navigate-probe.mjs");
/**
 * 探针文件是构建产物，运行结束必须清理，断言失败提前退出时也不例外。
 */
function cleanupProbe() {
  try {
    rmSync(probePath, { force: true });
  } catch (err) {
    // 无可操作；该文件本就被 git 忽略
  }
}
process.on("exit", cleanupProbe);
writeFileSync(probePath, source.replace(anchor, capture), "utf8");
await import(pathToFileURL(probePath).href + "?t=" + Date.now());
cleanupProbe();

if (!definition) {
  console.error("FAIL: the bundle never called window.__ModuleLoader__.load");
  process.exit(1);
}
const mod = definition.factory(requireStub);
mod.apply(ctx);
if (typeof globalThis.__loNavigateTo !== "function") {
  console.error("FAIL: navigateTo was not reachable in the bundle scope");
  process.exit(1);
}

console.log("two-step settings route");

/**
 * 通过收集器拿到的 `navigateTo` 驱动包作用域里的这条路由。
 * @param scope 槽位名，如 `settings`、`sidebar`
 * @param id 目标项在该槽位里的 id
 * @throws 没有捕获到 `__loNavigateTo` 时抛错，说明探针没注入成功。
 */
function open(scope, id) {
  if (typeof globalThis.__loNavigateTo !== "function") {
    throw new Error("navigate: __loNavigateTo was not captured");
  }
  return globalThis.__loNavigateTo(ctx, scope, id);
}

const silent = [];
const origWarn = console.warn;
console.warn = (msg) => silent.push(String(msg));
open("settings", "plugins");
console.warn = origWarn;
check(
  "missing trigger reports via nav.failed",
  silent.some((m) => m.indexOf("Marketplace") >= 0),
  JSON.stringify(silent)
);

const trigger = makeEl("button");
trigger.setAttribute("aria-haspopup", "dialog");
trigger.setAttribute("aria-expanded", "false");
body.appendChild(trigger);

// 弹窗和里面的导航行只在触发器被点击之后出现。
let modal = null;
trigger.onclick = () => {
  trigger.setAttribute("aria-expanded", "true");
  modal = makeEl("div");
  modal.setAttribute("data-shortcut-modal", "settings");
  const nav = makeEl("nav");
  const list = makeEl("div");
  nav.appendChild(list);
  modal.appendChild(nav);
  for (const entry of settingsEntries) {
    const row = makeEl("button");
    row.className = "navCell";
    row.textContent = typeof entry.options.label === "function" ? entry.options.label() : entry.options.label;
    row.setAttribute("data-lo-row", "1");
    row.setAttribute("data-lo-scope", "settings");
    row.setAttribute("data-lo-id", entry.options.id);
    list.appendChild(row);
  }
  body.appendChild(modal);
};

open("settings", "plugins");
await new Promise((r) => setTimeout(r, 20));

check("step 1 opened the modal", modal !== null);
const pluginsRow = modal && modal.querySelector("[data-lo-id='plugins']");
check("step 2a found the row by data-lo-id", !!pluginsRow);
check("step 2b clicked it", !!pluginsRow && pluginsRow.clicked === 1, pluginsRow && pluginsRow.clicked);

const hiddenRow = modal.querySelector("[data-lo-id='account']");
hiddenRow.setAttribute("data-lo-hidden", "1");

open("settings", "account");
await new Promise((r) => setTimeout(r, 20));

check("hidden row still clicked", hiddenRow.clicked === 1, hiddenRow.clicked);
flushFrames();
check("data-lo-hidden restored after the frame", hiddenRow.hasAttribute("data-lo-hidden"));

// 未打标记的行按文字匹配，文字从台账解析，故该记录必须已在台账中；文字重复时按 id 匹配优先。
settingsEntries.push({ options: { id: "untagged-id", order: 40, label: "Untagged Section" } });
const untagged = makeEl("button");
untagged.textContent = "Untagged Section";
modal.querySelector("div").appendChild(untagged);

open("settings", "untagged-id");
await new Promise((r) => setTimeout(r, 20));
check("untagged row matched by label", untagged.clicked === 1, untagged.clicked);

console.log("right sidebar card route");

// 宿主「开始」页的卡片：行元素是外层包裹盒，真正可点的是里面那颗带 kind 的按钮。
// 投影会把包裹盒标记成 `data-lo-scope="right"` / `data-lo-id="<kind>"`。
const rightList = makeEl("div");
rightList.setAttribute("data-sidebar-right-guide", "true");
const cardBox = makeEl("div");
const cardButton = makeEl("button");
cardButton.setAttribute("data-sidebar-right-guide-entry", "files");
cardBox.appendChild(cardButton);
cardBox.setAttribute("data-lo-row", "1");
cardBox.setAttribute("data-lo-scope", "right");
cardBox.setAttribute("data-lo-id", "files");
rightList.appendChild(cardBox);
body.appendChild(rightList);

// 卡片在屏幕上时直接点宿主那颗按钮：不查任何服务，等于宿主自己动手。
open("right", "files");
check("card on screen is clicked itself", cardButton.clicked === 1, cardButton.clicked);

// 卡片不在屏幕上时退回宿主的 openTab（kind 由投影 id 还原）。
const openedTabs = [];
const baseGet = ctx.get;
ctx.get = function (name) {
  if (name === "sidebarRight") {
    return {
      openTab(kind, options) {
        openedTabs.push({ kind, replaceTab: options && options.replaceTab });
      }
    };
  }
  return baseGet(name);
};
body.removeChild(rightList);

open("right", "files");
check("card off screen falls back to openTab", openedTabs.length === 1 && openedTabs[0].kind === "files", JSON.stringify(openedTabs));
check("openTab replaces the tab", openedTabs.length === 1 && openedTabs[0].replaceTab === true, JSON.stringify(openedTabs));

// 连服务都没有时把右栏展开、等卡片重新画出来再点它（这里让它在一轮轮询后就出现）。
ctx.get = baseGet;
const silentRight = [];
const origWarnRight = console.warn;
console.warn = (msg) => silentRight.push(String(msg));
open("right", "files");
body.appendChild(rightList);
await new Promise((r) => setTimeout(r, 120));
console.warn = origWarnRight;
check("card that comes back is clicked", cardButton.clicked === 2, cardButton.clicked);
check("no failure reported when the card comes back", silentRight.length === 0, JSON.stringify(silentRight));

// 右栏停在这一页之外的页面上：没有「开始」页容器、服务也调不通时，只剩标签条那颗「新标签页」。
// 点它等于宿主自己重开「开始」页，卡片随即画出来，下一轮重试再点卡片。
body.removeChild(rightList);
const addTab = makeEl("button");
addTab.setAttribute("data-dockkit-add-tab", "pane-1");
addTab.onclick = () => {
  body.appendChild(rightList);
};
body.appendChild(addTab);
const silentGuide = [];
console.warn = (msg) => silentGuide.push(String(msg));
open("right", "files");
await new Promise((r) => setTimeout(r, 240));
console.warn = origWarnRight;
check("guide is reopened through the strip control", addTab.clicked === 1, addTab.clicked);
check("card on the reopened guide is clicked", cardButton.clicked === 3, cardButton.clicked);
check("no failure reported after reopening the guide", silentGuide.length === 0, JSON.stringify(silentGuide));

console.log("tabs overflow route");

// 宿主的标签条按宽度只画前几颗（`visibleViewLimit`），排在后面的标签连 DOM 都没有：
// 台账与位置配对都找不到元素，只剩「更多」渲染时登记的宿主选择回调这一条路。
const tabStrip = makeEl("div");
tabStrip.setAttribute("data-conversation-tabs", "");
const firstTab = makeEl("button");
firstTab.setAttribute("role", "tab");
firstTab.textContent = "Context";
tabStrip.appendChild(firstTab);
body.appendChild(tabStrip);

const selectedViews = [];
if (typeof globalThis.__loSetViewOpener !== "function") {
  console.error("FAIL: setViewOpener was not reachable in the bundle scope");
  process.exit(1);
}
globalThis.__loSetViewOpener((id) => selectedViews.push(id));
open("tabs", "fleet");
check(
  "overflowed tab is selected through the host opener",
  selectedViews.length === 1 && selectedViews[0] === "fleet",
  JSON.stringify(selectedViews)
);

// 标签真的在屏幕上时仍然点那一颗按钮本身，不必经过选择回调。
firstTab.setAttribute("data-lo-row", "1");
firstTab.setAttribute("data-lo-scope", "tabs");
firstTab.setAttribute("data-lo-id", "fleet");
open("tabs", "fleet");
check(
  "rendered tab is still clicked itself",
  firstTab.clicked === 1 && selectedViews.length === 1,
  firstTab.clicked + " / " + selectedViews.length
);

console.log(failures === 0 ? "\nNAVIGATE PASS" : "\nNAVIGATE FAIL (" + failures + ")");
process.exit(failures === 0 ? 0 : 1);
