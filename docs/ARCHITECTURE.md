# Architecture

Technical overview of how the Notioneer plugin is built. Read this before making non-trivial changes.

## Overview

Notioneer brings three Notion-like editing conveniences to Obsidian: a note header (title,
cover image, frontmatter properties) rendered at the top of a note, a `/` slash-command menu
for inserting blocks, and a formatting toolbar that appears on text selection.

Scope decisions:

- **No spaces / no vault-navigation features.** make.md's "spaces" concept is out of scope;
  Notioneer only touches the editor and the note it is open on. As of the fork these are
  switched off by default and will be removed outright — see [Fork status](#fork-status).
- **Slash commands insert plain Markdown.** The reason this plugin exists rather than using
  make.md: its table command should produce a real Markdown table, not a plugin block.
- **Cover images and properties live in frontmatter**, so a note degrades to normal Markdown.
- **No network calls.**

While the fork is being trimmed, upstream subsystems that contradict these decisions are
present in the source but disabled by default. Treat the list above as the target, not as a
description of what currently ships.

## Fork status

Since 0.7.0 this repo is a **fork of make.md**, not a plugin that borrows from it. The whole
upstream source tree lives in `src/` and the work happens by removing from it.

Stages:

1. **Done (0.7.0)** — upstream imported and building under the Notioneer identity, with the
   spaces-related settings defaulted off and the hardcoded `plugins/make-md/` data paths
   pointed at our own plugin folder.
2. **Next** — remove the subsystems we do not ship (navigator, spaces/space views, frames,
   `.mdb`/sql.js, blink, backlinks) and the dependencies that go with them.
3. **After that** — restore the Markdown-native slash commands and the selection toolbar,
   which are parked in `legacy/` (see below), in place of make.md's equivalents.

`legacy/` holds the pre-fork vanilla implementation (0.1.0–0.6.0): slash commands, selection
toolbar, note header, and their CSS. It is not wired into the build; it is kept because
stage 3 restores the first two, and because the Markdown-snippet slash commands are the one
behaviour this plugin exists to do differently from make.md.

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
| `src/basics/` | make.md's slash commands and selection menu. To be replaced in stage 3. |
| `src/css/` | All styling, bundled into `styles.css`. |
| `legacy/` | Pre-fork vanilla implementation. Not built. |

## What changed from upstream

Kept deliberately small so upstream changes can still be merged:

- `src/core/schemas/settings.ts` — `navigatorEnabled`, `blinkEnabled`, `contextEnabled`,
  `spaceViewEnabled`, `spacesEnabled`, `enableFolderNote`, `spacesStickers`, `sidebarTabs`,
  `showRibbon` and `vaultSelector` default to `false`. `inlineContext`, `banners` and
  `inlineContextProperties` stay on — those are the header.
- `src/main.ts`, `src/adapters/obsidian/filesystem/filesystem.ts` — `plugins/make-md/Spaces.mdb`
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
- [esbuild](https://esbuild.github.io/) (`esbuild.config.mjs`, upstream's) bundles `src/main.ts` into a single CommonJS `main.js` (~5.4 MB), externalizing `obsidian`, `electron`, part of CodeMirror and Node builtins. It also inlines the three web workers and compiles `.wat`.
- The same pass emits `main.css` from the CSS imported by the source; a rename plugin turns it into the root `styles.css` (~149 KB) that Obsidian loads. Both are generated and gitignored.
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
