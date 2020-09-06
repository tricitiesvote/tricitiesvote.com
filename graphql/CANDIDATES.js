const CANDIDATES = `
  candidates: allCandidatesJson(limit: 1000) {
    edges {
      node {
        ...CandidateDetails
      }
    }
  }
`;

export default CANDIDATES;
