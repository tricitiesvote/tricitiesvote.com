// CandidatesJson @link(by: "uuid", from: "candidate")
const EndorsementsJson = `
type EndorsementsJson implements Node {
  candidate:        String
  type:             String
  endorser:         String
  forAgainst:       String
  url:              String
}
`;

module.exports = EndorsementsJson;
