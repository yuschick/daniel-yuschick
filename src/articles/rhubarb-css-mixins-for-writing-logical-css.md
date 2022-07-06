---
title: Rhubarb CSS - Mixins for Writing Logical CSS
date: 2022-07-04
layout: article.njk
tags:
    - articles
    - css
    - rhubarb
    - scss
    - styled components
    - less
    - stylus
preview:
    "At the end of 2020, I wrote about how CSS Logical Properties Are the Future of the Web & I18N.
    Since then, I've used and advocated for the new properties heavily as I see them as the next
    huge step toward creating truly fluid and inclusive UIs. However, browser support requirements
    for the products I was working on didn't always align with browser support for logical
    properties. So I started writing and re-using various mixins to allow the gradual use of logical
    CSS through progressive enhancement with physical box model fallbacks when needed."
description:
    'Rhubarb CSS is a collection of mixins to support writing progressively-enhanced logical CSS in
    many different flavors.'
assetDir: rhubarb-css
---

{% image "./src/assets/articles/rhubarb-css/logo-rhubarb-css-default.png", "Rhubarb CSS jam jar logo" %}

At the end of 2020, I wrote about how
[CSS Logical Properties Are the Future of the Web & I18N](https://www.danyuschick.com/articles/css-logical-properties-are-the-future-of-the-web-and-i18n/).
Since then, I've used and advocated for the new properties heavily as I see them as the next huge
step toward creating truly fluid and inclusive UIs.

However, browser support requirements for the products I was working on didn't always align with
browser support for logical properties. So I started writing and re-using various mixins to allow
the gradual use of logical CSS through progressive enhancement with physical box model fallbacks
when needed.

I'd first written the mixins for Styled Components. Later, I needed to convert those same mixins
into a SCSS project. And it was here that [Rhubarb CSS](https://github.com/rhubarb-css) was born.

## Rhubarb CSS

🚀 [View Rhubarb CSS on GitHub](https://github.com/rhubarb-css)

> Rhubarb CSS is a collection of mixins to support writing progressively-enhanced logical CSS in
> many different flavors.

What started as a collection of mixins for just
[Styled Components](https://github.com/rhubarb-css/rhubarb-styled-components), is now a collection
of mixins for [SCSS](https://github.com/rhubarb-css/rhubarb-scss),
[Stylus](https://github.com/rhubarb-css/rhubarb-stylus) and
[Less](https://github.com/rhubarb-css/rhubarb-less).

So what exactly do these mixins do?

**Rhubarb Styled Components**

```jsx
import { Margin, Padding } from '@rhubarb-css/styled-components';

const Container = styled.section`
    ${Margin({ inline: 'auto' })};
    ${Padding({ block: 'var(--custom-property-value)' })};
`;
```

**Rhubarb SCSS**

```scss
@import '../node_modules/@rhubarb-css/scss';

section {
    @include margin($inline: auto);
    @include padding($block: var(--custom-property-value));
}
```

These examples, would generate the following CSS.

```css
section {
    margin-inline-end: auto;
    margin-inline-block: auto;
    padding-block-end: var(--custom-property-value);
    padding-block-start: var(--custom-property-value);

    @supports not (margin-inline-end: 1rem) {
        margin-left: auto;
        margin-right: auto;
    }

    @supports not (padding-block-end: 1rem) {
        padding-bottom: var(--custom-property-value);
        padding-top: var(--custom-property-value);
    }
}
```

> An added benefit when using Rhubarb Styled Components is the TypeScript autocompletion of
> properties and values.

With the compiled CSS, the logical properties are prioritized. In environments where they're not
supported, the `@supports` query will be triggered, and the physical-property equivalents are used
as fallbacks. Eventually, as browser support catches up and becomes broad enough, the `@supports`
query will no longer be needed.

## Rhubarb CSS Scope

There were a couple key goals when creating the Rhubarb CSS library:

1. Keep APIs consistent across projects
2. Support all logical properties with direct physical fallbacks

### Mixin APIs

Because of the support for Styled Components, the API conventions were generally pegged to this
environment, as the outlier.

All property keys follow a camelCase naming convention, with any processor-specific leading
character, such as `$` for SCSS and `@` for Less.

```js
// Styled Components
blockSize

// SCSS
$blockSize

// Less
@blockSize

// Stylus
blockSize
```

### Logical Property Support (v0.3.0)

Here is a list of logical property support and their fallback properties.

#### Border

<div class="table-wrapper">

| Prop             | CSS Property (_Fallback_)                                 |
| ---------------- | --------------------------------------------------------- |
| border           | border                                                    |
| borderColor      | border-color                                              |
| borderStyle      | border-style                                              |
| borderWidth      | border-width                                              |
| block            | border-block-start/end (_border-top/bottom_)              |
| blockColor       | border-block-start/end-color (_border-top/bottom-color_)  |
| blockStyle       | border-block-start/end-style (_border-top/bottom-style_)  |
| blockWidth       | border-block-start/end-width (_border-top/bottom-width_)  |
| blockEnd         | border-block-end (_border-bottom_)                        |
| blockEndColor    | border-block-end-color (_border-bottom-color_)            |
| blockEndStyle    | border-block-end-style (_border-bottom-style_)            |
| blockEndWidth    | border-block-end-width (_border-bottom-width_)            |
| blockStart       | border-block-start (_border-top_)                         |
| blockStartColor  | border-block-start-color (_border-top-color_)             |
| blockStartStyle  | border-block-start-style (_border-top-style_)             |
| blockStartWidth  | border-block-start-width (_border-top-width_)             |
| inline           | border-inline-start/end (_border-left/right_)             |
| inlineColor      | border-inline-start/end-color (_border-left/right-color_) |
| inlineStyle      | border-inline-start/end-style (_border-left/right-style_) |
| inlineWidth      | border-inline-start/end-width (_border-left/right-width_) |
| inlineEnd        | border-inline-end (_border-right_)                        |
| inlineEndColor   | border-inline-end-color (_border-right-color_)            |
| inlineEndStyle   | border-inline-end-style (_border-right-style_)            |
| inlineEndWidth   | border-inline-end-width (_border-right-width_)            |
| inlineStart      | border-inline-start (_border-left_)                       |
| inlineStartColor | border-inline-start-color (_border-left-color_)           |
| inlineStartStyle | border-inline-start-style (_border-left-style_)           |
| inlineStartWidth | border-inline-start-width (_border-left-width_)           |

</div>

#### Border Radius

<div class="table-wrapper">

| Prop        | CSS Property (_Fallback_)                             |
| ----------- | ----------------------------------------------------- |
| bottomLeft  | border-end-start-radius (_border-bottom-left-radius_) |
| bottomRight | border-end-end-radius (_border-bottom-right-radius_)  |
| radius      | border-radius                                         |
| topLeft     | border-start-start-radius (_border-top-left-radius_)  |
| topRight    | border-start-end-radius (_border-top-right-radius_)   |

</div>

#### Layout

<div class="table-wrapper">

| Prop                     | CSS Property (_Fallback_)                            |
| ------------------------ | ---------------------------------------------------- |
| blockSize                | block-size (_height_)                                |
| captionSide              | caption-side                                         |
| clear                    | clear                                                |
| maxBlockSize             | max-block-size (_max-height_)                        |
| minBlockSize             | min-block-size (_min-height_)                        |
| inlineSize               | inline-size (_width_)                                |
| maxInlineSize            | max-inline-size (_max-width_)                        |
| minInlineSize            | min-inline-size (_min-width_)                        |
| overflow                 | overflow                                             |
| overflowBlock            | overflow-block (_overflow-x_)                        |
| overflowInline           | overflow-inline (_overflow-y_)                       |
| overscrollBehavior       | overscroll-behavior                                  |
| overscrollBehaviorBlock  | overscroll-behavior-block (_overscroll-behavior-x_)  |
| overscrollBehaviorInline | overscroll-behavior-inline (_overscroll-behavior-y_) |
| resize                   | resize                                               |
| textAlign                | text-align                                           |

</div>

#### Margin

<div class="table-wrapper">

| Prop              | CSS Property (_Fallback_)                                   |
| ----------------- | ----------------------------------------------------------- |
| block             | margin-block-start/end (_margin-bottom/top_)                |
| blockEnd          | margin-block-end (_margin-bottom_)                          |
| blockStart        | margin-block-start (_margin-top_)                           |
| inline            | margin-inline-start/end (_margin-left/right_)               |
| inlineEnd         | margin-inline-end (_margin-right_)                          |
| inlineStart       | margin-inline-start (_margin-left_)                         |
| margin            | margin                                                      |
| scroll            | scroll-margin                                               |
| scrollBlock       | scroll-margin-block-start/end (_scroll-margin-top/bottom_)  |
| scrollBlockEnd    | scroll-margin-block-end (_scroll-margin-bottom_)            |
| scrollBlockStart  | scroll-margin-block-start (_scroll-margin-top_)             |
| scrollInline      | scroll-margin-inline-start/end (_scroll-margin-left/right_) |
| scrollInlineEnd   | scroll-margin-inline-end (_scroll-margin-right_)            |
| scrollInlineStart | scroll-margin-inline-start (_scroll-margin-left_)           |

</div>

#### Padding

<div class="table-wrapper">

| Prop              | CSS Property (_Fallback_)                                     |
| ----------------- | ------------------------------------------------------------- |
| block             | padding-block-start/end (_padding-top/bottom_)                |
| blockEnd          | padding-block-end (_padding-bottom_)                          |
| blockStart        | padding-block-start (_padding-top_)                           |
| inline            | padding-inline-start/end (_padding-left/right_)               |
| inlineEnd         | padding-inline-end (_padding-right_)                          |
| inlineStart       | padding-inline-start (_padding-left_)                         |
| padding           | padding                                                       |
| scroll            | scroll-padding                                                |
| scrollBlock       | scroll-padding-block-start/end (_scroll-padding-top/bottom_)  |
| scrollBlockEnd    | scroll-padding-block-end (_scroll-padding-bottom_)            |
| scrollBlockStart  | scroll-padding-block-start (_scroll-padding-top_)             |
| scrollInline      | scroll-padding-inline-start/end (_scroll-padding-left/right_) |
| scrollInlineEnd   | scroll-padding-inline-end (_scroll-padding-right_)            |
| scrollInlineStart | scroll-padding-inline-start (_scroll-padding-left_)           |

</div>

#### Position

<div class="table-wrapper">

| Prop        | CSS Property (_Fallback_)   |
| ----------- | --------------------------- |
| blockEnd    | inset-block-end (_bottom_)  |
| blockStart  | inset-block-start (top)     |
| float       | float                       |
| inlineEnd   | inset-inline-end (_right_)  |
| inlineStart | inset-inline-start (_left_) |
| position    | position                    |
| z           | z-index                     |

</div>

## Wrap Up

Is there a _need_ for this? At least for me there was. So why not? Isn't that the whole point of
open source? Hopefully, someone else will find it useful in moving their project toward logical
properties.

Either way, I'm quite happy with this.

## Resources

-   [Rhubarb CSS on Github](https://github.com/rhubarb-css)
-   [Rhubarb Styled Components](https://github.com/rhubarb-css/rhubarb-styled-components)
-   [Rhubarb SCSS](https://github.com/rhubarb-css/rhubarb-scss)
-   [Rhubarb Stylus](https://github.com/rhubarb-css/rhubarb-stylus)
-   [Rhubarb Less](https://github.com/rhubarb-css/rhubarb-less)
