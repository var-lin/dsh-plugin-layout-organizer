// 由 `apply` 设置一次，供按投影顺序配对行时读取
let loActiveStore: StoreHandle | null = null;

function setActiveStore(store: StoreHandle | null): void {
  loActiveStore = store;
}

// 两步路径：先点弹层触发器露出菜单，再点菜单里的设置项（portal 在 <body> 末尾）；返回 false 表示无触发器可等。
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

// 弹窗和导航行按需创建，轮询等待（id 精确匹配，标签兜底）；被收纳的设置行是 display:none，必须在点击期间显现。
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

// 合成 onClick 判不出来；没有可点后代时退回点行本身。
function isInteractive(el: HTMLElement): boolean {
  const tag = el.tagName;
  if (tag === "BUTTON" || tag === "A" || tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return true;
  const role = el.getAttribute("role");
  if (role === "button" || role === "tab" || role === "menuitem" || role === "link") return true;
  return el.hasAttribute("onclick");
}

// 行是按钮就点行；容器往里找第一个可点的后代（点容器等于对空气点），没有时退回点行本身。
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

// 显现必须作用在整行上：被点的常是行的后代，display:none 压在行上；属性在下一帧恢复。
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