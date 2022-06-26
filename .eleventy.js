const eleventySass = require("eleventy-sass");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const postcss = require("postcss");
const cssnano = require("cssnano");
const autoprefixer = require("autoprefixer");
const Image = require("@11ty/eleventy-img");

async function imageShortcode(src, alt, sizes) {
  let metadata = await Image(src, {
    widths: [300, 600, 1000],
    formats: ["webp", "jpeg"],
    urlPath: "/assets/images/",
    outputDir: "./public/assets/images/",
  });

  let imageAttributes = {
    alt,
    sizes,
    loading: "lazy",
    decoding: "async",
  };

  // You bet we throw an error on missing alt in `imageAttributes` (alt="" works okay)
  return Image.generateHTML(metadata, imageAttributes);
}

module.exports = function (config) {
  config.addLiquidShortcode("image", imageShortcode);
  config.addLiquidShortcode("codepen", function (url) {
    const url_array = url.split("/");

    const profile_url_array = url_array.filter((string, index) => {
      return index < url_array.length - 2 ? true : false;
    });

    const username = profile_url_array[profile_url_array.length - 1];
    const user_profile = profile_url_array.join("/");
    const data_slug_hash = url_array[url_array.length - 1];

    return `<div class="media-embed-wrapper"><p class="codepen" data-height="500" data-default-tab="result" data-slug-hash="${data_slug_hash}" data-user="${username}">
    <span><a href="${url}">See the pen</a> (<a href="${user_profile}">@${username}</a>) on <a href="https://codepen.io">CodePen</a>.</span>
    </p></div>
    <script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>`;
  });

  config.addLiquidShortcode("vimeo", function (url, title) {
    if (!url) return "";

    const id = url.replace("https://vimeo.com/", "");
    return `<div class="media-embed-wrapper">
    <div style="padding:56.25% 0 0 0;position:relative;">
    <iframe src="https://player.vimeo.com/video/${id}?h=88c93cde2a&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;" title="${title}"></iframe>
    </div>
    </div>
    <script src="https://player.vimeo.com/api/player.js"></script>`;
  });

  config.addNunjucksGlobal("getYear", function () {
    return new Date().getFullYear();
  });

  config.addNunjucksGlobal("formatDate", function (date) {
    return date.toLocaleDateString("en-FI", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  });

  config.addNunjucksGlobal("getArticleReadTime", function (content) {
    return content ? Math.floor(content.split(" ").length / 250) : "~5";
  });

  config.addNunjucksGlobal("getCanonicalDomain", function (url) {
    return new URL(url).hostname;
  });

  config.addPassthroughCopy("./src/assets");
  config.addPassthroughCopy("./src/js");

  config.addPlugin(eleventySass, {
    postcss: postcss([autoprefixer, cssnano]),
  });
  config.addPlugin(syntaxHighlight);

  return {
    dir: {
      input: "src",
      output: "public",
    },
  };
};
