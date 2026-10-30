
// 搜索框的受控值、占位文案与清除按钮文案都由调用方给，组件本身不碰 store。
interface SearchBoxProps {
  value: string;
  placeholder: string;
  clearLabel: string;
  onChange: (next: string) => void;
}

/**
 * 不区分大小写的子串匹配；查询为空串时一律命中。
 *
 * @param text 被搜索的文案（可能是多段拼接）。
 * @param query 用户输入，应由 normalizeQuery 归一化后再传入。
 * @returns 命中为 true。
 */
function hitQuery(text: string, query: string): boolean {
  if (!query) return true;
  return String(text).toLowerCase().indexOf(query.toLowerCase()) >= 0;
}

/**
 * 归一化用户输入：去掉首尾空白并转小写，空串表示「没有搜索」。
 *
 * @param raw 输入框里的原始值。
 * @returns 可用于比较的查询串。
 */
function normalizeQuery(raw: string): string {
  return String(raw || "").trim().toLowerCase();
}

/**
 * 列表上方的搜索行：左侧放大镜、中间输入框、右侧清除按钮（仅在有内容时出现）。
 *
 * @param props 受控值与回调，见 SearchBoxProps。
 * @returns 搜索行元素。
 */
function SearchBox(props: SearchBoxProps): any {
  return h("div", { className: "lo-search" },
    h(Icon, { svg: UI_ICON_SEARCH, className: "lo-search-icon", name: "search" }),
    h("input", {
      className: "lo-search-input",
      type: "text",
      value: props.value,
      placeholder: props.placeholder,
      spellCheck: false,
      "aria-label": props.placeholder,
      onChange: function (event: any) {
        const target = event && event.target ? event.target : null;
        // 输入框的 value 恒为字符串；宿主没有 target 时按空串处理。
        props.onChange(target && target.value ? String(target.value) : "");
      }
    }),
    props.value
      ? h("button", {
          type: "button",
          className: "lo-search-clear",
          title: props.clearLabel,
          "aria-label": props.clearLabel,
          onClick: function () {
            props.onChange("");
          }
        }, h(Icon, { svg: UI_ICON_CLOSE, name: "close" }))
      : null
  );
}
