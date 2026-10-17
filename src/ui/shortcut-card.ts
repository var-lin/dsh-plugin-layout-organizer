
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

/**
 * 快捷键编辑器的一行：键帽本身即录制入口；冲突与不受支持的组合由 `describeBinding` 以文字报出。
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
   * 录制期间由文档级捕获监听器收到按键：收集修饰键后把整组绑定交给服务的 `describeBinding`，由它报出问题或冲突。
   *
   * @param event 键帽上捕获到的按键事件；纯修饰键直接返回，描述器报出问题/冲突时只更新报告文字，都不写配置。
   */
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

  /**
   * 录制由文档级捕获监听器驱动并阻止传播，录制中的按键到不了这个处理函数。
   *
   * 调用时先清掉上一次的报告文字，再在录制/未录制之间切换。
   */
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
