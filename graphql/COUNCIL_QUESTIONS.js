const COUNCIL_QUESTIONS = `
councilQuestions: allCouncilQuestionsCsv(limit: 1000) {
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

export default COUNCIL_QUESTIONS;