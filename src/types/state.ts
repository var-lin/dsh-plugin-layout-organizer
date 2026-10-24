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
  getVersion?(slot: string): number;
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
  get(name: string): unknown;
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
  // 分开收纳：打开时侧边栏的行只进侧边栏「更多」、对话区的行只进对话「更多」；关闭时两处共用一份清单。
  separateMore: boolean;
  // 「更多」菜单里画不画官方 / 第三方分隔线；与 `showDivider` 各管各的。
  // 每个「有下属行」的折叠键（如 allowDragOfficial / showDivider）-> 是否折叠；缺省视为展开。
  collapsed: Record<string, boolean>;
  launcherSide: string;
  // 拖动中的悬浮按钮跟手用的横坐标；松手后按它落在窗口哪半边决定贴左还是贴右，再写回 null 恢复按边贴靠的定位。
  launcherX: number | null;
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

// 与渲染它的元素配成一对的台账记录。
interface Pair {
  id: string;
  el: HTMLElement;
  extra: HTMLElement[];
  label: string;
}

// `applyScope` 回传的结果：这个 scope 到底有没有东西可管。`mounted: false` 属于正常情况而不是错误——侧边栏收起时它就是未挂载状态。
interface ScopeResult {
  mounted: boolean;
  official: number;
  third: number;
}

interface DragPending {
  row: HTMLElement;
  scope: string;
  id: string;
  group: string;
  x: number;
  y: number;
}