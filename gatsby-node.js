const _ = require('lodash');
const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)
const remark = require("remark");
const remarkHTML = require("remark-html");

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions;

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
    type MarkdownRemark implements Node {
      frontmatter: Frontmatter
      fields: Fields
    }
    type Fields {
      collection:       String
      slug:             String
      articles_html:    String
      bio_html:         String
      lettersno_html:   String
      lettersyes_html:  String
    }
    type Frontmatter {
      name:             String
      region:           String
      office:           String
      image:            String
      bio:              String
      email:            String
      statement:        String
      website:          String
      facebook:         String
      twitter:          String
      pdc:              String
      lettersyes:       String
      lettersno:        String
      articles:         String
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
      everything: allMarkdownRemark(
        limit: 1000
      ) {
        edges {
          node {
            fields {
              slug
              collection
              articles_html
              bio_html
              lettersno_html
              lettersyes_html
            }
            id
            html
            frontmatter {
              name
              region
              office 
              image
              bio
              email
              statement
              website
              facebook
              twitter
              pdc
              lettersyes
              lettersno
              articles
            }
          }
        }
      }
    }
  `);

  if (results.errors) {
    reporter.panicOnBuild(`Error while running GraphQL query.`);
    return;
  }

  const allCandidates = results.data.everything.edges;

  allCandidates.forEach((person, index) => {

    createPage({
      path: `/candidates/${person.node.fields.slug}/`,
      component: path.resolve('./src/templates/CandidatePage.js'),
      context: {
        slug: person.node.fields.slug,
      },
    })
  })

};





