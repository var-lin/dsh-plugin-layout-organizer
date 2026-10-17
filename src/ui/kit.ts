
// store 就地修改状态对象，React 比较不了引用；`subscribe` 是唯一通知渠道。
interface StoreLike {
  get(): any;
  subscribe(fn: () => void): () => void;
  update(mutator: (state: any) => void): void;
}

// `CtxLike` 定义在 types/state.ts，勿在此重复声明——同名 interface 属性不同会让合并失败（ts2717）。

interface SwitchProps {
  checked: boolean;
  label?: string;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

interface FieldProps {
  label?: any;
  hint?: any;
  stack?: boolean;
  // 「下属行」：label 前加归属标记并缩进，标明「谁属于谁」。
  sub?: boolean;
  // 点击整行切换折叠/展开；箭头只做显示，不单独可点。
  onToggleCollapse?: () => void;
  collapsed?: boolean;
  // 上级总开关关着：这一行整体变灰表示「不生效」，但仍然可点（点亮它会顶起总开关）。
  gated?: boolean;
  children?: any;
}

interface CardProps {
  title?: any;
  // 标题行右侧的动作区（如「恢复本组默认顺序」）；不传就只有标题。
  action?: any;
  children?: any;
}

interface ChipProps {
  active?: boolean;
  title?: string;
  onClick?: (event: any) => void;
  children?: any;
}

interface BtnProps {
  variant?: string;
  size?: string;
  disabled?: boolean;
  title?: string;
  // 两步确认的「已上膛」状态，只由 ConfirmBtn 传；样式表据此染色。
  armed?: boolean;
  // 文案前的图标（构建期内联的 <svg> 文档），见 Icon。
  icon?: string;
  // 图标的素材名（形如 "github"），样式表据它做光学校正，见 Icon。
  iconName?: string;
  onClick?: (event: any) => void;
  children?: any;
}

/**
 * 把构建期内联的 `<svg>` 文档渲染成图标。
 *
 * React 不接受把字符串当元素渲染，而构建产物里的图标就是一段 `<svg>…</svg>` 文本，
 * 因此走 `dangerouslySetInnerHTML`——内容全部来自本包自己的 `assets/icons/`，不含任何用户数据。
 *
 * @param props.svg 归一化后的完整 `<svg>` 文档。
 * @param props.className 额外的类名。
 * @param props.name 素材名；不同素材的画布留白差异很大（导出/导入几乎顶满，GitHub 只占 84%），
 *   样式表按 `data-ico` 逐个微调盒子，让一排按钮的图标看起来一样大。
 * @returns 图标容器元素。
 */
function Icon(props: { svg: string; className?: string; name?: string }): any {
  return h("span", {
    className: "lo-ico" + (props.className ? " " + props.className : ""),
    "data-ico": props.name || undefined,
    "aria-hidden": "true",
    dangerouslySetInnerHTML: { __html: props.svg }
  });
}

interface RowEntry {
  id: string;
  label: any;
}

interface RowItemProps {
  entry: RowEntry;
  group?: string;
  kind?: string;
  self?: boolean;
  draggable?: boolean;
  hidden?: boolean;
  canUp?: boolean;
  canDown?: boolean;
  onMenu?: (event: any) => void;
  onToggleKind?: () => void;
  onUp?: () => void;
  onDown?: () => void;
  onToggleHidden?: () => void;
}

function useStoreTick(store: StoreLike): number {
  const pair = useState(0);
  const tick = pair[0];
  const setTick = pair[1];
  useEffect(function () {
    return store.subscribe(function () {
      setTick(function (value: number) {
        return value + 1;
      });
    });
  }, [store]);
  return tick;
}

/**
 * slot 账本没有 React 绑定，这里订阅各 slot 在变化时重渲染。
 *
 * @param ctx 上下文，经 ctx.slots 订阅各槽位。
 * @returns 递增的计数，供组件每次收到槽位变化后重新渲染。
 */
function useSlotsTick(ctx: CtxLike): number {
  const pair = useState(0);
  const tick = pair[0];
  const setTick = pair[1];
  useEffect(function () {
    const disposers: Array<() => void> = [];
    let i: number;
    for (i = 0; i < SCOPE_KEYS.length; i++) {
      const slotKey: string = SLOT_OF_SCOPE[SCOPE_KEYS[i]];
      try {
        disposers.push(ctx.slots.subscribe(slotKey, function () {
          setTick(function (value: number) {
            return value + 1;
          });
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
          // 已经不存在了
        }
      }
    };
  }, [ctx]);
  return tick;
}

function Switch(props: SwitchProps): any {
  return h("button", {
    type: "button",
    className: "lo-switch",
    role: "switch",
    "aria-checked": props.checked ? "true" : "false",
    "aria-label": props.label || undefined,
    disabled: props.disabled === true,
    onClick: function () {
      if (props.disabled !== true) props.onChange(!props.checked);
    }
  });
}

function Field(props: FieldProps): any {
  const toggle = props.onToggleCollapse;
  // 箭头只在「这一行有下属」时出现且不可单独点击
  const arrow = toggle
    ? h("span", {
        className: "lo-caret",
        "data-collapsed": props.collapsed === false ? undefined : "1",
        "aria-hidden": "true"
      }, "\u25be")
    : null;

  return h("div", {
    className: "lo-field" + (props.sub ? " lo-field-sub" : ""),
    "data-stack": props.stack ? "1" : undefined,
    "data-collapsible": toggle ? "1" : undefined,
    "data-collapsed": toggle ? (props.collapsed === false ? undefined : "1") : undefined,
    "data-gated": props.gated ? "1" : undefined,
    // 点右侧控件区不算折叠：控件自己管自己，行折叠只由点文字/箭头触发。
    onClick: toggle
      ? function (event: any) {
          if (event && event.target && event.target.closest && event.target.closest(".lo-field-control")) return;
          toggle();
        }
      : undefined
  },
    h("div", { className: "lo-field-text" },
      // 短横线是标题的一部分（`.lo-sub-dash`，占 14px 悬挂在缩进区外），标题与描述因此同一条左边线。
      props.sub
        ? h("div", { className: "lo-field-label" }, h("span", { className: "lo-sub-dash", "aria-hidden": "true" }, "\u2013"), props.label ?? "")
        : h("div", { className: "lo-field-label" }, props.label),
      props.hint ? h("div", { className: "lo-field-hint" }, props.hint) : null
    ),
    toggle ? h("div", { className: "lo-field-arrow" }, arrow) : null,
    h("div", { className: "lo-field-control" }, props.children)
  );
}

/**
 * 带标题的卡片；标题行可选右侧动作区。
 *
 * 动作放在标题行而不是卡片底部：底部那一条会把「这张卡片能做什么」藏在列表之后，
 * 卡片越长越难找到，而标题右侧是用户视线第一落点。
 *
 * @param props 标题、右侧动作与卡片内容，见 CardProps。
 * @returns 卡片元素。
 */
function Card(props: CardProps): any {
  return h("section", { className: "lo-card" },
    props.title || props.action
      ? h("header", { className: "lo-card-head" },
          props.title ? h("span", { className: "lo-card-title" }, props.title) : null,
          props.action ? h("span", { className: "lo-card-action" }, props.action) : null
        )
      : null,
    h("div", { className: "lo-card-body" }, props.children)
  );
}

function Chip(props: ChipProps): any {
  return h("button", {
    type: "button",
    className: "lo-chip",
    "aria-pressed": props.active ? "true" : "false",
    onClick: props.onClick,
    title: props.title || undefined
  }, props.children);
}

function Btn(props: BtnProps): any {
  return h("button", {
    type: "button",
    className: "lo-btn",
    "data-variant": props.variant || undefined,
    "data-size": props.size || undefined,
    "data-armed": props.armed ? "1" : undefined,
    disabled: props.disabled === true,
    title: props.title || undefined,
    onClick: props.onClick
  }, props.icon ? h(Icon, { svg: props.icon, name: props.iconName }) : null, props.children);
}

/**
 * 危险操作的两步确认：第一次点只上膛（换文案），三秒内再点一次才真正执行；超时自动解除。
 *
 * @param props.label 初始按钮文案。
 * @param props.confirmLabel 已上膛时的按钮文案。
 * @param props.onConfirm 上膛状态下再次点击时执行的动作。
 * @param props.variant 可选的按钮样式。
 * @param props.title 可选的悬停提示，上膛时保留原提示（文案已在按钮上变化）。
 * @param props.disabled 为真时按钮变灰且不响应点击。
 * @param props.icon 文案前的图标（构建期内联的 <svg> 文档）。
 * @param props.iconName 图标素材名，用于按素材做光学校正。
 * @returns 按钮元素。
 */
function ConfirmBtn(props: { label: string; confirmLabel: string; onConfirm: () => void; variant?: string; title?: string; disabled?: boolean; icon?: string; iconName?: string }): any {
  const pair = useState(false);
  const armed = pair[0];
  const setArmed = pair[1];
  // 先上膛、后变灰时要把膛线卸掉，否则「看不见的已上膛」会在条件恢复后立刻生效。
  const disabled = props.disabled === true;
  useEffect(function () {
    if (disabled && armed) setArmed(false);
  }, [disabled]);
  useEffect(function () {
    if (!armed) return undefined;
    const timer = window.setTimeout(function () {
      setArmed(false);
    }, 3000);
    return function () {
      window.clearTimeout(timer);
    };
  }, [armed]);
  return h(Btn, {
    variant: props.variant,
    title: props.title,
    disabled: disabled,
    armed: armed,
    icon: props.icon,
    iconName: props.iconName,
    onClick: function () {
      if (!armed) {
        setArmed(true);
        return;
      }
      setArmed(false);
      props.onConfirm();
    }
  }, armed ? props.confirmLabel : props.label);
}

/**
 * 管理列表里的一行；`self` 是插件自己的设置条目（色块颜色不同，其余行为一致）。
 *
 * @param props 行数据与各动作回调，见 RowItemProps。
 * @returns 列表行元素。
 */
function RowItem(props: RowItemProps): any {
  const entry = props.entry;
  return h("div", {
    className: "lo-row",
    "data-lo-list-id": entry.id,
    "data-lo-list-group": props.group,
    "data-locked": props.draggable ? undefined : "1",
    "data-hidden": props.hidden ? "1" : undefined,
    onContextMenu: props.onMenu
  },
    h("span", { className: "lo-grip", title: props.draggable ? t("action.drag") : undefined }, "\u22ee\u22ee"),
    h("span", { className: "lo-swatch", "data-kind": props.self ? "self" : props.kind }),
    h("span", { className: "lo-row-name", title: entry.label }, entry.label),
    h("span", { className: "lo-row-id" }, entry.id),
    h(Btn, { onClick: props.onToggleKind, title: t("action.toggleKind") }, props.kind === "official" ? t("kind.official") : t("kind.third")),
    h(Btn, { size: "icon", onClick: props.onUp, disabled: !props.canUp, title: t("action.up") }, "\u2191"),
    h(Btn, { size: "icon", onClick: props.onDown, disabled: !props.canDown, title: t("action.down") }, "\u2193"),
    h(Btn, {
      variant: props.hidden ? "primary" : undefined,
      onClick: props.onToggleHidden,
      title: props.hidden ? t("action.restore") : t("action.stash")
    }, props.hidden ? t("action.restore") : t("action.stash"))
  );
}