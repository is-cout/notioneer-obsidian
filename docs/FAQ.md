# FAQ — customizing the project

Practical "where do I go to change X" answers. For the how-things-fit-together view, see [ARCHITECTURE.md](ARCHITECTURE.md).

<!-- init-plugin / whoever adds settings or features: add a "How do I change X" entry
     per user-facing setting or customization point. Keep entries short and point at
     the exact file/symbol, not a general explanation. -->

### How do I add or edit a slash command?

Add an entry to `SLASH_COMMANDS` in [src/notioneer-slash/commands.ts](../src/notioneer-slash/commands.ts). The
`snippet` field is literal Markdown; put `${cursor}` where the caret should land. Nothing
else needs registering.

### How do I turn the slash menu off?

Settings → Notioneer → **Slash commands**.

### How do I add a button to the selection toolbar?

Add an entry to `INLINE_FORMATS` in [src/notioneer-toolbar/format.ts](../src/notioneer-toolbar/format.ts) — `icon`
is an Obsidian icon name, `marker` the Markdown wrapper. Buttons that aren't a simple wrapper
(like the link button) are wired individually in `SelectionToolbar.buildElement`.

### How do I turn the selection toolbar off?

Settings → Notioneer → **Selection toolbar**.

### How do I set a cover image?

Hover the header and click **Add Cover**, then pick an image. It is stored under the `banner`
frontmatter key (make.md’s; rename it in Settings → Notioneer → **Cover**), so you can type it
by hand too.

### What is the folder chip under the title?

The note’s folder; clicking it reveals the folder in the file explorer. It sits where make.md
showed the spaces a note belonged to. Source: `FolderCrumb` in [src/ui/header/HeaderProperties.tsx](../src/ui/header/HeaderProperties.tsx).

### How do I edit properties in the header?

Click a value to edit, **New Property** to add one — make.md’s property editor, ported as is
([src/ui/properties/](../src/ui/properties/)).
Obsidian’s native panel is hidden in the editor so the two do not stack; reading view keeps it.

### How do I change the cover height?

Settings → Notioneer → **Cover height**. It is make.md’s `bannerHeight` setting.

### Why do the header classes start with `mk-`?

The header is ported from make.md and keeps its DOM and class names, so make.md’s stylesheets
(and any snippet written for make.md’s header) style it exactly as before. See
[ARCHITECTURE.md](ARCHITECTURE.md#history-from-fork-to-port).

### I see two titles — how do I keep just one?

Notioneer hides Obsidian's native inline title in any editor that shows the header, so by
default you only get the header's title. If a theme or snippet still brings the native one
back, turning off Settings → Editor → **Show inline title** also works: since 1.0.1 that
setting no longer hides the header's title.

### I have a snippet hiding the native properties panel — do I still need it?

No, and it will hurt: Notioneer already hides `.metadata-container` inside the editor. A
snippet that also hides it in *reading* view leaves you with no properties there at all.

### There is a `.makemd` folder in my vault — can I delete it?

Versions before 1.0.3 kept their index cache there (`superstate.mdc`, `fileCache.mdc`, and
`thumbnails/` if make.md's thumbnail settings were on). Since 2.0.0 Notioneer keeps no index at
all, so you can delete the folder — **unless make.md itself is also installed**, which uses
the same folder. 2.0.0 removes the JSON caches 1.0.3 left in its own plugin folder by itself.

### Can I bump a dependency version?

Only with explicit approval — versions are pinned on purpose. See [DEPENDENCIES.md](DEPENDENCIES.md).

### How do I build without npm?

`node build-local.mjs` (Node 22+, no installed dependencies, no bundler). See [DEVELOPMENT.md](DEVELOPMENT.md).
