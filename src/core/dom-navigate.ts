// 由 `apply` 设置一次，供按投影顺序配对行时读取
let loActiveStore: StoreHandle | null = null;

function setActiveStore(store: StoreHandle | null): void {
  loActiveStore = store;
}

/**
 * 设置入口的候选文案：locale 词条打头，中英文兜底，剔除空词条。
 *
 * @returns 按优先级排列的候选文案，用于在菜单项文本里做子串匹配。
 */
function settingsWord(): string[] {
  const label = t("nav");
  const words = [label, "设置", "Settings", "settings"];
  for (let i = 0; i < words.length; i++) if (!words[i]) words.splice(i--, 1);
  return words;
}

function menuItems(): HTMLElement[] {
  const nodes = document.querySelectorAll(
    '[role="menu"] [role="menuitem"], [role="listbox"] [role="option"], [role="menu"] button, [class*="menu"] [class*="item"]'
  );
  const out: HTMLElement[] = [];
  for (let i = 0; i < nodes.length; i++) out.push(nodes[i] as HTMLElement);
  return out;
}

/**
 * 两步路径：先点弹层触发器露出菜单，再点菜单里的设置项（portal 在 <body> 末尾）；返回 false 表示无触发器可等。
 *
 * @returns 面板本来就在、或已点到菜单里的设置项时为 true；有触发器但菜单里没找到设置项时同样返回 true；一个触发器都找不到时为 false。
 */
function openSettingsPanel(): boolean {
  if (settingsPanel()) return true;
  let trigger = document.querySelector('[data-slot="sidebar.settings"] button') as HTMLElement | null;
  if (!trigger) {
    trigger = document.querySelector('button[aria-haspopup="dialog"][aria-expanded]') as HTMLElement | null;
  }
  if (!trigger) trigger = document.querySelector('button[aria-haspopup="menu"]') as HTMLElement | null;
  if (!trigger) trigger = document.querySelector("[data-shortcut-modal='settings']") as HTMLElement | null;
  if (!trigger) return false;
  trigger.click();
  const items = menuItems();
  const words = settingsWord();
  for (let i = 0; i < items.length; i++) {
    const text = rowText(items[i]);
    for (let j = 0; j < words.length; j++) {
      if (text.indexOf(words[j]) >= 0) {
        items[i].click();
        return true;
      }
    }
  }
  return true;
}

function closeSettings(): void {
  const panel = settingsPanel();
  if (!panel) return;
  let close = panel.querySelector("button[class*='close']") as HTMLElement | null;
  if (!close) close = panel.querySelector("button[aria-label]") as HTMLElement | null;
  if (close) {
    close.click();
    return;
  }
  const mask = panel.querySelector("[class*='mask']") as HTMLElement | null;
  if (mask) mask.click();
}

/**
 * 弹窗和导航行按需创建，轮询等待（id 精确匹配，标签兜底）；被收纳的设置行是 display:none，必须在点击期间显现。
 *
 * @param id 设置项的投影 id，与行上的 `data-lo-id` 精确比对。
 * @param label 该设置项的文案，行上没有 id 标记时按文案兜底匹配。
 */
function openSettingsSection(id: string, label: string): void {
  if (!openSettingsPanel()) {
    warn("open:" + id + " " + t("nav.failed").replace("{label}", label));
    return;
  }
  let tries = 0;
  const attempt = function (): void {
    if (settingsPanel()) {
      const rows = collectSettingsRows();
      if (rows) {
        for (let i = 0; i < rows.length; i++) {
          const rowId = rows[i].getAttribute(MARKS.id);
          if ((rowId && rowId === id) || (!rowId && rowText(rows[i]) === label)) {
            clickRevealed(rows[i]);
            return;
          }
        }
      }
    }
    tries++;
    if (tries < 40) window.setTimeout(attempt, 50);
    else warn("navigate:" + id + " " + t("nav.failed").replace("{label}", label));
  };
  window.setTimeout(attempt, 0);
}

/**
 * 只认标签、role 和 onclick 属性；React 合成的 onClick 在 DOM 上没有痕迹，判不出来。
 *
 * @param el 待判定的元素。
 * @returns 标签是表单/链接类控件、role 属可点角色、或带 onclick 属性时为 true。
 */
function isInteractive(el: HTMLElement): boolean {
  const tag = el.tagName;
  if (tag === "BUTTON" || tag === "A" || tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return true;
  const role = el.getAttribute("role");
  if (role === "button" || role === "tab" || role === "menuitem" || role === "link") return true;
  return el.hasAttribute("onclick");
}

/**
 * 行是按钮就点行；容器往里找第一个可点的后代（点容器等于对空气点），没有时退回点行本身。
 *
 * @param el 待点击的行。
 * @returns 实际该点下去的元素：`el` 自身可点就是它，否则是第一个可点后代，都没有时仍是 `el`。
 */
function clickTargetOf(el: HTMLElement): HTMLElement {
  if (isInteractive(el)) return el;
  const nodes = el.querySelectorAll("button, a, [role='button'], [role='tab'], [role='menuitem'], [onclick]");
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i] as HTMLElement & { disabled?: boolean };
    if (node.disabled) continue;
    return node;
  }
  return el;
}

/**
 * 显现必须作用在整行上：被点的常是行的后代，display:none 压在行上；属性在下一帧恢复。
 *
 * @param el 待点击的行；被收纳过时它的 `data-lo-hidden` 会被临时摘掉，点完下一帧补回。
 */
function clickRevealed(el: HTMLElement): void {
  const wasHidden = el.hasAttribute(MARKS.hidden);
  if (wasHidden) el.removeAttribute(MARKS.hidden);
  clickTargetOf(el).click();
  if (wasHidden) {
    window.requestAnimationFrame(function () {
      el.setAttribute(MARKS.hidden, "1");
    });
  }
}

/**
 * 按投影标记找这一行此刻在屏幕上的元素。
 *
 * @param scope 位置键。
 * @param id 行的投影 id。
 * @returns 打有 `data-lo-scope` / `data-lo-id` 且 id 相符的元素；该行当前不在屏幕上时为 null。
 */
function liveRowEl(scope: string, id: string): HTMLElement | null {
  const stamped = document.querySelectorAll("[" + MARKS.scope + '="' + scope + '"][' + MARKS.id + "]");
  for (let i = 0; i < stamped.length; i++) {
    if (stamped[i].getAttribute(MARKS.id) === id) return stamped[i] as HTMLElement;
  }
  return null;
}

/**
 * 这一行在界面上本来有没有可点的东西。
 *
 * 与 `clickTargetOf` 同一把尺子：行本身是可点控件，或行里能找到可点的后代，都算「本来就能点」。
 * 纯展示的行（例如插件塞进停靠行的只读统计条）两样都不占，点它原本就毫无反应。
 *
 * @param el 待判定的行元素。
 * @returns 界面上本来就能点为 true。
 */
function rowClickable(el: HTMLElement): boolean {
  return isInteractive(el) || clickTargetOf(el) !== el;
}

/**
 * 这一行在收纳包里点下去该不该有反应。
 *
 * 判据取自界面本身而不是位置名：界面上点不动的行，在收纳包里也不该可点——
 * 可点却毫无反应，还顺手关掉收纳包与设置弹窗，比灰着更让人以为按钮坏了。
 *
 * 设置行是唯一的例外：设置弹窗按需打开，这一行此刻不在屏幕上也可能被导航到
 * （先开弹窗再定位），因此只要它没被判成 missing 就仍然可点。
 *
 * @param scope 位置键。
 * @param id 行的投影 id。
 * @returns 点下去该有反应时为 true。
 */
function rowNavigable(scope: string, id: string): boolean {
  if (scope === "settings") return true;
  // 这一处整体没投影过（页面未挂载），没有元素可点。
  if (!liveRowIds(scope)) return false;
  const el = liveRowEl(scope, id);
  if (!el) return false;
  return rowClickable(el);
}

function navigateTo(ctx: CtxLike, scope: string, id: string): void {
  if (scope === "settings") {
    const entries = readEntries(ctx, scope);
    let label = id;
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].id === id) {
        label = entries[i].label;
        break;
      }
    }
    openSettingsSection(id, label);
    return;
  }

  // 侧边栏优先走官方 selectPanel API。
  if (scope === "sidebar") {
    try {
      const layout = ctx.get("layout") as LayoutService | null;
      if (layout && typeof layout.selectPanel === "function") {
        layout.selectPanel(id);
        return;
      }
    } catch (err) {
      // 落到下面的点击路径
    }
  }

  // 直接读行上投影打过的 data-lo-scope / data-lo-id 标记来配对。
  const stamped = document.querySelectorAll("[" + MARKS.scope + '="' + scope + '"][' + MARKS.id + "]");
  for (let i = 0; i < stamped.length; i++) {
    if (stamped[i].getAttribute(MARKS.id) === id) {
      clickRevealed(stamped[i] as HTMLElement);
      return;
    }
  }

  const rows = collectRows(scope);
  if (!rows) return;
  const entries = readEntries(ctx, scope);
  const ids: string[] = [];
  for (let i = 0; i < entries.length; i++) ids.push(entries[i].id);
  const state = loActiveStore ? loActiveStore.get() : null;
  const ordered = state ? reconcileOrder(state, scope, ids) : ids;
  const byId: Record<string, LedgerEntry> = {};
  for (let i = 0; i < entries.length; i++) byId[entries[i].id] = entries[i];
  // 台账没有的 id 用 id 当文案、标记为「无文案」，让配对知道该按位置兜底（见 `pairRows`）。
  const list: LedgerEntry[] = [];
  for (let i = 0; i < ordered.length; i++) {
    const entry = byId[ordered[i]];
    list.push(entry ? entry : { id: ordered[i], label: ordered[i], hasLabel: false, order: 0 });
  }
  const pairs = pairRows(list, rows);
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i].id === id && pairs[i].el) {
      clickRevealed(pairs[i].el);
      return;
    }
  }
}