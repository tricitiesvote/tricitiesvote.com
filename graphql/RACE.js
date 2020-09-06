const RACE = `
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
