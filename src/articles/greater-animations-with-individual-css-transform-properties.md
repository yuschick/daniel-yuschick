---
title: Greater Animations with CSS Individual Transform Properties
date: 2022-10-04
layout: article.njk
canonical: 'https://blog.logrocket.com/deep-dive-css-individual-transform-properties/'
tags:
    - articles
    - css
    - frontend
    - animation
preview:
    'There’s a chance you’ve never known CSS without its ability to transform properties. That
    functionality is at the core of CSS and a cornerstone of user interfaces (UI) as we know them
    today. However, in recent years, CSS hasn’t shied away from overhauling some of its most
    foundational pieces. After revolutionizing layouts with flexbox and grid and restructuring its
    box model with logical properties, it was time to introduce its next evolution — transforms.'
description:
    'With the introduction of CSS individual transform properties, the boundaries of animations and
    transforms can be pushed further.'
assetDir: css-transform-properties
---

There’s a chance you’ve never known CSS without its ability to transform properties. That
functionality is at the core of CSS and a cornerstone of user interfaces (UI) as we know them today.
However, in recent years, CSS hasn’t shied away from overhauling some of its most foundational
pieces. After revolutionizing layouts with
[flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/) and
[grid](https://css-tricks.com/snippets/css/complete-guide-grid/) and restructuring its box model
with
[logical properties](https://www.danyuschick.com/articles/css-logical-properties-are-the-future-of-the-web-and-i18n/),
it was time to introduce its next evolution…

Transforms.

For as soft and welcoming as many subtle UI interactions may appear, creating and editing them can
be anything but. This is because CSS has a single `transform` property to manage all of its
different values, like `rotate`, `scale`, and `translate`.

When transforming a single value, a single property works well. However, when working with multiple
values, it becomes a burdensome, cognitive load — a cognitive load CSS looks to resolve by
introducing individual transform properties.

First, let’s review the current `transform` property, then discover how its functionality is
improved by using the new individual transform properties. Let’s get started.

## Challenges of the `transform` Property

In order to understand the benefits of individual transform properties, let’s first look at the two
key challenges they’re trying to address. Neither of them is immediately obvious when starting out.

### Use It or Lose It

The following `transform` property isn’t too complicated. It will scale, translate, then rotate the
element.

```css
.item {
    transform: scale(1.5) translate(0, 50%) rotate(90deg);
}
```

But what happens to the `transform` if we want to change the scale amount on `hover`?

Every `transform` function must be defined in every state or its value will be lost. In order to
scale down the item on `hover` without losing its `translate` and `rotate` values, they both must be
duplicated along with the updated scale value.

```css
.item:hover {
    transform: scale(0.5) translate(0, 50%) rotate(90deg);
}
```

For a single `hover` state, this may not be too much of a burden. But this becomes more complicated
as transforms grow or when creating animations with multiple frames.

However, needing to duplicate every `transform` function presents another challenge.

### Order of Operations

When creating transforms with more than one function, it’s important to note that the browser will
apply the values in order from left to right. This means the following transforms will, visually,
have different results, despite having the same value.

```css
.item:first-child {
    transform: scale(1.75) translate(0, 50%);
}

.item:last-child {
    transform: translate(0, 50%) scale(1.75);
}
```

After the first item scales, it will be translated relative to its new size. Meanwhile, the second
item will scale after translating, resulting in an element not positioned exactly like the first.

{% codepen 'https://codepen.io/DanielYuschick/embed/YzaBMer' %}

As transformations grow more complex and more `transform` functions are used, the more difficult it
becomes to manage the entire property. Take an animation with multiple frames as an example:

{% codepen 'https://codepen.io/DanielYuschick/embed/BarMOMM' %}

When creating an animation with multiple `transform` values, the cognitive load to manage each
property in its correct order across each frame can become quite a burden.

```css
@keyframes animate {
    10%,
    15% {
        transform: translateX(0);
    }
    16% {
        transform: translateX(0) scale(0.5);
    }
    18% {
        transform: translateX(0) scale(1.5);
    }
    20% {
        transform: translateX(0) scale(1);
    }
    50% {
        transform: translateX(50%) scale(1) rotate(180deg);
    }
    65% {
        transform: translateX(-50%) scale(1) rotate(180deg);
    }
}
```

It’s these challenges and cognitive loads that look to be removed by the introduction of CSS
individual transform properties.

## What are CSS Individual Transform Properties?

CSS has introduced three new individual transform properties: `rotate`, `scale`, and `translate`.

```css
.item {
    rotate: 180deg;
    scale: 1.5;
    translate: 50% 0;
}
```

These new properties work like the legacy `transform` functions but without the legacy challenges.

Because these new individual properties are independent of one another, there is no need to
duplicate values across states. And without the need to duplicate values across states, the order
becomes much easier to manage, except individual transform properties are not dependent on their
order, either.

Where the legacy `transform` functions are applied in order from left to right, the individual
transform properties are applied in a much more favorable sequence: 1. translate 2. rotate 3. scale.

With the key challenges of working with the `transform` property out of the way, the previous
animation can be refactored into a more manageable and legible `@keyframes` block seen below:

{% codepen 'https://codepen.io/DanielYuschick/embed/XWEOxRa' %}

```css
@keyframes animate {
    10%,
    15% {
        scale: 1;
        translate: 0;
    }
    16% {
        scale: 0.5;
    }
    18% {
        scale: 1.5;
    }
    20% {
        rotate: 0deg;
        scale: 1;
    }
    50% {
        rotate: 180deg;
        translate: 50% 0;
    }
    65% {
        rotate: 180deg;
        translate: -50% 0;
    }
}
```

## Individual Transform Property Considerations

Individual transform properties require a few other considerations when using them that may be
different than their legacy equivalents. We’ll go over them in a little more depth below.

### Some Properties Left Behind

While CSS has introduced the three individual properties `rotate`, `scale`, and `translate`, the
remaining `transform` functions have not been given the same priority. Because of this, the
individual and `transform` properties can work together.

You can visit
[MDN for a full list of `transform` functions](https://developer.mozilla.org/en-US/docs/Web/CSS/transform).

### `transform-origin`

When transforming an element, it’s common to also use the `transform-origin` property. While most
browsers default to transforming an element, such as rotating an image from its center point, the
`transform-origin` property allows explicit control over the point from which an element is
transformed.

Because the two properties had similar names, `transform` and `transform-origin`, the mental model
was pretty clear that these two properties were related — a mental model that has been disconnected
from the individual transform properties.

However, despite the property names no longer being aligned, the `rotate`, `scale`, and `translate`
properties all function as transforms that still adhere to any `transform-origin` values as
expected. This means existing transforms which utilize explicit `transform-origin` points can be
refactored to use individual transform properties without any conflicts.

```css
.item {
    scale: 1.5;
    transform-origin: top right;
}
```

### Setting Values to `0`

When setting nearly any value in CSS to `0`, it’s generally acceptable to not supply any unit to the
value. When the value is `0`, it doesn’t really matter if it’s `0px` or `0rem`. The same applies to
the `transform` property and rotate function.

```css
.item {
    transform: rotate(90deg);
}

.item:hover {
    transform: rotate(0);
}
```

However, when using the individual `rotate` property, a unit or CSS keyword must be defined.

```css
.item {
    rotate: 90deg;
}

.item:hover {
    // ❌ Will not rotate without a unit
    rotate: 0;

    // ✅ Will rotate with a unit specified
    rotate: 0deg;
}
```

### The `will-change` Property

Much like `transform-origin`, the individual transform properties also work together with the
`will-change` property. Although, the same
[considerations when using `will-change`](https://dev.opera.com/articles/css-will-change-property/)should
still be followed, such as only applying the property if the animation or transform is already
suffering from performance issues.

If the `transform` property isn’t causing any performance issues, the switch to individual transform
properties will not change that.

### Overall Performance

The use of individual transform properties is just as efficient as the original `transform`
property.

### Support and Fallbacks

The benefits of CSS individual transform properties are worthless if they can’t be used. Luckily,
modern support for these properties is already quite good, with support in at least the latest
version of all major browsers, being introduced to Chrome and Edge in v104, Safari 14.1, and
Firefox 103.

{% image './src/assets/articles/css-transform-properties/browser-support.png', "CSS individual transform properties support as of 20.8.2022 - Caniuse" %}

Building products for only the latest versions of major browsers, though, is often a fantasy rather
than the reality of web development. But since the individual transform properties can be directly
mapped to the legacy `transform` values, a reliable fallback can be used for progressive
enhancement.

```css
.container {
    rotate: 80deg;
    scale: 1.5;
    translate: 50% 10%;

    @supports not (scale: 1) {
        // Use transform fallback if CSS individual transform properties are not supported
        transform: translate(50%, 10%) rotate(80deg) scale(1.5);
    }
}
```

By using the `@supports` query with the `not` keyword, we’re able to prioritize the newer
properties, only rendering the fallback in environments where it’s required. But be wary, because
the `transform` property is dependent on the order of its values, fallbacks must be written with
this in mind.

To make the process of writing fallbacks easier, an
[SCSS Mixin for individual transform properties](https://codepen.io/DanielYuschick/pen/NWYozPK) can
be used to automate the fallback `transform` property and the order of its values.

{% codepen 'https://codepen.io/DanielYuschick/embed/NWYozPK' %}

## Conclusion

Transformations have long been a fundamental feature of CSS. Their interactions have defined the web
as we know it today. With the introduction of individual transform properties, `rotate`, `scale`,
and `translate`, the boundaries of animations and transforms may be pushed further.

Where else may these properties be beneficial? Would you also like to see other `transform`
functions, like `skew` and axis-specific functions, be moved to their own properties?

If nothing else, CSS individual transform properties have two key benefits:

1. The introduction to transforms and animations may now be better for beginners
2. The ability to clean up existing transforms and animations

And for these two reasons alone, individual transform properties are a welcomed shift to the CSS
foundation.

## Resources

-   [Rotate](https://developer.mozilla.org/en-US/docs/Web/CSS/rotate),
    [Scale](https://developer.mozilla.org/en-US/docs/Web/CSS/scale) and
    [Translate](https://developer.mozilla.org/en-US/docs/Web/CSS/translate) - MDN
-   [Rotate](https://caniuse.com/?search=rotate), [Scale](https://caniuse.com/?search=scale) and
    [Translate](https://caniuse.com/?search=translate) - Caniuse
-   [Finer-grained control over CSS transforms with individual transform properties](https://web.dev/css-individual-transform-properties/) -
    Bramus & L. David Baron
-   [CSS individual transform properties](https://webkit.org/blog/11420/css-individual-transform-properties/) -
    Antoine Quint
-   [Order in CSS Transformations](https://www.stefanjudis.com/blog/order-in-css-transformation-transform-functions-vs-individual-transforms/) -
    Stefan Judis
-   [Individual transform properties SCSS Mixin](https://codepen.io/DanielYuschick/pen/NWYozPK) -
    CodePen
-   [Individual transform properties Demos](https://codepen.io/collection/PYKbBa) - CodePen
