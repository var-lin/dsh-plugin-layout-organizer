// 「已收起的按钮」面板里的行拖到面板外面松手就恢复（用户 m04547）。
//
// 面板里的行本来只负责点击导航与两颗动作按钮，没有排序；这里只加一条「拖出去 = 恢复」的手势，
// 所以不需要预览换位，也不必碰 `style.order`——判定只看指针有没有离开面板矩形。
//
// 拖动时不搬原行、也不造跟着指针走的东西：面板里的行原地压暗，等指针真的离开面板范围
// （`outsideRect` + `OUT_MARGIN`）时给它画上虚线，松手即恢复（用户 m07265）。

/**
 * 收纳包里能拖的一行。
 *
 * @property row 那一行的元素。
 * @property scope 它属于哪一处位置。
 * @property id 插件 id。
 */
interface StashDragPick {
  row: HTMLElement;
  scope: string;
  id: string;
}

/**
 * 造一个收纳包面板的拖拽控制器。
 *
 * 管线（按下 / 阈值 / 松手 / 吞 click / 挂载）走 `createPointerDrag`，与宿主行、设置页那两个
 * 控制器共用同一套；这里只写「认哪一行」与「拖出面板就恢复」。
 *
 * @param store 状态句柄。
 * @returns 挂载与卸载。
 */
function createStashDragController(store: StoreHandle): { attach: () => void; detach: () => void } {
  let rowEl: HTMLElement | null = null;
  let outside = false;

  /**
   * 事件落在哪一行收纳包行上。
   *
   * @param target 事件目标。
   * @returns 那一行与它的身份；不在收纳包行上、或落在行内动作按钮上时返回 null。
   */
  function rowFrom(target: EventTarget | null): StashDragPick | null {
    if (!target || !(target instanceof Element)) return null;
    // 行内动作按钮（进更多 / 恢复）必须保持可点，拖拽只从行本身开始。
    if (target.closest(".lo-btn")) return null;
    const row = target.closest(".lo-stash-row") as HTMLElement | null;
    if (!row) return null;
    // 只认收纳包面板里的行：设置页卡片里没有这个类，保险起见再验一次祖先。
    if (!row.closest(".lo-stash")) return null;
    return {
      row: row,
      scope: row.getAttribute("data-lo-stash-scope") || "",
      id: row.getAttribute("data-lo-stash-id") || ""
    };
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

  function begin(picked: StashDragPick): void {
    rowEl = picked.row;
    rowEl.setAttribute("data-lo-dragging", "1");
    document.documentElement.style.cursor = "grabbing";
    // 手势期间让投影让位：面板重排会把这一行的压暗与虚线一起擦掉。
    setDragActive(true);
  }

  function move(picked: StashDragPick, event: PointerEvent): void {
    if (!rowEl) return;
    event.stopPropagation();
    const out = outsideRect(panelRect(), event.clientX, event.clientY, OUT_MARGIN);
    if (out !== outside) {
      outside = out;
      rowEl.classList.toggle("lo-stash-out", out);
    }
  }

  function drop(picked: StashDragPick, event: PointerEvent): void {
    // 以松手那一刻的坐标为准：最后一段移动可能没有派发 pointermove（触摸抬起尤其常见），
    // 只看上一次 move 记下的 outside 会把「已经拖到面板外」判成「还在面板里」。
    const restore = outsideRect(panelRect(), event.clientX, event.clientY, OUT_MARGIN);
    if (!restore || !picked.scope || !picked.id) return;
    store.update(function (state: PluginState): void {
      setHidden(state, picked.scope, picked.id, false);
    });
  }

  function end(): void {
    if (rowEl) {
      rowEl.removeAttribute("data-lo-dragging");
      rowEl.classList.remove("lo-stash-out");
    }
    document.documentElement.style.cursor = "";
    setDragActive(false);
    rowEl = null;
    outside = false;
  }

  return createPointerDrag<StashDragPick>({
    pick: function (target: EventTarget | null): StashDragPick | null {
      return rowFrom(target);
    },
    begin: begin,
    move: move,
    drop: drop,
    end: end
  });
}