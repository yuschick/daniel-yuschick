# Articles

Daniel's published articles, newest first per publication. Use this to avoid re-pitching a covered topic, to link earlier work from new pieces, and as reference for the written voice described in [self/voice.md](../self/voice.md#written-voice).

## zeroheight

### [Refactoring trust debt in your design system through predictable release cycles](https://zeroheight.com/blog/refactoring-trust-debt-in-your-design-system-through-predictable-release-cycles/)

Published 14.10.2026. The written companion to the talk _Codebase to Community: Rebuilding Trust in Legacy Design Systems_.

When Daniel took over a legacy design system, he started with its community rather than its technical or design debt: "its trust debt". Products had pinned years-old versions, copied components locally or dropped the dependency, because releases were chaotic: a monolithic package on v89, no changelogs, migration guides, deprecation policy or governance, and any single team's request could ship as a breaking change. The fix was to slow down (citing Josh Clark's "Ship Faster by Building Design Systems Slower") and make releases predictable:

- **Hotfix:** only when severity and visibility demand it. "Release cycles be damned."
- **Minor and patch:** every sprint, with sprints moved to Wednesday–Wednesday so releases land every second Tuesday; a release branch per sprint publishes canary versions automatically. Planning shifted from sprints to releases.
- **Major:** annual, in phases (plan, build, test and document, release):
  - External planning workshop with product leads (inspired by Sophia Levens at SAP): a self-rated adoption icebreaker, needs bucketed "Immediate / Soon / Eventually", what works, what doesn't, wildest ideas, then dot voting.
  - Internal session merges that with the team's roadmap into a Jira release with owned epics and a Markdown roadmap, with community-sourced items marked by an asterisk. The roadmap is pinned in Slack, published in the docs and reviewed at monthly info sessions.
  - A release branch publishing release candidates, a separate Figma release project, and a blanket deprecation policy: deprecations last two major versions.
  - Core teams test release candidates, sometimes in pairing sessions; release windows narrow to dates over the year; the month after release is spent purely on support, with weekly office hours.

Results are openly "vibes-based" (there were no prior metrics): Slack questions shifted from "When will this be fixed?" to "Will this be fixed in next week's release?", and attendance and early-access interest grew. Some teams stayed pinned. The close: the greatest design systems are the ones people use and trust.

_Headings in sentence case, per zeroheight's house style._

## Smashing Magazine

[Author page](https://www.smashingmagazine.com/author/daniel-yuschick/). Daniel was Smashing's [Person of the Week](https://www.smashingmagazine.com/person-of-the-week/daniel-yuschick/) on 9 September 2024.

| Date       | Title                                                                                                                                                            | Summary                                                                                                                                                                                              |
| :--------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 24.05.2024 | [Switching It Up With HTML's Latest Control](https://www.smashingmagazine.com/2024/05/switching-it-up-html-latest-control/)                                      | A first look at the proposed native `switch` attribute for checkbox inputs, and the open questions before it's production-ready.                                                                     |
| 20.02.2023 | [Keys To An Accessibility Mindset](https://www.smashingmagazine.com/2023/02/keys-accessibility-mindset/)                                                         | Accessibility as a mindset, not a checklist: POUR plus three keys (communicative markup, functional markup, more than color for state). Became the talk of the same name.                            |
| 20.01.2023 | [The Key To Good Component Design Is Selfishness](https://www.smashingmagazine.com/2023/01/key-good-component-design-selfishness/)                               | Components break when they take responsibility for their content; "selfish" components with APIs limited to their own behavior stay flexible. Precursor to _Building Better Components_ and PROP-04. |
| 08.06.2022 | [Simplify Your Color Palette With CSS Color-Mix()](https://www.smashingmagazine.com/2022/06/simplify-color-palette-css-color-mix/)                               | Using `color-mix()` to streamline palettes and state colors.                                                                                                                                         |
| 26.05.2022 | [Manage Accessible Design System Themes With CSS Color-Contrast()](https://www.smashingmagazine.com/2022/05/accessible-design-system-themes-css-color-contrast/) | Using `color-contrast()` to keep design system themes and handoff colors sufficiently contrasting.                                                                                                   |

## LogRocket

[Author page](https://blog.logrocket.com/author/danielyuschick/).

| Date       | Title                                                                                                                                   | Summary                                                                                                                                                                                                                 |
| :--------- | :-------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 31.05.2023 | [Linting defensive and logical CSS with Stylelint plugins](https://blog.logrocket.com/linting-defensive-logical-css-stylelint-plugins/) | Enforcing defensive and logical CSS with Stylelint plugins, including a real-world team rollout. Covers `stylelint-plugin-defensive-css` and `stylelint-plugin-logical-css`, which Daniel maintains and this repo uses. |
| 09.09.2022 | [A deep dive into CSS individual transform properties](https://blog.logrocket.com/deep-dive-css-individual-transform-properties/)       | The individual `rotate`, `scale` and `translate` properties versus the legacy `transform` functions.                                                                                                                    |

## CSS-Tricks

[Author page](https://css-tricks.com/author/danyuschick/).

| Date       | Title                                                                                                                            | Summary                                                                 |
| :--------- | :------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------- |
| 23.02.2022 | [5 Accessibility Quick Wins You Can Implement Today](https://css-tricks.com/5-accessibility-quick-wins-you-can-implement-today/) | Practical accessibility improvements for teams daunted by AA/AAA goals. |
| 16.11.2017 | [Accessible Web Apps with React, TypeScript, and AllyJS](https://css-tricks.com/accessible-web-apps-react-typescript-allyjs/)    | Accessibility tooling in a React and TypeScript app.                    |
