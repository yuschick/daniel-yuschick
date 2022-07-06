---
title: Easy Peasy Stores with Public and Private Actions
date: 2020-10-18
layout: article.njk
tags:
    - articles
    - react
    - easy peasy
    - typescript
    - state management
    - frontend
preview:
    "Since the end of 2019, I have been using Easy Peasy to manage the state of my applications both
    professionally and personally. The library has a familiar API and logic with a lightweight feel
    and good flexibility. If you're using or have used Redux and aren't fully sold on it, take a
    look into Easy-Peasy. It may be worth it."
description:
    'Easy Peasy is a terrific state management library that does a lot of things well, but the
    things that can be done with it expand that functionality even further.'
assetDir: easy-peasy
---

Since the end of 2019, I have been using [Easy Peasy](https://easy-peasy.now.sh/) to manage the
state of my applications both professionally and personally. The library has a familiar API and
logic with a lightweight feel and good flexibility. If you're using or have used Redux and aren't
fully sold on it, take a look into Easy-Peasy. It may be worth it.

> "Easy Peasy is an abstraction of Redux, providing a re-imagined API that focuses on developer
> experience." --- [Easy Peasy's official website](https://easy-peasy.now.sh/)

Each time I've set up an Easy Peasy store, I've experimented more with its implementation. I've
asked myself more questions about not only what the library can do but what can be done with it.
During my latest project, I had asked myself, "What if I wanted my app to have access to only a
specific subset of actions? Can Easy Peasy create private and public actions for its stores?"

I looked through the docs but didn't find an answer to this question. I'd hoped for something like
JavaScript classes where I could preface any action or state value with `private`. But while that
wasn't the case, that doesn't mean that wasn't the answer.

I mentioned that with each project, I explored more of not only what Easy Peasy could do but what I
could do with it --- and this will be an example of the latter.

_Note: This article will assume a base understanding of creating a store and Hooks using Easy Peasy.
Some code samples will roughly include these concepts but will not explain them or show them in
full. Please visit the_ [_Easy Peasy docs_](https://easy-peasy.now.sh/docs/introduction/) _for
better information on getting started._

## The Project

Recently, I've been working on creating a centralized store that will serve both a React web app and
a React Native app. The store will contain all state values, data requests, resolver logic, and
TypeScript types. That way, both products are consistent in pulling data from the same place, the
same way, with the same logic, all with a singular point for updating and maintenance. The store is
installed like any other npm package and exposes a provider to both apps and both teams.

And that is where the idea for public and private actions came to mind.

This store will be used across products and teams. Right now, it's easy to work with the other
developers, but as the teams grow, ultimately, this may not be the case. The patterns and logic
discussed across the team now may not always be clearly communicated later, whether in person or
through documentation, and then those patterns may break down.

A way to alleviate that now, and later at scale, is to only expose the actions the apps should be
using.

## Exposing Public Actions

As mentioned, I didn't see a way in the docs for Easy Peasy to support this functionality out of the
box, so I had to get a little creative to achieve it.

Let's look at an example model that we'll use throughout:

{% image './src/assets/articles/easy-peasy/code-snippet-1.png', 'Example code of creating a set of public actions inside of an Easy Peasy state management store' %}

Example store model with Easy Peasy

In the (abbreviated) code above, we have a store for `Projects`. It contains all of its own state,
actions, and thunks. Using Easy Peasy, we can create Hooks to access this store in our UI:

{% image './src/assets/articles/easy-peasy/code-snippet-2.png', 'Creating a set of React hooks to connect to the Easy Peasy store state and store actions' %}

Example of using Easy Peasy Hooks in the UI

As seen in the code above, the `useStoreState` and `useStoreActions` Hooks expose the entire
`Project` store. However, we want to restrict that.

Specifically, the pattern here is to have `thunks` maintain `error` and `loading` states manually.
It will also take its response and call `actions.setProjects()` on its own. Because of this pattern,
we don't want the UI to have access to `setError`, `setLoading`, or `setProjects` since all of those
actions are handled internally within the store. We want the UI to only have access to
`setActiveProjectSlug` and `fetchProjects`.

## Creating Our Custom Hooks

We have identified which actions should be privateand which should be exposed to the UI.

-   Private: `setError`, `setLoading`, `setProjects`
-   Public: `setActiveProjectSlug`, `fetchProjects`

Knowing that, let's create our own custom Hooks in the centralized store to filter out anything
considered private:

{% image './src/assets/articles/easy-peasy/code-snippet-3.png', 'An example of creating a custom React Hook to expose only public values from Easy Peasy' %}

Creating a custom Hook to expose public actions from Easy Peasy store

Here, we've created a custom Hook (`useProjectActions`) that calls the base Hook
(`useStoreActions`). Since the base Hook returns everything from the store, we destructure out only
the actions we want (`fetchProjects` and `setActiveProjectSlug`) and return them, leaving behind
anything else we consider to be private.

_Note: The same thing can be done for public and private state values as well._

## TypeScript

Another reason I like Easy Peasy is its integration with TypeScript. Since the current project is
done in TypeScript, let's see an example of how to type out our new custom Hooks.

{% image './src/assets/articles/easy-peasy/code-snippet-4.png', 'An example of creating the custom React Hooks using TypeScript' %}

Creating custom Hooks with Easy Peasy in TypeScript

When creating the store in TypeScript, actions and thunks use the types of `Action` and `Thunk`
exported from Easy Peasy. But when consuming these actions through the `useStoreActions` Hook, they
are now typed as `ActionCreator` and `ThunkCreator`.

Now, our new custom `useProjectActions` is typed and exposes only the actions we want the UI to
consume.

{% image './src/assets/articles/easy-peasy/code-snippet-5.png', 'Showcasing the TypeScript method autocompletion with the custom React Hooks' %}

TypeScript suggestion on the newly typed custom Hooks

## Conclusion

Stores can quickly become large, with multiple models all containing their own actions, thunks, and
state. When a store like that is being consumed across multiple apps with different teams and
developers, it can become confusing to use in the UI with all of that data being exposed. Without
clear communication and documentation (and even still), it is a matter of time until something is
called or used that shouldn't be, the UI falters, and the store patterns break.

By taking the extra step of creating custom Hooks to filter out anything considered private, that
confusion in the UI can be cleared up and the patterns in the store can be maintained.

There's a difference between what a library can do and what can be done with it. Easy Peasy is a
terrific library that does a lot of things well, but the things that can be done _with_ it expand
that functionality even further.
