/**
 * 布局预设：把当前布局存成一份命名方案，之后一键换回来。
 *
 * 预设只含「按钮怎么摆」——各处的顺序、官方 / 第三方判断、收进「已收起的按钮」与「更多」
 * 的记录，以及「更多」菜单里的先后（见 `capturePreset`）。开关、悬浮按钮位置、快捷键都不进
 * 预设：换一套布局不该顺手关掉别的设置。
 *
 * 名称在本机就是键，所以同名即覆盖；覆盖与删除都走两步确认（误触的代价是一整份布局）。
 */

interface PresetsCardProps {
  store: StoreHandle;
}

/**
 * 应用预设之后把「新」角标清掉：这些行用户已经在别处整理过了。
 *
 * @param preset 刚应用的快照。
 */
function clearFreshOfPreset(preset: PresetData): void {
  const scopes = Object.keys(preset.order || {});
  let i: number;
  for (i = 0; i < scopes.length; i++) {
    const ids = preset.order[scopes[i]] || [];
    for (let j = 0; j < ids.length; j++) clearFreshRow(scopes[i], ids[j]);
  }
  const hidden = Object.keys(preset.hidden || {});
  for (i = 0; i < hidden.length; i++) {
    const at = hidden[i].indexOf(":");
    if (at > 0) clearFreshRow(hidden[i].slice(0, at), hidden[i].slice(at + 1));
  }
}

/**
 * 「布局预设」卡片。
 *
 * @param props 状态句柄，见 PresetsCardProps。
 * @returns 卡片元素。
 */
function PresetsCard(props: PresetsCardProps): any {
  const store = props.store;
  useStoreTick(store);
  const state = store.get();
  // 输入框里的名字；保存后清空，避免手贱再点一次覆盖。
  const namePair = useState("");
  const nameValue = namePair[0];
  const setNameValue = namePair[1];
  const name = String(nameValue || "").trim();
  const names = presetNames(state);
  const exists = name.length > 0 && names.indexOf(name) >= 0;

  function save(): void {
    const key = name;
    if (!key) return;
    store.update(function (next: PluginState) {
      next.presets[key] = capturePreset(next);
    });
    setNameValue("");
  }

  const rows: any[] = [];
  // 头一行是内置的「默认」：停在它上面时它就是当前布局本身，改动即同步；
  // 一旦切到别的预设，它就冻在切走前那副样子，应用回来就能回到手调的布局（用户 m02400）。
  const onBase = state.activePreset === "";
  rows.push(h("div", { key: "__default", className: "lo-preset-row lo-preset-row-base" },
    h("span", { className: "lo-preset-name", title: t("preset.default.hint") }, t("preset.default")),
    h(ConfirmBtn, {
      label: t("preset.apply"),
      confirmLabel: t("preset.confirmApply"),
      // 当前正停在这套上：应用一次什么也不会变，灰着比亮着诚实。
      disabled: onBase,
      title: onBase ? t("preset.apply.active") : t("preset.default.hint"),
      onConfirm: function () {
        store.update(function (next: PluginState) {
          if (!next.defaultPreset) return;
          applyPreset(next, next.defaultPreset);
          next.activePreset = "";
        });
        if (state.defaultPreset) clearFreshOfPreset(state.defaultPreset);
        notifyRevision();
      }
    }),
    h(Btn, { disabled: true, title: t("preset.default.locked") }, t("preset.delete"))
  ));
  let i: number;
  for (i = 0; i < names.length; i++) {
    const key = names[i];
    const preset = state.presets[key];
    const current = state.activePreset === key;
    rows.push(h("div", { key: key, className: "lo-preset-row" },
      h("span", { className: "lo-preset-name", title: key }, key),
      h(ConfirmBtn, {
        label: t("preset.apply"),
        confirmLabel: t("preset.confirmApply"),
        disabled: current,
        title: current ? t("preset.apply.active") : t("preset.apply.hint"),
        onConfirm: (function (one: PresetData, presetName: string) {
          return function () {
            store.update(function (next: PluginState) {
              applyPreset(next, one);
              next.activePreset = presetName;
            });
            clearFreshOfPreset(one);
            notifyRevision();
          };
        })(preset, key)
      }),
      h(ConfirmBtn, {
        label: t("preset.delete"),
        confirmLabel: t("preset.confirmDelete"),
        title: t("preset.delete.hint"),
        onConfirm: (function (presetName: string) {
          return function () {
            store.update(function (next: PluginState) {
              delete next.presets[presetName];
              // 删掉的正是当前这套：布局留着，身份退回「默认」，免得当前套指向一个不存在的名字。
              if (next.activePreset === presetName) next.activePreset = "";
            });
          };
        })(key)
      })
    ));
  }

  return h(Card, { title: t("section.presets") },
    h("div", { className: "lo-preset-save" },
      h("input", {
        type: "text",
        className: "lo-input",
        value: nameValue,
        placeholder: t("preset.placeholder"),
        maxLength: 24,
        "aria-label": t("preset.placeholder"),
        onChange: function (event: any) {
          setNameValue(event && event.target ? String(event.target.value || "") : "");
        }
      }),
      exists
        ? h(ConfirmBtn, {
            label: t("preset.overwrite"),
            confirmLabel: t("preset.confirmOverwrite"),
            title: t("preset.overwrite.hint"),
            onConfirm: save
          })
        : h(Btn, { variant: "primary", disabled: name.length === 0, onClick: save }, t("preset.save"))
    ),
    h("div", { className: "lo-preset-note" }, t("preset.note")),
    h("div", { className: "lo-preset-list" }, rows)
  );
}