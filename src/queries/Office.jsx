export const OfficeDetailsFragment = graphql`
  fragment OfficeDetails on Office {
    fields {
      slug
    }
    title
    job
    position
    region
    uuid
  }
`