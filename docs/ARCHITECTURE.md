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

<!-- Add a row per new src/*.ts file as the project grows past a single file — this
     table is the map a new contributor (or future Claude session) reads first. -->

## Build pipeline

- TypeScript (`tsconfig.json`) type-checks `src/**/*.ts` (`tsc -noEmit`) — no `.js` is emitted by `tsc` itself.
- [esbuild](https://esbuild.github.io/) (`esbuild.config.mjs`) bundles `src/main.ts` into a single CommonJS `main.js`, externalizing `obsidian`, `electron`, CodeMirror/Lezer packages (provided by the Obsidian host at runtime) and Node builtins.
- A second esbuild step bundles `src/styles/index.css` into the root `styles.css` — the file Obsidian actually loads. The root `styles.css` is generated; edit the source under `src/styles/` instead.
- `manifest.json` + `versions.json` follow the standard Obsidian plugin conventions (`minAppVersion` compatibility map).

See [DEVELOPMENT.md](DEVELOPMENT.md) for how to actually run the build.
