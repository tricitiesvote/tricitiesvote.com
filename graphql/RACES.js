const RACES = `
  races: allRacesJson(limit: 1000) {
    edges {
      node {
        ...RaceDetails
      }
    }
  }
`;

module.exports = RACES;
