# FAQ — customizing the project

Practical "where do I go to change X" answers. For the how-things-fit-together view, see [ARCHITECTURE.md](ARCHITECTURE.md).

<!-- init-plugin / whoever adds settings or features: add a "How do I change X" entry
     per user-facing setting or customization point. Keep entries short and point at
     the exact file/symbol, not a general explanation. -->

### How do I add or edit a slash command?

Add an entry to `SLASH_COMMANDS` in [src/slash/commands.ts](../src/slash/commands.ts). The
`snippet` field is literal Markdown; put `${cursor}` where the caret should land. Nothing
else needs registering.

### How do I turn the slash menu off?

Settings → Community plugins → Notioneer → **Slash commands**.

### How do I add a button to the selection toolbar?

Add an entry to `INLINE_FORMATS` in [src/toolbar/format.ts](../src/toolbar/format.ts) — `icon`
is an Obsidian icon name, `marker` the Markdown wrapper. Buttons that aren't a simple wrapper
(like the link button) are wired individually in `SelectionToolbar.buildElement`.

### How do I turn the selection toolbar off?

Settings → Community plugins → Notioneer → **Selection toolbar**.

### Can I bump a dependency version?

Only with explicit approval — versions are pinned on purpose. See [DEPENDENCIES.md](DEPENDENCIES.md).

### How do I build without npm?

`node build-local.mjs` (Node 22+, no installed dependencies, no bundler). See [DEVELOPMENT.md](DEVELOPMENT.md).
