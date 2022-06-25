---
title: Netlify Deploy Treating Warnings as Errors
date: 2020-06-17
layout: article.njk
tags:
  - articles
  - netlify
preview: "If you're like me, you were minding your own business and deploying your latest feature to staging. And if you're even more like me, you're not in the habit or monitoring every single deploy but your pipeline just works. Until it doesn't."
description: "Deploying to Netlify can be so streamlined, it's just assumed deployments work. Until they don't."
---

If you're like me, you were minding your own business and deploying your latest feature to staging. And if you're even more like me, you're not in the habit or monitoring every single deploy but your pipeline just works.

Until it doesn't.

This morning's deploy came to a grinding halt with the following error:

```
Treating warnings as errors because process.env.CI = true.
```

![Brooklyn 99 --- Oh, cool](https://cdn-images-1.medium.com/max/1600/0*jtu0mBdGPhI4wRxU.gif)

Luckily, for as daunting as the error may seem, there's a pretty straight forward fix to it.

```bash
process.env.CI = true
```

Let's set that to `false` and carry on like the wayward children we are.

## How to Fix

There are two ways this error may be fixed and it depends on your build setup.

### Netlify.toml

If the build command for your project is handled in the `.toml` file, then the fix can be made there as well by manually setting `CI` to false inside of our build command.

> Note, that the `.toml` file takes precedence over the build settings stored in Netlify.

```yml
[build]\
 command = "**CI=false &&** yarn build"\
 publish = "build"
```

### Netlify Build Settings

If there is not a `netlify.toml` file in the project, the build settings can be handled directly in Netlify. By navigating to **Settings** --- **Build & Deploy** --- **Continuous Deployment --- Build Settings**, you can update the build command to set `CI=false` for each build.

![Netlify build settings](https://cdn-images-1.medium.com/max/1600/1*XzUEhD0-B9oiAWGwfwXJUA.png)

One caveat, in the event that adding `CI=false` to the build command _still_ doesn't work, trying setting `CI=""` because older versions of `react-scripts` behave differently and may require an empty string. More information can be found in this thread: <https://github.community/t/treating-warnings-as-errors-because-process-env-ci-true/18032>
