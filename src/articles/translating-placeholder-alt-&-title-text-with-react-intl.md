---
title: Translating Placeholder, Alt & Title Text with React-Intl
date: 2018-10-05
layout: article.njk
tags:
    - articles
    - react
    - frontend
    - i18n
    - react-intl
preview:
    "I'll be real; when I first entered the Gatsby ecosystem and tried to load my first image, I was
    like 'whaaaaaaat?'. And if I was that befuddled trying to load a single picture, how in the
    world was I going to wrangle Gatsby Image into handling fluid art-directed images, compression,
    and formatting with broad support?"
description:
    'React libraries can make content localization a breeze but a struggle with attribute text.
    Using React-Intl let’s walk through translating our alt tags and input placeholders.'
assetDir: react-intl
---

## Update: 20 April, 2020

Since writing the original post, `react-intl` has released newer versions that include their own
hooks, making the process of translating attribute text a bit cleaner. And, arguably, the best part
is the incredibly quick migration from the original `HOC` approach.

I will be showing the updated code block in this section but for a better understanding and more
background, give the original post a glance.

---

Now, when handling translations within your app, `react-intl` exposes the `useIntl` hook.

```js
import { useIntl } from 'react-intl';
```

With the hook imported, a new `intl` instance can be instantiated inside the `Nav` component
providing access to its methods, particularly, `intl.formatMessage()` which we will use to toggle
title texts based on the `isOpen` state of our component.

```js
import React, { useState } from 'react';\
import { useIntl } from 'react-intl';

const Nav = () => ({\
 const [isOpen, setIsOpen] = useState(false);
 const intl = useIntl();

  return (
    <button
      title={isOpen
        ? intl.formatMessage({ id: 'menu.close' })
        : intl.formatMessage({ id: 'menu.open' })}
      onClick={setIsOpen(!isOpen)}
     >
       <Icon type={isOpen ? 'menu_close' : 'menu_open' />
    </button>
  );
})
```

## Original Post

Personally, I never looked into internationalization (i18n) until I moved to Finland. None of the
projects I had worked on had required it. After spending some time with it, I found that the
available libraries, specifically `react-intl` make the localization process quite smooth with one
exception, translating text within attributes such as `alt` text and `title` values for icons.

### Why are these attributes difficult to translate?

Translating attribute strings is difficult due to the common implementation of i18n libraries, such
as `react-intl`, which will be the library I am working with in this article.

[Visit React-Intl on Github](https://github.com/yahoo/react-intl)

Let's look at a basic use case with this library.

```jsx
<button>
    <FormattedMessage id="menu.open" />
</button>
```

In this snippet above, we're overlooking the configuration of the language `Provider` and looking
directly at using the `FormattedMessage` component.
([To see a full configuration walkthrough, visit the React-Intl docs](https://github.com/yahoo/react-intl/wiki)).

But as we can see, the plain `button` element contains a single string that will translate the
`menu.open` string based on the app's language settings. The translation itself, however, is in the
form of an individual component which makes the following implementation difficult.

```jsx
<button title={<FormattedMessage id="menu.open" />}>
    <Icon type="menu" />
</button>
```

In the example above, we have a button that contains only a menu icon that will be responsible for
toggling the navigation. For accessibility purposes, either the `button` or `icon` should have a
`title` attribute to verbally communicate with screen readers what the icon does visually. However,
even looking at that snippet, I wouldn't expect that to work.

> And that is where the problem lies. How do you translate attribute strings?

## Providing Translated Text to Attributes

I struggled finding documentation to this challenge and found myself having to do a lot of searching
and experimenting on my own until it happened to work. But let's start at the beginning.

### injectIntl(component)

`React-Intl` provides a High Order Component (HOC) in its library that we will use called
`injectIntl`. This provides us access to the imperative formatting API which we will look at soon.

Let's take a look at our very basic component file.

```jsx
import React, { Component } from 'react';
import { injectIntl } from 'react-intl';

class Nav extends Component {
  state = {
    isOpen: false
  };

  toggleNav() {
    this.setState({ isOpen: !this.state.isOpen });
  }

  render() {
    return (
      <button
        title={this.isOpen ? 'Close Menu' : 'Open Menu'}
        onClick={this.toggleNav}
      >
        <Icon type={this.isOpen ? 'menu_close' : 'menu_open' />
      </button>
  }
}

export default injectIntl(Nav);
```

Here we have a super generic component that will display an icon button. Depending on the state of
the navigation, the button will show either the open or close icon with the appropriate
instructional title as well with every click toggling the `isOpen` value in the `state`.

While exporting the component, we wrap it in the `injectIntl` HOC providing us access to the
formatting API which is passed to the wrapped component via `props`.

```js
render() {
  const { intl } = this.props;
  ...
}
```

After grabbing the `intl` prop from our HOC, we're now able to leverage it and its methods to
perform inline translations. For this example, we will look at the `formatMessage` method which
accepts an options object with the required key being an `id` to the message.

So let's revisit our `render` method from our generic component.

```js
render() {
  const { intl } = this.props;

return (
    <button
      title={this.isOpen
        ? intl.formatMessage({ id: 'menu.close' })
        : intl.formatMessage({ id: 'menu.open' })}
      onClick={this.toggleNav}
     >
      <Icon type={this.isOpen ? 'menu_close' : 'menu_open' />
    </button>
}
```

And that's it. By wrapping our `Nav` component inside of the `injectIntl` HOC, we're able to use the
translation API directly making it possible to localize attribute texts.

[More information on the Injection API can be found in the docs.](https://github.com/yahoo/react-intl/wiki/API#injection-api)

### What about PropTypes?

In my project, I am using React PropTypes to check data types within my components. That includes
checking the `intl` prop that is passed down from the HOC. To ensure this is covered by type
checking, I updated my `Nav` component with the following:

```ts
import { intlShape, injectIntl } from 'react-intl';

NavBar.propTypes = {
    intl: intlShape.isRequired,
};
```

By using the HOC, I am now able to ensure my input placeholders, image alt texts, icon titles, and
any other attribute text values can be translated ensuring accessible communication across locales.
