// 「更多」菜单里的行。被「收进更多」的行在主列表让位（`applyScope` 打上隐藏标记），
// 改由这里列出来——仍然点得开，也仍然移得回去，所以「收进去」不等于「消失」。
//
// 这一层注册进宿主的「更多」槽位（侧边栏的 `sidebar.panellist.actions` 与对话顶部的
// `conversation.session.header.views.actions`）：菜单是宿主 portal 出去的 React 树，
// 直接往里插 DOM 会在下一次重渲染时被冲掉，只有走槽位才是稳的。
//
// 三处菜单共用这一份实现，靠 `region` 分辨读哪一份清单（见 `moreScopesIn`）。
//
// 注意：菜单行**不能**打投影用的 `data-lo-row` / `data-lo-scope` / `data-lo-id` 标记。
// 那几个属性是「这一轮投影真正标记到的行」的身份，`liveOrder` 与投影清场都按它们扫全文档；
// 菜单行在 portal 出来的菜单里，一旦冒充被标记行，就会被当成幽灵行清掉，也会搅乱 `liveOrder`。
// 因此菜单行用自己的 `data-lo-more-*` 属性。
//
// 手势不走 React 的合成事件，而是在窗口的**捕获阶段**拦下来（见 installMoreGestures）。
//
// 宿主自己画的那两项（浏览更多插件 / 创建你的插件）不是槽位条目、没有 id，因此没有
// `data-lo-more-key`，`moreRowOf` 结构性认不到它们：既不能拖，也没有本插件的右键菜单。
// 本插件**不接管**它们（用户 m09717 明确划出的例外），原件照旧由宿主渲染与响应。
//
// 顺序存在 `state.moreOrder[region]`，与各 scope 的 `order` 分开：一扇菜单能列出好几处的行。
interface MoreMenuProps {
  loCtx?: CtxLike;
  loStore?: StoreHandle;
  loRegion?: string;
  onDismiss?: () => void;
  // 宿主给槽位内容的额外属性：对话页那扇菜单里是标签条自己的 `selectView`，其余槽位没有。
  onOpen?: unknown;
  // 对话页那扇菜单还会带来自动收起的那批标签（宿主因宽度不够挤到「更多」里的）：`{ id, label, … }`。
  entries?: unknown;
}

// 画菜单那一层：ctx / store 已由 `MoreMenuContent` 校验过，region 也已补成具体的一处。
interface MoreMenuRowsProps {
  ctx: CtxLike;
  store: StoreHandle;
  region: string;
  // 宿主已经替哪些标签画了行（对话页那扇菜单才有）。
  hostViews?: string[];
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
let loMoreMenuDismiss: (() => void) | null = null;
let loMoreGesturesBound = false;
let loMoreGestureRefs = 0;

// 正在按下的那一行、以及有没有真的拖起来。指针可能抬在行外，所以记在模块级。
const loMoreDrag: {
  node: HTMLElement | null;
  key: string;
  region: string;
  startX: number;
  startY: number;
  rect: DOMRect | null;
  outside: boolean;
  active: boolean;
} = {
  node: null,
  key: "",
  region: "",
  startX: 0,
  startY: 0,
  rect: null,
  outside: false,
  active: false
};

// 悬浮框落点的高亮（与另外三个拖拽控制器共用一份记账，见 drag-frame.ts）。
const loMoreStashSlot = createDropSlot(DROP_MARK);

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
 * 拆开行身份（`scope:id`）。
 *
 * 三处（激活、右键菜单、拖动落点）都要同一份拆法：冒号前是 scope、之后是 id，缺一不可。
 *
 * @param key 行身份。
 * @returns 拆好的 scope 与 id；格式不对时为 null。
 */
function splitRowKey(key: string): { scope: string; id: string } | null {
  const cut = key ? key.indexOf(":") : -1;
  if (cut <= 0) return null;
  const scope = key.slice(0, cut);
  const id = key.slice(cut + 1);
  if (!id) return null;
  return { scope: scope, id: id };
}

/**
 * 把一次「点开这一行」做完。
 *
 * 普通行先跳转再关菜单（反过来先关，宿主卸载时可能清掉要点的东西）。
 *
 * @param ctx 宿主上下文。
 * @param key 行身份（`scope:id`）。
 * @param onDismiss 关掉这扇菜单。
 */
function moreActivate(ctx: CtxLike | null, key: string, onDismiss: (() => void) | null): void {
  if (!ctx) return;
  const split = splitRowKey(key);
  if (!split) return;
  navigateTo(ctx, split.scope, split.id);
  if (onDismiss) onDismiss();
}

/**
 * 这一行的右键菜单：排位两项，再改判官方 / 第三方，普通行还有「出更多」与「收起」。
 *
 * 改判一项与设置页卡片里的那颗按钮同一语义：菜单里的行排的是收进来的顺序，
 * 官方 / 第三方决定它在菜单里排在哪一段（用户 m04058）。
 *
 * @param event 右键事件。
 * @param store 状态句柄。
 * @param region `sidebar` 或 `conversation`。
 * @param key 行身份。
 */
function moreRowMenuAt(event: any, store: StoreHandle, region: string, key: string): void {
  const split = splitRowKey(key);
  if (!split) return;
  const scope = split.scope;
  const id = split.id;
  const state = store.get();
  const actions = moreMoveActions(store, region, key);
  // 后三项与位置卡片上的右键菜单共用同一份（见 menuTailActions）：能列在这扇菜单里的行
  // 本来就已经收在「更多」里，所以「进 / 出更多」这一项照实际状态取文案与启用与否。
  actions.push.apply(actions, menuTailActions(store, scope, id, false, canTuckIntoMore(scope, id), isIntoMore(state, scope, id), isHidden(state, scope, id)));
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
  loMoreDrag.startX = event.clientX;
  loMoreDrag.startY = event.clientY;
  loMoreDrag.active = false;
  loMoreDrag.outside = false;
  loMorePointer.x = event.clientX;
  loMorePointer.y = event.clientY;
  loMoreStashSlot.clear();
  // 记下按下时的顺序：只有「容器不是 flex / grid」的退路需要它来还原（见 `moreRestoreOrder`）。
  loMoreStartOrder = loMoreMenuStore ? moreOrderOf(loMoreMenuStore.get(), loMoreDrag.region).slice() : null;
  // 菜单矩形的成员：拖出去多远才算「移出更多」。取最近的 role=menu 祖先（宿主弹层）。
  const menu = typeof row.closest === "function" ? row.closest('[role="menu"]') : null;
  loMoreDrag.rect = menu && typeof menu.getBoundingClientRect === "function" ? menu.getBoundingClientRect() : null;
}

// 指针坐标只留最新的一份：落点判定与重排都推到下一帧做（见 `loMoreThrottle`），
// 一次 pointermove 就扫一遍全文档、逐行量矩形再可能写 store，太贵。
const loMorePointer = { x: 0, y: 0 };

// 拖动预览：只动行上的 `order`，不写 store，松手才提交一次（用户 m04058 的顺序语义不变）。
// 宿主菜单容器若不是 flex / grid，`order` 不生效，这时退回逐帧写 store 的老做法。
let loMorePreviewKeys: string[] | null = null;
// 是否走了「逐帧写 store」的退路；取消手势要据此还原顺序。
let loMorePreviewStored = false;
// 按下那一刻的顺序快照，只在退路里用得上。
let loMoreStartOrder: string[] | null = null;

/**
 * 这扇菜单的容器能不能靠 `order` 换位。
 *
 * @param region `sidebar` / `conversation` / `rightbar`。
 * @returns 能靠 `order` 预览时为 true；量不出来（测试环境或容器没挂上）也按 true 处理。
 */
function moreOrderPreviewable(region: string): boolean {
  const nodes = moreRowNodes(region);
  if (nodes.length === 0) return true;
  const parent = nodes[0].parentElement;
  if (!parent || typeof getComputedStyle !== "function") return true;
  const display = getComputedStyle(parent).display;
  return display === "flex" || display === "inline-flex" || display === "grid";
}

/**
 * 把当前的预览顺序画到行上（或按退路写进 store）。
 *
 * @param region `sidebar` / `conversation` / `rightbar`。
 * @param keys 这一轮的目标顺序。
 */
function moreApplyPreview(region: string, keys: string[]): void {
  if (!moreOrderPreviewable(region)) {
    const store = loMoreMenuStore;
    loMorePreviewStored = true;
    if (!store) return;
    const next = keys.slice();
    store.update(function (state: PluginState): void {
      setMoreOrder(state, region, next);
    });
    return;
  }
  loMorePreviewKeys = keys.slice();
  const index: Record<string, number> = Object.create(null) as Record<string, number>;
  let i;
  for (i = 0; i < keys.length; i++) index[keys[i]] = i;
  const nodes = moreRowNodes(region);
  for (i = 0; i < nodes.length; i++) {
    const key = nodes[i].getAttribute("data-lo-more-key") || "";
    const at = index[key];
    // 只给本轮序列里的行写 order；宿主自己画的那两项动作行不在序列里，保持原位置。
    if (typeof at === "number") nodes[i].style.order = String(at);
  }
}

/**
 * 擦掉预览写下的 `order`。
 *
 * @param region `sidebar` / `conversation` / `rightbar`。
 */
function moreClearPreview(region: string): void {
  loMorePreviewKeys = null;
  loMorePreviewStored = false;
  if (region === "") return;
  const nodes = moreRowNodes(region);
  let i;
  for (i = 0; i < nodes.length; i++) nodes[i].style.order = "";
}

/**
 * 取消手势时把「逐帧写 store」的退路还原回按下前的顺序。
 */
function moreRestoreOrder(): void {
  const start = loMoreStartOrder;
  loMoreStartOrder = null;
  if (!loMorePreviewStored || !start) return;
  const store = loMoreMenuStore;
  const region = loMoreDrag.region;
  if (!store || region === "") return;
  const now = moreOrderOf(store.get(), region);
  if (now.length === start.length && now.every(function (key: string, i: number): boolean { return key === start[i]; })) return;
  const next = start.slice();
  store.update(function (state: PluginState): void {
    setMoreOrder(state, region, next);
  });
}

function moreGestureApply(): void {
  const node = loMoreDrag.node;
  // 只处理已经越过阈值的手势：按下没动就松手时坐标还是起点，不该拿来判落点。
  if (!node || !loMoreDrag.active) return;
  const x = loMorePointer.x;
  const y = loMorePointer.y;

  // 落点一：悬浮框。拖到启动器身上松手就是收起（用户 m04359），比「移出更多」更重。
  const stashHit = stashDropAt(x, y);
  loMoreStashSlot.sync(stashHit);

  // 落点二：拖出菜单矩形。宿主的「点外面就关」只听 pointerdown，指针移出去菜单不会自己关，
  // 所以这一段完全由我们判：出去就把这一行画成待移出，并且不再按 Y 重排。
  const rect = loMoreDrag.rect;
  const outside = outsideRect(rect, x, y, OUT_MARGIN);
  if (outside !== loMoreDrag.outside) {
    loMoreDrag.outside = outside;
    node.classList.toggle("lo-more-out", outside);
  }
  if (outside || stashHit) return;

  const store = loMoreMenuStore;
  if (!store) return;
  const region = loMoreDrag.region;
  if (region === "") return;
  // 在预览顺序（或状态清单）上挪一次：两个来源的顺序一致，用户看到哪一版就按哪一版算。
  const base = loMorePreviewKeys ? loMorePreviewKeys.slice() : moreKeysIn(store.get(), region);
  const from = base.indexOf(loMoreDrag.key);
  if (from < 0) return;
  const at = moreDropIndex(region, loMoreDrag.key, y);
  if (at < 0 || at === from) return;
  base.splice(from, 1);
  base.splice(at, 0, loMoreDrag.key);
  moreApplyPreview(region, base);
}

const loMoreThrottle = createFrameThrottle(moreGestureApply);

function moreGestureMove(event: any): void {
  const node = loMoreDrag.node;
  if (!node) return;
  if (!loMoreDrag.active) {
    // 两个轴都算：往左右拖出菜单同样是「移出更多」，只盯 Y 永远判不到。
    if (belowDragThreshold(event.clientX, event.clientY, loMoreDrag.startX, loMoreDrag.startY)) return;
    loMoreDrag.active = true;
    node.classList.add("lo-more-dragging");
    document.documentElement.style.cursor = "grabbing";
  }
  event.preventDefault();
  event.stopPropagation();
  loMorePointer.x = event.clientX;
  loMorePointer.y = event.clientY;
  loMoreThrottle.schedule(event.clientY);
}

/**
 * 清掉一次拖拽留下的全部痕迹。
 *
 * `pointerup` 与 `pointercancel` 共用：取消（触摸被系统接管、指针被抢走）不该提交任何落点，
 * 只把行上的拖动样式、落点高亮与光标收回去。菜单卸载时也走这里，否则下一次打开会带着
 * 上一次的 `lo-more-out` 与高亮落点。
 */
function resetMoreDrag(): void {
  // 积压的那一帧不能再跑：它会把已经收回去的样式或高亮重新画上去。
  loMoreThrottle.drop();
  // 预览写的 order 也要擦：菜单还开着，行得回到提交后的真实顺序（提交已完成或根本没提交）。
  moreClearPreview(loMoreDrag.region);
  const node = loMoreDrag.node;
  if (node) {
    node.classList.remove("lo-more-dragging");
    node.classList.remove("lo-more-out");
  }
  loMoreStashSlot.clear();
  document.documentElement.style.cursor = "";
  loMoreDrag.node = null;
  loMoreDrag.key = "";
  loMoreDrag.region = "";
  loMoreDrag.startX = 0;
  loMoreDrag.startY = 0;
  loMoreDrag.rect = null;
  loMoreDrag.outside = false;
  loMoreDrag.active = false;
  loMoreStartOrder = null;
}

/**
 * 指针被系统取消：只清理，不提交落点。
 *
 * 不能复用 `moreGestureUp`——那条路径会在移出菜单时把行真的移出「更多」，
 * 而取消手势的语义是「这一下不算」。
 *
 * @param event 取消事件，只用来拦住宿主可能顺手关菜单的冒泡。
 */
function moreGestureCancel(event: any): void {
  if (loMoreDrag.node && event && typeof event.stopPropagation === "function") event.stopPropagation();
  // 先还原顺序再清状态：`resetMoreDrag` 会把 region 清空，之后就不知道该还哪一扇菜单了。
  moreRestoreOrder();
  resetMoreDrag();
}

function moreGestureUp(event: any): void {
  const node = loMoreDrag.node;
  if (!node) return;
  // 松手前把最后一帧的落点补算出来：移出判定被节流压着，不补这一下，快速拖出后立刻松手会当作没移出。
  loMoreThrottle.flush();
  const key = loMoreDrag.key;
  const region = loMoreDrag.region;
  const active = loMoreDrag.active;
  const outside = loMoreDrag.outside;
  const stashEl = loMoreStashSlot.hit();
  // 预览顺序要在 `resetMoreDrag` 之前取出来：它会把行上的 order 擦掉（那只影响视觉，不影响这份数组）。
  const preview = loMorePreviewKeys;
  const stored = loMorePreviewStored;
  if (active) {
    // 拖完抬手不该顺手把这一行点开。
    loMoreSuppressClick = Date.now() + LO_CLICK_SUPPRESS_MS;
    event.stopPropagation();
  }
  resetMoreDrag();
  if (!active) return;

  const store = loMoreMenuStore;
  if (!store) return;
  const split = splitRowKey(key);
  if (!split) return;
  const scope = split.scope;
  const id = split.id;
  // 收起优先于移出：落在启动器上就是收起，不管指针是不是也在菜单外（用户 m04359）。
  if (stashEl) {
    store.update(function (state: PluginState): void {
      setHidden(state, scope, id, true);
    });
    return;
  }
  if (outside) {
    store.update(function (state: PluginState): void {
      setIntoMore(state, scope, id, false);
    });
    return;
  }
  // 只是重排：松手这一次把预览顺序落进 store（走「逐帧写 store」的退路时已经写过了，不重复写）。
  if (stored || !preview || region === "") return;
  const next = preview.slice();
  store.update(function (state: PluginState): void {
    setMoreOrder(state, region, next);
  });
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
 * 三处菜单（侧边栏 / 对话 / 右侧栏「更多工具」）共用一个全局监听，用引用计数管着，最后一个菜单卸载才摘。
 */
function installMoreGestures(): void {
  if (typeof window === "undefined") return;
  loMoreGestureRefs++;
  if (loMoreGesturesBound) return;
  loMoreGesturesBound = true;
  window.addEventListener("pointerdown", moreGestureDown, true);
  window.addEventListener("mousedown", moreGestureMouseDown, true);
  window.addEventListener("pointermove", moreGestureMove, true);
  window.addEventListener("pointerup", moreGestureUp, true);
  window.addEventListener("pointercancel", moreGestureCancel, true);
  window.addEventListener("contextmenu", moreGestureContext, true);
  window.addEventListener("click", moreGestureClick, true);
}

/**
 * 摘掉手势监听（引用计数归零才真的摘）。
 */
function uninstallMoreGestures(): void {
  loMoreGestureRefs = Math.max(0, loMoreGestureRefs - 1);
  if (loMoreGestureRefs > 0) return;
  if (!loMoreGesturesBound) return;
  loMoreGesturesBound = false;
  if (typeof window === "undefined") return;
  window.removeEventListener("pointerdown", moreGestureDown, true);
  window.removeEventListener("mousedown", moreGestureMouseDown, true);
  window.removeEventListener("pointermove", moreGestureMove, true);
  window.removeEventListener("pointerup", moreGestureUp, true);
  window.removeEventListener("pointercancel", moreGestureCancel, true);
  window.removeEventListener("contextmenu", moreGestureContext, true);
  window.removeEventListener("click", moreGestureClick, true);
}

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
  const key = moreRowKey(scope, id);
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
    const key = moreRowKey(row.scope, row.id);
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
