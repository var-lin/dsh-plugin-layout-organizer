
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
const TAB_KEYS: string[] = ["layout", "presets", "general"];

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
/**
 * 通用设置里的一行开关：左边标题 + 说明，右边一颗 Switch。
 *
 * 六条选项都是这个形状（两条带折叠箭头、两条带「灰态下点一下顶起总开关」的额外动作），
 * 手抄六遍最容易漏掉 checked 的取反规则——`showStashLauncher` / `pruneStash` 记的是
 * 「关掉」，所以判的是 `!== false`。
 *
 * @param spec 标题、说明、当前值、写入回调，以及可选的子行 / 灰态 / 折叠参数。
 * @returns 可直接塞进卡片 children 的 Field。
 */
function boolRow(spec: {
  key?: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  sub?: boolean;
  gated?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}): any {
  return h(Field, {
    key: spec.key,
    label: spec.label,
    hint: spec.hint,
    sub: spec.sub,
    gated: spec.gated,
    collapsed: spec.collapsed,
    onToggleCollapse: spec.onToggleCollapse,
    children: h(Switch, {
      checked: spec.checked,
      label: spec.label,
      onChange: spec.onChange
    })
  });
}

function SettingsPage(props: SettingsPageProps): any {
  const ctx = props.ctx;
  const store = props.store;
  useStoreTick(store);
  const state = store.get();

  // 导入 / 导出的结果提示；toned 区分成功与失败，覆盖即消失。
  const noticePair = useState<{ text: string; tone: string } | null>(null);
  const notice = noticePair[0];
  const setNotice = noticePair[1];

  // 撤销 / 还原各自的回执，与导入导出那类结果共用标题行里同一个位置（版本号右边，用户 m02647）。
  const historyPair = useState<string>("");
  const historyNote = historyPair[0];
  const setHistoryNote = historyPair[1];

  // 回执只在标题目的一角，不占正文：四秒后自己收走，免得旧消息一直挂在那儿像当前状态。
  useEffect(function () {
    if (!historyNote && !notice) return undefined;
    const timer: any = setTimeout(function () {
      setHistoryNote("");
      setNotice(null);
    }, 4000);
    return function () {
      clearTimeout(timer);
    };
  }, [historyNote, notice]);

  // 标题行那一个回执位只放一句话：撤销 / 还原的回执优先，其次才是导入导出这类结果。
  const titleNote = historyNote || (notice ? notice.text : "");
  const titleTone = historyNote ? "ok" : notice ? notice.tone : "ok";

  // 只有一个位置，就得互相顶掉：谁说话谁先清掉另一路，否则新消息被还没消失的旧消息挡住，
  // 看起来像「点了没反应」（用户 m02715）。
  function sayNotice(text: string, tone: string): void {
    setHistoryNote("");
    setNotice({ text: text, tone: tone });
  }
  function sayHistory(text: string): void {
    setNotice(null);
    setHistoryNote(text);
  }

  // 当前分页；只渲染选中的那一组卡片。
  const tabPair = useState<string>("layout");
  const tab = tabPair[0];
  const setTab = tabPair[1];

  // 「新」角标只活到这次查看为止：第一次打开位置管理页时摆着，等你离开这一页（切页或关掉设置）
  // 才收走，所以同一次安装只会看到一次（用户 m02493）。清空只动内存里的表，不占撤销步骤。
  useEffect(function () {
    if (tab !== "layout") return undefined;
    return function () {
      clearAllFresh();
    };
  }, [tab]);

  // 搜索串只作用于当前分页里的按钮列表，切页保留输入。
  const queryPair = useState("");
  const query = queryPair[0];
  const setQuery = queryPair[1];

  // 「有下属行」的折叠状态存进 store（options.collapsed），重开页面保持上次的展开 / 折叠。缺省展开。
  const collapsedMap: Record<string, boolean> = state.options.collapsed || {};
  const allowOpen = collapsedMap["allowDragOfficial"] !== true;
  const dividerOpen = collapsedMap["showDivider"] !== true;
  function toggleCollapsed(key: string, open: boolean): void {
    // 折叠只是界面偏好，不进撤销栈（`{ history: false }`）：否则用户按「撤销」时布局不动，
    // 撤掉的是上一次展开 / 折叠，得连按好几次才开始退真正的改动。
    store.update(function (next: PluginState) {
      // open 是「当前是否展开」：展开着点一下 → collapsed=true，收起着点一下 → collapsed=false。
      setCollapsed(next, key, open);
    }, { history: false });
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
      boolRow({
        label: t("opt.allowDragOfficial"),
        hint: t("opt.allowDragOfficial.hint"),
        onToggleCollapse: function () {
          toggleCollapsed("allowDragOfficial", allowOpen);
        },
        collapsed: allowOpen === false,
        checked: state.options.allowDragOfficial === true,
        onChange: function (value: boolean) {
          store.update(function (next: PluginState) {
            // 总开关只写自己，下属行的开关位置原样保留；下属是否生效由 mixedOrder() 里的 AND 决定。
            setOption(next, "allowDragOfficial", value);
          });
        }
      }),
      // 位置独立保存、功能上与总开关求 AND；总开关关着时整行变灰表示不生效，但仍然可点。
      allowOpen
        ? boolRow({
            label: t("opt.mixGroups"),
            hint: t("opt.mixGroups.hint"),
            sub: true,
            gated: state.options.allowDragOfficial !== true,
            checked: state.options.mixGroups !== false,
            onChange: function (value: boolean) {
              store.update(function (next: PluginState) {
                // 灰态下点击一律是「我要用这一路」：这一路写开并顶起总开关；亮态下才是普通开关。
                const lift = next.options.allowDragOfficial !== true;
                setOption(next, "mixGroups", lift ? true : value);
                if (lift) setOption(next, "allowDragOfficial", true);
              });
            }
          })
        : null,
      boolRow({
        label: t("opt.showDivider"),
        hint: t("opt.showDivider.hint"),
        onToggleCollapse: function () {
          toggleCollapsed("showDivider", dividerOpen);
        },
        collapsed: dividerOpen === false,
        checked: state.options.showDivider === true,
        onChange: function (value: boolean) {
          store.update(function (next: PluginState) {
            // 总开关只写自己：下属开关位置不动，关着的时候 dividerEnabled() 的 AND 让它们不画。
            setOption(next, "showDivider", value);
          });
        }
      }),
      // per-scope 子开关必须是**兄弟行**，不能塞进上面那个 Field 的 children——children 是右侧控件区（flex 行），放进去会横向排开。
      dividerOpen
        ? DIVIDER_SCOPES.concat(moreAvailable() ? DIVIDER_MENU_SCOPES : []).map(function (scope: string) {
            const on = state.options.dividers
              ? state.options.dividers[scope] !== false
              : true;
            return boolRow({
              key: "divider:" + scope,
              label: t("opt.divider." + scope),
              hint: t("opt.divider." + scope + ".hint"),
              sub: true,
              gated: state.options.showDivider !== true,
              checked: on,
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
            });
          })
        : null,
      // 三处「更多」的分工。与上面那些开关各管各的：它只决定收进去的行归哪一处列出来。
      // 宿主没有「更多」时这三处都不存在，开关也就没有对象，干脆不画（见 moreAvailable）。
      // 「显示悬浮框启动器」排在它后面（用户 m07351）：两项都是收纳相关的开关，分开收纳是主口径，先读它。
      moreAvailable()
        ? boolRow({
            label: t("opt.separateMore"),
            hint: t("opt.separateMore.hint"),
            checked: state.options.separateMore === true,
            onChange: function (value: boolean) {
              store.update(function (next: PluginState) {
                setOption(next, "separateMore", value);
              });
            }
          })
        : null,
      boolRow({
        label: t("opt.showLauncher"),
        hint: t("opt.showLauncher.hint"),
        checked: state.options.showStashLauncher !== false,
        onChange: function (value: boolean) {
          store.update(function (next: PluginState) {
            setOption(next, "showStashLauncher", value);
          });
        }
      }),
      // 失效的收起记录自动清掉。排在「显示悬浮按钮」下面：先有那颗悬浮按钮、才有面板里那些记录。
      boolRow({
        label: t("opt.pruneStash"),
        hint: t("opt.pruneStash.hint"),
        checked: state.options.pruneStash !== false,
        onChange: function (value: boolean) {
          store.update(function (next: PluginState) {
            setOption(next, "pruneStash", value);
          });
        }
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
      // 这一排按钮的回执一律挂在版本号右边（用户 m02647）：撤了一步、导出成功、导入失败都走这里，
      // 正文不再有通栏提示行。撤销的回执优先——它刚发生，比上一轮的导出结果更该被看见。
      titleNote
        ? h("span", { className: "lo-title-note", "data-tone": titleTone }, titleNote)
        : null,
      // 弹性占位：放得下时把动作区顶到最右，换行后随按钮一起落到下一行左端。
      h("span", { className: "lo-titlegap" }),
      h("div", { className: "lo-titleacts" },
        // 一整排：撤销 / 还原与四处跳转 / 搬运同排，窗口太窄时横向滚动，不换行、不挤压。
        h("div", { className: "lo-acts-row" },
          h(Btn, {
            icon: ACTION_ICON_UNDO,
            iconName: "undo",
            title: canUndo() ? t("action.undo.hint") : t("action.undo.none"),
            disabled: !canUndo(),
            onClick: function () {
              if (!undoLast(store)) return;
              sayHistory(t("note.undone"));
            }
          }, t("action.undo")),
          h(Btn, {
            icon: ACTION_ICON_REDO,
            iconName: "redo",
            title: canRedo() ? t("action.redo.hint") : t("action.redo.none"),
            disabled: !canRedo(),
            onClick: function () {
              if (!redoLast(store)) return;
              sayHistory(t("note.redone"));
            }
          }, t("action.redo")),
          h(Btn, {
            icon: ACTION_ICON_EXPORT,
            iconName: "export",
            title: t("action.export.hint"),
            onClick: function () {
              exportConfig(store);
              sayNotice(t("note.exported"), "ok");
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
                sayNotice(ok ? t("note.importOk") : t("note.importFail"), ok ? "ok" : "error");
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
      )
    ),

    // 有「新按钮」待整理时的提示条：行名旁边那些角标加起来有几个，这里一次说清；
    // 右侧按钮是「全都认下了」，省得一个个去点。没有新按钮时整条不画。
    freshCount() > 0
      ? h("div", { className: "lo-fresh" },
          h("span", { className: "lo-fresh-text" }, t("note.fresh").replace("{count}", String(freshCount()))),
          h(Btn, {
            onClick: function () {
              clearAllFresh();
              sayNotice(t("note.freshClear"), "ok");
            }
          }, t("action.markFreshRead"))
        )
      : null,

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
      : tab === "presets"
        // 预设自己一页：它管的是「整套布局」，与某一处位置怎么排不是一回事（用户 m02570）。
        ? h("div", { className: "lo-tabpane", role: "tabpanel" },
            h("div", { className: "lo-scroll" }, [h(PresetsCard, { key: "presets", store: store })])
          )
        : h("div", { className: "lo-tabpane", role: "tabpanel" },
            h("div", { className: "lo-scroll" }, generalBody)
          )
  );
}
