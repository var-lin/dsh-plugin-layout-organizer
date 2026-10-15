# Plugin Layout Organizer

中文：[README.md](README.md)

A DSH client plugin that lets you **drag plugin buttons where you want them, draw a line between official and third-party entries, and stash the ones you rarely use**. It only changes where a button is *shown* — it never uninstalls, enables or disables a plugin.

> Targets DSH `>=0.2.0-rc.2`.

---

## What it does

DSH renders plugin buttons into five places. This plugin treats all five the same way:

| Location | Slot | Description |
| --- | --- | --- |
| Sidebar top buttons | `sidebar.panellist` | The "Plugins / Schedules / SSH / MCP connectors" column |
| Sidebar footer buttons | `sidebar.footer.action` | The icon buttons at the bottom of the sidebar, above Settings |
| Conversation tab buttons | `conversation.view` | The "Chat / Trajectory / Context / Fleet" row above a conversation |
| Conversation dock buttons | `conversation.composer.dock` | The row underneath the composer |
| Settings navigation buttons | `settings.section` | The navigation rows inside the Settings dialog |

### 1. Drag to reorder

- Drag any **draggable** button; the new position is saved on release. The button follows the pointer, the rows it passes open a gap to show where it will land, and releasing does not trigger the button itself.
- Third-party buttons are **always draggable**. Official buttons are locked by default — turn on "Allow dragging official buttons" in Settings to move them too.
- Ordering follows a **group-major** rule: official buttons stay in front and third-party buttons behind, with your drag order winning inside each group.
- "Allow official and third-party rows to mix" is **on by default** (a child switch under "Allow dragging official buttons"): with it on, the saved order is kept verbatim and a third-party button can land between two official ones.
- This plugin's own Settings entry ("Plugin layout organizer") is draggable and stashable like any other row.

### 2. Official / third-party divider

- Off by default. Turn on the master switch "Show official / third-party divider" and each location can be toggled separately: **sidebar top, conversation tabs, settings navigation**. The sidebar footer and the composer dock never get a line — in a single column or row the two kinds already interleave, and an inserted line would read as a spurious extra group.
- The line is drawn centred in the gap between the last official and the first third-party button, adapting to horizontal and vertical layouts.
- It is hidden while a DSH dialog covers the row. The settings-navigation line lives inside the dialog (`z-index` 1010); the others sit at body level (`z-index` 90) and never paint over official overlays.
- A line also hides itself when its rows unmount, are hidden or clipped by an ancestor, or — with mixing on — when the two kinds actually interleave (one straight line cannot describe several boundaries).
- Purely visual; it does not change the ordering rule.

### 3. Button stash

- **Right-click** any stashable button for a "Move up / Move down / Stash" menu in the same style as DSH's own context menus (same translucent surface, hairline stroke, rounded items and icon column), or press "Stash" on the row in Settings.
- A stashed button disappears from the UI while **its plugin keeps running** — stashing is visual hiding only, reversible at any time.
- Open the stash with:
  - the **keyboard shortcut** (desktop default `Ctrl/Cmd + Shift + O`; on the web `Ctrl/Cmd + Shift + Alt + O` on Windows / macOS and `Ctrl/Cmd + Shift + ,` on Linux; rebindable in Settings);
  - the **floating launcher** below the top bar at the right screen edge (drag it anywhere; on release it snaps to the nearer left/right edge and keeps its vertical offset);
  - Settings → **Plugin layout organizer** → the "Button stash" section.
- Entries in the stash are **clickable**: "Plugin market" opens Settings on that page, a sidebar button selects that panel, a footer icon or conversation tab triggers the original button; a missing row offers "Open the page" instead.
- Three sort modes: **by location / by official-third / by name**, plus a separate "Restore all".

### 4. Settings page

Settings → **Plugin Layout Organizer** (the same page is also mounted in this plugin's detail panel in the plugin manager):

- **General**: allow dragging official buttons (child switch: mixing), show divider (child switches: the three locations), show the floating launcher, and a two-step "Reset every setting" that clears ordering, kinds, stash and every switch back to a fresh install. The two grouped rows own child switches: the master only gates them (they grey out while it is off), and clicking a grey child lights its path and switches the master on together.
- **Title row**: export the whole configuration to a JSON file, import one back (a file with a non-matching schema version is rejected wholesale, never half-applied), and open this project's GitHub repository. The expand/collapse state of the grouped rows is remembered across reloads.
- **Shortcut**: record and restore the default, with text warnings for conflicting or unusable combinations.
- **Button stash**: shows the current count and opens the panel.
- **Five location cards**: every button in that location, with drag, move up/down, official/third-party override, stash and restore; each card has its own two-step "Restore this group's default order".
- If a host service is missing the page degrades gracefully (e.g. no hotkey service means the stash relies on the floating launcher) and says why at the top of the page.

---

## Install

This package is a standard DSH bundle. Install it with the built-in plugin manager:

```sh
dsh plugin --profile <your-profile> add dsh-plugin-layout-organizer
```

Or ask the agent to call `plugin_manager` (`action=install_bundle`, `target` pointing at this directory).

Refresh the page afterwards.

---

## Development

```sh
node build.mjs          # concatenate the BUILD_ORDER TS modules into lib/client.js, inlining assets/icons/
node --check lib/client.js
node test/smoke.mjs     # headless smoke test with a fake DOM / React / ctx
node test/navigate.mjs  # behavioural test for the two-step settings route
node test/accept.mjs    # source-shape acceptance probe for the feedback items
```

(Equivalent to `npm run build` / `npm run check` / `npm test`.)

### Source layout

A client bundle may only `require` platform seed words or packages already registered in the boot graph, so **runtime chunk loading by relative path is not available**. This project therefore uses **modular sources plus a build-time concatenation**:

- `src/` is split by responsibility into `types/`, `shared/`, `core/`, `drag/` and `ui/`; `build.mjs` holds an **explicit `BUILD_ORDER` list** and concatenates those files in that order;
- the list **is** the load-order declaration — later modules rely on top-level `var` / `function` definitions from earlier ones, so it is kept explicit rather than discovered by a directory walk (`types/globals.d.ts` is for the type checker only and is not concatenated);
- TypeScript syntax is erased by Node's own `module.stripTypeScriptTypes` in `transform` mode, so there is no bundler and nothing to install;
- the artifact is a single `lib/client.js` wrapped in `window.__ModuleLoader__.load({ id, factory })`;
- `assets/icons/` holds the seven icon SVGs downloaded from iconfont and is a **build input**: the sources never hand-write artwork, only `@@svg:file.svg@@` placeholders (`shared/icons.ts` for the six menu icons, `core/dom-project.ts` for the Settings self icon as `@@svg:layout.svg@16@@`). `build.mjs` normalizes each asset — `viewBox` taken from the source file, `width`/`height` fixed to 14 unless the placeholder specifies a size, hardcoded colors rewritten to `currentColor`, `aria-hidden` / `focusable` added — and inlines the `<svg>` into `lib/client.js`. `layout.svg` doubles as the package icon referenced by package.json's `"icon"`, and the directory is in the `files` whitelist so an installed package can rebuild.

| Module | Responsibility |
| --- | --- |
| `types/state.ts` | TypeScript shapes for the DSH services (slots / locale / layout / shortcuts) and this plugin's state; erased at build |
| `types/globals.d.ts` | Global declarations for the build preamble (React, `h`, the hooks); type-check only, not concatenated |
| `shared/constants.ts` | Plugin id, storage key, five-slot table, official id allow-list, DOM mark names, z-index constants |
| `shared/icons.ts` | The six right-click menu icons as `@@svg:…@@` build placeholders; normalized from `assets/icons/` and inlined at build time |
| `shared/locale.ts` | Chinese / English message dictionaries |
| `core/store.ts` | State shape (v5), persistence, pure queries and commands (ordering, grouping, stashing) |
| `core/dom-rows.ts` | Row discovery per slot, ledger reading, row labelling/pairing, geometry |
| `core/dom-line.ts` | The body-level official/third-party divider |
| `core/dom-menu.ts` | The right-click menu, styled after DSH's own menus, and its window-level bindings |
| `core/dom-project.ts` | The projection: writes markers, `style.order`, the divider and the self icon |
| `core/dom-navigate.ts` | Opening a stashed button again, including the two-step settings route |
| `core/organizer.ts` | Scheduling hub: rAF coalescing, MutationObserver, slot subscriptions |
| `drag/drag-rows.ts` | Pointer drag controller for the DSH UI rows |
| `drag/drag-list.ts` | Pointer drag controller for this plugin's own Settings lists |
| `ui/styles.ts` | Stylesheet injection and all CSS rules |
| `ui/kit.ts` | React primitives (Switch / Field / Card / Chip / Btn / RowItem / ConfirmBtn) |
| `ui/config-actions.ts` | Configuration export / import (schema-version check) and the repository URL |
| `ui/settings-page.ts` | Settings page: general card, shortcut editor, five location cards |
| `ui/stash.ts` | Button stash panel and floating launcher |
| `main.ts` | Wiring: styles, locale, store, slot registration, shortcut, teardown |

---

## Known boundaries

- **Ordering and hiding happen at the DOM layer; the plugin registry is not modified.** DSH sorts a slot's registry once, at `register()` time (`priority → order`); changing `order` afterwards does not re-sort it. This plugin therefore writes `style.order` and marker attributes onto the real DOM rows, which depends on the official UI structure and may need adapting after a major DSH upgrade.
- **There is no authoritative "official vs third-party" field.** The `registrant` recorded in slot entries is unreliable (several third-party packages report the official marker), so this plugin ships an **allow-list of official ids** and lets you flip any row manually in Settings.
- **"Stash" is not uninstall.** A stashed button is hidden; the plugin itself keeps running.

---

## License

MIT
