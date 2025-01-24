import React from 'react';
import { graphql, Link } from 'gatsby';
import DefaultLayout from '../layouts/DefaultLayout';
import Race from '../components/Race';
import ContactInline from '../components/ContactInline';
import '../styles/preview.css';
// import _ from 'lodash';

const RacePagePreview = ({ data }) => {
  const { allRacesJson } = data;
  const race = allRacesJson.edges[0].node;
  // TODO: make 'region' consistent across data sets
  // it's also having slug trimmed in gatsby-node.js
  // const region = allRacesJson.edges[0].node.office.region
  // const region_url = allRacesJson.edges[0].node.fields.slug
  // const region_url = _.kebabCase(allRacesJson.edges[0].node.office.region);

  return (
    <DefaultLayout bodyClass="preview-page">
      <div className="guide">
        {/* <pre><code>{JSON.stringify(race, null, 2)}</code></pre> */}
        <section className="race" key={race.uuid}>
          <Link to={`/${race.fields.slug}`}>
            <h1>{race.office.title}</h1>
          </Link>
          <Race data={race} />
        </section>
      </div>
      <ContactInline page={`https://tricitiesvote.com/${race.fields.slug}`} />
    </DefaultLayout>
  );
};

export default RacePagePreview;

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
          fields {
            slug
          }
          ...RaceDetails
        }
      }
    }
  }
`;
