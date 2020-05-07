[![Daniel Yuschick](https://github.com/yuschick/daniel-yuschick/raw/master/repo-header.jpg)](http://www.danyuschick.com)

Can you believe it’s been three years since I’ve last updated my personal website? Three!?!? I sure can’t. Since then, I’ve moved countries, visited many others, completed my horror movie sleeve, written a novel, and am currently laid off surviving a pandemic.

Of course, in similarly dramatic fashion, the world of frontend development has also changed. It was about time my personal site did, too.

### The Goals

When I first started with design ideas, the goal was simple–simplicity. I wanted simple content, simple maintenance, and simple consumption.

My previous sites, dating as far back as I can remember, focused solely on my life as a frontend developer but I didn’t want that anymore. Instead, I wanted something more high level and broad. I wanted to create a site that represented more of me, my interests, goals, and personality.

That said, with a clear primary goal, my developer sense tingled and I was ready to explore some new (to me) tech and tooling.

### Tech Stack

It must have been muscle memory because once I decided to create my repo and architect the site, I opened my terminal and started typing `create-react-app`. When I built my last site, I was quite new to React. Three (!?!?!) years later and its apparently second nature.

I wanted to change it up, but like, only a bit.

Enter **Gatsby**.

Two areas my last site suffered were performance and SEO. Sacrilegious, I know! Using Gatsby as my framework seemed to address both of those concerns out of the box along with so much more. I liked the idea of serving static pages, which worked for a lot of my content, but with the ability to write `fetch` queries for dynamic content where I needed it.

It took about a day for me to become productive in the new environment. I mean, _why do I have to write a GraphQl query to display an image!?_ But after that initial learning curve, I started seeing the benefits of the endeavour. I was excited about the improved performance, wide ecosystem of plugins, the incredible feature set of Gatsby Image, and about digging into something new.
That feeling is the reason I got into development all those years ago and still enjoy it.

With the framework in place, adding in other familiar pieces like **Netlify**, **GraphQl**, **TypeScript**, and **Styled Components** gave me a chance to get more experience with tools I already use.

The initial MVP took a week(ish) of all-consumed development, and now that the proverbial dust is settling, it’s nice taking a step back to digest what just happened.

### Takeaways

While building the site, I’d taken note of several things that had either given me trouble or kept me from it. Most of them will become full posts themselves but I wanted to highlight them here.

#### Gatsby Image

Believe it or not, after the rough start, Gatsby Image turned out to be one of my favorite pieces of this project. After getting my head around it, the ability to optimize images for countless settings and format them with fallbacks not only handled my images better than I could have done myself but it did so in a fraction of the time I would have spent.

Read more about my experience with Gatsby Image:
[Art Direction with Gatsby Image & the Aspect Ratio Bug](https://medium.com/swlh/art-direction-with-gatsby-image-the-aspect-ratio-bug-8281f7a8594c)

#### CSS Clamp()

I stumbled across `clamp()` while looking into fluid typography options. The main process I was familiar with involves writing `calc` equations against the display width that, for me, made the code hard to read. The result wasn’t visible in the code and I felt helpless when it came to extreme display sizes. However, using `clamp()` addressed both of those concerns by allowing me to define minimum and maximum font-sizes and let the font scale fluidly between the two. I may not know the exact font-size on a specific phone or 24" monitor but I do know it’ll be within that range and that’s good enough for me.

Read more about how I used `clamp()`:
[Fluid Typography with CSS Clamp() is My New Favorite Thing](https://medium.com/@Yuschick/fluid-typography-with-css-clamp-is-my-new-favorite-thing-573d0b8d7bfc)

#### Fighting CORS with Netlify Functions

I don’t know many developers who haven’t dropped an F-bomb or two at CORS errors. While in local development, it’s fine prefacing third-party API requests with a proxy like CORS-Anywhere but in production, that’s just not going to fly.

Luckily, Netlify Functions stepped up in the clutch. Using the Netlify CLI, I was able to create a node-fetch proxy that runs both locally and in production to bypass infuriating CORS issues. [*sigh of relief*]

#### Spotify Auth

This one is just a personal victory. For some reason, I’ve had a mental block toward the Spotify API and its authorization process. But I was determined to display my love of power metal on this site. I worked my way through all the codes, tokens, and secrets to finally unravel that mystery.

### Final Thoughts

From the design to the implementation, I’m so excited about this site. I believe it’s a good representation of both who and where I am as an individual. Taking on some new tech and digging further into familiar libraries reminded me of why I got into development and how much fun it can be.

Creativity, challenge, and change are why I enjoy development and this project checked all those boxes.

### Credits

- Thanks for [@nome_sapien](https://www.instagram.com/nome_sapien/) for the incredible header photo
- Created OAuth signatures based on [this post](https://imagineer.in/blog/authorizing-twitter-api-calls-in-javascript/)
