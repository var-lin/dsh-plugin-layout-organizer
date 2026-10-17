// 验收探针：读 `src/**` 源码做形态检查；产物由 test/smoke.mjs 与 test/navigate.mjs 覆盖。
// 用法：node test/accept.mjs [pluginDir]
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// 插件根目录优先取命令行参数，否则由本文件位置推导，不用写死的绝对路径。
const root = process.argv[2] ?? resolve(dirname(fileURLToPath(import.meta.url)), "..");
const S = join(root, "src");
const rd = (n) => readFileSync(join(S, n), "utf8");
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

// `recursive` 在 Windows 上产出的是平台相关的分隔符；统一一下，排序才稳定。
const files = readdirSync(S, { recursive: true })
  .map((f) => String(f).split("\\").join("/"))
  .filter((f) => f.endsWith(".ts"))
  .sort();
const code = strip(files.map((f) => readFileSync(join(S, f), "utf8")).join("\n"));
const css = rd("ui/styles.ts");
const settings = strip(rd("ui/settings-page.ts"));
// 快捷键编辑器已从设置页拆到独立文件，卡片级断言看拆出来的那一份。
const shortcutCard = strip(rd("ui/shortcut-card.ts"));
const stash = strip(rd("ui/stash.ts"));
const uiKit = strip(rd("ui/kit.ts"));
const locale = rd("shared/locale.ts");
const constants = rd("shared/constants.ts");
const navigate = strip(rd("core/dom-navigate.ts"));
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

let failed = 0;
let total = 0;
const t = (label, ok, ev) => {
  total += 1;
  if (!ok) failed += 1;
  console.log(`${ok ? "PASS" : "FAIL"} | ${label}${ev ? " | " + ev : ""}`);
};

// 遍历若无声失败，下面大部分取反的检查都会变成假通过。
t("00 sources discovered", files.length >= 15, `${files.length} .ts files`);

t("01 launcher draggable / edge snap / top clamp", /onPointerMove/.test(code) && /launcherSide/.test(code) && /clampLauncherY/.test(code) && /topInset/.test(code));
t("01b no corner model left", !/launcherCorner|CORNERS/.test(code));
t("02 stash sorting absent from the settings page", !/stashSort|SORT_MODES/.test(settings));
t("03 engines.dsh declared for the market", pkg.engines?.dsh === ">=0.1.7-rc.2", String(pkg.engines?.dsh));
t("03b no self-made dsh.engines field", pkg.dsh?.engines === undefined);
t("03c host peer window covers every rc", Object.values(pkg.peerDependencies).every((r) => r === ">=0.1.7-rc.2 <0.3.0-0"));
t("03d test script runs the whole suite", /test\/smoke\.mjs/.test(pkg.scripts?.test ?? "") && /test\/navigate\.mjs/.test(pkg.scripts?.test ?? "") && /test\/accept\.mjs/.test(pkg.scripts?.test ?? ""), pkg.scripts?.test);
t("04 zh name is 插件布局整理", locale.includes('"nav": "插件布局整理"'));
t("04b icon replaced", existsSync(join(root, "assets", "icons", "layout.svg")) && /applySelfIcon/.test(code));
// 分割线的辅助函数在 `src/core/dom-line.ts` 里叫 `showDivider`。
t("05 divider implemented", /showDivider/.test(code) && /lo-divider/.test(code) && /className: CLASS\.divider|CLASS\.divider/.test(code));
t("06 rows are not text-selectable", /\.lo-row \*\{[^}]*user-select:\s*none/.test(css.replace(/\s+/g, " ")));
t("07 stash click closes the settings dialog", /closeSettings/.test(stash) && /function closeSettings/.test(navigate));
t("08 exactly three sort modes", /SORT_MODES[^=]*= \["scope", "kind", "alpha"\]/.test(constants));
t("08b restore-all sits on its own row", /lo-stash-actions/.test(css) && /lo-stash-actions/.test(stash));
const idx = ['key: "sidebar"', 'key: "footer"', 'key: "tabs"', 'key: "composer"', 'key: "settings"'].map((k) => constants.indexOf(k));
t("09 scope order sidebar>footer>tabs>composer>settings", idx.every((v, n) => v > 0 && (n === 0 || v > idx[n - 1])), JSON.stringify(idx));
t("10 stash hint text removed", !/stash\.hint/.test(code));
t("10b this plugin can be stashed too", !/props\.self \? null/.test(uiKit));
t("11 shortcut editor with conflict text", /describeBinding/.test(shortcutCard) && /shortcut\.conflict/.test(locale) && /shortcuts\.edit/.test(shortcutCard));
// 有下属行的开关带一个可点击整行切换的折叠箭头（默认折叠，展开时旋转 180°）。
t("12 collapsible rows with rotating caret", /onToggleCollapse/.test(code) && /lo-caret/.test(code) && /data-collapsed/.test(code));
/* 各行不再各自带 `el.oncontextmenu`；`src/core/dom-menu.ts` 在 `window` 上委托了一个
   捕获阶段的 `contextmenu` 监听，再从目标元素反查所属的行。 */
t("13 context menu up/down/stash", /contextmenu/.test(code) && /openMenu/.test(code));
t("14 wording is 按钮收纳包", locale.includes("按钮收纳包"));
/* 分页里的滚动区是定高 flex 列：卡片与收纳行若允许收缩，就会被压扁成「只剩卡片头」，
   内容互相压住。三处滚动区都必须显式关掉收缩。 */
{
  const flat = css.replace(/\s+/g, "");
  const pinned = [".lo-scroll>*{flex:00auto}", ".lo-page>*{flex:00auto}", ".lo-card-body>*{flex:00auto}", ".lo-rows>*{flex:00auto}", ".lo-stash-body>*{flex:00auto}"];
  const missing = pinned.filter((rule) => !flat.includes(rule));
  t("16 scroll panes never squeeze their children", missing.length === 0, missing.join(" "));
}

/* 合成 id 与官方 id 的重叠必须逐条报备：合成行没有台账条目，但分类上可以属于官方
   （`composer:context-meter` 就是这种情况）。没报备的重叠说明有人把合成行当台账行写了。 */
{
  const ALLOWED_OVERLAP = ["composer:context-meter"];
  const officialStart = constants.indexOf("const OFFICIAL_IDS");
  const officialEnd = constants.indexOf("HIDDEN_LEDGER_IDS");
  const syntheticStart = constants.indexOf("const SYNTHETIC_IDS");
  const syntheticEnd = constants.indexOf("// 一条记录的 DOM 认领钩子");
  const officialBlock = constants.slice(officialStart, officialEnd);
  const syntheticBlock = constants.slice(syntheticStart, syntheticEnd);
  const scopeKeys = ["sidebar", "footer", "tabs", "composer", "settings"];
  const listedOfficial = (key) => {
    const at = officialBlock.indexOf(`${key}: [`);
    if (at < 0) return [];
    const line = officialBlock.slice(at, officialBlock.indexOf("\n", at));
    return [...line.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  };
  const listedSynthetic = (key) => {
    const at = syntheticBlock.indexOf(`${key}: [`);
    if (at < 0) return [];
    const line = syntheticBlock.slice(at, syntheticBlock.indexOf("\n", at));
    return [...line.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  };
  const offenders = scopeKeys.flatMap((key) =>
    listedOfficial(key).filter((id) => listedSynthetic(key).includes(id) && !ALLOWED_OVERLAP.includes(`${key}:${id}`)).map((id) => `${key}:${id}`)
  );
  t("15 synthetic ids never claim ledger identity", offenders.length === 0, offenders.join(", "));
}

console.log(failed === 0 ? `\nACCEPT PASS (${total}/${total})` : `\nACCEPT FAIL (${failed} of ${total} failed)`);
process.exit(failed === 0 ? 0 : 1);
