// 由 `apply` 设置一次，供按投影顺序配对行时读取
let loActiveStore: StoreHandle | null = null;
// 同理留给右侧边栏那条导航路径：`rowNavigable` 只拿得到 scope 与 id，服务要从上下文里取。
let loActiveCtx: CtxLike | null = null;
// 右栏导航最近一次失败的原因：只为写进 `warn`，不参与判定。
let lastRightError = "";

// 导航重试的代次：插件卸载时（`setActiveStore(null)` / `setActiveContext(null)`）自增，
// 已经排上队却没跑完的重试看到代次变了就停手——否则卸载之后它还会继续去点宿主 DOM。
let loNavEpoch = 0;

// 对话页标签的宿主动作入口：宿主把「选中某个视图标签」的回调（标签条自己用的 `selectView`）
// 作为槽位属性交给「更多」菜单的内容，「更多」渲染时登记到这里。标签被宿主的宽度预算挤出
// 标签条时（见宿主的 `visibleViewLimit`），DOM 里根本没有那一颗按钮，只能走这条入口（用户 m00655）。
let loViewOpener: ((id: string) => void) | null = null;

// 右栏导航的重试节奏：卡片点不到、服务又暂时不认时，等展开、等宿主采纳 store。
const RIGHT_NAV_TRIES = 20;
const RIGHT_NAV_GAP_MS = 80;

// 右栏标签条上的「新标签页」：右栏没在「开始」页时它才出现，点它等于宿主自己重开「开始」页。
const RIGHT_ADD_TAB_SELECTOR = "[data-dockkit-add-tab]";

function setActiveStore(store: StoreHandle | null): void {
  if (!store) loNavEpoch++;
  loActiveStore = store;
}

function setActiveContext(ctx: CtxLike | null): void {
  if (!ctx) loNavEpoch++;
  loActiveCtx = ctx;
}

/**
 * 登记宿主的「选中某个视图标签」入口。
 *
 * 只有槽位内容拿得到这个回调（宿主把它写进对话页「更多」菜单的属性里），所以由
 * `more-menu.ts` 在渲染那扇菜单时登记；换会话时以最后一次登记为准。
 *
 * @param opener 视图选择回调；没有时传 null。
 */
function setViewOpener(opener: ((id: string) => void) | null): void {
  loViewOpener = opener;
}

/**
 * 取宿主的右侧栏导航服务。
 *
 * 老宿主没有这个服务，`get` 可能返回 undefined 也可能直接抛，两种都当「没有」。
 *
 * 新版 cordis 的 `ctx.get(name)` 默认严格：只有提供者的 fiber 处于 ACTIVE 才返回服务，否则给
 * undefined（旧版没有这层检查）。宿主插件刚起来、或正在重载的那一小段时间里正好落在这条缝里，
 * 于是同一个服务在界面上一会儿有一会儿没有。第二趟用 `strict = false` 绕过状态检查：
 * 拿到的控制器就算暂时不可用，`openTab` 也会自己抛错并被下面接住，不会比拿不到更糟。
 *
 * @returns 服务对象；宿主没提供时为 null。
 */
function rightService(): SidebarRightService | null {
  if (!loActiveCtx) return null;
  const passes = [true, false];
  for (let i = 0; i < passes.length; i++) {
    try {
      const service = loActiveCtx.get("sidebarRight", passes[i]) as SidebarRightService | null | undefined;
      if (service && typeof service.openTab === "function") return service;
    } catch (err) {
      // 这个版本没有这个服务，继续试下一趟
    }
  }
  return null;
}

/**
 * 右栏卡片的行 id 还原成宿主要的 tab kind。
 *
 * 同一页上同 kind 的第二张卡投影时加了 `-2` 后缀（见 `collectRightUnits`），而 `openTab`
 * 只认原始 kind；卡片此刻在屏幕上时直接读 DOM 属性，读不到再按后缀还原。
 *
 * @param scope 位置键。
 * @param id 行的投影 id。
 * @returns tab kind；认不出来时为 null。
 */
function rightKindOf(scope: string, id: string): string | null {
  const el = liveRowEl(scope, id);
  if (el) {
    const kind = rightCardKind(el);
    if (kind) return kind;
  }
  const stripped = rightBaseKind(id);
  return stripped || null;
}

/**
 * 右栏卡片此刻在屏幕上的行元素。
 *
 * 卡片本体就是宿主自己的按钮（`data-sidebar-right-guide-entry` 的 `onClick` 直连 `openTab`），
 * 点它等于宿主自己动手，完全不经过任何服务查询——这是最稳的一条路。
 *
 * @param scope 位置键。
 * @param id 行的投影 id。
 * @returns 卡片行；卡片不在屏幕上、或这一行是「更多工具」（不是页面）时为 null。
 */
function rightCardEl(scope: string, id: string): HTMLElement | null {
  const el = liveRowEl(scope, id);
  if (!el) return null;
  if (!rightCardKind(el)) return null;
  return el;
}

/**
 * 点卡片本体。卡片不在屏幕上时返回 false，由调用方换别的路。
 *
 * 行元素是卡片外面的包裹盒，`clickRevealed` 会往里找到宿主那颗按钮点下去。
 *
 * @param scope 位置键。
 * @param id 行的投影 id。
 * @returns 已经点下去时为 true。
 */
function openRightCard(scope: string, id: string): boolean {
  const el = rightCardEl(scope, id);
  if (!el) return false;
  clickRevealed(el);
  return true;
}

/**
 * 走宿主的 `openTab`。卡片没渲染时（右栏收起、或右栏正显示别的页）只有它能打开。
 *
 * @param scope 位置键。
 * @param id 行的投影 id。
 * @returns 已经调下去且宿主没抛时为 true。
 */
function openRightCardByService(scope: string, id: string): boolean {
  const service = rightService();
  if (!service) {
    lastRightError = "no sidebarRight service";
    return false;
  }
  const kind = rightKindOf(scope, id);
  if (!kind) {
    lastRightError = "no tab kind";
    return false;
  }
  try {
    service.openTab(kind, { replaceTab: true });
    lastRightError = "";
    return true;
  } catch (err) {
    lastRightError = err instanceof Error ? err.message : String(err);
    return false;
  }
}

/**
 * 宿主机件里当前真正显示着的那一个。
 *
 * 0.2.2 多会话会把没显示的右侧栏视图留在 DOM 里（`hidden` / `aria-hidden`），
 * `querySelector` 可能先拿到隐藏的那份，于是把「右栏收着」误判成「右栏开着」。
 *
 * @param selector 候选选择器。
 * @returns 第一个不在隐藏祖先里的元素；都没有时返回 null。
 */
function visibleHostEl(selector: string): HTMLElement | null {
  const nodes = document.querySelectorAll(selector);
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i] as HTMLElement;
    if (!node.closest("[hidden], [aria-hidden='true']")) return node;
  }
  return null;
}

/**
 * 把收起的右栏展开，让面板重新渲染、宿主把这一会话的 store 采纳上。
 *
 * 走宿主自己的展开控件（对话页头部角落那颗，`data-sidebar-right-expand`）：它点下去改的是
 * 右侧栏自己的 `expanded` 状态，面板随之渲染、store 被采纳，之后的 `openTab` 才不再抛
 * 「no session surface is mounted」。只调 `layout.openRightbar` 改的是布局状态、不动那套
 * store，面板不会出来——用户在右栏收起时点收纳包里的右栏卡片毫无反应，就是这条（用户 m00368）。
 *
 * @param ctx 上下文。
 * @returns 认得出「收着」并把展开动作调下去时为 true；面板本来就开着、或没有展开控件时为 false。
 */
function revealRightBar(ctx: CtxLike): boolean {
  // `data-sidebar-right-open` 只在展开时出现：开着就不用再动它，交给 `openTab` 换页。
  if (visibleHostEl("[data-sidebar-right-open]")) return false;
  const expand = visibleHostEl("button[data-sidebar-right-expand]");
  if (expand) {
    expand.click();
    return true;
  }
  // 老宿主没有这颗控件时才退到布局服务。
  try {
    const layout = ctx.get("layout") as LayoutService | null;
    if (layout && typeof layout.openRightbar === "function") {
      layout.openRightbar(false, false);
      return true;
    }
  } catch (err) {
    // 老宿主没有这个入口，只能等卡片自己出现
  }
  return false;
}

/**
 * 让右栏回到「开始」页。
 *
 * 右栏正显示别的页面时，「开始」页的容器不在 DOM 里，卡片无从点起；宿主服务又不一定调得通。
 * 只剩宿主自己的渲染路径：标签条上那颗「新标签页」（`data-dockkit-add-tab`，只在当前面板没有
 * 「开始」页时出现）点下去等于宿主调用自己的 `openTab("guide")`，「开始」页连同卡片随即画出来。
 * 用户 m00518：右栏不是「开始」页时，点收纳包里的右栏按钮毫无反应。
 *
 * @returns 认出「开始」页已不在、并把入口点下去时为 true；已经在「开始」页或找不到入口时为 false。
 */
function revealRightGuide(): boolean {
  // 「开始」页的可见容器还在就不用动它，交给 `openRightCard` 直接点卡片。
  // 0.2.2 多会话视图里还留着隐藏的 guide，不能拿它当「已在开始页」（见 `rightGuideEl`）。
  if (rightGuideEl()) return false;
  const add = visibleHostEl(RIGHT_ADD_TAB_SELECTOR);
  if (!add) return false;
  clickRevealed(add);
  return true;
}

/**
 * 把右栏摆到某张卡片那一页，三条路按可靠程度依次试，并且愿意多试几次。
 *
 * 顺序与理由：卡片本体在屏幕上就点它（宿主自己的按钮）；不在就调宿主 `openTab`。
 * `openTab` 在右栏收着时会抛「no session surface is mounted」——宿主只有等面板画出来、
 * seat 把这一会话的 store「采纳」上之后才肯受理，而这中间至少隔一次渲染；所以两条都不成时
 * 先展开右栏，再隔一拍重试：卡片可能重新画出来，采纳完成后 `openTab` 也会开始生效。
 *
 * @param ctx 上下文。
 * @param scope 位置键。
 * @param id 行的投影 id。
 */
function openRightPage(ctx: CtxLike, scope: string, id: string): void {
  const epoch = loNavEpoch;
  const attempt = function (tries: number): void {
    // 插件已经卸载：别再点宿主的东西。
    if (epoch !== loNavEpoch) return;
    if (openRightCard(scope, id)) return;
    if (openRightCardByService(scope, id)) return;
    if (tries === 0) revealRightBar(ctx);
    // 右栏开着却停在别的页面：卡片压根没渲染，服务又没接住，就把「开始」页点回来再点卡片。
    else if (tries % 4 === 1) revealRightGuide();
    if (tries >= RIGHT_NAV_TRIES) {
      const reason = lastRightError ? " (" + lastRightError + ")" : "";
      warn("navigate:" + id + " " + t("nav.failed").replace("{label}", id) + reason);
      return;
    }
    window.setTimeout(function () {
      attempt(tries + 1);
    }, RIGHT_NAV_GAP_MS);
  };
  attempt(0);
}
