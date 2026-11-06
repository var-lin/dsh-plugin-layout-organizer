
function createFlag(): StashFlag {
  const listeners: Array<(value: boolean) => void> = [];
  let value = false;
  return {
    get: function (): boolean {
      return value;
    },
    set: function (next: boolean): void {
      if (value === next) return;
      value = next;
      const snapshot = listeners.slice();
      let i: number;
      for (i = 0; i < snapshot.length; i++) {
        try {
          snapshot[i](value);
        } catch (err) {
          // 一个坏的订阅者不能拖垮其它订阅者
        }
      }
    },
    subscribe: function (listener: (value: boolean) => void): () => void {
      listeners.push(listener);
      return function (): void {
        const index = listeners.indexOf(listener);
        if (index >= 0) listeners.splice(index, 1);
      };
    }
  };
}

const stashFlag: StashFlag = createFlag();

function openStash(): void {
  stashFlag.set(true);
}

function closeStash(): void {
  stashFlag.set(false);
}
