const GuidesJson = `
type GuidesJson implements Node {
  electionyear:     String
  type:             String
  region:           String
  races:            [RacesJson] @link(by: "uuid", from: "races")
}
`;

export default GuidesJson;
