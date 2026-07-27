# Changelog

Living log of significant changes to the project. This is **not** optional bookkeeping — every significant change (new feature, format change, dependency change, removed feature, policy change) gets an entry here at the time it's made. See the documentation policy in [.claude/CLAUDE.md](../.claude/CLAUDE.md).

Format: `YYYY-MM-DD — short description. Why (if not obvious). Files touched.`

## 2026-07-27 (0.2.0)

- **Slash commands.** Typing `/` at the start of a line (or after whitespace) opens a menu of
  block commands that insert plain Markdown — a real Markdown table, not a plugin block, which
  is the whole reason this plugin exists rather than using make.md. Added a `Slash commands`
  setting to turn it off. Files: `src/slash/commands.ts`, `src/slash/suggest.ts`, `src/main.ts`,
  `src/styles/index.css`, `README.md`, `docs/ARCHITECTURE.md`, `docs/FAQ.md`, `package.json`,
  `manifest.json`, `versions.json`.

## 2026-07-27 (0.1.0)

- **Initial scaffold** from the Obsidian plugin bootstrap template. Files: all.
