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
t("03a node floor is 24", pkg.engines?.node === ">=24", String(pkg.engines?.node));
t("03b no self-made dsh.engines field", pkg.dsh?.engines === undefined);
t("03c host peer window covers every rc", Object.values(pkg.peerDependencies).every((r) => r === ">=0.1.7-rc.2 <0.3.0-0"));
t("03d test script runs the whole suite", /test\/smoke\.mjs/.test(pkg.scripts?.test ?? "") && /test\/navigate\.mjs/.test(pkg.scripts?.test ?? "") && /test\/accept\.mjs/.test(pkg.scripts?.test ?? ""), pkg.scripts?.test);
t("04 zh name is 插件布局整理", locale.includes('"nav": "插件布局整理"'));
t("04b icon replaced", existsSync(join(root, "assets", "icons", "layout.svg")) && /applySelfIcon/.test(code));
// 分割线的辅助函数在 `src/core/dom-line.ts` 里叫 `showDivider`。
t("05 divider implemented", /showDivider/.test(code) && /lo-divider/.test(code) && /className: CLASS\.divider|CLASS\.divider/.test(code));
t("06 rows are not text-selectable", /\.lo-row \*\{[^}]*user-select:\s*none/.test(css.replace(/\s+/g, " ")));
// 收纳包里的行点开之后要关掉设置弹窗：它和设置页卡片走同一条 `navigateFromSettings`，
// 关弹窗的动作就在那里面，故两处任一出现即可。
t("07 stash click closes the settings dialog", /closeSettings|navigateFromSettings/.test(stash) && /function closeSettings/.test(navigate));
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
/* 右键菜单第四项直接把这一行改判成官方 / 第三方：文案写目标分类（看着是第三方就写「官方」），
   动作只改本插件的本地覆盖 `state.kinds`，不动插件本身。菜单由 `menuActionsFor` 生成，
   界面行与设置页列表行两个入口共用，因此只断言这一处。 */
t("13b context menu reclassifies official / third-party",
  /MENU_ICON_SWITCH/.test(code) &&
  existsSync(join(root, "assets", "icons", "switch.svg")) &&
  /next\.kinds\[scope \+ ":" \+ id\] = official \? "third" : "official"/.test(code),
  (code.match(/MENU_ICON_SWITCH/g) || []).length + " refs");
/* 这个词换过两次：先叫「按钮收纳包」，后叫「悬浮框」，最后只留「已收起的按钮」这一个说法——
 * 界面上不该再出现前两个，三层说法叠在一起只会让人以为它们是不同的东西。 */
t("14 wording is 已收起的按钮 alone",
  locale.includes("已收起的按钮") && !locale.includes("收纳包") && !locale.includes("悬浮框"));
/* 分页里的滚动区是定高 flex 列：卡片与收纳行若允许收缩，就会被压扁成「只剩卡片头」，
   内容互相压住。三处滚动区都必须显式关掉收缩。 */
{
  const flat = css.replace(/\s+/g, "");
  const pinned = [".lo-scroll>*{flex:00auto}", ".lo-page>*{flex:00auto}", ".lo-card-body>*{flex:00auto}", ".lo-rows>*{flex:00auto}", ".lo-stash-body>*{flex:00auto}"];
  const missing = pinned.filter((rule) => !flat.includes(rule));
  t("16 scroll panes never squeeze their children", missing.length === 0, missing.join(" "));
}
/* 分段导航的槽必须用宿主自己的 interactive-bg-hover。浅色主题里 bg-base / bg-layer-1 /
   bg-layer-2 三个别名都解析到同一个 #fff，拿它们当槽色会让槽与面板同色、整条导航看不见边界。 */
{
  const flat = css.replace(/\s+/g, "");
  const trough = flat.slice(flat.indexOf(".lo-tabs{"), flat.indexOf(".lo-tab{"));
  t("17 tab trough uses the host hover token, not a white alias",
    trough.includes("--dsw-alias-interactive-bg-hover") && !/background:var\(--dsw-alias-bg-(base|layer-1|layer-2)\)/.test(trough),
    trough.slice(0, 120));
}
/* 搜索期间「打开已收起的按钮」是固定入口、没有可搜的名称或 id，必须整张让位。 */
{
  const flat = code.replace(/\s+/g, "");
  t("18 stash entry card steps aside while searching",
    /constlayoutBody:any\[\]=searching\?\[\]:\[/.test(flat),
    flat.slice(flat.indexOf("constlayoutBody:any"), flat.indexOf("constlayoutBody:any") + 60));
}

/* 空状态下两个恢复按钮必须灰着：卡片没有保存顺序也没有收纳行时，「恢复本组默认顺序」无事可做；
   整个状态还是出厂值时，「重置所有配置」同样无事可做。可点却毫无反应会让人以为按钮坏了。 */
{
  const flat = code.replace(/\s+/g, "");
  t("19 scope reset knows when it has nothing to undo",
    /functionscopeDirty\(state:PluginState,scope:string\):boolean\{/.test(flat) &&
    /disabled:!scopeDirty\(state,scope\)/.test(flat),
    flat.slice(flat.indexOf("disabled:!scopeDirty"), flat.indexOf("disabled:!scopeDirty") + 40));
  t("20 global reset knows when it has nothing to undo",
    /functionstateDirty\(state:PluginState\):boolean\{/.test(flat) &&
    /disabled:!stateDirty\(state\)/.test(flat),
    flat.slice(flat.indexOf("disabled:!stateDirty"), flat.indexOf("disabled:!stateDirty") + 40));
}

/* 卡片级动作（恢复本组默认顺序）必须在卡片标题行右侧，不再挂在卡片底部：
   摆在列表末尾时，卡片越长越要先滚到底才能看见。 */
{
  const flat = code.replace(/\s+/g, "");
  t("21 card action lives in the card head",
    /interfaceCardProps\{title\?:any;action\?:any;/.test(flat) &&
    /props\.action\?h\("span",\{className:"lo-card-action"\},props\.action\):null/.test(flat) &&
    /action:h\(ConfirmBtn,\{label:t\("action\.reset"\)/.test(flat),
    flat.slice(flat.indexOf("interfaceCardProps"), flat.indexOf("interfaceCardProps") + 50));
}
/* 已收起的按钮按位置 / 种类分组时，标题行右侧带一个「恢复本组默认」；
   按名称排序没有标题，因此不放按钮。 */
{
  const flat = code.replace(/\s+/g, "");
  t("22 titled stash groups carry their own reset",
    /className:"lo-stash-group-title"/.test(flat) &&
    /disabled:!groupDirty\(state,group\)/.test(flat) &&
    /constscopes=groupScopes\(group\);for\(letk=0;k<scopes\.length;k\+\+\)resetScope\(next,scopes\[k\]\);/.test(flat),
    flat.slice(flat.indexOf("disabled:!groupDirty"), flat.indexOf("disabled:!groupDirty") + 40));
}
/* 大标题右侧的版本号必须与 package.json 逐字一致：改版本忘了同步这里会当场失败，
   而不是悄悄显示旧号。 */
t("23 version badge matches package.json",
  constants.includes(`const PLUGIN_VERSION = "${pkg.version}"`) && /className: "lo-version"/.test(settings),
  `constants=${/const PLUGIN_VERSION = "([^"]+)"/.exec(constants)?.[1]} pkg=${pkg.version}`);

/* 搜索无命中的提示必须按数据算，不能看 `h(ScopeCard, …)` 的返回值：
   `h()` 只是创建一个元素对象，永远为真——卡片返回 null 要等 React 渲染时才发生。
   用元素真值判断会让「六张卡片全没命中」永远判成有命中，搜索结果显示成一片空白。 */
{
  const flat = code.replace(/\s+/g, "");
  t("24 search hit test reads data, not element truthiness",
    /functionscopeHit\(ctx:CtxLike,state:PluginState,scope:string,query:string\):boolean\{/.test(flat) &&
    /if\(scopeHit\(ctx,state,SCOPES\[i\]\.key,query\)\)anyScopeHit=true;/.test(flat) &&
    !/if\(scopeCards\[i\]\)anyScopeHit=true/.test(flat),
    flat.slice(flat.indexOf("if(scopeHit(ctx,state,SCOPES"), flat.indexOf("if(scopeHit(ctx,state,SCOPES") + 60));
}

/* 界面上本来点不动的行（例如 token-saver 那种只读统计条）在已收起的按钮里也必须不可点：
   导航会关掉面板与设置弹窗，「可点却毫无反应」比灰着更像坏掉。
   判据取界面本身（`rowClickable`）而不是位置名，因此换插件、换位置都不用改代码。 */
{
  const flat = code.replace(/\s+/g, "");
  t("25 stash rows follow the real clickability of the row",
    /functionrowClickable\(el:HTMLElement\):boolean\{/.test(flat) &&
    /returnisInteractive\(el\)\|\|clickTargetOf\(el\)!==el;/.test(flat) &&
    /if\(!liveRowIds\(scope\)\)returnviewSelectable\(scope,id\);/.test(flat) &&
    /functionviewSelectable\(scope:string,id:string\):boolean\{/.test(flat) &&
    /if\(scope!=="tabs"\|\|!loViewOpener\|\|!loActiveCtx\)returnfalse;/.test(flat) &&
    /constnavigable=rowNavigable\(item\.scope,item\.id\);/.test(flat) &&
    /navigable:navigable,/.test(flat),
    flat.slice(flat.indexOf("functionrowClickable"), flat.indexOf("functionrowClickable") + 60));
  t("26 inert stash rows never navigate or close the panel",
    /if\(row\.missing\|\|!row\.navigable\)return;/.test(flat) &&
    /constinert=row\.missing\|\|!row\.navigable;/.test(flat) &&
    /disabled:inert,/.test(flat),
    flat.slice(flat.indexOf("if(row.missing||!row.navigable)return;"), flat.indexOf("if(row.missing||!row.navigable)return;") + 50));
}
/* 标题行上的恢复按钮是次级动作，不该跟旁边的标题一样粗：
   卡片标题与分组标题都是 600，按钮继承下来会显得加粗。 */
{
  const flat = css.replace(/\s+/g, "");
  t("27 title-row reset buttons are not bold",
    /\.lo-stash-group\.lo-btn\{[^}]*font-weight:400/.test(flat) &&
    /\.lo-card-action\.lo-btn\{[^}]*font-weight:400/.test(flat),
    flat.slice(flat.indexOf(".lo-stash-group.lo-btn"), flat.indexOf(".lo-stash-group.lo-btn") + 80));
}

/* 「注册在这个槽位、渲染在别处」的记录靠机制判，不靠点名名单：有台账的槽位共用一把尺子，
   只有这一轮投影真正标记到的行才算存在；右侧边栏没有台账，改按宿主注册表列（见 rightCardList）。
   按位置兜底也跳过带认领钩子的记录。
   搜索时卡片与分组照旧可折叠，不能被搜索词强行拉开。 */
{
  const flat = code.replace(/\s+/g, "");
  t("28 only projected rows count for ledger-backed slots",
    /functionlistedInScope\(live:string\[\]\|null,id:string\):boolean\{/.test(flat) &&
    /return!!live&&live\.indexOf\(id\)>=0;/.test(flat) &&
    /constmissing=!listedInScope\(live,item\.id\);/.test(flat) &&
    !/FOREIGN_LEDGER_IDS|isForeignLedgerId/.test(flat),
    flat.slice(flat.indexOf("functionlistedInScope"), flat.indexOf("functionlistedInScope") + 80));
  t("29 search never forces a card or group open",
    /if\(scope&&rowHookOf\(scope,entries\[i\]\.id\)\)continue;/.test(flat) &&
    /constcardOpen=collapsedMap\[cardKey\]!==true;/.test(flat) &&
    /constexpanded=collapsedMap\[collapsedKey\]!==true;/.test(flat),
    flat.slice(flat.indexOf("constcardOpen="), flat.indexOf("constcardOpen=") + 60));
}

/* 合成 id 与官方 id 的重叠必须逐条报备：合成行没有台账条目，但分类上可以属于官方
   （`composer:context-meter` 就是这种情况）。没报备的重叠说明有人把合成行当台账行写了。 */
{
  const ALLOWED_OVERLAP = ["composer:context-meter", "right:more", "sidebar:more", "tabs:more"];
  const officialStart = constants.indexOf("const OFFICIAL_IDS");
  const officialEnd = constants.indexOf("HIDDEN_LEDGER_IDS");
  const syntheticStart = constants.indexOf("const SYNTHETIC_IDS");
  const syntheticEnd = constants.indexOf("// 一条记录的 DOM 认领钩子");
  const officialBlock = constants.slice(officialStart, officialEnd);
  const syntheticBlock = constants.slice(syntheticStart, syntheticEnd);
  const scopeKeys = ["sidebar", "footer", "tabs", "composer", "right", "settings"];
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

/* 对话页那扇「更多」菜单：宿主因宽度不够自己收进来的标签，宿主已经替它们画了行，
   我们再画同一颗标签就是重复项；去重只能去我们这行（宿主那行删不掉，用户 m00878）。 */
{
  const flat = strip(rd("ui/more-menu.ts")).replace(/\s+/g, "");
  t(
    "40 host-listed view tabs drop our duplicate menu rows",
    /consthostViews:string\[\]=\[\];/.test(flat) &&
      /constshown=rows\.filter\(function\(row\)\{/.test(flat) &&
      /row\.scope==="tabs"&&hostViews\.indexOf\(row\.id\)>=0/.test(flat),
    flat.slice(flat.indexOf("constshown=rows.filter"), flat.indexOf("constshown=rows.filter") + 120)
  );
}

console.log(failed === 0 ? `\nACCEPT PASS (${total}/${total})` : `\nACCEPT FAIL (${failed} of ${total} failed)`);
process.exit(failed === 0 ? 0 : 1);
