
// `missing`：行被收纳了，但拥有它的页面此刻未挂载，打不开。
interface StashItem {
  scope: string;
  id: string;
  key: string;
  label: string;
  kind: string;
  missing: boolean;
  scopeLabel: string;
  scopeIndex: number;
  orderIndex: number;
}

// 「按页面」「按类型」拆成带标题的分组；字母序是扁平列表（`title` 为 `null` 的一组）。
interface StashGroup {
  title: string | null;
  rows: StashItem[];
}

interface StashRowProps {
  row: StashItem;
  onOpen: (row: StashItem) => void;
  onRestore: (row: StashItem) => void;
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
  const ledger: Record<string, { id: string; label: string; order: number }[]> = {};
  let i: number;
  let j: number;
  for (i = 0; i < SCOPES.length; i++) ledger[SCOPES[i].key] = readEntries(ctx, SCOPES[i].key);

  const entries: { scope: string; id: string; key: string }[] = stashEntries(state);
  const out: StashItem[] = [];
  for (i = 0; i < entries.length; i++) {
    const item = entries[i];
    const spec = SCOPE_OF_KEY[item.scope];
    const list = ledger[item.scope] || [];
    let entry: { id: string; label: string; order: number } | null = null;
    for (j = 0; j < list.length; j++) if (list[j].id === item.id) entry = list[j];
    out.push({
      scope: item.scope,
      id: item.id,
      key: item.key,
      label: entry ? entry.label : item.id,
      kind: kindOf(state, item.scope, item.id),
      missing: !entry,
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
  if (mode === "alpha") return [{ title: null, rows: rows }];
  const groups: StashGroup[] = [];
  const index: Record<string, number> = {};
  let i: number;
  for (i = 0; i < rows.length; i++) {
    const row = rows[i];
    const title = mode === "kind" ? t(row.kind === "official" ? "kind.official" : "kind.third") : row.scopeLabel;
    if (index[title] === undefined) {
      index[title] = groups.length;
      groups.push({ title: title, rows: [] });
    }
    groups[index[title]].rows.push(row);
  }
  return groups;
}

function StashRow(props: StashRowProps): any {
  const row = props.row;
  return h("div", { className: "lo-stash-row" },
    h("button", {
      type: "button",
      className: "lo-stash-main",
      disabled: row.missing,
      title: row.missing ? t("scope.missing") : t("action.goto"),
      onClick: function () {
        props.onOpen(row);
      }
    },
      h("span", { className: "lo-swatch", "data-kind": row.id === SELF_ID && row.scope === "settings" ? "self" : row.kind }),
      h("span", { className: "lo-stash-label" }, row.label),
      h("span", { className: "lo-tag" }, row.scopeLabel)
    ),
    h(Btn, {
      onClick: function () {
        props.onRestore(row);
      },
      title: t("action.restore")
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
  const rows = sortStash(stashView(ctx, state), mode);
  const groups = groupStash(rows, mode);

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

  function open(row: StashItem): void {
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
  let i: number;
  let j: number;
  for (i = 0; i < groups.length; i++) {
    if (groups[i].title) body.push(h("div", { key: "g" + i, className: "lo-stash-group" }, groups[i].title));
    for (j = 0; j < groups[i].rows.length; j++) {
      (function (row: StashItem) {
        body.push(h(StashRow, { key: row.key, row: row, onOpen: open, onRestore: restore }));
      })(groups[i].rows[j]);
    }
  }

  return ReactDOM.createPortal(
    h(React.Fragment, null,
      h("div", { className: "lo-mask", onClick: closeStash }),
      h("div", { className: "lo-stash", role: "dialog", "aria-label": t("stash.title") },
        h("div", { className: "lo-stash-head" },
          h("span", { className: "lo-stash-title" }, t("stash.title")),
          h("span", { className: "lo-stash-count" }, t("stash.count").replace("{count}", String(rows.length))),
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
        h("div", { className: "lo-stash-actions" },
          h(Btn, {
            disabled: rows.length === 0,
            onClick: function () {
              store.update(function (next: PluginState) {
                restoreAllHidden(next);
              });
            }
          }, t("action.restoreAll"))
        ),
        h("div", { className: "lo-stash-body" },
          rows.length === 0 ? h("div", { className: "lo-empty" }, t("empty.stash")) : body
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

// 启动器吸附到一侧并保留垂直偏移；不做垂直吸附。
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
    // 不要 `title`：原生 tooltip 会在拖动时弹出来挡在按钮上。
    style: { left: Math.round(x) + "px", top: Math.round(y) + "px" },
    onPointerDown: onPointerDown,
    onPointerMove: onPointerMove,
    onPointerUp: onPointerUp,
    onPointerCancel: onPointerUp
  },
    h("span", null, t("stash.launcher")),
    count > 0 ? h("span", { className: "lo-launcher-count" }, String(count)) : null
  );
}

// portal 画进 <body>：官方浮层 z-index:20 的层叠上下文会把 slot 子元素压在设置弹窗(1000)之下
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