const CandidateDonorsJson = `
type CandidateFundraisingJson implements Node {
  id:               String
  candidate:        CandidatesJson @link(by: "uuid", from: "candidate")
  unique_donors:    Int
  total_raised:     Int
  total_cash:       Int
  total_in_kind:    Int
  donors:           [DonorsJson] @link(by: "id", from: "donors")
}
`;

export default CandidateDonorsJson;
