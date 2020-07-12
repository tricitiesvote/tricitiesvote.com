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
          hi
          <div
            dangerouslySetInnerHTML={{
              __html: node.fields.bioo_html,
            }}
          />
          {node.frontmatter.email}
          {node.frontmatter.statement}
          {node.frontmatter.website}
          {node.frontmatter.facebook}
          {node.frontmatter.twitter}
          {node.frontmatter.pdc}
          <div
            dangerouslySetInnerHTML={{
              __html: node.fields.lettersyes_html,
            }}
          />
          <div
            dangerouslySetInnerHTML={{
              __html: node.fields.lettersno_html,
            }}
          />
          <div
            dangerouslySetInnerHTML={{
              __html: node.fields.articles_html,
            }}
          />
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