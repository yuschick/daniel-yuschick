const eleventySass = require("eleventy-sass");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");

module.exports = function (config) {
  config.addNunjucksGlobal("getYear", function () {
    return new Date().getFullYear();
  });

  config.addPassthroughCopy("./src/assets");

  config.addPlugin(eleventySass);
  config.addPlugin(syntaxHighlight);

  return {
    dir: {
      input: "src",
      output: "public",
    },
  };
};
