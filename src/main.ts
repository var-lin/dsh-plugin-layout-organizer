const inject = ["slots", "locale"];

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

  ctx.effect(function () {
    if (typeof document === "undefined") return undefined;
    installStyles();
    return function () {
      removeStyles();
    };
  }, "layout-organizer: stylesheet");

  const locale = ctx.get("locale") as LocaleService | null;
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
          return h(StashSurface, { ctx: ctx, store: store });
        }
      );
    });
  } catch (err) {
    noteDegrade("shell.overlay unavailable; the stash cannot be shown: " + (err && (err as Error).message ? (err as Error).message : String(err)));
  }

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
        return h(SettingsPage, {
          ctx: ctx,
          store: store,
          degraded: degraded,
          onOpenStash: openStash
        });
      }
    );
  });

  // 插件管理页的详情区也挂一份设置页；主题不是本插件时不渲染。
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
        return h(SettingsPage, {
          ctx: ctx,
          store: store,
          degraded: degraded,
          onOpenStash: openStash
        });
      }
    );
  });

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
      const shortcuts = ctx.get("shortcuts") as ShortcutsService | null;
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