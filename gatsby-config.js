const path = require("path")

module.exports = {
  siteMetadata: {
    title: `Daniel Yuschick`,
    description: `Daniel Yuschick is a frontend developer and horror author based in Helsinki, Finland.`,
    author: `@yuschick`,
  },
  plugins: [
    `gatsby-plugin-typescript`,
    `gatsby-plugin-styled-components`,
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Daniel Yuschick`,
        short_name: `daniel_yuschick`,
        start_url: `/`,
        background_color: `#f0f0f0`,
        theme_color: `#d45f37`,
        icon: `src/images/dy-logo.png`,
      },
    },
    {
      resolve: "gatsby-plugin-root-import",
      options: {
        src: path.join(__dirname, "src"),
        assets: path.join(__dirname, "src/assets"),
        components: path.join(__dirname, "src/components"),
        icons: path.join(__dirname, "src/assets/icons"),
        gql: path.join(__dirname, "src/gql"),
        images: path.join(__dirname, "src/images"),
        pages: path.join(__dirname, "src/pages"),
        store: path.join(__dirname, "src/store"),
        theme: path.join(__dirname, "src/theme"),
        types: path.join(__dirname, "src/types"),
        utils: path.join(__dirname, "src/utils"),
      },
    },
    {
      resolve: "gatsby-plugin-react-svg",
      options: {
        rule: {
          include: "/assets/icons/",
        },
      },
    },
    {
      resolve: `gatsby-source-twitter`,
      options: {
        credentials: {
          consumer_key: "Ua9cn8DQZWRe52SSxP9UzHRCc",
          consumer_secret: "k8ZUlLY3UFasBF8qwqvPl0WPUOkDTf5fJ8HHm4MYSzoRPD7K3B",
          bearer_token:
            "AAAAAAAAAAAAAAAAAAAAAMUEEAEAAAAAlNhDPAT1zNq9OHG34Jbwv1ibmwU%3DWygBepmxCOB9qCmJYbWafjb4ly6Pd2tFR2ahXAo2rCGgd0UXRQ",
        },
        queries: {
          query: {
            endpoint: "statuses/user_timeline",
            params: {
              screen_name: "yuschick",
              include_rts: false,
              exclude_replies: true,
              tweet_mode: "extended",
            },
          },
        },
      },
    },
  ],
}
