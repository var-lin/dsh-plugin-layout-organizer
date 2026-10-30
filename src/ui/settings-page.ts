
interface SettingsPageProps {
  ctx: CtxLike;
  store: StoreHandle;
  degraded?: string[];
  onOpenStash?: () => void;
}

/**
 * 设置页顶部导航的两项：位置管理（收纳包入口 + 六张排序卡片）与通用设置（开关 + 快捷键）。
 *
 * 分组是产品决定：按钮收纳包属于「整理按钮可见性」，快捷键属于「全局行为」，
 * 因此前者跟随位置卡片、后者跟随开关。
 */
// 导航顺序：位置管理在前、通用设置在后（位置管理是本插件的主用途，默认也停在这一页）。
const TAB_KEYS: string[] = ["layout", "general"];

/**
 * 用系统浏览器打开仓库主页 / 问题反馈页。
 *
 * @param url 目标地址。
 */
function openExternal(url: string): void {
  window.open(url, "_blank", "noopener");
}

/**
 * 本插件在设置页里的整页视图。
 *
 * 结构：标题行（导出 / 导入 / GitHub / 问题反馈）→ 结果提示 → 导语 → 降级警告 → 顶部导航 →
 * 当前分页的内容。位置管理页还带搜索行，搜索行以下是一个独立滚动容器，
 * 因此滚动条只出现在卡片区，标题与搜索行始终可见。
 *
 * @param props 上下文、状态句柄、降级原因与「打开收纳包」回调，见 SettingsPageProps。
 * @returns 设置页元素。
 */
function SettingsPage(props: SettingsPageProps): any {
  const ctx = props.ctx;
  const store = props.store;
  useStoreTick(store);
  const state = store.get();

  // 导入 / 导出的结果提示；toned 区分成功与失败，覆盖即消失。
  const noticePair = useState<{ text: string; tone: string } | null>(null);
  const notice = noticePair[0];
  const setNotice = noticePair[1];

  // 当前分页；只渲染选中的那一组卡片。
  const tabPair = useState<string>("layout");
  const tab = tabPair[0];
  const setTab = tabPair[1];

  // 搜索串只作用于当前分页里的按钮列表，切页保留输入。
  const queryPair = useState("");
  const query = queryPair[0];
  const setQuery = queryPair[1];

  // 「有下属行」的折叠状态存进 store（options.collapsed），重开页面保持上次的展开 / 折叠。缺省展开。
  const collapsedMap: Record<string, boolean> = state.options.collapsed || {};
  const allowOpen = collapsedMap["allowDragOfficial"] !== true;
  const dividerOpen = collapsedMap["showDivider"] !== true;
  function toggleCollapsed(key: string, open: boolean): void {
    store.update(function (next: PluginState) {
      // open 是「当前是否展开」：展开着点一下 → collapsed=true，收起着点一下 → collapsed=false。
      setCollapsed(next, key, open);
    });
  }

  const scopeCards: any[] = [];
  let i: number;
  for (i = 0; i < SCOPES.length; i++) {
    scopeCards.push(h(ScopeCard, { key: SCOPES[i].key, ctx: ctx, store: store, scope: SCOPES[i].key, query: query }));
  }
  // 搜索时六张卡片可能全被过滤掉，此时给一句说明而不是空白。
  // 命中判定走 ScopeCard 用的同一把尺子（scopeHit），两边规则一致才不会有「提示说没命中、
  // 卡片却还在」这种自相矛盾的画面。
  let anyScopeHit = false;
  for (i = 0; i < SCOPES.length; i++) {
    if (scopeHit(ctx, state, SCOPES[i].key, query)) anyScopeHit = true;
  }
  const searching = normalizeQuery(query).length > 0;

  const generalBody: any[] = [
    h(Card, { key: "options", title: t("section.options") },
      // 整行切换折叠/展开；箭头只做状态指示。
      h(Field, {
        label: t("opt.allowDragOfficial"),
        hint: t("opt.allowDragOfficial.hint"),
        onToggleCollapse: function () {
          toggleCollapsed("allowDragOfficial", allowOpen);
        },
        collapsed: allowOpen === false,
        children: h(Switch, {
          checked: state.options.allowDragOfficial === true,
          label: t("opt.allowDragOfficial"),
          onChange: function (value: boolean) {
            store.update(function (next: PluginState) {
              // 总开关只写自己，下属行的开关位置原样保留；下属是否生效由 mixedOrder() 里的 AND 决定。
              setOption(next, "allowDragOfficial", value);
            });
          }
        })
      }),
      // 位置独立保存、功能上与总开关求 AND；总开关关着时整行变灰表示不生效，但仍然可点。
      allowOpen
        ? h(Field, {
            label: t("opt.mixGroups"),
            hint: t("opt.mixGroups.hint"),
            sub: true,
            gated: state.options.allowDragOfficial !== true,
            children: h(Switch, {
              checked: state.options.mixGroups !== false,
              label: t("opt.mixGroups"),
              onChange: function (value: boolean) {
                store.update(function (next: PluginState) {
                  // 灰态下点击一律是「我要用这一路」：这一路写开并顶起总开关；亮态下才是普通开关。
                  const lift = next.options.allowDragOfficial !== true;
                  setOption(next, "mixGroups", lift ? true : value);
                  if (lift) setOption(next, "allowDragOfficial", true);
                });
              }
            })
          })
        : null,
      h(Field, {
        label: t("opt.showDivider"),
        hint: t("opt.showDivider.hint"),
        onToggleCollapse: function () {
          toggleCollapsed("showDivider", dividerOpen);
        },
        collapsed: dividerOpen === false,
        children: h(Switch, {
          checked: state.options.showDivider === true,
          label: t("opt.showDivider"),
          onChange: function (value: boolean) {
            store.update(function (next: PluginState) {
              // 总开关只写自己：下属开关位置不动，关着的时候 dividerEnabled() 的 AND 让它们不画。
              setOption(next, "showDivider", value);
            });
          }
        })
      }),
      // per-scope 子开关必须是**兄弟行**，不能塞进上面那个 Field 的 children——children 是右侧控件区（flex 行），放进去会横向排开。
      dividerOpen
        ? DIVIDER_SCOPES.concat(moreAvailable() ? DIVIDER_MENU_SCOPES : []).map(function (scope: string) {
            const on = state.options.dividers
              ? state.options.dividers[scope] !== false
              : true;
            return h(Field, {
              key: "divider:" + scope,
              label: t("opt.divider." + scope),
              hint: t("opt.divider." + scope + ".hint"),
              sub: true,
              gated: state.options.showDivider !== true,
              children: h(Switch, {
                checked: on,
                label: t("opt.divider." + scope),
                onChange: (function (scopeKey: string) {
                  return function (value: boolean) {
                    store.update(function (next: PluginState) {
                      if (!next.options.dividers) next.options.dividers = {};
                      // 灰态下点击一律是「我要用这一路」：这一路写开并顶起总开关；亮态下才是普通开关。
                      const lift = next.options.showDivider !== true;
                      next.options.dividers[scopeKey] = lift ? true : value;
                      if (lift) setOption(next, "showDivider", true);
                    });
                  };
                })(scope)
              })
            });
          })
        : null,
      // 三处「更多」的分工。与上面那些开关各管各的：它只决定收进去的行归哪一处列出来。
      // 宿主没有「更多」时这三处都不存在，开关也就没有对象，干脆不画（见 moreAvailable）。
      // 「显示悬浮框启动器」排在它后面（用户 m07351）：两项都是收纳相关的开关，分开收纳是主口径，先读它。
      moreAvailable()
        ? h(Field, {
        label: t("opt.separateMore"),
        hint: t("opt.separateMore.hint"),
        children: h(Switch, {
          checked: state.options.separateMore === true,
          label: t("opt.separateMore"),
          onChange: function (value: boolean) {
            store.update(function (next: PluginState) {
              setOption(next, "separateMore", value);
            });
          }
        })
      })
        : null,
      h(Field, {
        label: t("opt.showLauncher"),
        hint: t("opt.showLauncher.hint"),
        children: h(Switch, {
          checked: state.options.showStashLauncher !== false,
          label: t("opt.showLauncher"),
          onChange: function (value: boolean) {
            store.update(function (next: PluginState) {
              setOption(next, "showStashLauncher", value);
            });
          }
        })
      }),
      // 全局重置：两步确认，误触不生效。状态还是出厂值时按钮灰着——按下去什么也不会变。
      h(Field, {
        label: t("action.resetAll"),
        hint: t("action.resetAll.hint"),
        children: h(ConfirmBtn, {
          label: t("action.resetAll"),
          confirmLabel: t("action.confirmResetAll"),
          disabled: !stateDirty(state),
          onConfirm: function () {
            store.update(function (next: PluginState) {
              const fresh = defaultState();
              next.order = fresh.order;
              next.kinds = fresh.kinds;
              next.hidden = fresh.hidden;
              next.intoMore = fresh.intoMore;
              next.moreOrder = fresh.moreOrder;
              next.options = fresh.options;
            });
          }
        })
      })
    ),
    h(ShortcutCard, { key: "shortcut", ctx: ctx, store: store })
  ];

  // 搜索时藏起「打开已收起的按钮」这张卡片：它是一条固定入口、没有可搜的名称或 id，
  // 留着只会在结果列表最前面占掉一行，且这行字本身也搜不到它。
  const layoutBody: any[] = searching
    ? []
    : [
        // 数量跟在标题后面，不另占一行：这张卡片只有一处入口，正文留空反而更矮、更好扫。
        h(Card, {
          key: "stash",
          title: h("span", null,
            t("stash.title"),
            h("span", { className: "lo-card-note" }, t("stash.count").replace("{count}", String(stashCount(state))))
          ),
          action: h(Btn, { variant: "primary", onClick: props.onOpenStash }, t("action.openStash"))
        })
      ];
  for (i = 0; i < scopeCards.length; i++) layoutBody.push(scopeCards[i]);
  if (searching && !anyScopeHit) layoutBody.push(h("div", { key: "no-hit", className: "lo-empty" }, t("empty.search")));

  const navButtons: any[] = [];
  TAB_KEYS.forEach(function (key: string) {
    const active = tab === key;
    navButtons.push(h("button", {
      key: key,
      type: "button",
      className: "lo-tab",
      role: "tab",
      "aria-selected": active ? "true" : "false",
      "data-active": active ? "1" : undefined,
      onClick: function () {
        setTab(key);
      }
    }, t("tab." + key)));
  });

  return h("div", { className: "lo-page" },
    h("div", { className: "lo-titlerow" },
      h("h2", { className: "lo-title" }, t("title")),
      // 版本号贴着大标题：用户报问题时能直接念出来，不必再去插件列表里翻。
      h("span", { className: "lo-version", title: t("version.hint") }, "v" + PLUGIN_VERSION),
      // 弹性占位：放得下时把动作区顶到最右，换行后随按钮一起落到第二行左端。
      h("span", { className: "lo-titlegap" }),
      h("div", { className: "lo-titleacts" },
        h(Btn, {
          icon: ACTION_ICON_EXPORT,
          iconName: "export",
          title: t("action.export.hint"),
          onClick: function () {
            exportConfig(store);
            setNotice({ text: t("note.exported"), tone: "ok" });
          }
        }, t("action.export")),
        h(ConfirmBtn, {
          label: t("action.import"),
          confirmLabel: t("action.confirmImport"),
          icon: ACTION_ICON_IMPORT,
          iconName: "import",
          title: t("action.import.hint"),
          onConfirm: function () {
            importConfig(store, function (ok: boolean) {
              setNotice({ text: ok ? t("note.importOk") : t("note.importFail"), tone: ok ? "ok" : "error" });
            });
          }
        }),
        h(Btn, {
          icon: ACTION_ICON_GITHUB,
          iconName: "github",
          title: t("action.github.hint"),
          onClick: function () {
            openExternal(GITHUB_URL);
          }
        }, t("action.github")),
        h(Btn, {
          icon: ACTION_ICON_FEEDBACK,
          iconName: "feedback",
          title: t("action.feedback.hint"),
          onClick: function () {
            openExternal(GITHUB_ISSUES_URL);
          }
        }, t("action.feedback"))
      )
    ),
    notice ? h("div", { className: "lo-notice", "data-tone": notice.tone }, notice.text) : null,
    h("p", { className: "lo-lead" }, t("subtitle")),

    (props.degraded && props.degraded.length > 0)
      ? h("div", { className: "lo-warn" },
          h("div", null, t("note.degrade")),
          props.degraded.map(function (message: string, index: number) {
            return h("div", { key: index }, "\u00b7 " + message);
          })
        )
      : null,

    h("div", { className: "lo-tabs", role: "tablist" }, navButtons),

    tab === "layout"
      ? h("div", { className: "lo-tabpane", role: "tabpanel" },
          h(SearchBox, {
            value: query,
            placeholder: t("search.placeholder"),
            clearLabel: t("search.clear"),
            onChange: setQuery
          }),
          h("div", { className: "lo-scroll" }, layoutBody)
        )
      : h("div", { className: "lo-tabpane", role: "tabpanel" },
          h("div", { className: "lo-scroll" }, generalBody)
        )
  );
}
