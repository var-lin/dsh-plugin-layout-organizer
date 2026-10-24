// 两个拖拽控制器（`drag-rows` 排行上的行、`drag-list` 排面板里的行）共用的手势管线。
//
// 两处排的东西不一样，但下面两件事完全同构：
// 1. 指针每动一次都重排会拖垮主线程，于是「一帧最多重算一次」；
// 2. 监听集合固定是 document 上的指针四件套 + click（拖完吞一下）+ window 上的 scroll（可选 resize）。
//
// 抽出来是为了让这两条规则只有一处实现：以前改动其中一条（比如从 scroll 换成 rAF）要记得
// 两边都改，忘一边就是两处手感不一致。

/**
 * 一帧一次的重算节流。
 *
 * `schedule` 只记下最新的坐标，真正干活推迟到下一帧；反复 schedule 只会在同一帧里跑一次。
 * `flush` 给「松手提交」用：把积压的那一帧补掉，之后读到的预览序列才是最新的。
 */
interface FrameThrottle {
  /**
   * 记下这一帧要用的坐标，并在下一帧执行一次。
   *
   * @param pointer 指针在当前轴上的坐标。
   */
  schedule(pointer: number): void;
  /**
   * 立刻把积压的那一帧补掉（没有积压就什么都不做）。
   */
  flush(): void;
  /**
   * 丢掉积压的那一帧，不再执行。
   */
  drop(): void;
}

/**
 * 造一个一帧一次的重算节流。
 *
 * @param run 真正重算插入点并重画预览的回调，参数是最近一次指针坐标。
 * @returns 节流句柄。
 */
function createFrameThrottle(run: (pointer: number) => void): FrameThrottle {
  let rafId = 0;
  let last = 0;

  function frame(): void {
    rafId = 0;
    run(last);
  }

  return {
    schedule: function (pointer: number): void {
      last = pointer;
      if (rafId) return;
      rafId = window.requestAnimationFrame(frame);
    },
    flush: function (): void {
      if (!rafId) return;
      window.cancelAnimationFrame(rafId);
      rafId = 0;
      run(last);
    },
    drop: function (): void {
      if (!rafId) return;
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };
}

/**
 * 一次拖拽手势要接的事件。
 *
 * 全部按 capture 阶段挂在 document / window 上：行可能在任意容器里，挂在行上会在
 * 宿主重渲染时丢监听。
 */
interface DragHandlers {
  down: (event: PointerEvent) => void;
  move: (event: PointerEvent) => void;
  up: (event: PointerEvent) => void;
  cancel: (event: Event) => void;
  click: (event: MouseEvent) => void;
  /** 滚动时重算几何：行会随容器移动。 */
  scroll: () => void;
  /** 窗口大小变化时也重算几何；只有按行排的那套需要。 */
  resize: boolean;
}

/**
 * 挂上手势监听。
 *
 * @param handlers 各个事件的回调。
 * @returns 卸载函数（幂等，调用一次后再调用无副作用）。
 */
function bindDragEvents(handlers: DragHandlers): () => void {
  const doc = document as Document;
  doc.addEventListener("pointerdown", handlers.down, true);
  doc.addEventListener("pointermove", handlers.move, true);
  doc.addEventListener("pointerup", handlers.up, true);
  doc.addEventListener("pointercancel", handlers.cancel, true);
  doc.addEventListener("click", handlers.click, true);
  window.addEventListener("scroll", handlers.scroll, true);
  if (handlers.resize) window.addEventListener("resize", handlers.scroll, true);

  let bound = true;
  return function (): void {
    if (!bound) return;
    bound = false;
    doc.removeEventListener("pointerdown", handlers.down, true);
    doc.removeEventListener("pointermove", handlers.move, true);
    doc.removeEventListener("pointerup", handlers.up, true);
    doc.removeEventListener("pointercancel", handlers.cancel, true);
    doc.removeEventListener("click", handlers.click, true);
    window.removeEventListener("scroll", handlers.scroll, true);
    if (handlers.resize) window.removeEventListener("resize", handlers.scroll, true);
  };
}
