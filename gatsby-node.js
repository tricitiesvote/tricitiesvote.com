const _ = require('lodash');
const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)
const remark = require("remark");
const remarkHTML = require("remark-html");
// const OfficeDetailsFragment = require('./src/queries/Office.js');

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions;
  const jsonData = [`CandidatesJson`, `OfficesJson`, `RacesJson`, `GuidesJson`]

  if (jsonData.includes(_.get(node, 'internal.type'))) {
    // console.log('>>> type:', _.get(node, 'internal.type'))

    // Set the name of the parent node as the collection
    const parent = getNode(_.get(node, 'parent'));

    // add slug 
    const slugged = _.kebabCase(node.title)

    createNodeField({
      node,      
      name: `slug`,
      value: slugged
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
      office:           OfficesJson @link(by: "title", from: "office")
      fields:           Fields
      electionyear:     String      
      name:             String      
      region:           String
      party:            String
      incumbent:        Boolean
      yearsin:          String   
      image:            String
      email:            String
      website:          String
      facebook:         String
      twitter:          String
      instagram:        String
      pdc:              String
      uuid:             String
      hide:             Boolean

      bio:              String
      bioHtml:          String
      statement:        String
      statementHtml:    String
      lettersyes:       String
      lettersyesHtml:   String
      lettersno:        String
      lettersnoHtml:    String
      articles:         String
      articlesHtml:     String
    }

    type RacesJson implements Node {
      candidates:       [CandidatesJson] @link(by: "uuid", from: "candidates")
      fields:           Fields
      electionyear:     String
      title:            String
      type:             String
      uuid:             String
      intro:            String
      body:             String
      hide:             Boolean 
    }

    type GuidesJson implements Node {
      races:            [RacesJson] @link(by: "uuid", from: "races")      
      fields:           Fields
      electionyear:     String      
      type:             String      
      region:           String
    }

    type Fields {
      collection:       String
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
      office {
        ...OfficeDetails
      }
      electionyear  
      name
      region
      party
      incumbent
      yearsin
      image
      email
      website
      facebook
      twitter
      instagram
      pdc
      uuid
      hide
      bio
      bioHtml
      statement
      statementHtml
      lettersyes
      lettersyesHtml
      lettersno
      lettersnoHtml
      articles
      articlesHtml
    }

    fragment RaceDetails on RacesJson {
      candidates {
        ...CandidateDetails
      }
      electionyear
      title
      type
      uuid
      intro
      body
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





