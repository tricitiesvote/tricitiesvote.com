import React from "react"
import { graphql } from "gatsby"

import DefaultLayout from "../layouts/DefaultLayout"
import CandidateCollection from "../components/CandidateCollection.js"

class SiteIndex extends React.Component {
  render() {
    const { data } = this.props
    const siteTitle = data.site.siteMetadata.title

    return (
      <DefaultLayout location={this.props.location} title={siteTitle}>

        {/* <pre><code>${JSON.stringify(dataset, null, 2)}</code></pre> */}

        <CandidateCollection />

      </DefaultLayout>
    )
  }
}

export default SiteIndex

export const pageQuery = graphql`

  fragment OfficeDetails on OfficesJson {
    title
    job
    position
    region
    uuid
  }

  fragment CandidateDetails on CandidatesJson {
    fields {
      slug
    }
    office {
      ...OfficeDetails
    }
    electionyear  
    name
    party
    incumbent
    yearsin
    image
    statement
    email
    website
    facebook
    twitter
    instagram
    youtube
    pdc
    uuid
    hide
    bio
    bioHtml
    lettersyes
    lettersyesHtml
    lettersno
    lettersnoHtml
    articles
    articlesHtml
  }

  fragment RaceDetails on RacesJson {
    fields {
      slug
    }
    candidates {
      ...CandidateDetails
    }
    electionyear
    office {
      ...OfficeDetails
    }
    type
    uuid
    intro
    body
    hide
  }

  query {
    site {
      siteMetadata {
        title
      }
    }

    allOfficesJson(
      limit: 1000
    ) {
      edges {
        node {
          ...OfficeDetails
        }
      }
    }

    allCandidatesJson(
      limit: 1000
    ) {
      edges {
        node {
          ...CandidateDetails
        }
      }
    }

    allRacesJson(
      limit: 1000
    ) {
      edges {
        node {
          ...RaceDetails
        }
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
