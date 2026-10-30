// 构建时替换成 layout.svg 内联图标；@16 表示设置行 navIcon 的 16 见方。
const ICON_SVG = "@@svg:layout.svg@16@@";

function applySelfIcon(el: HTMLElement): void {
  const holder = el.querySelector("[class*='navIcon']") as HTMLElement | null;
  if (!holder) return;
  // 属性还在不代表图标还在：宿主重渲染 navIcon 的 innerHTML 后属性会留下、图标却被换回去，
  // 只认属性就会让设置行再也补不上图标。svg 还在才算已经贴过。
  if (holder.getAttribute("data-lo-icon") === "1" && holder.querySelector("svg")) return;
  if (holder.getAttribute("data-lo-original") === null) {
    holder.setAttribute("data-lo-original", holder.innerHTML);
  }
  holder.innerHTML = ICON_SVG;
  holder.setAttribute("data-lo-icon", "1");
}

function clearSelfIcon(el: HTMLElement): void {
  const holder = el.querySelector("[class*='navIcon']") as HTMLElement | null;
  if (!holder || holder.getAttribute("data-lo-icon") !== "1") return;
  const original = holder.getAttribute("data-lo-original");
  if (original !== null) holder.innerHTML = original;
  holder.removeAttribute("data-lo-icon");
  holder.removeAttribute("data-lo-original");
}

function clearMarks(el: HTMLElement | null): void {
  if (!el) return;
  el.style.order = "";
  for (let i = 0; i < MARK_NAMES.length; i++) el.removeAttribute(MARK_NAMES[i]);
  clearSelfIcon(el);
}

/**
 * 只在值真的变了才写属性。
 *
 * 投影跑得很勤：宿主任意一处 childList 变动（流式输出、弹层挂载、切页）都会排一帧，
 * 一秒几十遍是常态。若每遍都先擦后写，受管的宿主行每轮要吃十几次属性变更——宿主的
 * 悬停提示、测量逻辑盯着行属性就会被反复唤醒，鼠标停在按钮上时提示文字会闪。
 * 值没变就一个字节都不写，投影对宿主 DOM 才是幂等的。
 *
 * @param el 目标元素。
 * @param name 属性名。
 * @param value 期望值；传 null 表示这个属性不该存在。
 */
function setMark(el: HTMLElement, name: string, value: string | null): void {
  if (value === null) {
    if (el.hasAttribute(name)) el.removeAttribute(name);
    return;
  }
  if (el.getAttribute(name) !== value) el.setAttribute(name, value);
}

/**
 * 只在值真的变了才写 `style.order`（同 `setMark`，少一次样式失效）。
 *
 * @param el 目标元素。
 * @param value 期望的 order 值；空字符串表示还原成默认排序。
 */
function setOrder(el: HTMLElement, value: string): void {
  if (el.style.order !== value) el.style.order = value;
}

/**
 * 判断 id 是否为合成行。
 *
 * 没有台账记录认领的行也必须拿到排在受管行之后的 order，否则按默认 order: 0 浮到最前面。
 *
 * @param scope scope 键。
 * @param id 行 id。
 * @returns 在 SYNTHETIC_IDS 表里登记过时为真。
 */
function isSynthetic(scope: string, id: string): boolean {
  const list = SYNTHETIC_IDS[scope];
  return !!list && list.indexOf(id) >= 0;
}

/**
 * 判断这一行是不是「更多」那扇菜单自己的入口。
 *
 * 三处「更多」（左侧栏、对话标签条、右侧边栏「更多工具」）都是打开菜单的那颗按钮：
 * 把它收进它自己那扇菜单里，菜单就再也点不开了。所以「进更多」这个动作对它们一律不提供。
 *
 * 注意别拿 `isSynthetic` 当这个判据：合成的行里还有输入框下方的用量百分比
 * （`composer:context-meter`），它不是任何菜单的入口，该收进「更多」就收。
 *
 * @param scope scope 键。
 * @param id 行 id。
 * @returns 是「更多」入口时为真。
 */
function isMoreEntry(scope: string, id: string): boolean {
  return id === MORE_ID && (scope === "sidebar" || scope === "tabs" || scope === "right");
}

/**
 * 未认领的行从 DOM 派生稳定 id，只用标识属性不用位置。
 *
 * @param el 需要派生 id 的行元素。
 * @returns 首个可用的标识属性拼出的 id；没有标识属性时依次退回行上的文字、图标类名；都取不到时返回空字符串。
 */
function domIdOf(el: HTMLElement): string {
  const attrs = ["data-action", "data-testid", "data-panel", "data-view", "id", "aria-label", "name", "title"];
  for (let i = 0; i < attrs.length; i++) {
    const value = el.getAttribute(attrs[i]);
    if (value && value.length <= 64) return attrs[i] + ":" + value;
  }
  // 退回行上用户读到的文字。
  const text = rowText(el).replace(/\s+/g, " ").trim();
  if (text && text.length <= 48) return "text:" + text;
  // 最后一招：图标类名列表，对某个内置按钮来说是稳定的。
  const icon = el.querySelector("svg, [class*='icon']") as HTMLElement | null;
  const cls = icon && icon.getAttribute("class");
  if (cls) {
    const parts = cls.split(/\s+/).filter(function (part) {
      return part.length > 0 && part.indexOf("__") < 0 && part.indexOf("--") < 0;
    });
    if (parts.length > 0) return "cls:" + parts[0];
  }
  return "";
}

/**
 * 台账配对已经给这个元素分了记录时为真，DOM 派生那一趟放过它。
 *
 * @param pairs 台账配对结果。
 * @param el 待检查的元素。
 * @returns 该元素已被某条记录认领时为真。
 */
function claimedPairs(pairs: Pair[], el: HTMLElement): boolean {
  for (let i = 0; i < pairs.length; i++) if (pairs[i].el === el) return true;
  return false;
}

function applyScope(ctx: CtxLike, store: StoreHandle, scope: string): void {
  const state = store.get();
  const entries = readEntries(ctx, scope);
  const units = collectRowUnits(scope);
  // 行整个不见了，顺手收掉按旧几何量定位的分割线。
  if (!units) {
    hideDivider(scope);
    setLiveRows(scope, null);
    return;
  }

  // 合成行从一开始就带 id，和台账记录一样参与排序与隐藏。
  const rows: HTMLElement[] = [];
  const syntheticIds: string[] = [];
  for (let i = 0; i < units.length; i++) {
    rows.push(units[i].el);
    syntheticIds.push(units[i].id || "");
  }

  const ids: string[] = [];
  for (let i = 0; i < entries.length; i++) ids.push(entries[i].id);
  for (let i = 0; i < syntheticIds.length; i++) {
    if (syntheticIds[i] && ids.indexOf(syntheticIds[i]) < 0) ids.push(syntheticIds[i]);
  }

  const ordered = reconcileOrder(state, scope, ids);
  const byId: Record<string, LedgerEntry> = {};
  for (let i = 0; i < entries.length; i++) byId[entries[i].id] = entries[i];

  // 台账只和「非合成」的行配对：合成元素已带自己的 id。
  const slotRows: HTMLElement[] = [];
  for (let i = 0; i < units.length; i++) {
    if (syntheticIds[i]) continue;
    slotRows.push(units[i].el);
  }
  const entryList: LedgerEntry[] = [];
  for (let i = 0; i < ordered.length; i++) {
    const id = ordered[i];
    if (isSynthetic(scope, id)) continue;
    const entry = byId[id];
    // `hasLabel` 只有台账真给了文案才为真；没给时 `label` 是 id 兜底（见 `pairRows`）。
    entryList.push({ id: id, label: entry ? entry.label : id, hasLabel: entry ? entry.hasLabel : false });
  }
  // 行身上现存的标记就是上次的身份，先按它认领，位置配对只留给新元素。
  const stamped: Record<string, HTMLElement> = {};
  for (let i = 0; i < slotRows.length; i++) {
    const sid = slotRows[i].getAttribute(MARKS.id);
    if (sid && !stamped[sid]) stamped[sid] = slotRows[i];
  }
  const pairs = pairRows(entryList, slotRows, stamped, scope);

  // 台账没点名的行按 DOM 派生 id 加入排序与隐藏（见 domIdOf），并按第三方行处理。
  const extraUnits: { el: HTMLElement; id: string }[] = [];
  for (let i = 0; i < units.length; i++) {
    if (syntheticIds[i]) continue;
    if (claimedPairs(pairs, units[i].el)) continue;
    const id = domIdOf(units[i].el);
    if (!id || isSynthetic(scope, id)) continue;
    if (ordered.indexOf(id) < 0) ordered.push(id);
    extraUnits.push({ el: units[i].el, id: id });
  }

  // 三颗「更多」入口永远收在最后：它们是打开菜单的按钮，跟着列表排没有意义（见 isMoreEntry）。
  // 放在「未认领行按 DOM 派生 id 追加」之后：那些行是这一轮才出现的，先钉再追加会让钉住失效。
  for (let i = ordered.length - 1; i >= 0; i--) {
    if (!isMoreEntry(scope, ordered[i])) continue;
    const pinnedId = ordered.splice(i, 1)[0];
    ordered.push(pinnedId);
  }

  const claimed: HTMLElement[] = [];
  const visible: Record<string, { id: string; el: HTMLElement }[]> = { official: [], third: [] };
  // 本轮真正落到屏幕上的行：设置页与收纳包只列这些（见 liveRows）。
  const live: LiveRow[] = [];
  let index = 0;
  const canDragOfficial = state.options.allowDragOfficial === true;

  // 台账里没有、名字只能从元素上读的行的显示名（右侧边栏整条都不进台账，见 collectRightUnits）。
  const unitLabels: Record<string, string> = {};
  // 自带 id 的行（合成行与右侧边栏卡片）：id 是从元素上认出来的，直接按 id 找元素，不走台账配对。
  const unitById: Record<string, HTMLElement> = {};
  for (let i = 0; i < units.length; i++) {
    const unitLabel = units[i].label;
    const unitId = units[i].id;
    if (!unitId) continue;
    unitById[unitId] = units[i].el;
    if (unitLabel && !unitLabels[unitId]) unitLabels[unitId] = unitLabel;
  }

  // 遍历 `ordered`，让合成行和 slot 行共用同一条序号序列。
  let pairAt = 0;
  for (let i = 0; i < ordered.length; i++) {
    const id = ordered[i];
    let el: HTMLElement | null = null;
    if (isSynthetic(scope, id)) {
      for (let j = 0; j < units.length; j++) {
        if (syntheticIds[j] === id) {
          el = units[j].el;
          break;
        }
      }
    } else {
      // 自带 id 的行（右侧边栏的卡片）已经知道自己的元素。
      el = unitById[id] || null;
      if (!el) {
        // DOM 派生的行已知自己的元素，不再消耗台账配对。
        for (let j = 0; j < extraUnits.length; j++) {
          if (extraUnits[j].id === id) {
            el = extraUnits[j].el;
            break;
          }
        }
      }
      if (!el) {
        const pair = pairs[pairAt++];
        el = pair && pair.el ? pair.el : null;
      }
    }
    if (!el) continue;
    claimed.push(el);
    const kind = kindOf(state, scope, id);
    const group = kind === "official" ? "official" : "third";
    // 钉住的行不拿拖动标记：拖它换不了位置，只会把落点写进台账（见 isMoreEntry）。
    const pinned = isMoreEntry(scope, id);
    const entry = byId[id];
    live.push({ id: id, label: rowDisplayLabel(scope, id, entry && entry.hasLabel ? entry.label : unitLabels[id] || ""), el: el });
    setMark(el, MARKS.row, "1");
    setMark(el, MARKS.scope, scope);
    setMark(el, MARKS.id, id);
    setMark(el, MARKS.kind, kind);
    // 拖动中间态的老标记（见 MARK_NAMES）：投影不再写它们，遇到残留就擦掉。
    setMark(el, MARKS.dragging, null);
    setMark(el, MARKS.over, null);
    setMark(el, MARKS.overActive, null);
    // 趁这一行在屏幕上，把它的图标记下来：「更多」菜单要靠它还原原按钮的样子，
    // 而收进去 / 收起的行在菜单打开时多半已经离屏（见 rememberRowIcon）。
    rememberRowIcon(scope, id, el);
    if (!pinned && (group === "third" || canDragOfficial)) setMark(el, MARKS.drag, "1");
    else setMark(el, MARKS.drag, null);
    if (isHidden(state, scope, id)) {
      setMark(el, MARKS.hidden, "1");
      setOrder(el, "");
      continue;
    }
    // 收进官方「更多」菜单的行同样从主列表让位：视觉上就是「不见了」，但入口挪到了「更多」里，
    // 因此仍留在 live 记录中（设置页列得到、收纳包不会误收）。
    if (moreScopeOk(scope) && isIntoMore(state, scope, id)) {
      setMark(el, MARKS.hidden, "1");
      setOrder(el, "");
      continue;
    }
    // 这一行没被藏：老标记若还在（刚取消收起 / 刚移出「更多」）就擦掉。
    setMark(el, MARKS.hidden, null);
    if (scope === "settings" && id === SELF_ID) applySelfIcon(el);
    // order 取连续的可见行序号：被隐藏的行不吃序号。
    setOrder(el, String(index++));
    // 钉住的三点「更多」不算官方块的一员：它固定收在末尾，拿它当官方末行会把分割线画错地方。
    if (!pinned) visible[group].push({ id: id, el: el });
  }

  // 收纳各管各自的：官方统计与用量百分比不再互相级联（见 OFFICIAL_IDS 的说明）。

  // 早先打过标记、已不再对应存活记录的行（插件停用、分区消失）原样交还。
  const stale = document.querySelectorAll("[" + MARKS.scope + '="' + scope + '"][' + MARKS.row + "]");
  for (let i = 0; i < stale.length; i++) {
    if (claimed.indexOf(stale[i] as HTMLElement) < 0) clearMarks(stale[i] as HTMLElement);
  }

  // 记下本轮真正在屏幕上的行，设置页与收纳包据此只列屏幕上存在的条目（见 liveRows）。
  setLiveRows(scope, live);

  let tail = index;
  for (let i = 0; i < rows.length; i++) {
    if (claimed.indexOf(rows[i]) < 0) setOrder(rows[i], String(1000 + tail++));
  }

  // 只画在声明过的 scope 且两组都在屏上；线落在两块空隙正中，混合排序下一条直线描述不了多个交界则整条收起。
  let interleaved = false;
  if (dividerEnabled(state, scope) && mixedOrder(state)) {
    const sequence = liveOrder(scope);
    let seenThird = false;
    for (let i = 0; i < sequence.length; i++) {
      if (isHidden(state, scope, sequence[i])) continue;
      // 收进「更多」的行离场后 order 被清空（liveOrder 读回是 0），留在序列里会排在官方块中间，
      // 后面每一颗官方按钮都被判成「穿插」，整条线就被收掉了（用户报：收走一颗第三方，线就没了）。
      if (moreScopeOk(scope) && isIntoMore(state, scope, sequence[i])) continue;
      // 钉住的三点「更多」固定收尾，它的位置不代表官方块与第三方块的交界。
      if (isMoreEntry(scope, sequence[i])) continue;
      if (kindOf(state, scope, sequence[i]) === "third") seenThird = true;
      else if (seenThird) interleaved = true;
    }
  }
  if (dividerEnabled(state, scope) && !interleaved && visible.official.length > 0 && visible.third.length > 0) {
    const firstThird = visible.third[0].el;
    const lastOfficial = visible.official[visible.official.length - 1].el;
    showDivider(scope, firstThird, lastOfficial, containerAxis(firstThird, scope));
  } else {
    hideDivider(scope);
  }
}

function clearScope(scope: string): void {
  const rows = document.querySelectorAll("[" + MARKS.scope + '="' + scope + '"][' + MARKS.row + "]");
  for (let i = 0; i < rows.length; i++) clearMarks(rows[i] as HTMLElement);
  hideDivider(scope);
  // 插件卸下后设置页与收纳包不能再读上一轮的投影结果。
  setLiveRows(scope, null);
}