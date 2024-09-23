const GuidesJson = `
type GuidesJson implements Node {
  fields:           Fields
  electionyear:     String
  type:             String
  region:           String
  races:            [RacesJson] @link(by: "uuid", from: "races")
}
`;

module.exports = GuidesJson;
