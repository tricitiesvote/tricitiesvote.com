const CouncilAnswersCsv = `
type CouncilAnswersCsv implements Node {
  candidate:        CandidatesJson @link(by: "uuid", from: "candidate")
}`;

export default CouncilAnswersCsv;
