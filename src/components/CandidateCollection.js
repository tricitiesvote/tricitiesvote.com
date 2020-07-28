import React from "react"
import { graphql, StaticQuery } from "gatsby"
import Candidate from "./Candidate";

const CandidateCollection = () => {
  return(
    <StaticQuery
      query={graphql`
        query {
          allCandidatesJson {
            edges {
              node {
                ...CandidateDetails
              }
            }
          }
        }
      `}
      render={data => (
        <div className="candidate-set">
          {data.allCandidatesJson.edges.map(edge => (
            <Candidate
              data={edge.node}
              fullsize="false"
            />
          ))}
        </div>
      )}
    />
  )
}

export default CandidateCollection