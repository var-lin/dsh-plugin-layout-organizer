/* 插件布局整理客户端包的 headless 冒烟测试：把包放到极简假 DOM/React/ctx 上求值并驱动注册、渲染、拆卸，
   抓拼接式多文件包里标识符未定义这类错误。

   用法：node test/smoke.mjs [path-to-lib/client.js]                                   */

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const file = process.argv[2] || join(dirname(dirname(fileURLToPath(import.meta.url))), "lib", "client.js");

function makeEl(tag) {
  const el = {
    tagName: String(tag).toUpperCase(),
    style: {},
    children: [],
    attributes: {},
    parentNode: null,
    textContent: "",
    className: "",
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
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    closest() {
      return null;
    },
    addEventListener() {},
    removeEventListener() {},
    getBoundingClientRect() {
      return { top: 0, left: 0, right: 200, bottom: 40, width: 200, height: 40 };
    },
    focus() {},
    click() {},
    contains() {
      return false;
    }
  };
  return el;
}

const head = makeEl("head");
const body = makeEl("body");

globalThis.document = {
  head,
  body,
  documentElement: makeEl("html"),
  createElement: makeEl,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener() {},
  removeEventListener() {},
  elementFromPoint: () => null,
  contains: () => false
};

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
  setInterval: (fn, ms) => setInterval(fn, ms),
  clearInterval: (id) => clearInterval(id),
  requestAnimationFrame: (fn) => setTimeout(() => fn(Date.now()), 0),
  cancelAnimationFrame: (id) => clearTimeout(id),
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
globalThis.setTimeout = globalThis.setTimeout;
globalThis.localStorage = globalThis.window.localStorage;

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
  throw new Error("smoke: unexpected require(" + spec + ")");
}

const registrations = [];
const injected = [];
const effects = [];
const subscriptions = [];
const commands = [];

const entries = {
  "sidebar.panellist": [
    { options: { id: "plugins", order: 0, label: "插件" } },
    { options: { id: "schedules", order: 10, label: "自动化任务" } },
    { options: { id: "ssh", order: 20, label: "SSH" } }
  ],
  "settings.section": [
    { options: { id: "account", order: -10, label: "账号与余额" } },
    { options: { id: "general", order: 0, label: "通用设置" } },
    { options: { id: "agent-presets", order: 20, label: "Agent 预设" } },
    { options: { id: "skills-manager", order: 17, label: "技能" } },
    { options: { id: "layout-organizer", order: 35, label: () => "位置整理" } }
  ],
  "sidebar.footer.action": [
    { options: { id: "cordis-panel", order: 0, label: "Cordis" } },
    { options: { id: "remote-web-ui", order: 10, label: "远程" } }
  ],
  "conversation.view": [
    { options: { id: "chat", order: 0, label: "对话" } },
    { options: { id: "trajectory", order: 10, label: "轨迹" } },
    { options: { id: "context", order: 20, label: "上下文" } }
  ]
};

const localeDicts = {};
const ctx = {
  get(name) {
    if (name === "locale") {
      return {
        register(ns, dicts) {
          localeDicts[ns] = dicts;
          return () => {};
        },
        bind(ns) {
          const dicts = localeDicts[ns] || {};
          const flat = dicts.zh || {};
          return (key) => (flat[key] === undefined ? key : flat[key]);
        },
        subscribe: () => () => {},
        getSnapshot: () => ({ locale: "zh" })
      };
    }
    if (name === "shortcuts") {
      return {
        register(command) {
          commands.push(command);
          return () => {};
        }
      };
    }
    if (name === "layout") {
      return { selectPanel() {}, toggleSidebar() {} };
    }
    return undefined;
  },
  effect(fn, label) {
    effects.push({ label, dispose: fn() });
    return () => {};
  },
  on() {},
  slots: {
    register(options, component) {
      registrations.push({ options, component });
      return () => {};
    },
    inject(slot, callback) {
      injected.push(slot);
      callback();
    },
    subscribe(slot, listener) {
      subscriptions.push(slot);
      return () => {};
    },
    entries(slot) {
      return entries[slot] || [];
    },
    entriesOfSlot(slot) {
      return entries[slot] || [];
    },
    snapshot(slot) {
      return {
        type: "slot",
        name: slot,
        occupants: (entries[slot] || []).map((e) => ({
          id: e.options.id,
          order: e.options.order,
          registrant: "mf",
          active: true
        }))
      };
    },
    getVersion() {
      return 1;
    },
    spec() {
      return { kind: "list", scope: "root" };
    }
  }
};

let definition = null;
globalThis.window.__ModuleLoader__ = {
  load(def) {
    definition = def;
  }
};

const source = readFileSync(file, "utf8");
const url = pathToFileURL(file).href;
await import(url + "?t=" + Date.now());

if (!definition) {
  console.error("FAIL: the bundle never called window.__ModuleLoader__.load");
  process.exit(1);
}

const mod = definition.factory(requireStub);
console.log("loaded factory for id:", definition.id);
console.log("inject:", JSON.stringify(mod.inject));

try {
  mod.apply(ctx);
} catch (err) {
  console.error("FAIL: apply() threw:", err && err.stack ? err.stack : err);
  process.exit(1);
}

console.log("effects:", effects.map((e) => e.label).join(" | "));
console.log("slots.inject:", JSON.stringify(injected));
console.log("registrations:", registrations.map((r) => r.options.name + "#" + r.options.id + "@" + r.options.order).join(", "));
console.log("subscriptions:", JSON.stringify(subscriptions));
console.log("shortcut commands:", commands.map((c) => c.id).join(", "));
console.log("locale namespaces:", Object.keys(localeDicts).join(", "));

// 每个注册过的组件渲染一次，暴露渲染体里的毛病。
for (const reg of registrations) {
  if (typeof reg.component !== "function") continue;
  try {
    hookIndex = 0;
    reg.component({});
    console.log("render ok:", reg.options.id);
  } catch (err) {
    console.error("FAIL: rendering " + reg.options.id + " threw:", err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

// 把每个 effect 的清理函数都跑一遍，拆卸路径抛错就判失败。
for (const e of effects) {
  if (typeof e.dispose === "function") {
    try {
      e.dispose();
    } catch (err) {
      console.error("FAIL: teardown of " + e.label + " threw:", err && err.stack ? err.stack : err);
      process.exit(1);
    }
  }
}
console.log("teardown ok");

console.log("SMOKE PASS");
