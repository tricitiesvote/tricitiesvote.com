import gql from 'graphql-tag';

const NOTES = gql`
notes: allNotesJson(limit: 1000) {
  edges {
    node {
      fields {
        notes_html
      }
      candidate {
        name
        office {
          ...OfficeDetails
        }
        image
        fields {
          slug
        }
      }
      notes
    }
  }
}
`;

export default NOTES;
