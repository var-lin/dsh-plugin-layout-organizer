/**
 * 「已收起的按钮」悬浮启动器的几何与命中辅助：把启动器夹在窗口与顶部外壳之间，
 * 并在指针命不中透明元素时按坐标找出落点所在的行。
 */

/**
 * 按坐标在候选行里做几何命中测试。
 *
 * 几何兜底：pointer-events:none 的行不参与命中测试，只能按坐标硬扫，面积最小者胜；最上层是收纳包、菜单或官方弹窗时放弃。
 *
 * @param selector 候选行的选择器。
 * @param x 视口横坐标。
 * @param y 视口纵坐标。
 * @returns 命中的行元素；最上层是收纳包、菜单或官方弹窗，或没有行覆盖该点时返回 null。
 */
function rowAtPoint(selector: string, x: number, y: number): HTMLElement | null {
  const stack = document.elementsFromPoint(x, y);
  if (stack.length > 0 && stack[0].closest('.lo-stash, .lo-pop, .lo-launcher, [role="dialog"], [role="menu"], [data-shortcut-modal]')) return null;
  const nodes = document.querySelectorAll(selector);
  let hit: HTMLElement | null = null;
  let best = Infinity;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i] as HTMLElement;
    const rect = node.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) continue;
    const area = rect.width * rect.height;
    if (area < best) {
      best = area;
      hit = node;
    }
  }
  return hit;
}

/**
 * 启动器不能上浮到顶部外壳之上：测量顶部外壳的下边缘作为纵向位置的下限。
 *
 * @returns 顶部外壳下边缘再往下留 8 像素后的整数位置；测不到外壳时按 48 计算。
 */
function topInset(): number {
  let best = 0;
  const tabs = document.querySelector("[data-conversation-tabs]");
  if (tabs) best = Math.max(best, tabs.getBoundingClientRect().bottom);
  const strips = document.querySelectorAll("[data-window-drag]");
  for (let i = 0; i < strips.length; i++) best = Math.max(best, strips[i].getBoundingClientRect().bottom);
  if (best <= 0) best = LAUNCHER_TOP_FALLBACK;
  return Math.round(best) + LAUNCHER_EDGE;
}

function clampLauncherY(y: number, height: number): number {
  const min = topInset();
  let max = window.innerHeight - height - LAUNCHER_EDGE;
  if (max < min) max = min;
  if (typeof y !== "number" || !isFinite(y)) y = min + LAUNCHER_FIRST_Y;
  return Math.max(min, Math.min(max, y));
}

/**
 * 把启动器的横向位置夹进窗口内。
 *
 * 横向只保证按钮完整留在窗口里，不吸附：拖动过程中它就是鼠标位置，贴哪一侧等松手再定。
 *
 * @param x 期望的横坐标。
 * @param width 启动器宽度。
 * @returns 夹紧后的横坐标，最小 8、最大不超过窗口右边缘减 8；x 不是有限数时返回 8。
 */
function clampLauncherX(x: number, width: number): number {
  let max = window.innerWidth - width - LAUNCHER_EDGE;
  if (max < LAUNCHER_EDGE) max = LAUNCHER_EDGE;
  if (typeof x !== "number" || !isFinite(x)) x = LAUNCHER_EDGE;
  return Math.max(LAUNCHER_EDGE, Math.min(max, x));
}