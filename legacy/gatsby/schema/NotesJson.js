const NotesJson = `
type NotesJson implements Node {
  fields:          NoteFields
  candidate:       CandidatesJson @link(by: "uuid", from: "candidate")
  notes:           String
}
`;

export default NotesJson;
