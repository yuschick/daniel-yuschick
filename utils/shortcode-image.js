const Image = require("@11ty/eleventy-img");

module.exports = async function imageShortcode(src, alt) {
  const metadataOptions = {
    widths: [320, 1000],
    urlPath: "/assets/images/",
    outputDir: "./public/assets/images/",
  };

  let metadata = await Image(src, {
    ...metadataOptions,
    formats: ["webp", "jpeg"],
  });

  let gifMetadata = await Image(src, {
    ...metadataOptions,
    formats: ["webp", "gif"],
    sharpOptions: {
      animated: true,
    },
  });

  let imageAttributes = {
    alt,
    sizes: "100vw",
    loading: "lazy",
    decoding: "async",
  };

  return Image.generateHTML(
    src.includes(".gif") ? gifMetadata : metadata,
    imageAttributes
  );
};
