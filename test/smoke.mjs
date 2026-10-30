/* 插件布局整理客户端包的 headless 冒烟测试：把包放到共用的极简假 DOM/React/ctx（test/harness.mjs）上求值，
   再驱动槽位注册、组件渲染与拆卸，抓拼接式多文件包里标识符未定义这类错误。

   用法：node test/smoke.mjs [path-to-lib/client.js]                                   */

import { createEnv, loadClient } from "./harness.mjs";

// 宿主台账：冒烟只关心这些位置各自列得出记录。
const ENTRIES = {
  "sidebar.panellist": [
    { options: { id: "plugins", order: 0, label: "插件" } },
    { options: { id: "schedules", order: 10, label: "自动化任务" } },
    { options: { id: "ssh", order: 20, label: "SSH" } }
  ],
  "settings.section": [
    { options: { id: "account", order: -10, label: "账号与余额" } },
    { options: { id: "general", order: 0, label: "通用设置" } },
    { options: { id: "agent-presets", order: 20, label: "Agent 预设" } },
    { options: { id: "skills-manager", order: 17, label: "技能" } },
    { options: { id: "layout-organizer", order: 35, label: () => "位置整理" } }
  ],
  "sidebar.footer.action": [
    { options: { id: "cordis-panel", order: 0, label: "Cordis" } },
    { options: { id: "remote-web-ui", order: 10, label: "远程" } }
  ],
  "conversation.view": [
    { options: { id: "chat", order: 0, label: "对话" } },
    { options: { id: "trajectory", order: 10, label: "轨迹" } },
    { options: { id: "context", order: 20, label: "上下文" } }
  ]
};

const env = createEnv();
env.slotEntries = Object.assign({}, ENTRIES);

let mod;
try {
  mod = await loadClient(env);
} catch (err) {
  console.error("FAIL: loading the bundle threw:", err && err.stack ? err.stack : err);
  process.exit(1);
}

console.log("loaded factory for id:", mod.__definition.id);
console.log("inject:", JSON.stringify(mod.inject));

try {
  mod.apply(env.ctx);
} catch (err) {
  console.error("FAIL: apply() threw:", err && err.stack ? err.stack : err);
  process.exit(1);
}

console.log("effects:", env.effectLog.map((e) => e.label).join(" | "));
console.log("slots.inject:", JSON.stringify(env.injectedSlots));
console.log("registrations:", env.registrations.map((r) => r.spec.name + "#" + r.spec.id + "@" + r.spec.order).join(", "));
console.log("subscriptions:", JSON.stringify(env.subscriptions));
console.log("shortcut commands:", env.commands.map((c) => c.id).join(", "));
console.log("locale namespaces:", Object.keys(env.localeDicts).join(", "));

// 每个注册过的组件渲染一次，暴露渲染体里的毛病。
for (const reg of env.registrations) {
  if (typeof reg.component !== "function") continue;
  try {
    env.callComponent(reg.component, {}, { effects: "skip" });
    console.log("render ok:", reg.spec.id);
  } catch (err) {
    console.error("FAIL: rendering " + reg.spec.id + " threw:", err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

// 把每个 effect 的清理函数都跑一遍，拆卸路径抛错就判失败。
for (const e of env.effectLog) {
  if (typeof e.dispose === "function") {
    try {
      e.dispose();
    } catch (err) {
      console.error("FAIL: teardown of " + e.label + " threw:", err && err.stack ? err.stack : err);
      process.exit(1);
    }
  }
}
console.log("teardown ok");

console.log("SMOKE PASS");
