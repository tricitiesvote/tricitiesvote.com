// import React from "react"
// import { graphql, Link } from "gatsby"

// const CandidateMini = props => {

//   const { 
//     data
//   } = props;

//   // const { slug } = fields
//   // const url = `/${slug}`;

//   return (
//     <div className="candidate">
//       <pre><code>
//         {JSON.stringify(data,null,2)}
//       </code></pre>
//       {/* <Link to={url}>
//         <img src={image} alt={name} />
//       </Link> */}
//       {data.forEach(candidate =>
//         <div className="candidate-mini">
//           <img src={candidate.image} />
//         </div>
//       )}
//     </div>
//   );
// };

// export default CandidateMini

// export const pageQuery = graphql`

//   fragment OfficeDetails on OfficesJson {
//     title
//     job
//     position
//     region
//     uuid
//   }

// `
