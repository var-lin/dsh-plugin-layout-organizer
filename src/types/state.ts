// 本插件用到的那部分 slot 服务。

interface SlotEntryOptions {
  // `name` 是 slot 键；本插件只用两参数写法 `register(options, component)`。
  name?: string;
  id?: string;
  order?: number;
  label?: string | (() => string);
  locale?: string;
  [key: string]: unknown;
}

interface SlotEntry {
  options: SlotEntryOptions;
  [key: string]: unknown;
}

interface SlotsService {
  entries(slot: string): SlotEntry[];
  entriesOfSlot(slot: string): SlotEntry[];
  // 订阅返回退订函数；两处调用点都把它当函数 push 进清理列表。
  subscribe(slot: string, fn: () => void): () => void;
  register(slot: string, options: SlotEntryOptions, component: unknown): unknown;
  register(options: SlotEntryOptions, component: unknown): unknown;
  inject(slot: string, fn: () => unknown): unknown;
}

interface LocaleService {
  register(ns: string, dict: { zh: Record<string, string>; en: Record<string, string> }): unknown;
  bind(ns: string): (key: string) => string | null | undefined;
}

interface LayoutService {
  selectPanel(id: string): void;
  // 右栏收起时用它把右栏展开（参数是宿主的轨道 / 全屏标记，本插件传 false, false）。
  openRightbar?(track: boolean, fullscreen: boolean): void;
}

/**
 * 右侧栏的导航服务（宿主 `ctx.get("sidebarRight")` 取到的那个控制器）。
 *
 * 只声明本插件用到的那一个方法。宿主自己的「开始」页卡片点下去走的就是 `openTab`，
 * 它会顺带把收起的右栏展开（`openContent` 里先 `planSetExpanded(state, true)`）。
 */
interface SidebarRightService {
  // kind 取自卡片上的 data-sidebar-right-guide-entry；未注册的 kind 或无挂载会话时宿主会抛错。
  openTab(kind: string, options?: { replaceTab?: boolean }): void;
}

interface ShortcutsService {
  register(descriptor: Record<string, unknown>): () => void;
  catalog: {
    subscribe(fn: () => void): (() => void) | void;
    getSnapshot(): { id: string; keys?: unknown; issue?: unknown; conflicts?: unknown; binding?: unknown }[];
  };
  describeBinding(binding: unknown): { issue?: unknown; conflicts?: unknown };
  // 较旧的版本用 registry 而不是 catalog；只用 `definitions()` 回答「这个命令 id 是否已被占用」。
  registry?: { definitions(): { id: string }[] };
}

/**
 * 读取客户端已知的全部命令 id。
 *
 * @param shortcuts 客户端的快捷键服务，可能只有 `catalog` 或只有较旧的 `registry`。
 * @returns 命令 id 列表；两个接口都不存在时返回 `null`，必须与「列表为空」区分开。
 */
function shortcutIds(shortcuts: ShortcutsService): string[] | null {
  const out: string[] = [];
  try {
    if (shortcuts.catalog && typeof shortcuts.catalog.getSnapshot === "function") {
      const rows = shortcuts.catalog.getSnapshot() || [];
      for (let i = 0; i < rows.length; i++) out.push(String(rows[i].id));
      return out;
    }
  } catch (err) {
    // 落到 registry 那条路
  }
  try {
    if (shortcuts.registry && typeof shortcuts.registry.definitions === "function") {
      const rows = shortcuts.registry.definitions() || [];
      for (let i = 0; i < rows.length; i++) out.push(String(rows[i].id));
      return out;
    }
  } catch (err) {
    // 这个版本没有可读的 catalog
  }
  return null;
}

// Cordis 上下文。这里只声明插件真正碰到的那几个成员，其余都通过 `get()` 取，并且在收窄之前一直是 `unknown`。
interface CtxLike {
  slots: SlotsService;
  effect(fn: () => unknown, label?: string): unknown;
  // `strict`：cordis 的 `ctx.get(name, strict)` 默认只在「提供者 fiber 处于 ACTIVE」时才返回服务
  // （旧版没有这层检查）。宿主插件刚启动 / 正在重载时该检查会返回 undefined，传 false 可绕过。
  get(name: string, strict?: boolean): unknown;
}

// 持久化状态。

interface StateOptions {
  allowDragOfficial: boolean;
  // 允许官方与第三方按钮互相穿插排序；只在 allowDragOfficial 打开时生效（见 mixedOrder）。
  mixGroups: boolean;
  showDivider: boolean;
  // 每个 scope 各自的分隔线开关；缺省（未设置）视为开，与 `showDivider` 取 AND。
  dividers: Record<string, boolean>;
  showStashLauncher: boolean;
  // 分开收纳：打开时侧边栏的行只进侧边栏「更多」、对话区的行只进对话「更多」、右侧边栏的行只进右侧栏「更多工具」；关闭时三处共用一份清单。
  separateMore: boolean;
  // 「更多」菜单里画不画官方 / 第三方分隔线；与 `showDivider` 各管各的。
  // 每个「有下属行」的折叠键（如 allowDragOfficial / showDivider）-> 是否折叠；缺省视为展开。
  collapsed: Record<string, boolean>;
  launcherSide: string;
  launcherY: number | null;
}

interface PluginState {
  version: number;
  options: StateOptions;
  // scope -> 有序 id 列表。没开混合排序时只有第三方那一块的组内顺序算数，官方整块固定排前面；开了混合排序则这份顺序是唯一权威（见 `reconcileOrder`）。
  order: Record<string, string[]>;
  // "scope:id" -> "official" | "third"。优先于内置白名单。
  kinds: Record<string, string>;
  // "scope:id" -> true。收纳只关乎显示，不会注销任何注册。
  hidden: Record<string, boolean>;
  // "scope:id" -> true。收进官方「更多」菜单：主列表里让位，改从「更多」菜单点开；与 hidden 互斥。
  intoMore: Record<string, boolean>;
  // region -> 菜单里各行的先后。键是菜单行的身份（`scope:id`）。
  // 只记「这扇菜单里怎么排」，与各 scope 的 `order` 无关：一扇菜单能跨槽位列出好几处的行。
  moreOrder: Record<string, string[]>;
  stashSort: string;
}

interface StoreHandle {
  get(): PluginState;
  subscribe(listener: (state: PluginState) => void): () => void;
  // 修改函数可以原地改（常见情况），也可以返回一个替换用的 state。
  update(mutator: (state: PluginState) => PluginState | void): void;
  replace(next: PluginState): void;
  reset(): void;
}

// 与渲染它的元素配成一对的台账记录；认领不到时 el 为 null（不要再用断言把 null 说成元素）。
interface Pair {
  id: string;
  el: HTMLElement | null;
}

// 按下但还没超过拖动阈值的候选行；起点坐标用来算位移。
interface DragPending {
  row: HTMLElement;
  x: number;
  y: number;
}