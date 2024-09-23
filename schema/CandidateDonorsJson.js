const CandidateDonorsJson = `
type CandidateDonorsJson implements Node {
  id:               String
  donor:            DonorsJson @link(by: "id", from: "donor")
  candidate:        CandidatesJson @link(by: "uuid", from: "candidate")
  name:             String
  city:             String
  total_donated:    Int
  total_cash:       Int
  total_in_kind:    Int
  donations:        [DonationsJson] @link
}
`;

module.exports = CandidateDonorsJson;
