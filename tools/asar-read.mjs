/* 从 DSH 的 app.asar 里按需读取文件或搜索内容。

   asar 是一个单独的大文件，不能当目录用：`E:\DeepSeek Harness\resources\app.asar\dsh\...`
   这样的路径在文件系统里根本不存在（grep 会报 os error 3）。这个脚本直接按 asar 的格式
   解析头部索引，再定位并读出目标文件。

   用法：
     node tools/asar-read.mjs list <目录前缀>            列出索引里匹配的路径
     node tools/asar-read.mjs read <归档内路径> [--out 文件]   打印或导出某个文件
     node tools/asar-read.mjs grep <归档内路径> <正则> [--before N] [--after N]
                                                         打印匹配行及上下文

   归档根路径可用 --asar 覆盖；默认是安装目录下的 resources/app.asar。 */

import fs from "node:fs";
import path from "node:path";

const DEFAULT_ASAR = "E:/DeepSeek Harness/resources/app.asar";

function parseArgs(argv) {
  const out = { _: [], asar: DEFAULT_ASAR, out: null, before: 0, after: 0 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--asar") out.asar = argv[++i];
    else if (arg === "--out") out.out = argv[++i];
    else if (arg === "--before") out.before = Number(argv[++i]) || 0;
    else if (arg === "--after") out.after = Number(argv[++i]) || 0;
    else out._.push(arg);
  }
  return out;
}

/* asar 头部是三层嵌套的长度前缀：外层 8 字节里偏移 4 是头部总长度；头部自身偏移 0 是它
   的长度，偏移 4 是 JSON 字符串的字节数，JSON 从偏移 8 开始；文件数据区紧跟在 8 + 头部
   总长度之后。 */
function open(archive) {
  const fd = fs.openSync(archive, "r");
  const sizeBuf = Buffer.alloc(8);
  fs.readSync(fd, sizeBuf, 0, 8, 0);
  const headerSize = sizeBuf.readUInt32LE(4);
  const headerBuf = Buffer.alloc(headerSize);
  fs.readSync(fd, headerBuf, 0, headerSize, 8);
  const jsonSize = headerBuf.readUInt32LE(4);
  const header = JSON.parse(headerBuf.toString("utf8", 8, 8 + jsonSize));
  return { fd, base: 8 + headerSize, header };
}

function locate(header, inner) {
  const parts = inner.split("/").filter(Boolean);
  let node = header;
  for (const part of parts) {
    if (!node || !node.files || !node.files[part]) return null;
    node = node.files[part];
  }
  return node && node.files ? null : node;
}

function readEntry(fd, base, entry) {
  const size = entry.size;
  const buf = Buffer.alloc(size);
  fs.readSync(fd, buf, 0, size, base + Number(entry.offset || 0));
  return buf.toString("utf8");
}

function walk(node, prefix, matcher, acc) {
  for (const name of Object.keys(node.files || {})) {
    const child = node.files[name];
    const full = prefix + "/" + name;
    if (child.files) walk(child, full, matcher, acc);
    else if (!matcher || full.indexOf(matcher) >= 0) acc.push({ path: full, size: child.size });
  }
}

const args = parseArgs(process.argv.slice(2));
const command = args._[0];
const { fd, base, header } = open(args.asar);

try {
  if (command === "list") {
    const acc = [];
    walk(header, "", args._[1] || null, acc);
    acc.sort((a, b) => (a.path < b.path ? -1 : 1));
    for (const item of acc) console.log(item.size + "\t" + item.path);
  } else if (command === "read") {
    const entry = locate(header, args._[1]);
    if (!entry) throw new Error("归档里没有 " + args._[1]);
    const text = readEntry(fd, base, entry);
    if (args.out) {
      fs.writeFileSync(args.out, text);
      console.log("wrote " + args.out + " (" + text.length + " chars)");
    } else {
      console.log(text);
    }
  } else if (command === "grep") {
    const entry = locate(header, args._[1]);
    if (!entry) throw new Error("归档里没有 " + args._[1]);
    const lines = readEntry(fd, base, entry).split(/\r?\n/);
    const re = new RegExp(args._[2]);
    for (let i = 0; i < lines.length; i++) {
      if (!re.test(lines[i])) continue;
      const from = Math.max(0, i - args.before);
      const to = Math.min(lines.length - 1, i + args.after);
      for (let j = from; j <= to; j++) {
        const mark = j === i ? ">" : " ";
        console.log(mark + (j + 1) + ": " + lines[j].slice(0, 400));
      }
      console.log("--");
    }
  } else {
    console.error("用法：list|read|grep（见文件头注释）");
    process.exitCode = 2;
  }
} finally {
  fs.closeSync(fd);
}
