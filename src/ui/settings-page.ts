
// 账本报出的一行：store 持久化的 id、给人看的标签，以及官方渲染器会采用的注册顺序。
interface ScopeEntry {
  id: string;
  label: string;
  order: number;
}

interface ScopeCardProps {
  ctx: CtxLike;
  store: StoreHandle;
  scope: string;
}

interface ShortcutCardProps {
  ctx: CtxLike;
  store: StoreHandle;
}

interface SettingsPageProps {
  ctx: CtxLike;
  store: StoreHandle;
  degraded?: string[];
  onOpenStash?: () => void;
}

// 快捷键编辑器下方的报告文字；`tone` 成为样式表上色用的 `data-tone`（"ok"/"warn"/"error"）。
interface ShortcutReport {
  tone: string;
  text: string;
}

// 目录里的一行；`keys` 已是平台相关格式化的键帽，`issue`/`conflicts` 来自 `describeBinding`。
interface ShortcutCatalogRow {
  id: string;
  label?: string;
  keys?: string[];
  issue?: unknown;
  conflicts?: string[];
  binding?: unknown;
}

// 本卡片用到的 `shortcuts` 服务；`edit` 以分类后的结果 resolve，成功状态是 `"saved"`。
interface ShortcutEditorService {
  catalog?: {
    subscribe(fn: () => void): (() => void) | void;
    getSnapshot(): ShortcutCatalogRow[];
  };
  config: { getSnapshot(): { revision: string } };
  describeBinding(binding: { code: string; modifiers: string[] }): { issue?: unknown; conflicts?: string[] };
  edit(edit: { type: string; id?: string; binding?: unknown }, revision: string): Promise<{ status?: string } | null | undefined>;
}

// 成功绝不能被报成 保存失败：`"saved"` 与 `"ok"` 都算成功。
function shortcutSaveOk(status: unknown): boolean {
  return status === "saved" || status === "ok";
}

function scopeEntries(ctx: CtxLike, state: PluginState, scope: string): ScopeEntry[] {
  const entries = readEntries(ctx, scope);
  const byId: Record<string, ScopeEntry> = {};
  let i: number;
  for (i = 0; i < entries.length; i++) byId[entries[i].id] = entries[i];

  // 顺序由 `reconcileOrder` 重算，不从 DOM 读回
  const ids: string[] = [];
  for (i = 0; i < entries.length; i++) ids.push(entries[i].id);
  const order = reconcileOrder(state, scope, ids);

  const out: ScopeEntry[] = [];
  for (i = 0; i < order.length; i++) {
    const entry = byId[order[i]];
    if (entry) out.push(entry);
  }
  // 协调后顺序里没见过的行按账本顺序追加在末尾，而不是悄悄消失。
  for (i = 0; i < entries.length; i++) if (out.indexOf(entries[i]) < 0) out.push(entries[i]);
  return out;
}

function ScopeCard(props: ScopeCardProps): any {
  const ctx = props.ctx;
  const store = props.store;
  const scope = props.scope;
  const spec = SCOPE_OF_KEY[scope];
  useSlotsTick(ctx);
  useStoreTick(store);
  // revision tick 在投影真正落地后才触发
  useRevisionTick();
  const state = store.get();
  const entries = scopeEntries(ctx, state, scope);
  const mounted = collectRows(scope) !== null;

  const rows: any[] = [];
  let i: number;
  // 混合排序打开时整条列表算一个组
  const mixed = mixedOrder(state);
  const groupIndex: Record<string, number> = { official: 0, third: 0 };
  const groupTotal: Record<string, number> = { official: 0, third: 0 };
  for (i = 0; i < entries.length; i++) groupTotal[groupOf(state, scope, entries[i].id)]++;
  for (i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const id = entry.id;
    const kind = kindOf(state, scope, id);
    const group = kind === "official" ? "official" : "third";
    const listGroup = mixed ? "all" : group;
    const hidden = isHidden(state, scope, id);
    const self = scope === "settings" && id === SELF_ID;
    const index = mixed ? i : groupIndex[group]++;
    const total = mixed ? entries.length : groupTotal[group];
    (function (entry: ScopeEntry, id: string, kind: string, group: string, index: number, hidden: boolean, self: boolean) {
      rows.push(h(RowItem, {
        key: scope + ":" + id,
        entry: entry,
        kind: kind,
        group: listGroup,
        hidden: hidden,
        self: self,
        draggable: true,
        canUp: index > 0,
        canDown: index < total - 1,
        onToggleKind: function () {
          store.update(function (next: PluginState) {
            next.kinds[scope + ":" + id] = kind === "official" ? "third" : "official";
          });
        },
        onUp: function () {
          store.update(function (next: PluginState) {
            moveRow(next, scope, id, -1, listGroup);
          });
        },
        onDown: function () {
          store.update(function (next: PluginState) {
            moveRow(next, scope, id, 1, listGroup);
          });
        },
        onToggleHidden: function () {
          store.update(function (next: PluginState) {
            setHidden(next, scope, id, !hidden);
          });
        },
        onMenu: function (event: MouseEvent) {
          attachMenuAt(event, ctx, store, scope, id, listGroup);
        }
      }));
    })(entry, id, kind, group, index, hidden, self);
  }

  return h(Card, { title: t(spec.labelKey) },
    mounted ? null : h("div", { className: "lo-note" }, t("scope.missing")),
    rows.length > 0
      ? h("div", { className: "lo-rows", "data-lo-list-scope": scope }, rows)
      : h("div", { className: "lo-empty" }, t("empty.list")),
    h("div", { className: "lo-note" },
      h(ConfirmBtn, {
        label: t("action.reset"),
        confirmLabel: t("action.confirm"),
        onConfirm: function () {
          store.update(function (next: PluginState) {
            resetScope(next, scope);
          });
        }
      })
    )
  );
}

// 快捷键编辑器的一行：键帽本身即录制入口；冲突与不受支持的组合由 `describeBinding` 以文字报出。
function ShortcutCard(props: ShortcutCardProps): any {
  const ctx = props.ctx;
  useStoreTick(props.store);
  const pair = useState<ShortcutReport | null>(null);
  const report = pair[0];
  const setReport = pair[1];
  const tickPair = useState(0);
  const setTick = tickPair[1];
  const recordingPair = useState(false);
  const recording = recordingPair[0];
  const setRecording = recordingPair[1];

  function service(): ShortcutEditorService | null {
    try {
      return (ctx.get("shortcuts") as ShortcutEditorService | undefined) || null;
    } catch (err) {
      return null;
    }
  }

  useEffect(function () {
    const shortcuts = service();
    if (!shortcuts || !shortcuts.catalog || !shortcuts.catalog.subscribe) return undefined;
    return shortcuts.catalog.subscribe(function () {
      setTick(function (value: number) {
        return value + 1;
      });
    });
  }, [ctx]);

  const shortcuts = service();
  let keys: string[] = [];
  let issue: unknown = null;
  let conflicts: string[] = [];
  let bound = false;
  if (shortcuts && shortcuts.catalog) {
    const catalog = shortcuts.catalog.getSnapshot() || [];
    let j: number;
    for (j = 0; j < catalog.length; j++) {
      if (catalog[j].id !== SHORTCUT_ID) continue;
      keys = catalog[j].keys || [];
      issue = catalog[j].issue || null;
      conflicts = catalog[j].conflicts || [];
      bound = catalog[j].binding !== null && catalog[j].binding !== undefined;
    }
  }

  // 冲突报告需把 id 映射回人类可读标签，目录是唯一提供该映射的地方。
  function names(ids: string[]): string {
    const catalog = shortcuts && shortcuts.catalog ? shortcuts.catalog.getSnapshot() || [] : [];
    const out: string[] = [];
    let k: number;
    for (k = 0; k < ids.length; k++) {
      let label: string | null = null;
      let m: number;
      for (m = 0; m < catalog.length; m++) if (catalog[m].id === ids[k]) label = catalog[m].label || null;
      out.push(label || ids[k]);
    }
    return out.join(", ");
  }

  // 用服务自己的格式化器重建键帽，保持与应用其它地方的打印一致。
  function capture(event: KeyboardEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const modifiers: string[] = [];
    if (event.ctrlKey) modifiers.push("control");
    if (event.altKey) modifiers.push("alt");
    if (event.shiftKey) modifiers.push("shift");
    if (event.metaKey) modifiers.push("meta");
    if (["Control", "Alt", "Shift", "Meta"].indexOf(event.key) >= 0) return;
    const code = event.code;
    const binding = { code: code, modifiers: modifiers };
    if (!shortcuts || !shortcuts.describeBinding) return;
    const described = shortcuts.describeBinding(binding);
    if (described.issue) {
      setReport({ tone: "error", text: t("shortcut.invalid").replace("{reason}", String(described.issue)) });
      return;
    }
    if (described.conflicts && described.conflicts.length > 0) {
      setReport({ tone: "error", text: t("shortcut.conflict").replace("{list}", names(described.conflicts)) });
      return;
    }
    const revision = shortcuts.config.getSnapshot().revision;
    setRecording(false);
    shortcuts.edit({ type: "set", id: SHORTCUT_ID, binding: binding }, revision).then(function (result) {
      if (result && shortcutSaveOk(result.status)) {
        setReport({ tone: "ok", text: t("shortcut.saved") });
      } else {
        const status = result && result.status !== undefined ? result.status : "write-failed";
        setReport({ tone: "error", text: t("shortcut.failed").replace("{status}", String(status)) });
      }
    }, function () {
      setReport({ tone: "error", text: t("shortcut.failed").replace("{status}", "write-failed") });
    });
  }

  useEffect(function () {
    if (!recording) return undefined;
    document.addEventListener("keydown", capture, true);
    return function () {
      document.removeEventListener("keydown", capture, true);
    };
  }, [recording, ctx]);

  function reset(): void {
    if (!shortcuts) return;
    const revision = shortcuts.config.getSnapshot().revision;
    shortcuts.edit({ type: "reset", id: SHORTCUT_ID }, revision).then(function (result) {
      if (result && shortcutSaveOk(result.status)) setReport({ tone: "ok", text: t("shortcut.saved") });
      else setReport({ tone: "error", text: t("shortcut.failed").replace("{status}", String(result && result.status !== undefined ? result.status : "write-failed")) });
    }, function () {
      setReport({ tone: "error", text: t("shortcut.failed").replace("{status}", "write-failed") });
    });
  }

  // 录制由文档级捕获监听器驱动并阻止传播，录制中的按键到不了这个处理函数。
  function toggleRecording(): void {
    setReport(null);
    setRecording(!recording);
  }

  function onKeysKeyDown(event: KeyboardEvent): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleRecording();
    }
  }

  // 状态文字内联在键帽行里，紧挨键帽框右侧。
  let status: any = null;
  if (report) status = h("span", { className: "lo-shortcut-msg", "data-tone": report.tone }, report.text);
  else if (!bound) status = h("span", { className: "lo-shortcut-msg" }, t("shortcut.none"));
  else if (issue) status = h("span", { className: "lo-shortcut-msg", "data-tone": "error" }, t("shortcut.invalid").replace("{reason}", String(issue)));
  else if (conflicts.length > 0) status = h("span", { className: "lo-shortcut-msg", "data-tone": "error" }, t("shortcut.conflict").replace("{list}", names(conflicts)));

  return h(Card, { title: t("section.shortcut") },
    h(Field, {
      label: t("shortcut.open"),
      hint: t("shortcut.hint"),
      // stack：标签与提示各占一行，控件行在下面，键帽框与 恢复默认 永远不会被挤成两行。
      stack: true,
      children: h("div", { className: "lo-keyrow" },
        h("span", {
          className: "lo-keys",
          role: "button",
          tabIndex: 0,
          "data-recording": recording ? "1" : undefined,
          "data-empty": keys.length > 0 ? undefined : "1",
          title: recording ? t("shortcut.recording") : t("shortcut.record"),
          onClick: toggleRecording,
          onKeyDown: onKeysKeyDown
        }, recording ? t("shortcut.recording") : keys.length > 0 ? keys.join("") : t("shortcut.none")),
        status,
        h("span", { className: "lo-keyrow-end" }, h(Btn, { disabled: !bound, onClick: reset }, t("shortcut.reset")))
      )
    })
  );
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

  // 「有下属行」的折叠状态存进 store（options.collapsed），重开页面保持上次的展开 / 折叠。缺省展开。
  const collapsedMap: Record<string, boolean> = state.options.collapsed || {};
  const allowOpen = collapsedMap["allowDragOfficial"] !== true;
  const dividerOpen = collapsedMap["showDivider"] !== true;
  function toggleCollapsed(key: string, open: boolean): void {
    store.update(function (next: PluginState) {
      if (!next.options.collapsed) next.options.collapsed = {};
      // open 是「当前是否展开」：展开着点一下 → collapsed=true，收起着点一下 → collapsed=false。
      next.options.collapsed[key] = open;
    });
  }

  const scopeCards: any[] = [];
  let i: number;
  for (i = 0; i < SCOPES.length; i++) {
    scopeCards.push(h(ScopeCard, { key: SCOPES[i].key, ctx: ctx, store: store, scope: SCOPES[i].key }));
  }

  return h("div", { className: "lo-page" },
    h("div", { className: "lo-titlerow" },
      h("h2", { className: "lo-title" }, t("title")),
      h("div", { className: "lo-titleacts" },
        h(Btn, {
          title: t("action.export.hint"),
          onClick: function () {
            exportConfig(store);
            setNotice({ text: t("note.exported"), tone: "ok" });
          }
        }, t("action.export")),
        h(Btn, {
          title: t("action.import.hint"),
          onClick: function () {
            importConfig(store, function (ok: boolean) {
              setNotice({ text: ok ? t("note.importOk") : t("note.importFail"), tone: ok ? "ok" : "error" });
            });
          }
        }, t("action.import")),
        h(Btn, {
          title: t("action.github.hint"),
          onClick: function () {
            window.open(GITHUB_URL, "_blank", "noopener");
          }
        }, t("action.github"))
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

    h(Card, { title: t("section.options") },
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
        ? DIVIDER_SCOPES.map(function (scope: string) {
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
      // 全局重置：两步确认，误触不生效。
      h(Field, {
        label: t("action.resetAll"),
        hint: t("action.resetAll.hint"),
        children: h(ConfirmBtn, {
          label: t("action.resetAll"),
          confirmLabel: t("action.confirm"),
          onConfirm: function () {
            store.update(function (next: PluginState) {
              const fresh = defaultState();
              next.order = fresh.order;
              next.kinds = fresh.kinds;
              next.hidden = fresh.hidden;
              next.options = fresh.options;
            });
          }
        })
      })
    ),

    h(Card, { title: t("section.stash") },
      h(Field, {
        label: t("stash.title"),
        hint: t("stash.count").replace("{count}", String(stashCount(state))),
        children: h(Btn, { variant: "primary", onClick: props.onOpenStash }, t("action.openStash"))
      })
    ),

    h(ShortcutCard, { ctx: ctx, store: store }),

    scopeCards
  );
}