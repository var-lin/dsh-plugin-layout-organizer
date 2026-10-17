interface StateOptions {
  allowDragOfficial: boolean;
  // 允许官方与第三方按钮互相穿插排序。只在 allowDragOfficial 打开时生效，见 mixedOrder。
  mixGroups: boolean;
  // 分隔线总开关。它与 `dividers` 的 AND 结果才是「本 scope 到底画不画」，见 dividerEnabled。
  showDivider: boolean;
  // 每个 scope 各自的分隔线开关。缺省（未设置）视为开：只有显式关掉才关。
  dividers: Record<string, boolean>;
  showStashLauncher: boolean;
  // "有下属行"的折叠状态（键如 allowDragOfficial / showDivider）；缺省视为展开。
  collapsed: Record<string, boolean>;
  launcherSide: string;
  launcherX: number | null;
  launcherY: number | null;
}

interface PluginState {
  version: number;
  options: StateOptions;
  // scope -> 有序 id 列表。没开混合排序时只有第三方那一块的组内顺序算数，官方整块固定排前面；开了混合排序则这份顺序是唯一权威（见 reconcileOrder）。
  order: Record<string, string[]>;
  // "scope:id" -> "official" | "third"。优先于内置白名单。
  kinds: Record<string, string>;
  // "scope:id" -> true。收纳只关乎显示，不会注销任何注册。
  hidden: Record<string, boolean>;
  stashSort: string;
}

interface StoreHandle {
  get(): PluginState;
  subscribe(listener: (state: PluginState) => void): () => void;
  // 修改函数可以原地改（常见情况），也可以返回一个替换用的 state。
  update(mutator: (state: PluginState) => PluginState | void): void;
  replace(next: PluginState): void;
  reset(): void;
}

// 一条被收纳的行，`stashEntries` 就按这个形状报告。
interface StashEntry {
  scope: string;
  id: string;
  key: string;
}

function defaultState(): PluginState {
  const state: PluginState = {
    version: STATE_VERSION,
    options: {
      allowDragOfficial: false,
      // 缺省打开；要真正混排还需 allowDragOfficial 也打开（见 mixedOrder）。
      mixGroups: true,
      showDivider: false,
      dividers: {},
      showStashLauncher: true,
      collapsed: {},
      launcherSide: "right",
      // 横向跟手只落在手势状态里，store 侧不记录拖动中的横坐标；松手后贴左 / 贴右由 launcherSide 决定。
      launcherX: null,
      // null 表示「顶栏下方紧跟的位置」；数字表示距窗口顶部的像素距离。
      launcherY: null
    },
    order: {},
    kinds: {},
    hidden: {},
    stashSort: SORT_MODES[0]
  };
  let i;
  for (i = 0; i < SCOPES.length; i++) state.order[SCOPES[i].key] = [];
  return state;
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asBoolMap(value: unknown): Record<string, boolean> {
  const source = asObject(value);
  const out: Record<string, boolean> = {};
  const keys = Object.keys(source);
  let i;
  for (i = 0; i < keys.length; i++) if (source[keys[i]] === true) out[keys[i]] = true;
  return out;
}

/**
 * 读不出来的内容回退默认值，损坏的键不会把设置页弄死。
 *
 * @param raw 从 localStorage 解析出的原始值，可能缺字段或类型不对。
 * @returns 归一化后的状态：版本对不上就整份回退默认值，其余按字段校验。
 */
function normalizeState(raw: unknown): PluginState {
  const base = defaultState();
  const source = asObject(raw);
  if (source.version !== STATE_VERSION) return base;

  const options = asObject(source.options);
  base.options.allowDragOfficial = options.allowDragOfficial === true;
  // 缺省即打开：老数据里没有这个键。
  base.options.mixGroups = options.mixGroups !== false;
  base.options.showDivider = options.showDivider === true;
  // per-scope 分隔线开关：只接受布尔值，缺省视为开。
  base.options.dividers = asBoolMap(options.dividers) as Record<string, boolean>;
  base.options.showStashLauncher = options.showStashLauncher !== false;
  base.options.collapsed = asBoolMap(options.collapsed) as Record<string, boolean>;
  const launcherSide = options.launcherSide;
  base.options.launcherSide = typeof launcherSide === "string" && LAUNCHER_SIDES.indexOf(launcherSide) >= 0 ? launcherSide : "right";
  const launcherX = options.launcherX;
  base.options.launcherX = typeof launcherX === "number" && isFinite(launcherX) ? launcherX : null;
  const launcherY = options.launcherY;
  base.options.launcherY = typeof launcherY === "number" && isFinite(launcherY) ? launcherY : null;
  base.hidden = asBoolMap(source.hidden);
  base.kinds = asObject(source.kinds) as Record<string, string>;
  const stashSort = source.stashSort;
  base.stashSort = typeof stashSort === "string" && SORT_MODES.indexOf(stashSort) >= 0 ? stashSort : SORT_MODES[0];

  const order = asObject(source.order);
  let i;
  for (i = 0; i < SCOPES.length; i++) {
    const scope = SCOPES[i].key;
    const list: unknown = order[scope];
    if (Array.isArray(list)) {
      const clean: string[] = [];
      let j;
      for (j = 0; j < list.length; j++) {
        const id: unknown = list[j];
        if (typeof id === "string" && clean.indexOf(id) < 0) clean.push(id);
      }
      base.order[scope] = clean;
    }
  }
  return base;
}

function readState(): PluginState {
  try {
    const text = window.localStorage.getItem(STORAGE_KEY);
    if (!text) return defaultState();
    return normalizeState(JSON.parse(text));
  } catch (err) {
    return defaultState();
  }
}

// 修订号在监听器跑完后自增；重渲染由紧随其后的 notifyRevision 通知订阅者驱动（见 useRevisionTick）。
let __storeRevision = 0;
const __revisionListeners: Array<() => void> = [];

function subscribeRevision(fn: () => void): () => void {
  __revisionListeners.push(fn);
  return function () {
    const index = __revisionListeners.indexOf(fn);
    if (index >= 0) __revisionListeners.splice(index, 1);
  };
}

function notifyRevision(): void {
  const snapshot = __revisionListeners.slice();
  let i;
  for (i = 0; i < snapshot.length; i++) {
    try {
      snapshot[i]();
    } catch (err) {
      // 一个坏掉的订阅者不能拖垮其他订阅者
    }
  }
}

/**
 * React 侧的绑定：一个恰好随修订号变化的计数器。
 *
 * @returns 修订计数，每次 notifyRevision 后自增，用作重渲染的触发值。
 */
function useRevisionTick(): number {
  const [tick, setTick] = useState(0);
  useEffect(function () {
    return subscribeRevision(function () {
      setTick(function (value: number) {
        return value + 1;
      });
    });
  }, []);
  return tick;
}

function createStore(): StoreHandle {
  let state = readState();
  const listeners: Array<(state: PluginState) => void> = [];
  let timer: ReturnType<typeof setTimeout> | null = null;

  function persist(): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      // 隐私模式 / 配额超限：保持内存里的 state 继续可用
    }
  }

  function emit(): void {
    const snapshot = listeners.slice();
    let i;
    for (i = 0; i < snapshot.length; i++) {
      try {
        snapshot[i](state);
      } catch (err) {
        // 一个坏掉的订阅者不能拖垮其他订阅者
      }
    }
  }

  return {
    get: function () {
      return state;
    },
    subscribe: function (listener: (state: PluginState) => void) {
      listeners.push(listener);
      return function () {
        const index = listeners.indexOf(listener);
        if (index >= 0) listeners.splice(index, 1);
      };
    },
    update: function (mutator: (state: PluginState) => PluginState | void) {
      const next = mutator(state);
      if (next) state = next;
      emit();
      // 监听器跑完后再自增修订号并通知 React 侧订阅者。
      __storeRevision += 1;
      notifyRevision();
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        timer = null;
        persist();
      }, 180);
    },
    replace: function (next: PluginState) {
      state = next;
      emit();
      persist();
    },
    reset: function () {
      state = defaultState();
      emit();
      persist();
    }
  };
}

function kindOf(state: PluginState, scope: string, id: string): string {
  const manual = state.kinds[scope + ":" + id];
  if (manual === "official" || manual === "third") return manual;
  const official = OFFICIAL_IDS[scope] || [];
  return official.indexOf(id) >= 0 ? "official" : "third";
}

function groupOf(state: PluginState, scope: string, id: string): string {
  return kindOf(state, scope, id) === "official" ? "official" : "third";
}

/**
 * 混合排序要求「允许拖动官方按钮」同时打开，这是唯一判据。
 *
 * @param state 当前状态。
 * @returns 是否按混合排序处理（官方与第三方可互相穿插）。
 */
function mixedOrder(state: PluginState): boolean {
  return state.options.allowDragOfficial === true && state.options.mixGroups === true;
}

function hiddenKey(scope: string, id: string): string {
  return scope + ":" + id;
}

/**
 * 本 scope 画不画分隔线：总开关 AND 本 scope 自己的开关，没写过算开；白名单限定 composer/footer 之外的 scope。
 *
 * @param state 当前状态。
 * @param scope 槽位 key。
 * @returns 该 scope 本轮是否要画分隔线。
 */
function dividerEnabled(state: PluginState, scope: string): boolean {
  if (state.options.showDivider !== true) return false;
  if (DIVIDER_SCOPES.indexOf(scope) < 0) return false;
  const one = state.options.dividers ? state.options.dividers[scope] : undefined;
  return one !== false;
}

function isHidden(state: PluginState, scope: string, id: string): boolean {
  return state.hidden[hiddenKey(scope, id)] === true;
}

/**
 * 官方永远排最前、第三方在后，保存的顺序只决定组内位置；混排打开时保存顺序成为唯一权威，未见过的 id 追在末尾。
 *
 * @param state 当前状态，只读取保存的顺序与分类。
 * @param scope 槽位 key。
 * @param discovered 本轮发现的 id（台账与 DOM 派生）。
 * @returns 可直接用于投影的有序 id 列表。
 */
function reconcileOrder(state: PluginState, scope: string, discovered: string[]): string[] {
  const saved = state.order[scope] || [];
  const known: Record<string, boolean> = {};
  const official: string[] = [];
  const third: string[] = [];
  let i;
  for (i = 0; i < discovered.length; i++) known[discovered[i]] = true;
  if (mixedOrder(state)) {
    const mixed: string[] = [];
    for (i = 0; i < saved.length; i++) if (known[saved[i]]) mixed.push(saved[i]);
    for (i = 0; i < discovered.length; i++) if (saved.indexOf(discovered[i]) < 0) mixed.push(discovered[i]);
    return mixed;
  }
  for (i = 0; i < saved.length; i++) {
    const id = saved[i];
    if (!known[id]) continue;
    (kindOf(state, scope, id) === "official" ? official : third).push(id);
  }
  for (i = 0; i < discovered.length; i++) {
    if (saved.indexOf(discovered[i]) >= 0) continue;
    (kindOf(state, scope, discovered[i]) === "official" ? official : third).push(discovered[i]);
  }
  return official.concat(third);
}

/**
 * 一个 scope 是否有「恢复本组默认顺序」能清掉的东西。
 *
 * `resetScope` 只清两样：本 scope 的保存顺序与收纳记录（分类覆盖刻意保留，那是用户知识不是布局）。
 * 两者都空时按钮无事可做——空卡片上留一个能点的恢复按钮只会让人以为它坏了——因此据此禁用。
 *
 * @param state 当前状态。
 * @param scope 槽位 key。
 * @returns 有保存顺序或有收纳行时为真。
 */
function scopeDirty(state: PluginState, scope: string): boolean {
  if ((state.order[scope] || []).length > 0) return true;
  const keys = Object.keys(state.hidden);
  let i;
  for (i = 0; i < keys.length; i++) if (keys[i].indexOf(scope + ":") === 0) return true;
  return false;
}

/**
 * 整个状态是否已经不是出厂值——「重置所有配置」是否还有事可做。
 *
 * 只比对 `resetAll` 真正会改写的那四样（order / kinds / hidden / options）；`stashSort` 不在其中，
 * 它是收纳包的排序偏好，重置配置不会动它，因此也不该让它把按钮点亮。
 *
 * 键序是确定的，可以直接 `JSON.stringify`：`normalizeState` 按 SCOPES 顺序重建 `order`、按固定字段
 * 顺序重建 `options`，而 `kinds` / `hidden` 的参照物是空对象——只要有键就必然判为有差异。
 *
 * @param state 当前状态。
 * @returns 与出厂状态有差异时为真。
 */
function stateDirty(state: PluginState): boolean {
  const fresh = defaultState();
  return (
    JSON.stringify(state.order) !== JSON.stringify(fresh.order) ||
    JSON.stringify(state.kinds) !== JSON.stringify(fresh.kinds) ||
    JSON.stringify(state.hidden) !== JSON.stringify(fresh.hidden) ||
    JSON.stringify(state.options) !== JSON.stringify(fresh.options)
  );
}

function stashCount(state: PluginState): number {
  return Object.keys(state.hidden).length;
}

function stashEntries(state: PluginState): StashEntry[] {
  const out: StashEntry[] = [];
  const keys = Object.keys(state.hidden);
  let i;
  for (i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (state.hidden[key] !== true) continue;
    const cut = key.indexOf(":");
    if (cut < 0) continue;
    out.push({ scope: key.slice(0, cut), id: key.slice(cut + 1), key: key });
  }
  return out;
}

function setOption(state: PluginState, key: string, value: unknown): void {
  // 没有索引签名，两次断言才落得到 `Record` 上。
  (state.options as unknown as Record<string, unknown>)[key] = value;
}

function setHidden(state: PluginState, scope: string, id: string, hidden: boolean): void {
  const key = hiddenKey(scope, id);
  if (hidden) state.hidden[key] = true;
  else delete state.hidden[key];
}

function writeOrder(state: PluginState, scope: string, ids: string[]): void {
  state.order[scope] = ids.slice();
}

/**
 * 在行自己所属的组内移动一行。
 *
 * @param state 当前状态，命中的话原地改写 `order`。
 * @param scope 槽位 key。
 * @param id 要移动的行。
 * @param delta 方向：正数向后，其余向前。
 * @param group 限定组（"official" / "third"）；不传表示整条 scope 一个组。
 * @returns 是否真的移动了；false 表示行不在列表里或该方向没有同组行。
 */
function moveRow(state: PluginState, scope: string, id: string, delta: number, group?: string): boolean {
  const list = (state.order[scope] || []).slice();
  const from = list.indexOf(id);
  if (from < 0) return false;
  let target = -1;
  const step = delta > 0 ? 1 : -1;
  let cursor = from + step;
  while (cursor >= 0 && cursor < list.length) {
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

/**
 * 恢复一个 scope 的布局：排序归零、收纳清空；分类覆盖会被保留，那是用户知识不是布局。
 *
 * @param state 当前状态，原地改写 `order` 与 `hidden`。
 * @param scope 槽位 key。
 */
function resetScope(state: PluginState, scope: string): void {
  state.order[scope] = [];
  const keys = Object.keys(state.hidden);
  let i;
  for (i = 0; i < keys.length; i++) if (keys[i].indexOf(scope + ":") === 0) delete state.hidden[keys[i]];
}

function restoreAllHidden(state: PluginState): void {
  state.hidden = {};
}