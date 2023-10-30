import { graphql } from 'gatsby';

export const fragment = graphql`
  fragment OfficeDetails on OfficesJson {
    title
    job
    position
    region
    uuid
  }
`;
