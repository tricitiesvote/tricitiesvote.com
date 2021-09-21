const SchoolAnswersCsv = `
  type SchoolAnswersCsv implements Node {
    candidate:        CandidatesJson @link(by: "uuid", from: "candidate")
  }`;

export default SchoolAnswersCsv;
