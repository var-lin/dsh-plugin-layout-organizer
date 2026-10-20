
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
  // 合成行（输入框停靠行的用量百分比）不是 slot 记录、台账里没有条目，但它确实在屏幕上，
  // 也要能在这张卡片里排序、收纳，因此按屏幕上的正证据补进来（见 syntheticIdsOf）。
  const synthetic = syntheticIdsOf(scope);

  // 顺序由 `reconcileOrder` 重算，不从 DOM 读回
  const ids: string[] = [];
  for (i = 0; i < entries.length; i++) ids.push(entries[i].id);
  for (i = 0; i < synthetic.length; i++) if (ids.indexOf(synthetic[i]) < 0) ids.push(synthetic[i]);
  const order = reconcileOrder(state, scope, ids);

  // 只列屏幕上真正存在的行。声明了认领钩子的记录以「钩子命中」为唯一正证据：整条 scope 不在
  // 屏幕上时不退守台账——注册在这个槽位、实际渲染在别处的插件（Trae / WorkBuddy 的额度读数）
  // 在台账里永远有记录，退守就会把它们列成点不动的影子行。
  const live = liveRowIds(scope);
  const listed: string[] = [];
  for (i = 0; i < order.length; i++) {
    const id = order[i];
    if (!listedInScope(live, scope, id)) continue;
    if (byId[id] || synthetic.indexOf(id) >= 0) listed.push(id);
  }
  // 协调后顺序里没见过的行按账本顺序追加在末尾，而不是悄悄消失。
  for (i = 0; i < entries.length; i++) {
    const id = entries[i].id;
    if (listed.indexOf(id) >= 0) continue;
    if (!listedInScope(live, scope, id)) continue;
    listed.push(id);
  }

  const out: ScopeEntry[] = [];
  for (i = 0; i < listed.length; i++) {
    const id = listed[i];
    const entry = byId[id];
    // 插件指定的名字最优先（宿主没给文案的读数条），其次台账文案，再退到投影记下的名字。
    const named = rowLabelOf(scope, id);
    if (!entry) {
      // 合成行没有台账文案，名字只可能来自 ROW_LABELS 或投影记下的界面文字。
      out.push({ id: id, label: named || liveRowLabel(scope, id) || hookLabel(scope, id) || id, order: 0, hasLabel: true });
      continue;
    }
    const shown = named || (entry.hasLabel ? entry.label : liveRowLabel(scope, id) || hookLabel(scope, id));
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

  // 折叠的是「整个一大类」——这张卡片本身（见下面的 Card），不是官方 / 第三方分组。
  // 折叠状态与设置页里那些「有下属行」的开关共用 options.collapsed，键带 card: 前缀互不牵连。
  const collapsedMap: Record<string, boolean> = state.options.collapsed || {};
  const cardKey = "card:" + scope;
  // 搜索时强制展开：命中的行藏在收起的卡片里，搜索就等于没搜到。
  const cardOpen = query ? true : collapsedMap[cardKey] !== true;

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
    // 名称区能否点击跳转：与收纳包同一把尺子（见 rowNavigable），界面上点不动的行这里也灰着。
    const canOpen = rowNavigable(scope, id);
    const openTitle = canOpen ? t("action.goto") : t("action.static");
    const index = mixed ? entries.indexOf(entry) : groupIndex[group]++;
    const total = mixed ? entries.length : groupTotal[group];
    (function (entry: ScopeEntry, id: string, kind: string, group: string, index: number, hidden: boolean, self: boolean, canOpen: boolean, openTitle: string) {
      rows.push(h(RowItem, {
        key: scope + ":" + id,
        entry: entry,
        kind: kind,
        group: group,
        hidden: hidden,
        self: self,
        draggable: true,
        canUp: index > 0,
        canDown: index < total - 1,
        canOpen: canOpen,
        openTitle: openTitle,
        onOpen: function () {
          navigateFromSettings(ctx, scope, id);
        },
        onToggleKind: function () {
          store.update(function (next: PluginState) {
            next.kinds[scope + ":" + id] = kind === "official" ? "third" : "official";
          });
        },
        onUp: function () {
          store.update(function (next: PluginState) {
            // 混合排序下整条 scope 就是一个组（"all"），moveRow 只认 official / third。
            moveRow(next, scope, id, -1, group === "all" ? undefined : group);
          });
        },
        onDown: function () {
          store.update(function (next: PluginState) {
            moveRow(next, scope, id, 1, group === "all" ? undefined : group);
          });
        },
        onToggleHidden: function () {
          store.update(function (next: PluginState) {
            setHidden(next, scope, id, !hidden);
          });
        },
        onMenu: function (event: MouseEvent) {
          attachMenuAt(event, ctx, store, scope, id, group);
        }
      }));
    })(entry, id, kind, listGroup, index, hidden, self, canOpen, openTitle);
  }

  // 「恢复本组默认顺序」放在卡片标题右侧：它作用于整张卡片，属于标题级动作；
  // 摆在列表末尾时，卡片越长越要先滚到底才能看见。
  return h(Card, {
    title: title,
    // 点卡片标题收起 / 展开整个大类；搜索时强制展开（见 cardOpen）。
    collapsed: !cardOpen,
    onToggleCollapse: function () {
      store.update(function (next: PluginState) {
        if (!next.options.collapsed) next.options.collapsed = {};
        // cardOpen 是「当前是否展开」：展开着点一下 → collapsed=true，收起着点一下 → collapsed=false。
        next.options.collapsed[cardKey] = cardOpen;
      });
    },
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
