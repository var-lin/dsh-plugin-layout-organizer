// 手势进行中时置位；投影检查它，拖动中不重绘
let loDragActive = false;

function dragActive(): boolean {
  return loDragActive;
}

function setDragActive(next: boolean): void {
  loDragActive = next;
}

interface DragRowRect {
  el: HTMLElement;
  id: string;
  mid: number;
  top: number;
  left: number;
  width: number;
  height: number;
}

function rowsInScope(scope: string): HTMLElement[] {
  const nodes = document.querySelectorAll("[" + MARKS.scope + '="' + scope + '"][' + MARKS.row + "]");
  const out: HTMLElement[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i] as HTMLElement;
    if (node.hasAttribute(MARKS.hidden)) continue;
    out.push(node);
  }
  return out;
}

/**
 * 视觉顺序，也就是 `style.order`——容器一旦是被重排过的 flex 盒，树序就不再是屏上的顺序。
 *
 * @param scope 槽位 key。
 * @returns 该 scope 的受管行，按 `style.order` 升序排列；order 相同的保持原本的树序。
 */
function visualRows(scope: string): HTMLElement[] {
  const rows = rowsInScope(scope);
  const keyed = rows.map(function (el, at) {
    return { el: el, order: parseInt(el.style.order, 10) || 0, at: at };
  });
  keyed.sort(function (a, b) {
    return a.order - b.order || a.at - b.at;
  });
  return keyed.map(function (row) {
    return row.el;
  });
}

function groupOfEl(el: HTMLElement): string {
  return el.getAttribute(MARKS.kind) === "official" ? "official" : "third";
}

/**
 * 量出一组行的矩形，顺手算好当前轴向上的中点。
 *
 * @param rows 要量的行，顺序即视觉顺序。
 * @param axis 轴向：`x` 取横向中点、其余取纵向。
 * @param idAttr 行身份的属性名；设置页与收纳包的行不用 `MARKS.id`，由调用方指定。
 * @returns 与 `rows` 一一对应的矩形。
 */
function rectsOf(rows: HTMLElement[], axis: string, idAttr?: string): DragRowRect[] {
  const attr = idAttr || MARKS.id;
  const out: DragRowRect[] = [];
  for (let i = 0; i < rows.length; i++) {
    const rect = rows[i].getBoundingClientRect();
    const id = rows[i].getAttribute(attr) || "";
    out.push({
      el: rows[i],
      id: id,
      mid: axis === "x" ? rect.left + rect.width / 2 : rect.top + rect.height / 2,
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    });
  }
  return out;
}

/**
 * 把该组既有的顺序值按预览序列重排——只重排不重算，本组恰好保住原本占用的数值槽位，集合之外不动。
 *
 * @param nodes 该组当前的全部行，提供待重新分配的 order 槽位。
 * @param sequence 预览后的行顺序；超出槽位数的尾部丢弃。
 */
function permuteOrder(nodes: HTMLElement[], sequence: HTMLElement[]): void {
  const slots: number[] = [];
  for (let i = 0; i < nodes.length; i++) slots.push(parseInt(nodes[i].style.order, 10) || 0);
  slots.sort(function (a, b) {
    return a - b;
  });
  for (let i = 0; i < sequence.length && i < slots.length; i++) {
    sequence[i].style.order = String(slots[i]);
  }
}

/**
 * 把预览序列写回行内 `order`：`mixed`（混合排序）为真时整条 scope 就是一个组，否则只重排 `group` 这一组。
 *
 * @param scope 槽位 key。
 * @param group 限定组（"official" / "third"）；`mixed` 为真时不生效。
 * @param sequence 预览后的行顺序，含被拖行。
 * @param mixed 是否按混合排序处理，通常传 `mixedOrder(store.get())`。
 */
function previewGroup(scope: string, group: string, sequence: HTMLElement[], mixed: boolean): void {
  const all = rowsInScope(scope);
  const mine: HTMLElement[] = [];
  if (mixed) {
    // 预览序列与槽位一一对应，不给 parseInt 撞值留机会。
    for (let i = 0; i < all.length; i++) mine.push(all[i]);
  } else {
    for (let i = 0; i < all.length; i++) {
      if (groupOfEl(all[i]) === group) mine.push(all[i]);
    }
  }
  permuteOrder(mine, sequence);
}

/**
 * 落点表示成 `rects` 的下标；传入的是不含被拖行的组，结果就是 splice 位置，`dragged` 防护兼顾传完整列表的调用方。
 *
 * @param rects 参与插入点计算的行矩形。
 * @param pointer 指针在当前轴上的坐标。
 * @param dragged 被拖行的 id；命中时跳过该行，不计数。
 * @returns splice 位置：`pointer` 越过的行数。
 */
function insertionIndex(rects: DragRowRect[], pointer: number, dragged: string): number {
  let index = 0;
  for (let i = 0; i < rects.length; i++) {
    if (rects[i].id === dragged) continue;
    if (pointer > rects[i].mid) index++;
  }
  return index;
}

function createDragController(store: StoreHandle): { attach: () => void; detach: () => void } {
  let pending: DragPending | null = null;
  let active = false;
  let scope = "";
  let id = "";
  let group = "";
  let axis = "y";
  let sequence: HTMLElement[] = [];
  let draggedEl: HTMLElement | null = null;
  let suppressClickUntil = 0;
  // 指针在当前轴上的最近一次坐标。滚动时指针没动、矩形全变了，预览要拿它重算一次。
  let lastPointer = 0;
  // 另一个轴的坐标，以及两个落点的命中状态：拖到「更多」入口上松手是收进「更多」（用户 m04058），
  // 拖到悬浮框启动器上松手是收起（用户 m04359，优先于「更多」）。
  let lastX = 0;
  let lastY = 0;
  const moreSlot = createDropSlot(MARKS.over);
  const stashSlot = createDropSlot(DROP_MARK);
  // 一帧最多重算一次（规则在 drag-frame.ts）。
  const throttle = createFrameThrottle(function (pointer: number): void {
    if (active && draggedEl) applyAt(pointer);
  });

  /**
   * 找可拖行的三级兜底：closest → elementsFromPoint → 几何硬扫；pointer-events:none 的条带只有硬扫够得到。
   *
   * @param target 指针事件的原始目标，非 Element 时直接放弃。
   * @param x 指针横坐标；与 `y` 任一缺失时只走 closest 一级。
   * @param y 指针纵坐标。
   * @returns 命中的受管行；三级都落空时为 null。
   */
  function rowFrom(target: EventTarget | null, x?: number, y?: number): HTMLElement | null {
    if (!target || !(target instanceof Element)) return null;
    const selector = "[" + MARKS.drag + '="1"][' + MARKS.id + "]";
    const row = target.closest(selector) as HTMLElement | null;
    if (row) return row;
    if (typeof x !== "number" || typeof y !== "number") return null;
    const stack = document.elementsFromPoint(x, y);
    for (let i = 0; i < stack.length; i++) {
      if (stack[i].matches(selector)) return stack[i] as HTMLElement;
    }
    return rowAtPoint(selector, x, y);
  }

  /**
   * 这次拖动真正能重排的行：默认官方与第三方不跨分割线互换，另一组的几何量不参与插入点；混合排序（allowDragOfficial + mixGroups 同开）或 group 为 "all" 时放开到整条 scope。
   *
   * @returns 本组按视觉顺序排列的行；混合排序或 `group` 为 "all" 时是整条 scope。
   */
  function groupRows(): HTMLElement[] {
    const all = visualRows(scope);
    const out: HTMLElement[] = [];
    const mixed = mixedOrder(store.get());
    for (let i = 0; i < all.length; i++) {
      // 「更多」入口钉在末尾、不参与换位：它既不是落点候选，也不进预览序列（见 isMoreEntry）。
      if (isMoreEntry(scope, all[i].getAttribute(MARKS.id) || "")) continue;
      if (mixed || group === "all" || groupOfEl(all[i]) === group) out.push(all[i]);
    }
    return out;
  }

  /**
   * 拖这一处的行时，哪一处槽位上的「更多」入口能接住它。
   *
   * 侧边栏底部与输入框下方都没有自己的「更多」入口：它们分别归侧边栏那扇与对话那扇菜单
   * （见 `MORE_SCOPE_HOME`），入口画在侧边栏顶部与对话标签条上，所以落点要跨槽位找。
   *
   * @returns 承载这颗入口的槽位 key。
   */
  function moreEntryScope(): string {
    const region = moreRegionOf(scope);
    if (region === "conversation") return "tabs";
    if (region === "rightbar") return "right";
    return "sidebar";
  }

  /**
   * 指针落在哪颗「更多」入口上——落在上面松手就是把这行收进「更多」。
   *
   * @param x 指针横坐标。
   * @param y 指针纵坐标。
   * @returns 命中的「更多」入口元素；不在任何一颗上时为 null。
   */
  function pinnedRowAt(x: number, y: number): HTMLElement | null {
    // 设置页导航没有「更多」可进（`MORE_SCOPES` 里没有它），拖到哪儿都不点亮。
    if (MORE_SCOPES.indexOf(scope) < 0) return null;
    const entry = moreEntryScope();
    const selector = "[" + MARKS.scope + '="' + entry + '"][' + MARKS.row + "][" + MARKS.id + '="' + MORE_ID + '"]';
    return firstRectHit(document.querySelectorAll(selector), x, y, function (el) {
      return !el.hasAttribute(MARKS.hidden);
    });
  }

  /**
   * `begin` 时拍一次快照：该组在拖动开始那一刻的顺序，含被拖那一行；`finish` 拿它当基准把预览序列并回 scope 的完整 id 顺序。
   */
  function snapshotGroup(): void {
    const rects = rectsOf(groupRows(), axis);
    sequence = rects.map(function (rect) {
      return rect.el;
    });
  }

  /**
   * 测量本组除被拖行以外的行矩形：被拖行由调用方按落点 splice 回序列，不参与插入点计算。
   *
   * @returns 本组的行矩形，按当前视觉顺序排列。
   */
  function measureRects(): DragRowRect[] {
    const mine: HTMLElement[] = [];
    const rows = groupRows();
    for (let i = 0; i < rows.length; i++) {
      if (rows[i] !== draggedEl) mine.push(rows[i]);
    }
    return rectsOf(mine, axis);
  }

  function begin(event: PointerEvent, row: HTMLElement): void {
    active = true;
    setDragActive(true);
    scope = row.getAttribute(MARKS.scope) || "";
    id = row.getAttribute(MARKS.id) || "";
    // 组取自行上的 kind 标记（投影写死的），不用 mixedOrder 覆盖。
    group = groupOfEl(row);
    draggedEl = row;
    axis = containerAxis(row, scope);
    lastX = event.clientX;
    lastY = event.clientY;
    moreSlot.clear();
    stashSlot.clear();
    row.setAttribute(MARKS.dragging, "1");
    snapshotGroup();
    document.body.style.cursor = "grabbing";
    event.preventDefault();
  }

  function update(event: PointerEvent): void {
    if (!draggedEl) return;
    lastX = event.clientX;
    lastY = event.clientY;
    lastPointer = axis === "x" ? event.clientX : event.clientY;
    // 一帧最多重算一次，逐次测量会拖垮主线程。
    throttle.schedule(lastPointer);
  }

  /**
   * 松手提交前把积压的那一帧补掉，`finish` 才拿得到最新算出的预览序列。
   */
  function flushUpdate(): void {
    throttle.flush();
  }

  /**
   * 拿一个指针坐标重算插入点并重画预览；指针移动和滚动都走这一条。
   *
   * @param pointer 指针在当前轴上的坐标。
   */
  function applyAt(pointer: number): void {
    if (!draggedEl) return;

    // 拖到悬浮框上：松手就是收起这一行（用户 m04359）。设置页的行还可以拖到本插件的页面上收起
    // （用户 m05013）。它比「更多」入口更重，先判它。
    const stashHit =
      stashDropAt(lastX, lastY) || (scope === "settings" ? pluginPageAt(lastX, lastY) : null);
    stashSlot.sync(stashHit);
    if (stashHit) {
      // 落在启动器上时不预览换位，「更多」入口的高亮也一并撤掉。
      moreSlot.clear();
      return;
    }

    // 拖到「更多」入口上：不预览换位，只把那一行点亮；松手时按收进「更多」提交。
    moreSlot.sync(pinnedRowAt(lastX, lastY));
    if (moreSlot.hit()) return;

    const live = measureRects();
    const at = insertionIndex(live, pointer, id);

    const next: HTMLElement[] = [];
    for (let i = 0; i < live.length; i++) next.push(live[i].el);
    next.splice(at, 0, draggedEl);
    sequence = next;
    previewGroup(scope, group, next, mixedOrder(store.get()));
  }

  function finish(): void {
    if (!draggedEl) return;
    flushUpdate();
    const finalSequence = sequence.slice();
    const finalScope = scope;
    const ids = finalSequence.map(function (node) {
      // 没拿到 id 的行拿空串，后面按 all 重建时视为不存在。
      return node.getAttribute(MARKS.id) || "";
    });
    // realId / 被拖行 id / 落点下标必须在 cleanup() 之前取走：cleanup 会清空 sequence、id、draggedEl。
    const hasRealId = ids.length > 0 && ids.every(function (value) { return value !== ""; });
    const draggedId = id;
    // 落在「更多」入口上：这一拖不是换位，是把这行收进「更多」。
    const dropIntoMore = moreSlot.hit() !== null;
    // 落在悬浮框上：这一拖是收起，优先级高于「更多」（用户 m04359）。
    const dropStash = stashSlot.hit() !== null;
    // 尾随的 click 属于拖动要吞掉；截止时刻在 finish 武装。
    suppressClickUntil = Date.now() + LO_CLICK_SUPPRESS_MS;
    cleanup();
    if (commitStashOrMore(store, finalScope, draggedId, dropIntoMore, dropStash)) return;
    if (!hasRealId) return;
    // 顺序即落点：直接用松手那一刻的预览序列当真值，不回屏读 style.order——预览只重排过部分槽位，读回可能撞值或倒序。
    const next: string[] = [];
    const all = visualRows(finalScope);
    const seen: Record<string, boolean> = {};
    for (let i = 0; i < finalSequence.length; i++) {
      const rid = finalSequence[i].getAttribute(MARKS.id);
      if (rid && !seen[rid]) {
        seen[rid] = true;
        next.push(rid);
      }
    }
    // 屏上还有预览没覆盖的行（集合外的），按屏序补在后面，保证 order 一行不漏。
    for (let i = 0; i < all.length; i++) {
      const rid = all[i].getAttribute(MARKS.id);
      if (rid && !seen[rid]) {
        seen[rid] = true;
        next.push(rid);
      }
    }
    // 兜底：`order` 里有、屏上却没有的 id（隐藏行不排 order）也留住，排在末尾不影响已排好的顺序。
    const savedIds: string[] = (store.get().order[finalScope] || []).slice();
    for (let i = 0; i < savedIds.length; i++) {
      if (next.indexOf(savedIds[i]) >= 0) continue;
      next.push(savedIds[i]);
    }
    store.update(function (state) {
      writeOrder(state, finalScope, next);
    });
  }

  function cleanup(): void {
    throttle.drop();
    if (draggedEl) {
      draggedEl.removeAttribute(MARKS.dragging);
      // 收手时擦掉可能残留的落点标记。
      draggedEl.removeAttribute(MARKS.over);
    }
    moreSlot.clear();
    stashSlot.clear();
    document.body.style.cursor = "";
    pending = null;
    active = false;
    setDragActive(false);
    draggedEl = null;
    sequence = [];
  }

  function onDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest(".lo-pop, .lo-stash, .lo-launcher")) return;
    const row = rowFrom(event.target, event.clientX, event.clientY);
    if (!row) return;
    pending = {
      row: row,
      x: event.clientX,
      y: event.clientY
    };
  }

  function onMove(event: PointerEvent): void {
    if (!active) {
      if (!pending) return;
      const dx = event.clientX - pending.x;
      const dy = event.clientY - pending.y;
      if (dx * dx + dy * dy < LO_DRAG_THRESHOLD * LO_DRAG_THRESHOLD) return;
      const row = pending.row;
      pending = null;
      begin(event, row);
      return;
    }
    event.preventDefault();
    update(event);
  }

  function onUp(event: PointerEvent): void {
    if (active) {
      // 松手点可能和最后一次 pointermove 不同（指针一甩就抬）：按松手坐标补算一次，
      // 否则落点按旧位置判，拖到「更多」/ 悬浮框上会被漏掉。
      lastX = event.clientX;
      lastY = event.clientY;
      lastPointer = axis === "x" ? event.clientX : event.clientY;
      // 先丢掉积压帧再补算：留着它会在 finish 里用旧坐标把预览覆盖回去。
      throttle.drop();
      applyAt(lastPointer);
      finish();
    } else {
      cleanup();
    }
  }

  function onCancel(): void {
    if (active) {
      // 投影下一轮会用 store 里的值重写每一个 order，所以丢弃预览只需要请求一轮即可。
      cleanup();
      store.update(function () {});
    } else {
      cleanup();
    }
  }

  /**
   * 滚动事件没有新的指针坐标，拿上一次的坐标重算即可（`onScroll` 用）。
   */
  function refreshRects(): void {
    if (active && draggedEl) applyAt(lastPointer);
  }

  function onScroll(): void {
    if (active) refreshRects();
  }

  function onClickCapture(event: MouseEvent): void {
    // 吞掉跟手的那一下 click 后就归零：否则在这个时间窗里用户自己点别的行也会被吞掉。
    if (swallowClick(event, suppressClickUntil)) suppressClickUntil = 0;
  }

  let detachEvents: (() => void) | null = null;

  return {
    attach: function (): void {
      if (detachEvents) return;
      detachEvents = bindDragEvents({
        down: onDown,
        move: onMove,
        up: onUp,
        cancel: onCancel,
        click: onClickCapture,
        scroll: onScroll,
        resize: true
      });
    },
    detach: function (): void {
      if (!detachEvents) return;
      detachEvents();
      detachEvents = null;
      cleanup();
    }
  };
}