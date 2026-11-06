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
  if (!close) {
    // 只认「关闭」语义的按钮：`button[aria-label]` 抓到的第一颗可能是别的动作。
    const labelled = panel.querySelectorAll("button[aria-label]");
    for (let i = 0; i < labelled.length; i++) {
      const text = labelled[i].getAttribute("aria-label") || "";
      if (text.indexOf("lose") >= 0 || text.indexOf("关闭") >= 0 || text.indexOf("關閉") >= 0) {
        close = labelled[i] as HTMLElement;
        break;
      }
    }
  }
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
  const epoch = loNavEpoch;
  let tries = 0;
  const attempt = function (): void {
    // 插件已经卸载：别再点宿主的东西。
    if (epoch !== loNavEpoch) return;
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
