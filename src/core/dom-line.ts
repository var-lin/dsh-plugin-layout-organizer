const loDividerEls: Record<string, HTMLElement> = {};

// 上一轮真正落到分割线上的几何量（left、top、width、height 拼成一条串）。
//
// 投影跑得很勤：宿主任意一处 childList 变动都会排一帧。分割线是 body 级 fixed 元素，若每帧都
// 重写 left/top/width/height，整篇文档每帧都要重新失效一次布局——宿主那些靠实时测量定位的
// 悬浮提示（对话页顶部标签条上就挂着一圈 Tooltip，portal 到 body）会跟着一起抖，鼠标停在
// 按钮上时提示文字就闪（用户 m08119）。几何量没变就一个字节都不写，同 `setMark` 的道理。
const loDividerGeom: Record<string, string> = {};

/**
 * 只在值真的变了才写 `display`（分割线是每帧都可能被重画的元素，见 `loDividerGeom`）。
 *
 * @param node 分割线元素。
 * @param value 期望的 `display` 值。
 */
function setDisplay(node: HTMLElement, value: string): void {
  if (node.style.display !== value) node.style.display = value;
}

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
 * 取元素的算后样式。
 *
 * 取不到（宿主环境缺少 `getComputedStyle`，例如部分老环境与测试桩）时返回 null，
 * 由调用方按「看不见的状态未知、按可见处理」，免得为了量一次尺寸把整轮投影打断。
 *
 * @param el 待测量的元素。
 * @returns 算后样式；环境不支持时为 null。
 */
function styleOf(el: HTMLElement): CSSStyleDeclaration | null {
  if (typeof window.getComputedStyle !== "function") return null;
  return window.getComputedStyle(el);
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
    const style = styleOf(node);
    if (style && (style.display === "none" || style.visibility === "hidden")) return true;
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
    const style = styleOf(node);
    if (!style || (style.display !== "none" && style.visibility !== "hidden")) {
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
  const z = String(DIVIDER_SCOPES_ON_DIALOG.indexOf(scope) >= 0 ? Z_DIVIDER_DIALOG : Z_DIVIDER);
  if (node.style.zIndex !== z) node.style.zIndex = z;
  const nearRect = near.getBoundingClientRect();
  if (nearRect.width <= 0 || nearRect.height <= 0 || hiddenAway(near)) {
    setDisplay(node, "none");
    return;
  }
  // 官方行整体不可见才当它不存在；量不到矩形时退回贴着第三方行外侧
  const farRect = far ? far.getBoundingClientRect() : null;
  if (far && hiddenAway(far)) {
    setDisplay(node, "none");
    return;
  }
  const usableFar = farRect && farRect.width > 0 && farRect.height > 0 ? farRect : null;
  const found = containerBox(near);
  // 右侧边栏「开始」页的行是 380px 的卡片、居中排布，容器却铺满整条边栏：
  // 用容器宽度画线会比卡片长出一大截，所以那里只量两侧行本身的并集。
  const union = unionBox(nearRect, usableFar || nearRect);
  const container: Box = scope === "right" ? union : found || union;
  if (axis === "x") {
    const edge = usableFar ? (usableFar.right + nearRect.left) / 2 : nearRect.left - 1;
    placeBox(node, scope, Math.round(edge) + "px", Math.round(container.top) + "px", "1px", Math.round(container.height) + "px");
  } else {
    const edge = usableFar ? (usableFar.bottom + nearRect.top) / 2 : nearRect.top - 1;
    placeBox(node, scope, Math.round(container.left) + "px", Math.round(edge) + "px", Math.round(container.width) + "px", "1px");
  }
  setDisplay(node, "block");
}

/**
 * 按几何量摆放分割线，四条内联样式只在真的变了才写。
 *
 * 分割线每帧都可能被重画（投影跑得勤），而它是 body 级 fixed 元素：每帧改一次 left/top/width/height
 * 就是每帧让整篇文档重新失效一次布局，宿主那些靠实时测量定位的悬浮提示会跟着抖（见 `loDividerGeom`）。
 *
 * @param node 分割线元素。
 * @param scope scope 键（几何量按 scope 各存一份）。
 * @param left 期望的 `left`。
 * @param top 期望的 `top`。
 * @param width 期望的 `width`。
 * @param height 期望的 `height`。
 */
function placeBox(node: HTMLElement, scope: string, left: string, top: string, width: string, height: string): void {
  const geom = left + "|" + top + "|" + width + "|" + height;
  if (loDividerGeom[scope] === geom) return;
  loDividerGeom[scope] = geom;
  node.style.left = left;
  node.style.top = top;
  node.style.width = width;
  node.style.height = height;
}

function hideDivider(scope: string): void {
  const node = loDividerEls[scope];
  if (node && node.isConnected) setDisplay(node, "none");
}

/**
 * 隐藏所有分割线。
 *
 * 分割线按实时几何量定位，滚动/改窗口尺寸后即失效：先藏起来，下一轮重画
 */
function hideSurfaces(): void {
  for (const scope in loDividerEls) hideDivider(scope);
}

function removeSurfaces(): void {
  for (const scope in loDividerEls) {
    const node = loDividerEls[scope];
    if (node && node.parentNode) node.parentNode.removeChild(node);
    delete loDividerEls[scope];
    // 元素没了，几何量的记忆也得跟着作废：下一轮重建出来的是新元素，若还按旧串跳过写入，
    // 它会停在 left/top 的默认位置（见 `loDividerGeom`）。
    delete loDividerGeom[scope];
  }
}
