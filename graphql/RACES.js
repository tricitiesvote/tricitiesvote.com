import gql from 'graphql-tag';

const RACES = gql`
  races: allRacesJson(limit: 1000) {
    edges {
      node {
        ...RaceDetails
      }
    }
  }
`;

export default RACES;
