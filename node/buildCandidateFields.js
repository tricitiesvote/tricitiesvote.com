const _ = require('lodash');

exports.onCreateNode = ({ node, actions }) => {
  throw Error("LKJSDFLKJDSF");
  process.exit(-1);
  
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
