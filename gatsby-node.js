const path = require('path');
const SchemaCustomization = require('./schema');
const GraphQLSchema = require('./graphql');

const _ = require('lodash');
const remark = require('remark');
const remarkHTML = require('remark-html');
const truncate = require('truncate-html');

exports.onCreateNode = ({ node, actions }) => {
  // ... (contents from gatsby-node.esm.js)
};

exports.createSchemaCustomization = (helpers) => {
  const { actions } = helpers;
  const { createTypes } = actions;
  try {
    createTypes(SchemaCustomization);
  } catch (error) {
    console.error('Schema Customization Error:', error);
  }
};

exports.createPages = async ({ actions: { createPage }, graphql, reporter }) => {
  // ... (contents from gatsby-node.esm.js)
};
