# Dependency policy

## Rule

All dependency versions in `package.json` are **pinned exactly** (no `^`, no `~`, no ranges). Nobody — human or Claude — installs `@latest`, runs `npm update`, or bumps a version without the project owner explicitly approving it first. This is a hard rule, also codified in [.claude/CLAUDE.md](../.claude/CLAUDE.md).

**Why:** an Obsidian plugin runs inside every user's vault with filesystem access. An unreviewed transitive update (or a compromised package version) is a real supply-chain risk, and silent version drift makes bugs hard to reproduce. Pinning trades a little convenience for reproducibility and an explicit approval step on every change.

**How to apply:** when a new dependency is needed, or an existing one needs a bump (security fix, feature, bug fix), propose the exact version and the reason, and wait for approval before editing `package.json`.

## Current pins (as of 2026-10-12, 2.0.0)

**8 runtime dependencies, 9 dev dependencies, 117 packages installed.** 2.0.0 replaced the
make.md fork with a port of its header (see [ARCHITECTURE.md](ARCHITECTURE.md#history-from-fork-to-port)),
which dropped 70 packages — every make.md dependency the ported header does not import —
with the owner's approval. No remaining version changed.

| Package | Pinned version | Why it is here |
|---|---|---|
| `react`, `react-dom` | `18.2.0` | The header's components are make.md's React components, ported. |
| `react-day-picker` | `8.10.0` | The date property's picker. |
| `vaul` | `0.9.1` | Menus and pickers become bottom drawers on phones. |
| `react-transition-group` | `4.4.5` | Fade-in of modals (the cover picker). |
| `fuse.js` | `7.0.0` | Search inside select menus. |
| `date-fns` | `2.30.0` | Date formatting and parsing, as make.md formatted them. |
| `classnames` | `2.5.1` | Class name joining in the ported components. |
| `obsidian` | `1.5.7` | API typings (dev). |
| `typescript`, `tslib` | `5.9.3`, `2.6.2` | Type-checking (dev). |
| `@types/react`, `@types/react-dom`, `@types/react-transition-group`, `@types/node` | see `package.json` | Typings (dev). |
| `esbuild` | `0.14.54` | Bundler; the config uses the old `watch:` API, so stay below 0.17 or update the config. |
| `esbuild-plugin-copy` | `1.6.0` | Copies `manifest.json` for the preview/demo builds. |

## Removed: build-only packages the community scanner bans (2026-10-12)

The Obsidian community scorecard flags these as "should be replaced with an alternative
package". All four were dev dependencies used only by `esbuild.config.mjs` (or not at all), so
they were removed with the owner's approval rather than replaced:

| Package | Replacement |
|---|---|
| `builtin-modules` | Node's own `builtinModules` from `node:module`. |
| `dotenv` | `process.loadEnvFile('.env')`, only when a `.env` exists (Node 20.12+). |
| `find-cache-dir` | A fixed cache directory for the worker bundler (itself removed in 2.0.0). |
| `eslint-plugin-react` | Nothing — no ESLint config in the repo used it. |

`lodash` was flagged the same way; it went with the rest of make.md's code in 2.0.0.

## Removed: WASM and its loaders (2026-10-12)

The scorecard disclosed three inline WASM blobs, a `.wasm` file and Node `fs` access. All
came from packages whose features Notioneer does not need, so their code was replaced and the
packages removed (approved):

| Package | Was used for | Now |
|---|---|---|
| `sql.js` (+ `@types/sql.js`) | make.md's SQLite index cache and `.mdb` space files | A JSON cache in 1.0.3; no index at all since 2.0.0 |
| `jszip` | Zipping that SQLite cache | Nothing — the JSON cache is not zipped |
| `pica` (+ `@types/pica`) | Image thumbnail resizing (off by default) | Canvas `drawImage` scaling |
| `esbuild-plugin-wat` | Bundling sql.js's `.wasm` | Nothing |

## Resolved advisory: lodash (high) — package removed in 2.0.0

`lodash@4.17.21`, inherited from upstream, carried a high-severity advisory (prototype
pollution in `_.unset`/`_.omit`, code injection via `_.template`:
[GHSA-r5fr-rjxr-66jc](https://github.com/advisories/GHSA-r5fr-rjxr-66jc),
[GHSA-f23m-r3pf-42rh](https://github.com/advisories/GHSA-f23m-r3pf-42rh),
[GHSA-xxjr-mmjv-4gpg](https://github.com/advisories/GHSA-xxjr-mmjv-4gpg)).

Bumped to `4.18.1` on 2026-07-27 with the owner's approval; the package is gone since 2.0.0.

## Known advisory: esbuild dev server (GHSA-67mh-4wv8-2f99)

`esbuild` versions before 0.25.0 have a moderate-severity advisory ([GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)): esbuild's local **dev server** (`esbuild serve`) doesn't validate the `Origin` header, so any website open in your browser could send requests to it and read responses.

The project pins `0.14.54` (make.md's), which is **below** 0.25.0, so the advisory applies
on paper. It is not exercised here: `esbuild.config.mjs` calls `esbuild.build()`
only, never `esbuild.serve()`, so the dev server never starts. Worth revisiting when the
fork's build config is modernised.

## Lockfile

Run `npm install` once with network access and commit the resulting `package-lock.json` — that's what actually pins transitive dependencies.
