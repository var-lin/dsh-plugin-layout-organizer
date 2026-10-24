
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
  // 传了 `onToggleCollapse` 时标题行变成折叠开关：点标题（不含右侧动作区）收起 / 展开卡片正文。
  // `collapsed` 是「当前已收起」，由调用方存进 store。
  collapsed?: boolean;
  onToggleCollapse?: () => void;
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
  // 这是行内第几个动作（`kind` / `up` / `down` / `more` / `stash`）。样式表按它定列宽，
  // 让每一行同一位置的那个按钮宽度一致——文案长短（官方 / 第三方）不该把整排推得左右参差。
  act?: string;
  // 这一行正因为它自己「已被移走」而变淡时，这颗按钮要不要保持醒目（见 RowItem）。
  // 只在这颗按钮上写 data-lit，样式表据此把它的透明度拉回 1。
  lit?: boolean;
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

/**
 * 渲染期的兜底：某一处列表组件炸掉，不该把整页带走——宿主把未捕获的渲染错误当成页面
 * 错误，整块界面就白了（用户报过一次「插件一启用，DSH 就打不开」）。
 * 这里只吞本插件自己画的这几块：真炸了就让那一块显示成空，其余照旧。
 *
 * 类组件只能从 `React.Component` 上取；取不到（测试用的桩）时直接透传 children。
 */
let loBoundaryBase: any = null;

function loBoundary(): any {
  if (loBoundaryBase) return loBoundaryBase;
  const Base: any = React && (React as any).Component ? (React as any).Component : null;
  if (!Base) return null;
  loBoundaryBase = class LOErrorBoundary extends Base {
    constructor(props: any) {
      super(props);
      (this as any).state = { failed: false };
    }

    static getDerivedStateFromError(): any {
      return { failed: true };
    }

    componentDidCatch(err: any): void {
      warn("render failed; this panel stays empty: " + (err && err.message ? err.message : String(err)));
    }

    render(): any {
      const self = this as any;
      if (self.state && self.state.failed) return null;
      return self.props ? self.props.children : null;
    }
  };
  return loBoundaryBase;
}

/**
 * 给一块界面套上兜底边界。
 *
 * @param props.children 被保护的内容。
 * @returns 包好边界的元素；环境里没有 React 类组件时原样返回 children。
 */
function Boundary(props: { children?: any }): any {
  const Base = loBoundary();
  if (!Base) return props.children;
  return h(Base, null, props.children);
}

/**
 * 行首那颗图标。
 *
 * 原按钮自己画了图标就照搬（见 `rowIconOf`）；没画就用这一行的名字首字顶上——有个字母
 * 总比空一格好认，也不需要去别处猜图标。两种情况都占同样宽的一格，整列名称的左边缘才齐。
 *
 * @param props.svg 原按钮里的 `<svg>` 源码，可为空。
 * @param props.text 这一行的名字，取首字当图标用。
 * @returns 图标元素。
 */
function RowIcon(props: { svg?: string; text?: string }): any {
  if (props.svg) return h(Icon, { svg: props.svg, className: "lo-row-ico" });
  return h("span", { className: "lo-row-ico lo-row-ico-text", "aria-hidden": "true" }, rowInitial(props.text));
}

/**
 * 名字首字：用来顶替缺失的图标。
 *
 * 取第一个非空白字符并大写（拉丁字母），中文取第一个字。名字为空时回空串，那一格就空着。
 *
 * @param text 行名字。
 * @returns 一个字符的图标文案。
 */
function rowInitial(text?: string): string {
  const plain = (text || "").replace(/\s+/g, " ").trim();
  if (!plain) return "";
  const first = Array.from(plain)[0] || "";
  return first.toUpperCase();
}

interface RowItemProps {
  entry: RowEntry;
  // 这一行属于哪一处槽位：图标要按 scope + id 从原按钮上取（见 liveRowIcon）。
  scope?: string;
  // 图标不按 scope 取、由调用方直接给（宿主自己那两项动作行），给了就不再查 liveRowIcon。
  icon?: { svg: string; src: string };
  // id 一列显示的文案；缺省显示 `entry.id`。动作行的 id 带虚拟槽位前缀，列里只显示后半段。
  idText?: string;
  group?: string;
  kind?: string;
  self?: boolean;
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
  // 「官方 / 第三方」判断按钮：动作行固定算官方，没有可切的分支，传假就不画。
  canToggleKind?: boolean;
  onToggleKind?: () => void;
  onUp?: () => void;
  onDown?: () => void;
  // 收起 / 恢复按钮：动作行永远在「更多」里，没有收起这一说，传假就不画。
  canStash?: boolean;
  onToggleHidden?: () => void;
  // 这一行是否已收进官方「更多」菜单；只有能收进去的槽位才画这个按钮（见 moreScopeOk）。
  intoMore?: boolean;
  onToggleMore?: () => void;
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
  const toggle = props.onToggleCollapse;
  const open = props.collapsed !== true;
  return h("section", {
    className: "lo-card",
    "data-collapsible": toggle ? "1" : undefined,
    "data-open": toggle ? (open ? "1" : "0") : undefined
  },
    props.title || props.action
      ? h("header", {
          className: "lo-card-head",
          // 点右侧动作区不算折叠：那是卡片级动作，自己管自己。
          onClick: toggle
            ? function (event: any) {
                if (event && event.target && event.target.closest && event.target.closest(".lo-card-action")) return;
                toggle();
              }
            : undefined,
          role: toggle ? "button" : undefined,
          tabIndex: toggle ? 0 : undefined,
          onKeyDown: toggle
            ? function (event: any) {
                if (event && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  toggle();
                }
              }
            : undefined
        },
          props.title ? h("span", { className: "lo-card-title" }, props.title) : null,
          props.action ? h("span", { className: "lo-card-action" }, props.action) : null,
          // 小三角在标题行最右端（动作区之后）：它是整行的状态指示，不该插在标题与动作之间。
          toggle ? h("span", { className: "lo-card-caret", "aria-hidden": "true" }, "\u25be") : null
        )
      : null,
    // 收起时整段正文不渲染：留着高度会让「折叠」看起来没生效。
    toggle && !open ? null : h("div", { className: "lo-card-body" }, props.children)
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
    "data-act": props.act || undefined,
    "data-lit": props.lit ? "1" : undefined,
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
    h("span", { className: "lo-grip", title: props.draggable ? t("action.drag") : undefined }, "\u22ee\u22ee"),
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
      h("span", { className: "lo-row-name", title: entry.label }, entry.label),
      h("span", { className: "lo-row-id" }, entry.id)
    ),
    props.canToggleKind === false ? null : h(Btn, { act: "kind", onClick: props.onToggleKind, title: t("action.toggleKind") }, props.kind === "official" ? t("kind.official") : t("kind.third")),
    h(Btn, { act: "up", size: "icon", onClick: props.onUp, disabled: !props.canUp, title: t("action.up") }, "\u2191"),
    h(Btn, { act: "down", size: "icon", onClick: props.onDown, disabled: !props.canDown, title: t("action.down") }, "\u2193"),
    // 「进更多」排在「收起」之前：一级比一级退得更远，与右键菜单同一顺序（见 menuActionsFor）。
    // 两个动作都不用实心底色：收起 / 恢复这一对原本就靠文字说清方向，多一块实心黑只会让
    // 同一行的四个按钮看起来三六九等（用户图3 反馈）。
    props.onToggleMore
      ? h(Btn, {
        act: "more",
        // 这一行正因为「已进更多」而变淡时，这颗按钮不跟着淡——它是把它带回来的入口（用户 m09308#1）。
        lit: props.intoMore,
        variant: props.intoMore ? "soft" : undefined,
        onClick: props.onToggleMore,
        title: props.intoMore ? t("action.outOfMore") : t("action.intoMore")
      }, props.intoMore ? t("action.outOfMore") : t("action.intoMore"))
      : null,
    props.canStash === false ? null : h(Btn, {
      act: "stash",
      // 同上：收进悬浮框的行，「恢复」这颗按钮保持醒目。
      lit: props.hidden,
      variant: props.hidden ? "soft" : undefined,
      onClick: props.onToggleHidden,
      title: props.hidden ? t("action.restore") : t("action.stash")
    }, props.hidden ? t("action.restore") : t("action.stash"))
  );
}