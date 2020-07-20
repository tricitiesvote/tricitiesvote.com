import React from 'react';
import { graphql, Link } from 'gatsby';
import DefaultLayout from '../layouts/DefaultLayout';
import RaceList from '../components/RaceList';
// import _ from 'lodash';

const GuidePage = ({ data }) => {
  const { allGuidesJson } = data;
  const races = allGuidesJson.edges[0].node.races
  const region = allGuidesJson.edges[0].node.region

  return (
    <DefaultLayout>
      <div className="guide" key={data.uuid}>
        {/* <pre><code>{JSON.stringify(data, null, 2)}</code></pre> */}
        <h1>{region}</h1>
        <RaceList data={races} />
      </div>
    </DefaultLayout>
  );
};

export default GuidePage;

export const pageQuery = graphql`
  query($slug: String!) {
    allGuidesJson(
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
`

