---
title: OrganiCSS - Mixins for Writing Logical CSS
date: 2022-07-13
layout: article.njk
tags:
    - articles
    - css
    - rhubarb
    - scss
    - styled components
    - less
    - stylus
    - emotion
preview: "At the end of 2020, I wrote about how CSS Logical Properties Are the Future of the Web & I18N. Since
then, I've used and advocated for the new properties heavily as I see them as the next huge step
toward creating truly fluid and inclusive UIs."
description:
    'OrganiCSS is a collection of mixins to support writing progressively-enhanced logical CSS in
    many different flavors.'
assetDir: organicss
---

{% image "./src/assets/articles/organicss/organicss-logo-tagline.jpg", "OrganiCSS - Logical CSS. Naturally." %}

At the end of 2020, I wrote about how
[CSS Logical Properties Are the Future of the Web & I18N](https://www.danyuschick.com/articles/css-logical-properties-are-the-future-of-the-web-and-i18n/).
Since then, I've used and advocated for the new properties heavily as I see them as the next huge
step toward creating truly fluid and inclusive UIs.

However, browser support requirements for the products I was working on didn't always align with
browser support for logical properties. So I started writing and re-using various mixins to allow
the gradual use of logical CSS through progressive enhancement with physical box model fallbacks
when needed.

I'd first written the mixins for Styled Components. Later, I needed to convert those same mixins
into a SCSS project. And it was here that [OrganiCSS](https://www.organicss.style) was born.

## OrganiCSS

🚀 [View OrganiCSS on GitHub](https://github.com/organicss/organicss)

> OrganiCSS is a collection of mixins for writing logical CSS in different pre-processors and
> libraries.

What started as a collection of mixins for just Styled Component, is now a collection of mixins for
SCSS, Stylus, Less and Emotion.

So what exactly do these mixins do?

**OrganiCSS - Styled Components**

```jsx
import { Margin, Padding } from '@organicss/styled-components';

const Container = styled.section`
    ${Margin({ inline: 'auto' })};
    ${Padding({ block: 'var(--custom-property-value)' })};
`;
```

**OrganiCSS - SCSS**

```scss
@import '../node_modules/@organicss/scss';

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

> An added benefit when using OrganiCSS - Styled Components or Emotion is the TypeScript
> autocompletion of properties and values.

With the compiled CSS, the logical properties are prioritized. In environments where they're not
supported, the `@supports` query will be triggered, and the physical-property equivalents are used
as fallbacks. Eventually, as browser support catches up and becomes broad enough, the `@supports`
query will no longer be needed.

## OrganiCSS Scope

There were a couple key goals when creating the OrganiCSS library:

1. Keep APIs consistent across projects
2. Support all logical properties and values described at
   [MDN: CSS Logical Properties and Values](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties)

### Mixin APIs

Because of the support for CSS-in-JS libraries, the API conventions were generally pegged to this
environment, as the outlier.

All property keys follow a camelCase naming convention, with any processor-specific leading
character, such as `$` for SCSS and `@` for Less.

```js
// Styled Components, Emotion, Stylus
blockSize, inlineEnd

// SCSS
$blockSize, $inlineEnd

// Less
@blockSize, @inlineEnd
```

### Logical Property Support

As mentioned, a goal was to support all the logical properties and values according to MDN. A full,
updated list of that support can be found at [organics.style](https://www.organicss.style). Each
property is grouped into a category, `border`, `borderRadius`, `layout`, `margin`, `padding` and
`position`, and that category becomes an OrganiCSS mixin.

## Wrap Up

Is there a _need_ for this? At least for me there was. So why not? Isn't that the whole point of
open source? Hopefully, someone else will find it useful in moving their project toward logical
properties.

Either way, I'm quite happy with this.

## Resources

-   [OrganiCSS](https://www.organicss.style)
-   [OrganiCSS on Github](https://github.com/organicss)
