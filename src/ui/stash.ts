
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

interface StashPanelProps {
  ctx: CtxLike;
  store: StoreHandle;
}

interface StashLauncherProps {
  ctx: CtxLike;
  store: StoreHandle;
}

interface StashSurfaceProps {
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
    // 五处槽位同一把尺子（见 listedInScope）：只有这一轮投影真正标记到的行才算存在，scope 整个
    // 不在屏幕上时也不退守台账——否则会留下一条永远渲染不出来的影子行让人去恢复。
    const live = liveRowIds(item.scope);
    const missing = !listedInScope(live, item.id);
    // 设置页的行只在设置弹窗那一页才投影得到，可那扇弹窗随时能打开，所以照样算「存在」
    // （与 `rowNavigable` 里对 settings 的例外一致）；其余四处没投影到就是真不在屏幕上。
    const unlisted = missing && item.scope !== "settings";
    const navigable = rowNavigable(item.scope, item.id);
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
  copy.sort(function (a: StashItem, b: StashItem): number {
    if (mode === "alpha") return a.label.localeCompare(b.label);
    if (mode === "kind") {
      if (a.kind !== b.kind) return a.kind === "official" ? -1 : 1;
      return a.scopeIndex - b.scopeIndex || a.orderIndex - b.orderIndex;
    }
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

/**
 * 收纳包里的一行：左侧整行是「打开对应页面」，右侧是「恢复」。
 *
 * 界面上本来点不动的行（见 rowNavigable）左侧同样灰着且不可点：点它什么也不会发生，
 * 也不会顺手关掉收纳包——「可点却毫无反应」比灰着更像坏掉。
 *
 * 「恢复」只影响这一个按钮、且随时可以再收回来，所以是一点即恢复，不做两步确认；
 * 一次性改动整张列表的「全部恢复」才需要确认（见 StashPanel）。
 *
 * @param props 行数据与两个动作回调，见 StashRowProps。
 * @returns 收纳包行元素。
 */
function StashRow(props: StashRowProps): any {
  const row = props.row;
  const inert = row.missing || !row.navigable;
  let hint = t("action.goto");
  if (row.missing) hint = t("scope.missing");
  else if (!row.navigable) hint = t("action.static");
  const icon = rowIconOf(row.scope, row.id);
  return h("div", { className: "lo-stash-row" },
    h("button", {
      type: "button",
      className: "lo-stash-main",
      disabled: inert,
      title: hint,
      onClick: function () {
        props.onOpen(row);
      }
    },
      h(RowIcon, { svg: icon, text: row.label }),
      h("span", { className: "lo-stash-label" }, row.label),
      h("span", { className: "lo-tag" }, row.id)
    ),
    // 「进更多」放在「恢复」左边：级别由近到远是「列表 → 更多 → 悬浮框」，
    // 从左到右正好是「进更多」再「恢复回列表」（用户 m06865#2 指定这个顺序）。
    // 哪几处槽位有「更多」这个容器不归这里管，问 `moreScopeOk`。
    props.canIntoMore && props.onIntoMore
      ? h(Btn, {
        title: t("action.intoMore"),
        onClick: function () {
          props.onIntoMore(row);
        }
      }, t("action.intoMore"))
      : null,
    h(Btn, {
      title: t("action.restore"),
      variant: "soft",
      onClick: function () {
        props.onRestore(row);
      }
    }, t("action.restore"))
  );
}

function StashPanel(props: StashPanelProps): any {
  const ctx = props.ctx;
  const store = props.store;
  useStoreTick(store);
  useSlotsTick(ctx);
  const state = store.get();
  const mode = state.stashSort;
  // 搜索串只留在这个面板的本地状态里：关掉收纳包即清空，不写 store。
  const queryPair = useState("");
  const rawQuery = queryPair[0];
  const setQuery = queryPair[1];
  const query = normalizeQuery(rawQuery);
  const rows = sortStash(stashView(ctx, state), mode);
  const visible: StashItem[] = [];
  let v: number;
  for (v = 0; v < rows.length; v++) {
    const row = rows[v];
    // 名字、id、所属位置三者任一命中都算：用户记得哪个都能搜到。
    if (!query || hitQuery(row.label, query) || hitQuery(row.id, query) || hitQuery(row.scopeLabel, query)) visible.push(row);
  }
  const groups = groupStash(visible, mode);

  useEffect(function () {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeStash();
      }
    }
    document.addEventListener("keydown", onKey, true);
    return function () {
      document.removeEventListener("keydown", onKey, true);
    };
  }, []);

  function restore(row: StashItem): void {
    store.update(function (next: PluginState) {
      setHidden(next, row.scope, row.id, false);
    });
  }

  /**
   * 直接从收纳包挪进「更多」：两处收纳互斥，`setIntoMore` 会顺手摘掉 hidden 键，
   * 于是这一行从收纳包消失、在「更多」菜单里出现，少一次「先恢复、再右键收进更多」。
   *
   * @param row 收纳包里的一行。
   */
  function intoMore(row: StashItem): void {
    store.update(function (next: PluginState) {
      setIntoMore(next, row.scope, row.id, true);
    });
  }

  function open(row: StashItem): void {
    // 界面上本来点不动的行不进导航：导航会关掉收纳包与设置弹窗，等于「点了个寂寞还丢了位置」。
    if (row.missing || !row.navigable) return;
    // 先抵达目标再关闭；设置行只存在于弹窗内，故跳过关闭，交给 `navigateTo`
    if (row.scope === "settings") {
      closeStash();
      navigateTo(ctx, row.scope, row.id);
      return;
    }
    navigateTo(ctx, row.scope, row.id);
    closeStash();
    // 在下一帧（点击派发后）关掉设置弹窗
    window.requestAnimationFrame(function () {
      closeSettings();
    });
  }

  const body: any[] = [];
  // 分组标题的折叠状态存在 store 里（options.collapsed），关掉收纳包再打开保持原样。
  const collapsedMap: Record<string, boolean> = state.options.collapsed || {};
  let i: number;
  let j: number;
  for (i = 0; i < groups.length; i++) {
    (function (group: StashGroup) {
      // 有标题的分组在标题右侧带一个「恢复本组默认」；按名称排序（alpha）没有标题，也就不放按钮、
      // 不做折叠——没有「类」可折。
      if (group.title) {
        const collapsedKey = "stash:" + mode + ":" + group.key;
        // 搜索时也照常可折叠：与设置页的卡片同一套行为。
        const expanded = collapsedMap[collapsedKey] !== true;
        const toggleGroup = function (): void {
          store.update(function (next: PluginState) {
            if (!next.options.collapsed) next.options.collapsed = {};
            next.options.collapsed[collapsedKey] = expanded;
          });
        };
        body.push(h("div", {
          key: "g" + i,
          className: "lo-stash-group",
          "data-open": expanded ? "1" : "0",
          role: "button",
          tabIndex: 0,
          "aria-expanded": expanded ? "true" : "false",
          title: t("action.toggleGroup"),
          // 整行都是折叠开关：标题、小三角与恢复按钮右侧的空白都算，只有「恢复本组默认」自己管自己。
          onClick: function (event: any) {
            if (event && event.target && event.target.closest && event.target.closest(".lo-btn")) return;
            toggleGroup();
          },
          onKeyDown: function (event: any) {
            if (event && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              toggleGroup();
            }
          }
        },
          h("span", { className: "lo-stash-group-title" },
            h("span", { className: "lo-stash-group-text" }, group.title)
          ),
          h(ConfirmBtn, {
            label: t("action.reset"),
            confirmLabel: t("action.confirmResetGroup"),
            disabled: !groupDirty(state, group),
            onConfirm: function () {
              store.update(function (next: PluginState) {
                const scopes = groupScopes(group);
                for (let k = 0; k < scopes.length; k++) resetScope(next, scopes[k]);
              });
            }
          }),
          // 小三角在整行最右端（恢复按钮之后），与设置页卡片的标题行同一位置。
          h("span", { className: "lo-stash-group-chev", "aria-hidden": "true" }, "\u25be")
        ));
        if (!expanded) return;
      }
      for (j = 0; j < group.rows.length; j++) {
        (function (row: StashItem) {
          body.push(h(StashRow, {
            key: row.key,
            row: row,
            onOpen: open,
            onRestore: restore,
            canIntoMore: moreScopeOk(row.scope),
            onIntoMore: intoMore
          }));
        })(group.rows[j]);
      }
    })(groups[i]);
  }

  return ReactDOM.createPortal(
    h(React.Fragment, null,
      h("div", { className: "lo-mask", onClick: closeStash }),
      h("div", { className: "lo-stash", role: "dialog", "aria-label": t("stash.title") },
        h("div", { className: "lo-stash-head" },
          h("span", { className: "lo-stash-title" }, t("stash.title")),
          h("span", { className: "lo-stash-count" }, t("stash.count").replace("{count}", query ? visible.length + " / " + rows.length : String(rows.length))),
          h("button", { type: "button", className: "lo-stash-close", onClick: closeStash, title: t("action.close") }, "\u00d7")
        ),
        h("div", { className: "lo-stash-sorts" },
          SORT_MODES.map(function (item: string) {
            return h(Chip, {
              key: item,
              active: mode === item,
              onClick: function () {
                store.update(function (next: PluginState) {
                  next.stashSort = item;
                });
              }
            }, t(SORT_MODE_KEYS[item]));
          })
        ),
        h("div", { className: "lo-stash-search" },
          h(SearchBox, {
            value: rawQuery,
            placeholder: t("search.placeholder"),
            clearLabel: t("search.clear"),
            onChange: setQuery
          })
        ),
        h("div", { className: "lo-stash-actions" },
          h(ConfirmBtn, {
            label: t("action.restoreAll"),
            confirmLabel: t("action.confirmRestore"),
            disabled: rows.length === 0,
            onConfirm: function () {
              store.update(function (next: PluginState) {
                restoreAllHidden(next);
              });
            }
          })
        ),
        h("div", { className: "lo-stash-body" },
          visible.length === 0
            ? h("div", { className: "lo-empty" }, query ? t("empty.search") : t("empty.stash"))
            : body
        )
      )
    ),
    document.body
  );
}

function createFlag(): StashFlag {
  const listeners: Array<(value: boolean) => void> = [];
  let value = false;
  return {
    get: function (): boolean {
      return value;
    },
    set: function (next: boolean): void {
      if (value === next) return;
      value = next;
      const snapshot = listeners.slice();
      let i: number;
      for (i = 0; i < snapshot.length; i++) {
        try {
          snapshot[i](value);
        } catch (err) {
          // 一个坏的订阅者不能拖垮其它订阅者
        }
      }
    },
    subscribe: function (listener: (value: boolean) => void): () => void {
      listeners.push(listener);
      return function (): void {
        const index = listeners.indexOf(listener);
        if (index >= 0) listeners.splice(index, 1);
      };
    }
  };
}

const stashFlag: StashFlag = createFlag();

function openStash(): void {
  stashFlag.set(true);
}

function closeStash(): void {
  stashFlag.set(false);
}

/**
 * 启动器吸附到一侧并保留垂直偏移；不做垂直吸附。
 *
 * @param props 上下文与状态句柄，见 StashLauncherProps。
 * @returns 启动器按钮，`count > 0` 时带数量角标；`options.showStashLauncher` 为 false 时不渲染。
 */
function StashLauncher(props: StashLauncherProps): any {
  const ctx = props.ctx;
  const store = props.store;
  useStoreTick(store);
  const state = store.get();
  const count = stashCount(state);

  const sizePair = useState({ width: 0, height: 0 });
  const size = sizePair[0];
  const setSize = sizePair[1];
  const ref = useRef<any>(null);
  const dragRef = useRef<any>(null);
  // 拖动期间把 style 写入合并到一帧一次的句柄。
  const frameRef = useRef(0);
  const tickPair = useState(0);
  const tick = tickPair[0];
  const setTick = tickPair[1];

  useEffect(function () {
    function onResize() {
      setTick(function (value: number) {
        return value + 1;
      });
    }
    window.addEventListener("resize", onResize);
    return function () {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(function () {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      if (rect.width !== size.width || rect.height !== size.height) {
        setSize({ width: rect.width, height: rect.height });
      }
    }
  });

  // 组件卸载时不要留下一个已经排队的帧。
  useEffect(function () {
    return function () {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }
    };
  }, []);

  if (state.options.showStashLauncher === false) return null;

  const side = state.options.launcherSide === "left" ? "left" : "right";
  const width = size.width || 120;
  const height = size.height || 32;
  // 拖动前 `launcherY` 为 null；断言在构建时擦除，`clampLauncherY` 对 null 处理不变。
  const y = clampLauncherY(state.options.launcherY as number, height);
  // 仅拖动中有 `launcherX`：按住时横向跟手，松手清空并按所在半边贴左/贴右。
  const liveX = state.options.launcherX;
  const dragged = typeof liveX === "number" && isFinite(liveX);
  const x = dragged
    ? clampLauncherX(liveX as number, width)
    : side === "left"
      ? LAUNCHER_MARGIN
      : Math.max(LAUNCHER_MARGIN, window.innerWidth - width - LAUNCHER_MARGIN);

  function onPointerDown(event: any): void {
    if (event.button !== undefined && event.button !== 0) return;
    const rect = ref.current.getBoundingClientRect();
    dragRef.current = {
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
      moved: false,
      width: rect.width,
      height: rect.height,
      x: rect.left,
      y: rect.top
    };
    if (ref.current.setPointerCapture) {
      try {
        ref.current.setPointerCapture(event.pointerId);
      } catch (err) {
        // 指针捕获非必需，失败可忽略
      }
    }
  }

  function onPointerMove(event: any): void {
    const drag = dragRef.current as DragState | null;
    if (!drag) return;
    if (!drag.moved) {
      // 两个轴都必须测，纯横向拖动也要越过 3px 阈值
      const rect = ref.current.getBoundingClientRect();
      const dx = Math.abs(event.clientX - (drag.dx + rect.left));
      const dy = Math.abs(event.clientY - (drag.dy + rect.top));
      if (dx < 3 && dy < 3) return;
      drag.moved = true;
    }
    // 位置先只写进手势状态，由 rAF 一次性落到元素 style；松手才写回 store
    drag.x = clampLauncherX(event.clientX - drag.dx, drag.width);
    drag.y = clampLauncherY(event.clientY - drag.dy, drag.height);
    if (frameRef.current) return;
    frameRef.current = window.requestAnimationFrame(function () {
      frameRef.current = 0;
      const live = dragRef.current as DragState | null;
      const node = ref.current;
      if (!live || !node) return;
      node.style.left = Math.round(live.x) + "px";
      node.style.top = Math.round(live.y) + "px";
    });
  }

  function onPointerUp(event: any): void {
    const drag = dragRef.current as DragState | null;
    dragRef.current = null;
    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }
    if (!drag) return;
    if (drag.moved) {
      // 松手才定边：指针在窗口左半边贴左、右半边贴右；同时清掉 `launcherX`。
      const nextSide = event.clientX < window.innerWidth / 2 ? "left" : "right";
      // 拖动期间位置直写元素、React 看不到，按渲染时同样的算法再写一次最终位置
      const node = ref.current;
      if (node) {
        node.style.left =
          Math.round(nextSide === "left" ? LAUNCHER_MARGIN : Math.max(LAUNCHER_MARGIN, window.innerWidth - drag.width - LAUNCHER_MARGIN)) + "px";
        node.style.top = Math.round(drag.y) + "px";
      }
      store.update(function (state2: PluginState) {
        state2.options.launcherSide = nextSide;
        state2.options.launcherX = null;
        state2.options.launcherY = drag.y;
      });
    } else {
      if (state.options.launcherX !== null) {
        store.update(function (state2: PluginState) {
          state2.options.launcherX = null;
        });
      }
      openStash();
    }
  }

  return h("button", {
    type: "button",
    ref: ref,
    className: "lo-launcher",
    "data-dragging": dragRef.current ? "1" : undefined,
    // 不要 `title`：原生 tooltip 会在拖动时弹出来挡在按钮上。名字交给 `aria-label`。
    "aria-label": t("stash.launcher"),
    style: { left: Math.round(x) + "px", top: Math.round(y) + "px" },
    onPointerDown: onPointerDown,
    onPointerMove: onPointerMove,
    onPointerUp: onPointerUp,
    onPointerCancel: onPointerUp
  },
    // 启动器用本插件自己的图标做标识：它是这一处「已收纳的悬浮框」的唯一入口，
    // 写成文字既占地方又和侧边栏里的按钮长得不一样。
    h(Icon, { svg: ICON_SVG, className: "lo-launcher-ico", name: "layout" }),
    count > 0 ? h("span", { className: "lo-launcher-count" }, String(count)) : null
  );
}

/**
 * portal 画进 <body>：官方浮层 z-index:20 的层叠上下文会把 slot 子元素压在设置弹窗(1000)之下
 *
 * @param props 上下文与状态句柄，见 StashSurfaceProps。
 * @returns 启动器与（收纳包打开时的）面板，经 createPortal 挂到 body 上。
 */
function StashSurface(props: StashSurfaceProps): any {
  const pair = useState(stashFlag.get());
  const open = pair[0];
  const setOpen = pair[1];
  useEffect(function () {
    return stashFlag.subscribe(setOpen);
  }, []);
  return ReactDOM.createPortal(
    h(React.Fragment, null,
      h(StashLauncher, { ctx: props.ctx, store: props.store }),
      open ? h(StashPanel, { ctx: props.ctx, store: props.store }) : null
    ),
    document.body
  );
}