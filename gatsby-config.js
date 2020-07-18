module.exports = {
  siteMetadata: {
    title: `tricitiesvote.com`,
    author: `Tumbleweird, SPC`,
    description: `An impartial set of info and links to help people stay informed about the upcoming election`,
    siteUrl: `https://tricitiesvote.com`,
  },
  plugins: [
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/data/candidates`,
        name: `candidates`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/data/races`,
        name: `races`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/data/offices`,
        name: `offices`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/data/guides`,
        name: `guides`,
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
            resolve: `gatsby-remark-remove-root-p-tag`,
            options: {
              parents: ["gatsby-transformer-remark", "default-site-plugin"],
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
          `gatsby-transformer-json`,
          {
            resolve: `gatsby-source-filesystem`,
            options: {
              path: `${__dirname}/data/`,
            },
          },
        ],
      },
    },
    `gatsby-transformer-sharp`,
    {
      resolve: `gatsby-plugin-netlify-cms`,
      options: {
        manualInit: true,
        modulePath: `${__dirname}/src/cms/cms.js`,
        htmlTitle: 'vote.triciti.es admin',
      },
    },
    `gatsby-plugin-offline`,
    `gatsby-plugin-react-helmet`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-json-remark`,
      options: {
        paths: [
          `${__dirname}/data/candidates`,
          `${__dirname}/data/races`,
        ], // Process all JSON files in these directories.
        fieldNameBlacklist: [
          "id",
          "children",
          "parent",
          "fields",
          "internal",
          "path",
          "template",
          "email",
          "facebook",
          "twitter",
          "instagram",
          "name",
          "party",
          "title",
          "name",
          "electionyear",
          "image",
          "pdc",
          "website",
          "candidates",
          "uuid",
          "type",
          "yearsin",
          "incumbent",
          "hide"
        ],
      },
    },
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
