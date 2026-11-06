// 分类与行级判定：官方/第三方、行键、分隔线、收起与「进更多」。
/**
 * 右侧栏卡片的官方判定：`kind -> 是否官方`，由宿主注册表里的 `providerId` 动态写入。
 *
 * 固定名单只认得发布时那几张卡；DSH 0.2.2 新增「代码审查和变更」后，新卡没有名单可查，
 * 就会被当成第三方（用户 m00004）。宿主注册表虽没有官方字段，但 `providerId` 是注册方包名：
 * 官方包都以 `@deepseek-ai/` 开头，第三方插件带自己的包名。按它判，新增的官方卡不必再改名单。
 *
 * 只在注册表真的给出 `providerId` 时写：老宿主没有这个字段，仍走 `OFFICIAL_IDS` 兜底。
 */
const rightKindOfficial: Record<string, boolean> = {};

/**
 * 记下一张右侧栏卡片的注册方，供 `kindOf` 动态判官方。
 *
 * @param kind 卡片 kind。
 * @param providerId 注册方包名。
 */
function noteRightKindOfficial(kind: string, providerId: string): void {
  if (!kind || !providerId) return;
  // 只认 DSH 核心客户端 UI 包（files / browser / terminal 这类）。
  // 实验包、开发工具包即使同属 @deepseek-ai/ 也不算官方——它们和用户自己装的插件一样是可选件；
  // forge-panel 这种随版本新增的官方卡片由静态名单兜底。
  if (providerId.indexOf("@deepseek-ai/dsh-client-ui-") === 0) rightKindOfficial[kind] = true;
}

/**
 * 右侧栏卡片 id 的基础 kind：同 kind 的第二张卡带 `-2` 这类数字后缀。
 *
 * @param id 卡片 id。
 * @returns 去掉数字后缀的 kind。
 */
function rightBaseKind(id: string): string {
  const cut = id.lastIndexOf("-");
  if (cut > 0 && /^\d+$/.test(id.slice(cut + 1))) return id.slice(0, cut);
  return id;
}

function kindOf(state: PluginState, scope: string, id: string): string {
  const manual = state.kinds[rowKey(scope, id)];
  if (manual === "official" || manual === "third") return manual;
  const official = OFFICIAL_IDS[scope] || [];
  // 注册表给出的注册方只用于「认定官方」，不用于把静态名单里的卡片降级：
  // 老宿主 / 异构宿主可能给出别的包名或干脆没有 providerId，静态名单仍是兜底。
  let base = id;
  if (scope === "right") {
    if (rightKindOfficial[id] === true) return "official";
    base = rightBaseKind(id);
    if (base !== id && rightKindOfficial[base] === true) return "official";
  }
  if (official.indexOf(id) >= 0) return "official";
  // 右侧边栏同 kind 的第二张卡 id 是 `kind-2`（见 collectRightUnits），判官方要看基础 kind，
  // 否则第二张「工作区文件」会被当成第三方，拖动、分隔线与改判全错。
  if (scope === "right" && base !== id && official.indexOf(base) >= 0) return "official";
  return "third";
}

function groupOf(state: PluginState, scope: string, id: string): string {
  return kindOf(state, scope, id) === "official" ? "official" : "third";
}

/**
 * 混合排序要求「允许拖动官方按钮」同时打开，这是唯一判据。
 *
 * @param state 当前状态。
 * @returns 是否按混合排序处理（官方与第三方可互相穿插）。
 */
function mixedOrder(state: PluginState): boolean {
  return state.options.allowDragOfficial === true && state.options.mixGroups === true;
}

/**
 * 状态表里一行的键：`scope:id`。
 *
 * 收纳表、分类表、「进更多」表、「见过」表都以它为键——五处各手拼一遍的话，一旦哪天分隔符
 * 要换（比如 id 里出现冒号），就会漏改其中一两处，表现是「某一处的记录石沉大海」。
 */
function rowKey(scope: string, id: string): string {
  return scope + ":" + id;
}

/**
 * 把行键拆回 scope 与 id。
 *
 * @param key 行键。
 * @returns 拆不开（没有冒号、或冒号后是空的）时为 null。
 */
function splitRowKey(key: string): { scope: string; id: string } | null {
  const at = key.indexOf(":");
  if (at <= 0 || at >= key.length - 1) return null;
  return { scope: key.slice(0, at), id: key.slice(at + 1) };
}

/**
 * 删掉某处位置在表里的全部键（恢复本组默认时用）。
 *
 * @param map 键为行键的表，原地删键。
 * @param scope 槽位 key。
 */
function dropScopeKeys(map: Record<string, unknown>, scope: string): void {
  const prefix = scope + ":";
  const keys = Object.keys(map);
  for (let i = 0; i < keys.length; i++) if (keys[i].indexOf(prefix) === 0) delete map[keys[i]];
}

/**
 * 本 scope 画不画分隔线：总开关 AND 本 scope 自己的开关，没写过算开；白名单限定 composer/footer 之外的 scope。
 *
 * @param state 当前状态。
 * @param scope 槽位 key。
 * @returns 该 scope 本轮是否要画分隔线。
 */
function dividerEnabled(state: PluginState, scope: string): boolean {
  if (state.options.showDivider !== true) return false;
  if (DIVIDER_SCOPES.indexOf(scope) < 0) return false;
  const one = state.options.dividers ? state.options.dividers[scope] : undefined;
  return one !== false;
}

function isHidden(state: PluginState, scope: string, id: string): boolean {
  return state.hidden[rowKey(scope, id)] === true;
}

/**
 * 这一行是否被收进官方「更多」菜单：侧边栏主列表里不占位，改从「更多」菜单点开。
 *
 * 与 `isHidden` 平行但互斥：收纳包是「彻底收起」，进「更多」是「换个入口，仍然可达」。
 * 一行同时被收进两处时以收纳包为准（`applyScope` 先判 hidden 再判本函数）。
 *
 * @param state 当前状态。
 * @param scope 槽位 key。
 * @param id 行 id。
 * @returns 是否已收进「更多」菜单。
 */
function isIntoMore(state: PluginState, scope: string, id: string): boolean {
  return state.intoMore[rowKey(scope, id)] === true;
}

/**
 * 这一行是不是「收进了这一处的更多菜单」——投影、菜单列表与换位判定共用的一条判据。
 *
 * 两件事必须同时成立：这一处有「更多」可收（设置页导航没有），且这行确实收在里面。
 *
 * @param state 当前状态。
 * @param scope 槽位 key。
 * @param id 行 id。
 * @returns 收在里面时为 true。
 */
function isIntoMoreRow(state: PluginState, scope: string, id: string): boolean {
  return moreScopeOk(scope) && isIntoMore(state, scope, id);
}
