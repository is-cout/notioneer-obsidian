# Dependency policy

## Rule

All dependency versions in `package.json` are **pinned exactly** (no `^`, no `~`, no ranges). Nobody — human or Claude — installs `@latest`, runs `npm update`, or bumps a version without the project owner explicitly approving it first. This is a hard rule, also codified in [.claude/CLAUDE.md](../.claude/CLAUDE.md).

**Why:** an Obsidian plugin runs inside every user's vault with filesystem access. An unreviewed transitive update (or a compromised package version) is a real supply-chain risk, and silent version drift makes bugs hard to reproduce. Pinning trades a little convenience for reproducibility and an explicit approval step on every change.

**How to apply:** when a new dependency is needed, or an existing one needs a bump (security fix, feature, bug fix), propose the exact version and the reason, and wait for approval before editing `package.json`.

## Current pins (as of 2026-07-27)

Since 0.7.0 this project is a fork of [make.md](https://github.com/Make-md/makemd) and
inherits its dependency tree: **55 runtime dependencies, 42 dev dependencies, 939 packages
installed**. Upstream ships 94 of its 97 versions as `^`/`~` ranges; every one was resolved to
the exact version that was installed and written back to `package.json`, so this repo still
holds zero ranges. `package-lock.json` pins the transitive tree.

The full list lives in `package.json` — reproducing ~100 rows here would rot immediately. The
ones that carry weight:

| Package | Pinned version | Why it is here |
|---|---|---|
| `react`, `react-dom` | `18.2.0` | make.md's entire UI, including the note header. |
| `sql.js` | `1.8.0` | Backs the cache persister the Superstate index writes to. Replacing it with a JSON persister is the biggest remaining size win. |
| `@tanstack/react-table`, `@tanstack/react-virtual` | `8.14.0`, `3.2.0` | Table views — removed in 0.8.0, still listed. Droppable in stage 4. |
| `@dnd-kit/*` | `6.1.0` / `6.0.1` / `7.0.2` | Still imported by the property rows the header renders. |
| `mathjs`, `numfmt`, `rrule`, `date-fns` | see `package.json` | Formula properties and date handling. |
| `lodash` | `4.18.1` | Bumped off `4.17.21` to clear a high-severity advisory (approved 2026-07-27). |
| `esbuild` | `0.14.54` | Downgraded from our `0.28.1` by the fork; upstream’s config uses the old `watch:` API. |
| `typescript` | `5.9.3` | Upstream’s pin, up from our `5.4.2`. |

Trimming this list back down is the point of the fork's later stages — every subsystem that
gets removed should take its dependencies with it, and this table should shrink with it.

## Resolved advisory: lodash (high)

`lodash@4.17.21`, inherited from upstream, carried a high-severity advisory (prototype
pollution in `_.unset`/`_.omit`, code injection via `_.template`:
[GHSA-r5fr-rjxr-66jc](https://github.com/advisories/GHSA-r5fr-rjxr-66jc),
[GHSA-f23m-r3pf-42rh](https://github.com/advisories/GHSA-f23m-r3pf-42rh),
[GHSA-xxjr-mmjv-4gpg](https://github.com/advisories/GHSA-xxjr-mmjv-4gpg)).

Bumped to `4.18.1` on 2026-07-27 with the owner's approval; `npm audit --omit=dev` reports no
vulnerabilities. This is a deliberate divergence from upstream, which still states the older
range — worth re-checking when merging from make.md.

## Known advisory: esbuild dev server (GHSA-67mh-4wv8-2f99)

`esbuild` versions before 0.25.0 have a moderate-severity advisory ([GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)): esbuild's local **dev server** (`esbuild serve`) doesn't validate the `Origin` header, so any website open in your browser could send requests to it and read responses.

The fork pins `0.14.54` (upstream’s), which is **below** 0.25.0, so unlike before, the advisory
now applies on paper. It is not exercised here: `esbuild.config.mjs` calls `esbuild.build()`
only, never `esbuild.serve()`, so the dev server never starts. Worth revisiting when the
fork's build config is modernised.

## Lockfile

Run `npm install` once with network access and commit the resulting `package-lock.json` — that's what actually pins transitive dependencies.
