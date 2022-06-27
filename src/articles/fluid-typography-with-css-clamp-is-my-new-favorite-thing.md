---
title: Fluid Typography with CSS Clamp() is My New Favorite Thing
date: 2020-05-03
layout: article.njk
tags:
  - articles
  - css
  - frontend
  - typography
preview: "According to Twitter, which is definitely an accurate representation of real life, I’m in the extreme minority of developers who actually enjoy CSS. I got into development (*all those years ago*) by way of design and as a designer first, working in CSS unlocked so much creative potential."
description: "Flexbox and Grid offer incredible potential for responsive design and this little CSS function does the same."
socialImage: css-fluid-typography/social-image.jpg
---

According to Twitter, which is definitely an accurate representation of real life, I’m in the extreme minority of developers who actually enjoy CSS. I got into development (_all those years ago_) by way of design and as a designer first, working in CSS unlocked so much creative potential.

As the web shifted into a more fluid experience (_all those years ago_), things like Flexbox and Grid blew my mind with their incredible potential for responsive design. And on a smaller scale, this little CSS function has done the same thing recently.

---

## CSS Clamp()

The `clamp()` function seems small but wields incredible power by clamping a value between an upper and lower range. Think `minmax()` but for more than rows and columns.

The first place I found the value of `clamp()` was font sizes.

Fluid typography can get a bit complicated for me. Running various calculations around a viewport size had me feeling both uncertain and imprecise because the code didn’t tell me what size the font would _actually_ be. And I couldn’t always account for display extremes.

But `clamp()` provides that same fluidity with better control and readability.

```css
h1 {
  font-size: clamp(1.75rem, 3vw, 2.1rem);
}
```

Let’s break down what this function does.

The `clamp()` functions takes three values:

- A minimum value
- A preferred value
- A maximum value

With those values in mind, you can see the code snippet above defines the minimum size as `1.75rem` and the maximum size as `2.1rem`. In my designs from mobile on up, I don’t want my `h1` font to ever fall outside of that range.

The fluidity comes into play by setting the middle value, the preferred size, to a dynamic value. I like to use `vw` units that allow the font to scale with the size of the display but stay within the range of `1.75rem` to `2.1rem`.

With the `clamp()` values defined, I tested the `h1` element by dragging my browser smaller and larger and watched as the font size scaled smoothly within its range.

{% image './src/assets/articles/css-fluid-typography/site-demo-1.jpeg', 'Demonstrating fluid typography with CSS clamp()' %}

Admittedly, it’s a small size range but I now feel more in control of how text will behave in my projects.

But while we’re at it, why stop at text? I’ve found several other uses for `clamp()` such as border sizes, padding values, and even element widths. Maybe a bit overboard but development should be fun and this little function brought the fun in spades.

## Browser Support (Looking at you, Safari!)

> **Update 21.3.21:** Browser support has expanded and standardized since originally writing this article to include more recent versions of Safari. The remainder of this section, though, is still written based on the lack of Safari support.

Nothing good is easy and when I tested my site in Safari, I was reminded of that when everything appeared janky.

{% image './src/assets/articles/css-fluid-typography/browser-support.png', 'Support for the clamp() function from caniuse.com' %}

Some browsers are yet to support `clamp()` but luckily, there are two other small, clutch functions– `min()` and `max()` we can use. When put together, they can provide similar functionality to `clamp()` but also play nicely with additional browsers.

```css
h1 {
  font-size: clamp(1.75rem, 3vw, 2.1rem);

  @supports not (font-size: clamp(1.75rem, 3vw, 2.1rem)) {
    font-size: min(max(1.75rem, 3vw), 2.1rem);
  }
}
```

From the code snippet you can see that when combined, `min()` and `max()` behave very similarly to `clamp()` but where `clamp()` is available, I prefer it.

---

Sure, you could argue this article should be titled _Fluid Typography with CSS min() & max() is My New Favorite Thing._ That’s fair. But I came across `clamp()` first, so it feels more like the feature while `min()` and `max()` feel more like the fallback. I do prefer the readability of `clamp()` though, and prefer writing only one function to nesting two together.

Preferences aside, I’m happy to feel more in control of fluid typography now and I have `clamp()` to thank.
