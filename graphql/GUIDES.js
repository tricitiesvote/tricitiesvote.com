const CANDIDATES = `
  guides: allGuidesJson(limit: 1000) {
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
`;

export default CANDIDATES;
