// 状态形状见 `src/types/state.ts`。
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
      // 失效的收起记录自动清掉：插件卸载后那条记录除了碍眼没别的用处。
      pruneStash: true,
      separateMore: true,
      collapsed: {},
      gestureStash: DEFAULT_GESTURE_KEYS.slice(),
      gestureMore: DEFAULT_GESTURE_KEYS.slice(),
      // 出厂：左键收起、右键进更多；两行各自可在设置里换（同前缀时不能占同一个键）。
      gestureStashButton: "left",
      gestureMoreButton: "right",
      launcherSide: LAUNCHER_SIDE_DEFAULT,
      // null 表示「顶栏下方紧跟的位置」；数字表示距窗口顶部的像素距离。
      launcherY: null
    },
    order: {},
    kinds: {},
    hidden: {},
    intoMore: {},
    moreOrder: {},
    stashSort: SORT_MODES[0],
    // 已知的行与保存的预设都是「用户自己攒下来的东西」，出厂时是空的。
    known: {},
    presets: {},
    // 出厂停在「默认」这套上，它还没有快照——第一次改动时补（见 update）。
    activePreset: "",
    defaultPreset: null
  };
  let i;
  for (i = 0; i < SCOPES.length; i++) state.order[SCOPES[i].key] = [];
  return state;
}

/**
 * 布尔选项：存档里是显式布尔就用它，否则取出厂值。
 *
 * 升级路径上每条开关都要这么判一次（缺键取新默认、有键按存值），写六遍容易漏掉
 * `typeof === "boolean"` 那一半——漏了就会把字符串 `"false"` 当成真。
 *
 * @param source 存档里的 options 对象。
 * @param key 选项名。
 * @param fallback 出厂值。
 * @returns 该选项的值。
 */
function boolOr(source: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const one = source[key];
  return typeof one === "boolean" ? one : fallback;
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

/**
 * 一张「键 → 值」表：只留下 `keep` 认得的条目。
 *
 * `hidden` / `intoMore` 只认 `true`，`dividers` / `collapsed` 要连 `false` 一起留，
 * 顺序表只收字符串数组、时间戳表只收有限数值——差别全在 keep 里，遍历只有这一份。
 *
 * @param value 存档里的原始对象。
 * @param keep 判定一条值该不该留：返回留下的值，不要时返回 null。
 * @returns 清洗后的表。
 */
function asMap<T>(value: unknown, keep: (one: unknown) => T | null): Record<string, T> {
  const source = asObject(value);
  const out: Record<string, T> = {};
  const keys = Object.keys(source);
  let i;
  for (i = 0; i < keys.length; i++) {
    const kept = keep(source[keys[i]]);
    if (kept !== null) out[keys[i]] = kept;
  }
  return out;
}

function asBoolMap(value: unknown): Record<string, boolean> {
  return asMap<boolean>(value, function (one: unknown): boolean | null {
    return one === true ? true : null;
  });
}

// 只收「字符串数组」：顺序表里混进数字或空值会让后续按 key 找位置时错位，且看不出错在哪。
function asStringMap(value: unknown): Record<string, string[]> {
  return asMap<string[]>(value, function (one: unknown): string[] | null {
    if (!Array.isArray(one)) return null;
    const kept: string[] = [];
    let j;
    for (j = 0; j < one.length; j++) if (typeof one[j] === "string" && one[j]) kept.push(one[j] as string);
    return kept;
  });
}

// 只收显式布尔值，`false` 也要留下：分隔线与折叠状态都是「记下来才生效」的开关，
// 丢掉 false 会让「关掉的那一处」在下次启动时又自己打开（只有 hidden / intoMore 能只收 true）。
function asFlagMap(value: unknown): Record<string, boolean> {
  return asMap<boolean>(value, function (one: unknown): boolean | null {
    return typeof one === "boolean" ? one : null;
  });
}

// 修饰键列表：只认 MODIFIER_KEYS 里的值，去重；一个都不剩说明存档坏了，取出厂值。
function asModifierList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback.slice();
  const kept: string[] = [];
  let i;
  for (i = 0; i < value.length; i++) {
    const one = value[i];
    if (typeof one === "string" && MODIFIER_KEYS.indexOf(one) >= 0 && kept.indexOf(one) < 0) kept.push(one);
  }
  return kept.length > 0 ? kept : fallback.slice();
}

// 时间戳表：记下每个按钮第一次被看见的时刻，用来判「新装的按钮」（见 fresh-rows.ts）。
function asNumberMap(value: unknown): Record<string, number> {
  return asMap<number>(value, function (one: unknown): number | null {
    return typeof one === "number" && isFinite(one) ? one : null;
  });
}

// 只留下认得出形状的预设，坏掉的那几条直接丢掉，免得点「应用」时把状态写成空的。
function asPresets(value: unknown): Record<string, PresetData> {
  const source = asObject(value);
  const out: Record<string, PresetData> = {};
  const names = Object.keys(source);
  let i;
  for (i = 0; i < names.length; i++) {
    const one = asPreset(source[names[i]]);
    if (one) out[names[i]] = one;
  }
  return out;
}

function asPreset(value: unknown): PresetData | null {
  const one = asObject(value);
  if (Object.keys(one).length === 0) return null;
  const savedAt = one.savedAt;
  return {
    order: asStringMap(one.order),
    kinds: asObject(one.kinds) as Record<string, string>,
    hidden: asBoolMap(one.hidden),
    intoMore: asBoolMap(one.intoMore),
    moreOrder: asStringMap(one.moreOrder),
    savedAt: typeof savedAt === "number" && isFinite(savedAt) ? savedAt : 0
  };
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
  base.options.allowDragOfficial = boolOr(options, "allowDragOfficial", base.options.allowDragOfficial);
  base.options.mixGroups = boolOr(options, "mixGroups", base.options.mixGroups);
  base.options.showDivider = boolOr(options, "showDivider", base.options.showDivider);
  // per-scope 分隔线开关：记下来才生效，所以 false 也要留着（否则关掉的线下次启动又回来）。
  base.options.dividers = asFlagMap(options.dividers);
  base.options.showStashLauncher = boolOr(options, "showStashLauncher", base.options.showStashLauncher);
  base.options.pruneStash = boolOr(options, "pruneStash", base.options.pruneStash);
  base.options.separateMore = boolOr(options, "separateMore", base.options.separateMore);
  // 折叠状态同理：展开=false 也要记住，不然每次重开设置页都会自己摊开。
  base.options.collapsed = asFlagMap(options.collapsed);
  base.options.gestureStash = asModifierList(options.gestureStash, base.options.gestureStash);
  base.options.gestureMore = asModifierList(options.gestureMore, base.options.gestureMore);
  // 鼠标键只认 left / right；读不出来的按出厂键位补。
  const stashButton = options.gestureStashButton;
  base.options.gestureStashButton = typeof stashButton === "string" && GESTURE_BUTTONS.indexOf(stashButton) >= 0 ? stashButton : base.options.gestureStashButton;
  const moreButton = options.gestureMoreButton;
  base.options.gestureMoreButton = typeof moreButton === "string" && GESTURE_BUTTONS.indexOf(moreButton) >= 0 ? moreButton : base.options.gestureMoreButton;
  // 两个手势在同一前缀下不能占同一个鼠标键（否则一次点击两件事都想做）：存坏了就恢复默认键位。
  // 前缀按修饰键清单直接比（asModifierList 已按 MODIFIER_KEYS 排序），不依赖界面文案。
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
  // 设置页导航行不再能收进「更多」（1.3.0 起，见 MORE_SCOPES）：老状态里残留的 settings:* 记录
  // 会一直躺在清单里，顺手清掉。投影那边本来也不会再把它们藏起来（moreScopeOk 为假），
  // 这里只是不让废键越攒越多。
  dropIntoMoreScopes(base.intoMore);
  base.moreOrder = asStringMap(source.moreOrder);
  base.kinds = asObject(source.kinds) as Record<string, string>;
  const stashSort = source.stashSort;
  base.stashSort = typeof stashSort === "string" && SORT_MODES.indexOf(stashSort) >= 0 ? stashSort : SORT_MODES[0];
  // 「见过哪些按钮」与预设都是用户自己攒下来的东西，读不出来就当没有，不影响布局本身。
  base.known = asNumberMap(source.known);
  base.presets = asPresets(source.presets);
  // 停在哪套预设上：读不出这套预设就算停在默认（否则「当前这套」会是幽灵，应用按钮全亮着）。
  const active = source.activePreset;
  base.activePreset = typeof active === "string" && active && Object.prototype.hasOwnProperty.call(base.presets, active) ? active : "";
  base.defaultPreset = asPreset(source.defaultPreset);

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
        // DOM 文字 / 图标类名兜底出来的假 id（text: / cls:）不进存档：同名按钮会串行，
        // 换了语言更对不上。老版本把它们写过进去，读的时候顺手清掉（用户 m00254）。
        if (typeof id !== "string" || id.indexOf("text:") === 0 || id.indexOf("cls:") === 0) continue;
        if (clean.indexOf(id) < 0) clean.push(id);
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
