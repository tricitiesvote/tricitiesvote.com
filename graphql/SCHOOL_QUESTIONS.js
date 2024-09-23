const SCHOOL_QUESTIONS = `
schoolQuestions: allSchoolQuestionsCsv(limit: 1000) {
  edges {
    node {
      question
      statementA
      statementB
      type
      id
    }
  }
}
`;

module.exports = SCHOOL_QUESTIONS;
