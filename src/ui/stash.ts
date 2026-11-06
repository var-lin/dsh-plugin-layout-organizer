
// `missing`：行被收纳了，但拥有它的页面此刻未挂载，打不开。
// `navigable`：这一行在界面上本来就有可点的东西（见 rowNavigable）。纯展示的行两者都为假。
interface StashItem {
  scope: string;
  id: string;
  key: string;
  label: string;
  kind: string;
  missing: boolean;
  navigable: boolean;
  scopeLabel: string;
  scopeIndex: number;
  orderIndex: number;
}

// 「按页面」「按类型」拆成带标题的分组；字母序是扁平列表（`title` 为 `null` 的一组）。
// `key` 是这一组的稳定身份（按类型是 kind 值、按页面是 scope 键），折叠状态用它做键，
// 不跟着标题文案走——切语言时标题会变，键不能变。
interface StashGroup {
  key: string;
  title: string | null;
  rows: StashItem[];
}

interface StashRowProps {
  row: StashItem;
  onOpen: (row: StashItem) => void;
  onRestore: (row: StashItem) => void;
  // 收进官方「更多」菜单：只有能收进去的槽位才给这个按钮（见 moreScopeOk）。
  canIntoMore?: boolean;
  onIntoMore?: (row: StashItem) => void;
}

// 面板、启动器与挂载点这三个组件的 props 完全同构：都要宿主上下文与状态句柄。
interface StashProps {
  ctx: CtxLike;
  store: StoreHandle;
}

// 由快捷键、设置页按钮和启动器从外部切换。
interface StashFlag {
  get(): boolean;
  set(next: boolean): void;
  subscribe(listener: (value: boolean) => void): () => void;
}

// 一次拖动在指针事件间记住的东西：`dx`/`dy` 是抓取偏移，`width`/`height` 在 pointerdown 捕获，`x`/`y` 是本帧实时位置。
interface DragState {
  dx: number;
  dy: number;
  moved: boolean;
  width: number;
  height: number;
  x: number;
  y: number;
}

function stashView(ctx: CtxLike, state: PluginState): StashItem[] {
  const ledger: Record<string, LedgerEntry[]> = {};
  let i: number;
  let j: number;
  for (i = 0; i < SCOPES.length; i++) ledger[SCOPES[i].key] = readEntries(ctx, SCOPES[i].key);

  const entries: { scope: string; id: string; key: string }[] = stashEntries(state);
  const out: StashItem[] = [];
  for (i = 0; i < entries.length; i++) {
    const item = entries[i];
    const spec = SCOPE_OF_KEY[item.scope];
    const list = ledger[item.scope] || [];
    let entry: LedgerEntry | null = null;
    for (j = 0; j < list.length; j++) if (list[j].id === item.id) entry = list[j];
    // 取名字的规则与「更多」菜单共用一处（见 rowLabelText），两处才叫同一个名字。
    const label = rowLabelText(ctx, item.scope, item.id);
    // 「找不到这一行」= 这一行不在屏幕上；此时只是不能导航过去，恢复按钮照常可用（见 StashRow）。
    // 六处槽位同一把尺子（见 listedInScope）：只有这一轮投影真正标记到的行才算存在，scope 整个
    // 不在屏幕上时也不退守台账——否则会留下一条永远渲染不出来的影子行让人去恢复。
    const live = liveRowIds(item.scope);
    const missing = !listedInScope(live, item.id);
    const navigable = rowNavigable(item.scope, item.id);
    // 设置页的行只在设置弹窗那一页才投影得到，可那扇弹窗随时能打开，所以照样算「存在」
    // （与 `rowNavigable` 里对 settings 的例外一致）。右栏卡片没有台账，右栏收起或正显示
    // 别的页面时同样投影不到，但导航能把它展开、翻到「开始」页再点（见 `navigateTo` 的三级
    // 回退），所以只要导航得到就仍然算「存在」；其余位置没投影到就是真不在屏幕上。
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

function sortStash(rows: StashItem[], mode: string): StashItem[] {
  const copy = rows.slice();
  // 「按种类」的分组由 groupStash 完成，组内每行的 kind 都相同，所以这里只需按位置/顺序排。
  copy.sort(function (a: StashItem, b: StashItem): number {
    if (mode === "alpha") return a.label.localeCompare(b.label);
    return a.scopeIndex - b.scopeIndex || a.orderIndex - b.orderIndex;
  });
  return copy;
}

function groupStash(rows: StashItem[], mode: string): StashGroup[] {
  if (mode === "alpha") return [{ key: "alpha", title: null, rows: rows }];
  const groups: StashGroup[] = [];
  const index: Record<string, number> = {};
  let i: number;
  for (i = 0; i < rows.length; i++) {
    const row = rows[i];
    // 按类型分组用 kind 值做键，按页面分组用 scope 键——两者都不随语言变化。
    const key = mode === "kind" ? row.kind : row.scope;
    const title = mode === "kind" ? t(row.kind === "official" ? "kind.official" : "kind.third") : row.scopeLabel;
    if (index[key] === undefined) {
      index[key] = groups.length;
      groups.push({ key: key, title: title, rows: [] });
    }
    groups[index[key]].rows.push(row);
  }
  return groups;
}

/**
 * 一组行覆盖到哪些位置。
 *
 * 按位置分组时只有一处；按种类分组时「官方」这一组可能横跨五个位置——
 * 组标题上的恢复按钮因此按「这一组实际涉及的每一处」逐个恢复，而不是假装它只属于一处。
 *
 * @param group 收纳包里的一个分组。
 * @returns 去重后的位置键列表。
 */
function groupScopes(group: StashGroup): string[] {
  const seen: Record<string, boolean> = {};
  const list: string[] = [];
  let i: number;
  for (i = 0; i < group.rows.length; i++) {
    const scope = group.rows[i].scope;
    if (!seen[scope]) {
      seen[scope] = true;
      list.push(scope);
    }
  }
  return list;
}

/**
 * 这一组覆盖的位置里，有没有哪一处还留着可以恢复的改动。
 *
 * @param state 当前插件状态。
 * @param group 收纳包里的一个分组。
 * @returns 有事可做则为 true；否则按钮灰着。
 */
function groupDirty(state: PluginState, group: StashGroup): boolean {
  const scopes = groupScopes(group);
  for (let i = 0; i < scopes.length; i++) {
    if (scopeDirty(state, scopes[i])) return true;
  }
  return false;
}
