// 右侧边栏「开始」页的卡片：整条都不进台账，id 只能从 DOM 上认。
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
/**
 * 当前可见的右侧栏「开始」页容器。
 *
 * 0.2.2 起右侧栏会同时挂多个会话的视图，没在显示的那几份带 `hidden` 属性留在 DOM 里。
 * 直接 `querySelector` 可能先拿到隐藏的那份，投影就会把别的会话的卡片当成当前的；
 * 先跳过 `hidden` / `aria-hidden="true"` 的容器（用户 m01654 的 0.2.2 兼容）。
 *
 * @returns 可见的 guide 容器；右栏收着、或只有隐藏视图时返回 null。
 */
function rightGuideEl(): HTMLElement | null {
  const nodes = document.querySelectorAll(RIGHT_LIST_SELECTOR);
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i] as HTMLElement;
    if (node.closest("[hidden], [aria-hidden='true']")) continue;
    return node;
  }
  return null;
}

function collectRightUnits(): RowUnit[] | null {
  const list = rightGuideEl();
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
