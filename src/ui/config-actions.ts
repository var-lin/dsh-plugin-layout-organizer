// 配置导入 / 导出：把整份持久化状态（顺序、分类、收纳、开关）序列化成一个 JSON 文件。
// 导出走浏览器下载，导入走临时 `<input type=file>` 并整体覆盖 store，两步都由设置页的按钮触发。

const GITHUB_URL = "https://github.com/var-lin/dsh-plugin-layout-organizer";
// 问题反馈直接落到仓库的 issue 列表页，省掉用户从仓库首页再点一次。
const GITHUB_ISSUES_URL = GITHUB_URL + "/issues";

/**
 * 把当前持久化状态导出成 JSON 文件。
 *
 * @param store 提供持久化状态快照的 store 句柄。
 */
function exportConfig(store: StoreHandle): void {
  const text = JSON.stringify(store.get(), null, 2);
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "dsh-plugin-layout-organizer.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(function () {
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * 读文件、校验版本，再整体替换 store：version 对不上（别人的文件 / 旧格式）宁可拒绝也不导入半份数据。
 *
 * @param store 被覆盖的 store 句柄。
 * @param done 结果回调，`true` 表示已替换成功。
 */
function importConfig(store: StoreHandle, done: (ok: boolean) => void): void {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json,.json";
  input.addEventListener("change", function () {
    const file = input.files && input.files[0];
    input.remove();
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", function () {
      try {
        const raw: unknown = JSON.parse(String(reader.result || ""));
        const source = raw && typeof raw === "object" ? (raw as { version?: number }) : null;
        if (!source || source.version !== STATE_VERSION) {
          done(false);
          return;
        }
        store.replace(normalizeState(raw));
        done(true);
      } catch (err) {
        done(false);
      }
    });
    reader.addEventListener("error", function () {
      done(false);
    });
    reader.readAsText(file);
  });
  document.body.appendChild(input);
  input.click();
}
