const { typeNameFromDir } = require('gatsby-transformer-csv');

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
        path: `${__dirname}/data/endorsements`,
        name: `endorsements`,
      },
    },

    // {
    //   resolve: `gatsby-transformer-csv`,
    //   options: {
    //     path: `${__dirname}/data/questionnaires`
    //   },
    // },
    // TODO ^^ this seems to be sufficient for this set of data

    {
      resolve: `gatsby-transformer-csv`,
      options: {
        path: `${__dirname}/data/questionnaires/school-questions.csv`,
      },
    },
    {
      resolve: `gatsby-transformer-csv`,
      options: {
        path: `${__dirname}/data/questionnaires/council-questions.csv`,
      },
    },
    {
      resolve: `gatsby-transformer-csv`,
      options: {
        path: `${__dirname}/data/questionnaires/school-answers.csv`,
      },
    },
    {
      resolve: `gatsby-transformer-csv`,
      options: {
        path: `${__dirname}/data/questionnaires/council-answers.csv`,
      },
    },
    // {
    //   resolve: `gatsby-source-filesystem`,
    //   options: {
    //     path: `${__dirname}/data/donations/candidate-fundraising.json`,
    //     name: `candidateFundraising`,
    //   },
    // },
    // {
    //   resolve: `gatsby-source-filesystem`,
    //   options: {
    //     path: `${__dirname}/data/donations/candidate-donors.json`,
    //     name: `candidateDonors`,
    //   },
    // },
    // {
    //   resolve: `gatsby-source-filesystem`,
    //   options: {
    //     path: `${__dirname}/data/donations/donor-types.json`,
    //     name: `candidateDonorTypes`,
    //   },
    // },
    // {
    //   resolve: `gatsby-source-filesystem`,
    //   options: {
    //     path: `${__dirname}/data/donations/donors.json`,
    //     name: `donors`,
    //   },
    // },
    // {
    //   resolve: `gatsby-source-filesystem`,
    //   options: {
    //     path: `${__dirname}/data/donations/donations.json`,
    //     name: `donations`,
    //   },
    // },
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
            resolve: `gatsby-remark-responsive-iframe`,
            options: {
              wrapperStyle: `margin-bottom: 1.0725rem`,
            },
          },
          // {
          //   resolve: `@raae/gatsby-remark-oembed`,
          //   options: {
          //     include: ['Instagram', 'YouTube', 'Twitter'],
          //     settings: {
          //       Instagram: { hidecaption: true },
          //       YouTube: { width: 550 },
          //       Twitter: { hide_thread: true },
          //     },
          //   },
          // },
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
    // `gatsby-transformer-sharp`,
    {
      resolve: `gatsby-plugin-netlify-cms`,
      options: {
        manualInit: true,
        modulePath: `${__dirname}/src/cms/cms.js`,
        htmlTitle: 'vote.triciti.es admin',
        customizeWebpackConfig: (config) => {
        config.plugins = config.plugins.filter(
        (plugin) => plugin.constructor.name !== "StaticQueryMapper"
      );
    },
      },
    },
    `gatsby-plugin-react-helmet`,
    `gatsby-plugin-sharp`,
    `gatsby-plugin-offline`,
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
};
