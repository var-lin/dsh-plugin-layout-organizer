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
  const stripped = id.replace(/-\d+$/, "");
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
  if (document.querySelector("[data-sidebar-right-open]")) return false;
  const expand = document.querySelector("button[data-sidebar-right-expand]") as HTMLElement | null;
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
  // 「开始」页的容器还在就不用动它，交给 `openRightCard` 直接点卡片。
  if (document.querySelector(RIGHT_LIST_SELECTOR)) return false;
  const add = document.querySelector(RIGHT_ADD_TAB_SELECTOR) as HTMLElement | null;
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

/**
 * 设置入口的候选文案：locale 词条打头，中英文兜底，剔除空词条。
 *
 * @returns 按优先级排列的候选文案，用于在菜单项文本里做子串匹配。
 */
function settingsWord(): string[] {
  const label = t("nav");
  const words = [label, "设置", "Settings", "settings"];
  for (let i = 0; i < words.length; i++) if (!words[i]) words.splice(i--, 1);
  return words;
}

function menuItems(): HTMLElement[] {
  const nodes = document.querySelectorAll(
    '[role="menu"] [role="menuitem"], [role="listbox"] [role="option"], [role="menu"] button, [class*="menu"] [class*="item"]'
  );
  const out: HTMLElement[] = [];
  for (let i = 0; i < nodes.length; i++) out.push(nodes[i] as HTMLElement);
  return out;
}

/**
 * 两步路径：先点弹层触发器露出菜单，再点菜单里的设置项（portal 在 <body> 末尾）；返回 false 表示无触发器可等。
 *
 * @returns 面板本来就在、或已点到菜单里的设置项时为 true；有触发器但菜单里没找到设置项时同样返回 true；一个触发器都找不到时为 false。
 */
function openSettingsPanel(): boolean {
  if (settingsPanel()) return true;
  let trigger = document.querySelector('[data-slot="sidebar.settings"] button') as HTMLElement | null;
  if (!trigger) {
    trigger = document.querySelector('button[aria-haspopup="dialog"][aria-expanded]') as HTMLElement | null;
  }
  if (!trigger) trigger = document.querySelector('button[aria-haspopup="menu"]') as HTMLElement | null;
  if (!trigger) trigger = document.querySelector("[data-shortcut-modal='settings']") as HTMLElement | null;
  if (!trigger) return false;
  trigger.click();
  const items = menuItems();
  const words = settingsWord();
  for (let i = 0; i < items.length; i++) {
    const text = rowText(items[i]);
    for (let j = 0; j < words.length; j++) {
      if (text.indexOf(words[j]) >= 0) {
        items[i].click();
        return true;
      }
    }
  }
  return true;
}

function closeSettings(): void {
  const panel = settingsPanel();
  if (!panel) return;
  let close = panel.querySelector("button[class*='close']") as HTMLElement | null;
  if (!close) {
    // 只认「关闭」语义的按钮：`button[aria-label]` 抓到的第一颗可能是别的动作。
    const labelled = panel.querySelectorAll("button[aria-label]");
    for (let i = 0; i < labelled.length; i++) {
      const text = labelled[i].getAttribute("aria-label") || "";
      if (text.indexOf("lose") >= 0 || text.indexOf("关闭") >= 0 || text.indexOf("關閉") >= 0) {
        close = labelled[i] as HTMLElement;
        break;
      }
    }
  }
  if (close) {
    close.click();
    return;
  }
  const mask = panel.querySelector("[class*='mask']") as HTMLElement | null;
  if (mask) mask.click();
}

/**
 * 弹窗和导航行按需创建，轮询等待（id 精确匹配，标签兜底）；被收纳的设置行是 display:none，必须在点击期间显现。
 *
 * @param id 设置项的投影 id，与行上的 `data-lo-id` 精确比对。
 * @param label 该设置项的文案，行上没有 id 标记时按文案兜底匹配。
 */
function openSettingsSection(id: string, label: string): void {
  if (!openSettingsPanel()) {
    warn("open:" + id + " " + t("nav.failed").replace("{label}", label));
    return;
  }
  const epoch = loNavEpoch;
  let tries = 0;
  const attempt = function (): void {
    // 插件已经卸载：别再点宿主的东西。
    if (epoch !== loNavEpoch) return;
    if (settingsPanel()) {
      const rows = collectSettingsRows();
      if (rows) {
        for (let i = 0; i < rows.length; i++) {
          const rowId = rows[i].getAttribute(MARKS.id);
          if ((rowId && rowId === id) || (!rowId && rowText(rows[i]) === label)) {
            clickRevealed(rows[i]);
            return;
          }
        }
      }
    }
    tries++;
    if (tries < 40) window.setTimeout(attempt, 50);
    else warn("navigate:" + id + " " + t("nav.failed").replace("{label}", label));
  };
  window.setTimeout(attempt, 0);
}

/**
 * 只认标签、role 和 onclick 属性；React 合成的 onClick 在 DOM 上没有痕迹，判不出来。
 *
 * @param el 待判定的元素。
 * @returns 标签是表单/链接类控件、role 属可点角色、或带 onclick 属性时为 true。
 */
function isInteractive(el: HTMLElement): boolean {
  const tag = el.tagName;
  if (tag === "BUTTON" || tag === "A" || tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return true;
  const role = el.getAttribute("role");
  if (role === "button" || role === "tab" || role === "menuitem" || role === "link") return true;
  return el.hasAttribute("onclick");
}

/**
 * 行是按钮就点行；容器往里找第一个可点的后代（点容器等于对空气点），没有时退回点行本身。
 *
 * @param el 待点击的行。
 * @returns 实际该点下去的元素：`el` 自身可点就是它，否则是第一个可点后代，都没有时仍是 `el`。
 */
function clickTargetOf(el: HTMLElement): HTMLElement {
  if (isInteractive(el)) return el;
  const nodes = el.querySelectorAll("button, a, [role='button'], [role='tab'], [role='menuitem'], [onclick]");
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i] as HTMLElement & { disabled?: boolean };
    if (node.disabled) continue;
    return node;
  }
  return el;
}

/**
 * 显现必须作用在整行上：被点的常是行的后代，display:none 压在行上；属性在下一帧恢复。
 *
 * @param el 待点击的行；被收纳过时它的 `data-lo-hidden` 会被临时摘掉，点完下一帧补回。
 */
function clickRevealed(el: HTMLElement): void {
  const wasHidden = el.hasAttribute(MARKS.hidden);
  if (wasHidden) el.removeAttribute(MARKS.hidden);
  clickTargetOf(el).click();
  if (wasHidden) {
    window.requestAnimationFrame(function () {
      el.setAttribute(MARKS.hidden, "1");
    });
  }
}

/**
 * 按投影标记找这一行此刻在屏幕上的元素。
 *
 * @param scope 位置键。
 * @param id 行的投影 id。
 * @returns 打有 `data-lo-scope` / `data-lo-id` 且 id 相符的元素；该行当前不在屏幕上时为 null。
 */
function liveRowEl(scope: string, id: string): HTMLElement | null {
  // 投影刚落地时直接取它记下的元素；缓存失效（宿主换了节点）才现查一遍。
  const cached = liveElement(scope, id);
  if (cached) return cached;
  const stamped = document.querySelectorAll("[" + MARKS.scope + '="' + scope + '"][' + MARKS.id + "]");
  for (let i = 0; i < stamped.length; i++) {
    if (stamped[i].getAttribute(MARKS.id) === id) return stamped[i] as HTMLElement;
  }
  return null;
}

/**
 * 右栏此刻能不能被弄出来（哪怕卡片还没画出来）。
 *
 * 三条路都算：宿主给了 `sidebarRight` 服务（`openTab` 会顺带把收起的右栏展开）；认得出宿主
 * 右栏的状态机件（收起时的展开控件、开着时的 `data-sidebar-right-open`，对应 `revealRightBar`）；
 * 或布局服务给了 `openRightbar`（老宿主上先把右栏展开、再等卡片重新画出来点它，见 `openRightPage`）。
 *
 * @returns 有任意一条路时为 true。
 */
function rightBarReachable(): boolean {
  if (rightService()) return true;
  // 宿主右栏的两种状态机件：收着时是展开控件，开着时有 `data-sidebar-right-open`。
  // 只要认得出右栏存在，就能先展开或点回「开始」页再点卡片，不必依赖服务是否取得出来。
  if (document.querySelector("[data-sidebar-right-open], button[data-sidebar-right-expand]")) return true;
  if (!loActiveCtx) return false;
  try {
    const layout = loActiveCtx.get("layout") as LayoutService | null;
    return !!layout && typeof layout.openRightbar === "function";
  } catch (err) {
    return false;
  }
}

/**
 * 这一行在界面上本来有没有可点的东西。
 *
 * 与 `clickTargetOf` 同一把尺子：行本身是可点控件，或行里能找到可点的后代，都算「本来就能点」。
 * 纯展示的行（例如插件塞进停靠行的只读统计条）两样都不占，点它原本就毫无反应。
 *
 * @param el 待判定的行元素。
 * @returns 界面上本来就能点为 true。
 */
function rowClickable(el: HTMLElement): boolean {
  return isInteractive(el) || clickTargetOf(el) !== el;
}

/**
 * 这一行在收纳包里点下去该不该有反应。
 *
 * 判据取自界面本身而不是位置名：界面上点不动的行，在收纳包里也不该可点——
 * 可点却毫无反应，还顺手关掉收纳包与设置弹窗，比灰着更让人以为按钮坏了。
 *
 * 设置行是唯一的例外：设置弹窗按需打开，这一行此刻不在屏幕上也可能被导航到
 * （先开弹窗再定位），因此只要它没被判成 missing 就仍然可点。
 *
 * @param scope 位置键。
 * @param id 行的投影 id。
 * @returns 点下去该有反应时为 true。
 */
function rowNavigable(scope: string, id: string): boolean {
  if (scope === "settings") return true;
  // 右栏卡片：卡片在屏幕上就直接点它自己（宿主的按钮，最稳）；不在屏幕上时还有两条路能把
  // 右栏弄出来（见 rightBarReachable）——宿主 openTab 会把收起的右栏展开并摆出那张页面，
  // 布局服务的 openRightbar 则先展开、等卡片重新画出来再点它。只要有一条在，这一行就算点得动。
  // 「更多工具」不是页面、只是那扇菜单的入口，只能点元素本身，因此仍要等它回到屏幕上
  // （见 isMoreEntry）。
  if (scope === "right" && !isMoreEntry(scope, id) && (rightCardEl(scope, id) || rightBarReachable())) return true;
  // 这一处整体没投影过（页面未挂载），没有元素可点；标签还能靠宿主的视图选择入口直选。
  if (!liveRowIds(scope)) return viewSelectable(scope, id);
  const el = liveRowEl(scope, id);
  // 标签被宿主的宽度预算挤出标签条时，DOM 里没有那一颗按钮，但入口还在、台账里也有这一条。
  if (!el) return viewSelectable(scope, id);
  return rowClickable(el);
}

/**
 * 这一行能不能靠宿主的视图选择入口直达。
 *
 * 宿主按宽度只画前几颗标签（`visibleViewLimit`），排在后面的标签连 DOM 都没有；这时
 * `loViewOpener`（对话页「更多」渲染时登记的 `selectView`）是唯一能把那一页打开的路。
 * 只有台账里真有的 id 才算：合成行（「更多」那颗三个点）不在台账里，选不出任何视图。
 *
 * @param scope 位置键。
 * @param id 行的投影 id。
 * @returns 能直选时为 true。
 */
function viewSelectable(scope: string, id: string): boolean {
  if (scope !== "tabs" || !loViewOpener || !loActiveCtx) return false;
  const entries = readEntries(loActiveCtx, scope);
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].id === id) return true;
  }
  return false;
}

/**
 * 从设置弹窗里跳到某个按钮对应的页面。
 *
 * 与收纳包里的「打开对应页面」同一条路径：先抵达目标，再关掉设置弹窗。
 * 设置行只存在于弹窗内部，因此不关弹窗，交给 `navigateTo` 的两步路由。
 *
 * @param ctx 上下文。
 * @param scope 位置键。
 * @param id 行的投影 id。
 */
function navigateFromSettings(ctx: CtxLike, scope: string, id: string): void {
  navigateTo(ctx, scope, id);
  // 设置行本来就只活在这扇弹窗里，不能关；其余位置在下一帧（点击派发后）关掉弹窗，
  // 先抵达再关闭的顺序与收纳包一致。
  if (scope === "settings") return;
  window.requestAnimationFrame(function () {
    closeSettings();
  });
}

function navigateTo(ctx: CtxLike, scope: string, id: string): void {
  if (scope === "settings") {
    const entries = readEntries(ctx, scope);
    let label = id;
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].id === id) {
        label = entries[i].label;
        break;
      }
    }
    openSettingsSection(id, label);
    return;
  }

  // 侧边栏优先走官方 selectPanel API；合成行（「更多」）不是面板 id，走它会把主区切到不存在的面板。
  if (scope === "sidebar" && !isSynthetic(scope, id)) {
    try {
      const layout = ctx.get("layout") as LayoutService | null;
      if (layout && typeof layout.selectPanel === "function") {
        layout.selectPanel(id);
        return;
      }
    } catch (err) {
      // 落到下面的点击路径
    }
  }

  // 右栏卡片：卡片本体就是宿主自己的按钮，点它等于宿主自己动手，不经过任何服务查询，最稳。
  // 卡片不在屏幕上（右栏收起、或右栏正显示别的页面）才退回宿主的 openTab；两条都不成，
  // 再把右栏展开、等卡片重新画出来之后点它。「更多工具」不是页面、只是那扇菜单的入口，不进这条。
  if (scope === "right" && !isMoreEntry(scope, id)) {
    openRightPage(ctx, scope, id);
    return;
  }

  // 直接读行上投影打过的 data-lo-scope / data-lo-id 标记来配对。
  const stampedEl = liveRowEl(scope, id);
  if (stampedEl) {
    clickRevealed(stampedEl);
    return;
  }

  const rows = collectRows(scope);
  if (!rows) return;
  const entries = readEntries(ctx, scope);
  const ids: string[] = [];
  for (let i = 0; i < entries.length; i++) ids.push(entries[i].id);
  const state = loActiveStore ? loActiveStore.get() : null;
  const ordered = state ? reconcileOrder(state, scope, ids) : ids;
  const byId: Record<string, LedgerEntry> = {};
  for (let i = 0; i < entries.length; i++) byId[entries[i].id] = entries[i];
  // 台账没有的 id 用 id 当文案、标记为「无文案」，让配对知道该按位置兜底（见 `pairRows`）。
  const list: LedgerEntry[] = [];
  for (let i = 0; i < ordered.length; i++) {
    const entry = byId[ordered[i]];
    list.push(entry ? entry : { id: ordered[i], label: ordered[i], hasLabel: false });
  }
  // 与投影走同一套配对规则：带上 scope，声明过 `ROW_HOOKS` 的记录才不会被按位置猜错行
  // （「注册在此、渲染别处」的插件——Trae / WorkBuddy 的额度读数——正是这样混进来的）。
  const pairs = pairRows(list, rows, undefined, scope);
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i].id === id && pairs[i].el) {
      clickRevealed(pairs[i].el);
      return;
    }
  }

  // 标签被挤出标签条时（宿主按宽度只画前几颗，见 `visibleViewLimit`），DOM 里没有这一颗，
  // 台账与位置配对都找不到元素；改走宿主自己的视图选择入口，否则点了菜单行什么也不会发生
  // （用户 m00655）。
  if (scope === "tabs" && loViewOpener) {
    try {
      loViewOpener(id);
    } catch (err) {
      // 入口失效就维持原来的静默：没有别的路可走。
    }
  }
}