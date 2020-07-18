import React from "react"
import { graphql } from "gatsby"

import DefaultLayout from "../layouts/DefaultLayout"

class SiteIndex extends React.Component {
  render() {
    const { data } = this.props
    const siteTitle = data.site.siteMetadata.title
    const posts = data.allMarkdownRemark.edges

    return (
      <DefaultLayout location={this.props.location} title={siteTitle}>
        {posts.map(({ node }) => {

          var candidateData = node.frontmatter
          var candidateHtml = node.fields
        
          var bio, recyes, recno, recs, donors, articles, website, facebook, pdc

          if (candidateHtml.lettersyes_html) {
            recyes = <li className="yes"
              dangerouslySetInnerHTML={{
                __html: candidateHtml.lettersyes_html
              }}
            ></li>
          } else {
            recyes = <li className="yes">No letters yet. <a href="https://triciti.es/letters-to-an-editor">Write one</a>.</li>
          }

          if (candidateHtml.lettersno_html) {
            recno = <li className="no"
              dangerouslySetInnerHTML={{
                __html: candidateHtml.lettersno_html
              }}
            ></li>
            recno = ''
          }

          if (recyes || recno) {
            recs = <ul className="recs">
              {recyes}
              {recno}
            </ul>
          } else {
            recs = ''
          }

          if (candidateHtml.donors_html) {
            donors = <ul className="donors">
              <li title="As of September 16"
                dangerouslySetInnerHTML={{
                __html: candidateHtml.donors_html
              }}
              ></li>
            </ul>
          } else {
            donors = <ul className="donors">
            <li title="As of September 16">
              <span>Candidate is a mini-filer raising less than the statutory requirements for public reporting.</span>
            </li>
          </ul>
          }

          if (candidateHtml.articles_html) {
            articles =  <ul className="news"
              dangerouslySetInnerHTML={{
                __html: candidateHtml.articles_html
              }}
            ></ul>
          } else {
            articles = ''
          }

          if (candidateHtml.bio_html) {
            bio =  <div className="bio"
              dangerouslySetInnerHTML={{
                __html: candidateHtml.bio_html
              }}
            ></div>
          } else {
            bio = ''
          }

          if (candidateData.website) {
            website = <li>
              <span role="img" aria-label="link">🌐</span> 
              <a href={candidateData.website}>Website</a>
            </li>
          } else {
            website = ''
          }

          if (candidateData.facebook) {
            facebook = <li>
              <span role="img" aria-label="link">🌐</span> 
              <a href={candidateData.facebook}>Facebook</a>
            </li>
          } else {
            facebook = ''
          }

          if (candidateData.pdc) {
            pdc = <li>
              <span role="img" aria-label="finance">💰</span> 
              <a href={candidateData.pdc}>Finance</a>
            </li>
          } else {
            pdc = ''
          }
          
          return (
            <div className="container-candidate" key={node.fields.slug}>
              <div className="candidate">
                <div className="details">
                  <h5>
                    <a href={candidateData.statement}>
                      {candidateData.name}
                    </a>
                  </h5>
                  {bio}
                  {recs}
                  {donors}
                  {articles}
                </div>
                <div className="info">
                  <img src={candidateData.image} alt={candidateData.name} />
                  <ul>
                    {website}
                    {facebook}
                    {pdc}
                  </ul>
                </div>
                {/* <h1>{JSON.stringify(candidateHtml)}</h1> */}
              </div>
            </div>
          )
        })}
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
    office {
      ...OfficeDetails
    }
    electionyear  
    name
    region
    party
    incumbent
    yearsin
    image
    email
    website
    facebook
    twitter
    instagram
    pdc
    uuid
    hide
    bio
    bioHtml
    statement
    statementHtml
    lettersyes
    lettersyesHtml
    lettersno
    lettersnoHtml
    articles
    articlesHtml
  }

  fragment RaceDetails on RacesJson {
    candidates {
      ...CandidateDetails
    }
    electionyear
    title
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
      limit: 1000
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
