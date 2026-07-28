# Architecture

Technical overview of how the Notioneer plugin is built. Read this before making non-trivial changes.

## Overview

Notioneer brings three Notion-like editing conveniences to Obsidian: a note header (title,
cover image, frontmatter properties) rendered at the top of a note, a `/` slash-command menu
for inserting blocks, and a formatting toolbar that appears on text selection.

Scope decisions:

- **No spaces / no vault-navigation features.** make.md's "spaces" concept is out of scope;
  Notioneer only touches the editor and the note it is open on.
- **Slash commands insert plain Markdown.** The reason this plugin exists rather than using
  make.md: its table command should produce a real Markdown table, not a plugin block.
- **Cover images and properties live in frontmatter**, so a note degrades to normal Markdown.
- **No network calls.**

These hold as of 0.8.2: the spaces subsystems are deleted, not merely switched off. What is
left of upstream is the `Superstate` the header reads from — see [Fork status](#fork-status).

## Fork status

Since 0.7.0 this repo is a **fork of make.md**, trimmed down rather than written from scratch.

| Stage | State | Result |
|---|---|---|
| 1. Import upstream, build as Notioneer | done (0.7.0) | 619 files, 5.7 MB bundle |
| 2. Remove what the header does not need | done (0.8.0) | 305 source files, 4.4 MB bundle (CSS kept whole — see below) |
| 3. Restore the Markdown slash commands and selection toolbar | done (0.8.0) | `src/notioneer-slash/`, `src/notioneer-toolbar/` |
| 4. Shed the remaining heavy dependencies | not started | see [DEPENDENCIES.md](DEPENDENCIES.md) |

### How stage 2 was done

Deleting directories by hand does not work on a tree this size — everything is reachable from
something. Instead `src/main.ts` was rewritten to wire up only the header, and
`scripts/unreachable.mjs` computes what the entry point can still reach and deletes the rest.
Whatever the build and typecheck still pass without was, by definition, not needed.

Four edges kept nearly the whole tree alive. They are worth knowing about, because this is the
kind of thing that will happen again in stage 4:

- `src/makemd-core.ts` was a barrel re-exporting the entire plugin, and 205 files imported
  from it — so importing it once pulled everything. `scripts/debarrel.mjs` rewrote those
  imports to the real modules; the barrel is gone.
- `BannerView` imported a four-string union type (`InputModifier`) from the frame editor,
  dragging the frame editor, table view and D3 charts in with it. Inlined.
- 25 modules imported the `CellEditMode` enum and the table cell prop types from `TableView`,
  doing the same for `@tanstack/react-table`. Moved to `shared/types/cellEditMode.ts`.
- The property chip in the header (`PropertyField`) lived inside the context-list editor.
  Moving it to its own module made 132 files unreachable at once.

Type-only imports cost real bundle size here: the module still gets pulled in.

Stylesheets are exempt from the reachability sweep. make.md's header borrows classes from
stylesheets that its entry point imports globally rather than from a file per component, so
"not imported by a reachable module" does not mean "unused" for CSS — deleting them on that
basis is what left the header unstyled in 0.8.1.

### What was removed

Navigator and its views, space views and the space editor, frames and the frame editor, the
context and table views, the Blink palette, inline backlinks, D3 visualizations, the
`.mdb`/`.mkit`/`.html` file editors, kit installation, export, the dataview adapter, tab
stickers, and make.md's own settings tab — replaced by
`adapters/obsidian/notioneerSettings.ts`, which only exposes settings that still do something.

### What had to stay

The header is a React component that reads from make.md's `Superstate`, so the Superstate, its
space manager, the filesystem middleware and the Obsidian adapters underneath it all stay,
along with the property cell views the header renders. That is what still makes the bundle
4.4 MB, and why "just delete spaces" was never on the table: the header sits on top of it.

## Source layout

Upstream's layout, unchanged — see make.md's own docs for the full map. The parts that matter
for the features Notioneer keeps:

| Path | Responsibility |
|---|---|
| `src/main.ts` | Plugin entry: builds the `Superstate`, registers adapters, views and settings. |
| `src/adapters/obsidian/inlineContextLoader.tsx` | Mounts the note header into the editor's `.cm-sizer`. |
| `src/core/react/components/MarkdownEditor/` | The note header itself: `MarkdownHeaderView`, `BannerView`. |
| `src/core/react/components/SpaceView/TitleComponent.tsx` | The editable title. |
| `src/core/react/components/SpaceView/Contexts/SpaceEditor/HeaderPropertiesView.tsx` | The property rows. |
| `src/core/schemas/settings.ts` | `DEFAULT_SETTINGS` — where the spaces subsystems are switched off. |
| `src/adapters/obsidian/notioneerSettings.ts` | Our settings tab, replacing make.md's. |
| `src/notioneer-slash/` | Slash commands that insert plain Markdown. Ours, no React. |
| `src/notioneer-toolbar/` | Selection formatting toolbar. Ours, no React. |
| `src/css/` | All styling, bundled into `styles.css`; `css/notioneer.css` is ours. |

## What changed from upstream

Kept deliberately small so upstream changes can still be merged:

- `src/main.ts` — rewritten. Upstream's bootstrap sequence kept in order; everything that
  registered a view, command or file editor removed; our slash commands and selection toolbar
  wired in. `loadCacheFromObsidianCache()` is called unconditionally — upstream calls it only
  when spaces are on, and without it the path index stays empty and the header renders nothing.
- `src/core/schemas/settings.ts` — `navigatorEnabled`, `blinkEnabled`, `contextEnabled`,
  `spaceViewEnabled`, `spacesEnabled`, `enableFolderNote`, `spacesStickers`, `sidebarTabs`,
  `showRibbon` and `vaultSelector` default to `false`. `inlineContext`, `banners` and
  `inlineContextProperties` stay on — those are the header. Two keys added for our features.
- `HeaderPropertiesView` — the "spaces this note belongs to" rows are gated on `spacesEnabled`
  and replaced by our folder chip (`src/notioneer-header/FolderCrumb.tsx`).
- `src/css/notioneer.css` — hides Obsidian’s properties panel inside the editor (the header
  renders its own) and restyles the header’s value chips with the theme’s `--tag-*`/`--pill-*`
  variables, so they match the native panel instead of make.md’s neutral grey.
- `src/adapters/obsidian/filesystem/filesystem.ts` — `plugins/make-md/Spaces.mdb`
  and `plugins/make-md/data.json` were hardcoded; they now use `manifest.dir`, so they resolve
  inside our own plugin folder instead of a make.md folder that does not exist.
- `tsconfig.json` — `target` raised from `es6` to `es2020`. Upstream's `es6` target fails to
  compile its own `src/adapters/text/textCacher.ts` (regex flag needing ES2018+).
- `esbuild.config.mjs` — output goes to the repo root instead of `process.env.buildDir`, which
  upstream leaves unset (it built to a literal `undefined/` directory).
- `package.json` — upstream's 97 dependency ranges resolved to exact pins, per the project's
  dependency policy. See [DEPENDENCIES.md](DEPENDENCIES.md).

Upstream's `npm run build` also calls `scripts/sync-version.mjs`, which is gitignored upstream
and therefore absent from the clone; our build script does not.

## Build pipeline

- TypeScript (`tsconfig.json`) type-checks the tree (`tsc -noEmit -skipLibCheck`) — no `.js` is emitted by `tsc` itself.
- [esbuild](https://esbuild.github.io/) (`esbuild.config.mjs`, upstream's) bundles `src/main.ts` into a single CommonJS `main.js` (~4.4 MB), externalizing `obsidian`, `electron`, part of CodeMirror and Node builtins. It also inlines the three web workers and compiles `.wat`.
- The same pass emits `main.css` from the CSS imported by the source; a rename plugin turns it into the root `styles.css` (~147 KB) that Obsidian loads. Both are generated and gitignored.
- `scripts/copy-to-vault.mjs` copies `main.js`, `manifest.json` and `styles.css` into the vault named in `.env.local`.
- `manifest.json` + `versions.json` follow the standard Obsidian plugin conventions (`minAppVersion` compatibility map).

See [DEVELOPMENT.md](DEVELOPMENT.md) for how to actually run the build.

## Credits

This plugin is a fork of [make.md](https://github.com/Make-md/makemd) — MIT licensed,
Copyright (c) 2022 JP Cen — whose licence is kept verbatim in `LICENSE-makemd`. Essentially
all source under `src/` is theirs; see [What changed from upstream](#what-changed-from-upstream)
for the delta.

Notioneer itself is GPLv3 (`LICENSE`). MIT code may be combined into a GPLv3 work provided the
MIT notice is retained, which is what `LICENSE-makemd` is for.
