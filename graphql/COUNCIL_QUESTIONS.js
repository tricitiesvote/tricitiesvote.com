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

module.exports = COUNCIL_QUESTIONS;
