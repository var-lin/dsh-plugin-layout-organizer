/**
 * 屏幕上的菜单行（只算本插件画的，且属于这处菜单）。
 *
 * @param region `sidebar` 或 `conversation`。
 * @returns 按 DOM 顺序的行元素。
 */
function moreRowNodes(region: string): HTMLElement[] {
  const nodes = document.querySelectorAll("[data-lo-more-key]");
  const out: HTMLElement[] = [];
  let i;
  for (i = 0; i < nodes.length; i++) {
    const node = nodes[i] as HTMLElement;
    if (node.getAttribute("data-lo-more-region") !== region) continue;
    out.push(node);
  }
  return out;
}

/**
 * 指针停在这个高度时，被拖的行应该落在第几位。
 *
 * 只数「中线在指针上方」的其它行——和列表拖拽同一套几何，手感一致。
 *
 * @param region `sidebar` 或 `conversation`。
 * @param key 被拖行的身份。
 * @param y 指针的 clientY。
 * @returns 目标下标；算不出来时返回 -1。
 */
function moreDropIndex(region: string, key: string, y: number): number {
  const nodes = moreRowNodes(region);
  let at = 0;
  let dragged = -1;
  let i;
  for (i = 0; i < nodes.length; i++) {
    if (nodes[i].getAttribute("data-lo-more-key") === key) {
      dragged = i;
      continue;
    }
    const rect = nodes[i].getBoundingClientRect();
    if (y > rect.top + rect.height / 2) at++;
  }
  if (dragged < 0) return -1;
  return at;
}

/**
 * 上移 / 下移两项：拖不动的时候也能排位，键盘用户也有退路。
 *
 * @param store 状态句柄。
 * @param region `sidebar` 或 `conversation`。
 * @param key 目标行的身份。
 * @returns 两项菜单动作。
 */
function moreMoveActions(store: StoreHandle, region: string, key: string): MenuAction[] {
  const keys = moreKeysIn(store.get(), region);
  const at = keys.indexOf(key);

  function move(delta: number): void {
    moveMoreRow(store, region, key, delta);
  }

  return [
    {
      label: t("action.up"),
      icon: MENU_ICON_UP,
      disabled: at <= 0,
      run: function (): void {
        move(-1);
      }
    },
    {
      label: t("action.down"),
      icon: MENU_ICON_DOWN,
      disabled: at < 0 || at >= keys.length - 1,
      run: function (): void {
        move(1);
      }
    }
  ];
}

/**
 * 一行：整行就是按钮（和宿主自己的菜单项一样，点的是一整条，不是只有文字）。
 *
 * 图标来自原按钮（见 `liveRowIcon`）；原按钮没有图标时用名字首字顶上（见 `RowIcon`）。
 *
 * @param props 宿主上下文、状态句柄、行身份。
 * @returns 菜单行。
 */
function MoreMenuRow(props: {
  ctx: CtxLike;
  store: StoreHandle;
  region: string;
  scope: string;
  id: string;
  onDismiss?: () => void;
}): any {
  const ctx = props.ctx;
  const scope = props.scope;
  const id = props.id;
  const key = rowKey(scope, id);
  // 与悬浮框同一套取名字规则：同一个按钮在两处不能叫两个名字（用户 m09308#2）。
  const label = rowLabelText(ctx, scope, id);
  // 图标只认原按钮自己画的；没有就用名字首字。
  const icon = rowIconOf(scope, id);

  function open(): void {
    moreActivate(ctx, key, props.onDismiss ? props.onDismiss : null);
  }

  function menuFor(event: any): void {
    event.preventDefault();
    event.stopPropagation();
    moreRowMenuAt(event, props.store, props.region, key);
  }

  return h(
    "button",
    {
      type: "button",
      // 整行就是按钮：宿主的菜单项也是这个标签，样式与点击区域才对得上。
      role: "menuitem",
      className: "lo-more-row",
      "data-lo-more-key": key,
      "data-lo-more-scope": scope,
      "data-lo-more-id": id,
      "data-lo-more-region": props.region,
      title: t("action.drag"),
      onClick: open,
      onContextMenu: menuFor
    },
    h(RowIcon, { svg: icon, text: label }),
    h("span", { className: "lo-more-text" }, label)
  );
}

/**
 * 「更多」菜单里本插件列的行。
 *
 * 列的是**状态里收进来的行**（`moreRowsIn` 读 `state.intoMore`），不是「这一轮投影到的行」：
 * 设置页的行只有打开设置弹窗时才会被投影到，按投影筛会让「在设置页收进更多」看起来毫无效果。
 *
 * @param props 宿主传入的菜单上下文（`onDismiss` 用于点完即关）+ 本插件注入的 ctx / store / region。
 * @returns 菜单行，或 null。
 */
function MoreMenuContent(props: MoreMenuProps): any {
  const ctx = props ? props.loCtx : null;
  const store = props ? props.loStore : null;
  const region = props && props.loRegion ? (props.loRegion as string) : "sidebar";
  // 对话页这扇菜单带着宿主的选择回调（标签条自己的 `selectView`）。收下来：标签被宿主的
  // 宽度预算挤出标签条时，DOM 里没有那一颗按钮，导航只能靠它直选（用户 m00655）。
  // 写全局放在 effect 里：渲染期写模块变量在并发渲染下会写进另一棵树。
  const onOpen = props ? props.onOpen : null;
  React.useEffect(
    function (): (() => void) | void {
      if (region !== "conversation") return;
      setViewOpener(typeof onOpen === "function" ? (onOpen as (id: string) => void) : null);
      // 卸载时收回：菜单关了以后那个回调不该再被导航拿去用。
      return function (): void {
        setViewOpener(null);
      };
    },
    [onOpen, region]
  );
  // 宿主因宽度不够把标签条里放不下的标签自己收进这扇菜单时，会通过 `entries` 把它们的 id 交出来。
  // 这些 id 宿主已经替它们画了行（点击直连 `selectView`），我们同一颗标签再画一行就是重复项。
  // 宿主那行去不掉，去重只能去我们这行（用户 m00878）。
  const hostViews: string[] = [];
  if (props && region === "conversation" && Array.isArray(props.entries)) {
    const entries = props.entries as Array<{ id?: unknown }>;
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry && typeof entry.id === "string") hostViews.push(entry.id);
    }
  }
  // 冒烟测试会拿空 props 渲染一次；宿主属性没到齐时安静退出。
  if (!ctx || !store) return null;
  return h(MoreMenuRows, {
    ctx: ctx,
    store: store,
    region: region,
    hostViews: hostViews,
    onDismiss: props.onDismiss
  });
}

function MoreMenuRows(props: MoreMenuRowsProps): any {
  const ctx = props.ctx;
  const store = props.store;
  const region = props.region;
  // 两处账本都会变：槽位（有哪些行）与状态（哪些行被收进来、菜单怎么排）。
  useSlotsTick(ctx);
  useStoreTick(store);
  const state = store.get();
  const rows = moreRowsIn(state, region);
  // 宿主已经替某些标签画了行：同一颗标签若也被我们收进来，再画一行就是重复项。
  // 只去我们这行——宿主那行由它自己渲染，删不掉也接管不了（用户 m00878）。
  const hostViews = props.hostViews ? props.hostViews : [];
  const shown = rows.filter(function (row) {
    return !(row.scope === "tabs" && hostViews.indexOf(row.id) >= 0);
  });
  const divider = moreDividerOn(state);
  // 手势是窗口级的，得知道这一下属于哪一份菜单。渲染提交后再发布，别在渲染期改模块状态。
  React.useEffect(function (): void {
    loMoreMenuCtx = ctx;
    loMoreMenuStore = store;
    loMoreMenuDismiss = props.onDismiss ? props.onDismiss : null;
  });

  // 拖拽与右键都走窗口级捕获。
  //
  // 宿主的菜单在 pointerdown 上就判「点在外面」并把菜单关掉——在我们的行上直接挂 React
  // 监听是抢不过它的（事件先到 window/document 的捕获阶段）。所以这两件事必须在捕获阶段
  // 先一步把事件拦下来，宿主的关闭判定才不会看到这次点击。
  React.useEffect(
    function (): any {
      installMoreGestures();
      return function (): void {
        uninstallMoreGestures();
        // 菜单是被卸载的，不是拖完的：上一次拖拽若没收尾（比如拖动中菜单被关），
        // 行上的拖动样式、落点高亮与 grabbing 光标会留在原地，下次打开就带着旧状态。
        resetMoreDrag();
      };
    },
    [ctx, region]
  );

  const out: any[] = [];
  let dividerDone = false;
  let i;
  for (i = 0; i < shown.length; i++) {
    const row = shown[i];
    const key = rowKey(row.scope, row.id);
    const group = kindOf(state, row.scope, row.id) === "official" ? "official" : "third";
    // 画线时在官方块与第三方块之间补一条；只有第三方块真的存在时才补，否则线会吊在末尾。
    if (divider && !dividerDone && group === "third") {
      dividerDone = true;
      out.push(h("div", { key: "lo-more-divider", className: "lo-more-divider", "data-lo-more-divider": "" }));
    }
    out.push(
      h(MoreMenuRow, {
        key: key,
        ctx: ctx,
        store: store,
        region: region,
        scope: row.scope,
        id: row.id,
        onDismiss: props.onDismiss
      })
    );
  }
  return h(React.Fragment, null, out);
}
