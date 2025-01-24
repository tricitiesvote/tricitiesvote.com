const OFFICES = `
  offices: allOfficesJson(limit: 1000) {
    edges {
      node {
        ...OfficeDetails
      }
    }
  }
`;

export default OFFICES;
