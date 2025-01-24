import React from 'react';
import { graphql } from 'gatsby';
import DefaultLayout from '../layouts/DefaultLayout';
import RaceList from '../components/RaceList';
import ContactInline from '../components/ContactInline';
// import _ from 'lodash';

const GuidePage = ({ data }) => {
  const { allGuidesJson } = data;
  const { races } = allGuidesJson.edges[0].node;
  const { region } = allGuidesJson.edges[0].node;

  return (
    <DefaultLayout>
      <div className="guide-page guide" key={data.uuid}>
        {/* <pre><code>{JSON.stringify(data, null, 2)}</code></pre> */}
        <h1>{region}</h1>
        <RaceList data={races} />
      </div>
      <ContactInline page="guide" />
    </DefaultLayout>
  );
};

export default GuidePage;

export const pageQuery = graphql`
  query($slug: String!) {
    allGuidesJson(
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
`;
