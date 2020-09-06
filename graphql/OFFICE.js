import gql from 'graphql-tag';

const OFFICE = gql`
  fragment OfficeDetails on OfficesJson {
    title
    job
    position
    region
    uuid
  }
`;

export default OFFICE;
