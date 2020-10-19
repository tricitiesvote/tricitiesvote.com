import React from 'react';
import { graphql } from 'gatsby';
import DefaultLayout from '../layouts/DefaultLayout';
import Candidate from '../components/Candidate';
import ContactInline from '../components/ContactInline';

const CandidatePage = ({ data }) => {
  // const { edges } = data
  const { allCandidatesJson, location } = data;
  const candidate = allCandidatesJson.edges[0].node;

  return (
    <DefaultLayout
      location={location}
      pageTitle={candidate.name}
      bodyClass="candidate-page"
      preview={`${candidate.image}.png`}
      url={candidate.fields.slug}
    >
      <div className="container-candidate-large">
        <Candidate data={candidate} fullsize="true" />
      </div>
      <ContactInline
        page={`https://tricitiesvote.com/${candidate.fields.slug}`}
      />
    </DefaultLayout>
  );
};

export default CandidatePage;

export const pageQuery = graphql`
  query($slug: String!) {
    allCandidatesJson(filter: { fields: { slug: { eq: $slug } } }) {
      edges {
        node {
          ...CandidateDetails
        }
      }
    }
  }
`;
