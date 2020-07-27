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
              slug={edge.node.fields.slug}
              key={edge.node.uuid}
              name={edge.node.name}
              office={edge.node.office.title}
              position={edge.node.office.position}
              incumbent={edge.node.incumbent}
              yearsin={edge.node.yearsin}
              image={edge.node.image}
              statement={edge.node.statement}
              bioHtml={edge.node.bioHtml}
              email={edge.node.email}
              website={edge.node.website}
              facebook={edge.node.facebook}
              instagram={edge.node.instagram}
              youtube={edge.node.youtube}
              pdc_url={edge.node.pdc_url}
              lettersyesHtml={edge.node.lettersyesHtml}
              lettersnoHtml={edge.node.lettersnoHtml}
              articlesHtml={edge.node.articlesHtml}
            />
          ))}
        </div>
      )}
    />
  )
}

export default CandidateCollection