const _ = require('lodash');
const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)
const remark = require("remark");
const remarkHTML = require("remark-html");

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions;
  const jsonData = [`CandidatesJson`,`OfficesJson`, `RacesJson`, `GuidesJson`]

  if (jsonData.includes(_.get(node, 'internal.type'))) {
    console.log('>>> type:', _.get(node, 'internal.type'))

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

  if (_.get(node, 'internal.type') === `MarkdownRemark`) {

    // Set the name of the parent node as the collection
    const parent = getNode(_.get(node, 'parent'));

    createNodeField({
      node,
      name: `collection`,
      value: _.get(parent, 'sourceInstanceName'),
    });

    // add slug 
    const slugged = _.kebabCase(node.frontmatter.name)
    
    createNodeField({
      node,      
      name: `slug`,
      value: slugged
    })

    // create frontmatter markdown html fields 
    const my_field = node.frontmatter.my_field;

    const markdownFields = [
      { 
        "name": "bio", 
        "data": node.frontmatter.bio 
      },
      { 
        "name": "lettersyes", 
        "data": node.frontmatter.lettersyes 
      },
      {
        "name": "lettersno",
        "data": node.frontmatter.lettersno 
      },
      { 
        "name": "articles",
        "data": node.frontmatter.articles
      },
    ]

    for (var key in markdownFields) {
      if (markdownFields.hasOwnProperty(key)) {

        let fieldName = markdownFields[key]['name'];
        let fieldData = markdownFields[key]['data'];

        if (fieldData) {
          const value = remark()
            .use(remarkHTML)
            .processSync(fieldData)
            .toString()
            .slice(3)     // remove <p>
            .slice(0,-5) // remove </p>

          // create new node at:
          // fields { fieldName_html }
          createNodeField({
            name: `${fieldName}_html`,
            node,
            value
          });
        }
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
      office:           OfficesJson @link(by: "title", from: "office")      
      fields:           Fields
      electionyear:     String      
      name:             String      
      region:           String
      office:           String
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
    {

      offices: allOfficesJson(
        limit: 1000
      ) {
        edges {
          node {
            ...OfficeDetailsFragment
          }
        }
      }

      candidates: allCandidatesJson(
        limit: 1000
      ) {
        edges {
          node {
            fields {
              slug
            }
            office { 
              fields {
                slug
              }
              title
              job
              position
              region
              uuid
            }
            electionyear  
            name
            region
            office
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
        }
      }

      races: allRacesJson(
        limit: 1000
      ) {
        edges {
          node {
            fields {
              slug
            }
            candidates {
              fields {
                slug
              }
              office { 
                fields {
                  slug
                }
                title
                job
                position
                region
                uuid
              }
              electionyear  
              name
              region
              office
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
            electionyear
            title
            type
            uuid
            intro
            body
            hide
          }
        }
      }

      guides: allGuidesJson(
        limit: 1000
      ) {
        edges {
          node {
            fields {
              slug
            }
            races {
              fields {
                slug
              }
              candidates {
                fields {
                  slug
                }
                office { 
                  fields {
                    slug
                  }
                  title
                  job
                  position
                  region
                  uuid
                }
                electionyear  
                name
                region
                office
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
              electionyear
              title
              type
              uuid
              intro
              body
              hide
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





