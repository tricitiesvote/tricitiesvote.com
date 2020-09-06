const _ = require('lodash');

exports.onCreateNode = ({ node, actions }) => {
  const { createNodeField } = actions;
  // build slug contents for Guides
  // TODO: make 'region' consistent across data sets
  // it's also having county re-added in components/RacePage.js
  if (node.internal.type === 'GuidesJson') {
    const region = node.region.slice(0, node.region.indexOf(' '));
    createNodeField({
      node,
      name: `slug`,
      value: _.kebabCase(region),
    });
  }

  // build slug contents for Races
  if (node.internal.type === 'RacesJson') {
    createNodeField({
      node,
      name: `slug`,
      value: _.kebabCase(node.office),
    });
  }

  // build slug contents for Candidates
  if (node.internal.type === 'CandidatesJson' && node.name) {
    createNodeField({
      node,
      name: `slug`,
      value: _.kebabCase(node.name),
    });
  }
};
