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

          var candidate = node.frontmatter
        
          var recyes, recno, recs, donors, articles, website, facebook, pdc

          if (candidate.lettersyes) {
            recyes = <li className="yes"
              dangerouslySetInnerHTML={{
                __html: candidate.lettersyes
              }}
            ></li>
          } else {
            recyes = <li className="yes">No letters yet. <a href="https://triciti.es/letters-to-an-editor">Write one</a>.</li>
          }

          if (candidate.lettersno) {
            recno = <li className="no"
              dangerouslySetInnerHTML={{
                __html: candidate.lettersno
              }}
            ></li>
          } else {
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

          if (candidate.donors) {
            donors = <ul className="donors">
              <li title="As of September 16"
                dangerouslySetInnerHTML={{
                __html: candidate.donors || ''
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

          if (candidate.articles) {
            articles =  <ul className="news"
              dangerouslySetInnerHTML={{
                __html: candidate.articles || ''
              }}
            ></ul>
          } else {
            articles = ''
          }

          if (candidate.website) {
            website = <li>
              <span role="img" aria-label="link">🌐</span> 
              <a href={candidate.website}>Website</a>
            </li>
          } else {
            website = ''
          }

          if (candidate.facebook) {
            facebook = <li>
              <span role="img" aria-label="link">🌐</span> 
              <a href={candidate.facebook}>Facebook</a>
            </li>
          } else {
            facebook = ''
          }

          if (candidate.pdc) {
            pdc = <li>
              <span role="img" aria-label="finance">💰</span> 
              <a href={candidate.pdc}>Finance</a>
            </li>
          } else {
            pdc = ''
          }
          
          return (
            <div className="container-candidate" key={node.fields.slug}>
              <div className="candidate">
                <div className="details">
                  <h5>
                    <a href={candidate.statement}>
                      {candidate.name}
                    </a>
                  </h5>
                  <p>
                    {candidate.bio}
                  </p>
                  {recs}
                  {donors}
                  {articles}
                </div>
                <div className="info">
                  <img src={candidate.img} alt={candidate.name} />
                  <ul>
                    {website}
                    {facebook}
                    {pdc}
                  </ul>
                </div>
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
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark {
      edges {
        node {
          excerpt
          fields {
            slug
          }
          id
          html
          frontmatter {
            name
            region
            office 
            image
            bio
            email
            statement
            website
            facebook
            twitter
            pdc
            lettersyes
            lettersno
            articles
          }
        }
      }
    }
  }
`
