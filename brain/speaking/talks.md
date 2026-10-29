# Talks

Daniel's talk catalog, grouped by talk rather than by date, because titles evolve as a talk is refined. Use this to avoid repeating a pitch, to find past material on a topic, and as reference for new proposals. Title style is described in [self/voice.md](../self/voice.md#titles).

> **Status:** the full event list from Daniel's speaking page (September 2023 onward). Abstracts are still needed for most talks. Several talks grew out of articles; see [writing/articles.md](../writing/articles.md).

## The Shopping Dead (ARIA live regions)

**Current title:** The Shopping Dead: A Zombie's Guide to Web Accessibility

Live regions through a zombie e-commerce site, Grim and Grace, and its shopper Romero. Covers `aria-live` (assertive vs. polite) and its customization attributes (`aria-atomic`, `aria-busy`, `aria-relevant`) and their inconsistent support; `role="alert"` and `role="status"`; when **not** to use a live region (live search results: move focus to a results heading instead); "no news is good news"; and `<output>` as an underused native live region. Closes on accessibility as inclusion in modern life. Full transcript reviewed (NDC Oslo 2026).

| Date       | Event             | Location       | Title used                                                 |
| :--------- | :---------------- | :------------- | :--------------------------------------------------------- |
| 29.01.2027 | NDC London        | London, UK     | The Shopping Dead: A Zombie's Guide to Web Accessibility   |
| 07.10.2026 | Frontmania        | Amsterdam, NL  | The Shopping Dead: A Zombie's Guide to Web Accessibility   |
| 17.09.2026 | NDC Oslo          | Oslo, NO       | The Shopping Dead: A Zombie's Guide to Web Accessibility   |
| 11.02.2026 | Hive Helsinki     | Helsinki, FI   | The Shopping Dead: An Accessible Web For The Undead        |
| 17.12.2025 | Turku ❤️ Frontend | Turku, FI      | The Shopping Dead: An Accessible Web For The Undead        |
| 11.10.2025 | Moldova DevCon    | Chișinău, MD   | The Shopping Dead: An Accessible Web For The Undead        |
| 12.09.2025 | NDC Copenhagen    | Copenhagen, DK | The Shopping Dead: An Accessible Web For The Undead        |
| 11.03.2025 | HelsinkiJS        | Helsinki, FI   | The Shopping Dead: Accessible Live Data For The Unalive    |
| 27.02.2025 | axe-con           | Virtual        | It's Alive! Facing The Monsters of Accessible Live Regions |
| 06.02.2025 | TampereJS         | Tampere, FI    | It's Alive! Facing The Monsters of Accessible Live Regions |

_It's Alive! is grouped here as an earlier version of the same live-regions talk._

## Building Better Components

**Title:** Building Better Components — A Journey to a More Resilient Frontend

Resilient component APIs, because "content will forever and always change". Three interface keys: grouping similar props (union types over booleans; the "data gate model" of `hasError` + `errorMessage`), consistency is key (shared names, values and defaults; "we're not learning the components, we're learning their conventions"), and don't reinvent HTML (extend native attributes; `children` over a `text` prop; native event handlers). Then component stores: a hook returning one store that keeps multi-part components (popover menus, tabs) in sync, credited to Ariakit. Closes on building trust, not components. Full transcript reviewed (NDC Oslo 2025). Its principles underpin [standards/props.md](../standards/props.md) and [standards/typescript.md](../standards/typescript.md).

| Date       | Event                          | Location        |
| :--------- | :----------------------------- | :-------------- |
| 03.06.2026 | NDC Copenhagen                 | Copenhagen, DK  |
| 21.05.2025 | NDC Oslo                       | Oslo, NO        |
| 15.11.2024 | Build Stuff                    | Vilnius, LT     |
| 03.10.2024 | RenderCon                      | Remote          |
| 04.04.2024 | TampereJS                      | Tampere, FI     |
| 21.03.2024 | Michigan Technology Conference | Pontiac, MI, US |
| 29.02.2024 | HelsinkiJS                     | Helsinki, FI    |
| 28.02.2024 | Turku ❤️ Frontend              | Turku, FI       |

Related article: _The Key To Good Component Design Is Selfishness_ (Smashing Magazine, 2023).

## Accessibility Adventures

**Title:** Accessibility Adventures: Lost Secrets of Forced Colors Mode

_Abstract needed._

| Date       | Event             | Location     |
| :--------- | :---------------- | :----------- |
| 25.11.2026 | Turku ❤️ Frontend | Turku, FI    |
| 08.06.2026 | Future Frontend   | Helsinki, FI |
| 25.02.2026 | axe-con           | Virtual      |
| 23.02.2026 | HelsinkiJS        | Helsinki, FI |
| 05.02.2026 | TampereJS         | Tampere, FI  |

## Codebase to Community

**Title:** Codebase to Community: Rebuilding Trust in Legacy Design Systems

_Abstract needed._ The zeroheight article _Refactoring trust debt in your design system through predictable release cycles_ (2026) covers the same story: renewing a legacy design system by paying down its "trust debt" with predictable hotfix, sprint and annual major release cycles. See [writing/articles.md](../writing/articles.md#zeroheight). _Confirm how closely the talk follows it._

| Date       | Event      | Location      |
| :--------- | :--------- | :------------ |
| 22.10.2026 | Converge   | Newcastle, UK |
| 07.10.2026 | Frontmania | Amsterdam, NL |

## Approach With Care

**Title:** Approach With Care - Making Digital Accessibility Feel Natural

_Abstract needed._

| Date       | Event           | Location      |
| :--------- | :-------------- | :------------ |
| 03.06.2025 | Webinale        | Berlin, DE    |
| 05.12.2024 | Posti TechCon   | Helsinki, FI  |
| 02.11.2024 | Moldova DevCon  | Chișinău, MD  |
| 24.10.2024 | STHLM Xperience | Stockholm, SE |
| 02.10.2024 | Netlight        | Helsinki, FI  |
| 29.05.2024 | Hive Helsinki   | Helsinki, FI  |

## Beyond JavaScript

**Title:** Beyond JavaScript - Building UIs With Modern HTML & CSS

_Abstract needed._

| Date       | Event             | Location     |
| :--------- | :---------------- | :----------- |
| 24.02.2025 | Future Frontend   | Helsinki, FI |
| 18.12.2024 | Turku ❤️ Frontend | Turku, FI    |
| 11.07.2024 | TallinnJS         | Tallinn, EE  |

## The Keys to an Accessibility Mindset

Based on the Smashing Magazine article _Keys To An Accessibility Mindset_ (2023). Accessibility as a mindset rather than a checklist of ARIA fixes, built on POUR and three keys: markup communicates as clearly as the design; markup follows an element's function, not its appearance; state is shown with more than color. The crosswalk analogy and "communicating in layers" start here. _Confirm how closely the talk follows the article._

| Date       | Event                          | Location        |
| :--------- | :----------------------------- | :-------------- |
| 07.05.2024 | enterJS                        | Mainz, DE       |
| 22.03.2024 | Michigan Technology Conference | Pontiac, MI, US |
| 29.09.2023 | RenderCon Nairobi              | Remote          |
| 13.09.2023 | StackConf Berlin               | Berlin, DE      |

## Design system handoff

Two related talks; confirm whether they share material.

| Date       | Event               | Location  | Title                                                                     |
| :--------- | :------------------ | :-------- | :------------------------------------------------------------------------ |
| 29.05.2025 | Into Design Systems | Virtual   | Handoff: Tips for Documentation, Accessibility and Collaboration          |
| 28.05.2025 | Turku ❤️ Frontend   | Turku, FI | Lift Off! Hand Off! Design Systems Bridging Time And Space (And Species?) |

## Other

| Date          | Event           | Location     | Role or title                                          |
| :------------ | :-------------- | :----------- | :----------------------------------------------------- |
| 27.08.2025    | Hive Helsinki   | Helsinki, FI | Navigating a Tough Job Market: Lessons from Experience |
| 27–28.05.2025 | Future Frontend | Helsinki, FI | Conference MC                                          |
