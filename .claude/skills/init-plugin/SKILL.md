---
name: init-plugin
description: Turn this bootstrap template into a real, named Obsidian plugin project — fills in the plugin's identity across manifest.json/package.json/versions.json/README/docs, drafts the initial feature description, initializes Git Flow branches, and verifies the build. Use this the first time this project is opened, whenever the user gives a plugin name and a description of what it should do (e.g. "run init-plugin, it's called Focus Timer, it shows a pomodoro timer in the status bar"), or asks to "initialize", "set up", "bootstrap", or "start" the plugin. Do not use it on a project that already has real feature code in src/ — it's a one-time scaffold step, not a general project-editing tool.
---

# Init Plugin

This project was unpacked from a generic Obsidian-plugin bootstrap template (the tooling,
docs skeleton, and `.claude/` instructions are copied from a working plugin — see
[.claude/CLAUDE.md](../../CLAUDE.md) for the engineering rules that apply from here on).
Every shipping file still has literal `{{PLACEHOLDER}}` tokens in it instead of a real
name. This skill's only job is to replace those tokens and get the project to a state
where `npm run build` succeeds — it does **not** write the plugin's actual feature logic.
That's deliberate: this skill runs once, before any real code exists, so there's nothing
to guide feature-level decisions yet. Once the identity is set, implement the described
functionality as a normal follow-up task, guided by the Engineering Rules in
[.claude/CLAUDE.md](../../CLAUDE.md) (Simplicity First especially — don't let scaffolding
momentum turn into over-building `src/main.ts` in this same step).

## Inputs

You need, at minimum, a **plugin name** and a **one-line description of what it does**
(the user will usually give both in the same request that invokes this skill). If either
is missing, ask before proceeding — don't guess at what the plugin is for.

Everything else can be derived or defaulted, but confirm the defaults with the user rather
than silently committing to them:

- **Plugin id**: kebab-case slug of the name (`Focus Timer` -> `focus-timer`). Must match
  `[a-z0-9-]+` — Obsidian requires this for the plugin folder name.
- **Plugin class name**: PascalCase of the name + `Plugin` suffix (`Focus Timer` ->
  `FocusTimerPlugin`).
- **Author**: ask if not given — don't invent one.
- **Min app version**: the template defaults to `1.4.0` (a recent-enough Obsidian API
  baseline as of when this template was made). Ask if the plugin needs a newer API, or
  just confirm the default is fine — don't assume this is still current without checking,
  API needs change per plugin.
- **Scaffold date**: today's date, `YYYY-MM-DD`.

## Steps

1. **Substitute every placeholder.** Search the whole project for `{{` — every match is a
   token that needs a real value:
   - `{{PLUGIN_NAME}}` — the human-readable name, as given.
   - `{{PLUGIN_ID}}` — the kebab-case slug.
   - `{{PLUGIN_CLASS_NAME}}` — the PascalCase class name (appears in `src/main.ts` and the
     `module.exports` footer that `build-local.mjs` writes).
   - `{{PLUGIN_DESCRIPTION}}` — a one-line description (fits `manifest.json`'s
     `description` field — keep it short, no trailing period, and don't mention
     "Obsidian" in it, the Obsidian plugin directory rejects that as redundant).
   - `{{AUTHOR}}` — the author name.
   - `{{MIN_APP_VERSION}}` — confirmed minAppVersion.
   - `{{SCAFFOLD_DATE}}` — today's date.

   These appear in (at least): `manifest.json`, `package.json`, `versions.json`,
   `README.md`, `docs/ARCHITECTURE.md`, `docs/CHANGELOG.md`, `docs/DEPENDENCIES.md`,
   `docs/DEVELOPMENT.md`, `src/main.ts`, `build-local.mjs`. After substituting, grep the
   whole project for `{{` again — it must come back empty. If anything remains, you missed
   a file or a token; don't consider this step done until it's clean (Fail Loud).

2. **Flesh out the two spots that need actual writing, not substitution:**
   - `README.md`'s `## Features` section — turn the one-line functionality description
     into a short bullet list of what the plugin will do, matching the style of a normal
     plugin README. Keep it proportional to an actual v0.1.0 scope, not aspirational.
   - `docs/ARCHITECTURE.md`'s `## Overview` section — one paragraph on what the plugin
     does and any explicit scope decisions worth stating up front (e.g. desktop-only,
     no network calls, no custom file format). Don't invent scope decisions the user
     hasn't stated; leave it to what's actually known at scaffold time.

3. **Initialize Git Flow.** This project's [git.instructions.md](../../instructions/git.instructions.md)
   expects a `main` + `develop` branch model from the start:
   ```
   git init
   git add -A
   git commit -m "chore: scaffold plugin from bootstrap template"
   git branch develop
   ```
   Don't push anywhere or create a remote — that's the user's call, not this skill's.

4. **Verify the build.** Run `npm install` if network access is available, then
   `npm run build`. If npm/network isn't available, fall back to `node build-local.mjs`
   (it won't produce `styles.css`, which is expected — see
   [docs/DEVELOPMENT.md](../../../docs/DEVELOPMENT.md)). Report whichever path you used
   and whether it actually succeeded — don't report "done" if the build errored out
   (Fail Loud, per [.claude/CLAUDE.md](../../CLAUDE.md)).

5. **Report a short checklist** of what's left for a human: confirm the license (this
   template ships GPLv3, unchanged from the source project — swap `LICENSE` if the user
   wants something else), set up a git remote if they want one, and actually implement
   the described functionality in `src/main.ts` (call out explicitly that this skill did
   not do that part).

## Notes

- This is a one-time step. Re-running it after real feature code has been written will
  re-grep for `{{` tokens that no longer exist and won't do anything useful — don't invoke
  it again just to "reconfigure" an already-initialized project.
- If the user gives you enough detail about the functionality that a trivial first
  implementation is genuinely obvious (e.g. "a command that inserts today's date"), it's
  fine to write that much in `src/main.ts` — but stop there. Anything past a few lines is
  a separate task, not part of scaffolding.
