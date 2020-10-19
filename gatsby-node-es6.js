import path from 'path';
import { buildCandidateFields, buildMarkdown, buildSlugs } from './node';
import SchemaCustomization from './schema';
import GraphQLSchema from './graphql';

const buildBits = [buildSlugs, buildMarkdown, buildCandidateFields];

exports.onCreateNode = helpers => {
  buildBits.forEach(bit => bit.onCreateNode(helpers));
};

exports.createSchemaCustomization = helpers => {
  const { actions } = helpers;
  const { createTypes } = actions;
  try {
    createTypes(SchemaCustomization);
  } catch (error) {
    console.log(error);
  }
};

exports.createPages = async ({
  actions: { createPage },
  graphql,
  reporter,
}) => {
  const results = await graphql(GraphQLSchema);

  if (results.errors) {
    reporter.panicOnBuild(`Error while running GraphQL query.`);
    console.log(results.errors);
  }

  const allCandidates = results.data.candidates.edges;
  const allGuides = results.data.guides.edges;
  const allRaces = results.data.races.edges;
  const allNotes = results.data.notes.edges;

  allCandidates.forEach(candidate => {
    createPage({
      path: `/${candidate.node.fields.slug}/`,
      component: path.resolve('./src/templates/CandidatePage.js'),
      context: {
        slug: candidate.node.fields.slug,
      },
    });
  });

  allCandidates.forEach(candidate => {
    createPage({
      path: `/${candidate.node.fields.slug}/preview`,
      component: path.resolve('./src/templates/CandidatePagePreview.js'),
      context: {
        slug: candidate.node.fields.slug,
      },
    });
  });

  allNotes.forEach(note => {
    createPage({
      path: `/${note.node.candidate.fields.slug}/notes`,
      component: path.resolve('./src/templates/NotesPage.js'),
      context: {
        slug: note.node.candidate.fields.slug,
      },
    });
  });

  allRaces.forEach(race => {
    createPage({
      path: `/${race.node.fields.slug}/`,
      component: path.resolve('./src/templates/RacePage.js'),
      context: {
        slug: race.node.fields.slug,
      },
    });
  });

  allRaces.forEach(race => {
    createPage({
      path: `/${race.node.fields.slug}/preview`,
      component: path.resolve('./src/templates/RacePagePreview.js'),
      context: {
        slug: race.node.fields.slug,
      },
    });
  });

  allGuides.forEach(guide => {
    createPage({
      path: `/${guide.node.fields.slug}/`,
      component: path.resolve('./src/templates/GuidePage.js'),
      context: {
        slug: guide.node.fields.slug,
      },
    });
  });
};
