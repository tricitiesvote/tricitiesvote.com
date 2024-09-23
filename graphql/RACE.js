const RACE = `
  fragment RaceDetails on RacesJson {
    fields {
      slug
      school_answers {
        candidate
        region
        position
        question_1
        question_8
        question_9
        question_10
        question_11
        question_12
      }
      council_answers {
        candidate
        region
        position
        question_1
        question_2
        question_3
        question_4
        question_4c
        question_5
        question_5c
        question_6
        question_6c
        question_7
        question_7c
        question_8
        question_8c
        question_9
        question_9c
        question_10
        question_10c
        question_11
        question_12
      }
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

module.exports = RACE;
