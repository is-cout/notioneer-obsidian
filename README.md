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

## Credits

The note header is ported from [make.md](https://github.com/Make-md/makemd) (MIT, Copyright
(c) 2022 JP Cen) — same layout and CSS, reimplemented in plain DOM without spaces or the rest
of its feature set. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#credits).

## Development

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for build setup, and
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the plugin is structured.
