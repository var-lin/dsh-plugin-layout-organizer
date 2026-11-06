// 会话内的「新按钮」表与用户命名的布局预设。
/**
 * 「这一轮新冒出来的按钮」，只存在内存里：刷新就没了。
 *
 * 为什么不进 store：判新要拿「这一轮投影到的东西」跟 `known` 对，而 `known` 只记见过的 id，
 * 新与不新是相对「上一次看到」的瞬时结论；写进状态反而要在每次投影时回写一遍。
 */
const __fresh: Record<string, boolean> = {};

/**
 * 这一轮的行里有没有从没见过的。
 *
 * @param state 当前状态（读 `known`）。
 * @param scope 槽位 key。
 * @param ids 这一轮真正标记到的行。
 * @returns 只要有一个 id 不在 `known` 里就是 true。
 */
function hasUnknownRows(state: PluginState, scope: string, ids: string[]): boolean {
  const known = state.known || {};
  for (let i = 0; i < ids.length; i++) if (known[rowKey(scope, ids[i])] === undefined) return true;
  return false;
}

/**
 * 把这一轮的行记进 `known`，并把新出现的挂上「新」标记。
 *
 * @param state 当前状态，原地改写 `known`。
 * @param scope 槽位 key。
 * @param ids 这一轮真正标记到的行。
 * @param seed 首次运行（`known` 整份为空）：只登记不标红，不能把现有按钮一次全标成「新」。
 * @returns 是否真的记下了新 id。
 */
function noteKnownRows(state: PluginState, scope: string, ids: string[], seed: boolean): boolean {
  if (!state.known) state.known = {};
  const now = Date.now();
  let added = false;
  for (let i = 0; i < ids.length; i++) {
    const key = rowKey(scope, ids[i]);
    if (state.known[key] !== undefined) continue;
    state.known[key] = now;
    if (!seed) __fresh[key] = true;
    added = true;
  }
  return added;
}

function isFreshRow(scope: string, id: string): boolean {
  return __fresh[rowKey(scope, id)] === true;
}

function clearFreshRow(scope: string, id: string): void {
  delete __fresh[rowKey(scope, id)];
}

function clearAllFresh(): void {
  const keys = Object.keys(__fresh);
  for (let i = 0; i < keys.length; i++) delete __fresh[keys[i]];
}

function freshCount(): number {
  return Object.keys(__fresh).length;
}

/**
 * 存下来的预设名（按名字排序，列表才稳定）。
 *
 * 内置的「默认」不在这里：它不是存下来的一份，而是当前布局的镜像（见 `defaultPreset`）。
 */
function presetNames(state: PluginState): string[] {
  const map = state.presets || {};
  return Object.keys(map).sort();
}

/**
 * 把当前的布局抄成一份预设快照。
 *
 * 只抄「用户排出来的东西」：顺序、分类、收起、进更多、菜单内顺序。通用设置里的开关、
 * 启动器位置、快捷键都不算布局——换一套预设时把它们一起换掉会让人莫名其妙。
 *
 * @param state 当前状态。
 * @returns 深拷贝过的快照，可直接塞进 `presets` 或 `defaultPreset`。
 */
function capturePreset(state: PluginState): PresetData {
  const order: Record<string, string[]> = {};
  let i;
  for (i = 0; i < SCOPES.length; i++) {
    const scope = SCOPES[i].key;
    order[scope] = (state.order[scope] || []).slice();
  }
  const kinds: Record<string, string> = {};
  const kindKeys = Object.keys(state.kinds || {});
  for (i = 0; i < kindKeys.length; i++) kinds[kindKeys[i]] = state.kinds[kindKeys[i]];
  const hidden: Record<string, boolean> = {};
  const hiddenKeys = Object.keys(state.hidden || {});
  for (i = 0; i < hiddenKeys.length; i++) hidden[hiddenKeys[i]] = true;
  const intoMore: Record<string, boolean> = {};
  const moreKeys = Object.keys(state.intoMore || {});
  for (i = 0; i < moreKeys.length; i++) intoMore[moreKeys[i]] = true;
  const moreOrder: Record<string, string[]> = {};
  const regions = Object.keys(state.moreOrder || {});
  for (i = 0; i < regions.length; i++) moreOrder[regions[i]] = state.moreOrder[regions[i]].slice();
  return {
    order: order,
    kinds: kinds,
    hidden: hidden,
    intoMore: intoMore,
    moreOrder: moreOrder,
    savedAt: Date.now()
  };
}

/**
 * 把一份预设写回状态（原地改写这五张表）。
 *
 * @param state 当前状态。
 * @param preset 要应用的快照。
 */
function applyPreset(state: PluginState, preset: PresetData): void {
  const order: Record<string, string[]> = {};
  let i;
  for (i = 0; i < SCOPES.length; i++) {
    const scope = SCOPES[i].key;
    order[scope] = (preset.order[scope] || []).slice();
  }
  state.order = order;
  state.kinds = Object.assign({}, preset.kinds);
  state.hidden = Object.assign({}, preset.hidden);
  state.intoMore = Object.assign({}, preset.intoMore);
  const moreOrder: Record<string, string[]> = {};
  const regions = Object.keys(preset.moreOrder || {});
  for (i = 0; i < regions.length; i++) moreOrder[regions[i]] = preset.moreOrder[regions[i]].slice();
  state.moreOrder = moreOrder;
}
