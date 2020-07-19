const _ = require('lodash');
const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)
const remark = require("remark");
const remarkHTML = require("remark-html");
const { nextTick } = require('process');
// const OfficeDetailsFragment = require('./src/queries/Office.js');

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions;

  // build slug contents for Races
  if (node.internal.type === 'RacesJson') {
    createNodeField({
      node,      
      name: `slug`,
      value: _.kebabCase(node.office)
    })
  }

    // build slug contents for Races
    if (node.internal.type === 'CandidatesJson' && node.name) {
      createNodeField({
        node,      
        name: `slug`,
        value: _.kebabCase(node.name)
      })
    }
};

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions;

  const typeDefs = `

    type OfficesJson implements Node {
      fields:           Fields
      title:            String  
      job:              String
      position:         String
      region:           String
      uuid:             String
    }

    type CandidatesJson implements Node {
      fields:           Fields
      electionyear:     String      
      name:             String      
      party:            String
      incumbent:        Boolean
      yearsin:          String   
      image:            String
      statement:        String
      email:            String
      website:          String
      facebook:         String
      twitter:          String
      instagram:        String
      youtube:          String
      pdc:              String
      donors:           String
      uuid:             String
      hide:             Boolean

      bio:              String
      bioHtml:          String
      lettersyes:       String
      lettersyesHtml:   String
      lettersno:        String
      lettersnoHtml:    String
      articles:         String
      articlesHtml:     String

      office:           OfficesJson @link(by: "title", from: "office")
    }

    type RacesJson implements Node {
      office:           OfficesJson @link(by: "title", from: "office")
      fields:           Fields
      electionyear:     String
      title:            String
      type:             String
      uuid:             String
      intro:            String
      body:             String
      candidates:       [CandidatesJson] @link(by: "uuid", from: "candidates")
      hide:             Boolean 
    }

    type GuidesJson implements Node {    
      fields:           Fields
      electionyear:     String      
      type:             String      
      region:           String
      races:            [RacesJson] @link(by: "uuid", from: "races")  
    }

    type Fields {
      slug:             String
    }
  `;

  createTypes(typeDefs);
};

exports.createPages = async ({
  actions: { createPage },
  graphql,
  reporter,
}) => {
  const results = await graphql(`
    fragment OfficeDetails on OfficesJson {
      title
      job
      position
      region
      uuid
    }

    fragment CandidateDetails on CandidatesJson {
      fields {
        slug
      }
      name
      electionyear
      office {
        ...OfficeDetails
      }
      party
      incumbent
      yearsin
      image
      statement
      email
      website
      facebook
      twitter
      instagram
      youtube
      pdc
      donors
      bioHtml
      lettersyesHtml
      lettersnoHtml
      articlesHtml
      uuid
      hide
    }

    fragment RaceDetails on RacesJson {
      fields {
        slug
      }
      electionyear
      type
      office {
        ...OfficeDetails
      }
      intro
      body
      candidates {
        ...CandidateDetails
      }
      uuid
      hide
    }

    {
      offices: allOfficesJson(
        limit: 1000
      ) {
        edges {
          node {
            ...OfficeDetails
          }
        }
      }

      candidates: allCandidatesJson(
        limit: 1000
      ) {
        edges {
          node {
            ...CandidateDetails
          }
        }
      }

      races: allRacesJson(
        limit: 1000
      ) {
        edges {
          node {
            ...RaceDetails
          }
        }
      }

      guides: allGuidesJson(
        limit: 1000
      ) {
        edges {
          node {
            races {
              ...RaceDetails
            }
            electionyear
            type
            region
          }
        }
      }
    }
  `);

  if (results.errors) {
    reporter.panicOnBuild(`Error while running GraphQL query.`);
    return;
  }

  // const allCandidates = results.data.everything.edges;

  // allCandidates.forEach((person, index) => {

  //   createPage({
  //     path: `/candidates/${person.node.fields.slug}/`,
  //     component: path.resolve('./src/templates/CandidatePage.js'),
  //     context: {
  //       slug: person.node.fields.slug,
  //     },
  //   })
  // })

};





