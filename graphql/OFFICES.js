const OFFICES = `
  offices: allOfficesJson(limit: 1000) {
    edges {
      node {
        ...OfficeDetails
      }
    }
  }
`;

module.exports = OFFICES;
