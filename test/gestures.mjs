// 四套拖拽手势的真实事件序列测试：真的派发 pointerdown / pointermove / pointerup / pointercancel，
// 断言用户看得见的结果（store 里的 order / hidden / intoMore / moreOrder 与 DOM 标记是否擦干净）。
import { createEnv, loadClient, findStore } from "./harness.mjs";

const STORE_KEY = "dsh.layout-organizer.state.v5";

function seedState(partial) {
  const base = {
    version: 5,
    options: {},
    order: {},
    hidden: {},
    intoMore: {},
    moreOrder: {}
  };
  const merged = Object.assign({}, base, partial || {});
  return { [STORE_KEY]: JSON.stringify(merged) };
}

async function boot(seed) {
  const env = createEnv({ seed: seed || seedState({}) });
  const mod = await loadClient(env);
  mod.apply(env.ctx);
  return { env, mod, store: findStore(env) };
}

function eq(actual, expected, label) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) throw new Error(label + " expected " + right + " got " + left);
}

function assert(ok, detail) {
  if (!ok) throw new Error(detail);
}

function noMark(el, name) {
  assert(el.getAttribute(name) === null, "residual " + name + " on " + el.getAttribute("data-lo-id"));
}

function drag(env, el, from, to) {
  env.dispatch("pointerdown", el, { clientX: from[0], clientY: from[1], button: 0 });
  env.dispatch("pointermove", el, { clientX: to[0], clientY: to[1] });
  env.dispatch("pointerup", el, { clientX: to[0], clientY: to[1], button: 0 });
}

function cancelDrag(env, el, from, to) {
  env.dispatch("pointerdown", el, { clientX: from[0], clientY: from[1], button: 0 });
  env.dispatch("pointermove", el, { clientX: to[0], clientY: to[1] });
  env.dispatch("pointercancel", el, { clientX: to[0], clientY: to[1] });
}

// ---------------------------------------------------------------- 行拖拽

const LABELS = { alpha: "Alpha", beta: "Beta", gamma: "Gamma" };

/**
 * 搭一处像宿主左侧边栏的列表：nav.panelList 里是按钮行，每行内部挂着 panellist 出口。
 *
 * 先跑一轮投影，让行拿到 data-lo-row / data-lo-id / data-lo-draggable（拖动控制器只认投影标好的行），
 * 也顺带把合成行「更多」标出来。
 */
function mountSidebar(env, ids) {
  env.slotEntries["sidebar.panellist"] = ids.map(function (id, at) {
    return { options: { id, label: LABELS[id] || id, order: at } };
  });
  const nav = env.el("nav", { class: "panelList" });
  env.body.appendChild(nav);
  const byId = {};
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const btn = env.el("button", { "aria-label": LABELS[id] || id }, { left: 0, top: i * 40, width: 200, height: 40 });
    btn.appendChild(env.el("span", { "data-slot": "sidebar.panellist" }));
    nav.appendChild(btn);
    byId[id] = btn;
  }
  const anchor = env.el("div", { class: "moreAnchor" }, { left: 0, top: 300, width: 200, height: 40 });
  anchor.appendChild(env.el("button", { "aria-haspopup": "menu" }, { left: 0, top: 300, width: 200, height: 40 }));
  nav.appendChild(anchor);
  byId.more = anchor;
  env.flushFrames();
  return byId;
}

async function caseRowsReorder() {
  const { env, store } = await boot(seedState({ order: { sidebar: ["alpha", "beta", "gamma", "more"] } }));
  const rows = mountSidebar(env, ["alpha", "beta", "gamma"]);
  drag(env, rows.alpha, [10, 20], [10, 100]);
  eq(store.get().order.sidebar, ["beta", "alpha", "gamma", "more"], "order.sidebar");
  noMark(rows.alpha, "data-lo-dragging");
  noMark(rows.alpha, "data-lo-over");
  assert(env.body.style.cursor === "", "body cursor not reset");
}

// ---------------------------------------------------------------- 行 → 更多

async function caseRowsIntoMore() {
  const { env, store } = await boot(seedState({ order: { sidebar: ["alpha", "beta", "gamma", "more"] } }));
  const rows = mountSidebar(env, ["alpha", "beta", "gamma"]);

  drag(env, rows.alpha, [10, 20], [10, 320]);

  assert(store.get().intoMore["sidebar:alpha"] === true, "intoMore missing sidebar:alpha");
  // 主列表让位：投影把这一行标成隐藏并擦掉预览写的 order。
  env.flushFrames();
  assert(rows.alpha.getAttribute("data-lo-hidden") === "1", "row not hidden after intoMore");
  assert(rows.alpha.style.order === "", "row order not cleared after intoMore");
  noMark(rows.alpha, "data-lo-dragging");
  noMark(rows.alpha, "data-lo-over");
}

// ---------------------------------------------------------------- pointercancel

async function caseRowsCancel() {
  const { env, store } = await boot(seedState({ order: { sidebar: ["alpha", "beta", "gamma", "more"] } }));
  const rows = mountSidebar(env, ["alpha", "beta", "gamma"]);

  env.dispatch("pointerdown", rows.alpha, { clientX: 10, clientY: 20, button: 0 });
  env.dispatch("pointermove", rows.alpha, { clientX: 10, clientY: 100 });
  assert(rows.alpha.getAttribute("data-lo-dragging") === "1", "drag did not start");
  env.dispatch("pointercancel", rows.alpha, { clientX: 10, clientY: 100 });

  eq(store.get().order.sidebar, ["alpha", "beta", "gamma", "more"], "order after cancel");
  noMark(rows.alpha, "data-lo-dragging");
  noMark(rows.alpha, "data-lo-over");
  assert(env.body.style.cursor === "", "body cursor not reset after cancel");
}

// ---------------------------------------------------------------- 设置页卡片

function listRow(env, id, top, group) {
  return env.el(
    "div",
    {
      class: "lo-row",
      "data-lo-list-id": id,
      "data-lo-list-group": group || "third"
    },
    { left: 0, top, width: 240, height: 40 }
  );
}

async function caseListReorder() {
  const { env, store } = await boot(seedState({ order: { settings: ["a", "b", "c"] } }));
  const box = env.el("div", { "data-lo-list-scope": "settings" });
  env.body.appendChild(box);
  const rows = [listRow(env, "a", 0), listRow(env, "b", 40), listRow(env, "c", 80)];
  for (const row of rows) box.appendChild(row);

  drag(env, rows[0], [10, 20], [10, 100]);
  eq(store.get().order.settings, ["b", "a", "c"], "order.settings");
  assert(rows[0].style.order !== "", "preview order was not written before the frame");
  noMark(rows[0], "data-lo-dragging");

  env.flushFrames();
  assert(rows[0].style.order === "", "preview order not cleared on the next frame");
  assert(rows[1].style.order === "" && rows[2].style.order === "", "preview order left on other rows");
}

// ---------------------------------------------------------------- 收纳包

async function caseStashRestore() {
  const { env, store } = await boot(seedState({ hidden: { "sidebar:alpha": true } }));
  const panel = env.el("div", { class: "lo-stash" }, { left: 0, top: 0, width: 240, height: 200 });
  env.body.appendChild(panel);
  const row = env.el(
    "div",
    { class: "lo-stash-row", "data-lo-stash-scope": "sidebar", "data-lo-stash-id": "alpha" },
    { left: 0, top: 0, width: 200, height: 40 }
  );
  panel.appendChild(row);

  drag(env, row, [10, 20], [600, 600]);

  assert(store.get().hidden["sidebar:alpha"] === undefined, "hidden not cleared after dragging out");
  noMark(row, "data-lo-dragging");
  assert(!row.classList.contains("lo-stash-out"), "lo-stash-out left on row");
}

// ---------------------------------------------------------------- 更多菜单

function moreRow(env, key, region, top) {
  return env.el(
    "button",
    { class: "lo-more-row", "data-lo-more-key": key, "data-lo-more-region": region },
    { left: 0, top, width: 220, height: 40 }
  );
}

function findPropNode(node, pick) {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const hit = findPropNode(item, pick);
      if (hit) return hit;
    }
    return null;
  }
  if (node.props) {
    if (pick(node)) return node;
    return findPropNode(node.props.children, pick);
  }
  return null;
}

function mountMoreMenu(env) {
  const rec = env.registrations.find((item) => item.spec && item.spec.name === "sidebar.panellist.actions");
  assert(rec, "sidebar.panellist.actions not registered");
  const tree = env.callComponent(rec.component, {}, { effects: "skip" });
  const content = findPropNode(tree, (node) => !!node.props.loStore);
  assert(content, "MoreMenuContent props not found");
  const rowsNode = env.callComponent(content.type, content.props, { effects: "run" });
  assert(rowsNode && rowsNode.type, "MoreMenuRows not produced");
  env.callComponent(rowsNode.type, rowsNode.props, { effects: "run" });
}

function menuFixture(env) {
  const panel = env.el("nav", { class: "panelList" });
  env.body.appendChild(panel);
  panel.appendChild(env.el("button", { "aria-haspopup": "menu" }, { left: 0, top: 0, width: 24, height: 24 }));
  const menu = env.el("div", { role: "menu" }, { left: 0, top: 0, width: 220, height: 300 });
  env.body.appendChild(menu);
  const rows = [
    moreRow(env, "sidebar:alpha", "sidebar", 0),
    moreRow(env, "sidebar:beta", "sidebar", 40),
    moreRow(env, "sidebar:gamma", "sidebar", 80)
  ];
  for (const row of rows) menu.appendChild(row);
  return rows;
}

async function caseMoreReorderAndCancel() {
  const seed = seedState({
    order: { sidebar: ["alpha", "beta", "gamma", "more"] },
    intoMore: { "sidebar:alpha": true, "sidebar:beta": true, "sidebar:gamma": true },
    moreOrder: { sidebar: ["sidebar:alpha", "sidebar:beta", "sidebar:gamma"] }
  });
  const { env, store } = await boot(seed);
  const rows = menuFixture(env);
  mountMoreMenu(env);

  // 拖到第二行（beta）下方松手：alpha 落到 beta 之后。
  env.dispatch("pointerdown", rows[0], { clientX: 10, clientY: 20, button: 0 });
  env.dispatch("pointermove", rows[0], { clientX: 10, clientY: 90 });
  env.dispatch("pointerup", rows[0], { clientX: 10, clientY: 90, button: 0 });

  eq(
    store.get().moreOrder.sidebar,
    ["sidebar:beta", "sidebar:alpha", "sidebar:gamma"],
    "moreOrder after drop"
  );
  for (const row of rows) assert(row.style.order === "", "preview order not cleared after commit");
  assert(!rows[0].classList.contains("lo-more-dragging"), "lo-more-dragging left on row");

  // 取消：拖 gamma 到最上面，预览已经写过 order，pointercancel 后 moreOrder 不该变。
  const before = store.get().moreOrder.sidebar.slice();
  env.dispatch("pointerdown", rows[2], { clientX: 10, clientY: 100, button: 0 });
  env.dispatch("pointermove", rows[2], { clientX: 10, clientY: 10 });
  env.flushFrames();
  env.dispatch("pointercancel", rows[2], { clientX: 10, clientY: 10 });

  eq(store.get().moreOrder.sidebar, before, "moreOrder after cancel");
  for (const row of rows) assert(row.style.order === "", "preview order not cleared after cancel");
}

// ---------------------------------------------------------------- 跑

const CASES = [
  ["rows-reorder", caseRowsReorder],
  ["rows-into-more", caseRowsIntoMore],
  ["rows-cancel", caseRowsCancel],
  ["list-reorder", caseListReorder],
  ["stash-restore", caseStashRestore],
  ["more-reorder-cancel", caseMoreReorderAndCancel]
];

let passed = 0;
for (const [name, run] of CASES) {
  try {
    await run();
    passed++;
    console.log("  ok   " + name);
  } catch (err) {
    console.log("FAIL " + name + " " + (err && err.message ? err.message : String(err)));
  }
}

if (passed === CASES.length) {
  console.log("GESTURES PASS (" + passed + "/" + CASES.length + ")");
} else {
  console.log("GESTURES FAIL (" + passed + "/" + CASES.length + ")");
  process.exitCode = 1;
}
