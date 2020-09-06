import gql from 'graphql-tag';

const CANDIDATES = gql`
  candidates: allCandidatesJson(limit: 1000) {
    edges {
      node {
        ...CandidateDetails
      }
    }
  }
`;

export default CANDIDATES;
