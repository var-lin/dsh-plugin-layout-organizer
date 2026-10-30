// 测试共用的假 DOM 与模块加载器：没有任何 npm 依赖，所有桩都在这里手写。
// smoke.mjs 用它保持原有冒烟行为，gestures.mjs 用同一套桩真的派发指针事件。
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** 默认被测产物；命令行第一个参数可覆盖（smoke.mjs 一直支持这种用法）。 */
export function resolveClientFile() {
  return process.argv[2] || path.join(HERE, "..", "lib", "client.js");
}

// ---------------------------------------------------------------- 选择器

function splitTop(selector) {
  const out = [];
  let depth = 0;
  let buf = "";
  for (const ch of selector) {
    if (ch === "[") depth++;
    else if (ch === "]") depth--;
    if (ch === "," && depth === 0) {
      out.push(buf);
      buf = "";
      continue;
    }
    buf += ch;
  }
  out.push(buf);
  return out.map(function (part) { return part.trim(); }).filter(Boolean);
}

const COMPOUND = /(:scope)|([A-Za-z][\w-]*)|\.([\w-]+)|#([\w-]+)|\[\s*([\w-]+)\s*(?:([*^$]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]\s]*)))?\s*\]/g;

function parseCompoundToken(token) {
  const spec = { scope: false, tag: "", id: "", classes: [], attrs: [] };
  COMPOUND.lastIndex = 0;
  let m;
  while ((m = COMPOUND.exec(token))) {
    if (m[1]) spec.scope = true;
    else if (m[2]) spec.tag = m[2].toLowerCase();
    else if (m[3]) spec.classes.push(m[3]);
    else if (m[4]) spec.id = m[4];
    else if (m[5]) {
      const value = m[7] !== undefined ? m[7] : m[8] !== undefined ? m[8] : m[9];
      spec.attrs.push({ name: m[5], op: m[6] || "", value: value === undefined ? "" : value });
    }
  }
  return spec;
}

function parseSelector(selector) {
  return splitTop(selector).map(function (part) {
    const raw = part.replace(/>/g, " > ").trim().split(/\s+/);
    return raw.filter(function (token) { return token !== ""; }).map(function (token) {
      return token === ">" ? ">" : parseCompoundToken(token);
    });
  });
}

function matchCompound(el, spec, scopeEl) {
  if (!(el instanceof Element)) return false;
  if (spec.scope) return el === scopeEl;
  if (spec.tag && el.tagName.toLowerCase() !== spec.tag) return false;
  if (spec.id && el.getAttribute("id") !== spec.id) return false;
  for (const cls of spec.classes) if (!el.classList.contains(cls)) return false;
  for (const attr of spec.attrs) {
    const actual = el.getAttribute(attr.name);
    if (actual === null) return false;
    if (!attr.op) continue;
    if (attr.op === "=" && actual !== attr.value) return false;
    if (attr.op === "*=" && actual.indexOf(attr.value) < 0) return false;
    if (attr.op === "^=" && actual.indexOf(attr.value) !== 0) return false;
    if (attr.op === "$=" && actual.slice(-attr.value.length) !== attr.value) return false;
  }
  return true;
}

function matchPath(el, tokens, scopeEl) {
  let i = tokens.length - 1;
  if (i < 0 || !matchCompound(el, tokens[i], scopeEl)) return false;
  i--;
  while (i >= 0) {
    if (tokens[i] === ">") {
      i--;
      if (i < 0) return false;
      el = el.parentNode;
      if (!(el instanceof Element) || !matchCompound(el, tokens[i], scopeEl)) return false;
      i--;
      continue;
    }
    let p = el.parentNode;
    let found = false;
    while (p instanceof Element) {
      if (matchCompound(p, tokens[i], scopeEl)) {
        found = true;
        el = p;
        break;
      }
      p = p.parentNode;
    }
    if (!found) return false;
    i--;
  }
  return true;
}

function selectAll(root, selector, scopeEl) {
  const groups = parseSelector(selector);
  const out = [];
  const visit = function (node) {
    for (const child of node.children) {
      for (const tokens of groups) if (matchPath(child, tokens, scopeEl)) { out.push(child); break; }
      visit(child);
    }
  };
  visit(root);
  return out;
}

function selectFirst(root, selector, scopeEl) {
  const all = selectAll(root, selector, scopeEl);
  return all.length ? all[0] : null;
}

// ---------------------------------------------------------------- 元素

let envSeed = 0;

class ClassList {
  constructor(el) { this.el = el; }
  get set() {
    const raw = this.el.getAttribute("class") || "";
    return new Set(raw.split(/\s+/).filter(Boolean));
  }
  _write(set) { this.el.setAttribute("class", Array.from(set).join(" ")); }
  add(name) { const s = this.set; s.add(name); this._write(s); }
  remove(name) { const s = this.set; s.delete(name); this._write(s); }
  contains(name) { return this.set.has(name); }
  toggle(name, force) {
    const on = force === undefined ? !this.contains(name) : force === true;
    if (on) this.add(name); else this.remove(name);
    return on;
  }
  toString() { return Array.from(this.set).join(" "); }
}

class Element {
  constructor(tag, env) {
    this.tagName = String(tag).toUpperCase();
    this.ownerEnv = env;
    this.attrs = new Map();
    this.children = [];
    this.parentNode = null;
    this.style = {};
    this.textContent = "";
    this.listeners = new Map();
    this._rect = { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
    this.classList = new ClassList(this);
  }
  get ownerDocument() { return this.ownerEnv.document; }
  get parentElement() { return this.parentNode; }
  get className() { return this.getAttribute("class") || ""; }
  set className(value) { this.setAttribute("class", String(value)); }
  get offsetWidth() { return this.getBoundingClientRect().width; }
  get offsetHeight() { return this.getBoundingClientRect().height; }
  getAttribute(name) { return this.attrs.has(name) ? this.attrs.get(name) : null; }
  setAttribute(name, value) { this.attrs.set(name, String(value)); }
  removeAttribute(name) { this.attrs.delete(name); }
  hasAttribute(name) { return this.attrs.has(name); }
  getBoundingClientRect() { return this._rect; }
  setRect(rect) {
    this._rect = {
      left: rect.left, top: rect.top, width: rect.width, height: rect.height,
      right: rect.left + rect.width, bottom: rect.top + rect.height
    };
    return this;
  }
  appendChild(node) {
    if (node.parentNode) node.parentNode.removeChild(node);
    node.parentNode = this;
    this.children.push(node);
    return node;
  }
  insertBefore(node, ref) {
    const at = ref ? this.children.indexOf(ref) : -1;
    if (node.parentNode) node.parentNode.removeChild(node);
    node.parentNode = this;
    if (at < 0) this.children.push(node); else this.children.splice(at, 0, node);
    return node;
  }
  removeChild(node) {
    const at = this.children.indexOf(node);
    if (at >= 0) this.children.splice(at, 1);
    node.parentNode = null;
    return node;
  }
  remove() { if (this.parentNode) this.parentNode.removeChild(this); }
  contains(node) {
    let p = node;
    while (p) {
      if (p === this) return true;
      p = p.parentNode;
    }
    return false;
  }
  closest(selector) {
    let node = this;
    while (node instanceof Element) {
      if (node.matches(selector)) return node;
      node = node.parentNode;
    }
    return null;
  }
  matches(selector) {
    return parseSelector(selector).some((tokens) => matchPath(this, tokens, this));
  }
  querySelector(selector) { return selectFirst(this, selector, this); }
  querySelectorAll(selector) { return selectAll(this, selector, this); }
  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    if (typeof fn === "function") this.listeners.get(type).add(fn);
  }
  removeEventListener(type, fn) {
    const set = this.listeners.get(type);
    if (set) set.delete(fn);
  }
  dispatchTo(type, event) {
    const set = this.listeners.get(type);
    if (!set) return;
    for (const fn of Array.from(set)) fn.call(this, event);
  }
  focus() {}
  blur() {}
  click() { this.ownerEnv.dispatch("click", this); }
}

// ---------------------------------------------------------------- 环境

function makeStorage(seed) {
  const map = new Map();
  if (seed && typeof seed === "object") for (const key of Object.keys(seed)) map.set(key, seed[key]);
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); },
    clear() { map.clear(); },
    key(index) { return Array.from(map.keys())[index] || null; },
    get length() { return map.size; }
  };
}

function makeEvent(type, target, init) {
  const event = {
    type,
    target,
    currentTarget: null,
    clientX: 0,
    clientY: 0,
    button: 0,
    defaultPrevented: false,
    propagationStopped: false,
    preventDefault() { event.defaultPrevented = true; },
    stopPropagation() { event.propagationStopped = true; },
    stopImmediatePropagation() { event.propagationStopped = true; }
  };
  if (init) for (const key of Object.keys(init)) event[key] = init[key];
  return event;
}

/**
 * 造一份全新的假宿主。
 *
 * @param {{seed?: Record<string, string>}} options localStorage 预置内容。
 * @returns 环境对象：window / document / body / el() / dispatch() / flushFrames() 等。
 */
export function createEnv(options) {
  const opts = options || {};
  const env = { id: ++envSeed, registrations: [], effects: [], frames: [], timers: new Map(), timerSeq: 0 };
  const doc = { listeners: new Map() };
  const win = { listeners: new Map() };
  const html = new Element("html", env);
  const head = new Element("head", env);
  const body = new Element("body", env);
  html.appendChild(head);
  html.appendChild(body);

  env.documentElement = html;
  env.body = body;
  env.head = head;

  const document = {
    documentElement: html,
    head,
    body,
    readyState: "complete",
    createElement(tag) { return new Element(tag, env); },
    createTextNode(text) { const el = new Element("#text", env); el.textContent = String(text); return el; },
    querySelector(selector) { return selectFirst(html, selector, html); },
    querySelectorAll(selector) { return selectAll(html, selector, html); },
    getElementById(id) { return selectFirst(html, "#" + id, html); },
    contains(node) { return html.contains(node); },
    elementFromPoint(x, y) { return env.topAt(x, y); },
    elementsFromPoint(x, y) { const top = env.topAt(x, y); return top ? [top] : []; },
    addEventListener(type, fn) { if (!doc.listeners.has(type)) doc.listeners.set(type, new Set()); if (typeof fn === "function") doc.listeners.get(type).add(fn); },
    removeEventListener(type, fn) { const set = doc.listeners.get(type); if (set) set.delete(fn); },
    dispatchTo(type, event) { const set = doc.listeners.get(type); if (set) for (const fn of Array.from(set)) fn.call(document, event); }
  };
  env.document = document;

  const windowObj = {
    document,
    innerWidth: 1440,
    innerHeight: 900,
    devicePixelRatio: 1,
    localStorage: makeStorage(opts.seed),
    addEventListener(type, fn) { if (!win.listeners.has(type)) win.listeners.set(type, new Set()); if (typeof fn === "function") win.listeners.get(type).add(fn); },
    removeEventListener(type, fn) { const set = win.listeners.get(type); if (set) set.delete(fn); },
    dispatchTo(type, event) { const set = win.listeners.get(type); if (set) for (const fn of Array.from(set)) fn.call(windowObj, event); },
    setTimeout(fn) { const id = ++env.timerSeq; env.timers.set(id, fn); return id; },
    clearTimeout(id) { env.timers.delete(id); },
    setInterval(fn) { return windowObj.setTimeout(fn); },
    clearInterval(id) { env.timers.delete(id); },
    requestAnimationFrame(fn) { const id = ++env.timerSeq; env.frames.push({ id, fn }); return id; },
    cancelAnimationFrame(id) {
      const at = env.frames.findIndex(function (frame) { return frame.id === id; });
      if (at >= 0) env.frames.splice(at, 1);
    },
    matchMedia() { return { matches: false, addEventListener() {}, removeEventListener() {} }; },
    getComputedStyle(el) { return { display: (el && el.ownerEnv.displayOverride) || "flex", getPropertyValue() { return ""; } }; },
    MutationObserver: class { observe() {} disconnect() {} takeRecords() { return []; } }
  };
  env.window = windowObj;
  env.localStorage = windowObj.localStorage;

  // 宿主 ctx 桩：槽位注册照收，effect 立即执行（与冒烟测试一致）。
  let currentSlot = "";
  env.injectedSlots = [];
  env.slotEntries = {};
  env.subscriptions = [];
  env.commands = [];
  env.localeDicts = {};
  env.effectLog = [];
  const slots = {
    register(spec, component) {
      const rec = { slot: currentSlot || (spec && spec.name) || "", spec: spec || {}, component };
      env.registrations.push(rec);
      return function () { rec.disposed = true; };
    },
    inject(slot, callback) {
      env.injectedSlots.push(slot);
      const prev = currentSlot;
      currentSlot = slot;
      try { return callback(); } finally { currentSlot = prev; }
    },
    subscribe(slot) { env.subscriptions.push(slot); return function () {}; },
    entries(slot) { return env.slotEntries[slot] || []; },
    entriesOfSlot(slot) { return env.slotEntries[slot] || []; },
    snapshot(slot) { return { type: "slot", name: slot, occupants: (env.slotEntries[slot] || []).map(function (e) { return { id: e.options && e.options.id, order: e.options && e.options.order, registrant: "mf", active: true }; }) }; },
    getVersion() { return 0; },
    spec() { return null; },
    count() { return env.registrations.length; }
  };
  const localeApi = {
    register(ns, dicts) {
      env.localeDicts[ns] = dicts || {};
      return function () {};
    },
    bind(ns) {
      const flat = (env.localeDicts[ns] || {}).zh || {};
      return function (key) {
        return flat[key] === undefined ? String(key) : flat[key];
      };
    },
    current() { return "zh"; }
  };
  const shortcutsApi = {
    register(command) {
      env.commands.push(command);
      return function () {};
    }
  };
  env.ctx = {
    slots,
    effect(fn, label) {
      const dispose = fn();
      env.effectLog.push({ label, dispose });
      if (typeof dispose === "function") env.effects.push(dispose);
    },
    get(name) {
      if (name === "locale") return localeApi;
      if (name === "shortcuts") return shortcutsApi;
      if (name === "layout") return {};
      return null;
    },
    on() { return function () {}; },
    once() { return function () {}; },
    emit() {}
  };

  env.topAt = function (x, y) {
    let top = null;
    const visit = function (node) {
      for (const child of node.children) {
        const rect = child.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) top = child;
        visit(child);
      }
    };
    visit(html);
    return top;
  };

  env.el = function (tag, attrs, rect) {
    const el = new Element(tag, env);
    if (attrs) for (const key of Object.keys(attrs)) el.setAttribute(key, attrs[key]);
    if (rect) el.setRect(rect);
    return el;
  };

  env.append = function (parent, node) { return parent.appendChild(node); };

  /** 真的派发：window capture → document capture → 目标自己的监听。 */
  env.dispatch = function (type, target, init) {
    const event = makeEvent(type, target, init);
    windowObj.dispatchTo(type, event);
    if (!event.propagationStopped) document.dispatchTo(type, event);
    if (!event.propagationStopped && target instanceof Element) target.dispatchTo(type, event);
    return event;
  };

  env.flushFrames = function (limit) {
    const max = limit || 50;
    let ran = 0;
    while (env.frames.length && ran < max) {
      const frame = env.frames.shift();
      frame.fn(ran);
      ran++;
    }
    return ran;
  };

  env.runTimers = function () {
    const pending = Array.from(env.timers.values());
    env.timers.clear();
    for (const fn of pending) fn();
  };

  env.callComponent = function (component, props, hooks) {
    hookState.list = [];
    hookState.index = 0;
    hookState.runEffects = !hooks || hooks.effects !== "skip";
    return component(props);
  };

  installGlobals(env);
  return env;
}

// ---------------------------------------------------------------- React 桩

const hookState = { list: [], index: 0, runEffects: true };

function hookSlot(init) {
  const at = hookState.index++;
  if (!(at in hookState.list)) hookState.list[at] = typeof init === "function" ? init() : init;
  return at;
}

const ReactStub = {
  Fragment: Symbol.for("react.fragment"),
  createElement(type, props) {
    const children = Array.prototype.slice.call(arguments, 2);
    const merged = {};
    if (props) for (const key of Object.keys(props)) merged[key] = props[key];
    const flat = [];
    for (const child of children) {
      if (Array.isArray(child)) flat.push.apply(flat, child);
      else flat.push(child);
    }
    if (flat.length) merged.children = flat.length === 1 ? flat[0] : flat;
    return { type, props: merged, key: props && props.key !== undefined ? props.key : undefined };
  },
  useState(init) {
    const at = hookSlot(init);
    return [hookState.list[at], function (next) {
      hookState.list[at] = typeof next === "function" ? next(hookState.list[at]) : next;
    }];
  },
  useRef(init) {
    const at = hookSlot({ current: init });
    return hookState.list[at];
  },
  useMemo(fn) {
    const at = hookSlot(function () { return { value: fn() }; });
    return hookState.list[at].value;
  },
  useCallback(fn) { return fn; },
  useEffect(fn) {
    if (hookState.runEffects) {
      const cleanup = fn();
      if (typeof cleanup === "function") envCurrentEffects.push(cleanup);
    }
  },
  useLayoutEffect(fn) { ReactStub.useEffect(fn); }
};

let envCurrentEffects = [];

/** 供测试按需调用的 hook 宿主。 */
export function resetHooks() {
  hookState.list = [];
  hookState.index = 0;
  hookState.runEffects = true;
}

function requireStub(name) {
  if (process.env.LO_DEBUG_REQUIRE) console.log("require(" + name + ")");
  if (name === "react") return ReactStub;
  return {};
}

// ---------------------------------------------------------------- 全局安装

function installGlobals(env) {
  envCurrentEffects = env.effects;
  globalThis.window = env.window;
  globalThis.document = env.document;
  globalThis.Element = Element;
  globalThis.HTMLElement = Element;
  globalThis.localStorage = env.localStorage;
  globalThis.requestAnimationFrame = env.window.requestAnimationFrame;
  globalThis.cancelAnimationFrame = env.window.cancelAnimationFrame;
  globalThis.getComputedStyle = env.window.getComputedStyle;
  globalThis.MutationObserver = env.window.MutationObserver;
  globalThis.React = ReactStub;
}

// ---------------------------------------------------------------- 加载

/**
 * 用 vm 执行构建产物，再取模块工厂。
 *
 * @param {object} env createEnv() 造出来的环境。
 * @returns 模块对象（含 inject / apply）。
 */
export async function loadClient(env) {
  const file = resolveClientFile();
  if (!fs.existsSync(file)) throw new Error("missing client bundle: " + file + " (run node build.mjs first)");
  let definition = null;
  if (env.window.__ModuleLoader__) delete env.window.__ModuleLoader__;
  const code = fs.readFileSync(file, "utf8");
  installGlobals(env);
  env.window.__ModuleLoader__ = {
    load(def) { definition = def; }
  };
  vm.runInThisContext(code, { filename: file });
  if (!definition) throw new Error("bundle did not call window.__ModuleLoader__.load");
  const mod = definition.factory(requireStub);
  mod.__definition = definition;
  return mod;
}

/**
 * 从槽位注册的元素树里找出真正的 store 句柄（不需要给构建产物打探针）。
 *
 * @param {object} env createEnv() 造出来的环境。
 * @returns store 句柄。
 */
export function findStore(env) {
  for (const rec of env.registrations) {
    if (typeof rec.component !== "function") continue;
    let tree;
    try {
      tree = env.callComponent(rec.component, {}, { effects: "skip" });
    } catch (err) {
      continue;
    }
    const found = walkProps(tree, function (node) {
      const store = node.props && node.props.store;
      return store && typeof store.get === "function" && typeof store.update === "function" ? store : null;
    });
    if (found) return found;
  }
  throw new Error("store handle not found in slot registrations");
}

/** 在元素树里深度优先找第一个满足条件的 props 对象，返回该对象本身。 */
function walkProps(node, pick) {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const hit = walkProps(item, pick);
      if (hit) return hit;
    }
    return null;
  }
  if (node.props) {
    const hit = pick(node);
    if (hit) return hit;
    const inner = walkProps(node.props.children, pick);
    if (inner) return inner;
  }
  return null;
}

export { Element, ReactStub };
