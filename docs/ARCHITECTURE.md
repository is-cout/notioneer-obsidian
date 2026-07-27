# Architecture

Technical overview of how the Notioneer plugin is built. Read this before making non-trivial changes.

## Overview

Notioneer brings three Notion-like editing conveniences to Obsidian: a note header (title,
cover image, frontmatter properties) rendered at the top of a note, a `/` slash-command menu
for inserting blocks, and a formatting toolbar that appears on text selection.

Scope decisions, set at scaffold time:

- **No custom file format.** Everything the plugin writes is plain Markdown or standard YAML
  frontmatter, readable without the plugin installed. This is the main departure from
  [make.md](https://github.com/Make-md/makemd), whose slash commands emit plugin-specific
  block syntax — Notioneer's table command produces a real Markdown table.
- **No spaces / no vault-navigation features.** make.md's "spaces" concept is out of scope;
  Notioneer only touches the editor and the note it is open on.
- **Cover images and properties live in frontmatter**, so a note degrades to normal Markdown.
- **No network calls.**

## Source layout

| File | Responsibility |
|---|---|
| `src/main.ts` | Plugin entry point: `onload`/`onunload`, settings load/save, settings tab. |
| `src/slash/commands.ts` | The slash command list (each one a plain-Markdown snippet) and the filter used by the menu. |
| `src/slash/suggest.ts` | `EditorSuggest` subclass: when `/` opens the menu, and how the chosen snippet is inserted. |
| `src/toolbar/format.ts` | The inline formats and the wrap/unwrap logic they apply to the selection. |
| `src/toolbar/selectionToolbar.ts` | The floating toolbar element: when to show it, where to place it, wiring buttons to formats. |
| `src/header/noteHeader.ts` | The per-view note header: banner, editable title, property rows, and the writes they trigger. |
| `src/header/coverPicker.ts` | Fuzzy modal listing the vault's image files, used to pick a cover. |
| `src/header/newPropertyModal.ts` | Prompt for a new frontmatter key name (Obsidian has no built-in prompt). |
| `src/editorUtils.ts` | Shared editor-position math (`positionAfter`). |

<!-- Add a row per new src/*.ts file as the project grows past a single file — this
     table is the map a new contributor (or future Claude session) reads first. -->

## Slash commands

`SlashSuggest` extends Obsidian's `EditorSuggest`, so the menu inherits the app's own
keyboard handling and styling. It triggers only when `/` sits at the start of a line or
after whitespace — otherwise dates (`1/2`) and URLs would open the menu.

Each command in `SLASH_COMMANDS` carries a `snippet` of literal Markdown. `${cursor}`
inside the snippet marks where the caret goes afterwards; it is stripped before insertion.
Adding a command means adding an entry to that array — there is no registration step.

The suggester is registered unconditionally and reads the `slashCommands` setting at
trigger time. Unregistering would need `workspace.editorSuggest`, which is not in the
public API.

## Selection toolbar

The toolbar deliberately does **not** use CodeMirror: it reads the browser selection
(`window.getSelection()`) for positioning and Obsidian's `Editor` API for edits. That keeps
`@codemirror/*` out of the dependency list, and the rendered editor text is real DOM anyway,
so `Range.getBoundingClientRect()` is enough to place the element.

It shows on `mouseup`/`keyup` rather than `selectionchange`, which would fire mid-drag and
make the toolbar jump while the user is still selecting. Buttons act on `mousedown` with
`preventDefault()` — a normal click would move focus out of the editor and drop the selection
before the action ran. Only source/Live Preview mode is handled; reading view has no editor.

`toggleInlineFormat` unwraps markers whether they are inside the selection (`**word**`
selected) or around it (`word` selected inside `**word**`), and refuses to match a marker
whose neighbouring character repeats it — so italic on `**bold**` nests to `***bold***`
instead of eating one of the bold asterisks.

## Note header

Structured after make.md's `MarkdownHeaderView` (MIT — see [Credits](#credits)): banner
image, the note title overlapping its bottom edge, then the note's properties.

The element is prepended to each Markdown editor's `.cm-sizer`, the same mount point make.md
uses (`inlineContextLoader.tsx`). `.cm-sizer` spans the full editor width, which is what lets
the banner bleed past the reading width while the title and property rows stay inside it via
`--file-line-width` / `--file-margins`. With a banner the title block is pulled up 34px so it
overlaps the image.

Obsidian's own inline title and `.metadata-container` are hidden by the
`notioneer-inline-context-enabled` body class while the header is on, so nothing renders
twice. That is scoped to `.markdown-source-view` — reading view has no `.cm-sizer`, gets no
header, and keeps the native panel.

Colours and metrics come from Obsidian's theme variables (`--text-faint`,
`--background-modifier-hover`, `--file-line-width`, …), so the header follows the active
theme. make.md aliases those into `--mk-ui-*` in `DefaultVibe.css` first; Notioneer uses the
Obsidian variables directly rather than carrying the alias layer. The title reuses Obsidian's
own `inline-title` class for the same reason.

State lives entirely in the note:

- **Cover** — the `cover` frontmatter key (same key make.md's banner uses). An external URL is
  used as-is; a vault path (bare or `[[wrapped]]`) resolves through
  `metadataCache.getFirstLinkpathDest` and is rendered as an `<img>` rather than a CSS
  `background-image`, because resource paths contain characters that would need escaping
  inside `url()`.
- **Title** — the filename, renamed through `fileManager.renameFile` so links follow.
- **Properties** — every other frontmatter key, edited through
  `fileManager.processFrontMatter`. A value that was a list stays a list (split on commas).

Rendering is a full repaint on `layout-change` / `file-open` / `active-leaf-change` /
`metadataCache.changed`, skipped while focus is inside the header — otherwise typing in the
title or a property value would be interrupted by the write it triggers.

## Build pipeline

- TypeScript (`tsconfig.json`) type-checks `src/**/*.ts` (`tsc -noEmit`) — no `.js` is emitted by `tsc` itself.
- [esbuild](https://esbuild.github.io/) (`esbuild.config.mjs`) bundles `src/main.ts` into a single CommonJS `main.js`, externalizing `obsidian`, `electron`, CodeMirror/Lezer packages (provided by the Obsidian host at runtime) and Node builtins.
- A second esbuild step bundles `src/styles/index.css` into the root `styles.css` — the file Obsidian actually loads. The root `styles.css` is generated; edit the source under `src/styles/` instead.
- `manifest.json` + `versions.json` follow the standard Obsidian plugin conventions (`minAppVersion` compatibility map).

See [DEVELOPMENT.md](DEVELOPMENT.md) for how to actually run the build.

## Credits

The note header's layout and CSS are ported from [make.md](https://github.com/Make-md/makemd)
(`src/core/react/components/MarkdownEditor/MarkdownHeaderView.tsx`, `BannerView.tsx`,
`src/css/Panels/FileContext.css`, `src/adapters/obsidian/inlineContextLoader.tsx`), MIT
licensed, Copyright (c) 2022 JP Cen. make.md is React-based; Notioneer reimplements the same
structure in plain DOM, without spaces, stickers, banner repositioning, or the `--mk-ui-*`
variable layer.
