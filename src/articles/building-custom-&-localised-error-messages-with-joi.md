---
title: Building Custom & Localised Error Messages with Joi
date: 2018-05-04
layout: article.njk
tags:
  - articles
  - react
  - frontend
  - i18n
  - react-intl
  - joi
preview: "In my previous article, 'What I've Learned Validating with Joi', I detailed general form validation that plays to the strengths of Joi in my latest project. But an area of weakness in the library is one I had set out to tackle since - displaying custom internationalisation (i18n) error messages."
description: "Joi does so many things well but falls short in providing custom error messages. This post shows that custom & localised errors are not only possible but quite flexible."
---

In my previous article, [What I've Learned Validating with Joi](/articles/what-ive-learned-validating-with-joi/), I detailed general form validation that plays to the strengths of Joi in my latest project. But an area of weakness in the library is one I had set out to tackle since - displaying custom internationalisation (i18n) error messages.

First, there are libraries like [Relish](https://github.com/dialexa/relish) that help address this issue but I believed there was a solution without bringing in another library. I set out to rewrite the project's validation from scratch for two reasons; 1) to simplify logic that was becoming a challenge to scale and 2) gain a deeper understanding of Joi and how it can be used.

---

So where do you even start? I started with the most minimalist approach that mimicked the project's current implementation. I wanted to validate one small piece of data to create an error so I could review the raw data returned from Joi.

```js
import * as Joi from "joi-browser";

const data = {
  age: 18,
};

const schema = {
  age: Joi.number().min(21),
};

console.dir(Joi.validate(data, schema));
```

When that validation failed, Joi returned an object with four properties, `catch`, `error`, `then`, and `value`. The two important properties here are `error`, which contains all the relevant error data, and `value`, which contains the original data source. That's good to verify that the data you're validating is what you're expecting. We will focus on the `error` object though.

When you expand the `error` object you find a few more properties but we will focus immediately on `details`, an array containing each individual error object.

Let's dig into the `details` error object from the validation above.

![Raw error object returned from Joi](../../assets/articles/joi-i18n-messages/error-output-1.png)

The object contains a lot of great information. It may not all be useful to us _yet_ but we will soon convert this into data that we can use to achieve our goal of custom i18n error messages.

So what data will be useful for us? Ultimately, what do we need to achieve our goal? The target data I sketched out looked like this:

```js
{
  type: what type of error was thrown?,
  field: what field has the error?,
  errorMsg: what error message is shown?
}
```

I wrote that structure down and sought out to build that with the data provided by Joi.

How do we build each property?

## Type

The `type` property provided by Joi is vitally important. In the example above it returns `number.min` which is the validation method that caused the error. The `type` sent back from Joi directly relates to the error-causing method and, most importantly, is consistent based on the method names.

With this information we can begin to target messages. For example, when there is a `number.min` error `type` we could return a message like _"Sorry, you must be at least 21 to enter."_

But what if there is a field later in the app that requires the user to earn at least $500/month.

```js
const data = {
  income: 100,
};

const schema = {
  income: Joi.number().min(500),
};
```

When that data is validated it'll also return a `number.min` error type which would result in the same _"Sorry, you must be at least 21 to enter."_ That's not what we want. So we need to learn how to target the specific field next.

## Path

To create the error messages I would need to know for which field the error occurred. In order to do that I had to better understand the `path` property. This property returns the steps taken within the `schema`. In our `schema` above, we only had one level which results in what we see, `['age']`.

But let's modify our earlier example to demonstrate how the `path` is generated.

```js
const data = {
  customer: {
    income: 100,
  },
};

const schema = {
  customer: {
    income: Joi.number().min(500),
  },
};
```

By updating our structures this error now returns a new `path` value.

```js
path: ["customer", "income"];
```

Ultimately, the value of the `path` property will be used to determine which field has an error. The `path` value could be mapped to be useful to us.

```js
const field = path.join("_");
```

> Also note that if your schema does not have any named properties, the `path` property will be null.

If you're certain you won't have any conflicting property names anywhere in the `data` and `schema`, you could get by with mapping only the last value of the `path` array. I prefer to `join` because, personally, I have to handle validating an array with a variable number of objects.

```js
const data = {
  movies: [
    { title: "Halloween", year: 1978 },
    { title: "The Shining", year: 1980 },
    { title: "Sleepaway Camp", year: 1983 },
  ],
};

const schema = {
  movies: Joi.array().items({
    title: Joi.string(),
    year: Joi.number().max(1979),
  }),
};

console.dir(Joi.validate(data, schema, { abortEarly: false }));
```

In the example above we have three movies listed but we only want movies that were released before the 80's. By default, Joi will escape validation once it hits the first error. To emphasise the point of `join`ing the `path` above, we override that functionality by passing in our options object into the `validate` method.

```js
{
  abortEarly: false;
}
```

The above snippet will return an error object that partially looks like this:

![Error object from Joi demonstrating multiple error paths](../../assets/articles/joi-i18n-messages/error-output-2.png)

If you were to always grab the last value of the `path` property to identify the field with the error, you'd have a conflict here as both errors exist on the `year` field. By `join`ing the `path` array, I can still receive unique identifiers based on their array index.

```bash
movies_1_year
movies_2_year
```

### So what do we have now?

Now, we have two pieces of valuable information.

1.  We have the error type like `number.min` or `number.max`.
2.  We have a unique field identifier like `age` or `movies_1_year`.

```js
{
  type: 'number.min',
  field: 'age',
  errorMsg: what error message is shown?
}
```

Next we need to choose the error message based on the previous two pieces of information.

## Message

While the Joi error object returns a generally suitable error message, our goal is to have messages that we can easily localise and customise. The project where I have implemented this is built on React and translations are handled using [React-Intl](https://github.com/yahoo/react-intl) so the examples will be based around that format.

To display a localised message with `react-intl` I commonly use its `FormattedMessage` component.

```jsx
import { FormattedMessage } from "react-intl";

<FormattedMessage id="app_continue" />;
```

From there, the `FormattedMessage` component will search the current locale's `i18n` file for the key `app_continue` and return its value such as `Jatkaa` in Finnish or `Continue` in English.

So what we want to get our heads around here is that our `message` property won't be our _message_ but our _message id_. We can (and should) rename the property to communicate that in our error object.

For the sake of consistency, we need to define a structure to our `i18n` error ids. Let's use the following:

```js
error.[FIELD].[TYPE]
```

If we update our mapped object we can see that we now mapped the data that we need.

```js
{
  type: 'number.min',
  field: 'age',
  errorMsgId: `error.${field}.${type}`
}
```

With that mapped object, we now know which field has an error, which type of error it is, and which message id to show.

---

Let's take a step back now and review our earlier situation with the `age` and `income` restriction errors and how our mapped object addresses this.

In our `i18n` file we could have the following `id`s:

'error.age.number.min': 'You must be 21 to enter.',\
'error.income.number.min': 'You must make at least $500/month'

By using the `type`, the `path`, and building our `errorMsgId` we can now achieve custom localised error message.

## Mapping Our Object

Okay, so we've covered what we're building and why we're building it. So let's piece it all together by walking through how we can map the Joi error object to our new object.

```js
export const validateData = (data, schema) => {
  const options = { abortEarly: false };
  const errors = Joi.validate(data, schema, options);

  return errors.error ? buildUsefulErrorObject(errors.error.details) : null;
};

const buildUsefulErrorObject = (errors) => {
  const usefulErrors = {};

  errors.map((error) => {
    if (!usefulErrors.hasOwnProperty(error.path.join("_"))) {
      usefulErrors[error.path.join("_")] = {
        type: error.type,
        msg: `error.${error.path.join("_")}.${error.type}`,
      };
    }
  });

  return usefulErrors;
};
```

## Whew!

That's quite the block of code so let's break it down.

### validateData

This is the main function I call. This accepts the `data` and `schema` arguments. Nothing crazy happens here as I then send them into `Joi.validate()` and store the results in the `errors` constant. If that contains any errors then we go into our mapping process.

### buildUsefulErrorObject

This is where the magic happens. The function checks to see if the `usefulErrors` object contains the error key already, if not, it creates it and builds the content. If the key already exists, it skips it which again shows some value in `join`ing the `path` names as the field identifier.

Using the `age` and `income` errors from above, let's see how our `usefulErrors` object would look.

```js
{
  age: {
    type: 'number.min',
    msg: 'error.age.number.min'
  }, {
  income: {
    type: 'number.min',
    msg: 'error.income.number.min'
  }
}
```

Ultimately, this is the object I return back to my app and store in my `invalidFields` state property.

## Displaying the Error Messages

With that object stored in the state, it can be used to show error messages in the app with the following methods:

```js
isInvalid(key) {
  return !!this.props.data.invalidFields.hasOwnProperty(key);
}

getErrorLabelKey(key) {
  return this.props.data.invalidFields[key] ?
    this.props.data.invalidFields[key].msg :
    '';
}
```

Using those methods, an error message can be displayed by checking to see if that field's name exists as a key in our `invalidFields` object (`isInvalid`) and then grabbing the correct message (`getErrorLabelKey`).

```jsx
<div className="error-container">
  { this.isInvalid('age') ?
    <FormattedMessage id={this.getErrorLabelKey('age')} /> :
    <span/>;
  }
</div>
```

---

It's not the most direct solution. I understand that. But rewriting my project's validation allowed me to solve the problem of custom localised error messages while gaining a better understanding of Joi. This provides flexibility and the ability to scale as the forms and their validation grow.

Given how frequently I see this issue arise, I am hoping this post can help others dealing with the same challenge.
