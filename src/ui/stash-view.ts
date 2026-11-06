/**
 * 启动器吸附到一侧并保留垂直偏移；不做垂直吸附。
 *
 * @param props 上下文与状态句柄，见 StashProps。
 * @returns 启动器按钮，`count > 0` 时带数量角标；`options.showStashLauncher` 为 false 时不渲染。
 */
function StashLauncher(props: StashProps): any {
  const store = props.store;
  useStoreTick(store);
  const state = store.get();
  const count = stashCount(state);

  const sizePair = useState({ width: 0, height: 0 });
  const size = sizePair[0];
  const setSize = sizePair[1];
  const ref = useRef<any>(null);
  const dragRef = useRef<any>(null);
  // 拖动期间把 style 写入合并到一帧一次的句柄。
  const frameRef = useRef(0);
  // 指针捕获不一定成功（宿主页面里 pointerId 失效、或浏览器拒绝），所以松手也认 window 上的
  // 那一份：指针在按钮外面松开时若只靠按钮自己的 onPointerUp，dragRef 会一直挂着，
  // 之后光是划过启动器就会把它拖走。
  const finishRef = useRef<any>(null);
  const setTick = useState(0)[1];

  useEffect(function () {
    function onWindowUp(event: any) {
      if (finishRef.current) finishRef.current(event);
    }
    window.addEventListener("pointerup", onWindowUp, true);
    window.addEventListener("pointercancel", onWindowUp, true);
    return function () {
      window.removeEventListener("pointerup", onWindowUp, true);
      window.removeEventListener("pointercancel", onWindowUp, true);
    };
  }, []);

  useEffect(function () {
    function onResize() {
      setTick(function (value: number) {
        return value + 1;
      });
    }
    window.addEventListener("resize", onResize);
    return function () {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // 尺寸变了才写回：依赖里只放当前尺寸，读到的几何量一变就会重跑一次，不会每帧都强制布局。
  useEffect(function () {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      if (rect.width !== size.width || rect.height !== size.height) {
        setSize({ width: rect.width, height: rect.height });
      }
    }
  }, [size.width, size.height]);

  // 组件卸载时不要留下一个已经排队的帧。
  useEffect(function () {
    return function () {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }
    };
  }, []);

  if (state.options.showStashLauncher === false) return null;

  const side = state.options.launcherSide === LAUNCHER_SIDE_LEFT ? LAUNCHER_SIDE_LEFT : LAUNCHER_SIDE_RIGHT;
  const width = size.width || 120;
  const height = size.height || 32;
  // 拖动前 `launcherY` 为 null；`clampLauncherY` 自己就接 null（读成 0 再夹到边距内），不必断言。
  const rawY = state.options.launcherY;
  const y = clampLauncherY(typeof rawY === "number" && isFinite(rawY) ? rawY : null, height);
  // 拖动中的横向跟手只落在手势状态里（见 `onPointerMove`）：这里按松手后定下的半边贴靠。
  const x = side === LAUNCHER_SIDE_LEFT
    ? LAUNCHER_MARGIN
    : Math.max(LAUNCHER_MARGIN, window.innerWidth - width - LAUNCHER_MARGIN);

  function onPointerDown(event: any): void {
    if (event.button !== undefined && event.button !== 0) return;
    const rect = ref.current.getBoundingClientRect();
    dragRef.current = {
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
      moved: false,
      width: rect.width,
      height: rect.height,
      x: rect.left,
      y: rect.top
    };
    if (ref.current.setPointerCapture) {
      try {
        ref.current.setPointerCapture(event.pointerId);
      } catch (err) {
        // 指针捕获非必需，失败可忽略
      }
    }
  }

  function onPointerMove(event: any): void {
    const drag = dragRef.current as DragState | null;
    if (!drag) return;
    if (!drag.moved) {
      // 两个轴都必须测，纯横向拖动也要越过 3px 阈值
      const rect = ref.current.getBoundingClientRect();
      const dx = Math.abs(event.clientX - (drag.dx + rect.left));
      const dy = Math.abs(event.clientY - (drag.dy + rect.top));
      if (dx < 3 && dy < 3) return;
      drag.moved = true;
    }
    // 位置先只写进手势状态，由 rAF 一次性落到元素 style；松手才写回 store
    drag.x = clampLauncherX(event.clientX - drag.dx, drag.width);
    drag.y = clampLauncherY(event.clientY - drag.dy, drag.height);
    if (frameRef.current) return;
    frameRef.current = window.requestAnimationFrame(function () {
      frameRef.current = 0;
      const live = dragRef.current as DragState | null;
      const node = ref.current;
      if (!live || !node) return;
      node.style.left = Math.round(live.x) + "px";
      node.style.top = Math.round(live.y) + "px";
    });
  }

  function onPointerUp(event: any): void {
    const drag = dragRef.current as DragState | null;
    dragRef.current = null;
    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }
    if (!drag) return;
    if (drag.moved) {
      // 松手才定边：指针在窗口左半边贴左、右半边贴右。
      const nextSide = event.clientX < window.innerWidth / 2 ? LAUNCHER_SIDE_LEFT : LAUNCHER_SIDE_RIGHT;
      // 拖动期间位置直写元素、React 看不到，按渲染时同样的算法再写一次最终位置
      const node = ref.current;
      if (node) {
        node.style.left =
          Math.round(nextSide === LAUNCHER_SIDE_LEFT ? LAUNCHER_MARGIN : Math.max(LAUNCHER_MARGIN, window.innerWidth - drag.width - LAUNCHER_MARGIN)) + "px";
        node.style.top = Math.round(drag.y) + "px";
      }
      store.update(function (state2: PluginState) {
        state2.options.launcherSide = nextSide;
        state2.options.launcherY = drag.y;
      }, { history: false });
    } else {
      openStash();
    }
  }

  // 给 window 上那份松手处理留最新的入口（渲染期写 ref，卸载后自然失效）。
  finishRef.current = onPointerUp;

  return h("button", {
    type: "button",
    ref: ref,
    className: "lo-launcher",
    // 不要 `title`：原生 tooltip 会在拖动时弹出来挡在按钮上。名字交给 `aria-label`。
    "aria-label": t("stash.launcher"),
    style: { left: Math.round(x) + "px", top: Math.round(y) + "px" },
    onPointerDown: onPointerDown,
    onPointerMove: onPointerMove,
    onPointerUp: onPointerUp,
    onPointerCancel: onPointerUp
  },
    // 启动器用本插件自己的图标做标识：它是这一处「已收纳的悬浮框」的唯一入口，
    // 写成文字既占地方又和侧边栏里的按钮长得不一样。
    h(Icon, { svg: ICON_SVG, className: "lo-launcher-ico", name: "layout" }),
    count > 0 ? h("span", { className: "lo-launcher-count" }, String(count)) : null
  );
}

/**
 * portal 画进 <body>：官方浮层 z-index:20 的层叠上下文会把 slot 子元素压在设置弹窗(1000)之下
 *
 * @param props 上下文与状态句柄，见 StashProps。
 * @returns 启动器与（收纳包打开时的）面板，经 createPortal 挂到 body 上。
 */
function StashSurface(props: StashProps): any {
  const pair = useState(stashFlag.get());
  const open = pair[0];
  const setOpen = pair[1];
  useEffect(function () {
    return stashFlag.subscribe(setOpen);
  }, []);
  return ReactDOM.createPortal(
    h(React.Fragment, null,
      h(StashLauncher, { ctx: props.ctx, store: props.store }),
      open ? h(StashPanel, { ctx: props.ctx, store: props.store }) : null
    ),
    document.body
  );
}
