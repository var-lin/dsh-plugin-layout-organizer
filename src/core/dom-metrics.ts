// 排布轴向的测量兜底，与「见过的行图标」缓存。
/**
 * 轴向以 scope 表声明为准，测量只作兜底。
 *
 * @param el 参与测量的行元素，从它的父级开始逐层向上找。
 * @param scope scope 键，用于按投影标记圈出候选行。
 * @returns 排布轴向："x" 或 "y"；找不到足够的有尺寸行时按 "y" 处理。
 */
function measureAxis(el: HTMLElement, scope: string): string {
  let node: HTMLElement | null = el.parentElement;
  let depth = 0;
  while (node && depth < 4) {
    const kids = node.querySelectorAll("[" + MARKS.scope + '="' + scope + '"][' + MARKS.id + "]");
    let minLeft = Infinity;
    let maxLeft = -Infinity;
    let minTop = Infinity;
    let maxTop = -Infinity;
    let seen = 0;
    for (let i = 0; i < kids.length; i++) {
      const rect = kids[i].getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      seen++;
      if (rect.left < minLeft) minLeft = rect.left;
      if (rect.left > maxLeft) maxLeft = rect.left;
      if (rect.top < minTop) minTop = rect.top;
      if (rect.top > maxTop) maxTop = rect.top;
    }
    if (seen >= 2) return maxLeft - minLeft > maxTop - minTop ? "x" : "y";
    node = node.parentElement;
    depth++;
  }
  return "y";
}

function containerAxis(el: HTMLElement, scope: string): string {
  const declared = AXIS_OF_SCOPE[scope];
  if (declared === "x" || declared === "y") return declared;
  return measureAxis(el, scope);
}

/**
 * 见过的行图标：`scope:id -> <svg> 源码`。
 *
 * 行不在屏幕上时（被收进「更多」的行在主列表里让位、设置页的行只有弹窗打开时才挂载），
 * DOM 里根本找不到原按钮，`liveRowIcon` 会返回空——同一行于是时而图标、时而字母块。
 * 见过的就记下来，离屏时用记下的那份，图标这一列才不会随开合跳来跳去。
 */
const loRowIcons: Record<string, string> = {};

/**
 * 取某条屏幕上的行原按钮里的图标（内联 SVG 源码）。
 *
 * 「更多」里的行要比照原按钮的样子：原按钮有图标就照搬。行已经离屏时用之前记下的那份
 * （见 `loRowIcons`）；从没见过才回空，交给调用方画名字首字。
 *
 * @param scope scope 键。
 * @param id 行 id。
 * @returns 归一化后的 `<svg>` 源码；没见过、或原按钮本来就没有图标时返回空字符串。
 */
function liveRowIcon(scope: string, id: string): string {
  const key = rowKey(scope, id);
  // 投影记下的元素优先（见 `liveElement`）：这是一次哈希查找，不再扫全部带标记的节点。
  const node = liveElement(scope, id);
  if (node) {
    const svg = node.querySelector("svg");
    const html = svg ? svg.outerHTML : "";
    // 空字符串也记：说明原按钮确实没有图标，下次离屏时不必再去猜。
    if (html) loRowIcons[key] = html;
    return html || loRowIcons[key] || "";
  }
  return loRowIcons[key] || "";
}

/**
 * 行首那一格该画什么：照搬原按钮自己的图标。
 *
 * 原按钮没画图标（停靠行、标签页那几颗只有文字的）就回空串，交给调用方画名字首字——不画
 * 色点、不去别处找图标：拿不准的图标比一个字母更容易认错行。
 *
 * @param scope scope 键。
 * @param id 行 id。
 * @returns 内联 `<svg>` 源码；原按钮没有图标时返回空字符串。
 */
function rowIconOf(scope: string, id: string): string {
  return scope ? liveRowIcon(scope, id) : "";
}

/**
 * 投影时顺手把这一行的图标记下来。
 *
 * 等「更多」菜单要画这一行时，原按钮可能已经离屏（收进去的行在主列表里让位），那时
 * `liveRowIcon` 只能吃缓存。投影每轮都看得见每一行，在这里记最省事也最及时。
 *
 * @param scope scope 键。
 * @param id 行 id。
 * @param el 这一行（可能是一组元素里的第一个）。
 */
function rememberRowIcon(scope: string, id: string, el: HTMLElement | null): void {
  if (!el || !id) return;
  const svg = el.querySelector("svg");
  if (!svg) return;
  const key = rowKey(scope, id);
  // 只升级、不降级：有的行会把图标换成文字，别把记下的那份冲掉。
  if (!loRowIcons[key]) loRowIcons[key] = svg.outerHTML;
}

/**
 * 从投影的 style.order 读回屏幕上的顺序。
 *
 * @param scope scope 键。
 * @param state 传入时只取「此刻看得见」的行：跳过已收起 / 已进「更多」与还没被投影写过
 *   style.order 的行（收起前的落位要用这一版，见 `visibleOrder`）。
 * @returns 去重后的 id 列表，按 order 升序排列。
 */
function liveOrder(scope: string, state?: PluginState): string[] {
  const nodes = document.querySelectorAll("[" + MARKS.scope + '="' + scope + '"][' + MARKS.id + "]");
  const rows: { id: string; order: number; at: number }[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i] as HTMLElement;
    const id = node.getAttribute(MARKS.id);
    if (!id) continue;
    if (state) {
      if (isHidden(state, scope, id) || isIntoMoreRow(state, scope, id)) continue;
      const order = parseInt(node.style.order, 10);
      if (isNaN(order)) continue;
      rows.push({ id: id, order: order, at: i });
    } else {
      rows.push({ id: id, order: parseInt(node.style.order, 10) || 0, at: i });
    }
  }
  rows.sort(function (a, b) {
    return a.order - b.order || a.at - b.at;
  });
  const out: string[] = [];
  for (let i = 0; i < rows.length; i++) if (out.indexOf(rows[i].id) < 0) out.push(rows[i].id);
  return out;
}

/**
 * 屏幕上的可见顺序（不含已收起 / 已进「更多」的行）。
 *
 * 收起一行之前要把它此刻的位置写进存档：收起后它就没有屏幕序号了，而拖别人 /「官方在前」
 * 只会写这一轮看得见的行，位置没进存档的行恢复时就会被当成新行追到末尾（用户 m00001）。
 *
 * @param state 当前状态，用来判断哪些行已经让位。
 * @param scope scope 键。
 * @returns 按屏幕顺序排列的 id；这一处不在屏幕上时为空数组。
 */
function visibleOrder(state: PluginState, scope: string): string[] {
  return liveOrder(scope, state);
}

/**
 * 把一行按它此刻在 DOM 里的位置插进保存顺序。
 *
 * 只给「从收起 / 更多里恢复、但存档里没有位置」的行用：老版本曾在收起时把位置写丢，
 * 恢复时若当新行追尾就会又跑到最后（用户 m00001）。这里的锚点是它在宿主 DOM 里的前后邻居，
 * 不改变「全新行一律排在末尾」的语义。
 *
 * @param state 当前状态，原地改写 `order`。
 * @param scope scope 键。
 * @param id 要落位的行。
 */
function anchorUnsavedRow(state: PluginState, scope: string, id: string): void {
  const order = state.order[scope] || [];
  if (order.indexOf(id) >= 0) return;
  const nodes = document.querySelectorAll("[" + MARKS.scope + '="' + scope + '"][' + MARKS.id + "]");
  let at = -1;
  let i: number;
  for (i = 0; i < nodes.length; i++) {
    if ((nodes[i] as HTMLElement).getAttribute(MARKS.id) === id) {
      at = i;
      break;
    }
  }
  let to = -1;
  if (at >= 0) {
    for (i = at - 1; i >= 0 && to < 0; i--) {
      const found = order.indexOf((nodes[i] as HTMLElement).getAttribute(MARKS.id) || "");
      if (found >= 0) to = found + 1;
    }
    for (i = at + 1; i < nodes.length && to < 0; i++) {
      const found = order.indexOf((nodes[i] as HTMLElement).getAttribute(MARKS.id) || "");
      if (found >= 0) to = found;
    }
  }
  const next = order.slice();
  next.splice(to < 0 ? next.length : to, 0, id);
  writeOrder(state, scope, next);
}
