const PORT_ANSWERS = `
portAnswers: allPortAnswersCsv(limit: 1000) {
  edges {
    node {
      ...PortAnswerDetails
    }
  }
}
`;

export default PORT_ANSWERS;
