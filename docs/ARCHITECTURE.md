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

A port of make.md's `MarkdownHeaderView` (MIT — see [Credits](#credits)), not an imitation of
it: `src/styles/header.css` is their CSS copied verbatim, and `src/header/noteHeader.ts`
builds their DOM, with their class names, so the copied rules apply as written.

```
.mk-inline-context                 prepended to .cm-sizer
  .mk-path-context-component
    .mk-path-context-label
      .mk-space-banner > img       absolute — escapes the reading width
      .mk-space-banner-buttons     add / change / remove cover
      .mk-spacer                   reserves the banner's height in the flow
      .mk-inline-title.inline-title
    .mk-path-context-properties
      .mk-path-context-row*        one per frontmatter key
      .mk-path-context-row-new
```

The mount point is make.md's too (`inlineContextLoader.tsx`). `.cm-sizer` already carries the
reading width, so the title and property rows line up with the note body without any width
rules of their own — and the banner has to be `position: absolute` to escape it, with
`.mk-spacer` reserving the height it gives up. Getting this wrong is what made an earlier
version look nothing like make.md: it constrained the header to `--file-line-width` a second
time and let the banner sit in the flow.

Colours come from `--mk-ui-*`, which make.md defines in `DefaultVibe.css` as aliases of
Obsidian's theme variables (`--mk-ui-text-tertiary` -> `--text-faint`, and so on). That alias
block is copied too, scoped to `.mk-inline-context`, so the header follows the active theme.
The title reuses Obsidian's own `inline-title` class for the same reason.

Two rules are ours, marked `Notioneer:` in the CSS. CodeMirror disables pointer events on
what is injected into `.cm-sizer`, so buttons and inputs need `pointer-events: all` — make.md
has the equivalent rule for its reading-mode header, and without it the cover buttons are
dead. And `.metadata-container` is hidden inside the editor, since the property rows replace
it there; reading view gets no header and keeps the native panel.

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
- A second esbuild step bundles `src/styles/index.css` into the root `styles.css` — the file Obsidian actually loads. `index.css` `@import`s the per-feature partials (`header.css`); esbuild inlines them. The root `styles.css` is generated; edit the sources under `src/styles/` instead.
- `manifest.json` + `versions.json` follow the standard Obsidian plugin conventions (`minAppVersion` compatibility map).

See [DEVELOPMENT.md](DEVELOPMENT.md) for how to actually run the build.

## Credits

The note header is ported from [make.md](https://github.com/Make-md/makemd), MIT licensed,
Copyright (c) 2022 JP Cen:

| make.md | Notioneer |
|---|---|
| `src/css/Panels/FileContext.css`, `src/css/Editor/Flow/FlowEditor.css`, `src/css/DefaultVibe.css` | `src/styles/header.css` — rules copied verbatim, additions marked `Notioneer:` |
| `src/core/react/components/MarkdownEditor/MarkdownHeaderView.tsx`, `BannerView.tsx`, `SpaceView/TitleComponent.tsx`, `SpaceEditor/HeaderPropertiesView.tsx` | `src/header/noteHeader.ts` — same DOM and class names, plain DOM instead of React |
| `src/adapters/obsidian/inlineContextLoader.tsx` | the `.cm-sizer` mount in `NoteHeader.render` |

Not ported: spaces, stickers, banner repositioning (`banner_y`), inline backlinks, the
property type system, and the React/`Superstate` core those depend on. Forking make.md
wholesale was considered and rejected — 605 source files, ~128k lines and 55 runtime
dependencies, with the header components resting on the spaces core (40–65 `superstate` /
`spaceManager` / `pathState` references each) that this plugin exists to leave out.
