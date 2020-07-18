// import React from "react"
// import { graphql } from "gatsby"

// class Candidate extends React.Component {
//   render() {
//     {posts.map(({ node }) => {
//       return (
//         <div key={node.fields.slug}>
//           {node.name}
//           {node.region}
//           {node.office }
//           {node.image}
//           <div
//             dangerouslySetInnerHTML={{
//               __html: node.fields.bioo_html,
//             }}
//           />
//           {node.email}
//           {node.statement}
//           {node.website}
//           {node.facebook}
//           {node.twitter}
//           {node.pdc}
//           <div
//             dangerouslySetInnerHTML={{
//               __html: node.fields.lettersyes_html,
//             }}
//           />
//           <div
//             dangerouslySetInnerHTML={{
//               __html: node.fields.lettersno_html,
//             }}
//           />
//           <div
//             dangerouslySetInnerHTML={{
//               __html: node.fields.articles_html,
//             }}
//           />
//           <p
//             dangerouslySetInnerHTML={{
//               __html: node.description || node.excerpt,
//             }}
//           />
//         </div>
//       )
//     })}
//   }
// }

// export default Candidate

// export const pageQuery = graphql`
//   query BlogPostBySlug($slug: String!) {
//     site {
//       siteMetadata {
//         title
//         author
//       }
//     }
//     markdownRemark(fields: { slug: { eq: $slug } }) {
//       id
//       excerpt(pruneLength: 160)
//       html
//       frontmatter {
//         name
//         region
//         office 
//         image
//         bio
//         email
//         statement
//         website
//         facebook
//         twitter
//         pdc
//         lettersyes
//         lettersno
//         articles
//       }
//     }
//   }
// `