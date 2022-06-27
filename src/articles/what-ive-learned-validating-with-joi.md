---
title: What I've Learned Validating with Joi
date: 2018-03-24
layout: article.njk
tags:
  - articles
  - react
  - frontend
  - joi
preview: "I'll be honest, despite all of my experience as a front-end developer I haven't had a lot of projects that dealt heavily with forms and data. Form validation was just something I never really had to work with much. My most recent project, however, is entirely form- and data-driven and I needed a way to easily handle front-end validation. For this, I turned to Joi."
description: "My most recent project is entirely form- and data-driven and I needed a way to easily handle some complex front-end validation. For this, I turned to Joi."
socialImage: joi/social-image.jpg
---

I'll be honest, despite all of my experience as a front-end developer I haven't had a lot of projects that dealt heavily with forms and data. Form validation was just something I never really had to work with much. My most recent project, however, is entirely form- and data-driven and I needed a way to easily handle front-end validation. For this, I turned to [Joi](https://github.com/hapijs/joi).

Joi is a validation library that allows you to build schemas to validate JavaScript objects. And what that generally means to me is Joi provides methods to easily validate common data types, such as e-mail addresses and phone numbers. But I've also learned that it allows you to easily validate less common data and complex data structures.

> And it was here, in Joi's simplification of complex validation, where I found the urge to share what I've learned.

## Setting Up

For this project, which consisted of React, Redux, and TypeScript, the validation needed to occur on the front end in the browser. Because of this I leveraged both Joi and [Joi-Browser](https://github.com/jeffbski/joi-browser).

```bash
yarn add joi --dev && yarn add joi-browser --dev
```

With the libraries installed Joi can be imported into your validation file and the writing of schemas can begin.

```js
import * as Joi from "joi-browser";
```

When validating with Joi, two pieces of data are needed:

1.  The data object to validate
2.  The Joi schema

```js
Joi.validate(data, schema, [options]);
```

An optional third argument could be supplied to customise the validation behaviour but I won't be covering that in this post.

## The Basics

### Validating Strings

This particular project consisted of multiple forms with general information fields --- the user's name, address, e-mail, and phone number. These fields are pretty straight forward and quite fittingly so is the validation.

Let's take a look at an example of some data:

```js
const data = {
  name: "Sydney Prescott",
  address: "1996 Woodsboro Ln",
  email: "sydney.prescott@woodsborocc.edu",
  phone: "2135551997",
};
```

With this general data structure, we can begin writing our Joi schema for validation. Let's begin with the strings.

```js
const schema = Joi.object().keys({
  name: Joi.string().required(),
  address: Joi.string().required(),
  email: Joi.string().email().required(),
});
```

One thing I really like about Joi is how it reads. From the schema above it is pretty clear to see what we're expecting of each property. Additionally, by adding the `required()` method we can quickly organise important data while being able to double up on the `required` property on form fields themselves for extra security.

The address field, however, required additional consideration. While living in the States I didn't think much about additional characters outside of our alphabet. Having moved to Finland, though, made me realise that I must now account for values that have characters such as `Ää` and `Öö`. Luckily, Joi provides additional ways to support such circumstances.

```js
address: Joi.string()
  .trim()
  .regex(/^[a-z\d\s\-\.\,]*$/i)
  .max(100)
  .required();
```

The schema above introduces a couple nice options. First, the `trim()` method will remove any trailing spaces from the value. The `max()` method is also used to limit the length of the value to 100 characters.

But the primary method I'd like to draw attention to here is `regex()`. This method allows greater control over what values are supported --- virtually extending the default `string()` validation and adding custom behaviour on top.

If you had noticed, our data object stores the phone number as a string. Let's see how we can leverage the `regex()` method in our schema for this case.

```js
phone: Joi.string()
  .trim()
  .regex(/^[0-9]{7,10}$/)
  .required();
```

By using the `regex()` method here, we can validate the string to ensure its value is 7--10 characters all of which fall between 0 and 9.

But you won't always be storing phone numbers as strings. Eventually, validation for number fields will need to written and Joi makes this just as direct.

### Validating Numbers

Let's look at the following example data:

```js
const data = {
  salary: 48000,
  age: 30,
};
```

Assuming we're looking for users between the ages of 18 and 65 our schema could look like the following:

```js
const schema = Joi.object().keys({
  salary: Joi.number().required(),
  age: Joi.number().min(18).max(65).required(),
});
```

Again, the readability of Joi is a big selling point as the use of the `min()` and `max()` methods quickly convey how we're validating our data.

However, we won't always have such defined ranges like 18 and 65. So how can data be validated against other data values?

## Validate Against Data References

In this particular project, which deals with applying for a loan, the user is asked to specify both their total wealth as well as their total savings and investments. Because a person's savings is part of their total wealth, the `savings` field should never be greater than the `totalWealth` value. But since we won't know those values until the time of validation, Joi provides the `ref()` method for situations exactly like this.

```js
const data = {
  totalWealth: 5000,
  savings: 10000,
};

const schema = Joi.object().keys({
  totalWealth: Joi.number().required(),
  savings: Joi.number().max(Joi.ref("totalWealth")).required(),
});
```

Inside of the `max()` method the value of `totalWealth` is referenced by using Joi's `ref()` method and passing in the key of the target field. With this schema our `data` object would error.

## Conditional Validation

There's a fair chance you've either used or built a form with conditional fields. For example, why show the user fields concerning credit card debt if the user selected "No" to owning any credit cards? Our validation should follow the same logic --- only validate certain fields when other criteria is met.

```js
const data = {
  hasCreditCards: true,
  creditCardDebt: 750,
  creditCardMonthlyPayment: 75,
};
```

With the data model above and understanding our need for conditional validation, let's look at our Joi schema.

```js
const schema = Joi.object().keys({
  hasCreditCards: Joi.bool().required,
  creditCardDebt: Joi.number().when("hasCreditCards", {
    is: true,
    then: Joi.number().min(0).required(),
  }),
  creditCardMonthlyPayment: Joi.number().when("hasCreditCards", {
    is: true,
    then: Joi.number().min(0).required(),
  }),
});
```

In this example, the `when()` method is leveraged. Again, Joi reads quite clearly --- when `hasCreditCards` is `true` then validate using the following schema.

---

But let's say we wanted to expand our data model to include an array of credit card objects, all containing their own individual values.

```js
const data = {
  hasCreditCards: true,
  allCreditCards: [
    {
      type: "Visa",
      balance: 250,
      payment: 25,
    },
    {
      type: "Discover",
      balance: 1200,
      payment: 100,
    },
  ],
};
```

In this case, we have an array with a variable number of objects that we need to validate only if the user `hasCreditCards`. Let's start with what we know:

```js
const schema = Joi.object().keys({
  hasCreditCards: Joi.bool().required(),
  allCreditCards: Joi.array().when('hasCreditCards', {
    is: true,
    then: ...
  }
});
```

Again, using the `when()` method, we can conditionally validate the `allCreditCards` array. The next step is to validate the individual properties of each object within the array.

```js
then: Joi.array().items({
  type: Joi.string().required(),
  balance: Joi.number().required(),
  payment: Joi.number().required(),
});
```

By using the `items()` method, we define the contents of the array. In this specific case, the items are an object but this method can support any combination of comma-separated Joi schemas.

For example, if our array would only contain a required string and an optional number our schema could look like this:

```js
Joi.array().items(Joi.string().required(), Joi.number());
```

---

Back to our original credit card example, though. Let's say we want to have more control over which credit card providers are supported. For example, my Discover card isn 't accepted anywhere in Finland (like literally, anywhere!). So how could we write our validation to include and/or exclude particular values?

```js
then: Joi.array().items({
  type: Joi.string()
    .valid(["Visa", "Mastercard"])
    .invalid("Discover")
    .required(),
  balance: Joi.number().required(),
  payment: Joi.number().required(),
});
```

By using the `valid()` and `invalid()` methods greater control can be applied to the validation. This can be nicely paired with `enum` values as well.

Now, for it all together.

```js
const schema = Joi.object().keys({
  hasCreditCards: Joi.bool().required(),
  allCreditCards: Joi.array().when("hasCreditCards", {
    is: true,
    then: Joi.array().items({
      type: Joi.string()
        .valid(["Visa", "Mastercard"])
        .invalid("Discover")
        .required(),
      balance: Joi.number().required(),
      payment: Joi.number().required(),
    }),
  }),
});
```

Cue the record scratch but yet again I love how quickly this can be read and understood. My hat goes off to the work done with the naming within Joi.

---

Joi is capable of doing so much more than what I've covered here and luckily, their documentation ([found here](https://github.com/hapijs/joi/blob/v13.1.2/API.md)) is terrific. I feel this project has given me a great crash course on validation and using Joi to do some things that would otherwise be quite challenging.

Well done, Joi.
