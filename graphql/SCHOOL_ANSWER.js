const SCHOOL_ANSWER = `
fragment SchoolAnswerDetails on SchoolAnswersCsv {
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
  question_10
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
  question_7
  question_7c
  question_8
  question_9
}
`;

export default SCHOOL_ANSWER;

//
// candidate {
//   name
//   image
//   office {
//     fields {
//       slug
//     }
//   }
// }
