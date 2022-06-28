---
title: Improve Web App Accessibility with React-Focus-On
date: 2020-10-10
layout: article.njk
tags:
  - articles
  - react
  - a11y
  - frontend
  - web accessibility
preview: "Many moons ago, when I started working as a front-end developer, I didn't know much about web accessibility. That changed when I worked on a team at a large insurance company and was put in charge of making the product accessible. You see, in the US, something like the inability to file an insurance claim on a website due to inaccessibility could lead to lawsuits. Super duper expensive lawsuits. I didn't want to be responsible for that."
description: "Ensure your React and TypeScript project is accessible with React-Focus-On. So easy to use, there's no longer an excuse to not have an accessible product."
assetDir: react-focus-on
---

Many moons ago, when I started working as a front-end developer, I didn't know much about web accessibility. That changed when I worked on a team at a large insurance company and was put in charge of making the product accessible. You see, in the US, something like the inability to file an insurance claim on a website due to inaccessibility could lead to lawsuits. Super duper expensive lawsuits.

I didn't want to be responsible for that.

As a result, I learned a lot in a short period of time about accessibility. Since then, it has become an area of focus in which I take a lot of pride as a developer.

---

Working toward accessibility goals can be tough and, frankly, a little extra time consuming. So it is easy for this fundamental element of a product to be overlooked. But you know what else takes extra time and effort? Testing, type checking-- yet these practices have become a standard. So why hasn't accessibility become just as recognized throughout the field?

Tooling.

There hasn't been a wide selection of tooling that eased some of the necessary requirements of accessibility compliance. Let's consider a `Modal` component. The `Modal` would need to keep the user's keyboard focus within itself while auto-focusing the first possible element. Closing it would need to be tied to the `escape` key, and once closed, the user's focus would need to be returned to the element that triggered the `Modal` in the first place.

That's a lot to manage.

The first library I used to help with these challenges was [Ally.JS](https://allyjs.io/). It provided a lot of different methods for handling these specific use cases. At first, it seemed revolutionary as I enhanced a bunch of my projects using it. But as the story goes with front-end development, after some time, what was once revolutionary had become legacy. The library was not regularly maintained and therefor, fell behind the times.

I recently started on a new product in the Education Tech field. In this area, specifically, accessibility is not just a nice feature but an absolute requirement.

I knew two things.

1.  Providing education software to the public sector without accommodating special needs schools, classes, and students would not only be a failure of the development team, but a bad business practice in alienating an entire demographic of the target audience.
2.  Ally.JS could no longer handle the requirements within the coding environment

So that led me to Google, which led me to the library I am excited to (_finally! geesh!_) tell you all about.

## React-Focus-On

<https://github.com/theKashey/react-focus-on>

React-Focus-On is a web accessibility library specifically geared toward the React environment with TypeScript support. It touts itself as...

> The final solution for WAI ARIA compatible Modal Dialogs or any full-screen tasks

**Bold.**

So let's first look at what we'll be building today, then we'll break it down to see just how easy is React-Focus-On after all.

The example used in this article will be available on GitHub. <https://github.com/yuschick/react-focus-on-demo>

{% image './src/assets/articles/react-focus-on/demo-project-1.gif', 'Accessible React modal component' %}

Yep, a standard-looking modal, _but_ there are several things happening that separate it from non-accessible modals.

1.  When the modal opens, notice that the first focusable element, `Blue`, is focused already.
2.  When tabbing through the elements, notice that after reaching the submit button, the focus then appears on the close icon. This is called focus trapping, and it keeps the focus of the keyboard within the modal.
3.  Behind the scenes, in the code itself, the markup outside of the modal is set to `aria-hidden="true"` which prevents it from being seen by screen readers while the modal is open. The `body` itself is also scroll locked, keeping the page steady behind the modal.
4.  When the modal closes, the button that triggered it initially is given focus again, returning the user back to their previous location.
5.  Closing the modal also removes the `aria-hidden` attribute from the rest of the document.

That can be a lot of functionality to manage without a library. Hell, it was a lot to manage even with `AllyJS`.

So how can `React-Focus-On` be used to achieve all of this? Like this...

{% image './src/assets/articles/react-focus-on/code-snippet-1.png', 'Snapshot of React-Focus-On code' %}

The snipper above is a pretty bare example, but by wrapping our `Modal` in a `FocusOn` component, all of the previous accessibility functionality is covered by default and without any painful setup or configuration.

In my opinion, making accessible modals and modal-like components has never been so convenient. But just because React-Focus-On does a lot by default, doesn't mean it doesn't have a few options up its sleeve.

## Event Handlers

The `FocusOn` component handles a lot already, but it can be expanded to make a few other features more convenient to implement, like closing on `esc` and closing when the user clicks outside of the modal.

{% image './src/assets/articles/react-focus-on/code-snippet-2.png', 'An example of using React-Focus-On event props' %}

In this snippet, the `close` prop has been assigned to the`FocusOn` events `onClickOutside` and `onEscapeKey`. These two options provide common functionality but without the need to write and manage event handlers yourself.

## Shards

Once in a while, there's a situation where an element outside of a focus-trapped modal should be included in the tabbable range or not hidden from interactions. React-Focus-On accepts a `shards` property which is an array of element references.

{% image './src/assets/articles/react-focus-on/code-snippet-3.png', 'A code example of passing a shards array into FocusOn' %}

While this modal example isn't a good use case for the `shards` prop, the option has been helpful when building custom dropdown menus.

In the example below, the label which toggles the menu is outside of the modal-like menu itself. However, the focus range should still include it. By passing the label as a `shard`, it's included in the focus range and accessible as another option to toggle the menu.

{% image './src/assets/articles/react-focus-on/demo-project-2.gif', 'An example of using shards for a drop down menu' %}

## Animation

While not a feature of React-Focus-On, feel free to wrap it in with `CSSTransition` from `react-transition-group` to combine accessibility with subtle a touch of animation.

If adding animation, be sure to check for `prefers-reduced-motion` to simplify or disable the animation for those users.

```css
@media (prefers-reduced-motion) {  // simplify or disable the animation}
```

{% image './src/assets/articles/react-focus-on/demo-project-1.gif', 'Animated modal using React Transition Group and React-Focus-On' %}

Accessibility continues to be an oft-forgotten element of front-end development. There's a lot of reasons for this, but a major one has been the lack of convenient and powerful tooling. Well, after finding and using React-Focus-On, I feel there's no longer any excuse not have accessibility be a standard part of a workflow.

We write tests and type check--two standard pieces in web development. We must hold accessibility to the same standard and finally, we have a library that gives us no reason not to.

### Resources:

[React Focus On](https://github.com/theKashey/react-focus-on)\
[Article Demo Repo](https://github.com/yuschick/react-focus-on-demo)
