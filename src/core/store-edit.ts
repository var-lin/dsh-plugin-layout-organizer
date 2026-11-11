// 顺序协调与写操作：投影用的有序 id、脏判定、各类 setter、整组恢复。
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
    const stowed: string[] = [];
    for (i = 0; i < discovered.length; i++) {
      const id = discovered[i];
      if (saved.indexOf(id) >= 0) continue;
      // 收起 / 进「更多」的行不是「新行」：混排下追尾会让它一收起就跳到最下面（m00001），
      // 先记下，等其余行落位后贴邻居插回。
      if (isHidden(state, scope, id) || isIntoMoreRow(state, scope, id)) stowed.push(id);
      else mixed.push(id);
    }
    for (i = 0; i < stowed.length; i++) spliceNear(mixed, discovered, stowed[i]);
    return mixed;
  }
  for (i = 0; i < saved.length; i++) {
    const id = saved[i];
    if (!known[id]) continue;
    (kindOf(state, scope, id) === "official" ? official : third).push(id);
  }
  const stowed: string[] = [];
  for (i = 0; i < discovered.length; i++) {
    const id = discovered[i];
    if (saved.indexOf(id) >= 0) continue;
    if (isHidden(state, scope, id) || isIntoMoreRow(state, scope, id)) stowed.push(id);
    else (kindOf(state, scope, id) === "official" ? official : third).push(id);
  }
  // 分组排序下同样别把收起的行当成新行甩到组末：贴着发现顺序里的同组邻居插回去。
  for (i = 0; i < stowed.length; i++) {
    spliceNear(kindOf(state, scope, stowed[i]) === "official" ? official : third, discovered, stowed[i]);
  }
  return official.concat(third);
}
// 把 id 插到 ref 里它自己那个位置的前后邻居旁边（邻居都还没进 list 时追尾）。
function spliceNear(list: string[], ref: string[], id: string): void {
  const at = ref.indexOf(id);
  let to = -1;
  let j: number;
  for (j = at - 1; j >= 0; j--) {
    const found = list.indexOf(ref[j]);
    if (found >= 0) {
      to = found + 1;
      break;
    }
  }
  if (to < 0) {
    for (j = at + 1; j < ref.length; j++) {
      const found = list.indexOf(ref[j]);
      if (found >= 0) {
        to = found;
        break;
      }
    }
  }
  list.splice(to < 0 ? list.length : to, 0, id);
}

/**
 * 一个 scope 是否有「恢复本组默认顺序」能清掉的东西。
 *
 * `resetScope` 清三样：本 scope 的保存顺序、收纳记录与手动分类；分类一旦手动改过就不再跟自动判断，
 * 恢复本组默认时必须一起清掉，否则点完还是旧的官方/第三方，和按钮文案对不上。
 * 三者都空时按钮无事可做——空卡片上留一个能点的恢复按钮只会让人以为它坏了——因此据此禁用。
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
  const kinds = Object.keys(state.kinds);
  for (i = 0; i < kinds.length; i++) if (kinds[i].indexOf(scope + ":") === 0) return true;
  return false;
}

/**
 * 整个状态是否已经不是出厂值——「重置所有配置」是否还有事可做。
 *
 * 只比对 `resetAll` 真正会改写的那五样（order / kinds / hidden / intoMore / moreOrder / options）；
 * `stashSort` 不在其中，它是收纳包的排序偏好，重置配置不会动它，因此也不该让它把按钮点亮。
 * 这份清单必须与 `settings-page` 里 `onConfirm` 实际写回的字段一一对应，否则按钮会常亮却点不动。
 * 键序是确定的，可以直接 `JSON.stringify`：normalize 按固定顺序重建各表。
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
  // 与 `stashEntries` 同一口径：只有 `=== true` 才算收起，坏值不算（否则卡片上写「1 个」
  // 点进去却是空的）。
  return stashEntries(state).length;
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

// 收起 / 进「更多」前先把握屏上顺序落盘：之后拖别人只写看得见的行，没存档的会被当成新行追尾（m00001/m00883）。
// 读屏幕顺序要碰 DOM，由接线层注入 provider；未注入时没有可视顺序，退化为不动 order。
let __visibleOrder: ((state: PluginState, scope: string) => string[]) | null = null;
function setVisibleOrderProvider(fn: ((state: PluginState, scope: string) => string[]) | null): void { __visibleOrder = fn; }
function pinOrder(state: PluginState, scope: string, id: string): void {
  const live = __visibleOrder ? __visibleOrder(state, scope) : [];
  if ((state.order[scope] || []).indexOf(id) < 0 && live.indexOf(id) >= 0) writeOrder(state, scope, live);
}

function setHidden(state: PluginState, scope: string, id: string, hidden: boolean): void {
  const key = rowKey(scope, id);
  if (!hidden) {
    delete state.hidden[key];
    // 老版本曾在收起时把位置写丢；恢复时按 DOM 邻居补回，别又追到末尾（m00001）。
    anchorUnsavedRow(state, scope, id);
    return;
  }
  pinOrder(state, scope, id);
  state.hidden[key] = true;
  // 两处收纳互斥：进了收纳包就不该再留在「更多」里，否则恢复时不知道以哪边为准。
  delete state.intoMore[key];
}

function toggleHidden(state: PluginState, scope: string, id: string): void {
  setHidden(state, scope, id, !isHidden(state, scope, id));
}

/**
 * 把一行收进 / 移出官方「更多」菜单。
 *
 * 两处收纳互斥：收进「更多」时顺手清掉收纳包里的同名键，反之亦然（见 `setHidden`），否则同一行会同时挂在两处。
 *
 * @param state 当前状态，原地改写 `intoMore`。
 * @param scope 槽位 key。
 * @param id 行 id。
 * @param into 是否收进「更多」。
 */
function setIntoMore(state: PluginState, scope: string, id: string, into: boolean): void {
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

function toggleIntoMore(state: PluginState, scope: string, id: string): void {
  setIntoMore(state, scope, id, !isIntoMore(state, scope, id));
}

function writeOrder(state: PluginState, scope: string, ids: string[]): void {
  const saved = state.order[scope] || [];
  const next: string[] = [];
  let i: number;
  for (i = 0; i < ids.length; i++) {
    const id = ids[i];
    if (!id || next.indexOf(id) >= 0) continue;
    // 从 DOM 文字 / 图标类名兜底出来的 id 不稳定（同名按钮会重名、文案随语言变），
    // 不写进存档，免得下一轮认出别人来（见 domIdOf）。
    if (id.indexOf("text:") === 0 || id.indexOf("cls:") === 0) continue;
    next.push(id);
  }
  // 这一轮没列出来的行（正收起、已进「更多」，或所在的整处位置暂时不在屏幕上）不能因为
  // 别人挪了一下就从保存顺序里消失：它们要能回到原来的位置，而不是被当成新行追尾。
  for (i = 0; i < saved.length; i++) {
    if (next.indexOf(saved[i]) < 0) spliceNear(next, saved, saved[i]);
  }
  state.order[scope] = next;
}

/**
 * 在行自己所属的组内移动一行。
 *
 * 保存顺序只有拖动才会写；全新配置下 `order` 是空的，只认它会让设置页的 ↑ / ↓ 看着可点、
 * 点下去毫无反应。找不到这一行时以屏幕顺序为基准（`liveOrder`，去掉已收纳的行），再走 `writeOrder`。
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
    // 保存顺序里没有这一行（全新配置，或刚恢复过默认顺序）：以屏幕上的当前顺序为基准。
    // 已收起 / 已进「更多」的行不在屏幕顺序里，但存档里可能记着它们原来的位置，先留着；
    // 丢掉的话，挪动别的行就会顺手把这些行挤成「新行」、恢复后逐个跑到末尾。
    const live = liveOrder(scope);
    let i;
    for (i = 0; i < live.length; i++) {
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
  while (cursor >= 0 && cursor < list.length) {
    const candidate = list[cursor];
    // 钉在末尾的「更多」入口与已收进「更多」的行都不是可换位的邻居：投影会把「更多」
    // 排回末尾、收进「更多」的行根本不在主列表里，换过去界面上什么也不会发生。
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
/**
 * 恢复一个 scope 的布局：排序归零、收纳清空、手动分类一并清掉（回到自动判断）。
 *
 * @param state 当前状态，原地改写 `order`、`hidden` 与 `kinds`。
 * @param scope 槽位 key。
 */
function resetScope(state: PluginState, scope: string): void {
  state.order[scope] = [];
  dropScopeKeys(state.hidden, scope);
  dropScopeKeys(state.intoMore, scope);
  // 手动分类也是「本组」的一部分：清掉后同一张卡回到自动判断（官方名单 / 注册方）。
  dropScopeKeys(state.kinds, scope);
  let i;
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
  const keys = Object.keys(state.hidden);
  state.hidden = {};
  // 一次恢复多行时同样按 DOM 邻居补位置：漏掉这一步，老存档里没记过位置的行会一起追尾。
  for (let i = 0; i < keys.length; i++) {
    const cut = keys[i].indexOf(":");
    if (cut < 0) continue;
    anchorUnsavedRow(state, keys[i].slice(0, cut), keys[i].slice(cut + 1));
  }
}
