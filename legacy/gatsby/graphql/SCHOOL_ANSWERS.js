const SCHOOL_ANSWERS = `
schoolAnswers: allSchoolAnswersCsv(limit: 1000) {
  edges {
    node {
      ...SchoolAnswerDetails
    }
  }
}
`;

export default SCHOOL_ANSWERS;
