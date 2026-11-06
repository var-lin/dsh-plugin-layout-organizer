/**
 * 新按钮提醒：记住见过的每一行，装插件之后才冒出来的行打上「新」。
 *
 * 判定用的和「自动清除已删除的按钮」是同一份证据（`pruneKnownIds`）：槽位台账里认得的 id，
 * 右侧边栏改问宿主注册表。这样一处位置整份答不出来（宿主还在启动、面板没挂载）时不会
 * 把「没答上来」当成「全是新的」——那种情况直接跳过这一处。
 *
 * 写进存档的只有 `known`（`scope:id` -> 第一次见到的时间戳），「新」本身活在内存里：
 * 刷新界面之后角标消失是合理的，长期记忆只需要「我见过这一行」。
 */

/**
 * 把这一轮看到的行记进「已知」，并把新出现的行标成「新」。
 *
 * 每轮投影结束后跑一次（见 `organizer.ts` 的 `applyAll`）。平时零开销：这一处位置没有
 * 没见过的行就直接跳过，一次状态都不写。
 *
 * @param ctx 上下文。
 * @param store 状态句柄。
 */
function noteNewRows(ctx: CtxLike, store: StoreHandle): void {
  const state = store.get();
  // 存档里一条已知记录都没有 = 第一次跑本插件：整批当作基线静默记下，一个角标都不打。
  // 否则第一次打开设置页的人会看到满页「新」，提示反而没有信息量。
  const seed = Object.keys(state.known || {}).length === 0;
  const batch: Array<{ scope: string; ids: string[] }> = [];
  let i: number;
  for (i = 0; i < SCOPES.length; i++) {
    const scope = SCOPES[i].key;
    let ids: string[] | null = null;
    try {
      ids = pruneKnownIds(ctx, scope);
    } catch (err) {
      // 这一处读不出来：这一轮不管它，下一轮再记。
      ids = null;
    }
    if (!ids || ids.length === 0) continue;
    if (!hasUnknownRows(state, scope, ids)) continue;
    batch.push({ scope: scope, ids: ids });
  }
  if (batch.length === 0) return;
  // 静默写：这不是用户的操作，不该占掉「撤销上一步」的一格。
  store.update(function (next: PluginState) {
    for (let j = 0; j < batch.length; j++) noteKnownRows(next, batch[j].scope, batch[j].ids, seed);
  }, { history: false });
}