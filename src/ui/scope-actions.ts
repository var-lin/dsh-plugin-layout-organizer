
// 位置卡片标题行右侧的整组动作。用户要的是一个下拉，里面按「官方 / 第三方 / 全部」
// 分三组，每组两个动作：收起 / 恢复、进更多 / 移出更多。
//
// 收起类动作的文案是动态的：这一组里只要还有一行没收起，菜单就写「全部收起」；
// 全都已收起时改写「全部恢复」。进更多同理——只要还有一行没进去就写「全部进更多」，
// 全都在里面时写「全部移出更多」。这样点一下总是在把整组推向同一个方向，不会出现
// 「以为在收、其实在恢复」。
//
// 菜单用 portal 挂到 body：`.lo-card` 是 `overflow:hidden`，留在卡片里会被裁掉；
// 位置按触发器矩形算 fixed 坐标，滚动或缩放时直接关掉，免得跟着页面漂。

interface ScopeActionRow {
  id: string;
}

interface ScopeActionsProps {
  scope: string;
  state: PluginState;
  store: StoreHandle;
  rows: ScopeActionRow[];
}

// 一组里参与「收起」的行：钉住的「更多」入口不能收，否则整组唯一的出口就没了。
function groupIds(scope: string, rows: ScopeActionRow[], state: PluginState, group: string): string[] {
  const ids: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const id = rows[i].id;
    if (isMoreEntry(scope, id)) continue;
    if (group === "all" || kindOf(state, scope, id) === group) ids.push(id);
  }
  return ids;
}

// 「官方在前」用：官方行保持当前相对顺序，第三方跟在后面，「更多」入口钉在最后。
function groupedOrder(state: PluginState, scope: string, rows: ScopeActionRow[]): string[] {
  const official: string[] = [];
  const third: string[] = [];
  const pinned: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const id = rows[i].id;
    if (isMoreEntry(scope, id)) pinned.push(id);
    else if (kindOf(state, scope, id) === "official") official.push(id);
    else third.push(id);
  }
  return official.concat(third, pinned);
}

function sameIds(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function ScopeActionsMenu(props: ScopeActionsProps): any {
  const scope = props.scope;
  const rows = props.rows || [];
  const openPair = useState(false);
  const open = openPair[0];
  const setOpen = openPair[1];
  const atPair = useState({ left: 8, top: 8 });
  const at = atPair[0];
  const setAt = atPair[1];
  const triggerRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLElement | null>(null);

  // 打开期间：点外面、Esc、滚动、改窗口大小都收起来。捕获阶段先于卡片标题的折叠监听，
  // 点菜单本身不算「外面」——否则按下还没 click，菜单就先没了。
  useEffect(function () {
    if (!open) return undefined;
    function outside(event: any): void {
      const target = event.target;
      if (menuRef.current && menuRef.current.contains(target)) return;
      if (triggerRef.current && triggerRef.current.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: any): void {
      if (event.key === "Escape") setOpen(false);
    }
    function shut(): void {
      setOpen(false);
    }
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("scroll", shut, true);
    window.addEventListener("resize", shut);
    return function () {
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("scroll", shut, true);
      window.removeEventListener("resize", shut);
    };
  }, [open]);

  // 挂上之后量一次真实尺寸再夹进视口（见 placePop）：写死的高度在窗口矮或分组多时会把
  // 底部的「收起 / 恢复」裁到屏幕外。
  useEffect(function () {
    if (!open) return undefined;
    placePop(menuRef.current, at.left, at.top);
    return undefined;
  }, [open, at.left, at.top]);

  // 三组各自算：哪些行参与收起、哪些能进「更多」、是不是已经全都处在目标状态。
  const groups: any[] = [];
  const defs = [
    { key: "official", label: t("action.groupOfficial") },
    { key: "third", label: t("action.groupThird") },
    { key: "all", label: t("action.groupAll") }
  ];
  for (let g = 0; g < defs.length; g++) {
    const hideIds = groupIds(scope, rows, props.state, defs[g].key);
    const moreIds: string[] = [];
    for (let i = 0; i < hideIds.length; i++) {
      if (canTuckIntoMore(scope, hideIds[i])) moreIds.push(hideIds[i]);
    }
    let hiddenCount = 0;
    let intoCount = 0;
    for (let i = 0; i < hideIds.length; i++) if (isHidden(props.state, scope, hideIds[i])) hiddenCount++;
    for (let i = 0; i < moreIds.length; i++) if (isIntoMore(props.state, scope, moreIds[i])) intoCount++;
    groups.push({
      key: defs[g].key,
      label: defs[g].label,
      hideIds: hideIds,
      moreIds: moreIds,
      allHidden: hideIds.length > 0 && hiddenCount === hideIds.length,
      allMore: moreIds.length > 0 && intoCount === moreIds.length
    });
  }
  const hasMoreScope = moreScopeOk(scope);

  function toggle(event: any): void {
    if (open) {
      setOpen(false);
      return;
    }
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // 只记锚点，尺寸交给 placePop 量：分组多的时候这扇菜单比 330px 高得多。
    setAt({ left: rect.left, top: rect.bottom + 6 });
    setOpen(true);
  }

  // 一个按钮管整组：当前不是「全收起」就全部收起，已经是就全部恢复。进更多同理。
  function applyHide(group: any): void {
    if (group.hideIds.length === 0) return;
    const hide = !group.allHidden;
    props.store.update(function (next: PluginState) {
      for (let i = 0; i < group.hideIds.length; i++) setHidden(next, scope, group.hideIds[i], hide);
    });
    setOpen(false);
  }

  function applyMore(group: any): void {
    if (group.moreIds.length === 0) return;
    const into = !group.allMore;
    props.store.update(function (next: PluginState) {
      for (let i = 0; i < group.moreIds.length; i++) setIntoMore(next, scope, group.moreIds[i], into);
    });
    setOpen(false);
  }

  const trigger = h("button", {
    type: "button",
    ref: triggerRef,
    className: "lo-btn lo-bulk-trigger",
    "aria-haspopup": "menu",
    "aria-expanded": open ? "true" : "false",
    title: t("action.bulkHint"),
    onClick: toggle
  }, t("action.bulk"), h("span", { className: "lo-bulk-caret", "aria-hidden": "true" }, "\u25be"));

  if (!open) return h("span", { className: "lo-bulk" }, trigger);

  const blocks: any[] = [];
  for (let g = 0; g < groups.length; g++) {
    const group = groups[g];
    blocks.push(h("div", { className: "lo-bulk-group", key: "g" + group.key },
      h("div", { className: "lo-bulk-group-title" }, group.label),
      h("button", {
        type: "button",
        className: CLASS.popItem,
        role: "menuitem",
        disabled: group.hideIds.length === 0,
        title: group.hideIds.length === 0
          ? t("action.bulkHideEmpty")
          : group.allHidden ? t("action.bulkHideOutHint") : t("action.bulkHideHint"),
        onClick: function () { applyHide(group); }
      }, h("span", { className: CLASS.popText }, group.allHidden ? t("action.bulkHideOut") : t("action.bulkHide"))),
      h("button", {
        type: "button",
        className: CLASS.popItem,
        role: "menuitem",
        disabled: group.moreIds.length === 0,
        title: !hasMoreScope
          ? t("action.bulkMoreBlocked")
          : group.moreIds.length === 0
            ? t("action.bulkMoreEmpty")
            : group.allMore ? t("action.bulkMoreOutHint") : t("action.bulkMoreHint"),
        onClick: function () { applyMore(group); }
      }, h("span", { className: CLASS.popText }, group.allMore ? t("action.bulkMoreOut") : t("action.bulkMore")))
    ));
  }

  const menu = h("div", {
    ref: menuRef,
    className: CLASS.pop + " lo-bulk-pop",
    role: "menu",
    style: { left: at.left + "px", top: at.top + "px" },
    onClick: function (event: any): void {
      // 卡片标题行的折叠监听在 React 树上，portal 不在同一条冒泡路径；这层留着防宿主
      // 外围的「点外面就关设置」把它当成外部点击。
      if (event && event.stopPropagation) event.stopPropagation();
    }
  },
    h("div", { className: CLASS.popMaterial, "aria-hidden": "true" }),
    h("div", { className: CLASS.popViewport + " lo-bulk-list" },
      blocks
    )
  );

  // 正常环境一定有 ReactDOM；测试桩没有 portal 时退回行内 fixed，至少不会炸掉整张卡片。
  const portal = ReactDOM && typeof ReactDOM.createPortal === "function"
    ? ReactDOM.createPortal(menu, document.body)
    : menu;
  return h("span", { className: "lo-bulk" }, trigger, portal);
}

// 「官方在前」：一次性写死顺序，官方行在前、第三方行在后，「更多」入口保持最后。
// 已经是这个顺序时按钮灰着——可点却什么都不变，比灰着更让人怀疑坏了。
// 和「本组恢复默认」一样走两步确认，避免误触把整组顺序改掉。
function ScopeSortButton(props: { scope: string; state: PluginState; store: StoreHandle; rows: ScopeActionRow[] }): any {
  const rows = props.rows || [];
  const next = groupedOrder(props.state, props.scope, rows);
  const current: string[] = [];
  for (let i = 0; i < rows.length; i++) current.push(rows[i].id);
  const done = sameIds(current, next);
  return h(ConfirmBtn, {
    label: t("action.sort"),
    confirmLabel: t("action.sortConfirm"),
    title: done ? t("action.sortDone") : t("action.sortHint"),
    disabled: done,
    onConfirm: function (): void {
      props.store.update(function (state: PluginState) {
        writeOrder(state, props.scope, next);
      });
    }
  });
}
