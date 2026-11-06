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
    // 退路是「每帧写一次 store」：一次拖动会跑几十帧，若不关掉历史，一次拖动就能塞满整摞撤销。
    // 真正落库在松手那一步（`moreGestureUp`），那里的写入才该占一格。
    store.update(function (state: PluginState): void {
      setMoreOrder(state, region, next);
    }, { history: false });
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
  // 这是把预览撤回去，不是用户改动：关掉历史，别在撤销栈里留一条「按了没反应」的记录。
  store.update(function (state: PluginState): void {
    setMoreOrder(state, region, next);
  }, { history: false });
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
