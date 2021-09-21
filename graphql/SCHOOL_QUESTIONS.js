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

export default SCHOOL_QUESTIONS;