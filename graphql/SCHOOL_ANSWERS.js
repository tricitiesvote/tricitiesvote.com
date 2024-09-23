const SCHOOL_ANSWERS = `
schoolAnswers: allSchoolAnswersCsv(limit: 1000) {
  edges {
    node {
      ...SchoolAnswerDetails
    }
  }
}
`;

module.exports = SCHOOL_ANSWERS;
