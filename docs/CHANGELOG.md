# Changelog

Living log of significant changes to the project. This is **not** optional bookkeeping — every significant change (new feature, format change, dependency change, removed feature, policy change) gets an entry here at the time it's made. See the documentation policy in [.claude/CLAUDE.md](../.claude/CLAUDE.md).

Format: `YYYY-MM-DD — short description. Why (if not obvious). Files touched.`

## 2026-07-27 (0.8.0)

- **Stripped the fork down to the header (stage 2).** `src/main.ts` rewritten to wire up only
  the note header, then everything the entry point could no longer reach was deleted:
  619 -> 305 source files, `main.js` 5.7 -> 4.4 MB, `styles.css` 149 -> 58 KB. Gone: navigator,
  space views and space editor, frames and frame editor, context/table views, Blink, inline
  backlinks, D3 visualizations, `.mdb`/`.mkit`/`.html` editors, kit install, export, dataview
  adapter, tab stickers, and make.md’s settings tab (replaced by a small one with only the
  settings that still do something).
- Four import edges were keeping the whole tree alive and had to be cut first: the
  `makemd-core` barrel (205 importers, now rewritten to direct imports and deleted), a
  four-string union type `BannerView` imported from the frame editor, the `CellEditMode` enum
  and cell prop types living inside `TableView` (moved to `shared/types/cellEditMode.ts`), and
  `PropertyField` living inside the context-list editor (moved out; freed 132 files at once).
  Details in `docs/ARCHITECTURE.md`.
- Added `scripts/unreachable.mjs` (reachability from the entry, with `--delete` and `--why`)
  and `scripts/debarrel.mjs`. The first is how stage 4 will be done too.
- **Restored the Markdown slash commands and selection toolbar (stage 3).** Back from
  `legacy/` into `src/notioneer-slash/` and `src/notioneer-toolbar/`, with
  `notioneerSlashCommands` / `notioneerSelectionToolbar` settings. `/table` inserts a real
  Markdown table again — make.md’s own slash commands went out with `basics`.
- Files: `src/main.ts`, `src/adapters/obsidian/notioneerSettings.ts` (new), `src/notioneer-slash/`,
  `src/notioneer-toolbar/`, `src/css/notioneer.css`, `src/shared/types/cellEditMode.ts` (new),
  `scripts/`, `docs/ARCHITECTURE.md`, `docs/FAQ.md`, `README.md`, plus 300+ deletions.

## 2026-07-27 (0.7.0)

- **Became a fork of make.md** (stage 1 of 3). Reimplementing the header from their source
  kept landing visibly different from the real thing, so the approach changed: the upstream
  tree is imported wholesale and will be trimmed down instead. What this stage does:
  - Upstream `src/` (619 files) imported; builds under the Notioneer identity. `main.js` goes
    from 21 KB to 5.4 MB, `styles.css` to 149 KB — both now gitignored as generated output.
  - 55 runtime + 42 dev dependencies added (939 packages). Upstream ships 94 of 97 as ranges;
    all resolved to exact pins per the dependency policy. Approved explicitly by the owner.
    One open high-severity `lodash` advisory is recorded, not fixed — see `docs/DEPENDENCIES.md`.
  - Spaces-related settings default to off (`spacesEnabled`, `navigatorEnabled`,
    `spaceViewEnabled`, `contextEnabled`, `enableFolderNote`, `spacesStickers`, `sidebarTabs`,
    `showRibbon`, `vaultSelector`, `blinkEnabled`). The header settings stay on.
  - Fixed upstream paths that were hardcoded to `plugins/make-md/` (`Spaces.mdb`, `data.json`)
    and would resolve to a folder that does not exist under our plugin id — now `manifest.dir`.
  - Fixed upstream's build: `target` `es6` -> `es2020` (their own `textCacher.ts` does not
    compile at `es6`), and esbuild output goes to the repo root instead of `process.env.buildDir`,
    which is unset upstream and produced a literal `undefined/` directory.
  - The 0.1.0–0.6.0 vanilla implementation moved to `legacy/`, out of the build, to be restored
    in stage 3 (Markdown slash commands, selection toolbar).
- Files: everything. `LICENSE-makemd` added (MIT notice, required to redistribute their code).

## 2026-07-27 (0.6.0)

- **Note header ported from make.md instead of re-derived.** `src/styles/header.css` is now
  make.md's CSS copied verbatim (`FileContext.css`, `FlowEditor.css`, the `--mk-ui-*` aliases
  from `DefaultVibe.css`) and the DOM uses their class names and element order, so the rules
  apply as written. Why: 0.5.0 reimplemented the layout from reading their source and got two
  things wrong that made it look nothing like make.md — the header was constrained to
  `--file-line-width` a second time (`.cm-sizer` already does it) and the banner sat in the
  flow instead of `position: absolute` + `.mk-spacer`.
- **Fixed the cover buttons doing nothing.** CodeMirror disables pointer events on what is
  injected into `.cm-sizer`, so the click never reached the handler and no `cover` key was
  ever written — the image was never the problem. make.md has the same `pointer-events: all`
  rule for its reading-mode header.
- CSS is split into per-feature partials imported by `index.css`.
- Files: `src/styles/header.css` (new), `src/styles/index.css`, `src/header/noteHeader.ts`,
  `docs/ARCHITECTURE.md`, `docs/FAQ.md`, `package.json`, `manifest.json`, `versions.json`.

## 2026-07-27 (0.5.0)

- **Note header rebuilt to match make.md.** The 0.4.0 header was an approximation written
  without reading make.md; this one ports its actual layout and CSS (`MarkdownHeaderView.tsx`,
  `BannerView.tsx`, `FileContext.css` — MIT, credited in `docs/ARCHITECTURE.md`): full-width
  banner, title overlapping its bottom edge, property rows below. Property rows are now part
  of the header (add, edit, right-click to delete) and Obsidian's native properties panel is
  hidden in the editor so nothing renders twice. Colours use Obsidian's theme variables and
  the title reuses the native `inline-title` class, so themes apply automatically.
  Fixes the cover never appearing: it is an `<img>` now, not a CSS `background-image` whose
  `url()` broke on resource paths. Files: `src/header/noteHeader.ts`,
  `src/header/newPropertyModal.ts` (new), `src/styles/index.css`, `README.md`,
  `docs/ARCHITECTURE.md`, `docs/FAQ.md`, `package.json`, `manifest.json`, `versions.json`.

## 2026-07-27 (0.4.0)

- **Note header.** Cover image and editable title at the top of every Markdown editor. The
  cover is a plain `cover` frontmatter key (vault path or external URL); the title renames the
  file through `fileManager.renameFile` so links follow. Properties are deliberately left to
  Obsidian's native panel, which renders in the same container just below. Added a
  `Note header` setting. Files: `src/header/noteHeader.ts`, `src/header/coverPicker.ts`,
  `src/main.ts`, `src/styles/index.css`, `docs/ARCHITECTURE.md`, `docs/FAQ.md`, `README.md`,
  `package.json`, `manifest.json`, `versions.json`.

## 2026-07-27 (0.3.0)

- **Selection toolbar.** Selecting text in the editor pops up a floating toolbar for bold,
  italic, strikethrough, highlight, inline code and link. Toggling removes existing markers
  instead of stacking them. Built on the browser selection + Obsidian's `Editor` API so no
  CodeMirror dependency is needed. Added a `Selection toolbar` setting. Files:
  `src/toolbar/format.ts`, `src/toolbar/selectionToolbar.ts`, `src/editorUtils.ts` (new shared
  position helper, also used by the slash suggester), `src/main.ts`, `src/styles/index.css`,
  `docs/ARCHITECTURE.md`, `docs/FAQ.md`, `package.json`, `manifest.json`, `versions.json`.

## 2026-07-27 (0.2.0)

- **Slash commands.** Typing `/` at the start of a line (or after whitespace) opens a menu of
  block commands that insert plain Markdown — a real Markdown table, not a plugin block, which
  is the whole reason this plugin exists rather than using make.md. Added a `Slash commands`
  setting to turn it off. Files: `src/slash/commands.ts`, `src/slash/suggest.ts`, `src/main.ts`,
  `src/styles/index.css`, `README.md`, `docs/ARCHITECTURE.md`, `docs/FAQ.md`, `package.json`,
  `manifest.json`, `versions.json`.

## 2026-07-27 (0.1.0)

- **Initial scaffold** from the Obsidian plugin bootstrap template. Files: all.
