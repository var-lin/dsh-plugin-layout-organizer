// 重渲染总线、撤销/还原栈与 store 句柄——状态本体在 `store.ts`，其余读写在下面几个文件里。
// 重渲染信号：投影落地或 store 变更后由 notifyRevision 通知这些订阅者（见 useRevisionTick）。
const __revisionListeners: Array<() => void> = [];

function subscribeRevision(fn: () => void): () => void {
  __revisionListeners.push(fn);
  return function () {
    const index = __revisionListeners.indexOf(fn);
    if (index >= 0) __revisionListeners.splice(index, 1);
  };
}

function notifyRevision(): void {
  const snapshot = __revisionListeners.slice();
  let i;
  for (i = 0; i < snapshot.length; i++) {
    try {
      snapshot[i]();
    } catch (err) {
      // 一个坏掉的订阅者不能拖垮其他订阅者
    }
  }
}

/**
 * React 侧的绑定：一个恰好随修订号变化的计数器。
 *
 * @returns 修订计数，每次 notifyRevision 后自增，用作重渲染的触发值。
 */
/**
 * 订阅式重渲染：订一次，每收到一次通知就让计数加一。
 *
 * 三个 hook（`useRevisionTick` / `useStoreTick` / `useSlotsTick`）本来就是同一段
 * 「useState + useEffect + setTick(v => v + 1)」，差别只在订阅谁、什么时候重订。
 *
 * @param deps 重新订阅的依赖（和 useEffect 的依赖数组同一个含义）。
 * @param subscribe 建立订阅：拿到 bump 就调它，返回退订函数（没有就算了）。
 * @returns 递增的计数。
 */
function useTicker(deps: any[], subscribe: (bump: () => void) => (() => void) | void): number {
  const pair = useState(0);
  const setTick = pair[1];
  useEffect(function () {
    const off = subscribe(function (): void {
      setTick(function (value: number) {
        return value + 1;
      });
    });
    return typeof off === "function" ? off : undefined;
  }, deps);
  return pair[0];
}

function useRevisionTick(): number {
  return useTicker([], function (bump: () => void) {
    return subscribeRevision(bump);
  });
}

// 落盘有 180ms 防抖，页面被收起或关掉时最后一次拖动很可能还在定时器里，
// 所以在 pagehide 时补一次同步落盘。登记的是每间 store 自己的补写函数：热替换后新旧两间
// 都还在的话，各自写回自己那份状态，不会只剩最后一间。
const __flushStore: Array<() => void> = [];
window.addEventListener("pagehide", function () {
  for (let i = 0; i < __flushStore.length; i++) {
    try {
      __flushStore[i]();
    } catch (err) {
      // 一间写失败不能挡住其他几间
    }
  }
});

/**
 * 撤销 / 还原的两摞快照，都只存在内存里（切版本、刷新就没了）。
 *
 * 快照是整份状态的 JSON：一次批量动作往往改 order / kinds / hidden 好几处，
 * 逐字段记差异容易漏，整份存最省心，20 步的量也不大。`__future` 是「还原」那摞，
 * 一旦有新改动就清空——否则还原会跳到一条已经不存在的分支上。
 */
const __history: string[] = [];
const __future: string[] = [];
const HISTORY_MAX = 20;

function pushHistory(snapshot: string): void {
  if (__history.length > 0 && __history[__history.length - 1] === snapshot) return;
  __history.push(snapshot);
  if (__history.length > HISTORY_MAX) __history.shift();
}

function canUndo(): boolean {
  return __history.length > 0;
}

function pushFuture(snapshot: string): void {
  if (__future.length > 0 && __future[__future.length - 1] === snapshot) return;
  __future.push(snapshot);
  if (__future.length > HISTORY_MAX) __future.shift();
}

/**
 * 退回上一份快照。
 *
 * @returns 真的退回去了为 true；没有快照、或快照解析不了为 false（按钮据此保持灰着）。
 */
function undoLast(store: StoreHandle): boolean {
  const snapshot = __history.pop();
  if (snapshot === undefined) return false;
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(snapshot);
  } catch (err) {
    return false;
  }
  pushFuture(JSON.stringify(store.get()));
  store.replace(normalizeState(parsed));
  return true;
}

function canRedo(): boolean {
  return __future.length > 0;
}

function redoLast(store: StoreHandle): boolean {
  const snapshot = __future.pop();
  if (snapshot === undefined) return false;
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(snapshot);
  } catch (err) {
    return false;
  }
  pushHistory(JSON.stringify(store.get()));
  store.replace(normalizeState(parsed));
  return true;
}

function createStore(): StoreHandle {
  let state = readState();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let saveFailed = false;

  function persist(): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      // 隐私模式 / 配额超限：保持内存里的 state 继续可用。只报一次，别每次防抖落盘都刷一行。
      if (!saveFailed) {
        saveFailed = true;
        if (typeof console !== "undefined") console.warn("[layout-organizer] state save failed:", err);
      }
    }
  }

  // 立刻落盘：把防抖定时器里那一次提前兑现（pagehide 走这条）。
  function flush(): void {
    if (timer) {
      window.clearTimeout(timer);
      timer = null;
    }
    persist();
  }
  __flushStore.push(flush);

  return {
    get: function () {
      return state;
    },
    subscribe: function (listener: (state: PluginState) => void) {
      // 与投影共用一条总线（`subscribeRevision`）：两边只是「要不要拿到 state」的差别，
      // 各维护一份会让同一次改动通知两遍，还容易漏掉一侧。
      return subscribeRevision(function () {
        listener(state);
      });
    },
    // `opts.history === false`：纯界面偏好（折叠、启动器位置）与后台清理不该占撤销步数，
    // 否则用户按「撤销」时布局纹丝不动、连按几次才开始退真正的改动。
    update: function (mutator: (state: PluginState) => PluginState | void, opts?: { history?: boolean }) {
      const before = opts && opts.history === false ? "" : JSON.stringify(state);
      const next = mutator(state);
      if (next) state = next;
      // 停在「默认」这套预设上时，它就是当前布局的镜像：每次改动顺手同步一次快照，
      // 切到别的预设上之后这份快照就冻在那儿，随时能应用回来。
      if (state.activePreset === "") {
        try {
          state.defaultPreset = capturePreset(state);
        } catch (err) {
          // 快照失败不影响这次改动本身
        }
      }
      if (before) {
        let after = "";
        try {
          after = JSON.stringify(state);
        } catch (err) {
          after = "";
        }
        if (after && after !== before) {
          pushHistory(before);
          __future.length = 0;
        }
      }
      // 订阅者与投影拿到的是同一次通知：store 的订阅已经挂在这条总线上。
      notifyRevision();
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        timer = null;
        persist();
      }, 180);
    },
    replace: function (next: PluginState) {
      state = next;
      notifyRevision();
      persist();
    },
    reset: function () {
      state = defaultState();
      notifyRevision();
      persist();
    }
  };
}
