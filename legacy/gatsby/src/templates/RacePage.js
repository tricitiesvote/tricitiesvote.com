import React from 'react';
import { graphql, Link } from 'gatsby';
import DefaultLayout from '../layouts/DefaultLayout';
import Race from '../components/Race';
import ContactInline from '../components/ContactInline';
import CompareTable from '../components/compare/CompareTable';
// import _ from 'lodash';

const RacePage = ({ data, pageContext }) => {
  // console.log('RacePage pageContext', pageContext);
  const { questions, answers } = pageContext;
  const { allRacesJson } = data;
  const race = allRacesJson.edges[0].node;
  // const race = data.allRacesJson.edges[0].node;

  // console.log('racePage data', data);

  // const answers = races.fields.school_answers;
  // console.log('data.edges[0]', data.edges[0])
  // console.log('RacePage questions', questions);
  // console.log('RacePage answers', answers);

  // TODO: make 'region' consistent across data sets
  // it's also having slug trimmed in gatsby-node.js
  // const region = allRacesJson.edges[0].node.office.region
  // const region_url = allRacesJson.edges[0].node.fields.slug
  // const region_url = _.kebabCase(allRacesJson.edges[0].node.office.region);

  return (
    <DefaultLayout
      pageTitle={race.office.title}
      preview={`https://tricitiesvote.com/images/${race.fields.slug}.png`}
      url={race.fields.slug}
    >
      <div className="guide">
        {/* <pre><code>{JSON.stringify(race, null, 2)}</code></pre> */}
        <section className="race" key={race.id}>
          <Link to={`/${race.fields.slug}`}>
            <h1>{race.office.title}</h1>
          </Link>
          <Race data={race} />
          <CompareTable questions={questions} answers={answers} />
        </section>
      </div>
      <ContactInline page={`https://tricitiesvote.com/${race.fields.slug}`} />
    </DefaultLayout>
  );
};

export default RacePage;

export const pageQuery = graphql`
  query($slug: String!) {
    allRacesJson(
      filter: {
        electionyear: { eq: "2023" }
        type: { eq: "general" }
        fields: { slug: { eq: $slug } }
      }
    ) {
      edges {
        node {
          ...RaceDetails
        }
      }
    }
  }
`;
