# FAQ — customizing the project

Practical "where do I go to change X" answers. For the how-things-fit-together view, see [ARCHITECTURE.md](ARCHITECTURE.md).

<!-- init-plugin / whoever adds settings or features: add a "How do I change X" entry
     per user-facing setting or customization point. Keep entries short and point at
     the exact file/symbol, not a general explanation. -->

### Can I bump a dependency version?

Only with explicit approval — versions are pinned on purpose. See [DEPENDENCIES.md](DEPENDENCIES.md).

### How do I build without npm?

`node build-local.mjs` (Node 22+, no installed dependencies, no bundler). See [DEVELOPMENT.md](DEVELOPMENT.md).
