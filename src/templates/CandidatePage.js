import React from 'react';
import { graphql } from 'gatsby';
import DefaultLayout from '../layouts/DefaultLayout';
import Candidate from '../components/Candidate';

const CandidatePage = ({ data }) => {
  // const { edges } = data
  const { allCandidatesJson } = data
  const candidate = allCandidatesJson.edges[0].node

  return (
    <DefaultLayout>
      <div class="container-candidate-large">
        <Candidate data={candidate} fullsize="true" />
      </div>
    </DefaultLayout>
  );
};

export default CandidatePage;

export const pageQuery = graphql`
  query($slug: String!) {
    allCandidatesJson(filter: {fields: {slug: {eq: $slug}}}) {
      edges {
        node {
          ...CandidateDetails
        }
      }
    }
  }
`;
