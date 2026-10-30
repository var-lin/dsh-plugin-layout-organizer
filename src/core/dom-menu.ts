let loMenuEl: HTMLElement | null = null;
let loMenuBound = false;

// 宿主弹层菜单的一条/整扇：菜单项带 `role="menuitem"`，容器带 `role="menu"`。
// 用 role 而不是类名——类名是 CSS Modules 的哈希（`_menu_6nhg2_547`），换一版构建就变。
const MENU_POPUP_SELECTOR = "[role='menu'],[role='menuitem'],[role='menuitemcheckbox'],[role='menuitemradio']";

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
    // `disabled` 让元素不可点，`aria-disabled` 让读屏软件也念出「不可用」：
    // 只靠原生 disabled，某些宿主把按钮外观整个改掉、读屏又听不到状态。
    if (action.disabled) {
      item.disabled = true;
      item.setAttribute("aria-disabled", "true");
    }
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
 * @returns 五项：移动（上/下或左/右）、改判官方 / 第三方、收纳到「更多」与收纳 / 恢复。项集处处一致，
 * 只是不适用处按情况置 disabled——方向按行在组内的位置，「更多」那项看这一处有没有官方「更多」可收。
 */
function menuActionsFor(store: StoreHandle, scope: string, id: string, group: string, axis: string): MenuAction[] {
  const state = store.get();
  const hidden = isHidden(state, scope, id);
  // 只有真能收的才让这一项可用：没「更多」容器的槽位（设置页导航）不能收，
  // 入口按钮本身（三处「更多」）也不能收——收进去就再也点不开。两种都照画，只是置灰（用户 m09717）。
  const inMoreScope = canTuckIntoMore(scope, id);
  const intoMore = inMoreScope && isIntoMore(state, scope, id);
  // 「更多」入口自己不是可排的行：位置固定在列表末尾，也不改判官方 / 第三方。
  // 菜单里只留「收起」一项可用，其余照画但画成禁用态（用户 m04058）。
  const entry = isMoreEntry(scope, id);
  const ids = liveOrder(scope);
  const groupIds: string[] = [];
  for (let i = 0; i < ids.length; i++) {
    // 钉住的「更多」入口固定收尾，收进「更多」的行不在主列表里：拿它们当邻居换位，
    // 界面上不会发生任何变化（`moveRow` 只换顺序，投影又把「更多」排回末尾）。
    if (isMoreEntry(scope, ids[i])) continue;
    if (moreScopeOk(scope) && isIntoMore(state, scope, ids[i])) continue;
    if ((group === "all" || groupOf(state, scope, ids[i]) === group) && !isHidden(state, scope, ids[i])) groupIds.push(ids[i]);
  }
  const at = groupIds.indexOf(id);
  const bound = group === "all" ? undefined : group;
  const horizontal = axis === "x";
  const actions: MenuAction[] = [
    {
      label: horizontal ? t("action.left") : t("action.up"),
      icon: horizontal ? MENU_ICON_LEFT : MENU_ICON_UP,
      disabled: entry || at <= 0,
      run: function () {
        store.update(function (next) {
          moveRow(next, scope, id, -1, bound);
        });
      }
    },
    {
      label: horizontal ? t("action.right") : t("action.down"),
      icon: horizontal ? MENU_ICON_RIGHT : MENU_ICON_DOWN,
      disabled: entry || at < 0 || at >= groupIds.length - 1,
      run: function () {
        store.update(function (next) {
          moveRow(next, scope, id, 1, bound);
        });
      }
    }
  ];
  // 后三项（改判、两级收纳）由 `menuTailActions` 统一造，与「更多」菜单里的行共用同一份实现。
  // `hidden` 只在这里算过一次，所以照旧传进去。
  actions.push.apply(actions, menuTailActions(store, scope, id, entry, inMoreScope, intoMore, hidden));
  return actions;
}

/**
 * 右键菜单的后三项：改判官方 / 第三方、两级收纳（进出「更多」、收起 / 恢复）。
 *
 * 各处右键菜单的项集统一（用户 m09717）：这三项处处都画，不适用处画成禁用态而不是整项消失，
 * 用户不用记「这一处有没有这一项」。顺序也照收纳语义排：先说「收纳到更多」（挪进官方「更多」
 * 菜单，仍可从那里打开），最后才是「收纳」（收进悬浮框，彻底从界面收起），一级比一级退得更远。
 *
 * @param store 状态句柄。
 * @param scope 槽位 key。
 * @param id 行 id。
 * @param entry 这一行是不是钉住的「更多」入口本身（入口不能改判、不能收进自己）。
 * @param inMoreScope 这一处有没有官方「更多」菜单可收。
 * @param intoMore 这一行现在是不是已经收在「更多」里（文案随之在「进更多 / 出更多」之间切换）。
 * @param hidden 这一行现在是不是已经收进悬浮框。
 * @returns 三项菜单动作。
 */
function menuTailActions(
  store: StoreHandle,
  scope: string,
  id: string,
  entry: boolean,
  inMoreScope: boolean,
  intoMore: boolean,
  hidden: boolean
): MenuAction[] {
  return [
    kindToggleAction(store, scope, id, entry),
    {
      label: intoMore ? t("action.outOfMore") : t("action.intoMore"),
      icon: intoMore ? ACTION_ICON_OUT_OF_MORE : MENU_ICON_ARCHIVE,
      disabled: !inMoreScope || entry,
      run: function (): void {
        if (!inMoreScope || entry) return;
        store.update(function (next: PluginState): void {
          setIntoMore(next, scope, id, !intoMore);
        });
      }
    },
    {
      label: hidden ? t("action.restore") : t("action.stash"),
      icon: hidden ? MENU_ICON_UNARCHIVE : MENU_ICON_ARCHIVE,
      disabled: false,
      run: function (): void {
        store.update(function (next: PluginState): void {
          setHidden(next, scope, id, !hidden);
        });
      }
    }
  ];
}

/**
 * 改判官方 / 第三方的菜单项。
 *
 * 位置卡片那颗按钮、宿主行的右键菜单、「更多」菜单里的行三处语义完全一样，
 * 只有禁用条件不同（钉住的「更多」入口不能改判），所以把这一项单独抽出来。
 *
 * @param store 状态句柄。
 * @param scope 槽位 key。
 * @param id 行 id。
 * @param disabled 是否禁用这一项。
 * @returns 菜单项。
 */
function kindToggleAction(store: StoreHandle, scope: string, id: string, disabled: boolean): MenuAction {
  const official = kindOf(store.get(), scope, id) === "official";
  return {
    label: official ? t("kind.third") : t("kind.official"),
    icon: MENU_ICON_SWITCH,
    disabled: disabled,
    run: function (): void {
      store.update(function (next: PluginState): void {
        next.kinds[scope + ":" + id] = official ? "third" : "official";
      });
    }
  };
}

/**
 * 管理列表走自己的 onContextMenu prop；轴向仍来自 scope 表。
 *
 * 菜单里的行是纵向一列，即使它原本属于横向槽位，「左移 / 右移」也没有意义——
 * 那一列排的是所有收进来的行，顺序读的仍是该 scope 的 order。因此菜单行按 `y` 算。
 *
 * @param event 列表行的右键事件，处理时阻止默认菜单与冒泡。
 * @param store 状态句柄，透传给 menuActionsFor。
 * @param scope 槽位 key。
 * @param id 行 id。
 * @param group 行所属组。
 */
function attachMenuAt(event: MouseEvent, store: StoreHandle, scope: string, id: string, group: string): void {
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
 * 菜单项（宿主那两项）与菜单行（本插件画的行）各自带自己的右键处理、并且都已截住冒泡，
 * 走不到这里；真正会漏进来的是「菜单壳」上的空白处——那种右键不该落到菜单底下的行上，
 * 所以整扇弹层一律返回 null，交给浏览器原生菜单。
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
  // 落在弹层菜单里的右键属于那一层。宿主「更多」/「更多工具」菜单是 portal 到 body 的浮层，
  // 盖在侧边栏上面；菜单项本身不带行标记，这时若接着按坐标往底下扫，扫到的是「菜单底下第一颗
  // 按钮」——于是右键菜单项弹出的是别人的菜单、照着点还会改错行（用户 m02098 / m02112 报的）。
  // 菜单项统一带 `role="menuitem"`（宿主 CSS 也靠它判空菜单），容器上那层壳一并兜住。
  // 先判弹层再判行：弹层万一挂进了某颗受管行内部，也不能把右键算到那颗行头上。
  if (target.closest(MENU_POPUP_SELECTOR)) return null;
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
  // 混合排序打开时整条 scope 就是一个组（"all"），与设置页卡片（`listGroup`）同一把尺子：
  // 若照旧按 `groupOf` 传单组，官方组最后一颗的「下移」与第三方组第一颗的「上移」会被算成
  // 「组内已到头」而置灰——明明屏幕上它俩紧挨着（用户 m12136）。
  const state = store.get();
  const group = mixedOrder(state) ? "all" : groupOf(state, scope, id);
  openMenu(event, menuActionsFor(store, scope, id, group, axis));
}

let loMenuStore: StoreHandle | null = null;
let loRowMenuBound = false;

function installRowMenu(store: StoreHandle): void {
  loMenuStore = store;
  installMenuBindings();
  // 与 `installMenuBindings` 同一个闸门：重复安装会叠监听，而卸载只摘得掉一份，
  // 之后右键一次会开出两层菜单（第二次再也关不干净）。
  if (loRowMenuBound) return;
  loRowMenuBound = true;
  window.addEventListener("contextmenu", onWindowContextMenu, true);
}

function uninstallRowMenu(): void {
  if (loRowMenuBound) {
    window.removeEventListener("contextmenu", onWindowContextMenu, true);
    loRowMenuBound = false;
  }
  loMenuStore = null;
  uninstallMenuBindings();
}