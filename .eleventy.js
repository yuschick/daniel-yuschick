const eleventySass = require("eleventy-sass");
// const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");

module.exports = function (config) {
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
    return Math.floor(content?.split(" ").length / 170);
  });

  config.addPassthroughCopy("./src/assets");

  config.addPlugin(eleventySass);
  // config.addPlugin(syntaxHighlight);

  return {
    dir: {
      input: "src",
      output: "public",
    },
  };
};
