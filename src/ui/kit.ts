
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
  onClick?: (event: any) => void;
  children?: any;
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

// slot 账本没有 React 绑定，这里订阅各 slot 在变化时重渲染。
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

function Card(props: CardProps): any {
  return h("section", { className: "lo-card" },
    props.title ? h("header", { className: "lo-card-head" }, props.title) : null,
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
    disabled: props.disabled === true,
    title: props.title || undefined,
    onClick: props.onClick
  }, props.children);
}

// 危险操作的两步确认：第一次点只上膛（换文案），三秒内再点一次才真正执行；超时自动解除。
function ConfirmBtn(props: { label: string; confirmLabel: string; onConfirm: () => void; variant?: string }): any {
  const pair = useState(false);
  const armed = pair[0];
  const setArmed = pair[1];
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

// 管理列表里的一行；`self` 是插件自己的设置条目（色块颜色不同，其余行为一致）。
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