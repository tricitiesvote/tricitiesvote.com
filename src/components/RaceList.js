import React from "react"
import { Link } from "gatsby"
import Race from "./Race";

const RaceList = props => {
  const { data } = props;

  // is this a list of races or a list of candidates?

  return (
    <div className="races-collection" key={data.uuid}>
      {data.map(race => (
        <section className="race" key={race.uuid}>
          <Link to={'/' + race.fields.slug}>
            <h2>{race.office.title}</h2>
          </Link>
          <Race data={race} />
        </section>
      ))}
      {/* <pre><code>
        {JSON.stringify(data,null,2)}
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

