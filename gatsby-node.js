const writingLinks = {
  themines: {
    amazon: "https://www.amazon.com/Mines-Daniel-Yuschick-ebook/dp/B07RRQ3F58",
  },
}

exports.onCreateNode = ({ node, actions }) => {
  if (node.internal.type === "File" && node.name in writingLinks) {
    const { createNodeField } = actions
    createNodeField({
      node,
      name: "amazon",
      value: writingLinks[node.name].amazon,
    })
  }
}
