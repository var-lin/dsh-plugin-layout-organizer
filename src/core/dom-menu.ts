let loMenuEl: HTMLElement | null = null;
let loMenuBound = false;

function closeMenu(): void {
  if (loMenuEl && loMenuEl.parentNode) loMenuEl.parentNode.removeChild(loMenuEl);
  loMenuEl = null;
}

// 本插件的右键菜单是 portal 到 `body` 的，结构上在宿主「更多」菜单之外。宿主给那个菜单挂了
// 「按下别处就关掉」的判断，于是点右键菜单里的任何一项都会被当成「点了外面」——「更多」菜单
// 当场消失，动作还没跑完界面就没了。所以弹层自己把冒泡截住，事件到不了 document。
//
// 只能截冒泡阶段：捕获阶段截在弹层这一层，事件就再也到不了它下面的菜单项，点了没反应
// （1.2.4 的实测翻车点）。冒泡阶段截则相反——目标先拿到事件、菜单项的点击照常执行，
// 之后才轮到 document / window，宿主那一侧照样看不见这次按下。
function guardPopEvents(menu: HTMLElement): void {
  const names: string[] = ["pointerdown", "mousedown", "pointerup", "mouseup", "click", "contextmenu"];
  for (let i = 0; i < names.length; i++) {
    menu.addEventListener(names[i], function (event: Event): void {
      event.stopPropagation();
    });
  }
}

function openMenu(event: MouseEvent, actions: MenuAction[]): void {
  closeMenu();
  // 背景在 aria-hidden 的 material 上；data-menu-material 是暗色主题换更亮描边的钩子
  const menu = document.createElement("div");
  menu.className = CLASS.pop;
  menu.setAttribute("role", "menu");
  menu.setAttribute("data-menu-material", "translucent");
  guardPopEvents(menu);
  menu.style.zIndex = String(Z_MENU);
  const material = document.createElement("div");
  material.className = CLASS.popMaterial;
  material.setAttribute("aria-hidden", "true");
  menu.appendChild(material);
  const viewport = document.createElement("div");
  viewport.className = CLASS.popViewport;
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    const wrap = document.createElement("div");
    wrap.className = CLASS.popWrap;
    const item = document.createElement("button");
    item.type = "button";
    item.role = "menuitem";
    item.className = CLASS.popItem;
    if (action.disabled) item.disabled = true;
    if (action.icon) {
      const glyph = document.createElement("span");
      glyph.className = CLASS.popIcon;
      glyph.setAttribute("aria-hidden", "true");
      glyph.innerHTML = action.icon;
      item.appendChild(glyph);
    }
    const text = document.createElement("span");
    text.className = CLASS.popText;
    text.textContent = action.label;
    item.appendChild(text);
    item.onclick = function () {
      closeMenu();
      action.run();
    };
    wrap.appendChild(item);
    viewport.appendChild(wrap);
  }
  menu.appendChild(viewport);
  document.body.appendChild(menu);
  const width = menu.offsetWidth || 144;
  const height = menu.offsetHeight || 60;
  const left = Math.min(event.clientX, window.innerWidth - width - 8);
  const top = Math.min(event.clientY, window.innerHeight - height - 8);
  menu.style.left = Math.max(8, Math.round(left)) + "px";
  menu.style.top = Math.max(8, Math.round(top)) + "px";
  loMenuEl = menu;
}

interface MenuAction {
  label: string;
  // 官方菜单每项左侧的 14px 线性图标；不给就只剩文字，不会留下空的图标列。
  icon?: string;
  disabled: boolean;
  run: () => void;
}

function insideMenu(target: EventTarget | null): boolean {
  return !!(loMenuEl && target && target instanceof Node && loMenuEl.contains(target));
}

function onMenuPointerDown(event: PointerEvent): void {
  if (!loMenuEl) return;
  // 菜单内部的 pointerdown 放过（由它自己的 click 关掉）；左键点外部才关——滚动、失焦都不关（AI 回答时页面自己滚动，菜单不能跟着消失）。
  if (insideMenu(event.target)) return;
  if (event.button !== 0) return;
  closeMenu();
}

function onMenuKeyDown(event: KeyboardEvent): void {
  if (event.key === "Escape" && loMenuEl) {
    event.stopPropagation();
    closeMenu();
  }
}

function installMenuBindings(): void {
  if (loMenuBound) return;
  loMenuBound = true;
  // 捕获阶段注册：菜单在官方处理函数对同一个手势作出反应之前就关掉。
  document.addEventListener("pointerdown", onMenuPointerDown, true);
  document.addEventListener("keydown", onMenuKeyDown, true);
}

function uninstallMenuBindings(): void {
  if (!loMenuBound) return;
  loMenuBound = false;
  document.removeEventListener("pointerdown", onMenuPointerDown, true);
  document.removeEventListener("keydown", onMenuKeyDown, true);
  closeMenu();
}

/**
 * 轴向由 scope 表声明；`group` 为 "all" 表示混合排序：整条 scope 就是一个组，没有跨组限制。
 *
 * 菜单位置按动作类别聚拢：两个排序动作在前，改判官方 / 第三方居中，两级收纳收尾。
 * 改判项的文案直接写目标分类（当前是第三方就写「官方」），因为面板里看不到这一行现在归哪类，
 * 写「切换」只会让人猜点下去会变成什么。分类只是本地覆盖（见 `store.kinds`），不动插件本身。
 *
 * 收纳分两级：先说「收纳到更多」（把行从主列表挪进官方「更多」菜单，仍可从那里打开），
 * 最后才是「收纳」（收进悬浮框，彻底从界面收起）。一级比一级退得更远，顺序照这个语义排。
 *
 * @param store 状态句柄，菜单项执行时经它改写顺序、分类与收纳状态。
 * @param scope 槽位 key。
 * @param id 右键点中的行 id。
 * @param group 限定组；"all" 表示整条 scope 一个组。
 * @param axis 轴向，"x" 时文案与图标取左右，其余取上下。
 * @returns 移动（上/下或左/右）、改判官方 / 第三方、收纳到「更多」（仅侧边栏）与收纳 / 恢复，其中不可用方向按行在组内的位置置 disabled。
 */
function menuActionsFor(store: StoreHandle, scope: string, id: string, group: string, axis: string): MenuAction[] {
  const state = store.get();
  const hidden = isHidden(state, scope, id);
  const official = kindOf(state, scope, id) === "official";
  // 「更多」是侧边栏独有的官方收纳入口，别的槽位没有对应菜单，故只在侧边栏给出这一项。
  const inMoreScope = moreScopeOk(scope) && !isSynthetic(scope, id);
  const intoMore = inMoreScope && isIntoMore(state, scope, id);
  const ids = liveOrder(scope) || [];
  const groupIds: string[] = [];
  for (let i = 0; i < ids.length; i++) {
    if ((group === "all" || groupOf(state, scope, ids[i]) === group) && !isHidden(state, scope, ids[i])) groupIds.push(ids[i]);
  }
  const at = groupIds.indexOf(id);
  const bound = group === "all" ? undefined : group;
  const horizontal = axis === "x";
  const actions: MenuAction[] = [
    {
      label: horizontal ? t("action.left") : t("action.up"),
      icon: horizontal ? MENU_ICON_LEFT : MENU_ICON_UP,
      disabled: at <= 0,
      run: function () {
        store.update(function (next) {
          moveRow(next, scope, id, -1, bound);
        });
      }
    },
    {
      label: horizontal ? t("action.right") : t("action.down"),
      icon: horizontal ? MENU_ICON_RIGHT : MENU_ICON_DOWN,
      disabled: at < 0 || at >= groupIds.length - 1,
      run: function () {
        store.update(function (next) {
          moveRow(next, scope, id, 1, bound);
        });
      }
    },
    {
      label: official ? t("kind.third") : t("kind.official"),
      icon: MENU_ICON_SWITCH,
      disabled: false,
      run: function () {
        store.update(function (next) {
          next.kinds[scope + ":" + id] = official ? "third" : "official";
        });
      }
    }
  ];
  // 「收纳到更多」只对侧边栏面板行有意义：别的槽位没有官方「更多」菜单可收。
  if (inMoreScope) {
    actions.push({
      label: intoMore ? t("action.outOfMore") : t("action.intoMore"),
      icon: intoMore ? MENU_ICON_UNARCHIVE : MENU_ICON_ARCHIVE,
      disabled: false,
      run: function () {
        store.update(function (next) {
          setIntoMore(next, scope, id, !intoMore);
        });
      }
    });
  }
  actions.push({
    label: hidden ? t("action.restore") : t("action.stash"),
    icon: hidden ? MENU_ICON_UNARCHIVE : MENU_ICON_ARCHIVE,
    disabled: false,
    run: function () {
      store.update(function (next) {
        setHidden(next, scope, id, !hidden);
      });
    }
  });
  return actions;
}

/**
 * 管理列表走自己的 onContextMenu prop；轴向仍来自 scope 表。
 *
 * 菜单里的行是纵向一列，即使它原本属于横向槽位，「左移 / 右移」也没有意义——
 * 那一列排的是所有收进来的行，顺序读的仍是该 scope 的 order。因此菜单行按 `y` 算。
 *
 * @param event 列表行的右键事件，处理时阻止默认菜单与冒泡。
 * @param ctx 上下文；当前实现未使用该参数。
 * @param store 状态句柄，透传给 menuActionsFor。
 * @param scope 槽位 key。
 * @param id 行 id。
 * @param group 行所属组。
 */
function attachMenuAt(event: MouseEvent, ctx: CtxLike, store: StoreHandle, scope: string, id: string, group: string): void {
  event.preventDefault();
  event.stopPropagation();
  const el = (event.currentTarget || event.target) as HTMLElement;
  const axis = el.classList && el.classList.contains("lo-more-row") ? "y" : containerAxis(el, scope);
  openMenu(event, menuActionsFor(store, scope, id, group, axis));
}

/**
 * 只匹配被标记过的节点（侧边栏是行 BUTTON）；输入框、非管理按钮或空白处返回 null，交给原生菜单。
 *
 * @returns 匹配带行标记属性节点的选择器。
 */
function rowSelector(): string {
  return "[" + MARKS.row + '="1"][' + MARKS.id + "]";
}

/**
 * 三级兜底：closest → elementsFromPoint → 矩形硬扫；`.st-strip` 带 pointer-events:none，前两级拿不到。
 *
 * @param target 右键事件的原始目标。
 * @param x 指针横坐标，仅在需要按坐标兜底时使用。
 * @param y 指针纵坐标，仅在需要按坐标兜底时使用。
 * @returns 命中的被管理行；目标不是元素、落在可编辑区域、坐标缺失或三级都未命中时返回 null。
 */
function managedRowFrom(target: EventTarget | null, x?: number, y?: number): HTMLElement | null {
  if (!target || !(target instanceof Element)) return null;
  // 可编辑区域内的右键属于浏览器（复制/粘贴/拼写检查），即使它恰好位于被管理的行里。
  if (target.closest("input, textarea, [contenteditable='true'], [contenteditable='']")) return null;
  const selector = rowSelector();
  const row = target.closest(selector);
  if (row) return row as HTMLElement;
  if (typeof x !== "number" || typeof y !== "number") return null;
  const stack = document.elementsFromPoint(x, y);
  for (let i = 0; i < stack.length; i++) {
    const el = stack[i];
    if (el.matches(selector)) return el as HTMLElement;
  }
  return rowAtPoint(selector, x, y);
}

function onWindowContextMenu(event: MouseEvent): void {
  const row = managedRowFrom(event.target, event.clientX, event.clientY);
  if (!row) return;
  const scope = row.getAttribute(MARKS.scope);
  const id = row.getAttribute(MARKS.id);
  if (!scope || !id) return;
  const store = loMenuStore;
  if (!store) return;
  event.preventDefault();
  event.stopPropagation();
  const axis = containerAxis(row, scope);
  openMenu(event, menuActionsFor(store, scope, id, groupOf(store.get(), scope, id), axis));
}

let loMenuStore: StoreHandle | null = null;

function installRowMenu(store: StoreHandle): void {
  loMenuStore = store;
  installMenuBindings();
  window.addEventListener("contextmenu", onWindowContextMenu, true);
}

function uninstallRowMenu(): void {
  window.removeEventListener("contextmenu", onWindowContextMenu, true);
  loMenuStore = null;
  uninstallMenuBindings();
}