import React from "react"
// import { graphql } from "gatsby"
import Race from "./Race";

const RaceList = props => {
  const { data } = props;

  return (
    <div className="races-collection" key={data.uuid}>
      {data.map(race => (
        <section className="race" key={race.uuid}>
          <h2>{race.office.title}</h2>
          <Race data={race} />
        </section>
      ))}
      {/* <pre><code>
        {JSON.stringify(races,null,2)}
      </code></pre> */}
    </div>
  )
}

export default RaceList

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

