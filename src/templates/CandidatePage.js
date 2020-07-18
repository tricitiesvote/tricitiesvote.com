// import React from 'react';
// import { graphql } from 'gatsby';
// import DefaultLayout from '../layouts/DefaultLayout';
// // import Candidate from '../components/Candidate';

// const CandidatePage = ({ data }) => {
//   const candidate = data.markdownRemark;
// //   const {
// //     name,
// //     city,
// //     position,
// //     img,
// //     bio,
// //     statement,
// //     lettersyes,
// //     lettersno,
// //     email,
// //     website,
// //     facebook,
// //     pdc,
// //     donors,
// //     articles
// //   } = candidate.frontmatter;

//   return (
//     <DefaultLayout>
//       <div>
//         <h1>{JSON.stringify(candidate)}</h1>
//       </div>
//     </DefaultLayout>
//   );
// };

// export default CandidatePage;

// export const pageQuery = graphql`
//   query($slug: String!) {
//     markdownRemark(fields: { slug: { eq: $slug } }) {
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
// `;
