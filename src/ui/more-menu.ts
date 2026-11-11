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
// 手势监听整组挂/摘的句柄（见 dom-menu.ts 的 bindWindowCapture）。
let loMoreGestureOff: (() => void) | null = null;

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
