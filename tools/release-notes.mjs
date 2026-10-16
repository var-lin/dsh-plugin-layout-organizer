/**
 * 从 `CHANGELOG.md` 抽出指定版本的段落写到 stdout，供 CI 创建 GitHub Release 时当说明用。
 * 版本段从 `## [x.y.z]` 起，到下一个 `## [`、第一条链接定义行（`[x.y.z]: …`）或文件末尾止。
 *
 *   node tools/release-notes.mjs 1.0.1
 */
import { readFileSync } from "node:fs";

const version = process.argv[2];
if (!version) {
  console.error("usage: node tools/release-notes.mjs <version>");
  process.exit(1);
}

const changelog = readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8");
const lines = changelog.split("\n");
const start = lines.findIndex((line) => line.startsWith(`## [${version}]`));
if (start < 0) {
  console.error(`CHANGELOG.md has no section for ${version}`);
  process.exit(1);
}

let end = lines.length;
for (let i = start + 1; i < lines.length; i++) {
  if (lines[i].startsWith("## [") || /^\[[^\]]+\]:/.test(lines[i])) {
    end = i;
    break;
  }
}

const body = lines.slice(start + 1, end).join("\n").trim();
if (!body) {
  console.error(`CHANGELOG.md section for ${version} is empty`);
  process.exit(1);
}
process.stdout.write(body + "\n");
