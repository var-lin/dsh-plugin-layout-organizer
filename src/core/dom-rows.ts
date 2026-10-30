function elementChildren(el: Element): HTMLElement[] {
  const out: HTMLElement[] = [];
  for (let i = 0; i < el.children.length; i++) out.push(el.children[i] as HTMLElement);
  return out;
}

function outletOf(slotKey: string): HTMLElement | null {
  return document.querySelector('[data-slot="' + slotKey + '"]') as HTMLElement | null;
}

/**
 * 出口选择器以 scope 表声明的为准。
 *
 * @param scope scope 键。
 * @returns 该 scope 的出口选择器；scope 表没声明时返回 null。
 */
function outletSelector(scope: string): string | null {
  const selector = OUTLET_OF_SCOPE[scope];
  if (!selector) return null;
  return selector;
}

/**
 * 这个元素是不是一处「更多」入口（自己就是菜单按钮，或包裹盒里装着菜单按钮）。
 *
 * 三处菜单的 DOM 结构各不相同（侧边栏包一层 moreAnchor、对话页是标签条的兄弟层、
 * 右侧栏是 guide 容器末尾的包裹盒），但共同点都是 `aria-haspopup="menu"`。
 *
 * @param el 候选元素（必须是容器自己的直接子项）。
 * @returns 是菜单入口时为真。
 */
function isMenuTrigger(el: Element): boolean {
  if (el.matches("[aria-haspopup='menu']")) return true;
  return !!el.querySelector("[aria-haspopup='menu']");
}

/**
 * 侧边栏的行单元：面板行来自出口反查，其余从列表容器的直接子元素里认。
 *
 * 面板行按钮是出口的祖先，closest 从每个出口往上走到 nav.panelList 里真正的 flex 子项。
 * 「更多」不是 slot 记录：官方把它的菜单按钮包进一个 `moreAnchor` 包裹层，那层才是列表的 flex 子项，
 * 于是按出口反查、按「直接子按钮」直取都碰不到它——只能认包裹层里那个带 `aria-haspopup` 的按钮，
 * 并给它一个合成 id（见 `SYNTHETIC_IDS`），让它和台账行一样参与排序、隐藏与配对。
 *
 * @returns 收上来的行单元（合成行带 id，slot 行 id 为 null）；一个都没找到时返回 null。
 */
function collectSidebarUnits(): RowUnit[] | null {
  const units: RowUnit[] = [];
  // 面板行：出口在按钮内部，从出口往上走回行按钮。
  const panelRows: HTMLElement[] = [];
  const outlets = document.querySelectorAll('[data-slot="sidebar.panellist"]');
  for (let i = 0; i < outlets.length; i++) {
    const row = (outlets[i] as HTMLElement).closest("button") as HTMLElement | null;
    if (row && panelRows.indexOf(row) < 0) panelRows.push(row);
  }
  const list = document.querySelector("nav[class*='panelList'], [class*='panelList']") as HTMLElement | null;
  if (list) {
    // 按容器里的先后收，行的顺序才和屏幕上一致；合成 id 只发给真正认出来的合成行。
    const synthetic = SYNTHETIC_IDS.sidebar || [];
    const kids = elementChildren(list);
    let next = 0;
    for (let i = 0; i < kids.length; i++) {
      const kid = kids[i];
      // 「更多」的包裹层：里面是带 aria-haspopup 的菜单按钮，这一处槽位才挂可展开菜单。
      // 面板行自己也可能带弹出菜单，能认到 panellist 出口的那一行就不算「更多」。
      const slotOutlet = kid.querySelector('[data-slot="sidebar.panellist"]');
      if (!slotOutlet && (isMenuTrigger(kid) || String(kid.className || "").indexOf("moreAnchor") >= 0)) {
        // 宿主确实画了「更多」——这扇菜单存在，把能力闸门打开（见 moreAvailableFor）。
        noteMoreAvailable("sidebar");
        units.push({ el: kid, id: synthetic[next] !== undefined ? synthetic[next] : "sidebar-" + next });
        next++;
        continue;
      }
      if (kid.tagName === "BUTTON" || kid.tagName === "A") {
        units.push({ el: kid, id: null });
        continue;
      }
      // 官方改版给面板行套壳时，认得出里面的面板行就按包裹层算一行，不至于整条掉出去。
      const inner = kid.querySelector("button") as HTMLElement | null;
      if (inner && panelRows.indexOf(inner) >= 0) units.push({ el: kid, id: null });
    }
    // 出口反查到的面板行不在这个容器里时（宿主把某几行挪出列表），补在列表行之后：
    // 少列一行就等于那一行从插件里消失，宁可多收也不要漏收。
    for (let i = 0; i < panelRows.length; i++) {
      let seen = false;
      for (let j = 0; j < units.length; j++) {
        if (units[j].el === panelRows[i] || units[j].el.contains(panelRows[i])) {
          seen = true;
          break;
        }
      }
      if (!seen) units.push({ el: panelRows[i], id: null });
    }
  }
  // 列表容器没认出来时退回只收出口反查到的面板行（老宿主没有 nav.panelList 也能用）。
  if (units.length === 0) {
    for (let i = 0; i < panelRows.length; i++) units.push({ el: panelRows[i], id: null });
  }
  return units.length > 0 ? units : null;
}

/**
 * 一组 `RowUnit` 里的行元素（丢掉合成 id）。
 *
 * @param units 收上来的行；null 表示这一处没挂载。
 * @returns 行元素；入参是 null 时同样是 null，好让调用方一路透传「没挂载」。
 */
function unitElements(units: RowUnit[] | null): HTMLElement[] | null {
  if (!units) return null;
  const rows: HTMLElement[] = [];
  for (let i = 0; i < units.length; i++) rows.push(units[i].el);
  return rows;
}

/**
 * 侧边栏的行元素（`collectSidebarUnits` 去掉合成 id）。
 *
 * @returns 收上来的行元素；一个都没找到时返回 null。
 */
function collectSidebarRows(): HTMLElement[] | null {
  return unitElements(collectSidebarUnits());
}

function settingsPanel(): HTMLElement | null {
  return document.querySelector('[data-shortcut-modal="settings"]') as HTMLElement | null;
}

/**
 * 收集设置页导航里的行按钮。
 *
 * 列表按结构去找：nav 下面直接子按钮最多的那个 div。
 *
 * @returns 收上来的行按钮；设置面板不存在或一行都没找到时返回 null。
 */
function collectSettingsRows(): HTMLElement[] | null {
  const panel = settingsPanel();
  if (!panel) return null;
  const nav = panel.querySelector("nav");
  if (!nav) return null;
  const divs = nav.querySelectorAll(":scope > div");
  let best: Element | null = null;
  let bestCount = 0;
  for (let i = 0; i < divs.length; i++) {
    const count = divs[i].querySelectorAll(":scope > button").length;
    if (count > bestCount) {
      best = divs[i];
      bestCount = count;
    }
  }
  if (best) return elementChildren(best);
  const buttons = nav.querySelectorAll("button");
  return buttons.length > 0 ? (Array.prototype.slice.call(buttons) as HTMLElement[]) : null;
}

/**
 * 声明了 outlet 选择器的 scope 的通用兜底，也是定制收集器一无所获时的最后手段。
 *
 * @param scope scope 键。
 * @returns 出口的直接子元素，没有子元素时退回出口里像按钮的后代；出口或选择器缺失时返回 null。
 */
function collectOutletRows(scope: string): HTMLElement[] | null {
  const selector = outletSelector(scope);
  if (!selector) return null;
  const list = document.querySelector(selector) as HTMLElement | null;
  if (!list) return null;
  const kids = elementChildren(list);
  if (kids.length > 0) return kids;
  const buttons = list.querySelectorAll('button, [role="tab"], [role="menuitem"]');
  return buttons.length > 0 ? (Array.prototype.slice.call(buttons) as HTMLElement[]) : null;
}

/**
 * 收集对话标签条上的标签按钮。
 *
 * 不查 conversation.view 出口：它渲染的是视图正文。
 *
 * @returns 收上来的标签按钮；一行都没找到时返回 null。
 */
function collectTabRows(): HTMLElement[] | null {
  const list = document.querySelector("[data-conversation-tabs]");
  if (!list) return collectOutletRows("tabs");
  const tabs = list.querySelectorAll(':scope > button[role="tab"]');
  const buttons = tabs.length > 0 ? tabs : list.querySelectorAll(":scope > button");
  if (buttons.length > 0) return Array.prototype.slice.call(buttons) as HTMLElement[];
  // 条带的直接子节点是包裹层时，退回所有像标签的后代，而不是报告这个 scope 是空的。
  const deep = list.querySelectorAll('button[role="tab"], button');
  return deep.length > 0 ? (Array.prototype.slice.call(deep) as HTMLElement[]) : null;
}

/**
 * 对话标签条上那颗「更多」按钮（三个点）。
 *
 * 它不在 `[data-conversation-tabs]` 里：宿主把它画在标签条容器的兄弟位置上（与
 * `role="tablist"` 平级），所以 `collectTabRows` 收不到它。这里从标签条往上找一层容器，
 * 认里面有 `aria-haspopup="menu"` 的那颗按钮，再取它在容器里的直接子元素当行元素。
 *
 * @returns 包裹盒；没渲染或没有「更多」时返回 null。
 */
function tabMoreRow(): HTMLElement | null {
  const list = document.querySelector("[data-conversation-tabs]");
  if (!list) return null;
  const holder = list.parentElement;
  if (!holder) return null;
  // 取容器下的直接子元素：行元素必须是容器自己的孩子，`style.order` 才会生效。
  const kids = elementChildren(holder);
  for (let i = 0; i < kids.length; i++) {
    if (kids[i] !== list && isMenuTrigger(kids[i])) return kids[i];
  }
  return null;
}

/**
 * 收集对话标签条的行：标签按钮在前，「更多」始终收尾。
 *
 * 「更多」不是 slot 记录，给它固定合成 id（见 `SYNTHETIC_IDS.tabs`），它不能收进自己
 * 那扇菜单里，所以同时也不会拿到「进更多」。
 *
 * @returns 收上来的行；标签条不存在时返回 null。
 */
function collectTabUnits(): RowUnit[] | null {
  const rows = collectTabRows();
  const more = tabMoreRow();
  if (!rows && !more) return null;
  const units: RowUnit[] = [];
  for (let i = 0; rows && i < rows.length; i++) units.push({ el: rows[i], id: null });
  if (more) units.push({ el: more, id: MORE_ID, label: t("row.more") });
  return units.length > 0 ? units : null;
}

// slot 记录 id 为 null（投影与台账配对），合成的带 id——用量百分比属于 slot 未注册的兄弟节点。
// 右侧边栏「开始」页的卡片整条都不进台账，id 只能从 DOM 上认（见 `collectRightUnits`）。
interface RowUnit {
  el: HTMLElement;
  id: string | null;
  // 元素上现成的显示名：台账没有这条记录时用它，免得设置页与收纳包只显示 kind。
  label?: string;
}

function collectComposerUnits(): RowUnit[] | null {
  const outlet = outletOf("conversation.composer.dock");
  if (!outlet) return null;
  // 出口是 `display:contents`，它的父级才是真正的 flex 容器，出口本身不贡献盒子。
  const container = outlet.parentElement;
  if (!container) return null;
  const units: RowUnit[] = [];
  const children = elementChildren(container);
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child === outlet) {
      const inner = elementChildren(outlet);
      for (let j = 0; j < inner.length; j++) units.push({ el: inner[j], id: null });
    } else {
      units.push({ el: child, id: null });
    }
  }
  if (units.length === 0) return null;
  // 不是 slot 记录的东西都是合成的，id 在 scope 表里声明，跨渲染保持稳定。
  const synthetic = SYNTHETIC_IDS.composer || [];
  let next = 0;
  const entryEls: HTMLElement[] = [];
  const slotChildren = elementChildren(outlet);
  for (let i = 0; i < slotChildren.length; i++) entryEls.push(slotChildren[i]);
  for (let i = 0; i < units.length; i++) {
    if (entryEls.indexOf(units[i].el) >= 0) continue;
    units[i].id = synthetic[next] !== undefined ? synthetic[next] : "composer-" + next;
    next++;
  }
  return units;
}

function collectComposerRows(): HTMLElement[] | null {
  return unitElements(collectComposerUnits());
}

// 右侧边栏「开始」页的卡片一条都不进 slot 台账：插件用 sidebarRightTabs.register 声明 guide 卡片，
// 宿主直接画出来，没有 entries 可读、也没有可订阅的槽位。结构是 data-sidebar-right-guide 容器下的
// 直接子项——每张卡一层包裹盒（里面才是带 data-sidebar-right-guide-entry 的真按钮），末尾的
// 「更多工具」是另一层包裹盒（里面是 aria-haspopup="menu" 的按钮，只在有槽位注册时才画）。
// 行元素取包裹盒：真按钮要留着自己响应点击，行只负责排序、收起与右键菜单。
const RIGHT_CARD_ATTR = "data-sidebar-right-guide-entry";
const RIGHT_CARD_SELECTOR = "[" + RIGHT_CARD_ATTR + "]";

/**
 * 包裹盒里那张 guide 卡片的 kind。
 *
 * @param wrapper 卡片包裹盒（也可能本身就是按钮）。
 * @returns kind；不是卡片时返回 null。
 */
function rightCardKind(wrapper: HTMLElement): string | null {
  const own = wrapper.getAttribute(RIGHT_CARD_ATTR);
  if (own) return own;
  const button = wrapper.querySelector(RIGHT_CARD_SELECTOR);
  if (!button) return null;
  const kind = button.getAttribute(RIGHT_CARD_ATTR);
  return kind ? kind : null;
}

/**
 * 卡片上的标题文字（宿主把标题单独包在 entryTitle 里，整段 textContent 会带上描述）。
 *
 * @param wrapper 卡片包裹盒。
 * @returns 压过空白的标题；认不到时退回整块文字。
 */
function rightRowLabel(wrapper: HTMLElement): string {
  const title = wrapper.querySelector("[class*='entryTitle']");
  const text = title && title.textContent ? title.textContent : "";
  if (text) return text.replace(/\s+/g, " ").trim();
  return rowText(wrapper);
}

/**
 * 右侧栏卡片的 id：kind 原样，同 kind 的第 n 张（n 从 2 起）加 `-n` 后缀。
 *
 * 投影认 DOM 上的卡片、设置页认宿主注册表，两条路各数一遍卡片；编号规则只留这一处，
 * 两边的 id 才永远对得上（对不上就会出现「设置页排好的顺序，卡片上不生效」）。
 *
 * @param kind 卡片 kind（即 tab kind）。
 * @param nth 这是第几张同 kind 的卡片，从 1 起。
 * @returns 卡片 id。
 */
function rightIdOf(kind: string, nth: number): string {
  return nth <= 1 ? kind : kind + "-" + nth;
}

/**
 * 收集右侧边栏「开始」页的那些卡片。
 *
 * 只收能点开的卡片与「更多工具」：罗盘 hero 是装饰、不是按钮。
 *
 * @returns 行与它们的 id（卡片取 kind，多出来那颗固定叫 more）；整页不在屏上时返回 null。
 */
function collectRightUnits(): RowUnit[] | null {
  const list = document.querySelector(RIGHT_LIST_SELECTOR) as HTMLElement | null;
  if (!list) return null;
  const children = elementChildren(list);
  const units: RowUnit[] = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const kind = rightCardKind(child);
    if (kind) {
      // 同一页上可能出现同 kind 的第二张卡（宿主允许多实例），后面那张加序号，免得 id 撞车。
      let nth = 1;
      while (units.some(function (unit) { return unit.id === rightIdOf(kind, nth); })) nth++;
      units.push({ el: child, id: rightIdOf(kind, nth), label: rightRowLabel(child) });
      continue;
    }
    // 「更多工具」没有 kind，只认菜单按钮。
    if (isMenuTrigger(child)) {
      if (units.some(function (unit) { return unit.id === "more"; })) continue;
      units.push({ el: child, id: MORE_ID, label: t("row.more") });
    }
  }
  return units.length > 0 ? units : null;
}

function collectRightRows(): HTMLElement[] | null {
  return unitElements(collectRightUnits());
}

function collectRowUnits(scope: string): RowUnit[] | null {
  if (scope === "composer") return collectComposerUnits();
  if (scope === "sidebar") return collectSidebarUnits();
  if (scope === "right") return collectRightUnits();
  if (scope === "tabs") return collectTabUnits();
  const rows = collectRows(scope);
  if (!rows) return null;
  const units: RowUnit[] = [];
  for (let i = 0; i < rows.length; i++) units.push({ el: rows[i], id: null });
  return units;
}

/**
 * 本轮屏幕上真实存在的合成行 id（见 `SYNTHETIC_IDS`）。
 *
 * 合成行不是 slot 记录、台账里没有条目，而设置页与收纳包只按台账列行——不在这里补一刀，
 * 输入框停靠行的用量百分比就只能被投影排序、却永远排不进设置页那张卡片。
 * 只认屏幕上真有元素的合成行：宿主没渲染它（会话还没有上下文读数）时不该出现幻影条目。
 *
 * @param scope scope 键。
 * @returns 合成行 id 列表；没有合成行或合成行此刻不在屏幕上时为空数组。
 */
function syntheticIdsOf(scope: string): string[] {
  const units = collectRowUnits(scope);
  const out: string[] = [];
  if (!units) return out;
  for (let i = 0; i < units.length; i++) {
    const id = units[i].id;
    if (id && out.indexOf(id) < 0) out.push(id);
  }
  return out;
}

function collectRows(scope: string): HTMLElement[] | null {
  if (scope === "sidebar") return collectSidebarRows();
  if (scope === "footer") return collectOutletRows("footer");
  if (scope === "tabs") return collectTabRows();
  if (scope === "composer") return collectComposerRows();
  if (scope === "right") return collectRightRows();
  if (scope === "settings") return collectSettingsRows();
  return null;
}

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

function rowText(el: HTMLElement): string {
  const label = el.getAttribute && el.getAttribute("aria-label");
  if (label) return label;
  let node = el.querySelector("[class*='navLabel']");
  if (node && node.textContent) return node.textContent;
  node = el.querySelector("[class*='panelTitle'], [class*='label']");
  if (node && node.textContent) return node.textContent;
  return el.textContent || "";
}

/**
 * 宿主「右侧栏标签类型注册表」里的 guide 条目（`sidebarRightTabs.guide()`）。
 *
 * 与卡片此刻在不在屏幕上无关：右栏收着、或正显示别的页面时，注册表照样答得出有哪些卡片、
 * 各叫什么名字。老宿主的服务表里没有这一项时返回空数组。
 *
 * @param ctx 上下文。
 * @returns 注册表原始条目；读不出来时为空数组。
 */
function rightGuideEntries(ctx: CtxLike): Array<{ kind?: unknown; title?: unknown }> {
  let tabs: unknown = null;
  try {
    tabs = ctx.get("sidebarRightTabs");
  } catch (err) {
    // 老宿主的服务表里没有这一项：往下退到宽松查询
  }
  if (!tabs) {
    try {
      tabs = ctx.get("sidebarRightTabs", false);
    } catch (err) {
      // 宽松查询也没有：当作老宿主处理
    }
  }
  const registry = tabs as { guide?: () => unknown } | null;
  if (!registry || typeof registry.guide !== "function") return [];
  let entries: unknown = null;
  try {
    entries = registry.guide();
  } catch (err) {
    // 注册表读不出来就当没有
    return [];
  }
  const list = entries as Array<{ kind?: unknown; title?: unknown }> | null;
  if (!list || typeof list.length !== "number") return [];
  // 「更多工具」那颗按钮要等「开始」页画出来才在 DOM 里：第一次启动 DSH、右栏还没开过时，
  // 按 DOM 探测（`moreAvailableFor`）判不出右栏这扇菜单，设置页的「进更多」就一直灰着
  // （用户 m00792）。注册表和「开始」页出自宿主同一个包——注册表答得出条目，就说明这个
  // 页面在本宿主上存在，它渲染的 `sidebar.right.tab.guide.actions` 槽位也在，于是不用等
  // 右栏第一次打开，直接记成已认领。
  if (list.length > 0) noteMoreAvailable(MORE_REGION_RIGHT);
  return list;
}

/**
 * 读一条 guide 条目的标题（宿主现调的函数，走当前语言）。
 *
 * @param entry guide 条目。
 * @returns 标题文字；调不出来时为空字符串。
 */
function rightTitleOf(entry: { title?: unknown }): string {
  try {
    const title = typeof entry.title === "function" ? (entry.title as () => unknown)() : entry.title;
    return typeof title === "string" ? title : "";
  } catch (err) {
    // 标题走语言服务，调不出来就退回投影记下的名字
    return "";
  }
}

/**
 * 宿主注册的右侧栏卡片：id 取 tab kind（同 kind 依次加 `-2` 序号），名字取注册标题。
 *
 * 右侧边栏是六处里唯一没有台账的一处。卡片此刻不在屏幕上（右栏收着、或正显示别的页面）时
 * 投影什么也认不到，可注册表仍然知道有哪些卡片；只认投影就会让设置页那张卡片空着，用户得
 * 先把右栏翻回「开始」页才能安排顺序（用户 m00519）。名字也一并取自注册表，与悬浮框里
 * 的样子保持一致（用户 m00432）。
 *
 * @param ctx 上下文。
 * @returns 卡片 id 与名字；老宿主没有注册表时为空数组。
 */
function rightCardList(ctx: CtxLike): Array<{ id: string; label: string }> {
  const list = rightGuideEntries(ctx);
  const out: Array<{ id: string; label: string }> = [];
  const seen: Record<string, number> = {};
  let i: number;
  for (i = 0; i < list.length; i++) {
    const entry = list[i];
    const kind = entry && typeof entry.kind === "string" ? entry.kind : "";
    if (!kind) continue;
    // 同一 kind 在注册表里只有一条，但页面上可能出现第二张卡（id 带 -2）：这里按条数编号，
    // 与 collectRightUnits 走同一个 `rightIdOf`。
    const count = (seen[kind] || 0) + 1;
    seen[kind] = count;
    out.push({ id: rightIdOf(kind, count), label: rightTitleOf(entry) });
  }
  return out;
}

/**
 * 从宿主的「右侧栏标签类型注册表」取某张卡的名字。
 *
 * 卡片的标题由宿主注册的 guide 条目给出（`title()` 走当前语言），与卡片此刻在不在屏幕上无关。
 * 右栏收着、或正显示别的页面时投影认不到卡片，只按投影取名就会退回 id——同一个按钮在悬浮框里
 * 时而叫「上下文」、时而叫 `dsh-context`（用户 m00432）；直接问注册表才叫得一致。
 *
 * @param ctx 上下文。
 * @param id 卡片 id（即 tab kind；同 kind 的第二张卡带 `-2` 后缀，名字相同）。
 * @returns 注册表里的名字；老宿主没有这张表时返回空字符串。
 */
function rightTabLabel(ctx: CtxLike, id: string): string {
  const cards = rightCardList(ctx);
  let i: number;
  for (i = 0; i < cards.length; i++) if (cards[i].id === id) return cards[i].label;
  // 同 kind 的第二张卡在注册表里只有一条，id 却带 -2：按 kind 兜底取同一个标题。
  const kind = id.replace(/-\d+$/, "");
  for (i = 0; i < cards.length; i++) if (cards[i].id === kind) return cards[i].label;
  return "";
}

/**
 * 一行的显示名：插件指定的名字 → 右侧栏卡片的注册名 → 台账文案 → 投影记下的名字（钩子文案或界面文字）→ id。
 *
 * 悬浮框、「更多」菜单与设置页投影都从这里取名。两处各写各的取法，同一个按钮就会换个地方换个人名
 * ——宿主 DOM 上写的是英文，台账里写的是中文（用户 m09308：同一个 Agent 预设，
 * 一处叫「Agent 预设」，另一处叫宿主的英文名）。
 *
 * @param scope 槽位 key。
 * @param id 行 id。
 * @param fallback 台账里的非空文案；没有时传 null 或省略。
 * @param ctx 上下文，用来查右侧栏注册名；省略时不查（设置页投影走这条）。
 * @returns 该行的显示名。
 */
function rowDisplayLabel(scope: string, id: string, fallback?: string | null, ctx?: CtxLike | null): string {
  const own = rowLabelOf(scope, id);
  if (own) return own;
  if (ctx && scope === "right") {
    const registered = rightTabLabel(ctx, id);
    if (registered) return registered;
  }
  if (fallback) return fallback;
  const live = liveRowLabel(scope, id);
  if (live) return live;
  const hooked = hookLabel(scope, id);
  if (hooked) return hooked;
  return id;
}

/**
 * 读这一行的台账文案，再按 `rowDisplayLabel` 的统一规则取名（悬浮框与「更多」菜单共用）。
 *
 * @param ctx 上下文，用来读台账与右侧栏注册名。
 * @param scope 槽位 key。
 * @param id 行 id。
 * @returns 该行的显示名。
 */
function rowLabelText(ctx: CtxLike, scope: string, id: string): string {
  const entries = readEntries(ctx, scope);
  let entry: LedgerEntry | null = null;
  for (let i = 0; i < entries.length; i++) if (entries[i].id === id) entry = entries[i];
  return rowDisplayLabel(scope, id, entry && entry.hasLabel ? entry.label : null, ctx);
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
  const key = scope + ":" + id;
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
  const key = scope + ":" + id;
  // 只升级、不降级：有的行会把图标换成文字，别把记下的那份冲掉。
  if (!loRowIcons[key]) loRowIcons[key] = svg.outerHTML;
}

/**
 * 从投影的 style.order 读回屏幕上的顺序。
 *
 * @param scope scope 键。
 * @returns 去重后的 id 列表，按 order 升序排列。
 */
function liveOrder(scope: string): string[] {
  const nodes = document.querySelectorAll("[" + MARKS.scope + '="' + scope + '"][' + MARKS.id + "]");
  const rows: { id: string; order: number; at: number }[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i] as HTMLElement;
    const id = node.getAttribute(MARKS.id);
    if (!id) continue;
    rows.push({ id: id, order: parseInt(node.style.order, 10) || 0, at: i });
  }
  rows.sort(function (a, b) {
    return a.order - b.order || a.at - b.at;
  });
  const out: string[] = [];
  for (let i = 0; i < rows.length; i++) if (out.indexOf(rows[i].id) < 0) out.push(rows[i].id);
  return out;
}
