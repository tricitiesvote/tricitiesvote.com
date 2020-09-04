const _ = require('lodash');

const path = require(`path`);
// const { createFilePath } = require(`gatsby-source-filesystem`);
const remark = require('remark');
const remarkHTML = require('remark-html');
// const { nextTick } = require('process');
const truncate = require('truncate-html');
// const OfficeDetailsFragment = require('./src/queries/Office.js');

exports.onCreateNode = async ({ node, actions }) => {
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

  // const candidateUUIDs = [];

  // build slug contents for Candidates
  // add candidate uuid to list
  if (node.internal.type === 'CandidatesJson' && node.name) {
    createNodeField({
      node,
      name: `slug`,
      value: _.kebabCase(node.name),
    });
    // candidateUUIDs.push(node.uuid);
    // console.log('candidate uuid added:', node.uuid);
  }

  

  // iterate through donations
  // get each candidate uuid
  // if (node.internal.type === 'DonationsJson') {
  //   node.
  //   candidateUUIDs.push()
  // }

  // iterate through donations
  // divide donations into group by candidate

  // iterate through candidate donation set
  // create totals of donation per donor per candidate

  // const donors = []

  // // iterate through donations
  // if (node.internal.type === 'DonationsJson') {
  //   if (!_.includes(donors, node.)) {

  //   recipients.push(node.candidate)

  //   console.log(JSON.stringify(node.candidate))
  //   recipient = node.candidate;

  //   // createNodeField({
  //   //   node,
  //   //   name: `slug`,
  //   //   value: _.kebabCase(region)
  //   // })

  // }

  const markdownFields = [
    {
      name: 'lettersyes',
      data: node.lettersyes,
      wrap: false,
      excerpt: false,
    },
    {
      name: 'lettersno',
      data: node.lettersno,
      wrap: false,
      excerpt: false,
    },
    {
      name: 'articles',
      data: node.articles,
      wrap: false,
      excerpt: false,
    },
    {
      name: 'engagement',
      data: node.engagement,
      wrap: true,
      excerpt: false,
    },
    {
      name: 'bio',
      data: node.bio,
      wrap: true,
      excerpt: 160,
    },
    {
      name: 'statement',
      data: node.statement,
      wrap: true,
      excerpt: 240,
    },
    {
      name: 'body',
      data: node.body,
      wrap: true,
      excerpt: 240,
    },
    {
      name: 'notes',
      data: node.notes,
      wrap: true,
      excerpt: 240,
    },
  ];

  markdownFields.forEach((item, key) => {
    const fieldName = markdownFields[key].name;
    const fieldData = markdownFields[key].data;
    const { wrap } = markdownFields[key];
    const { excerpt } = markdownFields[key];

    // console.log(excerpt)

    if (fieldData) {
      const wrapValue = remark()
        .use(remarkHTML)
        .processSync(fieldData)
        .toString();

      const noWrapValue = remark()
        .use(remarkHTML)
        .processSync(fieldData)
        .toString()
        .slice(3)
        .slice(0, -5); // remove <p> and </p>

      if (wrapValue && wrap) {
        // create new node at:
        // fields { fieldName_html }
        createNodeField({
          name: `${fieldName}_html`,
          node,
          value: wrapValue,
        });
      }

      if (noWrapValue && !wrap) {
        // create new unwrapped node at:
        // fields { fieldName_html_nowrap }
        createNodeField({
          name: `${fieldName}_html_nowrap`,
          node,
          value: noWrapValue,
        });
      }

      // console.log(excerpt)

      if (wrapValue && excerpt > 0) {
        const excerptValue = truncate(wrapValue, excerpt, {
          reserveLastWord: true,
        });
        // create new node at:
        // fields { fieldName_excerpt_html }
        createNodeField({
          name: `${fieldName}_excerpt_html`,
          node,
          // value: 'hi'
          value: excerptValue,
        });
      }
    }
  });
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
      fields:           Fields
      electionyear:     String      
      name:             String      
      party:            String
      incumbent:        Boolean
      yearsin:          String   
      image:            String
      email:            String
      website:          String
      facebook:         String
      twitter:          String
      instagram:        String
      youtube:          String
      pdc_url:          String
      pamphlet_url:     String
      uuid:             String
      hide:             Boolean
      statement:        String

      bio:              String
      body:             String
      lettersyes:       String
      lettersno:        String
      articles:         String
      engagement:       String

      office:           OfficesJson @link(by: "title", from: "office")
    }

    type NotesJson implements Node {
      fields:          NoteFields
      candidate:       CandidatesJson @link(by: "uuid", from: "candidate")
      notes:           String
    }

    type RacesJson implements Node {
      office:           OfficesJson @link(by: "title", from: "office")
      fields:           Fields
      electionyear:     String
      title:            String
      type:             String
      uuid:             String
      intro:            String
      body:             String
      candidates:       [CandidatesJson] @link(by: "uuid", from: "candidates")
      hide:             Boolean
    }

    type GuidesJson implements Node {    
      fields:           Fields
      electionyear:     String      
      type:             String      
      region:           String
      races:            [RacesJson] @link(by: "uuid", from: "races")  
    }

    type DonorsJson implements Node {
      name:             String
      slug:             String
      type:             String
      city:             String
      electionyear:     String
    }

    type DonationsJson implements Node {
      donor_slug:       String
      candidate:        CandidatesJson @link(by: "uuid", from: "candidate")
      donor_name:       String
      filer_name:       String
      donation_type:    String
      donor_city:       String
      party:            String
      type:             String
      amount:           Float
      detail:           String
      report:           String
    }

    type Fields {
      slug:             String
      lettersyes_html:  String
      lettersno_html:   String
      bio_html:         String
      articles_html:    String
      engagement_html:  String
      body_html:        String
      statement_html:   String

      statement_excerpt_html:  String
      body_excerpt_html:       String
      bio_excerpt_html:        String

      lettersyes_html_nowrap:  String
      lettersno_html_nowrap:   String
      bio_html_nowrap:         String
      articles_html_nowrap:    String
      body_html_nowrap:        String
    }

    type NoteFields {
      notes_html:              String
      notes_excerpt_html:      String
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

    fragment DonationDetails on DonationsJson {
      donor_slug
      donor_name
      donation_type
      donor_city
      party
      type
      amount
      date
      report
      filer_name
      candidate {
        uuid
        fields {
          slug
        }
        name
        party
        image
      }
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

      donations: allDonationsJson(limit: 8000) {
        edges {
          node {
            ...DonationDetails
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

      donationsByCandidateGroup: allDonationsJson(limit: 10000) {
        group(field: candidate___uuid) {
          fieldValue
        }
      }

      donationsByDonorGroup: allDonationsJson(limit: 10000) {
        group(field: donor_slug) {
          fieldValue
        }
      }
    }
  `);

  if (results.errors) {
    reporter.panicOnBuild(`Error while running GraphQL query.`);
    return;
  }

  const donations = await graphql(`
    query donationsByCandidate {
      allDonationsJson {
        group(field: candidate___uuid, limit: 1) {
          edges {
            node {
              amount
              candidate {
                uuid
              }
              donor_name
              donor_slug
            }
          }
        }
      }
    }
  `);

  // console.log('donationsByCandidate', JSON.stringify(donations, null, 2));

  const candidateDonations = [];

  // candidateDonations(candidate.uuid).donor (candidate_slug).donation (amount)
  // candidateDonations(candidate.uuid).type(donation_type).donation(amount)

  donations.data.allDonationsJson.group.forEach(group => {
    const candidateId = group.edges[0].node.candidate.uuid;
    // add candidate at root
    candidateDonations.push(candidateId);
    console.log('added', candidateId);
    group.edges.forEach(donation => {
      const slug = donation.node.donor_slug;
      candidateDonations[candidateId].donor = [];
      console.log('slug', slug)
      console.log(candidateDonations[candidateId]);
      // if (!_.includes(candidateDonations[candidateId].donor, donation.node.donor_slug)) {
      //   candidateDonations[candidateId].donor.push(slug);
      //   console.log('added', slug);
      // }
    })
    
    // console.log('group', JSON.stringify(group, null, 2));

    // group.forEach(donation => {

    // })
  });

  // const allCandidates = results.data.everything.edges;

  const allCandidates = results.data.candidates.edges;
  const allGuides = results.data.guides.edges;
  const allRaces = results.data.races.edges;
  const allNotes = results.data.notes.edges;

  // console.log('candidates >>>>', JSON.stringify(allCandidates,null,2))
  // console.log('guides >>>>', JSON.stringify(allGuides,null,2))
  // console.log('races >>>>', JSON.stringify(allRaces,null,2))
  // console.log('notes >>>>', JSON.stringify(allNotes,null,2))

  allCandidates.forEach(candidate => {
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
