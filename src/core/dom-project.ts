// 构建时替换成 layout.svg 内联图标；@16 表示设置行 navIcon 的 16 见方。
const ICON_SVG = "@@svg:layout.svg@16@@";

function applySelfIcon(el: HTMLElement): void {
  const holder = el.querySelector("[class*='navIcon']") as HTMLElement | null;
  if (!holder) return;
  if (holder.getAttribute("data-lo-icon") === "1") return;
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
 * 给一行取显示名：台账文案优先，其次认领钩子里声明的名字，最后退回 id。
 *
 * @param scope scope 键。
 * @param id 行 id。
 * @param label 台账文案；没有时传空字符串。
 * @returns 该行在设置页与收纳包里显示的名字。
 */
function displayLabel(scope: string, id: string, label: string): string {
  if (label) return label;
  const hooked = hookLabel(scope, id);
  if (hooked) return hooked;
  const live = liveRowLabel(scope, id);
  return live || id;
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

function applyScope(ctx: CtxLike, store: StoreHandle, scope: string): ScopeResult {
  const state = store.get();
  const entries = readEntries(ctx, scope);
  const units = collectRowUnits(scope);
  // 行整个不见了，顺手收掉按旧几何量定位的分割线。
  if (!units) {
    hideDivider(scope);
    setLiveRows(scope, null);
    return { mounted: false, official: 0, third: 0 };
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
  const slotIds: string[] = [];
  for (let i = 0; i < units.length; i++) {
    if (syntheticIds[i]) continue;
    slotRows.push(units[i].el);
    slotIds.push("");
  }
  const entryList: LedgerEntry[] = [];
  for (let i = 0; i < ordered.length; i++) {
    const id = ordered[i];
    if (isSynthetic(scope, id)) continue;
    const entry = byId[id];
    // `hasLabel` 只有台账真给了文案才为真；没给时 `label` 是 id 兜底（见 `pairRows`）。
    entryList.push({ id: id, label: entry ? entry.label : id, hasLabel: entry ? entry.hasLabel : false, order: entry ? entry.order : 0 });
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

  const claimed: HTMLElement[] = [];
  const visible: Record<string, { id: string; el: HTMLElement }[]> = { official: [], third: [] };
  // 本轮真正落到屏幕上的行：设置页与收纳包只列这些（见 liveRows）。
  const live: LiveRow[] = [];
  let index = 0;
  const canDragOfficial = state.options.allowDragOfficial === true;

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
      // DOM 派生的行已知自己的元素，不再消耗台账配对。
      for (let j = 0; j < extraUnits.length; j++) {
        if (extraUnits[j].id === id) {
          el = extraUnits[j].el;
          break;
        }
      }
      if (!el) {
        const pair = pairs[pairAt++];
        el = pair && pair.el ? pair.el : null;
      }
    }
    if (!el) continue;
    clearMarks(el);
    claimed.push(el);
    const kind = kindOf(state, scope, id);
    const group = kind === "official" ? "official" : "third";
    const entry = byId[id];
    live.push({ id: id, label: displayLabel(scope, id, entry && entry.hasLabel ? entry.label : "") });
    el.setAttribute(MARKS.row, "1");
    el.setAttribute(MARKS.scope, scope);
    el.setAttribute(MARKS.id, id);
    el.setAttribute(MARKS.kind, kind);
    if (group === "third" || canDragOfficial) el.setAttribute(MARKS.drag, "1");
    if (isHidden(state, scope, id)) {
      el.setAttribute(MARKS.hidden, "1");
      continue;
    }
    if (scope === "settings" && id === SELF_ID) applySelfIcon(el);
    // order 取连续的可见行序号：被隐藏的行不吃序号。
    el.style.order = String(index++);
    visible[group].push({ id: id, el: el });
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
    if (claimed.indexOf(rows[i]) < 0) rows[i].style.order = String(1000 + tail++);
  }

  // 只画在声明过的 scope 且两组都在屏上；线落在两块空隙正中，混合排序下一条直线描述不了多个交界则整条收起。
  let interleaved = false;
  if (dividerEnabled(state, scope) && mixedOrder(state)) {
    const sequence = liveOrder(scope) || [];
    let seenThird = false;
    for (let i = 0; i < sequence.length; i++) {
      if (isHidden(state, scope, sequence[i])) continue;
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

  return { mounted: true, official: visible.official.length, third: visible.third.length };
}

function clearScope(scope: string): void {
  const rows = document.querySelectorAll("[" + MARKS.scope + '="' + scope + '"][' + MARKS.row + "]");
  for (let i = 0; i < rows.length; i++) clearMarks(rows[i] as HTMLElement);
  hideDivider(scope);
  // 插件卸下后设置页与收纳包不能再读上一轮的投影结果。
  setLiveRows(scope, null);
}