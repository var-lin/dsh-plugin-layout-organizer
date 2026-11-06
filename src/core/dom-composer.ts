// 对话输入框下方的停靠行：与侧边栏不同，这里的记录可能渲染成空壳。
function collectComposerUnits(): RowUnit[] | null {
  const outlet = outletOf("conversation.composer.dock");
  if (!outlet) return null;
  // 出口是 `display:contents`，它的父级才是真正的 flex 容器，出口本身不贡献盒子。
  const container = outlet.parentElement;
  if (!container) return null;
  const units: RowUnit[] = [];
  const children = elementChildren(container);
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child === outlet) {
      const inner = elementChildren(outlet);
      for (let j = 0; j < inner.length; j++) units.push({ el: inner[j], id: null });
    } else {
      units.push({ el: child, id: null });
    }
  }
  if (units.length === 0) return null;
  // 不是 slot 记录的东西都是合成的，id 在 scope 表里声明，跨渲染保持稳定。
  const synthetic = SYNTHETIC_IDS.composer || [];
  let next = 0;
  const entryEls: HTMLElement[] = [];
  const slotChildren = elementChildren(outlet);
  for (let i = 0; i < slotChildren.length; i++) entryEls.push(slotChildren[i]);
  for (let i = 0; i < units.length; i++) {
    if (entryEls.indexOf(units[i].el) >= 0) continue;
    units[i].id = synthetic[next] !== undefined ? synthetic[next] : "composer-" + next;
    next++;
  }
  return units;
}

function collectComposerRows(): HTMLElement[] | null {
  return unitElements(collectComposerUnits());
}
