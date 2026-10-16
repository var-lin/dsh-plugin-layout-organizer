const loDividerEls: Record<string, HTMLElement> = {};

function createSurface(cls: string, z: number): HTMLElement {
  const el = document.createElement("div");
  el.className = cls;
  el.setAttribute("aria-hidden", "true");
  el.style.position = "fixed";
  el.style.pointerEvents = "none";
  el.style.zIndex = String(z);
  el.style.display = "none";
  // 钉死右边和下边，避免 right/bottom 撑开内联的 left/top
  el.style.right = "auto";
  el.style.bottom = "auto";
  el.style.margin = "0";
  document.body.appendChild(el);
  return el;
}

/**
 * 判断行是否被祖先藏起来。
 *
 * 行被祖先藏起来时返回真；只查 display:none / visibility:hidden
 *
 * @param el 待检查的行元素，从它自身开始向上查到 body 之前。
 * @returns 自身或某个祖先为 display:none / visibility:hidden 时为真。
 */
function hiddenAway(el: HTMLElement): boolean {
  let node: HTMLElement | null = el;
  while (node && node !== document.body) {
    const style = window.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") return true;
    node = node.parentElement;
  }
  return false;
}

type Box = { left: number; top: number; width: number; height: number };

function unionBox(a: Box, b: Box): Box {
  const left = Math.min(a.left, b.left);
  const top = Math.min(a.top, b.top);
  const right = Math.max(a.left + a.width, b.left + b.width);
  const bottom = Math.max(a.top + a.height, b.top + b.height);
  return { left: left, top: top, width: right - left, height: bottom - top };
}

/**
 * 取行的外部容器盒子。
 *
 * 往上取第一个有尺寸的祖先；量不到由调用方 `showDivider` 退回与另一侧的并集。
 *
 * @param el 行元素，从它的父级开始向上找。
 * @returns 第一个可见且有尺寸的祖先的矩形；一直找到 body 都没有时返回 null。
 */
function containerBox(el: HTMLElement): Box | null {
  let node = el.parentElement;
  while (node && node !== document.body) {
    const style = window.getComputedStyle(node);
    if (style.display !== "none" && style.visibility !== "hidden") {
      const rect = node.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return rect;
    }
    node = node.parentElement;
  }
  return null;
}

function showDivider(scope: string, near: HTMLElement, far: HTMLElement | null, axis: string): void {
  let node = loDividerEls[scope];
  if (!node || !node.isConnected) {
    node = createSurface(CLASS.divider, Z_DIVIDER);
    loDividerEls[scope] = node;
  }
  // 设置页的线在对话框（z-index:1000）内，抬到 1010 之上；其余 scope 保持低位，每次画都重设
  node.style.zIndex = String(DIVIDER_SCOPES_ON_DIALOG.indexOf(scope) >= 0 ? Z_DIVIDER_DIALOG : Z_DIVIDER);
  const nearRect = near.getBoundingClientRect();
  if (nearRect.width <= 0 || nearRect.height <= 0 || hiddenAway(near)) {
    node.style.display = "none";
    return;
  }
  // 官方行整体不可见才当它不存在；量不到矩形时退回贴着第三方行外侧
  const farRect = far ? far.getBoundingClientRect() : null;
  if (far && hiddenAway(far)) {
    node.style.display = "none";
    return;
  }
  const usableFar = farRect && farRect.width > 0 && farRect.height > 0 ? farRect : null;
  const found = containerBox(near);
  const container: Box = found || unionBox(nearRect, usableFar || nearRect);
  if (axis === "x") {
    const edge = usableFar ? (usableFar.right + nearRect.left) / 2 : nearRect.left - 1;
    node.style.left = Math.round(edge) + "px";
    node.style.top = Math.round(container.top) + "px";
    node.style.width = "1px";
    node.style.height = Math.round(container.height) + "px";
  } else {
    const edge = usableFar ? (usableFar.bottom + nearRect.top) / 2 : nearRect.top - 1;
    node.style.left = Math.round(container.left) + "px";
    node.style.top = Math.round(edge) + "px";
    node.style.width = Math.round(container.width) + "px";
    node.style.height = "1px";
  }
  node.style.display = "block";
}

function hideDivider(scope: string): void {
  const node = loDividerEls[scope];
  if (node && node.isConnected) node.style.display = "none";
}

function hideAllDividers(): void {
  for (const scope in loDividerEls) hideDivider(scope);
}

/**
 * 隐藏所有分割线。
 *
 * 分割线按实时几何量定位，滚动/改窗口尺寸后即失效：先藏起来，下一轮重画
 */
function hideSurfaces(): void {
  hideAllDividers();
}

function removeSurfaces(): void {
  for (const scope in loDividerEls) {
    const node = loDividerEls[scope];
    if (node && node.parentNode) node.parentNode.removeChild(node);
    delete loDividerEls[scope];
  }
}
