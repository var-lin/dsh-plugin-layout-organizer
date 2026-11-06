// 取名：界面文字、注册方包名、右侧栏注册表标题，统一由 firstLabel 串起来。
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
 * 一行此刻显示在界面上的名字。
 *
 * 台账没有文案时（插件注册只给了 id），设置页与收纳包原本只能显示 id；可宿主自己明明在按钮上
 * 画了名字（remote 的底栏图标写着 Remote，用户 m00004）。先读行本身，再退到后代元素上的
 * `aria-label` / `title`；只收短文本，免得把整段说明当成名字。
 *
 * @param el 行元素。
 * @returns 界面上的显示名；读不到时为空字符串。
 */
function rowDomLabel(el: HTMLElement): string {
  const text = rowText(el);
  const one = text ? text.replace(/\s+/g, " ").trim() : "";
  if (one && one.length <= 48) return one;
  const nodes = el.querySelectorAll("[aria-label], [title]");
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i] as HTMLElement;
    const attr = node.getAttribute("aria-label") || node.getAttribute("title") || "";
    const label = attr.replace(/\s+/g, " ").trim();
    if (label && label.length <= 48) return label;
  }
  return "";
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
function rightGuideEntries(ctx: CtxLike): Array<{ kind?: unknown; title?: unknown; providerId?: unknown }> {
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
  const list = entries as Array<{ kind?: unknown; title?: unknown; providerId?: unknown }> | null;
  if (!list || typeof list.length !== "number") return [];
  // 官方 / 第三方不该只认发布时那张名单：注册表条目带着注册方包名，顺手记下来，
  // `kindOf` 就能把 DSH 以后新增的官方卡动态判成官方（用户 m00004）。
  for (let i = 0; i < list.length; i++) {
    const entry = list[i];
    const kind = entry && typeof entry.kind === "string" ? entry.kind : "";
    const providerId = entry && typeof entry.providerId === "string" ? entry.providerId : "";
    if (kind && providerId) noteRightKindOfficial(kind, providerId);
  }
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
// 注册表一轮读一次就够了：投影、设置页、收纳包、清理各调一次 `rightCardList`，
  // 每次都要两趟 `ctx.get` + `guide()` + 逐条遍历；卡片多的时候这是每轮投影 N+1 次穿透
  // （`rightTabLabel` 还会按行再调一遍）。缓存由调度中枢每轮开头清一次（`resetRightCards`）。
  let rightCardsCache: Array<{ id: string; label: string }> | null = null;

  /**
   * 作废右栏卡片的缓存：每轮投影开头调一次，插件新注册的卡片当轮就能列出来。
   */
  function resetRightCards(): void {
    rightCardsCache = null;
  }

  function rightCardList(ctx: CtxLike): Array<{ id: string; label: string }> {
    if (rightCardsCache) return rightCardsCache;
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
  rightCardsCache = out;
  return out;
}

/**
 * 按顺序取第一个能用的名字：去空白、非空、且不是 id 本身。
 *
 * 三处取名（`rowDisplayLabel` 的优先级链、`rowFallbackLabel` 的界面名 → 包名、
 * `rightTabLabel` 的注册表标题）本来各写一遍「取到就用、取不到往下退、退到 id 就算了」，
 * 判定细节（trim、长度上限、是否等于 id）迟早会走偏，统一从这里过。
 *
 * @param id 行 id，取回来的名字与它相同就当没取到。
 * @param picks 候选来源，按优先级排列；抛错的来源当作没取到。
 * @returns 第一个能用的名字；都没有时为空字符串。
 */
function firstLabel(id: string, picks: Array<() => string | null | undefined>): string {
  let i: number;
  for (i = 0; i < picks.length; i++) {
    let value = "";
    try {
      value = picks[i]() || "";
    } catch (err) {
      value = "";
    }
    value = String(value).replace(/\s+/g, " ").trim();
    if (value && value !== id) return value;
  }
  return "";
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
  const kind = rightBaseKind(id);
  return firstLabel(id, [
    function () {
      let i: number;
      for (i = 0; i < cards.length; i++) if (cards[i].id === id) return cards[i].label;
      return "";
    },
    // 同 kind 的第二张卡在注册表里只有一条，id 却带 -2：按 kind 兜底取同一个标题。
    function () {
      let i: number;
      for (i = 0; i < cards.length; i++) if (cards[i].id === kind) return cards[i].label;
      return "";
    },
  ]);
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
  const found = firstLabel(id, [
    function () {
      return rowLabelOf(scope, id);
    },
    function () {
      return ctx && scope === "right" ? rightTabLabel(ctx, id) : "";
    },
    function () {
      return fallback || "";
    },
    function () {
      return liveRowLabel(scope, id);
    },
    function () {
      return hookLabel(scope, id);
    },
  ]);
  return found || id;
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
