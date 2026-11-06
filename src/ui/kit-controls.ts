
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
                // 焦点在右侧动作区上时，回车 / 空格归那颗按钮，不能顺手把卡片折了。
                if (event && event.target && event.target.closest && event.target.closest(".lo-card-action")) return;
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
 * 行末那颗「进更多 / 出更多」按钮。
 *
 * 设置页卡片与收纳包面板两处的行都要它，行为与禁用规则一字不差：能收时是「进更多」，
 * 已经收进去时是「出更多」；不能收的行（设置页导航、三颗「更多」入口）照样画出来，
 * 只是禁用——空一格会让同一张卡里的名称区左右参差（用户 m02576#2）。宿主没有「更多」
 * 菜单时整颗不画：那种宿主上这颗按钮本来就不出现。
 *
 * @param props `intoMore` 表示这一行当前已收进「更多」；`onToggle` 缺省即禁用。
 * @returns 按钮元素；宿主没有「更多」且不可收时为 null。
 */
function IntoMoreButton(props: { intoMore: boolean; onToggle?: () => void }): any {
  const enabled = typeof props.onToggle === "function";
  if (!enabled && !moreAvailable()) return null;
  return h(Btn, {
    act: "more",
    // 这一行正因为「已进更多」而变淡时，这颗按钮不跟着淡——它是把它带回来的入口（用户 m09308#1）。
    lit: props.intoMore,
    variant: props.intoMore ? "soft" : undefined,
    disabled: !enabled,
    onClick: props.onToggle,
    title: !enabled ? t("action.intoMoreBlocked") : props.intoMore ? t("action.outOfMore") : t("action.intoMore")
  }, props.intoMore ? t("action.outOfMore") : t("action.intoMore"));
}
