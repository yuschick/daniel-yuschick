# Brain

The context layer of this repo: who Daniel is, how he communicates, what he has already made, and how his code is written. Agents read it; it is rarely edited by hand once settled. What Daniel _makes_ (articles, talks, ideas, code) lives elsewhere: [`content/`](../content/AGENTS.md), `apps/` and `packages/`.

> **This repo is public, and so is everything in the brain.** Only add facts Daniel has published himself, and name the source. Private context belongs in the gitignored `content/private/` or in user-level settings (`~/.claude/`), never here.

## Layers

| Layer | Folder                    | Holds                                         | Loads                                                                    |
| :---- | :------------------------ | :-------------------------------------------- | :----------------------------------------------------------------------- |
| 0     | [`self/`](self)           | Identity and bios, voice (spoken and written) | Imported by [`content/CLAUDE.md`](../content/CLAUDE.md) for writing work |
| 1     | [`writing/`](writing)     | Published articles catalog                    | Linked from `content/AGENTS.md`; read on demand                          |
| 1     | [`speaking/`](speaking)   | Talk catalog, grouped by talk                 | Linked from `content/AGENTS.md`; read on demand                          |
| 1     | [`standards/`](standards) | Coding standards with permanent rule IDs      | Path-scoped, through the symlinks in `.claude/rules/`                    |

Layer 0 is the basement: it describes Daniel and applies to everything he writes. Layer 1 builds on it for one kind of work. Coding sessions never load the personal layer, and writing sessions load only the small, always-on [`standards/general.md`](standards/general.md), never the CSS, TypeScript, React, props or accessibility rules.

## Precedence

1. The more specific layer wins: a publication's house style beats the general written voice, and a standards rule beats a general preference.
2. `A11Y-*` rules win over any conflicting rule (see [standards/README.md](standards/README.md)).
3. Daniel's own words win over paraphrase: quote bios and samples as written rather than rewriting them.

## Keeping it current

- **When a talk or article ships,** add it to [`speaking/talks.md`](speaking/talks.md) or [`writing/articles.md`](writing/articles.md).
- **Voice is extracted, not described.** Update [`self/voice.md`](self/voice.md) from new transcripts or published pieces, with quotes, rather than from adjectives.
- **Facts carry a source.** If a fact can't be traced to something Daniel published, it doesn't go in.
- **New domain, new folder:** add a layer-1 folder, a row in the table above, and a way for it to load.

## Upstream

The brain as a personal "basement layer", and the conventions around it, are adapted from [Brad Frost](https://bradfrost.com)'s work on AI and design systems, particularly [ai-design-systems-resources](https://github.com/Brad-Frost-Web/ai-design-systems-resources):

- `AGENTS.md` as the source of truth for every tool, with `CLAUDE.md` as a thin pointer that leads with non-negotiables
- A brief approved before drafting begins (his "spec before build")
- Exploration without gates (his design branches, here `content/ideas/`)
- Sessions end definitively: land it or park it
- Credit absorbed methods to their upstream source

These are adapted, not copied: this repo is connected to the upstream ideas but doesn't depend on Brad Frost Web's tooling.
