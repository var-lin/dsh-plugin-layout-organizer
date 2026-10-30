function createListDragController(store: StoreHandle): { attach: () => void; detach: () => void } {
  let pending: { row: HTMLElement; container: HTMLElement; x: number; y: number } | null = null;
  let active = false;
  let suppressClickUntil = 0;
  let rects: DragRowRect[] = [];
  let sequence: HTMLElement[] = [];
  let draggedEl: HTMLElement | null = null;
  let containerEl: HTMLElement | null = null;
  let group = "";
  let id = "";
  // 预览期间被写过行内 `order` 的行。提交落地之后要把它擦掉，理由见 `scheduleClearPreview`。
  let touched: HTMLElement[] = [];
  // 延迟擦除那一帧的句柄，重复排帧时先取消旧的，免得两帧交叉把新预览擦掉。
  let clearFrame: number | null = null;
  // 最近一次 `update()` 算出的组内目标下标，松手时直接加在该组跨度起点上换算容器下标。
  let insertAt = 0;
  // 垂直列表只看 Y。
  let lastPointer = 0;
  // 另一个轴的坐标，以及两个落点的命中状态：拖到「更多」行上松手是收进「更多」（用户 m04058），
  // 拖到悬浮框启动器上松手是收起（用户 m04359，优先于「更多」）。
  let lastX = 0;
  let lastY = 0;
  const moreSlot = createDropSlot(MARKS.over);
  const stashSlot = createDropSlot(DROP_MARK);
  // 这一行是不是已经被拖出了本插件的设置页——拖出去松手就是恢复它（用户 m07052）。
  let outOfPage = false;
  // 一帧最多重算一次（规则在 drag-frame.ts）。
  const throttle = createFrameThrottle(function (pointer: number): void {
    if (active && draggedEl) applyAt(pointer);
  });

  function rowFrom(target: EventTarget | null): HTMLElement | null {
    if (!target || !(target instanceof Element)) return null;
    const row = target.closest(".lo-row[data-lo-list-id]") as HTMLElement | null;
    if (!row || row.getAttribute("data-locked") === "1") return null;
    return row;
  }

  function rowsOf(container: HTMLElement): HTMLElement[] {
    const nodes = container.querySelectorAll(":scope > .lo-row[data-lo-list-id]");
    return Array.prototype.slice.call(nodes) as HTMLElement[];
  }

  function groupRows(container: HTMLElement, want: string): HTMLElement[] {
    const all = rowsOf(container);
    const out: HTMLElement[] = [];
    for (let i = 0; i < all.length; i++) {
      if (all[i].getAttribute("data-lo-list-group") === want) out.push(all[i]);
    }
    return out;
  }

  function refreshRects(): void {
    if (!containerEl) return;
    // 设置页的行只带 `data-lo-list-id`，没有投影标记，所以身份属性得自己指定。
    rects = rectsOf(groupRows(containerEl, group), "y", "data-lo-list-id");
  }

  /**
   * 按整只容器重编 order；React 行缺省 order 为 0，只编该组会被缺省 0 的兄弟挤到后面。
   *
   * @param container 行所在的容器。
   * @param want 目标组的 `data-lo-list-group` 值。
   * @param sequence 预览后的该组行顺序，含被拖行。
   */
  function previewOrder(container: HTMLElement, want: string, sequence: HTMLElement[]): void {
    const all = rowsOf(container);
    const next: HTMLElement[] = [];
    let done = false;
    for (let i = 0; i < all.length; i++) {
      if (all[i].getAttribute("data-lo-list-group") === want) {
        if (!done) {
          done = true;
          for (let k = 0; k < sequence.length; k++) next.push(sequence[k]);
        }
        continue;
      }
      next.push(all[i]);
    }
    if (!done) return;
    for (let i = 0; i < next.length; i++) next[i].style.order = String(i);
    touched = next;
  }

  /**
   * 行内 order 是预览脚手架，擦除推迟到下一帧，让 React 先按新顺序画完。
   */
  function scheduleClearPreview(): void {
    if (touched.length === 0) return;
    const nodes = touched;
    touched = [];
    if (clearFrame !== null) cancelAnimationFrame(clearFrame);
    clearFrame = requestAnimationFrame(function () {
      clearFrame = null;
      // 手势又开始了：新预览已经写在新节点上，别拿旧节点把它擦掉。
      if (active) return;
      for (let i = 0; i < nodes.length; i++) nodes[i].style.order = "";
    });
  }

  /**
   * 立刻擦掉上一轮留下的预览顺序（开新手势、取消、卸载时用）。
   */
  function clearPreviewNow(): void {
    if (clearFrame !== null) {
      cancelAnimationFrame(clearFrame);
      clearFrame = null;
    }
    for (let i = 0; i < touched.length; i++) touched[i].style.order = "";
    touched = [];
  }

  function begin(row: HTMLElement, container: HTMLElement): void {
    // 上一轮被放弃的预览节点先把 order 擦掉：它们已经不在这一轮的预览序列里，
    // 留着会把这一轮的新顺序压在下面。
    clearPreviewNow();
    active = true;
    draggedEl = row;
    containerEl = container;
    id = row.getAttribute("data-lo-list-id") || "";
    group = row.getAttribute("data-lo-list-group") || "";
    moreSlot.clear();
    stashSlot.clear();
    if (draggedEl) draggedEl.classList.remove("lo-list-out");
    outOfPage = false;
    row.setAttribute("data-lo-dragging", "1");
    // 手势期间置位，投影让位，避免重绘擦掉预览。
    setDragActive(true);
    refreshRects();
    sequence = rects.map(function (rect) {
      return rect.el;
    });
    // 落点初值取这一行当前在组内的下标。
    insertAt = 0;
    for (let i = 0; i < rects.length; i++) {
      if (rects[i].el === row) insertAt = i;
    }
    document.documentElement.style.cursor = "grabbing";
  }

  function update(event: PointerEvent): void {
    if (!draggedEl) return;
    lastX = event.clientX;
    lastY = event.clientY;
    lastPointer = event.clientY;
    // 一帧最多重算一次，逐次测量会拖垮主线程。
    throttle.schedule(lastPointer);
  }

  /**
   * 指针落在卡片里那颗「更多」行上——落在上面松手就是把这行收进「更多」。
   *
   * @param x 指针横坐标。
   * @param y 指针纵坐标。
   * @returns 命中的「更多」行；不在上面时为 null。
   */
  function moreRowAt(x: number, y: number): HTMLElement | null {
    if (!containerEl) return null;
    const nodes = containerEl.querySelectorAll(":scope > .lo-row[data-lo-list-id='" + MORE_ID + "']");
    return firstRectHit(nodes, x, y);
  }

  function applyAt(pointer: number): void {
    if (!draggedEl) return;
    // 拖到悬浮框上：松手就是收起这一行（用户 m04359）。它比「恢复」更重，先判它。
    const stashHit = stashDropAt(lastX, lastY);
    stashSlot.sync(stashHit);
    // 拖出本插件的设置页：松手就是恢复这一行（用户 m07052）。不必非落到设置弹窗的左侧导航上，
    // 甩到页面外面任何地方都算；指针压在悬浮框上时按收起算，不走这一条。
    const out = !stashHit && outsidePluginPage(lastX, lastY, OUT_MARGIN);
    if (out !== outOfPage) {
      outOfPage = out;
      draggedEl.classList.toggle("lo-list-out", out);
    }
    if (stashHit || out) {
      // 落在落点上时不预览换位，「更多」行的高亮也一并撤掉。
      moreSlot.clear();
      return;
    }

    // 拖到「更多」那一行上：不预览换位，只把它点亮；松手时按收进「更多」提交。
    moreSlot.sync(moreRowAt(lastX, lastY));
    if (moreSlot.hit()) return;
    // 与行拖拽共用同一套「越过了几行中线」的几何（见 drag-rows 的 `insertionIndex`）。
    insertAt = insertionIndex(rects, pointer, id);
    const without = rects.filter(function (rect) {
      return rect.id !== id;
    });
    const next: HTMLElement[] = [];
    for (let i = 0; i < without.length; i++) next.push(without[i].el);
    next.splice(insertAt, 0, draggedEl);
    sequence = next;
    previewOrder(draggedEl.parentElement || containerEl, group, next);
  }

  function cleanup(): void {
    throttle.drop();
    if (draggedEl) {
      draggedEl.removeAttribute("data-lo-dragging");
      draggedEl.classList.remove("lo-list-out");
    }
    moreSlot.clear();
    stashSlot.clear();
    outOfPage = false;
    document.documentElement.style.cursor = "";
    // 在最后一轮投影运行之前释放，好让已提交的顺序被画出来。
    setDragActive(false);
    pending = null;
    active = false;
    draggedEl = null;
    containerEl = null;
    rects = [];
    sequence = [];
  }

  function onDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    // 行内的动作按钮（改判、上移、下移、收纳）必须保持可点击；名称区是行本身的一部分，
    // 仍可以按住它拖动，点击与拖拽靠阈值区分（拖动一旦开始，onClickCapture 会吞掉这次 click）。
    if (event.target instanceof Element && event.target.closest(".lo-btn")) return;
    const row = rowFrom(event.target);
    if (!row) return;
    const container = row.parentElement;
    if (!container || !container.getAttribute("data-lo-list-scope")) return;
    pending = {
      row: row,
      container: container,
      x: event.clientX,
      y: event.clientY
    };
  }

  function onMove(event: PointerEvent): void {
    if (!pending && !active) return;
    if (!active) {
      if (belowDragThreshold(event.clientX, event.clientY, pending.x, pending.y)) return;
      const row = pending.row;
      const container = pending.container;
      pending = null;
      begin(row, container);
    }
    event.preventDefault();
    update(event);
  }

  function onUp(event: PointerEvent): void {
    if (!active || !draggedEl || !containerEl) {
      cleanup();
      return;
    }
    // 松手点可能和最后一次 pointermove 不同（指针一甩就抬）：按松手坐标补算一次。
    lastX = event.clientX;
    lastY = event.clientY;
    lastPointer = event.clientY;
    // 先丢掉积压帧再补算：留着它会在提交前用旧坐标把落点覆盖回去。
    throttle.drop();
    applyAt(lastPointer);
    const finalSequence = sequence.slice();
    const finalScope = containerEl.getAttribute("data-lo-list-scope") || "";
    const rows = rowsOf(containerEl);
    const allIds: string[] = [];
    for (let i = 0; i < rows.length; i++) allIds.push(rows[i].getAttribute("data-lo-list-id") || "");
    const ids = finalSequence.map(function (node) {
      return node.getAttribute("data-lo-list-id") || "";
    });
    // 落在「更多」那一行上：这一拖不是换位，是把这行收进「更多」。
    const dropIntoMore = moreSlot.hit() !== null;
    // 落在悬浮框上：这一拖是收起，优先级高于「更多」（用户 m04359）。
    const dropStash = stashSlot.hit() !== null;
    // 已经拖出本插件的设置页：这一拖是恢复（用户 m07052）。flushUpdate 刚按松手坐标补算过。
    const dropRestore = outOfPage && !dropStash;
    const draggedId = id;
    // 尾随的 click 属于拖动要吞掉：三条提交路径都要武装，不能等排序分支才设，
    // 否则拖到「更多」/ 悬浮框上松手会顺手把这一行点开（面板里的主按钮是导航）。
    suppressClickUntil = Date.now() + LO_CLICK_SUPPRESS_MS;
    cleanup();
    // 预览写的行内 order 在三条落点分支上也要擦：React 复用这些节点，不清就会停在预览顺序上。
    scheduleClearPreview();
    if (dropRestore) {
      if (draggedId) {
        store.update(function (state) {
          setHidden(state, finalScope, draggedId, false);
          // 收进「更多」的行本来就没 hidden，只清 hidden 等于什么都没做，一并取出来。
          setIntoMore(state, finalScope, draggedId, false);
        });
      }
      return;
    }
    if (commitStashOrMore(store, finalScope, draggedId, dropIntoMore, dropStash)) return;
    if (ids.length === 0) return;

    // 落点（不含被拖行的容器下标）钳制到该组跨度 low..high+1 内，落不到分割线另一侧；insertAt 是组内下标，加在跨度起点。
    const without = allIds.filter(function (rowId) {
      return rowId !== id;
    });
    let low = -1;
    let high = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].getAttribute("data-lo-list-group") !== group) continue;
      const rowId = rows[i].getAttribute("data-lo-list-id") || "";
      if (rowId === id) continue;
      const at = without.indexOf(rowId);
      if (at < 0) continue;
      if (low < 0 || at < low) low = at;
      if (high < 0 || at > high) high = at;
    }
    const merged: string[] = [];
    for (let i = 0; i < without.length; i++) merged.push(without[i]);
    if (low < 0) {
      // 该组只有这一行：它移不动，放回原来的位置。
      const self = allIds.indexOf(id);
      merged.splice(self < 0 ? merged.length : self, 0, id);
    } else {
      let to = low + insertAt;
      if (to < low) to = low;
      if (to > high + 1) to = high + 1;
      merged.splice(to, 0, id);
    }
    store.update(function (state) {
      writeOrder(state, finalScope, merged);
    });
  }

  /**
   * 取消：预览未提交，行上的脚手架立刻擦掉。
   */
  function onCancel(): void {
    const nodes = touched;
    touched = [];
    for (let i = 0; i < nodes.length; i++) nodes[i].style.order = "";
    cleanup();
  }

  function onClickCapture(event: MouseEvent): void {
    if (swallowClick(event, suppressClickUntil)) suppressClickUntil = 0;
  }

  function onScroll(): void {
    if (active) refreshRects();
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
        resize: false
      });
    },
    detach: function (): void {
      if (!detachEvents) return;
      detachEvents();
      detachEvents = null;
      cleanup();
      // 卸载时预览写的 order 也要擦，否则宿主节点会停在预览顺序上。
      scheduleClearPreview();
    }
  };
}