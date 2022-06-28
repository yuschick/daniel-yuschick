---
title: Art Direction with Gatsby Image & the Aspect Ratio Bug
date: 2020-05-04
layout: article.njk
tags:
  - articles
  - css
  - frontend
  - gatsby
preview: "I'll be real; when I first entered the Gatsby ecosystem and tried to load my first image, I was like 'whaaaaaaat?'. And if I was that befuddled trying to load a single picture, how in the world was I going to wrangle Gatsby Image into handling fluid art-directed images, compression, and formatting with broad support?"
description: "How in the world was I going to wrangle Gatsby Image into handling fluid art directed images, compression, and formatting with broad support? In a word–easily(ish)."
assetDir: gatsby-art-direction
---

I'll be real; when I first entered the Gatsby ecosystem and tried to load my first image, I was like '_whaaaaaaat?'_. And if I was that befuddled trying to load a single picture, how in the world was I going to wrangle Gatsby Image into handling fluid art-directed images, compression, and formatting with broad support?

In an unexpected word--easily(_ish_).

In a lot more words...

## Gatsby Image

The web would be trash without pictures but it's also trash whenever those pictures take....way.....too......long to load. Enter [Gatsby Image](https://www.gatsbyjs.org/packages/gatsby-image/), an incredibly powerful plugin for optimizing and serving your images.

**_Note:_**I won't be going into much detail of getting started with Gatsby Image so if you're brand new to it, I would recommend the* [*official docs*](https://www.gatsbyjs.org/packages/gatsby-image/#install) *first to gain a base understanding on installation and getting started.\*

After I got my head around using the (surprisingly fun) GraphQl UI to construct my image queries, I found myself playing with a lot of features and experimenting with what I could do and how I could apply it to my most recent project. Once I felt more familiar with the process, I defined the requirements for my primary header image and set off to construct my query.

**The Requirements**

- I needed different images at different widths--art direction
- I needed to serve `webp` images for better performance with fallbacks

{% image './src/assets/articles/gatsby-art-direction/site-header-1.jpeg', 'Daniel Yuschick in Hang En Cave, taken by @nome_sapien' %}

## Art Direction

Because my primary image was wide and short, it looked good on large displays, but on smaller screens, it became too compressed and indistinguishable. So I made several different versions, each one cropped tighter than the last, so as displays narrowed, the image aspect ratio adapted.

I ended up with five images with px dimensions and (aspect ratios) as follows:

- 2500 x 999 (2.5:1)
- 2000 x 888 (2.25:1)
- 1500 x 666 🤘 (2.25:1)
- 1000 x 571 (1.75:1)
- 500 x 333 (1.5:1)

I opened Gatsby's GraphQl UI and began constructing my query. I started by querying a single image.

```js
query HeaderImageQuery {
  file(relativePath: {eq: "header-500.jpg"}) {
    childImageSharp {
      fluid(**maxWidth: 500**) {
        aspectRatio
        base64
        sizes
        src
        srcSet
      }
    }
  }
}
```

This is a standard `file` query which selects `header-500.jpg`. Additionally, it tells Gatsby Image to treat the photo as `fluid` with a `maxWidth` of `500`px. When this photo is ultimately rendered Gatsby Image will place it inside a container and use the image's aspect ratio to size the container, ensuring it scales smoothly without distortion. You can read about this practice [here](https://css-tricks.com/aspect-ratio-boxes/).

Now, I needed to expand this query to include the other versions of my header image. To do that, I created an object query and assigned a key to each `file` request.

```js
query HeaderImageQuery {
  img500: file(relativePath: {eq: "header-500.jpg"}) {
    childImageSharp {
      fluid(maxWidth: 500) {
        aspectRatio
        base64
        sizes
        src
        srcSet
      }
    }
  }
  img1000: file(relativePath: {eq: "header-1000.jpg"}) {
    childImageSharp {
      fluid(maxWidth: 1000) {
        aspectRatio
        base64
        sizes
        src
        srcSet
      }
    }
  }
  *...repeat for the remaining images*
}
```

After testing this query in the GraphQl UI, it was time to bring it into my codebase which is where I could address one of my requirements--formatting the images to `webp` with a fallback where the filetype isn't supported.

I did this by using the `GatsbyImageSharpFluid_withWebp` [query fragment](https://www.gatsbyjs.org/packages/gatsby-image/#fragments) provided by Gatsby Image. This query will now optimize the base `jpg`s but also create `webp` versions on build. Because not all browsers support `webp` we need the `jpg`s available as fallbacks. These will come into play in a moment when we render the images.

```js
import { useStaticQuery, graphql } from "gatsby"

const Header: React.FunctionComponent = () => {
  **const data = useStaticQuery(graphql`**
    query HeaderImageQuery {
      img500: file(relativePath: {eq: "header-500.jpg"}) {
        childImageSharp {
          fluid(maxWidth: 500) {
            ...GatsbyImageSharpFluid_withWebp
            aspectRatio
            base64
            sizes
            src
            srcSet
          }
        }
      }
      *...repeat for the remaining images*
    }
  `)
  *...other component stuff we'll get to*
}
```

After this query executes, the `data` variable looks something like this:

```js
const data = {
  img500: { ... },
  img1000: { ... },
  img1500: { ... },
  img2000: { ... },
  img2500: { ... },
}
```

Typically, whenever querying a single fluid image, the data would be passed into the Gatsby Image `Img` component as is.

```js
import Img from "gatsby-image";

<Img fluid={data.node.childImageSharp.fluid} alt="Single image" />;
```

But in this case, I've queried five images and, as a result, can't pass the `data` object to the `Img` component the same way. Instead, I have to use the `data` object to build a `sources` array and _that_ is what we'll pass into the component.

The `sources` array contains an object for each queried image which contains the `childImageSharp.fluid` data, as seen above, and a `media` query to determine when the image should be used.

```js
const sources = [
  {
    ...data.img500.childImageSharp.fluid,
    media: '(max-width: 500px)'
  },
  *...repeat for the remaining images
*]
```

If you're familiar with writing CSS media queries, that should make some sense. If not, what I'm doing in the code snippet above is saying '_use the img500 query data whenever the display width is 500px or smaller_'.

Once I created the `sources` array, I could pass it to the `Img` component.

```js
import Img from "gatsby-image"

const sources = [
  {
    ...data.img500.childImageSharp.fluid,
    media: '(max-width: 500px)'
  },
  *...repeat for the remaining images
*]

return (
  <Img
    sources={sources}
    fluid={sources}
    alt="Daniel Yuschick by @nome_sapien"
  />
)
```

The `Img` component will render HTML `picture` elements containing the source data for all of the freshly-optimized-and-formatted images. This includes the `jpg`s as well as the `webp` images, allowing browsers to display `webp` where supported and the `jpg` otherwise.

I rushed to scientifically test this by dragging my browser window from large to small and back again to watch the header image scale and adjust smoothly.

Only it didn't.

![Deandre Jordan of the Los Angeles Clippers exclaiming "What the fuck"](https://cdn-images-1.medium.com/max/1600/0*fpv-Bmg_26wx-4sx.gif)

## Gatsby Image Aspect Ratio Bug

Don't worry, I also found it dry that I spent time mentioning image aspect ratios earlier. But it led us here.

You see, whenever building the `sources` array, Gatsby Image takes the aspect ratio of the first image and ignores the others. This is important because when displaying `fluid` images, Gatsby Image uses the aspect ratio to size the wrapper. So if the aspect ratio is off, so is the scale and appearance of the fluid image.

So whenever I put `img500` at the beginning of my array, the header looked great on mobile but far too large on desktop. Whenever I put `img2500` first, the header looked perfect at full size but far too small on mobile. It was like _Goldilocks and the Three Bears_ except I never threw F-bombs so liberally at porridge.

Resolving this issue took a little CSS brute force.

We need to select the `div` element Gatsby Image uses to size our images and update its `padding-bottom` value manually. Luckily, despite Gatsby Image only using the first image's aspect ratio, our query returns the value for each image queried. Those values, or in my case, the `sources` array itself, can be used to create CSS rules to overwrite the incorrect `padding-bottom` values calculated by Gatsby Image.

_Note, I am using_ [_Styled Components_](https://styled-components.com/) _so the syntax may not be what you're using but the premise remains the same--use the aspect ratios returned in the query to define new CSS rules at specific breakpoints._

```js
const ResponsiveImage = styled(Img)`
  > div:first-child {
    @media (max-width: 500px) {
      padding-bottom: ${(props) =>
        `${100 / props.sources[0].aspectRatio}% !important`};
    }
    @media (min-width: 501px) and (max-width: 1000px) {
      padding-bottom: ${(props) =>
        `${100 / props.sources[1].aspectRatio}% !important`};
    }
  }
`;
```

Now, I know, I'm using `!important`. Gross. But in this case we need it to override the specificity of the directly-applied values from Gatsby Image.

With these styles in place, I returned to my browser, held my breathe, and resized the window.

{% image './src/assets/articles/gatsby-art-direction/site-demo-1.gif', 'Window resizing to demonstrate aspect ratio fix' %}

From the gif above you can see at smaller widths, the header image is cropped more tightly to retain height and focus while at larger widths, it has a wider aspect ratio to keep the height from filling the entire viewport and the image from distorting.

## Review

Let's return to my original requirements and see how Gatsby Image addressed them.

**✅ I needed different images at different widths--art direction**

Using Gatsby's GraphQl UI, I was able to create an object of fluid image queries for each image I wanted to display. I passed that response into Gatsby Image's `Img` component and then resolved the aspect ratio bug with CSS.

**✅ I needed to serve** `**webp**` **images for better performance with fallbacks**

By including the `GatsbyImageSharpFluid_withWebp` query fragment from Gatsby Image, my images were formatted to `webp` at build time with fallback `jpg`s optimized and ready to display if needed.

---

Set aside the bug with aspect ratios, which isn't going to be an issue for everyone, I found this process to be much more convenient than I first expected. Gatsby Image has left me impressed and with a sense of wielding immense power.

![Doom Guy wields all the power.](https://cdn-images-1.medium.com/max/1600/0*hwHCEwUy88n5VOhz.gif)

### Resources

- [Gatsby Image](https://www.gatsbyjs.org/packages/gatsby-image/)
- [Gatsby Image Art Direction](https://www.gatsbyjs.org/packages/gatsby-image/#art-directing-multiple-images)
- [GitHub Issue: Gatsby Image doesn't support different aspect ratios](https://github.com/gatsbyjs/gatsby/issues/15189)
