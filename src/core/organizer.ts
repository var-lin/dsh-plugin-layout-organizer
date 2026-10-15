function createOrganizer(ctx: CtxLike, store: StoreHandle, report: (message: string, error?: unknown) => void): {
  start: () => void;
  stop: () => void;
  schedule: () => void;
  refresh: () => void;
} {
  let disposed = false;
  let muted = false;
  let dirty = false;
  let frame = 0;
  let observer: MutationObserver | null = null;
  let unsubscribe: (() => void) | null = null;
  const disposers: (() => void)[] = [];

  function applyAll(): void {
    if (disposed) return;
    // 拖动中不重绘。
    if (dragActive()) return;
    for (let i = 0; i < SCOPES.length; i++) {
      const scope = SCOPES[i].key;
      try {
        applyScope(ctx, store, scope);
      } catch (err) {
        report("apply:" + scope, err);
      }
    }
    // 投影已经落地：此后读 DOM 的地方（设置页顺序、拖动快照）都能看到结果。
    notifyRevision();
    muted = true;
    window.setTimeout(function () {
      muted = false;
      if (dirty) {
        dirty = false;
        schedule();
      }
    }, 0);
  }

  function schedule(): void {
    if (disposed || frame) return;
    frame = window.requestAnimationFrame(function () {
      frame = 0;
      applyAll();
    });
  }

  function onMutations(): void {
    if (muted) {
      dirty = true;
      return;
    }
    schedule();
  }

  function onViewportChange(): void {
    // 固定表面按实时几何量摆放，滚动/改尺寸后已过期：立刻藏起来，让投影重画。
    hideSurfaces();
    schedule();
  }

  function start(): void {
    disposed = false;
    for (let i = 0; i < SCOPES.length; i++) {
      const scope = SCOPES[i];
      try {
        const dispose = ctx.effect(function () {
          return ctx.slots.subscribe(scope.slot, schedule);
        }, "layout-organizer: watch " + scope.slot);
        if (typeof dispose === "function") disposers.push(dispose as () => void);
      } catch (err) {
        report("subscribe:" + scope.slot, err);
      }
    }
    try {
      observer = new MutationObserver(onMutations);
      observer.observe(document.body, { childList: true, subtree: true });
    } catch (err) {
      report("observer", err);
    }
    window.addEventListener("resize", onViewportChange, true);
    window.addEventListener("scroll", onViewportChange, true);
    window.addEventListener("locationchange", schedule);
    unsubscribe = store.subscribe(schedule);
    schedule();
  }

  function stop(): void {
    disposed = true;
    if (frame) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }
    window.removeEventListener("resize", onViewportChange, true);
    window.removeEventListener("scroll", onViewportChange, true);
    window.removeEventListener("locationchange", schedule);
    if (unsubscribe) {
      try {
        unsubscribe();
      } catch (err) {
        // 拆解过程不允许抛错
      }
      unsubscribe = null;
    }
    for (let i = 0; i < disposers.length; i++) {
      try {
        disposers[i]();
      } catch (err) {
        // 拆解过程不允许抛错
      }
    }
    disposers.length = 0;
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    // 把每一条经手的行按发现它时的原样交还。
    for (let i = 0; i < SCOPES.length; i++) {
      clearScope(SCOPES[i].key);
    }
    hideSurfaces();
    closeMenu();
  }

  return { start: start, stop: stop, schedule: schedule, refresh: applyAll };
}