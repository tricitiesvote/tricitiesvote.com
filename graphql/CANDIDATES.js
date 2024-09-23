const CANDIDATES = `
  candidates: allCandidatesJson(limit: 1000) {
    edges {
      node {
        ...CandidateDetails
      }
    }
  }
`;

module.exports = CANDIDATES;
