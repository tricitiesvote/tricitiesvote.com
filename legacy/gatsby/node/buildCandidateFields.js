const _ = require('lodash');

exports.onCreateNode = ({ node, actions }) => {
  const { createNodeField } = actions;
  // build funding slug contents for candidate reference
  if (node.internal.type === 'CandidatesJson' && node.uuid) {
    // console.log('candidatejson');
    createNodeField({
      node,
      name: `fundraising`,
      value: _.kebabCase(_.lowerCase(`${node.uuid}-funding`)),
    });
  }
};
