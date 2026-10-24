# Plugin Layout Organizer

中文：[README.md](README.md)

A DSH client plugin that lets you **drag plugin buttons where you want them, draw a line between official and third-party entries, and stash the ones you rarely use**. It only changes where a button is *shown* — it never uninstalls, enables or disables a plugin. Buttons inside DSH's own More menus are covered too.

> Targets DSH `>=0.1.7-rc.2`: every `0.1.x` and `0.2.x` build from `0.1.7-rc.2` on (all release candidates plus the `0.2.1` release) runs the same code — no per-version package needed.
>
> Anything that depends on the More menu ("Into More" / "Out of More", "Keep the two More menus apart", the divider inside the More menu) only appears on hosts that actually have More — that arrived in `0.2.1-rc.3`. On older hosts those entries are simply not drawn; everything else works as usual.

---

## What it does

DSH renders plugin buttons into five places. This plugin treats all five the same way, and it also covers the buttons inside the **More menus** at the top of the sidebar and at the top right of a conversation (see section 3):

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

### 3. The floating stash (tucked-away buttons)

- **Right-click** any stashable button for a "Move up / Move down / Official·Third-party / Into more (or Out of more) / Stash" menu in the same style as DSH's own context menus (same translucent surface, hairline stroke, rounded items and icon column), or press "Stash" on the row in Settings.
- That fourth item names its target kind: a row currently marked Third-party reads **Official**, and one marked Official reads **Third-party** — one click reclassifies it. Reclassifying only touches this plugin's local record (the same thing the in-row button does in Settings); the plugin itself is unaffected.
- A stashed button disappears from the UI while **its plugin keeps running** — stashing is visual hiding only, reversible at any time.
- **Two levels of stashing**: **"Into more"** moves a button out of the main list and into DSH's own More menu (where it stays clickable); **"Stash"** is what moves it into the floating panel. The right-click menu and every row in Settings offer both, so "Out of more" or "Restore" can bring it back at any time.
- **The two More menus share one list by default** (the sidebar and conversation More menus show the same items); turn on "Keep the two More menus apart" in Settings and sidebar buttons (including the sidebar footer) only go into the sidebar More, while conversation buttons only go into the conversation More.
- Rows inside a More menu can be **dragged to reorder and right-clicked for move up / move down / out of more / stash**; turn on "Draw the divider inside the More menu" and official entries come first, third-party buttons after, with a line between them (like the on-page one, it hangs off the "Show the official / third-party divider" master switch and carries its own child switch).
- Open the stash with:
  - the **keyboard shortcut** (desktop default `Ctrl/Cmd + Shift + O`; on the web `Ctrl/Cmd + Shift + Alt + O` on Windows / macOS and `Ctrl/Cmd + Shift + ,` on Linux; rebindable in Settings);
  - the **floating launcher** below the top bar at the right screen edge (drag it anywhere; on release it snaps to the nearer left/right edge and keeps its vertical offset);
  - Settings → **Plugin layout organizer** → the "Floating stash" section.
- Entries in the stash are **clickable**: "Plugin market" opens Settings on that page, a sidebar button selects that panel, a footer icon or conversation tab triggers the original button. **A row that is inert in the real UI — a read-only stats strip a plugin drops into the composer dock, say — is greyed out and unclickable here too**: it has no page to open, so clicking navigates nowhere and no longer closes the stash either.
- The panel has a **fixed size** (`min(520px, 92vw)` wide, `min(720px, 84vh)` tall): title, search, sort chips and "Restore all" stay pinned, only the list scrolls, so a long list never grows the panel.
- A **search box** at the top filters by name, id or location as you type; a magnifier sits on its left and the × icon on its right clears it, and an unmatched list shows a hint instead.
- Three sort modes: **by location / by official-third / by name**, plus a separate "Restore all" (two-step confirmation); a single row's "Restore" acts on the first click.
- Each row leads with **the button's own icon** — when the original button draws none, the icon its plugin registers stands in, and only when neither exists is the slot left blank — then the name, the plugin id and the restore button. Long names are ellipsized and the **restore button never wraps**. The grey tag to the right of the name is that plugin's id, not a location name.

### 4. Settings page

Settings → **Plugin Layout Organizer** (the same page is also mounted in this plugin's detail panel in the plugin manager):

- **Top tab navigation**: a pill-style segmented control matching DSH's own `SegmentedControl` palette — two items in a light grey rounded trough (`--dsw-alias-interactive-bg-hover`), the active one a raised pill (`--dsw-alias-bg-layer-1` with a `--dsw-elevation-soft` shadow and bold, near-black text), the inactive one plain grey text that only darkens on hover. Two panes — **Layout** (the stash entry and the five location cards) and **General** (switches and the shortcut editor). Only the active pane renders; the scroll position and the search term survive switching, and the floating-stash entry card steps aside while a search is active.
- **General**: allow dragging official buttons (child switch: mixing), show divider (child switches: the three locations and the More menu), show the floating launcher, "Keep the two More menus apart", and a two-step "Reset every setting" that clears ordering, kinds, stash and every switch back to a fresh install. The two grouped rows own child switches: the master only gates them (they grey out while it is off), and clicking a grey child lights its path and switches the master on together. **The reset button is greyed out while the configuration is still factory-fresh** — pressing it would change nothing, and a live-looking button that does nothing reads as broken.
- **Title row**: the installed version (e.g. `v1.2.3`) sits to the right of the heading; next to it are export (the whole configuration to a JSON file), import (a file with a non-matching schema version is rejected wholesale, never half-applied), this project's GitHub repository, and the repository's Issues page for **feedback**. The four buttons sit on the same line as the heading, flush right, while they fit; in a narrow window the group drops to a second line and **starts at the left, aligned with the heading's left edge** instead of being flung to the right with a gap in front of it. The expand/collapse state of the grouped rows is remembered across reloads.
- **Shortcut**: record and restore the default, with text warnings for conflicting or unusable combinations.
- **Floating stash**: shows the current count and opens the panel. Grouped by location or by kind, every titled group carries its own "Reset this group's default" on the right of the heading — it clears the ordering and the stash of every location that group covers (the by-name sort has no group headings, so no button there), and it greys out when the group has nothing to undo. It is a secondary action: smaller than the heading, and not bold like the heading either. **Click a group heading to collapse or expand that group** (the caret follows, the state survives a reload); the by-name sort has no heading and therefore no collapsing, and **a group can still be collapsed while searching** — a search term never forces a collapsed group open.
- **Search**: the Layout pane has a search box above the cards; it filters by button name or id as you type, drops a whole card when nothing in it matches (the floating-stash entry card included), and clearing it (the × inside the field) brings everything back. The floating-stash panel has the same search row.
- **Five location cards**: every button in that location, with drag, move up/down, official/third-party override, stash, into more and restore; each card carries its own two-step "Restore this group's default order" on the right of its heading — a secondary action, not bold — **greyed out while the card has neither a saved order nor a stashed row**: nothing to undo means nothing to click. **Click a card's heading to collapse or expand that whole category** (the caret at the far right of the heading row, past the reset button, follows; the state survives a reload; **a card can still be collapsed while searching** — a search term never forces a collapsed card open). Each row's **name area (dot + name + id) is clickable**: it takes you to where that button lives, then closes the Settings dialog; a row that is inert in the real UI keeps its name area greyed out and unclickable — looking clickable while doing nothing reads as broken.
- If a host service is missing the page degrades gracefully (e.g. no hotkey service means the floating stash relies on the launcher) and says why at the top of the page.

---

## Install

This package is a standard DSH bundle. Install it with the built-in plugin manager:

```sh
dsh plugin add dsh-plugin-layout-organizer
```

Or ask the agent to call `plugin_manager` (`action=install_bundle`, `target` pointing at this directory).

Refresh the page afterwards.

---

## Development

Requires **Node.js `>=24`** (`engines.node` in `package.json`; the build leans on Node's own `module.stripTypeScriptTypes`, and both CI and the release workflow run Node 24).

```sh
node build.mjs          # concatenate the BUILD_ORDER TS modules into lib/client.js, inlining assets/icons/
node --check lib/client.js
node test/smoke.mjs     # headless smoke test with a fake DOM / React / ctx
node test/navigate.mjs  # behavioural test for the two-step settings route
node test/accept.mjs    # source-shape acceptance probe for the feedback items
```

(Equivalent to `npm run build` / `npm run check` / `npm test`.)

### Continuous integration

Opening a pull request or pushing to `master` runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml), which applies the same gates as a release: build → syntax check → verify the committed `lib/client.js` matches the sources → the three tests, plus one type check (`npx -y --package typescript@6.0.3 tsc -p tsconfig.json`, the same version as the editor-bundled TypeScript used by `tools/ts-check.mjs`; fetched on demand, nothing added to `package.json` and no lockfile). The workflow is read-only — it neither publishes nor creates Releases. `screenshots/` is read straight from the repository by the plugin market, so changes there belong in the commit too.

### Releasing

Push a `v*` tag and [`.github/workflows/publish.yml`](.github/workflows/publish.yml) builds, verifies the committed artifact matches the sources, runs the tests, publishes to npm (Trusted Publishing / OIDC, no token needed) and creates a GitHub Release of the same name whose notes come from the matching `CHANGELOG.md` section via `tools/release-notes.mjs`:

```sh
git tag vX.Y.Z && git push origin vX.Y.Z
```

The workflow is idempotent: an existing npm version is skipped and an existing Release has its notes rewritten, so re-runs are safe. Before tagging, bump `package.json`, add the `CHANGELOG.md` section plus its link definition line, and keep the tag name equal to the version — the CI fails otherwise.

### Source layout

A client bundle may only `require` platform seed words or packages already registered in the boot graph, so **runtime chunk loading by relative path is not available**. This project therefore uses **modular sources plus a build-time concatenation**:

- `src/` is split by responsibility into `types/`, `shared/`, `core/`, `drag/` and `ui/`; `build.mjs` holds an **explicit `BUILD_ORDER` list** and concatenates those files in that order;
- the list **is** the load-order declaration — later modules rely on top-level `var` / `function` definitions from earlier ones, so it is kept explicit rather than discovered by a directory walk (`types/globals.d.ts` is for the type checker only and is not concatenated);
- TypeScript syntax is erased by Node's own `module.stripTypeScriptTypes` in `transform` mode, so there is no bundler and nothing to install;
- the artifact is a single `lib/client.js` wrapped in `window.__ModuleLoader__.load({ id, factory })`;
- `assets/icons/` holds the fifteen icon SVGs downloaded from iconfont and is a **build input**: the sources never hand-write artwork, only `@@svg:file.svg@@` placeholders (`shared/icons.ts` for the seven menu icons, four title-row action icons, two search-row icons and one "out of more" action icon, `core/dom-project.ts` for the Settings self icon as `@@svg:layout.svg@16@@`). `build.mjs` normalizes each asset — `viewBox` taken from the source file, `width`/`height` fixed to 14 unless the placeholder specifies a size (the four action icons use 16, the search-row icons 13 and 12), hardcoded colors rewritten to `currentColor`, `aria-hidden` / `focusable` added — and inlines the `<svg>` into `lib/client.js`. The action assets have very different internal padding, so `styles.ts` applies a per-name (`data-ico`) optical correction that makes one row of buttons look evenly weighted. `layout.svg` doubles as the package icon referenced by package.json's `"icon"`, and the directory is in the `files` whitelist so an installed package can rebuild.

| Module | Responsibility |
| --- | --- |
| `types/state.ts` | TypeScript shapes for the DSH services (slots / locale / layout / shortcuts) and this plugin's state; erased at build |
| `types/globals.d.ts` | Global declarations for the build preamble (React, `h`, the hooks); type-check only, not concatenated |
| `shared/constants.ts` | Plugin id, storage key, five-slot table, official id allow-list, DOM mark names, z-index constants |
| `shared/icons.ts` | The seven right-click menu icons, four title-row action icons, two search-row icons and one "out of more" action icon as `@@svg:…@@` build placeholders; normalized from `assets/icons/` and inlined at build time |
| `shared/locale.ts` | Chinese / English message dictionaries |
| `core/store.ts` | State shape (v5), persistence, pure queries and commands (ordering, grouping, stashing, into-more and the two stash levels) |
| `core/dom-rows.ts` | Row discovery per slot, ledger reading, row labelling/pairing, geometry |
| `core/dom-line.ts` | The body-level official/third-party divider |
| `core/dom-menu.ts` | The right-click menu, styled after DSH's own menus, and its window-level bindings (reorder, official / third-party reclassification, into-more / out-of-more, stash / restore) |
| `core/dom-project.ts` | The projection: writes markers, `style.order`, the divider and the self icon |
| `core/dom-navigate.ts` | Opening a tucked-away button again, including the two-step settings route |
| `core/organizer.ts` | Scheduling hub: rAF coalescing, MutationObserver, slot subscriptions |
| `core/plugin-icons.ts` | Plugin icon lookup: maps a plugin id to the icon URL its entry in the host plugin list declares, as the fallback for the row lead |
| `drag/drag-frame.ts` | Gesture pipeline shared by both drag controllers: once-per-frame recompute throttling plus one set of capture-phase listeners |
| `drag/drag-rows.ts` | Pointer drag controller for the DSH UI rows |
| `drag/drag-list.ts` | Pointer drag controller for this plugin's own Settings lists |
| `ui/styles.ts` | Stylesheet injection and all CSS rules |
| `ui/kit.ts` | React primitives (Icon / Switch / Field / Card / Chip / Btn / RowItem / ConfirmBtn) |
| `ui/search.ts` | Search box and match predicate, shared by the Settings page and the floating-stash panel |
| `ui/config-actions.ts` | Configuration export / import (schema-version check) plus the repository and Issues URLs |
| `ui/scope-card.ts` | One location card: its rows, move up/down, kind override, stash, into more and "restore this group" |
| `ui/shortcut-card.ts` | Shortcut editor: recording, conflict hints, restore default |
| `ui/settings-page.ts` | Settings page shell: title row, top tab navigation, assembly of the two panes |
| `ui/stash.ts` | Floating stash panel (fixed size + search + scrolling list) and the launcher |
| `ui/more-menu.ts` | This plugin's rows inside the More menus: registered into the host's menu slots, draggable / right-clickable / openable, ; the two host-drawn action rows (browse plugins / create your plugin) are left to the host |
| `main.ts` | Wiring: styles, locale, store, slot registration, shortcut, teardown |

---

## Known boundaries

- **Ordering and hiding happen at the DOM layer; the plugin registry is not modified.** DSH sorts a slot's registry once, at `register()` time (`priority → order`); changing `order` afterwards does not re-sort it. This plugin therefore writes `style.order` and marker attributes onto the real DOM rows, which depends on the official UI structure and may need adapting after a major DSH upgrade.
- **There is no authoritative "official vs third-party" field.** The `registrant` recorded in slot entries is unreliable (several third-party packages report the official marker), so this plugin ships an **allow-list of official ids** and lets you flip any row manually in Settings.
- **"Stash" is not uninstall — and it has two levels.** A stashed button is hidden; the plugin itself keeps running. "Into more" only moves the button into DSH's own More menu (still clickable), while "Stash" is what moves it into the floating panel; either way one click brings it back.
- **All five slots list only rows that actually exist on screen.** A ledger record that this round could not mark onto an element does not appear in Settings or the floating stash and is never mistaken for another row by position; when a location is not on screen at all, its card and its floating-stash rows are simply empty rather than falling back to the full ledger. Inside the composer dock, records that render `null` (stats readouts of a logged-out provider) are additionally claimed by hooks — the official pills via `data-composer-stats` (older hosts) or `data-composer-stat="activity"` / `"usage"` (`0.2.1` split the single pill into two), token-saver via `.st-strip`. The official readouts (the older `stats`, the newer `activity` and `usage`) and the 7% context meter (`context-meter`) tuck away independently, and the context meter counts as official.
- **Those readouts are shown by function, not by id**: the host gives no ledger label, so the plugin supplies "Session stats / Token usage / Context usage" (`ROW_LABELS`, following the UI language) instead of leaving the raw id on screen.
- **Known issue (bug)**: Trae and WorkBuddy's quota readouts register in the composer-dock slot but actually render inside the conversation dialog, so they are not bottom-dock rows. The test is mechanical rather than a name list: the projection only keeps rows it actually marked onto elements this round, and the by-position fallback skips records that declare a `ROW_HOOKS` entry — those two never get an element inside the dock container, so they neither appear in Settings nor leave a floating-stash entry that could never be restored. The same rule covers any future plugin that registers in one slot but renders somewhere else. **Hiding and tucking away dialog-internal plugins is not implemented yet**.

---

## License

MIT
