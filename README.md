# Notioneer

Notion-style editing conveniences for Obsidian, inspired by [make.md](https://github.com/Make-md/makemd)
but deliberately narrower: the note header, slash commands and the selection toolbar — nothing else.

## Features

- **Note header** — cover image, editable title and property rows at the top of a note, laid
  out like make.md's. The cover is a plain `cover` frontmatter key, the title renames the file
  (links follow), and the property rows read and write ordinary frontmatter.
- **Slash commands** — typing `/` in the editor opens a menu of basic block commands
  (heading, table, list, callout, code block, …). Every command inserts **plain Markdown**,
  never a plugin-specific format — a table command produces a real Markdown table.
- **Selection toolbar** — selecting text pops up a small toolbar for inline formatting
  (bold, italic, strikethrough, inline code, link).

Explicitly **not** included: spaces, custom file formats, or any make.md-specific block syntax.

## Install

Copy `main.js`, `manifest.json` and `styles.css` into
`YOUR_VAULT/.obsidian/plugins/notioneer/`, then enable **Notioneer** under
Settings → Community plugins.

## Status

As of 0.7.0 Notioneer is a **fork of [make.md](https://github.com/Make-md/makemd)** being
trimmed down to the three features above. Right now the upstream code is all still there with
spaces, the navigator and the space views switched off by default; removing them is the work
in progress. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#fork-status).

The Markdown-native slash commands and the selection toolbar are parked in `legacy/` while
that happens — until they are wired back in, the ones you get are make.md's.

## Credits

Fork of [make.md](https://github.com/Make-md/makemd), MIT licensed, Copyright (c) 2022 JP Cen
— licence kept in `LICENSE-makemd`. Notioneer itself is GPLv3.

## Development

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for build setup, and
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the plugin is structured.
