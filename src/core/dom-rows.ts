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
