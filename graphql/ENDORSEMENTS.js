const ENDORSEMENTS = `
  endorsements: allEndorsementsCsv(limit: 1000) {
    edges {
      node {
        candidate
        endorser
        forAgainst
        type
        url
      }
    }
  }
`;

export default ENDORSEMENTS;
