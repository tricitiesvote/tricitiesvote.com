const COUNCIL_ANSWERS = `
councilAnswers: allCouncilAnswersCsv {
  edges {
    node {
      ...CouncilAnswerDetails
    }
  }
}
`;

module.exports = COUNCIL_ANSWERS;
