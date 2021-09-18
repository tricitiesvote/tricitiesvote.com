const GUIDES = `
  guides: allGuidesJson(
    filter: { electionyear: { eq: "2021" }, type: { eq: "general" } }
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
`;

export default GUIDES;
