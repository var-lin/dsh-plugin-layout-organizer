function createOrganizer(ctx: CtxLike, store: StoreHandle, report: (message: string, error?: unknown) => void): {
  start: () => void;
  stop: () => void;
} {
  let disposed = false;
  let muted = false;
  let dirty = false;
  let frame = 0;
  let settle = 0;
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
    // 投影已经落地：此后读 DOM 的地方（设置页的挂载判定、拖动快照）都能看到结果。
    notifyRevision();
    muted = true;
    // 卸载后这一拍不该再跑：`stop()` 会清掉它，回调本身也再查一次 `disposed`。
    // 先撤掉上一轮还没跑的回调：否则旧回调会把 `settle` 置 0，新句柄随之丢失，`stop()` 就清不到它。
    if (settle) window.clearTimeout(settle);
    settle = window.setTimeout(function () {
      settle = 0;
      if (disposed) return;
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

  /**
   * 这批变动是不是全来自我们自己画的界面。
   *
   * 投影只改属性与行内样式，不触发 childList；但设置页、菜单、收纳包这些 React 树每次重画都会
   * 往 body 里加删节点——那些批次再触发一轮投影就是自激（投影 → 重渲染 → 再投影）。
   * 宿主内容的变动照常处理，所以只放行「全部落在插件自己容器里」的批次。
   *
   * @param batch MutationObserver 交来的一批变动。
   * @returns 可以整批忽略时为 true。
   */
  function ownMutations(batch: MutationRecord[]): boolean {
    if (batch.length === 0) return false;
    let i;
    for (i = 0; i < batch.length; i++) {
      const target = batch[i].target as Element | null;
      if (!target || target.nodeType !== 1 || typeof target.closest !== "function") return false;
      if (!target.closest(".lo-pop, .lo-stash, .lo-launcher, .lo-page, .lo-row, .lo-more-row, [data-plugin='" + PLUGIN_ID + "']")) return false;
    }
    return true;
  }

  function onMutations(batch: MutationRecord[]): void {
    if (muted) {
      dirty = true;
      return;
    }
    if (ownMutations(batch)) return;
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
      // 没有槽位的 scope（右侧边栏的 guide 卡片整条不进 slot 体系）不订阅，靠 MutationObserver 触发。
      if (!scope.slot) continue;
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
    if (settle) {
      window.clearTimeout(settle);
      settle = 0;
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

  return { start: start, stop: stop };
}