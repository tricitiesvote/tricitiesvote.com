const DonorsJson = `
type DonorsJson implements Node {
  id:               String
  name:             String
  city:             String
  type:             String
  total_donated:    Int
  total_cash:       Int
  total_in_kind:    Int
  funded:           [CandidatesJson] @link(by: "uuid", from: "funded")
}
`;

export default DonorsJson;
