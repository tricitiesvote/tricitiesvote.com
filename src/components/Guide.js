import React from "react"
import { Link } from "gatsby"
import RaceList from "./RaceList";

const Guide = props => {
  const { data } = props;
  const races = data.node.races;

  return (
    <div className="guide" key={props.uuid}>
      <Link to={'/' + data.node.fields.slug}>
          <h1>{data.node.region}</h1>
        </Link>
      <RaceList data={races} />
      {/* <pre><code>
        {JSON.stringify(props,null,2)}
      </code></pre> */}
    </div>
  )
}

export default Guide

// export const pageQuery = graphql`
//   query {
//     allGuidesJson(
//       filter: {
//         electionyear: {eq: "2020"}, 
//         type: {eq: "primary"}
//       }
//     ) {
//       edges {
//         node {
//           fields {
//            slug
//           }
//           races {
//             ...RaceDetails
//           }
//           electionyear
//           type
//           region
//         }
//       }
//     }
//   }
// `

