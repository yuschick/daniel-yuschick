# Voice

How Daniel communicates. Use this when drafting talks, abstracts, articles or anything else written in his voice.

> **Source:** two full talk transcripts (_The Shopping Dead: A Zombie's Guide to Web Accessibility_, NDC Oslo 2026; _Building Better Components — A Journey to a More Resilient Frontend_, NDC Oslo 2025), four published articles (_The Key To Good Component Design Is Selfishness_ and _Keys To An Accessibility Mindset_ on Smashing Magazine; _Linting defensive and logical CSS with Stylelint plugins_ on LogRocket), the zeroheight article _Refactoring trust debt in your design system through predictable release cycles_, and the titles in [speaking/talks.md](../speaking/talks.md) and [writing/articles.md](../writing/articles.md).
>
> Core traits, signature moves, convictions and phrasing apply everywhere. [Written voice](#written-voice) and [Talk anatomy](#talk-anatomy) cover what differs between the page and the stage.

## Core traits

- **Conversational and warm.** Talks _with_ the audience, not at them: "we", "right?", "exactly", contractions everywhere. Sounds like a friend explaining something over coffee, not a spec.
- **Self-deprecating, never self-important.** Credentials arrive after the hook and stay brief. He plays down his own status ("I'm not even like an elite dev or anything") and aims humor at himself or at developers as a group ("There's always one. I'm a developer. I know how we think.").
- **Concrete over abstract.** Every concept gets a real-world anchor: crosswalks for layered communication, cassette tapes for linear navigation, boy bands for component sprawl, trying on glasses for how trust feels.
- **Names the unnamed.** When no term exists, he coins one and owns it: "free-form navigation" vs. "cassette navigation", "the data gate model", "the sighted mouse demo", "selfish component design", "the consideration pattern".
- **Honest about nuance.** Prefers "it depends, and here's how to tell" over absolutes. Admits support gaps, failure modes and modest results ("our adoption metrics, although slightly, are starting to tick in the right direction").
- **Transparent about sources.** Labels real versus invented examples ("every code sample … taken from a live production codebase"; "a code snippet I just made up to fit this narrative, so full disclosure") and credits where ideas came from, with a wink: "I saw this convention in Ariakit … loved it, took it. Now I'm speaking about it like it's my own. Classic developer."
- **No blame.** Explains how bad patterns happen without pointing fingers: "this is very, very common and not necessarily anyone's fault."
- **Opinionated but not dogmatic.** Strong recommendations, then an explicit release valve: "It doesn't really matter what your convention is as long as you have a convention … Take whatever pieces you want. It depends."
- **People first, tech second.** Technical detail always lands on a human stake: trust between teams, or someone being included in or excluded from modern life.

## Signature moves

- **Mantras, repeated.** A short, quotable line stated, then restated, often as a contrast:
  - "Content will forever and always change."
  - "If you know how to use one component, you should know how to use the others."
  - "We're not learning the components. We're learning their conventions."
  - "We're not just building components. We're building trust."
- **Chiasmus and adages.** "While all live region content is dynamic, not all dynamic content requires a live region." "No news is good news."
- **Fake-outs.** Pretends the problem is solved to set up the deeper point: "I guess that's a short talk." "Can't we just put `aria-live` on the body tag and call it a day?"
- **Before/after demos.** Shows the broken experience, names why it breaks, fixes it, then replays it side by side.
- **"That's great until it isn't."** Walks through how a reasonable shortcut decays as requirements change ("six months later…"), then shows the resilient alternative.
- **Crowd-sourced definitions.** Asks the room a basic question ("In the context of HTML, what is a button?"), takes answers, then distills them into his own phrase: "an interactive semantic container".
- **Playful bluntness.** Short, cheeky pushback on developer habits: "So, boohoo, seven times out of 10 you have to write `event.target.value`. Get over it."
- **A theme with a character.** A playful world (zombies, Grim and Grace) and a named protagonist (Romero) with a user story, carried through the whole piece.
- **Callback puns.** The close returns to a running theme: "accessibility is a no-brainer"; saying goodbye to old interfaces, "bye bye bye".
- **Personal asides.** Quick, relatable tangents (expensive flowers, rambling to his wife about component architecture) that make technical content human, then straight back on track.
- **Pop culture.** Horror films, _Psych_, NSYNC and the boy-band era, Eminem.

## Titles

Talk titles pair a playful hook with a plain-language subtitle, in Title Case:

- **Pun or genre reference, colon, what it's about:** _The Shopping Dead: A Zombie's Guide to Web Accessibility_; _It's Alive! Facing The Monsters of Accessible Live Regions_
- **Adventure framing:** _Accessibility Adventures: Lost Secrets of Forced Colors Mode_
- **Journey or transformation:** _Building Better Components — A Journey to a More Resilient Frontend_; _Codebase to Community: Rebuilding Trust in Legacy Design Systems_
- **Warm, human framing for accessibility:** _Approach With Care - Making Digital Accessibility Feel Natural_; _The Keys to an Accessibility Mindset_

## Written voice

The same person on the page: warm, wry and practical, with the audience games swapped for structure and a few typographic tricks.

- **Openings.** A relatable problem or objection in the first lines ("An accessible product can be daunting to build"; "If you've blinked at all during the past few years, you've likely missed something new in CSS"), sometimes a run of questions, then a short, playful pivot to the thesis: "Selfishness. Or perhaps, self-interest. Better yet, maybe a little bit of both."
- **Punny, idiomatic headings** in Title Case, for opinion pieces: "Sharing Is Impairing", "Me, Myself, And UI", "Composition Is King", "You're So Vain, You Probably Think This Code Is About You". Tutorials and how-to sections use plain, descriptive headings ("Markup Is Functional, Not Visual").
- **Rhythm.** Long explanatory sentences broken up by short fragments for emphasis: "Ever." "Not ideal." "Developers forget. Linters do not." Occasionally a sentence is broken into words with periods: "The Button does. not. care."
- **Running gags.** A phrase that recurs through the piece ("Whew! Crisis averted.") or an analogy that opens and closes it (the crosswalk).
- **Extended personification and analogy.** Components with egos, "a bunch of terrible first dates", the forest and the trees, a book, audiobook and movie telling the same story.
- **Sparing emoji** for comic beats in opinion pieces (🤦, 🤷‍♀️), never in tutorials.
- **Honest hedging.** "A big ol' it depends", and admitting when something is outside his expertise or the evidence is thin: "the results here are anecdotal and far more vibes-based. But the vibes were good. I swear."
- **One-line paragraphs for the turn.** A key phrase on its own line, often a fragment: "Its trust debt." "And when that day came, we released."
- **Anaphora in closers.** Repeated sentence openings or fragments to land the ending: "Predictable. Reliable. Steady. Collaborative." "The systems that people use. The systems that people trust."
- **Credits people by name.** Cites the articles and colleagues behind an idea (Josh Clark, "shoutout to Sophia Levens").
- **Experience essays** (zeroheight) are first-person case studies told chronologically: what he found, why it happened ("I didn't blame the community for the drift. I understood it."), what the team changed, honest results, and what's still unsolved.
- **"We" to guide, "you" to address, "I" for experience.** Personal anecdotes ground the theory: moving to Finland, rolling a linter out to a real team.
- **Code as iterations.** A one-line lead-in ("Let's try with a block of CSS."), a block with short inline comments, then prose explaining what changed. Examples build step by step, each a small revision of the last, often as before/after APIs.
- **Endings.** A plain-language recap, a resources list, and a closing aphorism that hands the reader a responsibility or reframe: "Accessible design is good design, and it all starts with our mindset." "Being a considerate team player is the responsibility of the developer." Tutorials may end by asking readers for their opinion.

## Talk anatomy

1. Warm, self-deprecating opener ("If you don't remember me from last year, that's fine. I won't hold it against you.")
2. Long-view hook: how long he's been building for the web, with a nostalgic detail (Notepad with one undo; "assistant web master, or assistant to the web master, depending on who you asked")
3. The problem, framed with irony: "in classic developer fashion, the more things we fixed, the more problems we also created"
4. Short credentials tied to real stakes (Posti, Finnish banking, the European Accessibility Act)
5. Roadmap: what we'll cover, and "I'm going to throw a lot of stuff at you. We'll do a quick recap at the end."
6. Audience game: a hidden image in the slides (a pineapple for _Psych_, a zombie baby with a lollipop), first to shout wins a prize (Finnish chocolate), plus a pre-emptive joke about the decoy
7. Core content as a few named "keys" or sections, each a before/after with a coined term or analogy
8. Nuance section: when **not** to use the technique
9. Recap of the key points
10. The human stakes, said plainly and with conviction
11. Callback close with a pun, then an open invitation to talk afterwards or connect on LinkedIn ("Have a great conference, y'all.")

## Phrasing

### Sounds like Daniel

- "Exactly." / "Right?" / "Terrific." / "Awesome."
- "Call it a day"
- "Really, really, really want to express…"
- "That's great until it isn't."
- "Seven times out of 10…"
- "Accessibility isn't a nice-to-have. It's a requirement."
- "Communicating in layers"
- "Everything comes down to testing."

### Doesn't sound like Daniel

_Inferred; confirm._

- Corporate or marketing language ("leverage synergies", "game-changing", "revolutionize")
- Absolutes without caveats ("always use X", "never Y")
- Talking down to the audience, or assuming expertise without explaining it
- Blaming individuals or teams for bad code
- Accessibility framed as compliance or a checklist rather than as people

## Convictions that shape the voice

- Accessibility is the difference between taking part in modern life and being excluded from it: paying taxes, finding work, housing, doctors and community all happen online.
- Accessibility benefits everybody and takes nothing away (the crosswalk: everyone can use it, and you can still jaywalk).
- Don't reinvent HTML. It has been refined for decades; every deviation is a nuance devs have to remake and consumers have to relearn. Front-end work should come with an expectation of HTML knowledge.
- Treat HTML attributes and component props as two separate things.
- A design system exists to make work easier. When teams say "it's easier to build it myself", the system has failed and trust is lost.
- Consistency and predictability are what make a system learnable: shared names, values and defaults, in code and in design.
- Design systems are where accessible patterns get baked in at the core and advocated for across an organization.

## Samples

Talk quotes are lightly cleaned of transcription errors; article quotes are verbatim.

- "Accessibility isn't a nice to have feature. Accessibility is the difference between someone being able to take part in modern-day life or be excluded from it."

- "We can't just jump there. We have to go incrementally forward or backwards, one step at a time. And each step is determined by our DOM structure."

- "The amount of times I've been told it's easier to just build it myself than to use the actual component library. It's kind of like a dagger to the heart, because that is at the core of why we're trying to build design systems."

- "I see an HTML button as an interactive semantic container. … You can put anything you want inside of that button. Doesn't mean that you should, but you can. And that's the beauty of HTML, that it gives you just enough flexibility and freedom to shoot yourself in the foot."

- "We're not building anything that really matters at the end of the day. What matters is the trust and the reliability that we build within our system, across our teams, and within our organization through the use of building components."
- "Far too often, components are far too considerate."
- "Hopefully, the product has reached a point of stability where no new changes or requirements will ever happen again. Ever."
- "Web accessibility is not all or nothing."
- "Remember, creating an accessible experience for some doesn't take away from others."
- "Developers forget. Linters do not."
- "You build trust by showing up when you say you will and doing what you say you will."
- "But the same way that you can't trust a raging bull, you can't trust a system that's just as chaotic and unpredictable."
