// 「已收起的按钮」面板里的行拖到面板外面松手就恢复（用户 m04547）。
//
// 面板里的行本来只负责点击导航与两颗动作按钮，没有排序；这里只加一条「拖出去 = 恢复」的手势，
// 所以不需要预览换位，也不必碰 `style.order`——判定只看指针有没有离开面板矩形。
//
// 拖动时不搬原行、也不造跟着指针走的东西：面板里的行原地压暗，等指针真的离开面板范围
// （`outsideRect` + `OUT_MARGIN`）时给它画上虚线，松手即恢复（用户 m07265）。

/**
 * 造一个收纳包面板的拖拽控制器。
 *
 * 与另外两个控制器共用 `drag-frame.ts` 的手势管线：监听全部挂在 document / window 的
 * capture 阶段，面板重渲染时不会丢监听。
 *
 * @param store 状态句柄。
 * @returns 挂载与卸载。
 */
function createStashDragController(store: StoreHandle): { attach: () => void; detach: () => void } {
  let pending: { row: HTMLElement; scope: string; id: string; x: number; y: number } | null = null;
  let active = false;
  let rowEl: HTMLElement | null = null;
  let outside = false;
  let suppressClickUntil = 0;
  let unbind: (() => void) | null = null;

  /**
   * 事件落在哪一行收纳包行上。
   *
   * @param target 事件目标。
   * @returns 那一行；不在收纳包行上、或落在行内动作按钮上时返回 null。
   */
  function rowFrom(target: EventTarget | null): HTMLElement | null {
    if (!target || !(target instanceof Element)) return null;
    // 行内动作按钮（进更多 / 恢复）必须保持可点，拖拽只从行本身开始。
    if (target.closest(".lo-btn")) return null;
    const row = target.closest(".lo-stash-row") as HTMLElement | null;
    if (!row) return null;
    // 只认收纳包面板里的行：设置页卡片里没有这个类，保险起见再验一次祖先。
    return row.closest(".lo-stash") ? row : null;
  }

  /**
   * 面板当前的矩形。
   *
   * @returns 面板矩形；面板不在屏幕上时为 null。
   */
  function panelRect(): DOMRect | null {
    const panel = document.querySelector(".lo-stash");
    if (!panel || typeof panel.getBoundingClientRect !== "function") return null;
    const rect = panel.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 ? rect : null;
  }

  function onDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    const row = rowFrom(event.target);
    if (!row) return;
    pending = {
      row: row,
      scope: row.getAttribute("data-lo-stash-scope") || "",
      id: row.getAttribute("data-lo-stash-id") || "",
      x: event.clientX,
      y: event.clientY
    };
  }

  function onMove(event: PointerEvent): void {
    if (!pending && !active) return;
    if (!active) {
      if (belowDragThreshold(event.clientX, event.clientY, pending.x, pending.y)) return;
      active = true;
      rowEl = pending.row;
      if (rowEl) rowEl.setAttribute("data-lo-dragging", "1");
      document.documentElement.style.cursor = "grabbing";
      // 手势期间让投影让位：面板重排会把这一行的压暗与虚线一起擦掉。
      setDragActive(true);
    }
    if (!rowEl) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = panelRect();
    const out = outsideRect(rect, event.clientX, event.clientY, OUT_MARGIN);
    if (out !== outside) {
      outside = out;
      rowEl.classList.toggle("lo-stash-out", out);
    }
  }

  function cleanup(): void {
    if (rowEl) {
      rowEl.removeAttribute("data-lo-dragging");
      rowEl.classList.remove("lo-stash-out");
    }
    document.documentElement.style.cursor = "";
    setDragActive(false);
    pending = null;
    active = false;
    rowEl = null;
    outside = false;
  }

  function onUp(event: PointerEvent): void {
    if (!active) {
      cleanup();
      return;
    }
    const scope = pending ? pending.scope : "";
    const id = pending ? pending.id : "";
    // 以松手那一刻的坐标为准：最后一段移动可能没有派发 pointermove（触摸抬起尤其常见），
    // 只看上一次 move 记下的 outside 会把「已经拖到面板外」判成「还在面板里」。
    const restore = outsideRect(panelRect(), event.clientX, event.clientY, OUT_MARGIN);
    // 拖完抬手不该顺手点开这一行（面板里的主按钮是导航）。
    suppressClickUntil = Date.now() + LO_CLICK_SUPPRESS_MS;
    cleanup();
    if (!restore || !scope || !id) return;
    store.update(function (state: PluginState): void {
      setHidden(state, scope, id, false);
    });
  }

  function onCancel(): void {
    cleanup();
  }

  function onClick(event: MouseEvent): void {
    // 吞掉跟手的那一下 click 后就归零，别把用户在时间窗内的正常点击也吞掉。
    if (swallowClick(event, suppressClickUntil)) suppressClickUntil = 0;
  }

  return {
    attach: function (): void {
      if (unbind) return;
      unbind = bindDragEvents({
        down: onDown,
        move: onMove,
        up: onUp,
        cancel: onCancel,
        click: onClick,
        // 面板是固定尺寸的弹层，不随页面滚动，几何不用重算。
        scroll: function (): void {},
        resize: false
      });
    },
    detach: function (): void {
      if (!unbind) return;
      unbind();
      unbind = null;
      cleanup();
    }
  };
}
