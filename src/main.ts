const inject = ["slots", "locale"];

/**
 * 把「更多」菜单的内容注册进一处宿主槽位。
 *
 * 两处「更多」（侧边栏的与对话顶部的）是同一个组件、不同的 `region`：组件据此决定
 * 读哪一份清单（见 `moreScopesIn`）。缺这个槽位的老宿主上整块跳过并降级，
 * 免得在本该没有「更多」的地方凭空造出一个空菜单。
 *
 * @param ctx 插件上下文，用来取槽位服务。
 * @param store 状态句柄，注入给菜单行。
 * @param slot 宿主槽位名。
 * @param region 这处菜单的归属（`sidebar` / `conversation`）。
 * @param noteDegrade 降级上报。
 */
function injectMoreSlot(
  ctx: CtxLike,
  store: StoreHandle,
  slot: string,
  region: string,
  noteDegrade: (message: string) => void
): void {
  try {
    ctx.slots.inject(slot, function () {
      return ctx.slots.register(
        {
          name: slot,
          id: SELF_ID,
          order: 40,
          locale: NS
        },
        function MoreRows(props: { onDismiss?: () => void }) {
          // 菜单内容炸掉只该让菜单空着，不该让宿主那处槽位整块报错。
          return h(Boundary, null, h(MoreMenuContent, {
            loCtx: ctx,
            loStore: store,
            loRegion: region,
            onDismiss: props ? props.onDismiss : undefined
          }));
        }
      );
    });
  } catch (err) {
    noteDegrade(slot + " unavailable; rows cannot be tucked into More: " + (err && (err as Error).message ? (err as Error).message : String(err)));
  }
}

function apply(ctx: CtxLike): void {
  const degraded: string[] = [];

  // 消息经 console.warn 输出（打包产物唯一可用渠道），设置页再原样列一遍。
  setReporter(function (message: string): void {
    try {
      console.warn("[layout-organizer] " + message);
    } catch (err) {
      // 没有别的可做了
    }
  });

  function noteDegrade(message: string): void {
    if (degraded.indexOf(message) < 0) degraded.push(message);
    warn(message);
  }

  // 装配里任何一步炸掉都只该让「这一步」失效，不能顺着 apply() 抛回宿主——宿主把插件
  // 抛出的异常当成启动失败，整个 DSH 就打不开了（用户报过一次）。所以整段包一层：
  // 失败记一条降级说明（设置页会列出来），插件退化成「什么都不做」，DSH 照常起来。
  try {
    boot();
  } catch (err) {
    noteDegrade("startup failed: " + (err && (err as Error).message ? (err as Error).message : String(err)));
  }

  function boot(): void {
  ctx.effect(function () {
    if (typeof document === "undefined") return undefined;
    installStyles();
    return function () {
      removeStyles();
    };
  }, "layout-organizer: stylesheet");

  // 取服务这一步也可能抛（宿主对没注册的名字直接抛），失败按「没有这个服务」处理。
  let locale: LocaleService | null = null;
  try {
    locale = ctx.get("locale") as LocaleService | null;
  } catch (err) {
    locale = null;
  }
  if (locale && typeof locale.register === "function") {
    ctx.effect(function () {
      return locale.register(NS, { zh: ZH, en: EN });
    }, "layout-organizer: dictionaries");
    if (typeof locale.bind === "function") {
      const bound = locale.bind(NS);
      setTranslator(function (key: string): string {
        const value = bound(key);
        return value === undefined || value === null ? key : value;
      });
    }
  } else {
    noteDegrade("locale service unavailable; falling back to English");
    setTranslator(function (key: string): string {
      return EN[key] === undefined ? key : EN[key];
    });
  }

  const store = createStore();
  setActiveStore(store);
  const organizer = createOrganizer(ctx, store, function (where: string, err: unknown): void {
    noteDegrade(where + ": " + (err && (err as Error).message ? (err as Error).message : String(err)));
  });
  const drag = createDragController(store);
  const listDrag = createListDragController(store);

  ctx.effect(function () {
    // 行菜单是窗口级捕获监听器，所以它一次覆盖所有 scope——包括从未打过标记的行。
    installRowMenu(store);
    organizer.start();
    drag.attach();
    listDrag.attach();
    return function () {
      listDrag.detach();
      drag.detach();
      organizer.stop();
      uninstallRowMenu();
      removeSurfaces();
      setActiveStore(null);
    };
  }, "layout-organizer: projection");

  // 经 portal 画进 <body>，插件仍留在 React 树里。
  try {
    ctx.slots.inject("shell.overlay", function () {
      return ctx.slots.register(
        {
          name: "shell.overlay",
          id: OVERLAY_ID,
          order: 120
        },
        function StashOverlay() {
          return h(Boundary, null, h(StashSurface, { ctx: ctx, store: store }));
        }
      );
    });
  } catch (err) {
    noteDegrade("shell.overlay unavailable; the stash cannot be shown: " + (err && (err as Error).message ? (err as Error).message : String(err)));
  }

  // 「更多」菜单里列出被收进「更多」的行。这一项是我们的独有内容：注册之后
  // 宿主才会为这个槽位点亮「更多」按钮（host 侧 `hasEntryActions` 就是看这个 list 非空），
  // 所以老宿主缺这个槽位时整块跳过，而不是让「更多」凭空出现又空着。
  //
  // 两处「更多」共用同一份内容：侧边栏的「更多」与对话顶部「…」各是一个槽位，
  // 组件按宿主传进来的 `region` 决定读哪一份清单（分开收纳时两处才各管各的，见 moreScopesIn）。
  const moreSlots: Array<{ slot: string; region: string }> = [
    { slot: "sidebar.panellist.actions", region: "sidebar" },
    { slot: "conversation.session.header.views.actions", region: "conversation" }
  ];
  for (let slotAt = 0; slotAt < moreSlots.length; slotAt++) {
    const target = moreSlots[slotAt];
    // 闭包变量：循环体里不可用 let 以外的名字，否则最后一个槽位的 region 会串到前一处。
    const region = target.region;
    injectMoreSlot(ctx, store, target.slot, region, noteDegrade);
  }

  try {
    ctx.slots.inject("settings.section", function () {
      return ctx.slots.register(
        {
          name: "settings.section",
          id: SELF_ID,
          order: 35,
          label: function () {
            return t("nav");
          },
          locale: NS
        },
        function SettingsSection() {
          return h(Boundary, null, h(SettingsPage, {
            ctx: ctx,
            store: store,
            degraded: degraded,
            onOpenStash: openStash
          }));
        }
      );
    });
  } catch (err) {
    noteDegrade("settings.section unavailable; the settings page cannot be reached: " + (err && (err as Error).message ? (err as Error).message : String(err)));
  }

  // 插件管理页的详情区也挂一份设置页；主题不是本插件时不渲染。
  try {
    ctx.slots.inject("plugins.detail.section", function () {
    return ctx.slots.register(
      {
        name: "plugins.detail.section",
        id: SELF_ID,
        order: 10,
        locale: NS
      },
      function PluginDetailSection(props: { subject?: { kind?: string; id?: string; pkg?: { name?: string } } }) {
        const subject = props ? props.subject : null;
        if (!subject) return null;
        const name = subject.pkg && subject.pkg.name ? subject.pkg.name : subject.id ? subject.id : "";
        if (name !== PLUGIN_ID && name !== SELF_ID) return null;
        return h(Boundary, null, h(SettingsPage, {
          ctx: ctx,
          store: store,
          degraded: degraded,
          onOpenStash: openStash
        }));
      }
    );
    });
  } catch (err) {
    noteDegrade("plugins.detail.section unavailable; the plugin detail page has no settings: " + (err && (err as Error).message ? (err as Error).message : String(err)));
  }

  // shortcuts 惰性重试；注册须在 ctx.effect 内，避免重跑 apply() 时重复注册。
  ctx.effect(function () {
    let disposeCommand: (() => void) | null = null;
    let timer = 0;
    let tries = 0;

    function stop(): void {
      if (timer) {
        window.clearTimeout(timer);
        timer = 0;
      }
      if (disposeCommand) {
        try {
          disposeCommand();
        } catch (err) {
          // 该服务可能已经没了
        }
        disposeCommand = null;
      }
    }

    function registerShortcut(): void {
      if (disposeCommand) return;
      // 取服务这一步在宿主上可能直接抛（没注册的名字），照样按「还没就绪」重试。
      let shortcuts: ShortcutsService | null = null;
      try {
        shortcuts = ctx.get("shortcuts") as ShortcutsService | null;
      } catch (err) {
        shortcuts = null;
      }
      if (!shortcuts || typeof shortcuts.register !== "function") {
        if (tries++ < 10) timer = window.setTimeout(registerShortcut, 200);
        else noteDegrade("shortcuts service unavailable; the stash has no hotkey (use the floating button)");
        return;
      }
      // 该 id 已存在时保留既有的绑定，不重复注册。
      const existing = shortcutIds(shortcuts);
      if (existing && existing.indexOf(SHORTCUT_ID) >= 0) return;
      try {
        const dispose = shortcuts.register({
          id: SHORTCUT_ID,
          label: function () {
            return t("shortcut.open");
          },
          aliases: ["stash", "button stash", "layout organizer"],
          defaults: {
            "desktop:windows": { code: "KeyO", modifiers: ["primary", "shift"] },
            "desktop:macos": { code: "KeyO", modifiers: ["primary", "shift"] },
            "desktop:linux": { code: "KeyO", modifiers: ["primary", "shift"] },
            "web:windows": { code: "KeyO", modifiers: ["primary", "shift", "alt"] },
            "web:macos": { code: "KeyO", modifiers: ["primary", "shift", "alt"] },
            "web:linux": { code: "Comma", modifiers: ["primary", "shift"] }
          },
          regions: ["page"],
          modals: ["settings"],
          resolve: function () {
            return {
              status: "handled",
              run: function () {
                openStash();
              }
            };
          }
        });
        if (typeof dispose === "function") disposeCommand = dispose;
      } catch (err) {
        // 重复 id 是预期且无害的，忽略；其余拒绝都上报为降级。
        const message = err && (err as Error).message ? (err as Error).message : String(err);
        if (message.indexOf("Duplicate shortcut command: " + SHORTCUT_ID) >= 0) return;
        noteDegrade("shortcut registration failed (likely a keybinding conflict): " + message);
      }
    }

    registerShortcut();
    return stop;
  }, "layout-organizer: shortcut");
  }
}