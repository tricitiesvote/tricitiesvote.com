const COUNCIL_QUESTIONS = `
councilQuestions: allCouncilQuestionsCsv {
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