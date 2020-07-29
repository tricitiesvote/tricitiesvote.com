import React from "react"
import { graphql } from "gatsby"
// import _ from 'lodash'
import DefaultLayout from "../layouts/DefaultLayout"
import Guide from "../components/Guide.js"

// collect Candidates in Races, collect Races in Guides

class SiteIndex extends React.Component {
  render() {
    const { data } = this.props
    const siteTitle = data.site.siteMetadata.title

    const guides = data.allGuidesJson.edges;

    return (
      <DefaultLayout location={this.props.location} title={siteTitle}>
        {guides.map(guide => (
          <Guide data={guide} />
        ))}
      </DefaultLayout>
    )
  }
}

export default SiteIndex

export const pageQuery = graphql`

  query {
    site {
      siteMetadata {
        title
      }
    }
    
    allGuidesJson(
      filter: {
        electionyear: {eq: "2020"}, 
        type: {eq: "primary"}
      }
    ) {
      edges {
        node {
          fields {
            slug
          }
          races {
            ...RaceDetails
          }
          electionyear
          type
          region
        }
      }
    }
  }
`
