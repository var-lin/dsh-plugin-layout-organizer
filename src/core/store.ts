// 状态形状见 `src/types/state.ts`（StateOptions / PluginState / StoreHandle 只声明一处，
// 这里引用的就是那几份全局声明）。

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
      // 通用设置里的开关出厂全部打开：新装就有完整能力，想关再自己关。
      allowDragOfficial: true,
      // 要真正混排还需 allowDragOfficial 也打开（见 mixedOrder）。
      mixGroups: true,
      showDivider: true,
      dividers: {},
      showStashLauncher: true,
      separateMore: true,
      collapsed: {},
      launcherSide: LAUNCHER_SIDE_DEFAULT,
      // null 表示「顶栏下方紧跟的位置」；数字表示距窗口顶部的像素距离。
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

// 只收「字符串数组」：顺序表里混进数字或空值会让后续按 key 找位置时错位，且看不出错在哪。
function asStringMap(value: unknown): Record<string, string[]> {
  const source = asObject(value);
  const out: Record<string, string[]> = {};
  const keys = Object.keys(source);
  let i;
  for (i = 0; i < keys.length; i++) {
    const list = source[keys[i]];
    if (!Array.isArray(list)) continue;
    const kept: string[] = [];
    let j;
    for (j = 0; j < list.length; j++) if (typeof list[j] === "string" && list[j]) kept.push(list[j] as string);
    out[keys[i]] = kept;
  }
  return out;
}

/**
 * 清掉「进更多」表里不属于任何可收槽位的键。
 *
 * 键是 `scope:id`，scope 里不含冒号，取第一个冒号前那截比对 `MORE_SCOPES` 即可。
 *
 * @param intoMore 「进更多」状态表，原地删键。
 */
function dropIntoMoreScopes(intoMore: Record<string, boolean>): void {
  const keys = Object.keys(intoMore);
  let i;
  for (i = 0; i < keys.length; i++) {
    const at = keys[i].indexOf(":");
    const scope = at > 0 ? keys[i].slice(0, at) : keys[i];
    if (MORE_SCOPES.indexOf(scope) < 0) delete intoMore[keys[i]];
  }
}

/**
 * 读不出来的内容回退默认值，损坏的键不会把设置页弄死。
 *
 * @param raw 从 localStorage 解析出的原始值，可能缺字段或类型不对。
 * @returns 归一化后的状态：旧版本按字段补齐默认值就地升级，比当前还新的版本整份回退默认值。
 */
function normalizeState(raw: unknown): PluginState {
  const base = defaultState();
  const source = asObject(raw);
  // 旧版本（版本号更小）是升级路径：认识的字段原样保留，新版本才有的字段缺着就取新默认。
  // 只有比当前版本还新的存档才整份丢弃——那是旧版插件读新版状态，字段语义不可信。
  const version = source.version;
  if (typeof version !== "number" || !isFinite(version) || version > STATE_VERSION) {
    if (typeof console !== "undefined" && typeof version === "number") {
      console.warn("[layout-organizer] state version " + version + " is newer than " + STATE_VERSION + ", falling back to defaults");
    }
    return base;
  }

  const options = asObject(source.options);
  // 缺键取新默认（出厂全部打开），有键按存值：升级上来的用户显式关掉的开关不会被强行打开。
  base.options.allowDragOfficial = typeof options.allowDragOfficial === "boolean" ? options.allowDragOfficial : base.options.allowDragOfficial;
  base.options.mixGroups = typeof options.mixGroups === "boolean" ? options.mixGroups : base.options.mixGroups;
  base.options.showDivider = typeof options.showDivider === "boolean" ? options.showDivider : base.options.showDivider;
  // per-scope 分隔线开关：只接受布尔值，缺省视为开。
  base.options.dividers = asBoolMap(options.dividers) as Record<string, boolean>;
  base.options.showStashLauncher = typeof options.showStashLauncher === "boolean" ? options.showStashLauncher : base.options.showStashLauncher;
  base.options.separateMore = typeof options.separateMore === "boolean" ? options.separateMore : base.options.separateMore;
  base.options.collapsed = asBoolMap(options.collapsed) as Record<string, boolean>;
  const launcherSide = options.launcherSide;
  base.options.launcherSide = typeof launcherSide === "string" && LAUNCHER_SIDES.indexOf(launcherSide) >= 0 ? launcherSide : LAUNCHER_SIDE_DEFAULT;
  const launcherY = options.launcherY;
  base.options.launcherY = typeof launcherY === "number" && isFinite(launcherY) ? launcherY : null;
  base.hidden = asBoolMap(source.hidden);
  base.intoMore = asBoolMap(source.intoMore);
  // 设置页导航行不再能收进「更多」（1.3.0 起，见 MORE_SCOPES）：老状态里残留的 settings:* 记录
  // 会一直躺在清单里，顺手清掉。投影那边本来也不会再把它们藏起来（moreScopeOk 为假），
  // 这里只是不让废键越攒越多。
  dropIntoMoreScopes(base.intoMore);
  base.moreOrder = asStringMap(source.moreOrder);
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
    if (text) return normalizeState(JSON.parse(text));
    // 当前键读不到：可能是刚从旧版本升级上来，试一遍旧键。读得出来就升格到当前键并删掉旧键
    // （留着也没人读，只会越攒越多）。旧键坏掉不影响继续找更早的那一个。
    let i;
    for (i = 0; i < LEGACY_STORAGE_KEYS.length; i++) {
      const legacyKey = LEGACY_STORAGE_KEYS[i];
      const legacyText = window.localStorage.getItem(legacyKey);
      if (!legacyText) continue;
      let migrated: PluginState;
      try {
        const parsed = JSON.parse(legacyText) as PluginState | null;
        // 版本比当前还新的旧键（装过更新的实验版）不认，直接跳过：拿它当本版状态会读错字段。
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
    // 存档解析不了（手改坏了、别的版本写的、localStorage 被禁）：退回出厂状态，至少留一条可查的记录。
    if (typeof console !== "undefined") console.warn("[layout-organizer] state read failed:", err);
    return defaultState();
  }
}

// 重渲染信号：投影落地或 store 变更后由 notifyRevision 通知这些订阅者（见 useRevisionTick）。
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

// 落盘有 180ms 防抖，页面被收起或关掉时最后一次拖动很可能还在定时器里，
// 所以在 pagehide 时补一次同步落盘。登记的是每间 store 自己的补写函数：热替换后新旧两间
// 都还在的话，各自写回自己那份状态，不会只剩最后一间。
const __flushStore: Array<() => void> = [];
window.addEventListener("pagehide", function () {
  for (let i = 0; i < __flushStore.length; i++) {
    try {
      __flushStore[i]();
    } catch (err) {
      // 一间写失败不能挡住其他几间
    }
  }
});

function createStore(): StoreHandle {
  let state = readState();
  const listeners: Array<(state: PluginState) => void> = [];
  let timer: ReturnType<typeof setTimeout> | null = null;
  let saveFailed = false;

  function persist(): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      // 隐私模式 / 配额超限：保持内存里的 state 继续可用。只报一次，别每次防抖落盘都刷一行。
      if (!saveFailed) {
        saveFailed = true;
        if (typeof console !== "undefined") console.warn("[layout-organizer] state save failed:", err);
      }
    }
  }

  // 立刻落盘：把防抖定时器里那一次提前兑现（pagehide 走这条）。
  function flush(): void {
    if (timer) {
      window.clearTimeout(timer);
      timer = null;
    }
    persist();
  }
  __flushStore.push(flush);

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
      // 监听器跑完后再通知 React 侧订阅者。
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
  if (official.indexOf(id) >= 0) return "official";
  // 右侧边栏同 kind 的第二张卡 id 是 `kind-2`（见 collectRightUnits），判官方要看基础 kind，
  // 否则第二张「工作区文件」会被当成第三方，拖动、分隔线与改判全错。
  if (scope === "right") {
    const cut = id.lastIndexOf("-");
    if (cut > 0 && /^\d+$/.test(id.slice(cut + 1)) && official.indexOf(id.slice(0, cut)) >= 0) return "official";
  }
  return "third";
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
 * 这一行是否被收进官方「更多」菜单：侧边栏主列表里不占位，改从「更多」菜单点开。
 *
 * 与 `isHidden` 平行但互斥：收纳包是「彻底收起」，进「更多」是「换个入口，仍然可达」。
 * 一行同时被收进两处时以收纳包为准（`applyScope` 先判 hidden 再判本函数）。
 *
 * @param state 当前状态。
 * @param scope 槽位 key。
 * @param id 行 id。
 * @returns 是否已收进「更多」菜单。
 */
function isIntoMore(state: PluginState, scope: string, id: string): boolean {
  return state.intoMore[hiddenKey(scope, id)] === true;
}

/**
 * 这个槽位能不能收进「更多」菜单：只有侧边栏、对话区与右侧边栏那几个列表可以。
 *
 * 设置页导航行不行——设置弹窗里没有「更多」，收走了在设置页里就没有别的入口。
 *
 * @param scope 槽位 key。
 * @returns 可以收进「更多」时为真。
 */
function moreScopeOk(scope: string): boolean {
  if (MORE_SCOPES.indexOf(scope) < 0) return false;
  return moreAvailableFor(moreRegionOf(scope));
}

/**
 * 这一行能不能被收进「更多」：位置本身有「更多」，且它自己不是那扇菜单的入口。
 *
 * 三颗「更多」入口收进去就再也点不开了，所以永远不能收（用户 m01316、m02576#2）；
 * 其余不能收的还有设置页导航（见 `moreScopeOk`）。设置页卡片、收纳包面板与右键菜单
 * 三处都用这一条，免得某处漏判。
 *
 * @param scope 槽位 key。
 * @param id 行 id。
 * @returns 可以收进「更多」时为真。
 */
function canTuckIntoMore(scope: string, id: string): boolean {
  return moreScopeOk(scope) && !isMoreEntry(scope, id);
}

/**
 * 这一版宿主的某一处「更多」菜单在不在。
 *
 * 三处菜单各由不同的槽位驱动，可能只存在其中一处：侧边栏那扇要看 `panelList` 里有没有
 * `aria-haspopup` 的按钮；对话页那扇挂在标签条容器的兄弟位；右侧栏「更多工具」只由
 * `sidebar.right.tab.guide.actions` 驱动（见 collectRightUnits）。按归属分别探测，
 * 才不会出现「只有右栏有菜单，左侧栏的行却被判成能收」这种收走就找不回来的死路。
 *
 * 老宿主上探测为假，于是「进更多」这类按钮干脆不画，也就不会出现「点完行消失、
 * 却没有菜单能把它点回来」的死路（设置页那行按钮、悬浮包那行按钮、右键菜单都走同一道闸门）。
 *
 * @param region `sidebar` / `conversation` / `rightbar`。
 * @returns 该处菜单存在时为真。
 */
const loMoreSeen: Record<string, boolean> = {};
// 没探到时的短缓存：投影每帧对每一行都要问一次，DOM 查询不能真的每行每帧都做一遍。
const loMoreProbe: Record<string, { at: number; ok: boolean }> = {};
const MORE_PROBE_TTL_MS = 250;

function moreAvailableFor(region: string): boolean {
  if (loMoreSeen[region] === true) return true;
  if (typeof document === "undefined" || !document.querySelector) return false;
  const now = Date.now();
  const memo = loMoreProbe[region];
  if (memo && now - memo.at < MORE_PROBE_TTL_MS) return memo.ok;
  let host: Element | null = null;
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
  loMoreProbe[region] = { at: now, ok: ok };
  return ok;
}

/**
 * 宿主有没有任何一处「更多」菜单：设置页的菜单分隔线开关、行上的「进更多」按钮按它显示。
 *
 * @returns 任意一处存在时为真。
 */
function moreAvailable(): boolean {
  return moreAvailableFor("sidebar") || moreAvailableFor("conversation") || moreAvailableFor("rightbar");
}

/**
 * 记下某一处「更多」确实存在——投影认领到那颗按钮时调用。
 *
 * 认到一次之后本会话内不再探测那一处：DOM 查询每次渲染都做一遍没必要，而菜单不会中途消失。
 *
 * @param region `sidebar` / `conversation` / `rightbar`。
 */
function noteMoreAvailable(region: string): void {
  loMoreSeen[region] = true;
}

/**
 * 一处「更多」菜单归哪边：侧边栏那一处管它自己顶部与底部的按钮（设置页导航不收进任何一处）；
 * 对话那一处管顶部标签与输入框下方；右侧边栏「开始」页那一处管它自己的卡片。
 *
 * @param scope 槽位 key。
 * @returns `sidebar` / `conversation` / `rightbar`。
 */
function moreRegionOf(scope: string): string {
  const home = MORE_SCOPE_HOME[scope];
  return home ? home : MORE_REGIONS[0];
}

/**
 * 一处「更多」菜单这一轮该列出哪些槽位的行。
 *
 * 打开「分开收纳」时按归属分流：侧边栏那处只列侧边栏顶部与底部的按钮，对话那处只列顶部标签与
 * 输入框下方的行，右侧栏「更多工具」只列它自己「开始」页的卡片。关闭时三处共用一份清单——
 * 收进任何一处，三处都列得出来。
 *
 * @param state 当前状态。
 * @param region `sidebar` / `conversation` / `rightbar`。
 * @returns 该菜单该读的槽位 key 列表。
 */
function moreScopesIn(state: PluginState, region: string): string[] {
  if (!moreAvailableFor(region)) return [];
  if (state.options.separateMore !== true) return MORE_SCOPES.slice();
  const out: string[] = [];
  let i;
  for (i = 0; i < MORE_SCOPES.length; i++) if (moreRegionOf(MORE_SCOPES[i]) === region) out.push(MORE_SCOPES[i]);
  return out;
}

/**
 * 「更多」菜单里画不画官方 / 第三方分隔线——与页面上的总开关各管各的。
 *
 * @param state 当前状态。
 * @returns 菜单内画线时为真。
 */
function moreDividerOn(state: PluginState): boolean {
  // 和页面上的线共用一套开关：总开关关着时菜单里也不画，分项里的 `more` 单独管这一处。
  if (state.options.showDivider !== true) return false;
  const map = state.options.dividers || {};
  return map.more !== false;
}

/**
 * 把一行收进「更多」菜单的待选清单里（`moreRowsIn` 三轮补充共用）。
 *
 * 挡的是三颗「更多」入口（它们自己就是打开菜单的开关），不是所有合成行：
 * 输入框下方的 `context-meter` 也是合成行，拿 `isSynthetic` 当闸门会让它收进「更多」后两边都找不到（用户 m04681）。
 *
 * @param state 当前状态。
 * @param picked 待选清单，原地追加。
 * @param seen 已收录的 `scope:id`，原地登记。
 * @param scope 行所在槽位。
 * @param id 行 id。
 */
function pickMoreRow(
  state: PluginState,
  picked: Array<{ scope: string; id: string }>,
  seen: Record<string, boolean>,
  scope: string,
  id: string
): void {
  const key = scope + ":" + id;
  if (seen[key]) return;
  if (isMoreEntry(scope, id)) return;
  if (!isIntoMore(state, scope, id)) return;
  seen[key] = true;
  picked.push({ scope: scope, id: id });
}

/**
 * 一处「更多」菜单要列的行。
 *
 * 判据是**状态里收进来了**（`intoMore`），不是「这一轮投影到屏幕上了」：设置页的行只有
 * 打开设置弹窗时才投影得到，按投影筛会让「在设置页收进更多」看起来毫无效果。
 * 收进来的行即使当前不在屏幕上，菜单里也照样列出来——它本来就该在那儿。
 *
 * 排序：先按 `moreOrder[region]` 里记过的顺序，没记过的按「槽位顺序 → 页面顺序」补在后面。
 *
 * @param state 当前状态。
 * @param region `sidebar` 或 `conversation`。
 * @returns 排好的 `{ scope, id }` 列表。
 */
function moreRowsIn(state: PluginState, region: string): Array<{ scope: string; id: string }> {
  const scopes = moreScopesIn(state, region);
  const allowed: Record<string, boolean> = {};
  const picked: Array<{ scope: string; id: string }> = [];
  const seen: Record<string, boolean> = {};
  let i;
  let j;
  for (i = 0; i < scopes.length; i++) allowed[scopes[i]] = true;
  // 第一轮：状态里记过的菜单顺序。键是 `scope:id`。
  const saved = moreOrderOf(state, region);
  for (i = 0; i < saved.length; i++) {
    const key = saved[i];
    const cut = key ? key.indexOf(":") : -1;
    if (cut <= 0) continue;
    const scope = key.slice(0, cut);
    const id = key.slice(cut + 1);
    if (!id || !allowed[scope] || seen[key]) continue;
    if (!isIntoMore(state, scope, id)) continue;
    seen[key] = true;
    picked.push({ scope: scope, id: id });
  }

  // 第二轮：没记过顺序的（新收进来的行）。按槽位顺序、再按页面上的位置补充。
  for (i = 0; i < scopes.length; i++) {
    const scope = scopes[i];
    const ids: string[] = [];
    const order = state.order[scope] || [];
    for (j = 0; j < order.length; j++) ids.push(order[j]);
    const live = liveOrder(scope);
    for (j = 0; j < live.length; j++) if (ids.indexOf(live[j]) < 0) ids.push(live[j]);
    // 还有既不在页面顺序、也不在屏幕上的行（面板没挂载过）：按 id 补最后，保证列得出来。
    const map = state.intoMore;
    const keys = Object.keys(map);
    for (j = 0; j < keys.length; j++) {
      const cut = keys[j].indexOf(":");
      if (cut <= 0) continue;
      if (keys[j].slice(0, cut) !== scope) continue;
      const id = keys[j].slice(cut + 1);
      if (id && ids.indexOf(id) < 0) ids.push(id);
    }
    for (j = 0; j < ids.length; j++) {
      const id = ids[j];
      pickMoreRow(state, picked, seen, scope, id);
    }
  }

  // 第三轮兜底：状态里明明收进来了、却不在上面任何一份清单里的行，按键补在最末。
  // 设置页的行只在自己那一页才投影得到，`liveOrder` 里没有它，上面的补齐就会漏掉——
  // 少了这一步，「在设置页点『进更多』」看起来就毫无效果（用户报过）。
  const allKeys = Object.keys(state.intoMore);
  for (i = 0; i < allKeys.length; i++) {
    const key = allKeys[i];
    const cut = key.indexOf(":");
    if (cut <= 0) continue;
    const scope = key.slice(0, cut);
    const id = key.slice(cut + 1);
    if (!id) continue;
    // 兜底也得看归属：不然打开「分开收纳」后，各处菜单都会把别人的行补进来。
    if (!allowed[scope]) continue;
    pickMoreRow(state, picked, seen, scope, id);
  }

  // 不画线时保持上面的顺序；画线时官方整块在前、第三方整块在后，两块的内部顺序都不动。
  if (!moreDividerOn(state)) return picked;
  const official: Array<{ scope: string; id: string }> = [];
  const third: Array<{ scope: string; id: string }> = [];
  for (i = 0; i < picked.length; i++) {
    (kindOf(state, picked[i].scope, picked[i].id) === "official" ? official : third).push(picked[i]);
  }
  return official.concat(third);
}

/**
 * 这扇「更多」菜单里记下来的行顺序。
 *
 * @param state 当前状态。
 * @param region `sidebar` 或 `conversation`。
 * @returns 记过的键序列；没排过时是空数组（各按各的默认顺序画）。
 */
function moreOrderOf(state: PluginState, region: string): string[] {
  return state.moreOrder[region] || [];
}

/**
 * 记下这扇「更多」菜单的新行顺序。
 *
 * @param state 当前状态，原地改写 `moreOrder`。
 * @param region `sidebar` 或 `conversation`。
 * @param keys 从上到下的行身份（见 `PluginState.moreOrder` 的说明）。
 */
function setMoreOrder(state: PluginState, region: string, keys: string[]): void {
  state.moreOrder[region] = keys.slice();
}

/**
 * 这扇「更多」菜单当前的行身份序列（`scope:id`）。
 *
 * 身份而不是 id：同一处菜单里可能同时挂着不同槽位的行（侧边栏与底部都进侧边栏那张菜单），
 * 只给 id 分不清是谁。菜单本身、设置页、右键菜单都按这份序列排位。
 *
 * @param state 当前状态。
 * @param region `sidebar` 或 `conversation`。
 * @returns 从上到下的行身份。
 */
function moreKeysIn(state: PluginState, region: string): string[] {
  const rows = moreRowsIn(state, region);
  const out: string[] = [];
  let i;
  for (i = 0; i < rows.length; i++) out.push(rows[i].scope + ":" + rows[i].id);
  return out;
}

/**
 * 在这扇「更多」菜单里把一行上移或下移一格。
 *
 * 菜单的次序只有 `moreOrder` 一条清单（普通行与宿主那两项动作行共用），所以这里挪一次就够，
 * 拖动与右键菜单两条路都走它。
 *
 * @param store 状态句柄。
 * @param region `sidebar` 或 `conversation`。
 * @param key 行身份（`scope:id`）。
 * @param delta `-1` 上移、`1` 下移。
 */
function moveMoreRow(store: StoreHandle, region: string, key: string, delta: number): void {
  const keys = moreKeysIn(store.get(), region);
  const from = keys.indexOf(key);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= keys.length) return;
  keys.splice(from, 1);
  keys.splice(to, 0, key);
  store.update(function (state: PluginState): void {
    setMoreOrder(state, region, keys);
  });
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
  const keys = Object.keys(state.hidden).concat(Object.keys(state.intoMore));
  let i;
  for (i = 0; i < keys.length; i++) if (keys[i].indexOf(scope + ":") === 0) return true;
  return false;
}

/**
 * 整个状态是否已经不是出厂值——「重置所有配置」是否还有事可做。
 *
 * 只比对 `resetAll` 真正会改写的那五样（order / kinds / hidden / intoMore / moreOrder / options）；
 * `stashSort` 不在其中，它是收纳包的排序偏好，重置配置不会动它，因此也不该让它把按钮点亮。
 * 这份清单必须与 `settings-page` 里 `onConfirm` 实际写回的字段一一对应，否则按钮会常亮却点不动。
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
    JSON.stringify(state.intoMore) !== JSON.stringify(fresh.intoMore) ||
    JSON.stringify(state.moreOrder) !== JSON.stringify(fresh.moreOrder) ||
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

/**
 * 记下某个可折叠块的展开 / 折叠状态。
 *
 * 键用稳定的标识（`card:<scope>`、`stash:<mode>:<group>`、选项名），不用标题文案——换语言或
 * 改文案时状态才跟着走。设置页卡片、选项分组与收纳包分组共用这一份（options.collapsed）。
 *
 * @param state 待修改的状态。
 * @param key 折叠键。
 * @param collapsed 折起来为 true。
 */
function setCollapsed(state: PluginState, key: string, collapsed: boolean): void {
  if (!state.options.collapsed) state.options.collapsed = {};
  state.options.collapsed[key] = collapsed;
}

function setHidden(state: PluginState, scope: string, id: string, hidden: boolean): void {
  const key = hiddenKey(scope, id);
  if (hidden) {
    state.hidden[key] = true;
    // 两处收纳互斥：进了收纳包就不该再留在「更多」里，否则恢复时不知道以哪边为准。
    delete state.intoMore[key];
  } else delete state.hidden[key];
}

/**
 * 把一行收进 / 移出官方「更多」菜单。
 *
 * 两处收纳互斥：收进「更多」时顺手清掉收纳包里的同名键，反之亦然（见 `setHidden`）。
 * 否则同一行会同时挂在两处，恢复时不知道以哪边为准。
 *
 * @param state 当前状态，原地改写 `intoMore`。
 * @param scope 槽位 key。
 * @param id 行 id。
 * @param into 是否收进「更多」。
 */
function setIntoMore(state: PluginState, scope: string, id: string, into: boolean): void {
  const key = hiddenKey(scope, id);
  if (into) {
    state.intoMore[key] = true;
    delete state.hidden[key];
  } else {
    delete state.intoMore[key];
  }
}

function writeOrder(state: PluginState, scope: string, ids: string[]): void {
  state.order[scope] = ids.slice();
}

/**
 * 在行自己所属的组内移动一行。
 *
 * 保存的顺序只有拖动才会写（见 `writeOrder`）；全新配置下 `order` 是空的，
 * 若只认它，设置页的 ↑ / ↓ 与右键菜单的上移 / 下移看着可点、点下去毫无反应。
 * 因此保存顺序里找不到这一行时，以屏幕上的当前顺序为基准（`liveOrder`，去掉已收纳的行）。
 *
 * @param state 当前状态，命中的话原地改写 `order`。
 * @param scope 槽位 key。
 * @param id 要移动的行。
 * @param delta 方向：正数向后，其余向前。
 * @param group 限定组（"official" / "third"）；不传表示整条 scope 一个组。
 * @returns 是否真的移动了；false 表示行不在列表里或该方向没有同组行。
 */
function moveRow(state: PluginState, scope: string, id: string, delta: number, group?: string): boolean {
  const saved = state.order[scope] || [];
  let list = saved.slice();
  if (list.indexOf(id) < 0) {
    const live = liveOrder(scope);
    list = [];
    for (let i = 0; i < live.length; i++) if (!isHidden(state, scope, live[i])) list.push(live[i]);
  }
  const from = list.indexOf(id);
  if (from < 0) return false;
  let target = -1;
  const step = delta > 0 ? 1 : -1;
  let cursor = from + step;
  while (cursor >= 0 && cursor < list.length) {
    const candidate = list[cursor];
    // 钉在末尾的「更多」入口与已收进「更多」的行都不是可换位的邻居：投影会把「更多」
    // 排回末尾、收进「更多」的行根本不在主列表里，换过去界面上什么也不会发生。
    if (isMoreEntry(scope, candidate) || (moreScopeOk(scope) && isIntoMore(state, scope, candidate))) {
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
  const more = Object.keys(state.intoMore);
  for (i = 0; i < more.length; i++) if (more[i].indexOf(scope + ":") === 0) delete state.intoMore[more[i]];
  // 「更多」菜单里这条 scope 的行也一起回默认位置：只摘掉它自己的键，别整份 region 清空
  // ——footer 与 sidebar 共用 `sidebar` 这扇菜单，整份清掉会连侧边栏「更多」的顺序一起丢。
  // 设置页导航不进任何一处「更多」（见 MORE_SCOPES），不必动。
  if (MORE_SCOPES.indexOf(scope) >= 0) {
    const region = moreRegionOf(scope);
    const order = state.moreOrder[region] || [];
    const kept: string[] = [];
    for (i = 0; i < order.length; i++) if (order[i].indexOf(scope + ":") !== 0) kept.push(order[i]);
    if (kept.length !== order.length) state.moreOrder[region] = kept;
  }
}

function restoreAllHidden(state: PluginState): void {
  state.hidden = {};
}