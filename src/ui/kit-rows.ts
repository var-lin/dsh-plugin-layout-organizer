interface RowItemProps {
  entry: RowEntry;
  // 这一行属于哪一处槽位：图标要按 scope + id 从原按钮上取（见 liveRowIcon）。
  scope?: string;
  group?: string;
  kind?: string;
  draggable?: boolean;
  hidden?: boolean;
  canUp?: boolean;
  canDown?: boolean;
  // 名称区可否点击跳转；为假时名称区灰着、点不动（见 rowNavigable）。
  canOpen?: boolean;
  // 名称区的悬停提示：说清点下去会去哪儿，或说明为什么点不动。
  openTitle?: string;
  onOpen?: () => void;
  onMenu?: (event: any) => void;
  // 「官方 / 第三方」判断按钮：三颗「更多」入口固定算官方，靠 kindLocked 灰掉，不另开开关。
  kindLocked?: boolean;
  onToggleKind?: () => void;
  onUp?: () => void;
  onDown?: () => void;
  onToggleHidden?: () => void;
  // 这一行是否已收进官方「更多」菜单；只有能收进去的槽位才画可点的这颗（见 moreScopeOk）。
  // 不能收的行也画，但画成禁用的（见 RowItem 里那段说明）。
  intoMore?: boolean;
  onToggleMore?: () => void;
  // 这一行是不是「装插件之后才冒出来的新按钮」（见 isFreshRow）：名字标红（见 styles 的 `.lo-row-name[data-fresh]`）。
  fresh?: boolean;
}

function useStoreTick(store: StoreLike): number {
  return useTicker([store], function (bump: () => void) {
    return store.subscribe(bump);
  });
}

/**
 * slot 账本没有 React 绑定，这里订阅各 slot 在变化时重渲染。
 *
 * @param ctx 上下文，经 ctx.slots 订阅各槽位。
 * @returns 递增的计数，供组件每次收到槽位变化后重新渲染。
 */
function useSlotsTick(ctx: CtxLike): number {
  return useTicker([ctx], function (bump: () => void) {
    const disposers: Array<() => void> = [];
    let i: number;
    for (i = 0; i < SCOPE_KEYS.length; i++) {
      const slotKey: string = SLOT_OF_SCOPE[SCOPE_KEYS[i]];
      // 不进 slot 体系的 scope（右侧边栏的 guide 卡片）没有槽位可订阅，改由 useRevisionTick 驱动。
      if (!slotKey) continue;
      try {
        disposers.push(ctx.slots.subscribe(slotKey, function () {
          bump();
        }));
      } catch (err) {
        // 本构建未声明的 slot 自然永远不会触发
      }
    }
    return function () {
      let j: number;
      for (j = 0; j < disposers.length; j++) {
        try {
          disposers[j]();
        } catch (err) {
          // 退订失败不影响别的槽位
        }
      }
    };
  });
}


/**
 * 管理列表里的一行。
 *
 * 名称区（色块 + 名称 + id）是一块可点区域，点它跳转到这个按钮对应的页面，
 * 行为与收纳包里的同一行一致；右侧四个动作按钮不受影响。
 * 界面上本来点不动的行（`canOpen` 为假）名称区灰着且不可点——可点却毫无反应比灰着更像坏掉。
 *
 * @param props 行数据与各动作回调，见 RowItemProps。
 * @returns 列表行元素。
 */
function RowItem(props: RowItemProps): any {
  const entry = props.entry;
  const canOpen = props.canOpen === true;
  // 图标只认原按钮自己那颗；没有就用名字首字（见 RowIcon）。
  const icon = rowIconOf(props.scope || "", entry.id);
  return h("div", {
    className: "lo-row",
    "data-lo-list-id": entry.id,
    "data-lo-list-group": props.group,
    "data-locked": props.draggable ? undefined : "1",
    // 收进「更多」的行和收进悬浮框的行一样退到背景里：两种「不在主列表」的状态
    // 都该一眼看出来，别只让其中一种变淡（用户 m09249#1）。
    "data-hidden": props.hidden || props.intoMore ? "1" : undefined,
    onContextMenu: props.onMenu
  },
    // 不能拖的行（三颗钉住的「更多」入口）不画把手，但保留那 14px 的占位：
    // 把手一撤，名称就会跟着左移，和其余行对不齐。
    h("span", { className: "lo-grip", "data-locked": props.draggable ? undefined : "1", title: props.draggable ? t("action.drag") : undefined }, "\u22ee\u22ee"),
    h("button", {
      type: "button",
      className: "lo-row-open",
      disabled: !canOpen,
      title: props.openTitle || undefined,
      onClick: function () {
        if (canOpen && props.onOpen) props.onOpen();
      }
    },
      h(RowIcon, { svg: icon, text: entry.label }),
      // 新按钮不额外挂标本（用户 m02614）：名字本身就是提示，标红即可，不必再多一列角标。
      h("span", {
        className: "lo-row-name",
        title: entry.label,
        "data-fresh": props.fresh ? "1" : undefined
      }, entry.label),
      h("span", { className: "lo-row-id" }, entry.id)
    ),
    h(Btn, { act: "kind", onClick: props.onToggleKind, disabled: props.kindLocked === true, title: props.kindLocked ? t("action.kindBlocked") : t("action.toggleKind") }, props.kind === "official" ? t("kind.official") : t("kind.third")),
    h(Btn, { act: "up", size: "icon", onClick: props.onUp, disabled: !props.canUp, title: t("action.up") }, "\u2191"),
    h(Btn, { act: "down", size: "icon", onClick: props.onDown, disabled: !props.canDown, title: t("action.down") }, "\u2193"),
    // 「进更多」排在「收起」之前：一级比一级退得更远，与右键菜单同一顺序（见 menuActionsFor）。
    // 两个动作都不用实心底色：收起 / 恢复这一对原本就靠文字说清方向，多一块实心黑只会让
    // 同一行的四个按钮看起来三六九等（用户图3 反馈）。
    h(IntoMoreButton, { intoMore: props.intoMore === true, onToggle: props.onToggleMore }),
    h(Btn, {
      act: "stash",
      // 同上：收进悬浮框的行，「恢复」这颗按钮保持醒目。
      lit: props.hidden,
      variant: props.hidden ? "soft" : undefined,
      onClick: props.onToggleHidden,
      title: props.hidden ? t("action.restore") : t("action.stash")
    }, props.hidden ? t("action.restore") : t("action.stash"))
  );
}
