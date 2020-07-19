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

  const markdownFields = [
    { 
      "name": "bio", 
      "data": node.bio,
      "wrap": true
    },
    { 
      "name": "lettersyes", 
      "data": node.lettersyes,
      "wrap": false
    },
    {
      "name": "lettersno",
      "data": node.lettersno,
      "wrap": false
    },
    { 
      "name": "articles",
      "data": node.articles,
      "wrap": false
    },
    { 
      "name": "body",
      "data": node.body,
      "wrap": true
    },
  ]

  for (var key in markdownFields) {
    if (markdownFields.hasOwnProperty(key)) {

      let fieldName = markdownFields[key]['name'];
      let fieldData = markdownFields[key]['data'];
      let wrap = markdownFields[key]['wrap'];

      if (fieldData) {
        const valueWrap = remark()
          .use(remarkHTML)
          .processSync(fieldData)
          .toString()

        const valueNoWrap = remark()
          .use(remarkHTML)
          .processSync(fieldData)
          .toString()
          .slice(3).slice(0,-5) // remove <p> and </p>

        // create new node at:
        // fields { fieldName_html }
        createNodeField({
          name: `${fieldName}_html`,
          node,
          value: valueWrap
        });

        // create new unwrapped node at:
        // fields { fieldName_html_nowrap }
        createNodeField({
          name: `${fieldName}_html_nowrap`,
          node,
          value: valueNoWrap
        });
      }
    }
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
      body:             String
      lettersyes:       String
      lettersno:        String
      articles:         String

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
      lettersyes_html:  String
      lettersno_html:   String
      bio_html:         String
      articles_html:    String
      body_html:        String

      lettersyes_html_nowrap:  String
      lettersno_html_nowrap:   String
      bio_html_nowrap:         String
      articles_html_nowrap:    String
      body_html_nowrap:        String
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
        body_html
        bio_html
        lettersyes_html
        lettersno_html
        articles_html
        lettersyes_html_nowrap
        lettersno_html_nowrap 
        bio_html_nowrap       
        articles_html_nowrap  
        body_html_nowrap      
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
      bio
      lettersyes      
      lettersno
      articles
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

  const allCandidates = results.data.candidates.edges;
  const allGuides = results.data.guides.edges;
  const allRaces = results.data.races.edges;

  // console.log('candidates >>>>', JSON.stringify(allCandidates,null,2))
  // console.log('guides >>>>', JSON.stringify(allGuides,null,2))
  // console.log('races >>>>', JSON.stringify(allRaces,null,2))

  allCandidates.forEach((candidate, index) => {
    createPage({
      path: `/${candidate.node.fields.slug}/`,
      component: path.resolve('./src/templates/CandidatePage.js'),
      context: {
        slug: candidate.node.fields.slug,
      },
    })
  })

};





