const ENDORSEMENTS = `
  endorsements: allEndorsementsJson(limit: 1000) {
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
