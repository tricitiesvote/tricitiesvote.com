const PORT_QUESTIONS = `
portQuestions: allPortQuestionsCsv(limit: 1000) {
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

export default PORT_QUESTIONS;
