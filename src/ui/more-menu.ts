// 「更多」菜单里的行。被「收进更多」的行在主列表让位（`applyScope` 打上隐藏标记），
// 改由这里列出来——仍然点得开，也仍然移得回去，所以「收进去」不等于「消失」。
//
// 这一层注册进宿主的「更多」槽位（侧边栏的 `sidebar.panellist.actions` 与对话顶部的
// `conversation.session.header.views.actions`）：菜单是宿主 portal 出去的 React 树，
// 直接往里插 DOM 会在下一次重渲染时被冲掉，只有走槽位才是稳的。
//
// 两处菜单共用这一份实现，靠 `region` 分辨读哪一份清单（见 `moreScopesIn`）。
//
// 注意：菜单行**不能**打投影用的 `data-lo-row` / `data-lo-scope` / `data-lo-id` 标记。
// 那几个属性是「这一轮投影真正标记到的行」的身份，`liveOrder` 与投影清场都按它们扫全文档；
// 菜单行在 portal 出来的菜单里，一旦冒充被标记行，就会被当成幽灵行清掉，也会搅乱 `liveOrder`。
// 因此菜单行用自己的 `data-lo-more-*` 属性。
//
// 手势全在这一层自己身上（React 的 pointer / contextmenu 事件），不再去菜单容器上挂委托。
//
// 宿主自己画的那两项（浏览更多插件 / 创建你的插件）不是槽位条目、没有 id，结构上拖不动。
// 这里把它们**接管**过来：读出宿主当场渲染的文案与图标，把原件藏起来，用本插件自己的行重画，
// 点击时转交宿主暴露的两个服务。于是这两项与其它行完全同质：可拖、可右键、能排到任意位置。
// 只关 `display`、不改宿主的结构，宿主若重画也认得出；认得不对时就只读不藏，退回原样。
//
// 顺序存在 `state.moreOrder[region]`，与各 scope 的 `order` 分开：一扇菜单能列出好几处的行。
interface MoreMenuProps {
  loCtx?: CtxLike;
  loStore?: StoreHandle;
  loRegion?: string;
  onDismiss?: () => void;
}

// 拖动结束后紧跟的那次 click 要吞掉，否则一拖就顺手把行点开了。菜单一次只开一处，模块级够用。
let loMoreSuppressClick = 0;

// 手势不走 React 的合成事件，而是在窗口的**捕获阶段**拦下来。
//
// 原因是宿主的菜单自己有一套「点到外面就关」的逻辑，挂在文档上：一旦它先看到按下这一下，
// 菜单当场关掉，我们后面既拖不动也点不着（用户报过「更多里全都不能拖、不能右键」）。
// 捕获阶段比文档早，截住之后宿主就看不到这次事件，菜单老老实实开着；需要关的时候由我们
// 自己调 `onDismiss`。整条路因此不依赖宿主内部的标签与类名，宿主换实现也不受影响。
//
// 菜单一次只开一处，所以「当前这扇菜单」用一个模块级槽位记住就够。
let loMoreMenuCtx: CtxLike | null = null;
let loMoreMenuStore: StoreHandle | null = null;
let loMoreMenuRegion = "";
let loMoreMenuDismiss: (() => void) | null = null;
let loMoreGesturesBound = false;
let loMoreGestureRefs = 0;

// 正在按下的那一行、以及有没有真的拖起来。指针可能抬在行外，所以记在模块级。
const loMoreDrag: { node: HTMLElement | null; key: string; region: string; startY: number; active: boolean } = {
  node: null,
  key: "",
  region: "",
  startY: 0,
  active: false
};

/**
 * 事件落在哪一行上。
 *
 * @param target 事件目标。
 * @returns 那一行的元素；不在本插件的菜单行上时返回 null。
 */
function moreRowOf(target: any): HTMLElement | null {
  if (!target || typeof target.closest !== "function") return null;
  return target.closest("[data-lo-more-key]") as HTMLElement | null;
}

/**
 * 把一次「点开这一行」做完。
 *
 * 普通行先跳转再关菜单（反过来先关，宿主卸载时可能清掉要点的东西）；
 * 宿主那两项动作行先点原件，原件不在才退到宿主服务。
 *
 * @param ctx 宿主上下文。
 * @param region `sidebar` 或 `conversation`。
 * @param key 行身份（`scope:id`）。
 * @param onDismiss 关掉这扇菜单。
 */
function moreActivate(ctx: CtxLike | null, region: string, key: string, onDismiss: (() => void) | null): void {
  if (!ctx) return;
  const cut = key ? key.indexOf(":") : -1;
  if (cut <= 0) return;
  const scope = key.slice(0, cut);
  const id = key.slice(cut + 1);
  if (!id) return;
  navigateTo(ctx, scope, id);
  if (onDismiss) onDismiss();
}

/**
 * 这一行的右键菜单：排位两项，普通行再加「出更多」与「收起」。
 *
 * @param event 右键事件。
 * @param store 状态句柄。
 * @param region `sidebar` 或 `conversation`。
 * @param key 行身份。
 */
function moreRowMenuAt(event: any, store: StoreHandle, region: string, key: string): void {
  const cut = key ? key.indexOf(":") : -1;
  if (cut <= 0) return;
  const scope = key.slice(0, cut);
  const id = key.slice(cut + 1);
  const actions = moreMoveActions(store, region, key);
  actions.push({
    label: t("action.outOfMore"),
    icon: ACTION_ICON_OUT_OF_MORE,
    disabled: false,
    run: function (): void {
      store.update(function (state: PluginState): void {
        setIntoMore(state, scope, id, false);
      });
    }
  });
  actions.push({
    label: t("action.stash"),
    icon: MENU_ICON_ARCHIVE,
    disabled: false,
    run: function (): void {
      store.update(function (state: PluginState): void {
        setHidden(state, scope, id, true);
      });
    }
  });
  openMenu(event, actions);
}

function moreGestureDown(event: any): void {
  if (event.button !== 0) return;
  const row = moreRowOf(event.target);
  if (!row) return;
  // 截住：宿主那套「点外面就关」看不到这一下，菜单就不会在按下瞬间消失。
  event.stopPropagation();
  loMoreDrag.node = row;
  loMoreDrag.key = row.getAttribute("data-lo-more-key") || "";
  loMoreDrag.region = row.getAttribute("data-lo-more-region") || "";
  loMoreDrag.startY = event.clientY;
  loMoreDrag.active = false;
}

function moreGestureMove(event: any): void {
  const node = loMoreDrag.node;
  if (!node) return;
  if (!loMoreDrag.active) {
    if (Math.abs(event.clientY - loMoreDrag.startY) < LO_DRAG_THRESHOLD) return;
    loMoreDrag.active = true;
    node.classList.add("lo-more-dragging");
    document.documentElement.style.cursor = "grabbing";
  }
  event.preventDefault();
  event.stopPropagation();
  const store = loMoreMenuStore;
  if (!store) return;
  const region = loMoreDrag.region;
  const keys = moreKeysNow(store, region);
  const from = keys.indexOf(loMoreDrag.key);
  if (from < 0) return;
  const at = moreDropIndex(region, loMoreDrag.key, event.clientY);
  if (at < 0 || at === from) return;
  keys.splice(from, 1);
  keys.splice(at, 0, loMoreDrag.key);
  store.update(function (state: PluginState): void {
    setMoreOrder(state, region, keys);
  });
}

function moreGestureUp(event: any): void {
  if (!loMoreDrag.node) return;
  if (loMoreDrag.active) {
    // 拖完抬手不该顺手把这一行点开。
    loMoreSuppressClick = Date.now() + LO_CLICK_SUPPRESS_MS;
    event.stopPropagation();
  }
  loMoreDrag.node.classList.remove("lo-more-dragging");
  document.documentElement.style.cursor = "";
  loMoreDrag.node = null;
  loMoreDrag.key = "";
  loMoreDrag.active = false;
}

/**
 * 按下这一行时再拦一道 `mousedown`。
 *
 * 宿主判断「点在外面」用哪个事件并不公开（`pointerdown` 与 `mousedown` 各占一半），两个都截，
 * 才轮不到它把菜单关在我们正要点的那一行上。
 *
 * @param event 鼠标按下事件。
 */
function moreGestureMouseDown(event: any): void {
  if (!moreRowOf(event.target)) return;
  event.stopPropagation();
}

function moreGestureClick(event: any): void {
  const row = moreRowOf(event.target);
  if (!row) return;
  event.preventDefault();
  event.stopPropagation();
  if (Date.now() < loMoreSuppressClick) return;
  moreActivate(
    loMoreMenuCtx,
    row.getAttribute("data-lo-more-region") || loMoreMenuRegion,
    row.getAttribute("data-lo-more-key") || "",
    loMoreMenuDismiss
  );
}

function moreGestureContext(event: any): void {
  const row = moreRowOf(event.target);
  if (!row) return;
  event.preventDefault();
  event.stopPropagation();
  const store = loMoreMenuStore;
  if (!store) return;
  moreRowMenuAt(event, store, row.getAttribute("data-lo-more-region") || "", row.getAttribute("data-lo-more-key") || "");
}

/**
 * 挂上手势监听。
 *
 * 两处菜单（侧边栏 / 对话）共用一个全局监听，用引用计数管着，最后一个菜单卸载才摘。
 */
function installMoreGestures(): void {
  loMoreGestureRefs++;
  if (loMoreGesturesBound) return;
  if (typeof window === "undefined") return;
  loMoreGesturesBound = true;
  window.addEventListener("pointerdown", moreGestureDown, true);
  window.addEventListener("mousedown", moreGestureMouseDown, true);
  window.addEventListener("pointermove", moreGestureMove, true);
  window.addEventListener("pointerup", moreGestureUp, true);
  window.addEventListener("pointercancel", moreGestureUp, true);
  window.addEventListener("contextmenu", moreGestureContext, true);
  window.addEventListener("click", moreGestureClick, true);
}

/**  * 摘掉手势监听（引用计数归零才真的摘）。  */ function uninstallMoreGestures(): void {   loMoreGestureRefs = Math.max(0, loMoreGestureRefs - 1);   if (loMoreGestureRefs > 0) return;   if (!loMoreGesturesBound) return;   loMoreGesturesBound = false;   if (typeof window === "undefined") return;   window.removeEventListener("pointerdown", moreGestureDown, true);
  window.removeEventListener("mousedown", moreGestureMouseDown, true);   window.removeEventListener("pointermove", moreGestureMove, true);   window.removeEventListener("pointerup", moreGestureUp, true);   window.removeEventListener("pointercancel", moreGestureUp, true);   window.removeEventListener("contextmenu", moreGestureContext, true);   window.removeEventListener("click", moreGestureClick, true); }

/**
 * 行的稳定身份。
 *
 * @param scope 槽位 key。
 * @param id 行 id。
 * @returns `scope:id`。
 */
function moreRowKey(scope: string, id: string): string {
  return scope + ":" + id;
}

/**
 * 这一处菜单当前的完整身份序列（按状态里的顺序）。
 *
 * @param store 状态句柄。
 * @param region `sidebar` 或 `conversation`。
 * @returns 从上到下的 `scope:id`。
 */
function moreKeysNow(store: StoreHandle, region: string): string[] {
  return moreKeysIn(store.get(), region);
}

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
 * @param props 宿主上下文、状态句柄、行身份与分组。
 * @returns 菜单行。
 */
function MoreMenuRow(props: {
  ctx: CtxLike;
  store: StoreHandle;
  region: string;
  scope: string;
  id: string;
  group: string;
  onDismiss?: () => void;
}): any {
  const ctx = props.ctx;
  const scope = props.scope;
  const id = props.id;
  const key = moreRowKey(scope, id);
  // 与悬浮框同一套取名字规则：同一个按钮在两处不能叫两个名字（用户 m09308#2）。
  const label = rowLabelText(ctx, scope, id);
  // 图标只认原按钮自己画的；没有就用名字首字。
  const icon = rowIconOf(scope, id);

  function open(): void {
    moreActivate(ctx, props.region, key, props.onDismiss ? props.onDismiss : null);
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
  // 冒烟测试会拿空 props 渲染一次；宿主属性没到齐时安静退出。
  if (!ctx || !store) return null;
  return h(MoreMenuRows, {
    ctx: ctx,
    store: store,
    region: (props.loRegion as string) || "sidebar",
    onDismiss: props.onDismiss
  });
}

function MoreMenuRows(props: { ctx: CtxLike; store: StoreHandle; region: string; onDismiss?: () => void }): any {
  const ctx = props.ctx;
  const store = props.store;
  const region = props.region;
  // 两处账本都会变：槽位（有哪些行）与状态（哪些行被收进来、菜单怎么排）。
  useSlotsTick(ctx);
  useStoreTick(store);
  const state = store.get();
  // 接管宿主那两项是一次 DOM 读 + 一次关显示，读到了要重画一次才轮得到画自己的行。
  const rows = moreRowsIn(state, region);
  const divider = moreDividerOn(state);
  // 手势是窗口级的，得知道这一下属于哪一份菜单：每次渲染把当前上下文发布出去。
  loMoreMenuCtx = ctx;
  loMoreMenuStore = store;
  loMoreMenuRegion = region;
  loMoreMenuDismiss = props.onDismiss ? props.onDismiss : null;

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
      };
    },
    [ctx, region]
  );

  const out: any[] = [];
  let dividerKey = "";
  let i;
  for (i = 0; i < rows.length; i++) {
    const row = rows[i];
    const key = moreRowKey(row.scope, row.id);
    const group = kindOf(state, row.scope, row.id) === "official" ? "official" : "third";
    // 画线时在官方块与第三方块之间补一条；只有第三方块真的存在时才补，否则线会吊在末尾。
    if (divider && !dividerKey && group === "third") {
      dividerKey = "lo-more-divider";
      out.push(h("div", { key: dividerKey, className: "lo-more-divider", "data-lo-more-divider": "" }));
    }
    out.push(
      h(MoreMenuRow, {
        key: key,
        ctx: ctx,
        store: store,
        region: region,
        scope: row.scope,
        id: row.id,
        group: group,
        onDismiss: props.onDismiss
      })
    );
  }
  return h(React.Fragment, null, out);
}
