const COUNCIL_ANSWER = `
fragment CouncilAnswerDetails on CouncilAnswersCsv {
  candidate {
    name
    image
    office {
      fields {
        slug
      }
    }
  }
  region
  position
  question_1
  question_10
  question_10c
  question_11
  question_12
  question_2
  question_2c
  question_3
  question_3c
  question_4
  question_4c
  question_5
  question_5c
  question_6
  question_6c
  question_7c
  question_8
  question_8c
  question_9
  question_9c
  question_7
}
`;

export default COUNCIL_ANSWER;
