/**
 * 收纳包里的一行：左侧整行是「打开对应页面」，右侧是「恢复」。
 *
 * 界面上本来点不动的行（见 rowNavigable）左侧同样灰着且不可点：点它什么也不会发生，
 * 也不会顺手关掉收纳包——「可点却毫无反应」比灰着更像坏掉。
 *
 * 「恢复」只影响这一个按钮、且随时可以再收回来，所以是一点即恢复，不做两步确认；
 * 一次性改动整张列表的「全部恢复」才需要确认（见 StashPanel）。
 *
 * @param props 行数据与两个动作回调，见 StashRowProps。
 * @returns 收纳包行元素。
 */
function StashRow(props: StashRowProps): any {
  const row = props.row;
  const inert = row.missing || !row.navigable;
  let hint = t("action.goto");
  if (row.missing) hint = t("scope.missing");
  else if (!row.navigable) hint = t("action.static");
  const icon = rowIconOf(row.scope, row.id);
  const onIntoMore = props.canIntoMore ? props.onIntoMore : undefined;
  return h("div", {
    className: "lo-stash-row",
    // 拖到面板外面松手就恢复（`drag-stash.ts`）：行上带位置与 id，手势不回头猜。
    "data-lo-stash-scope": row.scope,
    "data-lo-stash-id": row.id
  },
    h("button", {
      type: "button",
      className: "lo-stash-main",
      disabled: inert,
      title: hint,
      onClick: function () {
        props.onOpen(row);
      }
    },
      h(RowIcon, { svg: icon, text: row.label }),
      h("span", { className: "lo-stash-label" }, row.label),
      h("span", { className: "lo-tag" }, row.id)
    ),
    // 「进更多」放在「恢复」左边：级别由近到远是「列表 → 更多 → 悬浮框」，
    // 从左到右正好是「进更多」再「恢复回列表」（用户 m06865#2 指定这个顺序）。
    // 哪几处槽位有「更多」这个容器不归这里管，问 `moreScopeOk`（封装在 `canTuckIntoMore` 里）。
    // 不能收的行（设置页导航、三颗「更多」入口）照样把这颗按钮画出来、只是禁用：
    // 与设置页那张卡片同一套处理（同一个 `IntoMoreButton`），一行里按钮列不会左右参差。
    h(IntoMoreButton, {
      intoMore: false,
      onToggle: onIntoMore ? function () { onIntoMore(row); } : undefined
    }),
    h(Btn, {
      title: t("action.restore"),
      variant: "soft",
      onClick: function () {
        props.onRestore(row);
      }
    }, t("action.restore"))
  );
}

function StashPanel(props: StashProps): any {
  const ctx = props.ctx;
  const store = props.store;
  useStoreTick(store);
  useSlotsTick(ctx);
  const state = store.get();
  const mode = state.stashSort;
  // 搜索串只留在这个面板的本地状态里：关掉收纳包即清空，不写 store。
  const queryPair = useState("");
  const rawQuery = queryPair[0];
  const setQuery = queryPair[1];
  // 面板本体，给焦点陷阱与「打开时送焦点、关闭时还焦点」用。
  const panelRef = useRef<any>(null);
  const query = normalizeQuery(rawQuery);
  const rows = sortStash(stashView(ctx, state), mode);
  const visible: StashItem[] = [];
  let v: number;
  for (v = 0; v < rows.length; v++) {
    const row = rows[v];
    // 名字、id、所属位置三者任一命中都算：用户记得哪个都能搜到。
    if (!query || hitQuery(row.label, query) || hitQuery(row.id, query) || hitQuery(row.scopeLabel, query)) visible.push(row);
  }
  const groups = groupStash(visible, mode);

  useEffect(function () {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeStash();
        return;
      }
      if (event.key !== "Tab") return;
      // 焦点陷阱：面板是模态的（`aria-modal`），Tab 到两端就绕回来，别让焦点跑到设置弹窗后面。
      const panel = panelRef.current as HTMLElement | null;
      if (!panel || typeof panel.querySelectorAll !== "function") return;
      const items = panel.querySelectorAll("button, input, [href], select, textarea, [tabindex]:not([tabindex='-1'])");
      const focusable: HTMLElement[] = [];
      let i;
      for (i = 0; i < items.length; i++) {
        const el = items[i] as HTMLElement;
        if (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true") continue;
        focusable.push(el);
      }
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeEl = document.activeElement as HTMLElement | null;
      if (event.shiftKey && (!activeEl || activeEl === first || !panel.contains(activeEl))) {
        event.preventDefault();
        last.focus();
        return;
      }
      if (!event.shiftKey && (!activeEl || activeEl === last || !panel.contains(activeEl))) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey, true);
    return function () {
      document.removeEventListener("keydown", onKey, true);
    };
  }, []);

  useEffect(function () {
    // 打开时把焦点送进面板、关掉时还给原来的元素：键盘用户否则会掉到 body 上。
    const panel = panelRef.current as HTMLElement | null;
    if (!panel || typeof panel.querySelectorAll !== "function") return function () {};
    const previous = document.activeElement as HTMLElement | null;
    const items = panel.querySelectorAll("button, input, [href], select, textarea, [tabindex]:not([tabindex='-1'])");
    let target: HTMLElement | null = null;
    let i;
    for (i = 0; i < items.length; i++) {
      const el = items[i] as HTMLElement;
      if (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true") continue;
      target = el;
      break;
    }
    if (target) target.focus();
    return function () {
      if (previous && typeof previous.focus === "function" && previous !== document.body) previous.focus();
    };
  }, []);

  function restore(row: StashItem): void {
    store.update(function (next: PluginState) {
      setHidden(next, row.scope, row.id, false);
    });
  }

  /**
   * 直接从收纳包挪进「更多」：两处收纳互斥，`setIntoMore` 会顺手摘掉 hidden 键，
   * 于是这一行从收纳包消失、在「更多」菜单里出现，少一次「先恢复、再右键收进更多」。
   *
   * @param row 收纳包里的一行。
   */
  function intoMore(row: StashItem): void {
    store.update(function (next: PluginState) {
      setIntoMore(next, row.scope, row.id, true);
    });
  }

  function open(row: StashItem): void {
    // 界面上本来点不动的行不进导航：导航会关掉收纳包与设置弹窗，等于「点了个寂寞还丢了位置」。
    if (row.missing || !row.navigable) return;
    // 设置行只存在于弹窗内，不能关弹窗：交给 `navigateTo` 的两步路由。
    if (row.scope === "settings") {
      closeStash();
      navigateTo(ctx, row.scope, row.id);
      return;
    }
    // 其余行与设置页卡片同一条路径（先抵达目标，下一帧再关设置弹窗），这里只多关一次收纳包。
    navigateFromSettings(ctx, row.scope, row.id);
    closeStash();
  }

  const body: any[] = [];
  // 分组标题的折叠状态存在 store 里（options.collapsed），关掉收纳包再打开保持原样。
  const collapsedMap: Record<string, boolean> = state.options.collapsed || {};
  let i: number;
  let j: number;
  for (i = 0; i < groups.length; i++) {
    const group = groups[i];
    // 有标题的分组在标题右侧带一个「恢复本组默认」；按名称排序（alpha）没有标题，也就不放按钮、
    // 不做折叠——没有「类」可折。
    if (group.title) {
      const collapsedKey = "stash:" + mode + ":" + group.key;
      // 搜索时也照常可折叠：与设置页的卡片同一套行为。
      const expanded = collapsedMap[collapsedKey] !== true;
      const toggleGroup = function (): void {
        // 分组折叠是界面偏好，不进撤销栈。
        store.update(function (next: PluginState) {
          setCollapsed(next, collapsedKey, expanded);
        }, { history: false });
      };
      body.push(h("div", {
        // 用分组自己的键，不用下标：切排序方式后同一位置会换成另一个组，按下标 React 会复用
        // 实例，那个组头里「恢复本组默认」的上膛状态就跟着搬过去，点一下恢复的是另一组。
        key: "g:" + group.key,
        className: "lo-stash-group",
        "data-open": expanded ? "1" : "0",
        role: "button",
        tabIndex: 0,
        "aria-expanded": expanded ? "true" : "false",
        title: t("action.toggleGroup"),
        // 整行都是折叠开关：标题、小三角与恢复按钮右侧的空白都算，只有「恢复本组默认」自己管自己。
        onClick: function (event: any) {
          if (event && event.target && event.target.closest && event.target.closest(".lo-btn")) return;
          toggleGroup();
        },
        onKeyDown: function (event: any) {
          // 焦点在「恢复本组默认」上时，回车 / 空格归那颗按钮，不能顺手把分组折了。
          if (event && event.target && event.target.closest && event.target.closest(".lo-btn")) return;
          if (event && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            toggleGroup();
          }
        }
      },
        h("span", { className: "lo-stash-group-title" },
          h("span", { className: "lo-stash-group-text" }, group.title)
        ),
        h(ConfirmBtn, {
          label: t("action.reset"),
          confirmLabel: t("action.confirmResetGroup"),
          disabled: !groupDirty(state, group),
          onConfirm: function () {
            store.update(function (next: PluginState) {
              const scopes = groupScopes(group);
              for (let k = 0; k < scopes.length; k++) resetScope(next, scopes[k]);
            });
          }
        }),
        // 小三角在整行最右端（恢复按钮之后），与设置页卡片的标题行同一位置。
        h("span", { className: "lo-stash-group-chev", "aria-hidden": "true" }, "\u25be")
      ));
      if (!expanded) continue;
    }
    for (j = 0; j < group.rows.length; j++) {
      const row = group.rows[j];
      body.push(h(StashRow, {
        key: row.key,
        row: row,
        onOpen: open,
        onRestore: restore,
        // 三颗「更多」入口按钮不给这个键（见 isMoreEntry）：收进自己那扇菜单就再也点不开。
        canIntoMore: canTuckIntoMore(row.scope, row.id),
        onIntoMore: intoMore
      }));
    }
  }

  return ReactDOM.createPortal(
    h(React.Fragment, null,
      h("div", { className: "lo-mask", onClick: closeStash }),
      h("div", { className: "lo-stash", role: "dialog", "aria-modal": "true", "aria-label": t("stash.title"), ref: panelRef },
        h("div", { className: "lo-stash-head" },
          h("span", { className: "lo-stash-title" }, t("stash.title")),
          h("span", { className: "lo-stash-count" }, t("stash.count").replace("{count}", query ? visible.length + " / " + rows.length : String(rows.length))),
          h("button", { type: "button", className: "lo-stash-close", onClick: closeStash, title: t("action.close") }, "\u00d7")
        ),
        h("div", { className: "lo-stash-sorts" },
          SORT_MODES.map(function (item: string) {
            return h(Chip, {
              key: item,
              active: mode === item,
              onClick: function () {
                store.update(function (next: PluginState) {
                  next.stashSort = item;
                });
              }
            }, t(SORT_MODE_KEYS[item]));
          })
        ),
        h("div", { className: "lo-stash-search" },
          h(SearchBox, {
            value: rawQuery,
            placeholder: t("search.placeholder"),
            clearLabel: t("search.clear"),
            onChange: setQuery
          })
        ),
        h("div", { className: "lo-stash-actions" },
          h(ConfirmBtn, {
            label: t("action.restoreAll"),
            confirmLabel: t("action.confirmRestore"),
            disabled: rows.length === 0,
            onConfirm: function () {
              store.update(function (next: PluginState) {
                restoreAllHidden(next);
              });
            }
          })
        ),
        h("div", { className: "lo-stash-body" },
          visible.length === 0
            ? h("div", { className: "lo-empty" }, query ? t("empty.search") : t("empty.stash"))
            : body
        )
      )
    ),
    document.body
  );
}
