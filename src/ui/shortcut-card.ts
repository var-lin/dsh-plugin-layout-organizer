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

interface ShortcutCardProps {
  ctx: CtxLike;
  store: StoreHandle;
}

/**
 * 成功绝不能被报成 保存失败：`"saved"` 与 `"ok"` 都算成功。
 *
 * @param status 编辑服务返回的状态值。
 * @returns 状态为 `"saved"` 或 `"ok"` 时为 true。
 */
function shortcutSaveOk(status: unknown): boolean {
  return status === "saved" || status === "ok";
}

// 录制期间把宿主的系统级按键拦下来：桌面版走原生键盘桥，DOM 上的 preventDefault 拦不住它
// （用户 m01368）。由 main.ts 注入 `shortcuts.recording`，服务不在时安静跳过。
let loRecordGuard: ((active: boolean) => Promise<void> | void) | null = null;

/**
 * 注入「进入/退出录制」的桥；宿主 `shortcuts.recording(active)` 是唯一被支持的入口。
 *
 * @param guard 传 null 撤销桥。
 */
function setShortcutRecordGuard(guard: ((active: boolean) => Promise<void> | void) | null): void {
  loRecordGuard = guard;
}

function guardRecording(active: boolean, fail?: (err: unknown) => void): void {
  if (!loRecordGuard) return;
  try {
    const pending = loRecordGuard(active);
    if (pending && typeof pending.catch === "function") {
      pending.catch(function (err: unknown) {
        if (fail) fail(err);
      });
    }
  } catch (err) {
    if (fail) fail(err);
  }
}

/**
 * 键帽文案：宿主给的键名可能是整串「Ctrl+Shift+O」，也可能拆成「Ctrl+」「Shift+」「O」。
 * 统一拆成键名再用「 + 」连接，框里才不会挤成一团（用户 m02536）。
 *
 * @param keys 目录给出的键名片段。
 * @returns 形如「Ctrl + Shift + O」的展示文案。
 */
function keyCapText(keys: string[]): string {
  const parts: string[] = [];
  let i: number;
  for (i = 0; i < keys.length; i++) {
    const bits = String(keys[i]).split("+");
    let j: number;
    for (j = 0; j < bits.length; j++) {
      const bit = bits[j].trim();
      if (bit) parts.push(bit);
    }
  }
  return parts.join(" + ");
}

interface GestureFieldProps {
  label: string;
  hint: string;
  keys: string[];
  button: string;
  // 另一个手势的前缀：录制后若与它相同，提示「两侧同前缀」（仍允许，靠左右键区分）。
  other: string[];
  onSave(keys: string[]): void;
}

/**
 * 鼠标手势的前缀录制框：只收修饰键，鼠标键固定，所以框里显示「前缀 + 左键 / 右键」。
 *
 * 做成真实的 `<input>` 并聚焦：宿主把焦点在输入框里的按键当成 `editable` 区域、直接跳过自己的
 * 快捷键（用户 m01368 反馈「设置快捷键时其他快捷键也会触发」）。Enter 或失焦保存，Esc 放弃。
 *
 * @param props 标签、提示、当前前缀、固定鼠标键的文案与保存回调。
 * @returns 一行手势设置。
 */
function GestureField(props: GestureFieldProps): any {
  const pendingPair = useState<string[] | null>(null);
  const pending = pendingPair[0];
  const setPending = pendingPair[1];
  const recPair = useState(false);
  const recording = recPair[0];
  const setRecording = recPair[1];
  // Enter 会先 commit 再 blur，而 blur 还有自己的提交：用 ref 记住这一轮已经交过了，
  // 否则同一次保存会写两遍（状态值相同，但会多发一次持久化，也让人以为改了两回）。
  const committed = useRef(false);
  const current = pending || props.keys;
  // 手势自己的回执写在它自己那一行右边：保存的是哪一个前缀，提示就贴着哪一个，
  // 不该跑到卡片顶部的键盘快捷键那一行去（用户 m02500）。
  const msgPair = useState<ShortcutReport | null>(null);
  const msg = msgPair[0];
  const setMsg = msgPair[1];

  function onKeyDown(event: KeyboardEvent): void {
    // Tab 要留给浏览器移走焦点：拦下来这个框就成了键盘陷阱，只能靠鼠标离开。
    if (event.key === "Tab") return;
    event.preventDefault();
    event.stopPropagation();
    const target = event.target as HTMLInputElement;
    if (event.key === "Escape") {
      setPending(null);
      target.blur();
      return;
    }
    if (event.key === "Enter") {
      commit();
      target.blur();
      return;
    }
    // 只认修饰键：字母 / 数字一概不收，鼠标键本身就是固定的左 / 右。
    if (["Control", "Alt", "Shift", "Meta"].indexOf(event.key) < 0) return;
    setPending(modifierKeysOf(event));
  }

  function commit(): void {
    // 已经交过这一轮就不再交（Enter 会先 commit 再 blur，blur 也有自己的提交）。
    if (committed.current) return;
    committed.current = true;
    const next = pending;
    setPending(null);
    // 只是点进来又移开、一个修饰键都没按：什么都不改，也别报「前缀不能为空」。
    if (!next) return;
    // 一个修饰键都没按就回车：不能把前缀存成空（那样手势就再也不会触发），说清楚原因。
    if (next.length === 0) {
      setMsg({ tone: "error", text: t("gesture.prefixEmpty") });
      return;
    }
    if (gestureText(next) === gestureText(props.keys)) {
      setMsg(null);
      return;
    }
    const same = gestureText(next) === gestureText(props.other);
    props.onSave(next);
    setMsg(same ? { tone: "warn", text: t("gesture.prefixSame") } : { tone: "ok", text: t("gesture.saved") });
  }

  return h(Field, {
    label: props.label,
    hint: props.hint,
    stack: true,
    children: h("div", { className: "lo-keyrow" },
      h("input", {
        className: "lo-keys",
        type: "text",
        readOnly: true,
        value: recording ? t("gesture.recording") : gestureText(current) + " + " + props.button,
        "data-recording": recording ? "1" : undefined,
        title: t("gesture.record"),
        onFocus: function () {
          committed.current = false;
          setPending(null);
          setMsg(null);
          setRecording(true);
          guardRecording(true);
        },
        onBlur: function () {
          if (!committed.current) commit();
          setRecording(false);
          guardRecording(false);
        },
        onKeyDown: onKeyDown
      }),
      msg ? h("span", { className: "lo-shortcut-msg", "data-tone": msg.tone }, msg.text) : null
    )
  });
}

/**
 * 快捷键编辑器：宿主悬浮框的开关热键 + 两个鼠标手势的前缀。
 *
 * @param props 上下文与状态句柄，见 ShortcutCardProps。
 * @returns 快捷键卡片元素。
 */
function ShortcutCard(props: ShortcutCardProps): any {
  const ctx = props.ctx;
  useStoreTick(props.store);
  const pair = useState<ShortcutReport | null>(null);
  const report = pair[0];
  const setReport = pair[1];
  const setTick = useState(0)[1];
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

  // 卡片被拆掉时别忘了退出录制：否则宿主的系统级按键会一直保持被拦下的状态。
  useEffect(function () {
    return function () {
      guardRecording(false);
    };
  }, []);

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

  /**
   * 冲突报告需把 id 映射回人类可读标签，目录是唯一提供该映射的地方。
   *
   * @param ids 冲突的快捷键 id 列表。
   * @returns 目录里有对应标签时用标签，否则退回 id 本身，逗号分隔。
   */
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

  /**
   * 录制期间由获得焦点的输入框收到按键：收集修饰键后把整组绑定交给服务的 `describeBinding`，
   * 由它报出问题或冲突；输入框聚焦时宿主把 region 判成 `editable`，别的快捷键不会被顺带触发。
   *
   * @param event 输入框上捕获到的按键事件；纯修饰键直接返回，描述器报出问题/冲突时只更新报告文字，都不写配置。
   */
  function capture(event: KeyboardEvent): void {
    // Tab 留给浏览器：否则一旦聚焦这个框，键盘就再也切不走焦点（用户没有鼠标时等于卡死）。
    if (event.key === "Tab") return;
    event.preventDefault();
    event.stopPropagation();
    const target = event.target as HTMLInputElement;
    if (event.key === "Escape") {
      target.blur();
      return;
    }
    const modifiers = modifierKeysOf(event);
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
      // 冲突的组合不生效：只报出来，配置一个字都不写（用户 m01368）。
      setReport({ tone: "error", text: t("shortcut.conflict").replace("{list}", names(described.conflicts)) });
      return;
    }
    const revision = shortcuts.config.getSnapshot().revision;
    setRecording(false);
    target.blur();
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

  function saveGesture(field: string, next: string[]): void {
    props.store.update(function (state: PluginState): void {
      if (field === "gestureMore") state.options.gestureMore = next;
      else state.options.gestureStash = next;
    }, { history: false });
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
        h("input", {
          className: "lo-keys",
          type: "text",
          readOnly: true,
          value: recording ? t("shortcut.recording") : keys.length > 0 ? keyCapText(keys) : t("shortcut.none"),
          "data-recording": recording ? "1" : undefined,
          "data-empty": keys.length > 0 ? undefined : "1",
          title: recording ? t("shortcut.recording") : t("shortcut.record"),
          onFocus: function () {
            setReport(null);
            setRecording(true);
            guardRecording(true, function () {
              setReport({ tone: "error", text: t("shortcut.recordFailed") });
            });
          },
          onBlur: function () {
            setRecording(false);
            guardRecording(false);
          },
          onKeyDown: capture
        }),
        status,
        h("span", { className: "lo-keyrow-end" }, h(Btn, { disabled: !bound, onClick: reset }, t("shortcut.reset")))
      )
    }),
    h(GestureField, {
      label: t("gesture.stashLabel"),
      hint: t("gesture.stashHint"),
      keys: props.store.get().options.gestureStash,
      other: props.store.get().options.gestureMore,
      button: t("gesture.left"),
      onSave: function (next: string[]) {
        saveGesture("gestureStash", next);
      }
    }),
    h(GestureField, {
      label: t("gesture.moreLabel"),
      hint: t("gesture.moreHint"),
      keys: props.store.get().options.gestureMore,
      other: props.store.get().options.gestureStash,
      button: t("gesture.right"),
      onSave: function (next: string[]) {
        saveGesture("gestureMore", next);
      }
    })
  );
}
