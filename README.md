# Notioneer

Notion-style editing conveniences for Obsidian, inspired by [make.md](https://github.com/Make-md/makemd)
but deliberately narrower: the note header, slash commands and the selection toolbar — nothing else.

## Features

- **Note header** — an inline header at the top of a note showing its title, an optional
  cover image, and its frontmatter properties, editable in place.
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

## Development

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for build setup, and
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the plugin is structured.
