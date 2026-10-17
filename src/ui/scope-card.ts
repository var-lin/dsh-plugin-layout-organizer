
// 账本报出的一行：store 持久化的 id、给人看的标签，以及官方渲染器会采用的注册顺序。
// `hasLabel` 为真表示这个标签是权威文案，不是 id 兜底或投影猜出来的名字。
interface ScopeEntry {
  id: string;
  label: string;
  order: number;
  hasLabel?: boolean;
}

interface ScopeCardProps {
  ctx: CtxLike;
  store: StoreHandle;
  scope: string;
  // 已归一化的搜索串（空串表示不筛选）；命中标题、行文案或行 id 都算命中。
  query?: string;
}

/**
 * 组装一张位置卡片要列的行：先按协调后的顺序排，再剔除屏幕上不存在的记录。
 *
 * 台账里渲染成空的记录（供应商未登录时的统计读数）不该出现，否则用户会对着一行看不见的
 * 条目排序、收纳（见 liveRows）。
 *
 * @param ctx 上下文，用于读取槽位台账。
 * @param state 当前插件状态，提供手工分类与已保存顺序。
 * @param scope 位置键（sidebar / footer / tabs / composer / settings）。
 * @returns 按显示顺序排列的行，文案已解析成人类可读的名字。
 */
function scopeEntries(ctx: CtxLike, state: PluginState, scope: string): ScopeEntry[] {
  const entries = readEntries(ctx, scope);
  const byId: Record<string, ScopeEntry> = {};
  let i: number;
  for (i = 0; i < entries.length; i++) byId[entries[i].id] = entries[i];

  // 顺序由 `reconcileOrder` 重算，不从 DOM 读回
  const ids: string[] = [];
  for (i = 0; i < entries.length; i++) ids.push(entries[i].id);
  const order = reconcileOrder(state, scope, ids);

  // 只列屏幕上真正存在的行
  const live = liveRowIds(scope);
  const listed: string[] = [];
  for (i = 0; i < order.length; i++) {
    const id = order[i];
    if (live && live.indexOf(id) < 0) continue;
    const entry = byId[id];
    if (entry) listed.push(id);
  }
  // 协调后顺序里没见过的行按账本顺序追加在末尾，而不是悄悄消失。
  for (i = 0; i < entries.length; i++) {
    const id = entries[i].id;
    if (listed.indexOf(id) >= 0) continue;
    if (live && live.indexOf(id) < 0) continue;
    listed.push(id);
  }

  const out: ScopeEntry[] = [];
  for (i = 0; i < listed.length; i++) {
    const entry = byId[listed[i]];
    if (!entry) continue;
    // 台账没给文案时用投影记下的名字（钩子文案或界面文字），不要露出裸 id。
    const shown = entry.hasLabel ? entry.label : liveRowLabel(scope, entry.id) || hookLabel(scope, entry.id);
    out.push({ id: entry.id, label: shown || entry.label, order: entry.order, hasLabel: entry.hasLabel || !!shown });
  }
  return out;
}

/**
 * 搜索串是否命中一张位置卡片：标题命中算整张留下，否则看有没有某一行命中。
 *
 * 单独抽出来是因为设置页也要用同一把尺子判断「五张卡片是不是全都没命中」——
 * 只有两边同规则，那句「没有匹配」的提示才和卡片实际的去留一致。
 *
 * @param entries 该位置要列的行。
 * @param title 卡片标题（位置名）。
 * @param query 已归一化的搜索串；空串恒真。
 * @returns 命中则为 true。
 */
function entriesHit(entries: ScopeEntry[], title: string, query: string): boolean {
  if (!query) return true;
  if (hitQuery(title, query)) return true;
  for (let i = 0; i < entries.length; i++) {
    if (hitQuery(entries[i].label, query) || hitQuery(entries[i].id, query)) return true;
  }
  return false;
}

/**
 * 同上，但按位置键自己取行；供设置页判断某一张卡片会不会留下。
 *
 * @param ctx 上下文，用于读取槽位台账。
 * @param state 当前插件状态。
 * @param scope 位置键。
 * @param query 搜索串（可为原始串，本函数内部归一化）。
 * @returns 命中则为 true。
 */
function scopeHit(ctx: CtxLike, state: PluginState, scope: string, query: string): boolean {
  const spec = SCOPE_OF_KEY[scope];
  if (!spec) return true;
  return entriesHit(scopeEntries(ctx, state, scope), t(spec.labelKey), normalizeQuery(query || ""));
}

/**
 * 一个位置的排序卡片：可拖动排序的行、分类切换、收纳 / 恢复，以及「恢复本组默认顺序」。
 *
 * @param props 上下文、状态句柄与位置键，见 ScopeCardProps。
 * @returns 位置卡片；搜索无命中时返回 null，由调用方决定间距。
 */
function ScopeCard(props: ScopeCardProps): any {
  const ctx = props.ctx;
  const store = props.store;
  const scope = props.scope;
  const spec = SCOPE_OF_KEY[scope];
  useSlotsTick(ctx);
  useStoreTick(store);
  // revision tick 在投影真正落地后才触发
  useRevisionTick();
  const state = store.get();
  const query = props.query ? normalizeQuery(props.query) : "";
  const title = t(spec.labelKey);
  const entries = scopeEntries(ctx, state, scope);
  const mounted = collectRows(scope) !== null;

  // 搜索时标题本身也算命中：输入「侧边栏」整张卡片留下，输入某个按钮名只留那一行。
  const hitAll = !query || hitQuery(title, query);
  const shown: ScopeEntry[] = [];
  let i: number;
  for (i = 0; i < entries.length; i++) {
    if (hitAll || hitQuery(entries[i].label, query) || hitQuery(entries[i].id, query)) shown.push(entries[i]);
  }
  // 搜索没有命中这个位置时整张卡片让位，避免一屏空卡片。
  if (!entriesHit(entries, title, query)) return null;

  const rows: any[] = [];
  // 混合排序打开时整条列表算一个组
  const mixed = mixedOrder(state);
  const groupIndex: Record<string, number> = { official: 0, third: 0 };
  const groupTotal: Record<string, number> = { official: 0, third: 0 };
  for (i = 0; i < entries.length; i++) groupTotal[groupOf(state, scope, entries[i].id)]++;
  for (i = 0; i < shown.length; i++) {
    const entry = shown[i];
    const id = entry.id;
    const kind = kindOf(state, scope, id);
    const group = kind === "official" ? "official" : "third";
    const listGroup = mixed ? "all" : group;
    const hidden = isHidden(state, scope, id);
    const self = scope === "settings" && id === SELF_ID;
    const index = mixed ? entries.indexOf(entry) : groupIndex[group]++;
    const total = mixed ? entries.length : groupTotal[group];
    (function (entry: ScopeEntry, id: string, kind: string, group: string, index: number, hidden: boolean, self: boolean) {
      rows.push(h(RowItem, {
        key: scope + ":" + id,
        entry: entry,
        kind: kind,
        group: listGroup,
        hidden: hidden,
        self: self,
        draggable: true,
        canUp: index > 0,
        canDown: index < total - 1,
        onToggleKind: function () {
          store.update(function (next: PluginState) {
            next.kinds[scope + ":" + id] = kind === "official" ? "third" : "official";
          });
        },
        onUp: function () {
          store.update(function (next: PluginState) {
            moveRow(next, scope, id, -1, listGroup);
          });
        },
        onDown: function () {
          store.update(function (next: PluginState) {
            moveRow(next, scope, id, 1, listGroup);
          });
        },
        onToggleHidden: function () {
          store.update(function (next: PluginState) {
            setHidden(next, scope, id, !hidden);
          });
        },
        onMenu: function (event: MouseEvent) {
          attachMenuAt(event, ctx, store, scope, id, listGroup);
        }
      }));
    })(entry, id, kind, group, index, hidden, self);
  }

  // 「恢复本组默认顺序」放在卡片标题右侧：它作用于整张卡片，属于标题级动作；
  // 摆在列表末尾时，卡片越长越要先滚到底才能看见。
  return h(Card, {
    title: title,
    action: h(ConfirmBtn, {
      label: t("action.reset"),
      confirmLabel: t("action.confirmResetGroup"),
      // 这张卡片没有保存顺序、也没有收纳行时，恢复无事可做，按钮灰着而不是可点却毫无反应。
      disabled: !scopeDirty(state, scope),
      onConfirm: function () {
        store.update(function (next: PluginState) {
          resetScope(next, scope);
        });
      }
    })
  },
    mounted ? null : h("div", { className: "lo-note" }, t("scope.missing")),
    rows.length > 0
      ? h("div", { className: "lo-rows", "data-lo-list-scope": scope }, rows)
      : h("div", { className: "lo-empty" }, query && !hitAll ? t("empty.search") : t("empty.list"))
  );
}
