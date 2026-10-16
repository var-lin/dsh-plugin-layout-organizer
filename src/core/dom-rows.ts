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

function outletChildren(slotKey: string): HTMLElement[] | null {
  const outlet = outletOf(slotKey);
  if (!outlet) return null;
  return elementChildren(outlet);
}

/**
 * 行按钮是侧边栏出口的祖先：closest 从每个出口往上走到 nav.panelList 里真正的 flex 子项。
 *
 * @returns 收上来的行按钮；一个都没找到时返回 null。
 */
function collectSidebarRows(): HTMLElement[] | null {
  const rows: HTMLElement[] = [];
  const outlets = document.querySelectorAll('[data-slot="sidebar.panellist"]');
  for (let i = 0; i < outlets.length; i++) {
    const row = (outlets[i] as HTMLElement).closest("button");
    if (row && rows.indexOf(row as HTMLElement) < 0) rows.push(row as HTMLElement);
  }
  // 面板列表上方那一条（workspace / 新建会话 / 搜索）不属于 panellist slot；能认出列表容器时从容器里收上来。
  const list = document.querySelector("nav[class*='panelList'], [class*='panelList']") as HTMLElement | null;
  if (list) {
    const buttons = list.querySelectorAll(":scope > button, :scope > a");
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i] as HTMLElement;
      if (rows.indexOf(btn) < 0) rows.push(btn);
    }
  }
  return rows.length > 0 ? rows : null;
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

function collectFooterRows(): HTMLElement[] | null {
  return outletChildren("sidebar.footer.action");
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

// slot 记录 id 为 null（投影与台账配对），合成的带 id——用量百分比属于 slot 未注册的兄弟节点。
interface RowUnit {
  el: HTMLElement;
  id: string | null;
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
  const units = collectComposerUnits();
  if (!units) return null;
  const rows: HTMLElement[] = [];
  for (let i = 0; i < units.length; i++) rows.push(units[i].el);
  return rows;
}

function collectRowUnits(scope: string): RowUnit[] | null {
  if (scope === "composer") return collectComposerUnits();
  const rows = collectRows(scope);
  if (!rows) return null;
  const units: RowUnit[] = [];
  for (let i = 0; i < rows.length; i++) units.push({ el: rows[i], id: null });
  return units;
}

function collectRows(scope: string): HTMLElement[] | null {
  if (scope === "sidebar") return collectSidebarRows();
  if (scope === "footer") return collectFooterRows() || collectOutletRows("footer");
  if (scope === "tabs") return collectTabRows();
  if (scope === "composer") return collectComposerRows();
  if (scope === "settings") return collectSettingsRows();
  return null;
}

// 侧边栏和底栏用 entriesOfSlot（它们的渲染器用的就是它），其余 scope 读原始 entries 数组。
// 文案缺失（hasLabel 为假）可放心退回位置配对；文案存在却对不上才说明身份存疑（见 pairRows）。
interface LedgerEntry {
  id: string;
  label: string;
  hasLabel: boolean;
  order: number;
}

function readEntries(ctx: CtxLike, scope: string): LedgerEntry[] {
  const slot = SLOT_OF_SCOPE[scope];
  const out: LedgerEntry[] = [];
  let entries: SlotEntry[] | null = null;
  try {
    entries = scope === "sidebar" || scope === "footer" ? ctx.slots.entriesOfSlot(slot) : ctx.slots.entries(slot);
  } catch (err) {
    return out;
  }
  if (!entries) return out;
  for (let i = 0; i < entries.length; i++) {
    const options = entries[i].options || {};
    const id = options.id;
    if (id === undefined || id === null || id === "") continue;
    // HIDDEN_LEDGER_IDS 里的记录从台账这一层就剔除，不进列表也不参与配对。
    if (HIDDEN_LEDGER_IDS.indexOf(String(id)) >= 0) continue;
    let label: unknown = options.label;
    if (typeof label === "function") {
      try {
        label = (label as () => unknown)();
      } catch (err2) {
        label = undefined;
      }
    }
    const hasLabel = typeof label === "string" && label.length > 0;
    out.push({ id: String(id), label: hasLabel ? (label as string) : String(id), hasLabel: hasLabel, order: options.order || 0 });
  }
  // 标签带和输入框按钮带不按 order 排，由官方渲染器排布。
  if (scope !== "tabs" && scope !== "composer") {
    out.sort(function (a, b) {
      return a.order - b.order;
    });
  }
  return out;
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
 * 把台账记录与屏幕上的行配对。
 *
 * 四步退让：①声明过认领钩子的记录按钩子认领（正证据）；②上次投影的标记；③文案精确匹配；
 * ④没文案的记录按剩余顺序位置配对——只在屏幕上不缺行（行数不少于记录数）时才敢这么猜。
 *
 * ④ 的例外是身份错配的根源：记录数多于屏幕元素数，说明有记录整条渲染成空，此时按位置猜会把
 * 后面那条记录的名字扣到别人的元素上（见 `ROW_HOOKS`）。
 *
 * @param entries 该 scope 的台账记录。
 * @param rows 屏幕上收集到的行元素。
 * @param stamped 上次投影留下的 id → 元素映射，用于第 1 步直接认领；省略时跳过这一步。
 * @param scope scope 键，用于查 `ROW_HOOKS` 里声明的认领钩子；省略时不走钩子那一步。
 * @returns 与 entries 一一对应的配对结果，认领不到的行 el 保持为 null。
 */
function pairRows(entries: LedgerEntry[], rows: HTMLElement[], stamped?: Record<string, HTMLElement>, scope?: string): Pair[] {
  const pairs: Pair[] = [];
  const used: boolean[] = [];
  for (let i = 0; i < entries.length; i++) pairs.push({ id: entries[i].id, label: entries[i].label, el: null as unknown as HTMLElement, extra: [] });

  // 第 0 步：钩子是正证据，优先级最高——它还能纠正上一次投影留下的错误标记。
  if (scope) {
    for (let i = 0; i < entries.length; i++) {
      const hook = rowHookOf(scope, entries[i].id);
      if (!hook || !hook.selector) continue;
      for (let j = 0; j < rows.length; j++) {
        if (used[j]) continue;
        if (!rows[j].matches || !rows[j].matches(hook.selector)) continue;
        pairs[i].el = rows[j];
        used[j] = true;
        break;
      }
    }
  }

  // 第 1 步：按元素身上现存的 data-lo-id 直接认领。
  if (stamped) {
    for (let i = 0; i < entries.length; i++) {
      const el = stamped[entries[i].id];
      if (!el) continue;
      const at = rows.indexOf(el);
      if (at < 0 || used[at]) continue;
      pairs[i].el = el;
      used[at] = true;
    }
  }

  // 第 2 步：文案精确匹配（仅限真正提供了文案的记录）。
  for (let i = 0; i < entries.length; i++) {
    if (!entries[i].hasLabel) continue;
    for (let j = 0; j < rows.length; j++) {
      if (used[j]) continue;
      if (rowText(rows[j]) === entries[i].label) {
        pairs[i].el = rows[j];
        used[j] = true;
        break;
      }
    }
  }

  // 第 3 步：没文案的记录按顺序认领剩下的行，但只在「剩下的记录数 == 剩下的行数」时才敢猜：
  // 两边数量不等，说明有记录整条渲染成空（或有行不属于任何记录），按位置猜必然把名字扣错人。
  const freeEntries: number[] = [];
  const freeRows: number[] = [];
  for (let i = 0; i < entries.length; i++) if (!pairs[i].el) freeEntries.push(i);
  for (let j = 0; j < rows.length; j++) if (!used[j]) freeRows.push(j);
  if (freeEntries.length !== freeRows.length) return pairs;
  let at = 0;
  for (let i = 0; i < entries.length; i++) {
    if (pairs[i].el) continue;
    pairs[i].el = rows[freeRows[at++]];
  }
  return pairs;
}

// 一条被投影真正标记到的行：id 与给人看的名字，设置页与收纳包据此只列屏幕上存在的行。
interface LiveRow {
  id: string;
  label: string;
}

/* 每个 scope 上一轮投影标记到的行。
   - 从未投影过 → undefined，`liveRows` 报 null，调用方回退到台账（插件刚加载、页面还没挂载）；
   - 投影过但此刻整个不在屏幕上 → null，调用方同样回退到台账；
   - 投影过且在屏幕上 → 数组，调用方以它为准。 */
const __liveRows: Record<string, LiveRow[] | null> = {};

/**
 * 记下某 scope 本轮投影标记到的行。
 *
 * @param scope scope 键。
 * @param rows 本轮标记到的行；该 scope 此刻不在屏幕上时传 null。
 */
function setLiveRows(scope: string, rows: LiveRow[] | null): void {
  __liveRows[scope] = rows;
}

/**
 * 读某 scope 上一轮投影标记到的行。
 *
 * @param scope scope 键。
 * @returns 标记到的行；该 scope 从未投影过或整个不在屏幕上时返回 null（调用方据此回退到台账）。
 */
function liveRows(scope: string): LiveRow[] | null {
  const rows = __liveRows[scope];
  return rows === undefined ? null : rows;
}

/**
 * 读某 scope 上一轮投影标记到的行 id。
 *
 * @param scope scope 键。
 * @returns id 列表；该 scope 不在屏幕上时返回 null。
 */
function liveRowIds(scope: string): string[] | null {
  const rows = liveRows(scope);
  if (!rows) return null;
  const out: string[] = [];
  for (let i = 0; i < rows.length; i++) out.push(rows[i].id);
  return out;
}

/**
 * 取某条屏幕上真实存在的行的显示名。
 *
 * @param scope scope 键。
 * @param id 行 id。
 * @returns 该行本轮投影时记下的名字；没有记录时返回空字符串。
 */
function liveRowLabel(scope: string, id: string): string {
  const rows = liveRows(scope);
  if (!rows) return "";
  for (let i = 0; i < rows.length; i++) if (rows[i].id === id) return rows[i].label;
  return "";
}

/**
 * 台账没给文案时，用声明过的钩子文案兜底。
 *
 * @param scope scope 键。
 * @param id 行 id。
 * @returns 钩子里声明的显示名；没声明时返回空字符串。
 */
function hookLabel(scope: string, id: string): string {
  const hook = rowHookOf(scope, id);
  return hook && hook.label ? hook.label : "";
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
  if (best <= 0) best = 48;
  return Math.round(best) + 8;
}

function clampLauncherY(y: number, height: number): number {
  const min = topInset();
  let max = window.innerHeight - height - 8;
  if (max < min) max = min;
  if (typeof y !== "number" || !isFinite(y)) y = min + 24;
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
  let max = window.innerWidth - width - 8;
  if (max < 8) max = 8;
  if (typeof x !== "number" || !isFinite(x)) x = 8;
  return Math.max(8, Math.min(max, x));
}