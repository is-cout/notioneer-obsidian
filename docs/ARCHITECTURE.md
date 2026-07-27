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
| `src/header/noteHeader.ts` | The per-view note header: cover image, editable title, cover add/remove actions. |
| `src/header/coverPicker.ts` | Fuzzy modal listing the vault's image files, used to pick a cover. |
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

The header element is prepended to each Markdown editor's `.cm-sizer`, so it scrolls with
the note and inherits the reading width. Obsidian's native properties panel already sits in
that same container just below — which is why Notioneer renders cover + title only and does
**not** reimplement a properties editor. Reading view has no `.cm-sizer` and is left alone.

State lives entirely in the note: the cover is a `cover` frontmatter key (an external URL,
or a vault path resolved through `metadataCache.getFirstLinkpathDest` +
`vault.getResourcePath`), and the title is the filename, renamed through
`fileManager.renameFile` so links update.

Rendering is a full repaint of the header on `layout-change` / `file-open` /
`active-leaf-change` / `metadataCache.changed`. Repainting is skipped while focus is inside
the header, otherwise editing the title would be interrupted by its own rename event.

## Build pipeline

- TypeScript (`tsconfig.json`) type-checks `src/**/*.ts` (`tsc -noEmit`) — no `.js` is emitted by `tsc` itself.
- [esbuild](https://esbuild.github.io/) (`esbuild.config.mjs`) bundles `src/main.ts` into a single CommonJS `main.js`, externalizing `obsidian`, `electron`, CodeMirror/Lezer packages (provided by the Obsidian host at runtime) and Node builtins.
- A second esbuild step bundles `src/styles/index.css` into the root `styles.css` — the file Obsidian actually loads. The root `styles.css` is generated; edit the source under `src/styles/` instead.
- `manifest.json` + `versions.json` follow the standard Obsidian plugin conventions (`minAppVersion` compatibility map).

See [DEVELOPMENT.md](DEVELOPMENT.md) for how to actually run the build.
