module.exports = {
  siteMetadata: {
    title: `vote.triciti.es`,
    author: `Tumbleweird, SPC`,
    description: `An impartial set of info and links to help people stay informed about the upcoming election`,
    siteUrl: `https://vote.triciti.es`,
  },
  plugins: [
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/data`,
        name: `data`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/assets`,
        name: `assets`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 590,
            },
          },
          {
            resolve: `gatsby-plugin-json-remark`,
            options: {
              paths: [
                `${__dirname}/content/data`,
              ],
              fieldNameBlacklist: [
                "id",
                "children",
                "parent",
                "fields",
                "internal",
                "path",
                "template",
              ],
            },
          },
          {
            resolve: `gatsby-remark-remove-root-p-tag`,
            options: {
              parents: ["gatsby-plugin-json-remark", "default-site-plugin"], // Required: will process only the MarkdownRemark nodes created by these plugins
            },
          },
          {
            resolve: `gatsby-remark-responsive-iframe`,
            options: {
              wrapperStyle: `margin-bottom: 1.0725rem`,
            },
          },
          {
            resolve: `@raae/gatsby-remark-oembed`,
            options: {
              include: ['Instagram', 'YouTube', 'Twitter'],
              settings: {
                Instagram: { hidecaption: true },
                YouTube: { width: 550 },
                Twitter: { hide_thread: true },
              },
            },
          },
          `gatsby-remark-copy-linked-files`,
          `gatsby-remark-smartypants`,
        ],
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-netlify-cms`,
    `gatsby-plugin-offline`,
    `gatsby-plugin-react-helmet`,
    `gatsby-plugin-sharp`,
    // `gatsby-plugin-feed`,
    // {
    //   resolve: `gatsby-plugin-manifest`,
    //   options: {
    //     name: `Gatsby Starter Blog`,
    //     short_name: `GatsbyJS`,
    //     start_url: `/`,
    //     background_color: `#ffffff`,
    //     theme_color: `#663399`,
    //     display: `minimal-ui`,
    //     icon: `content/assets/gatsby-icon.png`,
    //   },
    // },
    // {
    //   resolve: `gatsby-plugin-typography`,
    //   options: {
    //     pathToConfigModule: `src/utils/typography`,
    //   },
    // },
  ],
}
