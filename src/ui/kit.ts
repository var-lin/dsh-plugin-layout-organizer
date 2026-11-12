
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
  // 标题下的一句说明（比正文小一号、颜色浅）；不属于任何一行，别塞进行自己的 hint。
  note?: any;
  // 传了 `onToggleCollapse` 时标题行变成折叠开关：点标题（不含右侧动作区）收起 / 展开卡片正文。
  // `collapsed` 是「当前已收起」，由调用方存进 store。
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  children?: any;
}

interface ChipProps {
  active?: boolean;
  title?: string;
  disabled?: boolean;
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
      warn("render failed; this panel stays empty: " + errText(err));
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
