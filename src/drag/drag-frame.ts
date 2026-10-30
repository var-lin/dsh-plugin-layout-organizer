// 三个拖拽控制器（`drag-rows` 排行上的行、`drag-list` 排设置页卡片里的行、`drag-stash` 排
// 「已收起的按钮」面板里的行）共用的手势管线。
//
// 三处排的东西不一样，但下面两件事完全同构：
// 1. 指针每动一次都重排会拖垮主线程，于是「一帧最多重算一次」；
// 2. 监听集合固定是 document 上的指针四件套 + click（拖完吞一下）+ window 上的 scroll（可选 resize）。
//
// 抽出来是为了让这两条规则只有一处实现：以前改动其中一条（比如从 scroll 换成 rAF）要记得
// 几边都改，忘一边就是几处手感不一致。

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

// 落点高亮的标记。悬浮框启动器与设置页本身共用它（两个落点互斥，同一时刻只会点亮一个）。
// 它挂在落点元素上，不是受管行的标记，所以不进 `MARK_NAMES`——那套名字是投影清场时要从宿主行上
// 擦掉的，混进来会把启动器也当成幽灵行。
const DROP_MARK = "data-lo-stash-over";

/**
 * 一个拖动落点的高亮槽。
 *
 * 三个拖拽控制器（宿主行、设置页列表、「更多」菜单）都用它给悬浮框落点点亮；前两个还用它
 * 点亮「更多」入口。指针停在落点上时把那一颗点亮、离开时熄灭，命中判定各按各的几何，这段
 * 记账完全一样，集中在这里免得三份实现各自漂移。
 *
 * @param mark 点亮用的属性名（见 `DROP_MARK` / `MARKS.over`）。
 * @returns 读取当前命中、同步新命中、清空三件事。
 */
function createDropSlot(mark: string): {
  hit: () => HTMLElement | null;
  sync: (next: HTMLElement | null) => void;
  clear: () => void;
} {
  let el: HTMLElement | null = null;
  return {
    hit: function (): HTMLElement | null {
      return el;
    },
    sync: function (next: HTMLElement | null): void {
      if (next === el) return;
      if (el) el.removeAttribute(mark);
      el = next;
      if (next) next.setAttribute(mark, "1");
    },
    clear: function (): void {
      if (el) el.removeAttribute(mark);
      el = null;
    }
  };
}

/**
 * 指针落在悬浮框（「已收起的按钮」启动器）上。
 *
 * 拖一行到它身上松手就是收起这一行（用户 m04359）。命中还要求它此刻真的露在最上层：
 * 设置弹窗、收纳面板都可能盖住它，盖住时不该算落点，否则会「隔着弹窗收起一行」。
 *
 * @param x 指针横坐标。
 * @param y 指针纵坐标。
 * @returns 命中的启动器元素；不在上面、或被别的层挡住时为 null。
 */
function stashDropAt(x: number, y: number): HTMLElement | null {
  return firstDropAt(".lo-launcher", x, y);
}

/**
 * 在一组按选择器取到的元素里找第一个真正压在指针下的（带遮挡复核，见 `rectDropAt`）。
 *
 * @param selector 候选元素的选择器。
 * @param x 指针横坐标。
 * @param y 指针纵坐标。
 * @returns 命中的元素；都不命中时为 null。
 */
function firstDropAt(selector: string, x: number, y: number): HTMLElement | null {
  const nodes = document.querySelectorAll(selector);
  for (let i = 0; i < nodes.length; i++) {
    const hit = rectDropAt(nodes[i] as HTMLElement, x, y);
    if (hit) return hit;
  }
  return null;
}

/**
 * 指针是否落在这个元素上（矩形判定，再用 elementFromPoint 复核遮挡）。
 *
 * @param el 落点元素；null 时恒不命中。
 * @param x 指针横坐标。
 * @param y 指针纵坐标。
 * @returns 命中时返回该元素，否则 null。
 */
function rectDropAt(el: HTMLElement | null, x: number, y: number): HTMLElement | null {
  if (!el || !rectHit(el, x, y)) return null;
  if (typeof document.elementFromPoint !== "function") return el;
  const top = document.elementFromPoint(x, y);
  if (top && (top === el || el.contains(top))) return el;
  return null;
}

/**
 * 指针是否落在这个元素的矩形里（纯几何，不做遮挡复核）。
 *
 * 拖动中的被拖行自己就压在指针下面，用 `elementFromPoint` 复核会把落点一律判丢，
 * 所以「更多」入口这类落点只按矩形算。
 *
 * @param el 落点元素。
 * @param x 指针横坐标。
 * @param y 指针纵坐标。
 * @returns 命中时为真。
 */
function rectHit(el: HTMLElement, x: number, y: number): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

/**
 * 指针是否已经离开矩形（四边各留一段余量）。
 *
 * 菜单拖出「更多」与收纳包拖出面板用的是同一把尺子：贴边几像素不算离开，
 * 免得菜单边缘的排序手势被误判成「移出」。
 *
 * @param rect 目标矩形；null 时恒为 false。
 * @param x 指针横坐标。
 * @param y 指针纵坐标。
 * @param margin 四边的余量（像素）。
 * @returns 在矩形外时为真。
 */
function outsideRect(
  rect: { left: number; top: number; right: number; bottom: number } | null,
  x: number,
  y: number,
  margin: number
): boolean {
  if (!rect) return false;
  return x < rect.left - margin || x > rect.right + margin || y < rect.top - margin || y > rect.bottom + margin;
}

/**
 * 两个轴的位移都还没到拖动阈值。
 *
 * 只盯一个轴会漏判：菜单行往左右拖出、收纳包行往左右拖出都是有效手势。
 * 三个控制器（宿主行、设置页列表、「更多」菜单、收纳包）都吃这一个阈值。
 *
 * @param x 当前横坐标。
 * @param y 当前纵坐标。
 * @param startX 按下时的横坐标。
 * @param startY 按下时的纵坐标。
 * @returns 还没开始拖时为真。
 */
function belowDragThreshold(x: number, y: number, startX: number, startY: number): boolean {
  return Math.abs(x - startX) < LO_DRAG_THRESHOLD && Math.abs(y - startY) < LO_DRAG_THRESHOLD;
}

/**
 * 拖动刚结束时紧跟的那次 click 要吞掉，否则一拖就顺手把行点开了。
 *
 * 三个控制器都在松手时把截止时刻武装成「现在 + `LO_CLICK_SUPPRESS_MS`」，
 * 再由捕获阶段的 click 监听调这里判定；判定为吞时顺手拦下默认行为与冒泡。
 *
 * @param event 捕获阶段收到的 click 事件。
 * @param until 截止时刻（毫秒时间戳），早于它才算「属于这一拖」。
 * @returns 这次 click 属于拖动、已被拦下时为真。
 */
function swallowClick(event: MouseEvent, until: number): boolean {
  if (Date.now() >= until) return false;
  event.preventDefault();
  event.stopPropagation();
  return true;
}

/**
 * 在一组元素里找第一个被指针压住的（纯几何，见 `rectHit`）。
 *
 * @param nodes 候选元素。
 * @param x 指针横坐标。
 * @param y 指针纵坐标。
 * @param accept 可选的额外过滤（如跳过被隐藏的行）。
 * @returns 命中的元素；都不命中时为 null。
 */
function firstRectHit(
  nodes: ArrayLike<Element>,
  x: number,
  y: number,
  accept?: (el: HTMLElement) => boolean
): HTMLElement | null {
  for (let i = 0; i < nodes.length; i++) {
    const el = nodes[i] as HTMLElement;
    if (accept && !accept(el)) continue;
    if (rectHit(el, x, y)) return el;
  }
  return null;
}

/**
 * 松手时按落点提交「收起 / 收进更多」。
 *
 * 宿主行与设置页列表两条拖拽路径的提交分支完全一样：收起优先于进更多，都不命中就返回 false
 * 让调用方继续走排序提交。
 *
 * @param store 状态句柄。
 * @param scope 行所在槽位。
 * @param id 行 id。
 * @param moreHit 是否落在「更多」入口上。
 * @param stashHit 是否落在悬浮框（或设置页）上。
 * @returns 已按落点提交时为 true。
 */
function commitStashOrMore(
  store: StoreHandle,
  scope: string,
  id: string,
  moreHit: boolean,
  stashHit: boolean
): boolean {
  if (!scope || !id) return false;
  if (stashHit) {
    store.update(function (state: PluginState): void {
      setHidden(state, scope, id, true);
    });
    return true;
  }
  if (moreHit) {
    store.update(function (state: PluginState): void {
      setIntoMore(state, scope, id, true);
    });
    return true;
  }
  return false;
}

/**
 * 指针是否落在本插件的设置页上。
 *
 * 设置页是整块内容区（`.lo-page`），拖「设置窗口·左侧导航」的行过来松手就是收起（用户 m05013）。
 *
 * @param x 指针横坐标。
 * @param y 指针纵坐标。
 * @returns 命中时返回页面根元素，否则 null。
 */
function pluginPageAt(x: number, y: number): HTMLElement | null {
  return firstDropAt(".lo-page", x, y);
}

/**
 * 指针是否已经拖出本插件设置页的范围。
 *
 * 位置管理页里的行拖出整块页面松手就是恢复（用户 m07052）——不必非落到设置弹窗左侧导航上，
 * 甩到页面外面（导航、页面空白、弹窗之外）都算。设置页不在屏幕上时恒为假。
 *
 * @param x 指针横坐标。
 * @param y 指针纵坐标。
 * @param margin 四边的余量（像素）。
 * @returns 在所有可见的 `.lo-page` 之外时为真。
 */
function outsidePluginPage(x: number, y: number, margin: number): boolean {
  const nodes = document.querySelectorAll(".lo-page");
  let seen = false;
  for (let i = 0; i < nodes.length; i++) {
    const rect = (nodes[i] as HTMLElement).getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    seen = true;
    if (!outsideRect(rect, x, y, margin)) return false;
  }
  return seen;
}
