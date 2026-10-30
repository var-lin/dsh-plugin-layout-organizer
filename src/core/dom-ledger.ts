// 侧边栏和底栏用 entriesOfSlot（它们的渲染器用的就是它），其余 scope 读原始 entries 数组。
// 文案缺失（hasLabel 为假）可放心退回位置配对；文案存在却对不上才说明身份存疑（见 pairRows）。
interface LedgerEntry {
  id: string;
  label: string;
  hasLabel: boolean;
  // 台账登记的排序号；配对与投影都不读它，只有 `readEntries` 自己按它排序时才有值。
  order?: number;
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
      return (a.order || 0) - (b.order || 0);
    });
  }
  return out;
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
  for (let i = 0; i < entries.length; i++) pairs.push({ id: entries[i].id, el: null });

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
  // 声明了认领钩子的记录不参与猜：钩子没命中就是没渲染，按位置补一条只会补出影子行
  // ——注册在这个槽位、实际渲染在别处的插件（Trae / WorkBuddy 的额度读数）正是这样混进来的。
  const freeEntries: number[] = [];
  const freeRows: number[] = [];
  for (let i = 0; i < entries.length; i++) {
    if (pairs[i].el) continue;
    if (scope && rowHookOf(scope, entries[i].id)) continue;
    freeEntries.push(i);
  }
  for (let j = 0; j < rows.length; j++) if (!used[j]) freeRows.push(j);
  if (freeEntries.length !== freeRows.length) return pairs;
  let at = 0;
  for (let i = 0; i < entries.length; i++) {
    if (pairs[i].el) continue;
    if (scope && rowHookOf(scope, entries[i].id)) continue;
    pairs[i].el = rows[freeRows[at++]];
  }
  return pairs;
}

// 一条被投影真正标记到的行：id 与给人看的名字，设置页与收纳包据此只列屏幕上存在的行。
interface LiveRow {
  id: string;
  label: string;
  // 这一轮标记到的元素。投影每轮都会重新取一遍，缓存它省掉后面按 id 反查 DOM 的线性扫描。
  el?: HTMLElement | null;
}

/* 每个 scope 上一轮投影标记到的行。
   - 从未投影过 → undefined，`liveRows` 报 null，调用方回退到台账（插件刚加载、页面还没挂载）；
   - 投影过但此刻整个不在屏幕上 → null，调用方同样回退到台账；
   - 投影过且在屏幕上 → 数组，调用方以它为准。 */
const __liveRows: Record<string, LiveRow[] | null> = {};

/* 每个 scope 最后一次真正在屏幕上时标记到的行。
   会话页关掉后，标签条与停靠行整条不再渲染（`setLiveRows(…, null)`），设置页若只看这一轮
   投影，那两张卡片就空了；这里留下最后一次的现场，卡片据此照常列出、也照常排顺序（用户 m00654）。
   它只记投影真的标记到的行，因此不会把 Trae / WorkBuddy 那种「注册在此、渲染别处」的记录
   带进来，与台账兜底不是一回事。 */
const __seenRows: Record<string, LiveRow[]> = {};

/* `scope:id` → 这一轮投影标记到的元素。
   取图标、取行元素原本都要在带标记的节点里线性扫一遍；投影每帧都跑，这些查询也就每帧都跑，
   行数虽少也是平方级。投影落地的同一刻把元素记下来，读的时候直接取（元素被宿主换掉时
   `liveElement` 会退回去现找，见下）。 */
const __liveEls: Record<string, HTMLElement> = {};

/**
 * 记下某 scope 本轮投影标记到的行。
 *
 * @param scope scope 键。
 * @param rows 本轮标记到的行；该 scope 此刻不在屏幕上时传 null。
 */
function setLiveRows(scope: string, rows: LiveRow[] | null): void {
  const prefix = scope + ":";
  let key;
  for (key in __liveEls) {
    if (key.indexOf(prefix) === 0) delete __liveEls[key];
  }
  __liveRows[scope] = rows;
  if (!rows) return;
  __seenRows[scope] = rows;
  for (let i = 0; i < rows.length; i++) {
    const el = rows[i].el;
    if (el) __liveEls[prefix + rows[i].id] = el;
  }
}

/**
 * 取某条行这一轮投影标记到的元素。
 *
 * @param scope scope 键。
 * @param id 行 id。
 * @returns 那个元素；这一轮没标记到、或缓存的元素已经被宿主换掉时返回 null。
 */
function liveElement(scope: string, id: string): HTMLElement | null {
  const key = scope + ":" + id;
  const cached = __liveEls[key];
  // `isConnected` 取不到的宿主环境（测试桩）当作还连在树上，别把缓存白白丢掉。
  if (cached && cached.isConnected !== false) return cached;
  if (cached) delete __liveEls[key];
  return null;
}

/**
 * 读某 scope 最后一次在屏幕上时标记到的行。
 *
 * @param scope scope 键。
 * @returns 上一次投影记下的行；该 scope 还没有过一次投影时为 null。
 */
function seenRows(scope: string): LiveRow[] | null {
  const rows = __seenRows[scope];
  return rows === undefined ? null : rows;
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
 * 某条台账记录这一轮该不该列出来。
 *
 * 六处槽位用同一把尺子：只列这一轮投影真正标记到的行（`liveRowIds` 的成员）。台账里有记录、
 * DOM 里却没有元素的，一律不列——它们可能注册在这个槽位、实际渲染在别处（Trae / WorkBuddy
 * 的额度读数注册在停靠行、画在对话框里），列出来就是一条点不动、也收纳不掉的影子行。
 *
 * scope 整个不在屏幕上时（`live` 为 null）同样不列：没有正证据就不假装它在。
 *
 * @param live `liveRowIds` 的结果（null 表示该 scope 不在屏幕上）。
 * @param id 记录 id。
 * @returns 该列则为 true。
 */
function listedInScope(live: string[] | null, id: string): boolean {
  return !!live && live.indexOf(id) >= 0;
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

