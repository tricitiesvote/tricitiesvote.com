const CandidateDonorTypesJson = `
type CandidateDonorTypesJson implements Node {
  id:               String
  candidate:        CandidatesJson @link(by: "uuid", from: "candidate")
  donor_type:       String
  total_donated:    Int
  total_cash:       Int
  total_in_kind:    Int
  donations:        [DonationsJson] @link(by: "id", from: "donations")
}
`;

export default CandidateDonorTypesJson;
