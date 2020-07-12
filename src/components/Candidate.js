import React from "react"
import { graphql } from "gatsby"

class Candidate extends React.Component {
  render() {
    {posts.map(({ node }) => {
      return (
        <div key={node.fields.slug}>
          {node.frontmatter.name}
          {node.frontmatter.img}
          {node.frontmatter.bio}
          {node.frontmatter.statement}
          {node.frontmatter.lettersyes}
          {node.frontmatter.lettersno}
          {node.frontmatter.website}
          {node.frontmatter.facebook}
          {node.frontmatter.pdc}
          {node.frontmatter.donors}
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
        img
        bio
        statement
        lettersyes
        lettersno
        website
        facebook
        pdc
        donors
        articles
      }
    }
  }
`