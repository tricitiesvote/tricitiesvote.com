import React from "react"
import { graphql } from "gatsby"
import Candidate from "./Candidate";

const Race = props => {
  const { data } = props

  const candidates = data.candidates;

  if (candidates) {
    return(
      <div className="container-candidate">
        {/* <pre><code>{JSON.stringify(props,null,2)}</code></pre> */}
        {candidates.map(candidate => (
          <Candidate data={candidate} />
        ))}
      </div>
    )
  } else {
    return(<div className="candidate-set"></div>)
  }
  
  
}

export default Race

export const pageQuery = graphql`
  fragment RaceDetails on RacesJson {
    fields {
      slug
    }
    electionyear
    type
    office {
      ...OfficeDetails
    }
    intro
    body
    candidates {
      ...CandidateDetails
    }
    uuid
    hide
  }
`