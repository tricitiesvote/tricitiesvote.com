import path from 'path';
import Promise from 'bluebird';
// const { createFilePath } = require(`gatsby-source-filesystem`);
// const { nextTick } = require('process');
// const GatsbySchema = require('./gatsby-schema.js');
import buildSlugs from './node/buildSlugs';
import buildMarkdown from './node/buildMarkdown';
import SchemaCustomization from './schema';
// import GraphQLSchema from './graphql';

const buildBits = [buildSlugs, buildMarkdown];
// const OFFICE_DETAILS = require('./graphql/OFFICE_DETAILS');

exports.onCreateNode = helpers => {
  buildBits.forEach(bit => bit.onCreateNode(helpers));
};

exports.createSchemaCustomization = helpers => {
  const { actions, error } = helpers;
  const { createTypes } = actions;
  createTypes(SchemaCustomization);
  if (error) console.warn(error);
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
        engagement_html
        statement_html
        statement_excerpt_html
        body_excerpt_html
        bio_excerpt_html
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
      pdc_url
      pamphlet_url
      bio
      lettersyes
      lettersno
      articles
      engagement
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
      offices: allOfficesJson(limit: 1000) {
        edges {
          node {
            ...OfficeDetails
          }
        }
      }
      candidates: allCandidatesJson(limit: 1000) {
        edges {
          node {
            ...CandidateDetails
          }
        }
      }
      notes: allNotesJson(limit: 1000) {
        edges {
          node {
            fields {
              notes_html
            }
            candidate {
              name
              office {
                ...OfficeDetails
              }
              image
              fields {
                slug
              }
            }
            notes
          }
        }
      }
      races: allRacesJson(limit: 1000) {
        edges {
          node {
            ...RaceDetails
          }
        }
      }
      guides: allGuidesJson(limit: 1000) {
        edges {
          node {
            fields {
              slug
            }
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
  }

  // console.log(results);

  const allCandidates = results.data.candidates.edges;
  const allGuides = results.data.guides.edges;
  const allRaces = results.data.races.edges;
  const allNotes = results.data.notes.edges;

  allCandidates.forEach(candidate => {
    console.log(candidate);
    createPage({
      path: `/${candidate.node.fields.slug}/`,
      component: path.resolve('./src/templates/CandidatePage.js'),
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
    // console.log(JSON.stringify(guide))
    createPage({
      path: `/${race.node.fields.slug}/`,
      component: path.resolve('./src/templates/RacePage.js'),
      context: {
        slug: race.node.fields.slug,
      },
    });
  });

  allGuides.forEach(guide => {
    // console.log(JSON.stringify(guide))
    createPage({
      path: `/${guide.node.fields.slug}/`,
      component: path.resolve('./src/templates/GuidePage.js'),
      context: {
        slug: guide.node.fields.slug,
      },
    });
  });
};
