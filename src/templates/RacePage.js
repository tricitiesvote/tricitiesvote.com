import React from 'react';
import { graphql, Link } from 'gatsby';
import DefaultLayout from '../layouts/DefaultLayout';
import Race from '../components/Race';
import _ from 'lodash';

const RacePage = ({ data }) => {
  const { allRacesJson } = data;
  const race = allRacesJson.edges[0]
  // TODO: make 'region' consistent across data sets
  // it's also having slug trimmed in gatsby-node.js
  const region = allRacesJson.edges[0].node.office.region
  // const region_url = allRacesJson.edges[0].node.fields.slug
  const region_url = _.kebabCase(allRacesJson.edges[0].node.office.region);

  return (
    <DefaultLayout>
      <div className="guide">
        {/* <pre><code>{JSON.stringify(race, null, 2)}</code></pre> */}
        <Link to={'/' + region_url}>
          <h1>{region}</h1>
        </Link>
        <section className="race" key={race.uuid}>
          <Link to={'/' + race.node.fields.slug}>
            <h2>{race.node.office.title}</h2>
          </Link>
          <Race data={race.node} />
        </section>
      </div>
    </DefaultLayout>
  );
};

export default RacePage;

export const pageQuery = graphql`
  query($slug: String!) {
    allRacesJson(
      filter: {
        electionyear: {eq: "2020"}, 
        type: {eq: "primary"},
        fields: {slug: {eq: $slug}}
      }
    ) {
      edges {
        node {
          fields {
            slug
          }
          ...RaceDetails
        }
      }
    }
  }
`

