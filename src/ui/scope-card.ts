
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
 * 条目排序、收纳（见 liveRows）。整条位置不在屏幕上时退回「上一次投影记下的行」，对话页关着
 * 也能整理标签与停靠行（见 seenRows）。右侧边栏没有台账，卡片改按宿主注册表列，右栏收着时
 * 也列（见 rightCardList）。
 *
 * @param ctx 上下文，用于读取槽位台账与右侧栏注册表。
 * @param state 当前插件状态，提供手工分类与已保存顺序。
 * @param scope 位置键（sidebar / footer / tabs / composer / right / settings）。
 * @returns 按显示顺序排列的行，文案已解析成人类可读的名字。
 */
function scopeEntries(ctx: CtxLike, state: PluginState, scope: string): ScopeEntry[] {
  const entries = readEntries(ctx, scope);
  // 无原型对象：插件 id 里出现了 constructor / toString 这类名字时，普通对象会让
  // `byId[id]` 命中原型上的成员，把台账里没有的行当成有记录的行走下去。
  const byId: Record<string, ScopeEntry> = Object.create(null);
  let i: number;
  for (i = 0; i < entries.length; i++) {
    byId[entries[i].id] = {
      id: entries[i].id,
      label: entries[i].label,
      order: entries[i].order || 0,
      hasLabel: entries[i].hasLabel
    };
  }
  // 合成行（输入框停靠行的用量百分比）不是 slot 记录、台账里没有条目，但它确实在屏幕上，
  // 也要能在这张卡片里排序、收纳，因此按屏幕上的正证据补进来（见 syntheticIdsOf）。
  const synthetic = syntheticIdsOf(scope);
  // 右侧边栏那一处没有台账，卡片按宿主注册表列：右栏收着、或正显示别的页面时也照常列，
  // 用户不必先把右栏翻回「开始」页才能安排顺序（见 rightCardList，用户 m00519）。
  const registry = scope === "right" ? rightCardList(ctx) : [];
  const registered: Record<string, string> = Object.create(null);
  for (i = 0; i < registry.length; i++) registered[registry[i].id] = registry[i].label;

  const live = liveRowIds(scope);
  // 位置整条不在屏幕上时（对话页关着，标签条与停靠行都不渲染），退回「上一次投影记下的行」：
  // 它们真实存在过、名字也是屏幕上认过的，因此照样能在这里排顺序、收纳（用户 m00654）。
  // 只记投影标记到的行，所以不会把台账里的影子行带进来；从没上过屏幕的位置仍是空的。
  const seen = live === null && scope !== "right" ? seenRows(scope) : null;

  // 顺序由 `reconcileOrder` 重算，不从 DOM 读回
  const ids: string[] = [];
  if (seen) {
    // 整条位置不在屏幕上：顺序以最后一次投影为准，台账里的额外记录不参与（见 seenRows）。
    for (i = 0; i < seen.length; i++) ids.push(seen[i].id);
  } else {
    for (i = 0; i < entries.length; i++) ids.push(entries[i].id);
    for (i = 0; i < synthetic.length; i++) if (ids.indexOf(synthetic[i]) < 0) ids.push(synthetic[i]);
    for (i = 0; i < registry.length; i++) if (ids.indexOf(registry[i].id) < 0) ids.push(registry[i].id);
  }
  // 「更多工具」不在注册表里，但它是「开始」页固定的一颗：右栏收着时也照常列，收起 / 恢复
  // 才不用先翻回「开始」页。投影在屏幕上时本来就会被 syntheticIdsOf 收进来。
  if (scope === "right" && registered[MORE_ID] === undefined) {
    registered[MORE_ID] = rowLabelOf(scope, MORE_ID) || t("row.more");
    if (ids.indexOf(MORE_ID) < 0) ids.push(MORE_ID);
  }
  const order = reconcileOrder(state, scope, ids);

  // 只列屏幕上真正存在的行，六处槽位同一把尺子（见 listedInScope）：台账里有记录、这一轮
  // 投影却没标记到的，一律不列——注册在这个槽位、实际渲染在别处的插件（Trae / WorkBuddy 的
  // 额度读数）在台账里永远有记录，列出来就是点不动、也收纳不掉的影子行。右侧边栏是例外：
  // 它没有台账，注册表里列出的卡片就是真实存在的那几张，不依赖这一轮投影。
  const seenLabel: Record<string, string> = Object.create(null);
  if (seen) for (i = 0; i < seen.length; i++) seenLabel[seen[i].id] = seen[i].label;
  const listed: string[] = [];
  if (seen) {
    for (i = 0; i < order.length; i++) if (seenLabel[order[i]] !== undefined) listed.push(order[i]);
  } else {
    for (i = 0; i < order.length; i++) {
      const id = order[i];
      if (!byId[id] && synthetic.indexOf(id) < 0 && registered[id] === undefined) continue;
      if (registered[id] === undefined && !listedInScope(live, id)) continue;
      listed.push(id);
    }
    // 协调后顺序里没见过的行按账本顺序追加在末尾，而不是悄悄消失。
    for (i = 0; i < entries.length; i++) {
      const id = entries[i].id;
      if (listed.indexOf(id) >= 0) continue;
      if (!listedInScope(live, id)) continue;
      listed.push(id);
    }
  }

  // 三颗「更多」入口永远排在最后，与屏幕上的投影一致（见 isMoreEntry）。台账里存下的顺序
  // 可能把它们放在中间（老状态、或它们还不能拖动之前排的），而它们又不能拖动，不在这里
  // 挪到末尾就再也回不去（用户 m04835）。
  for (i = listed.length - 1; i >= 0; i--) {
    if (!isMoreEntry(scope, listed[i])) continue;
    const pinnedId = listed.splice(i, 1)[0];
    listed.push(pinnedId);
  }

  const out: ScopeEntry[] = [];
  for (i = 0; i < listed.length; i++) {
    const id = listed[i];
    const entry = byId[id];
    // 插件指定的名字最优先（宿主没给文案的读数条），其次是右侧栏的注册名、台账文案、投影记下的名字。
    const named = rowLabelOf(scope, id);
    if (!entry) {
      // 合成行与右侧栏卡片都没有台账文案，名字只可能来自 ROW_LABELS、注册表、投影记下的界面文字。
      out.push({ id: id, label: named || registered[id] || seenLabel[id] || liveRowLabel(scope, id) || hookLabel(scope, id) || id, order: 0, hasLabel: true });
      continue;
    }
    const shown = named || (entry.hasLabel ? entry.label : seenLabel[id] || liveRowLabel(scope, id) || hookLabel(scope, id));
    out.push({ id: entry.id, label: shown || entry.label, order: entry.order, hasLabel: entry.hasLabel || !!shown });
  }
  return out;
}

/**
 * 搜索串是否命中一张位置卡片：标题命中算整张留下，否则看有没有某一行命中。
 *
 * 单独抽出来是因为设置页也要用同一把尺子判断「六张卡片是不是全都没命中」——
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
  // 搜索时也照常可折叠：用户自己收起的卡片不该因为输入了搜索词就被强行拉开。
  const cardOpen = collapsedMap[cardKey] !== true;

  const rows: any[] = [];
  // 混合排序打开时整条列表算一个组
  const mixed = mixedOrder(state);
  const groupIndex: Record<string, number> = { official: 0, third: 0 };
  const groupTotal: Record<string, number> = { official: 0, third: 0 };
  for (i = 0; i < entries.length; i++) groupTotal[groupOf(state, scope, entries[i].id)]++;
  // 钉在末尾的「更多」不参与上下移：排在它前面的那一行也不该显示「下移」，
  // 按下去只会在台账里跟它换个位，屏幕上纹丝不动（见 isMoreEntry）。
  // 扣哪一组要看它此刻被判成官方还是第三方：旧状态里它可能还挂在第三方组末尾。
  const pinnedId = entries.length > 0 && isMoreEntry(scope, entries[entries.length - 1].id) ? entries[entries.length - 1].id : "";
  const pinnedGroup = pinnedId ? groupOf(state, scope, pinnedId) : "";
  // 搜索把「更多」那一行滤掉时它不在 `shown` 里，也就不该再扣掉一个名额——否则这一组
  // 最后一颗能动的行会平白少一个「下移」。
  let pinnedShown = false;
  for (i = 0; i < shown.length; i++) if (pinnedId && shown[i].id === pinnedId) pinnedShown = true;
  for (i = 0; i < shown.length; i++) {
    const entry = shown[i];
    const id = entry.id;
    const kind = kindOf(state, scope, id);
    const group = kind === "official" ? "official" : "third";
    const listGroup = mixed ? "all" : group;
    const hidden = isHidden(state, scope, id);
    // 名称区能否点击跳转：与收纳包同一把尺子（见 rowNavigable），界面上点不动的行这里也灰着。
    const canOpen = rowNavigable(scope, id);
    const openTitle = canOpen ? t("action.goto") : t("action.static");
    const index = mixed ? entries.indexOf(entry) : groupIndex[group]++;
    const total = (mixed ? entries.length : groupTotal[group]) - ((mixed || group === pinnedGroup) && pinnedShown ? 1 : 0);
    rows.push(h(RowItem, {
      key: scope + ":" + id,
      entry: entry,
      scope: scope,
      kind: kind,
      group: listGroup,
      hidden: hidden,
      // 三颗「更多」入口钉在列表末尾：不能拖、不能上下移、也不能改判官方 / 第三方（用户 m04058）。
      draggable: !isMoreEntry(scope, id),
      kindLocked: isMoreEntry(scope, id),
      canUp: !isMoreEntry(scope, id) && index > 0,
      canDown: !isMoreEntry(scope, id) && index < total - 1,
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
          moveRow(next, scope, id, -1, listGroup === "all" ? undefined : listGroup);
        });
      },
      onDown: function () {
        store.update(function (next: PluginState) {
          moveRow(next, scope, id, 1, listGroup === "all" ? undefined : listGroup);
        });
      },
      onToggleHidden: function () {
        store.update(function (next: PluginState) {
          setHidden(next, scope, id, !hidden);
        });
      },
      // 「更多」只对能收进去的槽位有意义（侧边栏 / 底部 / 标签 / 停靠行 / 右侧边栏）；设置行没有容器可去。
      // 三颗「更多」入口按钮自己不给这个键（见 isMoreEntry）：收进去就再也点不开那扇菜单。
      intoMore: canTuckIntoMore(scope, id) && isIntoMore(state, scope, id),
      onToggleMore: canTuckIntoMore(scope, id) ? function () {
        const into = isIntoMore(store.get(), scope, id);
        store.update(function (next: PluginState) {
          setIntoMore(next, scope, id, !into);
        });
      } : undefined,
      onMenu: function (event: MouseEvent) {
        attachMenuAt(event, store, scope, id, listGroup);
      }
    }));
  }

  // 「恢复本组默认顺序」放在卡片标题右侧：它作用于整张卡片，属于标题级动作；
  // 摆在列表末尾时，卡片越长越要先滚到底才能看见。
  return h(Card, {
    title: title,
    // 点卡片标题收起 / 展开整个大类；搜索时强制展开（见 cardOpen）。
    collapsed: !cardOpen,
    onToggleCollapse: function () {
      store.update(function (next: PluginState) {
        // cardOpen 是「当前是否展开」：展开着点一下 → collapsed=true，收起着点一下 → collapsed=false。
        setCollapsed(next, cardKey, cardOpen);
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
    // 这一组此刻不在屏幕上时给一句解释；右侧边栏的卡片按注册表列出来了，就不必再让人先去翻页面。
    mounted || rows.length > 0 ? null : h("div", { className: "lo-note" }, t("scope.missing")),
    rows.length > 0
      ? h("div", { className: "lo-rows", "data-lo-list-scope": scope }, rows)
      : h("div", { className: "lo-empty" }, query && !hitAll ? t("empty.search") : t("empty.list"))
  );
}
