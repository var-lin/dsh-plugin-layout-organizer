let loMenuEl: HTMLElement | null = null;
let loMenuBound = false;
// 宿主自己的右键菜单（`ctx.contextMenus`）。两套菜单互不知情：我们在 window 捕获阶段
// 截走 contextmenu，宿主的「点了别处」判断收不到这次手势，它已经打开的那扇就不会关。
// 所以开我们这扇之前先让它关——由 main.ts 把宿主服务的 close 接进来。
let closeHostMenu: (() => void) | null = null;

function bindHostMenuCloser(fn: (() => void) | null): void {
  closeHostMenu = fn;
}

function closeHostMenuIfAny(): void {
  if (!closeHostMenu) return;
  try {
    closeHostMenu();
  } catch (err) {
    // 宿主服务可能已经随插件卸载；关不掉也不该拦住我们自己的菜单。
  }
}

// 宿主弹层菜单的一条/整扇：菜单项带 `role="menuitem"`，容器带 `role="menu"`。
// 用 role 而不是类名——类名是 CSS Modules 的哈希（`_menu_6nhg2_547`），换一版构建就变。
const MENU_POPUP_SELECTOR = "[role='menu'],[role='menuitem'],[role='menuitemcheckbox'],[role='menuitemradio']";

// 弹层与视口边缘的最小间距：贴着窗口边太紧，圆角和描边都会被裁掉。
const POP_MARGIN = 8;

/**
 * 把一扇弹层放进视口：先量真实尺寸，再按锚点夹一次。
 *
 * 右键菜单是手搭的、分组菜单是 React portal，两处原本各猜一个宽高（144 / 60 与写死的
 * `innerWidth - 240 - 8`、`innerHeight - 330`）——猜小一点没事，猜大了菜单底部就被窗口裁掉，
 * 靠底的那几项点不到。量一次再夹，两边用同一把尺子。
 *
 * @param menu 弹层元素；还没挂到 DOM 上时直接返回。
 * @param x 期望的左上角横坐标。
 * @param y 期望的左上角纵坐标。
 */
function placePop(menu: HTMLElement | null, x: number, y: number): void {
  if (!menu) return;
  const width = menu.offsetWidth || 144;
  const height = menu.offsetHeight || 60;
  const left = Math.min(x, window.innerWidth - width - POP_MARGIN);
  const top = Math.min(y, window.innerHeight - height - POP_MARGIN);
  menu.style.left = Math.max(POP_MARGIN, Math.round(left)) + "px";
  menu.style.top = Math.max(POP_MARGIN, Math.round(top)) + "px";
}

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
  // 先关宿主的菜单，再关我们自己的：两扇不能同时出现。放在最前面，免得下面任何一步
  // 提前 return 时宿主那扇还留在屏幕上。
  closeHostMenuIfAny();
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
    if (action.shortcut) {
      const hint = document.createElement("span");
      hint.className = CLASS.popKey;
      hint.setAttribute("aria-hidden", "true");
      hint.textContent = action.shortcut;
      item.appendChild(hint);
    }
    item.onclick = function () {
      closeMenu();
      action.run();
    };
    wrap.appendChild(item);
    viewport.appendChild(wrap);
  }
  menu.appendChild(viewport);
  document.body.appendChild(menu);
  placePop(menu, event.clientX, event.clientY);
  loMenuEl = menu;
}

interface MenuAction {
  label: string;
  // 官方菜单每项左侧的 14px 线性图标；不给就只剩文字，不会留下空的图标列。
  icon?: string;
  // 右侧的快捷键提示（灰色小字），只给真正绑了组合键的那几项。
  shortcut?: string;
  disabled: boolean;
  run: () => void;
}

function insideMenu(target: EventTarget | null): boolean {
  return !!(loMenuEl && target && target instanceof Node && loMenuEl.contains(target));
}

function onMenuPointerDown(event: PointerEvent): void {
  if (!loMenuEl) return;
  // 菜单内部不关（由它自己的 click 关）。外部左键、右键都要关：右键关掉是为了让紧接着
  // 打开的宿主菜单或我们自己的新菜单不跟旧菜单叠在一起；中键、侧键不动。
  if (insideMenu(event.target)) return;
  if (event.button !== 0 && event.button !== 2) return;
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
    if (isIntoMoreRow(state, scope, ids[i])) continue;
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
      // 两个方向都能用手势：进更多是 Ctrl+右键，出更多也是同一颗键（否则「更多」里的行
      // 右键看不出快捷键，用户 m01568 截图里「出更多」那行是空的）。
      shortcut: gestureText(store.get().options.gestureMore) + " + " + t("gesture.right"),
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
      shortcut: hidden ? undefined : gestureText(store.get().options.gestureStash) + " + " + t("gesture.left"),
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
        next.kinds[rowKey(scope, id)] = official ? "third" : "official";
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

// 鼠标手势：前缀 + 左键 = 收起 / 恢复，前缀 + 右键 = 进更多 / 出更多。
// 行可能来自四处不同的东西（槽位行、设置页卡片行、「更多」菜单行、悬浮框里的行），各自的
// 标记属性不一样，先统一认成 scope + id 再动作；前缀只比修饰键，鼠标键固定。
interface GestureTarget {
  scope: string;
  id: string;
}

function gestureTargetOf(target: EventTarget | null, x?: number, y?: number): GestureTarget | null {
  if (!target || !(target instanceof Element)) return null;
  if (target.closest("input, textarea, [contenteditable='true'], [contenteditable='']")) return null;
  let el = target.closest("[data-lo-more-key]") as HTMLElement | null;
  if (el) {
    const scope = el.getAttribute("data-lo-more-scope") || "";
    const id = el.getAttribute("data-lo-more-id") || "";
    if (scope && id) return { scope: scope, id: id };
  }
  el = target.closest("[data-lo-stash-scope]") as HTMLElement | null;
  if (el) {
    const scope = el.getAttribute("data-lo-stash-scope") || "";
    const id = el.getAttribute("data-lo-stash-id") || "";
    if (scope && id) return { scope: scope, id: id };
  }
  el = target.closest("[data-lo-list-id]") as HTMLElement | null;
  if (el) {
    const box = el.closest("[data-lo-list-scope]") as HTMLElement | null;
    const scope = box ? box.getAttribute("data-lo-list-scope") || "" : "";
    const id = el.getAttribute("data-lo-list-id") || "";
    if (scope && id) return { scope: scope, id: id };
  }
  el = target.closest(rowSelector()) as HTMLElement | null;
  if (el) {
    const scope = el.getAttribute(MARKS.scope) || "";
    const id = el.getAttribute(MARKS.id) || "";
    if (scope && id) return { scope: scope, id: id };
  }
  if (typeof x !== "number" || typeof y !== "number") return null;
  const stack = document.elementsFromPoint(x, y);
  for (let i = 0; i < stack.length; i++) {
    const hit = gestureTargetOf(stack[i]);
    if (hit) return hit;
  }
  return null;
}

function modifiersMatch(event: MouseEvent, keys: string[]): boolean {
  for (let i = 0; i < MODIFIER_KEYS.length; i++) {
    const key = MODIFIER_KEYS[i];
    // 统一按 `=== true` 取：宿主事件里缺省的修饰键是 undefined，直接用会和 false 比不相等。
    let down = event.metaKey === true;
    if (key === "control") down = event.ctrlKey === true;
    else if (key === "alt") down = event.altKey === true;
    else if (key === "shift") down = event.shiftKey === true;
    if (down !== (keys.indexOf(key) >= 0)) return false;
  }
  return true;
}

// 自己数位移、不走 click：拖动控制器在 document 上的「吞掉跟手 click」比 window 捕获晚一步，
// 靠 click 判定会在手势 + 拖动刚起步时就把行收走。
let loGesture: GestureTarget | null = null;
let loGestureX = 0;
let loGestureY = 0;
let loGestureGuardUntil = 0;

function onWindowPointerDown(event: PointerEvent): void {
  loGesture = null;
  const store = loMenuStore;
  if (!store || event.button !== 0) return;
  if (!modifiersMatch(event, store.get().options.gestureStash)) return;
  const hit = gestureTargetOf(event.target, event.clientX, event.clientY);
  if (!hit) return;
  loGesture = hit;
  loGestureX = event.clientX;
  loGestureY = event.clientY;
}

// 指针被系统 / 触摸取消时不会再来 pointerup：留着旧目标会让下一次 pointerup 误收别行。
function onWindowPointerCancel(): void {
  loGesture = null;
}

function onWindowPointerUp(event: PointerEvent): void {
  const hit = loGesture;
  loGesture = null;
  const store = loMenuStore;
  if (!hit || !store || event.button !== 0) return;
  if (!modifiersMatch(event, store.get().options.gestureStash)) return;
  if (Math.abs(event.clientX - loGestureX) > LO_DRAG_THRESHOLD || Math.abs(event.clientY - loGestureY) > LO_DRAG_THRESHOLD) return;
  event.preventDefault();
  // 这里绝不能 stopPropagation：拖动控制器（drag-frame.ts）在 document 捕获阶段等 pointerup 收尾，
  // 截在 window 上会让它以为指针一直按着——手势收起一颗之后整页进入拖动态、鼠标松开也不结束
  // （用户 m01790）。click 已由下面的守门拦截，不需要再拦 pointerup。
  loGestureGuardUntil = Date.now() + LO_CLICK_SUPPRESS_MS;
  store.update(function (next: PluginState): void {
    // 已经收起的行，手势反过来就是恢复；没收起过才收。同一颗键在两处都讲得通。
    toggleHidden(next, hit.scope, hit.id);
  });
  // 手势也是「动过这一行」：清掉新按钮标红，别让它恢复后又红着（用户 m02493）。
  clearFreshRow(hit.scope, hit.id);
}

// 手势之后紧跟的那一下 click 属于宿主按钮本身，别让它再触发一次宿主的动作。
function onWindowClickGuard(event: MouseEvent): void {
  if (Date.now() >= loGestureGuardUntil) return;
  loGestureGuardUntil = 0;
  event.preventDefault();
  event.stopPropagation();
}

function onWindowContextMenu(event: MouseEvent): void {
  const store = loMenuStore;
  if (!store) return;
  // 手势只在修饰键完全匹配时才接管；否则必须原样放行——位置管理卡片行的菜单挂在 React 的
  // `onContextMenu` 上，这里若先 preventDefault + stopPropagation，事件到不了 React 根节点，
  // 普通右键就再也弹不出菜单（用户 m01368 的回归）。
  if (modifiersMatch(event, store.get().options.gestureMore)) {
    const hit = gestureTargetOf(event.target, event.clientX, event.clientY);
    if (!hit) return;
    const state = store.get();
    if (isHidden(state, hit.scope, hit.id) || !canTuckIntoMore(hit.scope, hit.id)) return;
    event.preventDefault();
    event.stopPropagation();
    // 同一节点上还有「更多」菜单自己的 contextmenu 监听，它会再开一次行菜单；
    // 用 stopImmediatePropagation 把后续监听一并停掉（用户 m01568）。
    event.stopImmediatePropagation();
    store.update(function (next: PluginState): void {
      toggleIntoMore(next, hit.scope, hit.id);
    });
    return;
  }
  const row = managedRowFrom(event.target, event.clientX, event.clientY);
  if (!row) return;
  const scope = row.getAttribute(MARKS.scope);
  const id = row.getAttribute(MARKS.id);
  if (!scope || !id) return;
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
let loRowMenuOff: (() => void) | null = null;

/**
 * 一组 window 捕获监听的挂 / 摘。
 *
 * 「装的时候一个个 add、卸的时候一个个 remove」写过三遍（行菜单、「更多」菜单、拖拽骨架），
 * 漏一个就是监听器留到下一次装载，所以收成一处：返回的 disposer 一定是全摘。
 *
 * @param handlers 事件名 → 处理函数。
 * @returns 摘掉这一整组的函数。
 */
function bindWindowCapture(handlers: Record<string, (event: any) => void>): () => void {
  const types = Object.keys(handlers);
  let i;
  for (i = 0; i < types.length; i++) window.addEventListener(types[i], handlers[types[i]], true);
  return function (): void {
    for (let j = 0; j < types.length; j++) window.removeEventListener(types[j], handlers[types[j]], true);
  };
}

function installRowMenu(store: StoreHandle): void {
  loMenuStore = store;
  installMenuBindings();
  // 与 `installMenuBindings` 同一个闸门：重复安装会叠监听，而卸载只摘得掉一份，
  // 之后右键一次会开出两层菜单（第二次再也关不干净）。
  if (loRowMenuBound) return;
  loRowMenuBound = true;
  loRowMenuOff = bindWindowCapture({
    contextmenu: onWindowContextMenu,
    pointerdown: onWindowPointerDown,
    pointerup: onWindowPointerUp,
    pointercancel: onWindowPointerCancel,
    click: onWindowClickGuard
  });
}

function uninstallRowMenu(): void {
  if (loRowMenuOff) {
    loRowMenuOff();
    loRowMenuOff = null;
  }
  loRowMenuBound = false;
  loMenuStore = null;
  uninstallMenuBindings();
}
