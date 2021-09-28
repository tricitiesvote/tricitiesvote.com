// import React from 'react';
// import { graphql, StaticQuery } from 'gatsby';
// import CompareTable from './CompareTable';
//
// const CompareSchoolBoardCandidates = ({ region, position }) => {
//   console.log(region, position);
//   return (
//     <StaticQuery
//       query={graphql`
//         query($region: String!, $position: String!) {
//           allQs: allSchoolQuestionsCsv {
//             edges {
//               node {
//                 question
//                 statementA
//                 statementB
//                 type
//                 id
//               }
//             }
//           }
//           allAs: allSchoolAnswersCsv(
//             filter: { region: { eq: $region }, position: { eq: $position } }
//           ) {
//             edges {
//               node {
//                 candidate {
//                   name
//                   image
//                   office {
//                     fields {
//                       slug
//                     }
//                   }
//                 }
//                 region
//                 position
//                 question_1
//                 question_2
//                 question_2c
//                 question_3
//                 question_3c
//                 question_4
//                 question_4c
//                 question_5
//                 question_5c
//                 question_6
//                 question_6c
//                 question_7
//                 question_7c
//                 question_8
//                 question_9
//                 question_10
//                 question_11
//                 question_12
//               }
//             }
//           }
//         }
//       `}
//       render={data => (
//         <CompareTable questions={data.allQs.edges} answers={data.allAs.edges} />
//       )}
//     />
//   );
// };
//
// export default CompareSchoolBoardCandidates;
