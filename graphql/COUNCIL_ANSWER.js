const COUNCIL_ANSWER = `
fragment CouncilAnswerDetails on CouncilAnswersCsv {
  candidate
  fields {
    responder {
      name
      image
      uuid
      fields {
        slug
      }
      office {
        title
        position
        region
      }
    }
  }
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
}
`;

module.exports = COUNCIL_ANSWER;
