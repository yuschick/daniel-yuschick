---
title: Getting Dynamic with CSS Variables & Media Queries
date: 2017-10-10
layout: article.njk
tags:
    - articles
    - css
    - frontend
preview:
    "I can't remember how many years ago it was, but during my first interview for a Frontend
    position, I was asked to sketch out the CSS box model. I outlined the margins, borders, and
    padding and even denoted each side with its physical description–left, right, top and bottom. I
    had committed that model to memory, and have never really reconsidered it since. It never
    occurred to me that something so fundamental could change. Yet here I am, writing an article to
    tell you that it, in fact, has."
description:
    "I have clung to my years-long love of Sass. But with rapidly advancing browser capabilities,
    React, and PostCSS, I'm welcoming the use of traditional CSS with open arms all over again."
assetDir: css-variables
---

I have clung with all but a death grip to my years-long love and use of Sass. But with rapidly
advancing browser capabilities, React, and [PostCSS](https://postcss.org/), I find my grip loosening
almost completely as I welcome the use of traditional CSS with open arms all over again.

One of my biggest crutches in Sass was the use of variables. I often had my separate
`_variables.scss` partial containing colours, fonts, and even spacing values for consistency across
stylesheets and, ultimately, projects. Not until recently have I begun using CSS variables heavily.
And with this use came a realisation; CSS variables contain a greater capacity for dynamic,
responsive styles than ever before.

In this article I want to go over my personal ah-ha moment when working with CSS variables.

---

A common habit of mine when dealing with form fields is to set many input types to have a responsive
width but cap their maximum width. For example:

```css
input[type='text'] {
    max-width: 250px;
    width: 100%;
}
```

In this very basic example, I am able to achieve flexible input fields while still retaining a level
of control over the ultimate appearance and layout. However, on my recent project spanning numerous
forms, developers, and a small mountain's worth of stylesheets, I have found benefit in extracting
that `max-width` value out to a variable and setting it on the `:root` scope of the project.

```css
:root {
    --max-input-width: 250px;
}
```

My original style is then updated as follows:

```css
input[type='text'] {
    max-width: var(--max-input-width);
    width: 100%;
}
```

This allows me to keep input fields contained nicely on smaller screens but as the app scales up,
the open space caused by this width limitation becomes glaring. I haphazardly (_and shamefully_)
tried solving this by creating an additional variable and writing @media queries.

```css
:root {
    --max-input-width: 250px;
    --max-input-width-lg: 500px;
}

@media screen and (min-width: 750px) {
    input[type='text'] {
        max-width: var(--max-input-width-lg);
    }
}
```

Looking back on that now, I feel silly. So let's look at a cleaner solution that utilises the
dynamism of CSS variables.

---

Unlike Sass variables which are converted at the time of compilation, CSS variables are 'living'
values that can change with their environment. This means that a variable's value can update based
on `@media` queries and that new value will apply throughout the project wherever it is being used.

So let's return to my `variables.css` stylesheet and see how we can put this all together.

```css
:root {
    --max-input-width: 250px;
}

@media screen and (min-width: 750px) {
    :root {
        --max-input-width: 500px;
    }
}
```

Now, as I scale my app between various breakpoints (_because that's exactly what casual, everyday
users do_) my `:root`-scoped variables update and cascade down with their latest value.

I have found this practice beneficial for other elements as well such as

-   Container widths that should max and then centre
-   Headline sizes
-   Background image versions

Considering that variable values can be updated based on any `@media` query type, there is
tremendous potential to offload a lot of additional styles into dynamic variables. Notably, this
makes me think about ways of handling the 'notch' on the latest iPhone.

So Sass, if you're reading, just know it's not you. I mean, it's not me either but I think it's time
I truly embrace the next chapter of my life without you.
