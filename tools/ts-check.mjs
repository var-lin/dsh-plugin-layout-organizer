// 用编辑器自带的 TypeScript 编译器跑一遍 src/**/*.ts，列出全部诊断。
// 用法: node tools/ts-check.mjs
// 项目没有 node_modules，所以直接吃 VS Code 内置的 typescript.js（TS 6.0.3）；
// 机器上没有编辑器（例如 CI）时退回 `npx` 按需下载同一版本，工作流因此可以只跑这一个入口。
import { createRequire } from "node:module";
import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import path from "node:path";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configPath = path.join(root, "tsconfig.json");
// VS Code 每次更新都会换目录里的哈希，所以扫目录找 typescript.js。
const roots = [
  "E:/Microsoft VS Code",
  "C:/Program Files/Microsoft VS Code",
  "C:/Program Files (x86)/Microsoft VS Code",
  process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Programs", "Microsoft VS Code") : "",
].filter(Boolean);
const rel = "resources/app/extensions/node_modules/typescript/lib/typescript.js";
const candidates = [];
for (const dir of roots) {
  if (!existsSync(dir)) continue;
  candidates.push(path.join(dir, rel));
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) candidates.push(path.join(dir, entry.name, rel));
  }
}
const tsPath = candidates.find((p) => existsSync(p));
if (!tsPath) {
  // 没有编辑器就按需下载固定版本（CI 走这条）：版本写死，避免本地与流水线各查一套。
  console.log("没有找到编辑器内置的 typescript.js，改用 npx 下载 typescript@6.0.3。");
  const fallback = spawnSync("npx", ["-y", "--package", "typescript@6.0.3", "tsc", "-p", configPath], {
    stdio: "inherit",
    // Windows 上 npx 是 .cmd，不经过 shell 找不到可执行文件。
    shell: process.platform === "win32",
  });
  if (fallback.error) {
    console.error("npx 启动失败:", fallback.error.message);
    process.exit(2);
  }
  process.exit(typeof fallback.status === "number" ? fallback.status : 2);
}
const ts = require(tsPath);

const read = ts.readConfigFile(configPath, ts.sys.readFile);
if (read.error) {
  console.error("读 tsconfig 失败:", ts.flattenDiagnosticMessageText(read.error.messageText, " "));
  process.exit(2);
}
const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, root);
const program = ts.createProgram(parsed.fileNames, parsed.options);
const diagnostics = [
  ...ts.getPreEmitDiagnostics(program),
  ...program.getConfigFileParsingDiagnostics(),
];

const byFile = new Map();
const snippets = [];
let globalCount = 0;
for (const d of diagnostics) {
  if (!d.file) {
    globalCount += 1;
    console.log("—", ts.flattenDiagnosticMessageText(d.messageText, " "));
    continue;
  }
  const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
  const key = path.relative(root, d.file.fileName);
  if (!byFile.has(key)) byFile.set(key, []);
  const text = d.file.text.split(/\r?\n/)[line] ?? "";
  byFile.get(key).push(`${line + 1}:${character + 1} ts${d.code} ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`);
  if (snippets.length < 60) snippets.push(`${key}:${line + 1} ts${d.code} | ${text.trim().slice(0, 140)}`);
}

let total = 0;
for (const [file, list] of [...byFile.entries()].sort()) {
  total += list.length;
  console.log(`\n### ${file} (${list.length})`);
  for (const line of list.slice(0, 12)) console.log("  " + line);
  if (list.length > 12) console.log(`  …还有 ${list.length - 12} 条`);
}
console.log("\n=== 源码行摘录 ===");
for (const s of snippets) console.log("  " + s);
const codes = new Map();
for (const d of diagnostics) codes.set(d.code, (codes.get(d.code) ?? 0) + 1);
console.log("\n=== 错误码统计 ===");
for (const [code, n] of [...codes.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ts${code}: ${n}`);
console.log(`\n合计 ${total} 条诊断，涉及 ${byFile.size} 个文件`);
// 有诊断就以非零码退出，CI / 本地脚本才能拿它当闸门用（之前永远返回 0）。
if (total + globalCount > 0) process.exitCode = 1;
