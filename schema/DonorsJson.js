const DonorsJson = `
type DonorsJson implements Node {
  id:               String
  name:             String
  city:             String
  type:             String
  donations_count:  Int
  total_donated:    Int
  total_cash:       Int
  total_in_kind:    Int
  funded:           [CandidatesJson] @link(by: "uuid", from: "funded")
  donations:        [DonationsJson] @link
}
`;

export default DonorsJson;
