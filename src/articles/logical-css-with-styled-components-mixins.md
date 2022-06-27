---
title: Logical CSS with Styled Components Mixins
date: 2021-03-27
layout: article.njk
tags:
  - articles
  - styled components
  - react
  - javascript
  - css
  - frontend
  - typescript
preview: "Sometimes it feels masochistic to be a frontend developer. I regularly come across articles or tweets with new features that will improve my day-to-day workflow or solve a cumbersome, but consistent, problem and I get excited. I just can't help it. I let my mind celebrate in the streets of all the different uses cases I can imagine. Then I review the browser support and immediately my proverbial parade is doused in the rain that is reality."
description: "Sometimes it feels masochistic to be a frontend developer. I regularly come across articles or tweets with new features that will improve my day-to-day workflow or solve a cumbersome, but consistent…"
assetDir: styled-components-logical-mixins
---

Sometimes it feels masochistic to be a frontend developer. I regularly come across articles or tweets with new features that will improve my day-to-day workflow or solve a cumbersome, but consistent, problem and I get excited. I just can't help it. I let my mind celebrate in the streets of all the different uses cases I can imagine.

Then I review the browser support and immediately my proverbial parade is doused in the rain that is reality.

![Stitch, from the animated movie Lilo and Stitch, cries in the rain.](https://media.giphy.com/media/M28rUlcjueKUE/giphy.gif)

## The Lure of Logical CSS

My dead little heart fluttered to life when I learned of the evolution to Logical CSS. I experimented with the new properties and, ultimately, wrote a post of my own about the topic. In that post, [Logical CSS is the Future of the Web and I18n](https://dev.to/yuschick/css-logical-properties-are-the-future-of-the-web-i18n-11i1), I included code snippets to help others get started with the new concepts today.

However, as I started using those snippets myself, leveraging `@supports` queries everywhere for physical CSS fallbacks, I learned three things very quickly.

**1.** This approach quickly bloated the styles and became difficult to read and work with

**2.** Relying on multiple developers with varying understandings of CSS to make the switch wasn't smooth or positive for anybody

**3.** When fallbacks are no longer needed, a ton of files will need to be edited, each increasing the risk of regressions

I've spent years now working in stacks built around React and Styled Components where the name of the game is componentization to reduce duplication and centralize logic. How could I leverage these fundamentals to address the major drawbacks of trying to use logical CSS today?

## Mixins with Styled Components

If you also come from a SASS (or LESS) background, the concept of mixins probably isn't new. Essentially, a mixin is a block of styles that can be seen like a component in the sense that:

- A set of styles are written as a standalone block
- Those styles can be imported and used many times
- The set can support props to dynamically alter values throughout lifecycles

While Styled Components doesn't have anything out of the box for mixins, _per se_, we can use it to achieve exactly what we need.

First, let's look at a set of styles I found myself repeating over, and over again.

```js
const SomeComponent = styled.div`
  inline-size: 100%;
  max-inline-size: 50rem;

  @supports not (inline-size: 100%) {
    max-width. 50rem;
    width: 100%;
  }
`;
```

As you may be able to imagine, writing logical CSS first with the various `@supports` queries after can quickly balloon into a mess.

```css
const SomeComponent = styled.div`
  border-block-start: 1px solid orange;
  block-size: 15rem;
  inline-size: 100%;
  margin-inline: auto;
  max-inline-size: 50rem;

  @supports not (inline-size: 100%) {
    max-width. 50rem;
    width: 100%;
  }

  @supports not (border-block-start: 1px solid orange) {
    border-top: 1px solid orange;
  }

  @supports not (block-size: 15rem) {
    height: 15rem;
  }

  @supports not (margin-inline: auto) {
    margin: 0 auto;
  }
`;
```

And just like that, we have an amalgamation of 🤮🤮🤮. It's not quick to write, nor easy to keep consistent across a codebase, and not much fun to read again later. But I kept doing it, convinced it was the way to go.

Fool me once, shame on you. Fool me a bunch of times over a few-week period, and, I don't know, fire me?

But eventually, the connections started to spark and the idea finally formed.

**Mixins**

If I could extract this repeated and cumbersome work out into a dynamic block, I could achieve cleaner working code, and easier consistency across developers.

_Mixins.js_

```js
import { css } from 'styled-components´;

export const Size = ({ height, maxHeight, maxWidth, width }) => css`
  block-size: ${height};
  inline-size: ${width};
  max-block-size: ${maxHeight};
  max-inline-size: ${maxWidth};

  @supports not (block-size: ${height}) {
    height: ${height};
    maxHeight: ${maxHeight};
  }

  @supports not (inline-size: ${width}) {
    max-width. ${maxWidth};
    width: ${width};
  }
`;
```

_Component.js_

```js
import { Size } from 'Mixins';

const SomeComponent = styled.div`
  ${Size({ height: '15rem', maxWidth: '50rem', width: '100%' });
`;
```

Now, by using the `Size` mixin, I'm able to render a block of logical CSS with physical fallbacks while keeping my working styles much cleaner and with a more familiar terminology.

## The Mixins

Let's break down what's happening with our `Size` mixin.

First, we import the `css` helper function from Styled Components. By wrapping our styles in this, we can ensure they receive potential vendor prefixes and other Styled Components magic.

Next, we create a function called `Size` that accepts an object of defined, but optional, values. If a value isn't provided, that style is merely skipped during build, thus ensuring our rendered styles are no less clean.

Lastly, in our component file, we import the function, and call it from within our styled `div`. We pass in only the sizes we need, with the property names we already know _(and which also happen to be shorter and more conducive to key/value pairs)_ and as a result, have a cleaner set of styles with all the functionality we desire.

## Looking Back

Let's revisit the original issues with writing logical CSS now and see if, and how, our `Size` mixin addresses them.

**1.** By using the mixin, we now have a single function call in place of the multiple lines of styles previously written. Code readability is somewhat subjective, but for me, that's a major win.<sup>1</sup>

With this mixin, my styled `div` is now quicker to write, easier to read, and, getting into our second point, easier for others to incorporate.

**2.** At the time of writing this in March 2021, not every frontend developer I know is aware of logical CSS. **That's okay**. But with this mixin, they don't really have to be. Sure, it's valuable to demonstrate the shift, but with a single function using familiar terminology, this is a much lower bar of entry than relearning the entire box model.

**3.** Lastly, that brings us to the eventual world we'll all live in one day, one where logical CSS is the standard and broadly supported everywhere. With this mixin acting as the single source of truth, if we want to delete the fallback, we do it in one place and give ourselves the rest of the day to, I don't know, ride hoverboards with our robot friends, or something.

But we're not done yet. We can go further.

_Way further._

## Styles with Type Checking

A primary goal of mine when it comes to styling, theming, and optimizations of this nature is to minimize the work it takes to go from design to code.

> Design tools provide values in px, but the frontend assigns rem values to arbitrary t-shirt sizes. 🤯

My goal is to be able to look at InVision, see a `padding` of `16px` and be able to write my styles using only that piece of information without having to cross check and reference multiple files.

So let's take a look at the `Size` mixin again, but now with type checking.

```ts
interface SizeProps {
  height?: string;
  maxHeight?: string;
  maxWidth?: string;
  width?: string;
}

export const Size = ({ height, maxHeight, maxWidth, width }: SizeProps) =>
  css` ... `;
```

Now, when I use this mixin later, I can take the numeric pixel value, convert it to `rem` units _(using a helper function which accepts a number and returns a rem string)_ and have my logical CSS styles written with nothing more than what the designs had given me.

```js
import { pxToRem } from 'utils/theme';

const SomeComponent = styled.div`
  ${Size({ width: pxToRem(500) });
`;
```

> Bonus: Feel free to extend the type checking to exclude any strings containing `px`. Or only accept the relative units you'd like to support.

Now, we have our handy dandy mixin, with super fancy type checking, and all is well in the world.

## All. The. Mixins.

![Homer Simpson at a fair asking a cook "can you make it all in one thing and fry it?"](https://media.giphy.com/media/XD4fdNUOnAPyuX6YP1/giphy.gif)

If you're familiar with logical CSS, you know that there are quite a few properties other than `block-size` and `inline-size` that are being rolled out. Properties like `margin`, `padding` and even `border` have their new logical variations.

So why wait? Here's a [Gist](https://gist.github.com/yuschick/fce07ec3914cf87b9f6502e0d7cde808) containing mixins for Border, BorderRadius, Margin, Padding, Position, and Size.

## Recap

No matter how much you may love being a developer, you typically want to write less code. Not more. This is usually what drives all these new technologies we get so excited over.

By creating these mixins with Styled Components to enable writing consistent logical CSS in projects now, I feel like I'm getting both – less code with more features.

And masochistic or not, there will always be rain. Just find ways to keep dancing in it.

![Kamala Harris dancing in the rain under a blue umbrella.](https://media.giphy.com/media/gmjyeGnoChH5n3eOXS/giphy.gif)

### Resources

- [Mixins Gist](https://gist.github.com/yuschick/fce07ec3914cf87b9f6502e0d7cde808)
- [Logical CSS is the Future of the Web and I18n](https://dev.to/yuschick/css-logical-properties-are-the-future-of-the-web-i18n-11i1)
