/**
 * 把 `src/**\/*.ts` 与 `assets/icons/` 图标打成一个 `lib/client.js`，即 DSH 客户端模块加载器所期望的单文件包：
 * 客户端运行时不允许拆分多文件包，所以用拼接；文件顺序即模块图（共用一个作用域，影响顶层 const/let 初始化），
 * 类型由 `module.stripTypeScriptTypes` 以 `mode: "transform"` 擦除，源码里 `@@svg:文件名@@` 占位符
 * （可带 `@尺寸`，缺省 14）替换为归一后的内联 SVG，素材缺失/为空/无 <path>、占位符残留都会让构建失败。
 *
 *   node build.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { stripTypeScriptTypes } from "node:module";

const PKG = "dsh-plugin-layout-organizer";
const root = dirname(fileURLToPath(import.meta.url));
const srcDir = join(root, "src");
const outFile = join(root, "lib", "client.js");

// 依赖顺序。每一项都是 `src/` 下的路径，用 POSIX 分隔符。
const BUILD_ORDER = [
  // 只有形状，构建时会被擦除。类型文件都在 src/types/ 下
  "types/state.ts",
  // 常量放最前：样式表会插值用到里面的 z-index 值
  "shared/constants.ts",
  // 菜单图标：纯 SVG 字符串，必须排在写它们的菜单之前
  "shared/icons.ts",
  "shared/locale.ts",
  "core/store.ts",
  // 插件图标兜底：要 notifyRevision（store.ts），也要排在使用它的 dom-rows.ts 之前
  "core/dom-rows.ts",
  "core/dom-line.ts",
  "core/dom-menu.ts",
  "core/dom-project.ts",
  "core/dom-navigate.ts",
  "core/organizer.ts",
  // 两个拖拽控制器共用的手势管线，排在它们之前
  "drag/drag-frame.ts",
  "drag/drag-rows.ts",
  "drag/drag-list.ts",
  "ui/styles.ts",
  "ui/kit.ts",
  "ui/search.ts",
  "ui/config-actions.ts",
  "ui/scope-card.ts",
  "ui/shortcut-card.ts",
  "ui/settings-page.ts",
  "ui/stash.ts",
  "ui/more-menu.ts",
  "main.ts"
];

const missing = BUILD_ORDER.filter((rel) => {
  try {
    readFileSync(join(srcDir, rel), "utf8");
    return false;
  } catch {
    return true;
  }
});
if (missing.length > 0) {
  console.error(`build failed: missing source file(s):\n  ${missing.join("\n  ")}`);
  process.exit(1);
}

// assets/icons 随 npm 包发布且是构建输入，坏素材不该等占位符引用了才暴露，所以预扫描就校验空文件与缺失 <path>。
const iconDir = join(root, "assets", "icons");

function fail(message) {
  console.error(`build failed: ${message}`);
  process.exit(1);
}

const iconAssets = existsSync(iconDir) ? readdirSync(iconDir).filter((n) => n.endsWith(".svg")) : [];
if (iconAssets.length === 0) fail("no .svg files under assets/icons/");
for (const name of iconAssets) {
  const raw = readFileSync(join(iconDir, name), "utf8");
  if (!raw.trim() || !raw.includes("<path")) fail(`assets/icons/${name} is empty or has no <path>`);
}

/* 把一份 SVG 素材归一成可内联的 <svg> 文档：viewBox 取源文件（缺失时由 width/height 推导），
   宽高取占位符尺寸，颜色归一为 currentColor（"none" 保留），补 aria-hidden / focusable；
   填充型只给 fill，描边型给 fill + stroke 并沿用源文件的线型属性。 */
function normalizeSvg(name, size, raw) {
  const open = raw.match(/<svg\b[^>]*>/);
  const end = raw.indexOf("</svg>");
  if (!open || end < 0 || end < open.index + open[0].length) fail(`assets/icons/${name} is not a <svg> document`);
  const tag = open[0];
  const body = raw.slice(open.index + open[0].length, end);
  if (!body.includes("<path")) fail(`assets/icons/${name} has no <path>`);
  let viewBox = (tag.match(/\bviewBox="([^"]+)"/) || [])[1];
  if (!viewBox) {
    const w = tag.match(/\bwidth="([\d.]+)(?:px)?"/);
    const h = tag.match(/\bheight="([\d.]+)(?:px)?"/);
    if (!w || !h) fail(`assets/icons/${name} has neither viewBox nor width/height`);
    viewBox = `0 0 ${Number(w[1])} ${Number(h[1])}`;
  }
  const toCurrent = (whole, key, value) => (value === "none" ? whole : `${key}="currentColor"`);
  const rootTag = tag.replace(/\b(fill|stroke)="([^"]*)"/g, toCurrent);
  const inner = body.replace(/\b(fill|stroke)="([^"]*)"/g, toCurrent);
  const stroked = /\bstroke="currentColor"/.test(rootTag + inner);
  const fill = rootTag.match(/\bfill="([^"]*)"/);
  const lineStyle = (rootTag.match(/\b(stroke-width|stroke-linecap|stroke-linejoin|stroke-dasharray|fill-rule|clip-rule)="[^"]*"/g) || []).join(" ");
  const color = stroked
    ? `fill="${fill ? fill[1] : "none"}" stroke="currentColor"${lineStyle ? " " + lineStyle : ""}`
    : 'fill="currentColor"';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${size}" height="${size}" ${color} aria-hidden="true" focusable="false">${inner}</svg>`;
}

/* 源码里的 `@@svg:文件名@@`（可带 `@尺寸`）换成归一化后的字符串。占位符必须独占一个双引号字面量，
   吃不掉的残片说明写坏了，构建直接失败。 */
function inlineSvgs(rel, source) {
  const out = source.replace(/"@@svg:([^"]+?)@@"/g, (whole, spec) => {
    const at = spec.lastIndexOf("@");
    const name = at < 0 ? spec : spec.slice(0, at);
    const size = at < 0 ? 14 : Number(spec.slice(at + 1));
    if (!name || !Number.isInteger(size) || size <= 0) fail(`src/${rel}: bad placeholder @@svg:${spec}@@`);
    const file = join(iconDir, name);
    if (!existsSync(file)) fail(`src/${rel}: @@svg:${spec}@@ has no asset assets/icons/${name}`);
    return JSON.stringify(normalizeSvg(name, size, readFileSync(file, "utf8")));
  });
  if (out.includes("@@svg:")) fail(`src/${rel}: malformed @@svg@@ placeholder`);
  return out;
}

// 菜单图标常量必须走 `@@svg:` 占位符，不得手写 <svg>。
const iconsSource = readFileSync(join(srcDir, "shared/icons.ts"), "utf8");
if (!/"@@svg:[^"]+@@"/.test(iconsSource)) fail("src/shared/icons.ts carries no @@svg:…@@ placeholder");
if (/MENU_ICON_[A-Z]+\s*=\s*["']<svg/.test(iconsSource)) fail("src/shared/icons.ts embeds hand-written SVG");

const modules = BUILD_ORDER.map((rel) => {
  const source = inlineSvgs(rel, readFileSync(join(srcDir, rel), "utf8"));
  // 首次调用时 Node 会抛一条 ExperimentalWarning，这里先静音，让构建日志保持可读。
  const originalEmit = process.emitWarning;
  let code;
  try {
    process.emitWarning = () => {};
    code = stripTypeScriptTypes(source, { mode: "transform" });
  } finally {
    process.emitWarning = originalEmit;
  }
  return { rel, code };
});

const body = modules
  .map(({ rel, code }) => `// src/${rel}\n${code.trim()}`)
  .join("\n\n");

// 这条横幅本身是块注释，里面不能出现能结束块注释的字符组合（如星号后跟斜杠），所以横幅写目录名而不是通配符。
const head = `/* ${PKG} — GENERATED FILE. Edit the TypeScript under src/ and run \`node build.mjs\`. */
window.__ModuleLoader__.load({
  id: ${JSON.stringify(PKG)},
  factory: function (require) {
    var React = require("react");
    var ReactDOM = require("react-dom");
    var h = React.createElement;
    var useState = React.useState;
    var useEffect = React.useEffect;
    var useRef = React.useRef;
    var useMemo = React.useMemo;
    var useCallback = React.useCallback;

`;
const tail = `
    return { inject: inject, apply: apply };
  },
});
`;

const output = head + body + tail;
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, output, "utf8");
console.log(`built ${outFile} (${output.length} bytes) from ${modules.length} modules:`);
for (const { rel } of modules) console.log(`  src/${rel}`);