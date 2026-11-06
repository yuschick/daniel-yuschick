---
component: <Component>
figmaNode: <node-id>
factsHash: <hash from the facts file>
---

# <Component>

## Purpose

One or two sentences on what it's for and what it renders.

## Anatomy

The exact DOM structure, layout and how content wraps. Say whether children need an internal wrapper.

## API

Every Figma property appears here or under Out of scope. A row citing `figma` must name a real Figma property, with matching values and default.

| Prop | Type | Values | Default | Figma | Source |
| :--- | :--- | :----- | :------ | :---- | :----- |

## Figma tokens

Paste the output of `check-spec.js --print-rows`. Never edit it by hand.

## Additional tokens

Values Figma can't express. These can't cite `figma`.

| Token | Use | Source |
| :---- | :-- | :----- |

## Behavior and accessibility

Name the WAI-ARIA pattern. Commonly missed, so settle each one that applies:

- **State precedence:** what shows when states combine, such as focused and hovered, or hovered and pressed.
- **Logic location:** whether RX-09 calls for an internal hook, and where any required comments go.
- **Contrast surfaces:** which surface each pair is measured against, including elements with no fill.
- **Overrides:** what happens when consumer attributes conflict with a prop.
- **Forced colors, reduced motion, text resizing and long content.**
- **Reset baseline:** every page loads `@dy/css/reset.css`, which sets `margin` and `padding` to zero on every element and pseudo-element, makes media block-level, and keeps list markers unless a list has `role="list"`. Native elements such as `button`, `input`, `fieldset`, `dialog` and `ul` start with no spacing, so every padding, margin and gap the component shows needs a token row. None may rely on a browser default.

| Requirement | Source |
| :---------- | :----- |

## Out of scope

Anything here appearing in the build is scope creep and fails review.

| Item | Figma | Source |
| :--- | :---- | :----- |

## Decisions

Every fact question must be named under Resolves.

| ID  | Decision | Resolves | Source |
| :-- | :------- | :------- | :----- |

## Open questions

None.
