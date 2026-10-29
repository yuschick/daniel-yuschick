# Content

Daniel's writing and speaking work: articles, talks and ideas. This file is the source of truth for any agent working here; [`CLAUDE.md`](CLAUDE.md) points to it.

## Non-negotiables

1. **Daniel's voice.** Write as described in [brain/self/voice.md](../brain/self/voice.md). Use the written voice for articles and the spoken voice for talks. Quote his bio as written in [brain/self/identity.md](../brain/self/identity.md).
2. **Nothing invented.** Never fabricate quotes, events, statistics, credentials, results or sources. Facts about Daniel come from the brain; claims about the world need a source in the piece's `research.md`. Credit people and ideas by name.
3. **Public by default.** This repo is public. Anything embargoed, unannounced or meant for an unpublished submission goes in `private/` (gitignored). When starting a piece, ask which it is.

## Structure

```
content/
  articles/<slug>/     BRIEF.md, outline.md, research.md, draft.md
  talks/<slug>/        BRIEF.md, abstract.md, outline.md, script.md
  ideas/               one file per idea; no structure required
  private/             gitignored; same structure for embargoed work
  templates/           starting files, e.g. brief.md
```

Use a short kebab-case `<slug>` that names the topic, not the venue: `live-regions`, not `ndc-oslo-2026`.

## Modes

- **Ideas** (`ideas/`): free brainstorming. No brief, no gates, no polish. An idea graduates to a piece when Daniel says so.
- **Piece** (`articles/`, `talks/`): the full workflow below.

## Workflow for a piece

1. **Brief.** Copy [`templates/brief.md`](templates/brief.md) to `BRIEF.md` with `status: draft`. Fill in audience, venue, core argument and what makes it Daniel's. Check [brain/writing/articles.md](../brain/writing/articles.md) and [brain/speaking/talks.md](../brain/speaking/talks.md) so it doesn't repeat past work, and link related pieces.
2. **Gate.** Stop and ask Daniel to approve the brief. Don't outline or draft until `status: approved`.
3. **Outline**, then **draft**. Keep research and sources in `research.md`.
4. **Review** against voice.md and the venue's house style, then update `status`.
5. **When it ships,** set `status: published` and add it to the brain catalog.

## Ending a session

Land it or park it. Either the work reaches a clear checkpoint and is committed, or the brief's `## Status` section records where it stopped and the next step, with `status: parked`. Never leave a piece in an unrecorded state.

## When in doubt

Ask. Venue, audience, embargo, angle and anything about Daniel that isn't in the brain are his calls.
