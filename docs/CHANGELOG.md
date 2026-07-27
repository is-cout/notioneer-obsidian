# Changelog

Living log of significant changes to the project. This is **not** optional bookkeeping — every significant change (new feature, format change, dependency change, removed feature, policy change) gets an entry here at the time it's made. See the documentation policy in [.claude/CLAUDE.md](../.claude/CLAUDE.md).

Format: `YYYY-MM-DD — short description. Why (if not obvious). Files touched.`

## 2026-07-27 (0.5.0)

- **Note header rebuilt to match make.md.** The 0.4.0 header was an approximation written
  without reading make.md; this one ports its actual layout and CSS (`MarkdownHeaderView.tsx`,
  `BannerView.tsx`, `FileContext.css` — MIT, credited in `docs/ARCHITECTURE.md`): full-width
  banner, title overlapping its bottom edge, property rows below. Property rows are now part
  of the header (add, edit, right-click to delete) and Obsidian's native properties panel is
  hidden in the editor so nothing renders twice. Colours use Obsidian's theme variables and
  the title reuses the native `inline-title` class, so themes apply automatically.
  Fixes the cover never appearing: it is an `<img>` now, not a CSS `background-image` whose
  `url()` broke on resource paths. Files: `src/header/noteHeader.ts`,
  `src/header/newPropertyModal.ts` (new), `src/styles/index.css`, `README.md`,
  `docs/ARCHITECTURE.md`, `docs/FAQ.md`, `package.json`, `manifest.json`, `versions.json`.

## 2026-07-27 (0.4.0)

- **Note header.** Cover image and editable title at the top of every Markdown editor. The
  cover is a plain `cover` frontmatter key (vault path or external URL); the title renames the
  file through `fileManager.renameFile` so links follow. Properties are deliberately left to
  Obsidian's native panel, which renders in the same container just below. Added a
  `Note header` setting. Files: `src/header/noteHeader.ts`, `src/header/coverPicker.ts`,
  `src/main.ts`, `src/styles/index.css`, `docs/ARCHITECTURE.md`, `docs/FAQ.md`, `README.md`,
  `package.json`, `manifest.json`, `versions.json`.

## 2026-07-27 (0.3.0)

- **Selection toolbar.** Selecting text in the editor pops up a floating toolbar for bold,
  italic, strikethrough, highlight, inline code and link. Toggling removes existing markers
  instead of stacking them. Built on the browser selection + Obsidian's `Editor` API so no
  CodeMirror dependency is needed. Added a `Selection toolbar` setting. Files:
  `src/toolbar/format.ts`, `src/toolbar/selectionToolbar.ts`, `src/editorUtils.ts` (new shared
  position helper, also used by the slash suggester), `src/main.ts`, `src/styles/index.css`,
  `docs/ARCHITECTURE.md`, `docs/FAQ.md`, `package.json`, `manifest.json`, `versions.json`.

## 2026-07-27 (0.2.0)

- **Slash commands.** Typing `/` at the start of a line (or after whitespace) opens a menu of
  block commands that insert plain Markdown — a real Markdown table, not a plugin block, which
  is the whole reason this plugin exists rather than using make.md. Added a `Slash commands`
  setting to turn it off. Files: `src/slash/commands.ts`, `src/slash/suggest.ts`, `src/main.ts`,
  `src/styles/index.css`, `README.md`, `docs/ARCHITECTURE.md`, `docs/FAQ.md`, `package.json`,
  `manifest.json`, `versions.json`.

## 2026-07-27 (0.1.0)

- **Initial scaffold** from the Obsidian plugin bootstrap template. Files: all.
