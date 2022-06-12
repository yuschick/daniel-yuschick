const CleanCSS = require("clean-css");

module.exports = (config) => {
  config.addNunjucksGlobal("getYear", function () {
    return new Date().getFullYear();
  });

  config.addFilter("cssmin", function (code) {
    return new CleanCSS({}).minify(code).styles;
  });

  config.addPassthroughCopy("./src/assets");
  config.addPassthroughCopy("./src/styles");

  return {
    dir: {
      input: "src",
      output: "public",
    },
  };
};
