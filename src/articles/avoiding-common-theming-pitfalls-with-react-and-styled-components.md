---
title: Avoiding Common Theming Pitfalls with React and Styled Components
date: 2021-01-21
layout: article.njk
tags:
  - articles
  - css
  - html
  - frontend
preview: "It's no secret that as products expand and development teams grow or change over, codebases begin to suffer from styling inconsistencies. Whether it be with element sizes, colors, or general 'magic numbers' littering the files, there are common approaches to minimizing these issues. While some products justify being split into a standalone component library, I want to look at the ones that need only a solid theme at its base to be the source of styling truth."
description: "Simplify theme conventions to align development and design closely, ease scalability and reduce the learning curve for new developers."
---

It's no secret that as products expand and development teams grow or change over, codebases begin to suffer from styling inconsistencies. Whether it be with element sizes, colors, or general 'magic numbers' littering the files, there are common approaches to minimizing these issues. While some products justify being split into a standalone component library, I want to look at the ones that need only a solid theme at its base to be the source of styling truth.

> **Note:** While this article will focus on React projects using [Styled Components](https://styled-components.com/), a lot of these challenges and approaches are technology agnostic and applicable across most frontend stacks.

## Theming

Regardless of how a project consumes its theme, whether through a provider, by importing various theme objects, or by custom properties on the project's `:root`, the themes themselves are often quite similar. It's common to store theme data in a single file, one per theme, and while this itself isn't a major pitfall, it does have inherent risks --- risks that we'll cover later.

## Goals

Before building our theme, let's take a step back and think about two things, **1)** the goals of a theme and, **2)** the pain points of using themes in the past.

With these in mind, my approach to theming aims to:

- Simplify the learning curve when stepping into a new codebase
- Make reading and writing styles quicker and more intuitive
- Define a versatile naming convention that's relevant across themes

Admittedly, these are abstract and somewhat subjective goals that are difficult to quantify, but as we move ahead and look at four frequent components of a theme, I'll try to make clear how certain approaches meet these goals.

Let's go.

## Color Naming & Organization

> We lose time figuring out if a HEX code is lightDarkGrey or darkLightGrey and we're all worse off because of it.

Naming is always considered as one of the most difficult parts of development and naming colors in a theme is no exception.

### The Pitfall(s)

There are a few common ways I've seen colors named in themes and each have their pitfalls.

### Generic Color Descriptions

When naming colors with generic color descriptions, like `grey` and `blue`, a theme quickly becomes a mishmash of difficult-to-understand names. Several products I've worked on have included names like `lighterLightGrey`, `darkestDarkGrey`, and `maroonRedDeep`. Naming becomes an immense challenge that is hard to scale and remember without always checking.

### CSS Color Keywords

Using the CSS color keywords like `honeydew`, `lightseagreen`, and `orangered` can seem like an uncomplicated way to keep names distinct, and admittedly, it does. However, for me personally, I struggle with all the different names as it's a lot to remember. I mean, I don't even know what color a honeydew is.

Another area this method breaks down, as does the generic color descriptions approach, is when themes change. In a light theme, `honeydew` will be just that, but once the theme is switched to dark, `honeydew` may now refer to a value that is not, in fact, `honeydew`.

### Purpose-Based Naming

Lastly, another naming convention I have often seen is the purpose- or function-based naming like `headerBackground`. This is generally fine until the design requires that same `headerBackground` color to be used on button text. It's possible to create a `buttonText` color with the same value, and isn't the worst thing that could be done, but reading and writing the button text color as `headerBackground` doesn't feel right, and creates conflicts of purpose as soon as one or the other needs to change.

## My Approach

Back in the day, I got into frontend development by way of design. I'm used to creating styleguides and defining color palettes. When doing so, and even when reviewing styleguides since, many designers break their colors into groups, like `core`, `accent`, and `aux`. Each group generally consists of a handful of colors. Some more. Some less.

If the designers divide the mental model of their color palette, why shouldn't we consider doing the same?

{% image "./src/assets/articles/avoid-theming-pitfalls/code-snippet-1.png", "An example of color naming in themes" %}

Of course, it _is_ possible to combine approaches. For example, brand colors rarely change between light and dark modes, so those colors can be nested with generic or keyword names, while the other groups retain the `primary/secondary` and `positive/negative` naming conventions.

{% image "./src/assets/articles/avoid-theming-pitfalls/code-snippet-2.png", "An example of combining color naming approaches" %}

While this approach isn't perfect---it still requires a lot to remember, and is difficult to expand beyond `tertiary` ---I find that the naming patterns and flexibility across themes keeps code consistent to read and write.

**Naming Convention Pattern:** By nesting color groups, names are scoped and can be repeated to create a consistent naming pattern.

**Theme-Agnostic Naming:** Lastly, when changing between themes, the naming convention holds. Whether the overall theme is `light` or `dark`, the `CancelButton` background color will read as the same theme-agnostic value.

**Decent Readability:** While using variables this way can become verbose, I believe the tradeoffs for readability and writability(?) are worthwhile.

{% image "./src/assets/articles/avoid-theming-pitfalls/code-snippet-3.png", "An example showing scoped color naming in use" %}

## Font Sizes

> Design tools provide font sizes in `px`, but the frontend assigns `rem` values to arbitrary t-shirt sizes. What?

The importance of consistent font sizes can rarely be overstated. Font sizes can visually create a data hierarchy at a glance where our peripheral vision assigns importance to content long before we start to read it. Inconsistencies in font sizes can disrupt that visual flow, and pull attention away from where it should be.

## The Pitfall(s)

Naming values for font sizes is difficult by itself, but when this is paired with converting between value units, this becomes a painful aspect of theming.

### A Beautiful Mind Required

When reviewing designs in tools like InVision, font sizes are often provided with a `px` value. However, our frontends usually size fonts with a more dynamic unit like `rem`. But then those `rem` values are assigned to arbitrary shirt sizes that have no real relation to the value they represent.

So as a developer, I have to take a `px` value, divide that by our base site value to determine the `rem` equivalent, and then match that to the appropriate shirt size variable name in the theme.

![Stephan A. Smith shaking his head, confused, with math symbols floating around his head.](https://cdn-images-1.medium.com/max/1600/0*tl0dsa8pJ57IO0sj.gif)

## My Approach

I've done the t-shirt sizes many times. I've tried functional naming like `headline` or `subtitle`, but naming has always been the _second_ part of the problem. The _first_ has always been converting from `px` to `rem`.

So I wanted to address the problem there.

{% image "./src/assets/articles/avoid-theming-pitfalls/code-snippet-4.png", "An example of a theme font size function" %}

Because design tools often provide their font sizes in `px`, I wanted to start there. How can we minimize the time spent trying to use the theme itself? By creating a theme function that accepts a font size in `px` and returns the `rem` value we reduce the amount of mental hurdles needed to write these styles.

Sure, this approach as is doesn't enforce a theme. What's to prevent somebody from entering any value they want? TypeScript or PropTypes is what. A type can be written for the `fontSize` theme function to ensure only defined theme values are used. Or go a step further with an `enum` so values can be auto-completed and seen while writing.

No more converting to `rem`. No more arbitrary shirt sizes like `xs` and `xxxxl`. Just a typed function that let's us work with what we have from the first step.

## Spacing Values

> Developers don't know how big the `medium` and `large` sizes are, they just know they need something in between.

Similarly to font sizes, spacing values often follow a shirt size pattern. While conceptually the values `sm` and `xl` mean different things, we don't exactly know _what_ they mean. If the design calls for a top margin of `16px`, how can I remember every spacing size variable to know the right one to use?

In short, I can't.

## My Approach

Instead of remembering every spacing variable and value, I set out to remember only one; the base.

Many designs work within multiplications of a single base value, such as 8. All spacing throughout the product will be relative to that one base value. So once a developer knows that, they should be able to use the theme's spacing.

Since the pitfalls here are similar to those of font sizes, my approach is similar as well.

{% image "./src/assets/articles/avoid-theming-pitfalls/code-snippet-5.png", "An example of a spacing theme function" %}

Popular CSS frameworks like [Tailwind CSS](https://tailwindcss.com/) use a similar approach. Define a base value, then use a class like `mt-4` to create spacing relative to that base.

Also like the font sizes approach, this function is prone to exploiting and breaking theme conventions. This is why I type the `value` options to values between `0.5` -`10` by increments of `0.5`. Once a developer knows the base value of the product is 8, they'll know how to use the theme when the design calls for `16px`, just as easily as `4px` or `44px`.

## Multiple Themes & Variations

> In a single file, making a manual change is fine. In multiple files, making a manual change is automatically dangerous.

I've certainly been there. Maybe you have, too. There are multiple theme files, one for a light mode, another dark, and a third for a high contrast mode and a feature calls for a new font size to be added. So you add it, but in the light theme only, and forget about the others.

Now, what happens when a person uses that feature in dark mode?

## My Approach

This is where combining theme data becomes helpful. For the same reasons I keep all of my i18n values together, I keep my theme values together using the [Styled Theming](https://github.com/styled-components/styled-theming) library.

{% image "./src/assets/articles/avoid-theming-pitfalls/code-snippet-6.png", "An example of styled theming grouping theme variations" %}

When I build my i18n files, I keep my language text strings together so that at a glance, I can see what translations are missing or, so when changes inevitably happen, I can make them all in the same place. This logic has become a life saver and with Styled Theming, the same approach can be taken when building themes.

In the example above, we define the values for both `light` and `dark` modes in the same place, assigning their values to a theme key of `mode`. That way when we're using the `ThemeProvider` to wrap our app, we pass in a `mode` and the appropriate theme will be used.

This not only keeps our values in one place, it opens additional opportunities to create theme variations.

### Variations

Think about a product where the color mode and font sizing or spacing can be adjusted. Something like GMail which has compact views for spacing and plenty of color options. This could potentially require creating theme files for each possible variation, but again, with Styled Theming we can combine theme variations without excessive duplication.

{% image "./src/assets/articles/avoid-theming-pitfalls/code-snippet-7.png", "An example of theme variations" %}

Here, we can expand our other theme functions, like `space`, to also support variations. By passing these variations into the `ThemeProvider` we can now accomplish great product personalization without multiple files recreating theme values over and over again, thus ensuring that when changes happen, they can happen safely in one place.

---

If there was a _best_ way to handle naming and theming, we would likely learn that way and carry on. After seeing common pitfalls project after project, I wanted to take a step back and work on an approach that met my goals for a theme --- easy to step into and easy to read and write with versatile naming that carries through multiple themes and variations.

This may not be the best approach for you or your product, and that's okay. We create themes to support personalization, and how we choose to build them is no different.

### Resources

- [Styled Theming](https://github.com/styled-components/styled-theming)
- [Styled Components](https://styled-components.com/)
