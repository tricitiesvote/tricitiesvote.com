import React from "react"
import { graphql } from "gatsby"

class Candidate extends React.Component {
  render() {
    {posts.map(({ node }) => {
      return (
        <div key={node.fields.slug}>
          {node.frontmatter.name}
          {node.frontmatter.region}
          {node.frontmatter.office }
          {node.frontmatter.image}
          {node.frontmatter.bio}
          {node.frontmatter.email}
          {node.frontmatter.statement}
          {node.frontmatter.website}
          {node.frontmatter.facebook}
          {node.frontmatter.twitter}
          {node.frontmatter.pdc}
          {node.frontmatter.lettersyes}
          {node.frontmatter.lettersno}
          {node.frontmatter.articles}
          <p
            dangerouslySetInnerHTML={{
              __html: node.frontmatter.description || node.excerpt,
            }}
          />
        </div>
      )
    })}
  }
}

export default Candidate

export const pageQuery = graphql`
  query BlogPostBySlug($slug: String!) {
    site {
      siteMetadata {
        title
        author
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      excerpt(pruneLength: 160)
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
`