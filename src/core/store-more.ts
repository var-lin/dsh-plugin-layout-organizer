// 「更多」菜单：哪几处位置能收、哪扇菜单归谁、菜单里的自定义顺序。
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
  const key = rowKey(scope, id);
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
  for (i = 0; i < rows.length; i++) out.push(rowKey(rows[i].scope, rows[i].id));
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
