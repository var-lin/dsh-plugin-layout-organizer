function createListDragController(store: StoreHandle): { attach: () => void; detach: () => void } {
  let pending: { row: HTMLElement; container: HTMLElement; scope: string; id: string; group: string; x: number; y: number } | null = null;
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
  // 最近一次 `update()` 算出的组内目标下标，松手时直接加在该组跨度起点上换算容器下标。
  let insertAt = 0;
  // 垂直列表只看 Y；待执行的重算帧，0 表示本帧没有排队的重算。
  let lastPointer = 0;
  let rafId = 0;

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
    const mine = groupRows(containerEl, group);
    rects = [];
    for (let i = 0; i < mine.length; i++) {
      const rect = mine[i].getBoundingClientRect();
      rects.push({
        el: mine[i],
        id: mine[i].getAttribute("data-lo-list-id") || "",
        mid: rect.top + rect.height / 2,
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
    }
  }

  // 按整只容器重编 order；React 行缺省 order 为 0，只编该组会被缺省 0 的兄弟挤到后面。
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

  // 行内 order 是预览脚手架，擦除推迟到下一帧，让 React 先按新顺序画完。
  function scheduleClearPreview(): void {
    if (touched.length === 0) return;
    const nodes = touched;
    touched = [];
    requestAnimationFrame(function () {
      if (active) return;
      for (let i = 0; i < nodes.length; i++) nodes[i].style.order = "";
    });
  }

  function begin(row: HTMLElement, container: HTMLElement): void {
    active = true;
    draggedEl = row;
    containerEl = container;
    id = row.getAttribute("data-lo-list-id") || "";
    group = row.getAttribute("data-lo-list-group") || "";
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
    lastPointer = event.clientY;
    // 一帧最多重算一次，逐次测量会拖垮主线程。
    if (rafId) return;
    rafId = window.requestAnimationFrame(function () {
      rafId = 0;
      if (active && draggedEl) applyAt(lastPointer);
    });
  }

  function flushUpdate(): void {
    if (!rafId) return;
    window.cancelAnimationFrame(rafId);
    rafId = 0;
    if (active && draggedEl) applyAt(lastPointer);
  }

  function applyAt(pointer: number): void {
    if (!draggedEl) return;
    const without = rects.filter(function (rect) {
      return rect.id !== id;
    });
    let at = 0;
    for (let i = 0; i < without.length; i++) {
      if (pointer > without[i].mid) at++;
    }
    insertAt = at;
    const next: HTMLElement[] = [];
    for (let i = 0; i < without.length; i++) next.push(without[i].el);
    next.splice(at, 0, draggedEl);
    sequence = next;
    previewOrder(draggedEl.parentElement || containerEl, group, next);
  }

  function cleanup(): void {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
    if (draggedEl) draggedEl.removeAttribute("data-lo-dragging");
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
    // 行内的按钮（上移、下移、收纳）必须保持可点击。
    if (event.target instanceof Element && event.target.closest("button")) return;
    const row = rowFrom(event.target);
    if (!row) return;
    const container = row.parentElement;
    if (!container || !container.getAttribute("data-lo-list-scope")) return;
    pending = {
      row: row,
      container: container,
      scope: container.getAttribute("data-lo-list-scope") || "",
      id: row.getAttribute("data-lo-list-id") || "",
      group: row.getAttribute("data-lo-list-group") || "",
      x: event.clientX,
      y: event.clientY
    };
  }

  function onMove(event: PointerEvent): void {
    if (!pending && !active) return;
    if (!active) {
      if (!pending) return;
      if (Math.abs(event.clientX - pending.x) < LO_DRAG_THRESHOLD && Math.abs(event.clientY - pending.y) < LO_DRAG_THRESHOLD) return;
      const row = pending.row;
      const container = pending.container;
      pending = null;
      begin(row, container);
    }
    event.preventDefault();
    update(event);
  }

  function onUp(): void {
    if (!active || !draggedEl || !containerEl) {
      cleanup();
      return;
    }
    flushUpdate();
    const finalSequence = sequence.slice();
    const finalScope = containerEl.getAttribute("data-lo-list-scope") || "";
    const rows = rowsOf(containerEl);
    const allIds: string[] = [];
    for (let i = 0; i < rows.length; i++) allIds.push(rows[i].getAttribute("data-lo-list-id") || "");
    const ids = finalSequence.map(function (node) {
      return node.getAttribute("data-lo-list-id") || "";
    });
    cleanup();
    if (ids.length === 0) return;
    suppressClickUntil = Date.now() + LO_CLICK_SUPPRESS_MS;
    scheduleClearPreview();

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

  // 取消：预览未提交，行上的脚手架立刻擦掉。
  function onCancel(): void {
    const nodes = touched;
    touched = [];
    for (let i = 0; i < nodes.length; i++) nodes[i].style.order = "";
    cleanup();
  }

  function onClickCapture(event: MouseEvent): void {
    if (Date.now() > suppressClickUntil) return;
    suppressClickUntil = 0;
    event.preventDefault();
    event.stopPropagation();
  }

  function onScroll(): void {
    if (active) refreshRects();
  }

  return {
    attach: function (): void {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointermove", onMove, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("pointercancel", onCancel, true);
      document.addEventListener("click", onClickCapture, true);
      window.addEventListener("scroll", onScroll, true);
    },
    detach: function (): void {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointermove", onMove, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("pointercancel", onCancel, true);
      document.removeEventListener("click", onClickCapture, true);
      window.removeEventListener("scroll", onScroll, true);
      cleanup();
    }
  };
}