module.exports = (config) => {
  config.addPassthroughCopy("./src/styles");
  config.addNunjucksGlobal("getYear", function () {
    return new Date().getFullYear();
  });

  return {
    dir: {
      input: "src",
      output: "public",
    },
  };
};
