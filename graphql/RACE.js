import gql from 'graphql-tag';

const RACE = gql`
  fragment RaceDetails on RacesJson {
    fields {
      slug
    }
    electionyear
    type
    office {
      ...OfficeDetails
    }
    intro
    body
    candidates {
      ...CandidateDetails
    }
    uuid
    hide
  }
`;

export default RACE;
