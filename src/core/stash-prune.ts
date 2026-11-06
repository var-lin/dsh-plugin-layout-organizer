/**
 * 自动清除失效的收起记录。
 *
 * 「已收起的按钮」里存的只是 `scope:id` 一句话（见 `store.ts` 的 `hidden`），登记它的那个插件
 * 卸载之后没有任何东西会来删这条记录：那颗按钮再也不会出现在界面与台账里，记录就成了一条
 * 点不动、也恢复不出东西的僵尸行（用户 m01858）。
 *
 * 判定只看「宿主还认不认得这一行」：台账（或右栏注册表）里读得到同一个 id 就活着，读不到、
 * 而这一处位置确实答得出别的内容，就算它已经不在了。两处保险：
 *
 * 1. 台账整份为空时一律不动。宿主正在启动、这一处插件一个都没注册、位置整个没挂载，读出来
 *    都是空的——把「没答上来」当成「已经没了」就会把整份清单清空。
 * 2. 第一次发现不见先记时间戳，隔 `PRUNE_GRACE_MS` 还不见才真删。插件按状态注册（未登录时
 *    不注册额度读数这类）会短暂消失，太急就会把用户的收纳决定吃掉。
 */

// 连续两次投影都读不到、且至少隔这么久，才认作真的没了。
const PRUNE_GRACE_MS = 3000;

// `scope:id` -> 第一次发现它不见的时间戳；重新读到时清掉这份记账。
const __goneSince: Record<string, number> = {};

/**
 * 读某一处位置当前还认得的行 id。
 *
 * 右栏卡片不进台账，改问宿主注册表（`rightCardList`）；其余位置读槽位台账。
 *
 * @param ctx 上下文。
 * @param scope scope 键。
 * @returns 认得的 id；这一处答不出来（还没注册、没挂载）时返回 null，调用方据此跳过。
 */
function pruneKnownIds(ctx: CtxLike, scope: string): string[] | null {
  if (scope === "right") {
    const cards = rightCardList(ctx);
    if (cards.length === 0) return null;
    const out: string[] = [];
    for (let i = 0; i < cards.length; i++) out.push(cards[i].id);
    return out;
  }
  const list = readEntries(ctx, scope);
  if (list.length === 0) return null;
  const out: string[] = [];
  for (let i = 0; i < list.length; i++) out.push(list[i].id);
  return out;
}

/**
 * 删掉「已收起的按钮」里那些按钮已经不存在的记录。
 *
 * 每轮投影结束后跑一次（见 `organizer.ts` 的 `applyAll`）。只在真正删掉东西时写一次状态，
 * 平时零开销；开关关掉时直接返回，连台账都不读。
 *
 * @param ctx 上下文。
 * @param store 状态句柄。
 * @returns 这一轮删掉的记录条数。
 */
function pruneStash(ctx: CtxLike, store: StoreHandle): number {
  const state = store.get();
  if (state.options.pruneStash === false) return 0;
  const entries = stashEntries(state);
  if (entries.length === 0) return 0;

  const known: Record<string, string[] | null> = {};
  const now = Date.now();
  const dead: string[] = [];
  for (let i = 0; i < entries.length; i++) {
    const item = entries[i];
    if (!(item.scope in known)) known[item.scope] = pruneKnownIds(ctx, item.scope);
    const ids = known[item.scope];
    // 这一处答不出来：不当作「没了」，顺手把记账清空，等它真的答上来再判。
    if (!ids) {
      delete __goneSince[item.key];
      continue;
    }
    if (ids.indexOf(item.id) >= 0) {
      delete __goneSince[item.key];
      continue;
    }
    const since = __goneSince[item.key];
    if (since === undefined) {
      __goneSince[item.key] = now;
      continue;
    }
    if (now - since >= PRUNE_GRACE_MS) dead.push(item.key);
  }

  if (dead.length === 0) return 0;
  for (let i = 0; i < dead.length; i++) delete __goneSince[dead[i]];
  // 后台清理不算用户的改动：传 `{ history: false }`，否则一次清理会占掉一格撤销，
  // 用户点「撤销」把这条僵尸记录恢复回来，下一轮投影又把它清掉，看起来像按钮坏了。
  store.update(
    function (next: PluginState) {
      for (let i = 0; i < dead.length; i++) delete next.hidden[dead[i]];
    },
    { history: false }
  );
  return dead.length;
}