const _ = require('lodash');
const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions;

  if (_.get(node, 'internal.type') === `MarkdownRemark`) {
    // Get the parent node
    // This is different from frontmatter.parent below
    const parent = getNode(_.get(node, 'parent'));
    const slugged = _.kebabCase(node.frontmatter.name)
    // console.log(slugged)

    createNodeField({
      node,
      name: `collection`,
      value: _.get(parent, 'sourceInstanceName'),
    });

    createNodeField({
      node,      
      name: `slug`,
      value: slugged
    })

    // console.log(node.fields.slug)

  }
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
              collection
              slug
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





