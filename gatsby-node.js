import path from 'path';
import SchemaCustomization from './schema';
import GraphQLSchema from './graphql';

import _ from 'lodash';
import remark from 'remark';
import remarkHTML from 'remark-html';
import truncate from 'truncate-html';

export const onCreateNode = ({ node, actions }) => {
  // ... (contents from gatsby-node.esm.js)
};

export const createSchemaCustomization = (helpers) => {
  const { actions } = helpers;
  const { createTypes } = actions;
  try {
    createTypes(SchemaCustomization);
  } catch (error) {
    console.error('Schema Customization Error:', error);
  }
};

export const createPages = async ({ actions: { createPage }, graphql, reporter }) => {
  // ... (contents from gatsby-node.esm.js)
};
