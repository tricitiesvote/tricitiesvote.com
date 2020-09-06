import gql from 'graphql-tag';

const OFFICES = gql`
  offices: allOfficesJson(limit: 1000) {
    edges {
      node {
        ...OfficeDetails
      }
    }
  }
`;

export default OFFICES;
