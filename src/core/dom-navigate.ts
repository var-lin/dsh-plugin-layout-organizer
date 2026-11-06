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
