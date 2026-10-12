# Contributing to Notioneer

Thanks for helping out. Notioneer is a trimmed-down fork of
[make.md](https://github.com/Make-md/makemd) that keeps three features: the note header, the
Markdown slash commands and the selection toolbar. Contributions that stay inside that scope
are welcome; anything that brings back spaces or make.md-specific file formats is not.

## Reporting a bug

Open an [issue](https://github.com/is-cout/notioneer-obsidian/issues) with:

- your Obsidian version and platform (desktop/mobile, OS),
- the Notioneer version (Settings → Community plugins),
- steps to reproduce, what you expected, and what happened,
- any errors from the developer console (Ctrl+Shift+I / Cmd+Opt+I).

## Making a change

1. Read [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) to build and load the plugin, and
   [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before touching anything under `src/core/` or
   `src/adapters/` — most of it is make.md code the header still depends on.
2. Branch off `develop` (`fix/<name>` or `feature/<name>`). `main` only receives releases.
3. Keep the change small and focused. Match the surrounding code style.
4. `npm run build` must finish with no type errors, and the affected feature must be checked
   in a real vault.
5. Update the docs the change affects and add a dated entry to
   [docs/CHANGELOG.md](docs/CHANGELOG.md).
6. Use [Conventional Commits](https://www.conventionalcommits.org/) for messages
   (`fix: …`, `feat: …`, `docs: …`, `chore: …`).
7. Open a pull request against `develop`.

## Dependencies

Every version in `package.json` is pinned exactly. Do not add, remove or bump a dependency
without discussing it in an issue first — see [docs/DEPENDENCIES.md](docs/DEPENDENCIES.md).

## License

Notioneer is GPL-3.0; make.md's original code is MIT (see `LICENSE-makemd`). By contributing
you agree your changes are released under GPL-3.0.
