---
title: Accessible Web Apps w/ React, TypeScript & AllyJS
date: 2017-11-16
layout: article.njk
canonical: https://www.css-tricks.com/accessible-web-apps-react-typescript-allyjs/
tags:
  - articles
  - react
  - frontend
  - typescript
  - a11y
  - web accessibility
  - allyjs
preview: "Accessibility is an aspect of web development that is often overlooked. I would argue that it is as vital as overall performance and code reusability. We justify our endless pursuit of better performance and responsive design by citing the users, but ultimately these pursuits are done with the user's device in mind, not the user themselves and their potential disabilities or restrictions."
description: "Accessibility is an aspect of web development that is often overlooked. I would argue that it is as vital as overall performance and code reusability. We justify our endless pursuit of better"
assetDir: a11yjs-web-apps
---

Accessibility is an aspect of web development that is often overlooked. I would argue that it is as vital as overall performance and code reusability. We justify our endless pursuit of better performance and responsive design by citing the users, but ultimately these pursuits are done with the user's device in mind, not the user themselves and their potential disabilities or restrictions.

> A responsive app should be one that delivers its content based on the needs of the user, not only their device.

Luckily, there are tools to help alleviate the learning curve of accessibility-minded development. For example, GitHub recently released their accessibility error scanner, AccessibilityJS and Deque has aXe. This article will focus on a different one: [Ally.js](https://allyjs.io/), a library simplifying certain accessibility features, functions, and behaviors.

---

**One of the most common pain points regarding accessibility is dialog windows.**

There're a lot of considerations to take in terms of communicating to the user about the dialog itself, ensuring ease of access to its content, and returning to the dialog's trigger upon close.

A demo on the Ally.js website addresses this challenge which helped me port its logic to my current project which uses React and TypeScript. This post will walk through building an accessible dialog component.

![Demo of accessible dialog window using Ally.js within React and TypeScript](../../assets/articles/a11yjs-web-apps/demo-project-1.gif)

[View the live demo](https://yuschick.github.io/AllyJS-React-TypeScript-demo/)

## Project Setup with create-react-app

Before getting into the use of Ally.js, let's take a look at the initial setup of the project. The project can be [cloned from GitHub](https://github.com/yuschick/AllyJS-React-TypeScript-demo) or you can follow along manually. The project was initiated using [create-react-app](https://github.com/facebookincubator/create-react-app) in the terminal with the following options:

create-react-app my-app --scripts-version=react-scripts-ts

This created a project using React and ReactDOM version 15.6.1 along with their corresponding `@types`.

With the project created, let's go ahead and take a look at the package file and project scaffolding I am using for this demo.

{% image './src/assets/articles/a11yjs-web-apps/code-setup-1.png', 'Project architecture and package.json file' %}

As you can see in the image above, there are several additional packages installed but for this post we will ignore those related to testing and focus on the primary one, **ally.js**.

Let's install it via our terminal.

```bash
yarn add ally.js --dev
```

For now, let's leave `src/index.tsx` alone and hop straight into our `App` container.

## App Container

The `App` container will handle our state that we use to toggle the dialog window. Now, this could also be handled by Redux but that will be excluded in lieu of brevity.

Let's first define the state and toggle method.

```ts
interface AppState {
  showDialog: boolean;
}

class App extends React.Component<{}, AppState> {
  state: AppState;

  constructor(props: {}) {
    super(props);

    this.state = {
      showDialog: false,
    };
  }

  toggleDialog() {
    this.setState({ showDialog: !this.state.showDialog });
  }
}
```

The above gets us started with our `state` and the method we will use to toggle the dialog. Next would be to create an outline for our `render` method.

```jsx
class App extends React.Component<{}, AppState> {
  render() {
    return (
      <div className="site-container">
        <header>
          <h1>Ally.js with React &amp; Typescript</h1>
        </header>
        <main className="content-container">
          <div className="field-container">
            <label htmlFor="name-field">Name:</label>
            <input type="text" id="name-field" placeholder="Enter your name" />
          </div>
          <div className="field-container">
            <label htmlFor="food-field">Favourite Food:</label>
            <input
              type="text"
              id="food-field"
              placeholder="Enter your favourite food"
            />
          </div>
          <div className="field-container">
            <button
              className="btn primary"
              tabIndex={0}
              onClick={() => this.toggleDialog()}
            >
              Open Dialog
            </button>
          </div>
        </main>
      </div>
    );
  }
}
```

Don't worry much about the styles and class names at this point. These elements can be styled as you see fit. However, feel free to [clone the GitHub repo](https://github.com/yuschick/AllyJS-React-TypeScript-demo) for the full styles.

At this point we should have a basic form on our page with a button that when clicked toggles our `showDialog` state value. This can be confirmed by using [React's Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en).

So let's now have the dialog window toggle as well with the button. For this let's create a new `Dialog` component.

## Dialog Component

Let's look at the structure of our `Dialog` component which will act as a wrapper of whatever content (`children`) we pass into it.

```ts
interface Props {
  children: object;
  title: string;
  description: string;
  close(): void;
}

class Dialog extends React.Component<Props> {
  dialog: HTMLElement | null;

  render() {
    return (
      <div
        role="dialog"
        tabIndex={0}
        className="popup-outer-container"
        aria-hidden={false}
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        ref={(popup) => {
          this.dialog = popup;
        }}
      >
        <h5 id="dialog-title" className="is-visually-hidden">
          {this.props.title}
        </h5>
        <p id="dialog-description" className="is-visually-hidden">
          {this.props.description}
        </p>
        <div className="popup-inner-container">
          <button
            className="close-icon"
            aria-label="Close Dialog"
            onClick={() => {
              this.props.close();
            }}
          >
            ×
          </button>
          {this.props.children}
        </div>
      </div>
    );
  }
}
```

We begin this component by creating the `Props` interface. This will allow us to pass in the dialog's title and description, two important pieces for accessibility. We will also pass in a `close` method, which will refer back to the `toggleDialog` method from the `App` container. Lastly, we create the functional `ref` to the newly created dialog window to be used later.

The following styles can be applied to create the dialog window appearance.

```css
.popup-outer-container {
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  height: 100vh;
  justify-content: center;
  padding: 10px;
  position: absolute;
  width: 100%;
  z-index: 10;
}

.popup-inner-container {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0px 0px 10px 3px rgba(119, 119, 119, 0.35);
  max-width: 750px;
  padding: 10px;
  position: relative;
  width: 100%;
}

.popup-inner-container:focus-within {
  outline: -webkit-focus-ring-color auto 2px;
}

.close-icon {
  background: transparent;
  color: #6e6e6e;
  cursor: pointer;
  font: 2rem/1 sans-serif;
  position: absolute;
  right: 20px;
  top: 1rem;
}
```

Now, let's tie this together with the `App` container and then get into Ally.js to make this dialog window more accessible.

## App Container

Back in the `App` container, let's add a check inside of the `render` method so any time the `showDialog` state updates, the `Dialog` component is toggled.

```jsx
class App extends React.Component<{}, AppState> {

checkForDialog() {
    if (this.state.showDialog) {
      return this.getDialog();
    } else {
      return false;
    }
  }

getDialog() {
    return (
      <Dialog
        title="Favourite Holiday Dialog"
        description="Add your favourite holiday to the list"
        close={() => { this.toggleDialog(); }}
      >
        <form className="dialog-content">
          <header>
            <h1 id="dialog-title">Holiday Entry</h1>
            <p id="dialog-description">Please enter your favourite holiday.</p>
          </header>
          <section>
            <div className="field-container">
              <label htmlFor="within-dialog">Favourite Holiday</label>
              <input id="within-dialog" />
            </div>
          </section>
          <footer>
            <div className="btns-container">
              <Button
                type="primary"
                clickHandler={() => { this.toggleDialog(); }}
                msg="Save"
              />
            </div>
          </footer>
        </form>
      </Dialog>
    );
  }

render() {
    return (
      <div className="site-container">
        {this.checkForDialog()}
    );
  }
}
```

What we've done here is add the methods `checkForDialog` and `getDialog`.

Inside of the `render` method, which runs any time the state updates, there is a call to run `checkForDialog`. So upon clicking the button, the `showDialog` state will update, causing a re-render, calling `checkForDialog` again. Only now, `showDialog` is true, triggering `getDialog`. This method returns the `Dialog` component we just built to be rendered onto the screen.

_Note: The above sample includes a Button component that has not been shown._

Now, we should have the ability to open and close our dialog. So let's take a look at what problems exist in terms of accessibility and how we can address them using Ally.js.

---

Using only your keyboard, open the dialog window and try to enter text into the form. You'll notice that you must tab through the entire document to reach the elements within the dialog. This is a less-than-ideal experience. When the dialog opens, our focus should be the dialog --- not the content behind it. So let's look at our first use of Ally.js to begin remedying this issue.

## Ally.js

Ally.js is a library providing various modules to help simplify common accessibility challenges. We will be using four of these modules for the `Dialog` component.

The `.popup-outer-container` acts as a mask that lays over the page blocking interaction from the mouse. However, elements behind this mask are still accessible via keyboard, which should be disallowed. To do this the first Ally module we'll incorporate is `maintain/disabled`. This is used to disable any set of elements from being focussed via keyboard, essentially making them inert.

Unfortunately, implementing Ally.js into a project with TypeScript isn't as straightforward as other libraries. This is due to Ally.js not providing a dedicated set of TypeScript definitions. But no worries, as we can declare our own modules via TypeScript's `types` files.

In the original screenshot showing the scaffolding of the project, we see a directory called types. Let's create that and inside create a file called `global.d.ts`.

Inside of this file let's declare our first Ally.js modules.

```ts
declare module "ally.js/maintain/disabled";
```

With this module now declared in our global types file, let's head back into the `Dialog` component to begin implementing the functionality.

## Dialog Component

We will be adding all the accessibility functionality for the Dialog to its component to keep it self-contained. Let's first import our newly declared module at the top of the file.

```js
import Disabled from "ally.js/maintain/disabled";
```

The goal of using this module will be once the Dialog component mounts, everything on the page will be disabled while filtering out the dialog itself.

So let's use the `componentDidMount` lifecycle hook for attaching any Ally.js functionality.

```ts
interface Handle {
  disengage(): void;
}

class Dialog extends React.Component<Props, {}> {
  dialog: HTMLElement | null;
  disabledHandle: Handle;

  componentDidMount() {
    this.disabledHandle = Disabled({
      filter: this.dialog,
    });
  }

  componentWillUnmount() {
    this.disabledHandle.disengage();
  }
}
```

When the component mounts, we store the `Disabled` functionality to the newly created component property `disableHandle`. Because there are no defined types yet for Ally.js we can create a generic `Handle` interface containing the `disengage` function property. We will be using this `Handle` again for other Ally modules, hence keeping it generic.

By using the `filter` property of the `Disabled` import, we're able to tell Ally.js to disable everything in the document except for our `dialog` reference.

Lastly, whenever the component unmounts we want to remove this behaviour. So inside of the `componentWillUnmount` hook, we `disengage()` the `disableHandle`.

We will now follow this same process for the final steps of improving the `Dialog` component. We will use the additional Ally modules:

```bash
maintain/tab-focus
query/first-tabbable
when/key
```

Let's update the `global.d.ts` file so it declares these additional modules.

```ts
declare module "ally.js/maintain/disabled";
declare module "ally.js/maintain/tab-focus";
declare module "ally.js/query/first-tabbable";
declare module "ally.js/when/key";
```

As well as import them all into the Dialog component.

```js
import Disabled from "ally.js/maintain/disabled";
import TabFocus from "ally.js/maintain/tab-focus";
import FirstTab from "ally.js/query/first-tabbable";
import Key from "ally.js/when/key";
```

## Tab Focus

After disabling the document with the exception of our dialog, we now need to restrict tabbing access further. Currently, upon tabbing to the last element in the dialog, pressing tab again will begin moving focus to the browser's UI (such as the address bar). Instead, we want to leverage `tab-focus` to ensure the tab key will reset to the beginning of the dialog, not jump to the window.

```jsx
class Dialog extends React.Component<Props> {
  dialog: HTMLElement | null;
  disabledHandle: Handle;
  focusHandle: Handle;

  componentDidMount() {
    this.disabledHandle = Disabled({
      filter: this.dialog,
    });

    this.focusHandle = TabFocus({
      context: this.dialog,
    });
  }

  componentWillUnmount() {
    this.disabledHandle.disengage();
    this.focusHandle.disengage();
  }
}
```

We follow the same process here as we did for the `disabled` module. Let's create a `focusHandle` property which will assume the value of the `TabFocus` module import. We define the context to be the active `dialog` reference on mount and then `disengage()` this behaviour, again, when the component unmounts.

At this point, with a dialog window open, hitting tab should cycle through the elements within the dialog itself.

Now, wouldn't it be nice if the first element of our dialog was already focused upon opening?

## First Tab Focus

Leveraging the `first-tabbable` module, we are able to set focus to the first element of the dialog window whenever it mounts.

```jsx
class Dialog extends React.Component<Props> {
  dialog: HTMLElement | null;
  disabledHandle: Handle;
  focusHandle: Handle;

  componentDidMount() {
    this.disabledHandle = Disabled({
      filter: this.dialog,
    });

    this.focusHandle = TabFocus({
      context: this.dialog,
    });

    let element = FirstTab({
      context: this.dialog,
      defaultToContext: true,
    });
    element.focus();
  }
}
```

Within the `componentDidMount` hook, we create the `element` variable and assign it to our `FirstTab` import. This will return the first tabbable element within the context that we provide. Once that element is returned, calling `element.focus()` will apply focus automatically.

Now, that we have the behavior within the `dialog` working pretty well, we want to improve keyboard accessibility. As a strict laptop user myself (no external mouse, monitor, or any peripherals) I tend to instinctively press esc whenever I want to close any dialog or popup. Normally, I would write my own event listener to handle this behavior but Ally.js provides the `when/key` module to simplify this process as well.

```jsx
class Dialog extends React.Component<Props> {
  dialog: HTMLElement | null;
  disabledHandle: Handle;
  focusHandle: Handle;
  keyHandle: Handle;

  componentDidMount() {
    this.disabledHandle = Disabled({
      filter: this.dialog,
    });

    this.focusHandle = TabFocus({
      context: this.dialog,
    });

    let element = FirstTab({
      context: this.dialog,
      defaultToContext: true,
    });
    element.focus();

    this.keyHandle = Key({
      escape: () => {
        this.props.close();
      },
    });
  }

  componentWillUnmount() {
    this.disabledHandle.disengage();
    this.focusHandle.disengage();
    this.keyHandle.disengage();
  }
}
```

Again, we provide a `Handle` property to our class which will allow us to easily bind the `esc` functionality on mount and then `disengage()` it on unmount. And like that, we're now able to easily close our dialog via the keyboard without necessarily having to tab to a specific close button.

Lastly (**whew!**), upon closing the dialog window, the user's focus should return to the element that triggered it. In this case, the Show Dialog button in the `App` container. This isn't built into Ally.js but a recommended best practice that, as you'll see, can be added in with little hassle.

```jsx
class Dialog extends React.Component<Props> {
  dialog: HTMLElement | null;
  disabledHandle: Handle;
  focusHandle: Handle;
  keyHandle: Handle;
  focusedElementBeforeDialogOpened: HTMLInputElement | HTMLButtonElement;

  componentDidMount() {
    if (
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLButtonElement
    ) {
      this.focusedElementBeforeDialogOpened = document.activeElement;
    }

    this.disabledHandle = Disabled({
      filter: this.dialog,
    });

    this.focusHandle = TabFocus({
      context: this.dialog,
    });

    let element = FirstTab({
      context: this.dialog,
      defaultToContext: true,
    });

    this.keyHandle = Key({
      escape: () => {
        this.props.close();
      },
    });
    element.focus();
  }

  componentWillUnmount() {
    this.disabledHandle.disengage();
    this.focusHandle.disengage();
    this.keyHandle.disengage();
    this.focusedElementBeforeDialogOpened.focus();
  }
}
```

What has been done here is a property, `focusedElementBeforeDialogOpened`, has been added to our class. Whenever the component mounts, we store the current `activeElement` within the document to this property.

> It's important to do this before we disable the entire document or else document.activeElement will return null.

Then, like we had done with setting focus to the first element in the dialog, we will use the `.focus()` method of our stored element on `componentWillUnmount` to apply focus to the original button upon closing the dialog. This functionality has been wrapped in a type guard to ensure the element supports the `focus()` method.

Now, that our `Dialog` component is working, accessible, and self-contained we are ready to build our App.

---

With [Ally.js](https://allyjs.io/) incorporated into your React and TypeScript project, more steps can be taken to ensure your content can be consumed by all users, not just all of their devices.

![Accessible Web Apps w/ React, TypeScript & AllyJS Demo](../../assets/articles/a11yjs-web-apps/demo-project-1.gif)

For more information on accessibility and other great resources please visit these resources:

- [Accessible Web Apps with React, TypeScript & Ally.js on Github](https://github.com/yuschick/AllyJS-React-TypeScript-demo)
- [Start Building Accessible Web Applications Today](https://egghead.io/courses/start-building-accessible-web-applications-today)
- [HTML Codesniffer](http://squizlabs.github.io/HTML_CodeSniffer/)
- [Web Accessibility Best Practices](https://www.webaccessibility.com/best_practices.php)
- [Writing CSS with Accessibility in Mind](https://medium.com/@matuzo/writing-css-with-accessibility-in-mind-8514a0007939)
- [Accessibility Checklist](http://romeo.elsevier.com/accessibility_checklist/)
