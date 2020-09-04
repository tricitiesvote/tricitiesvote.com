import React from 'react';
import { graphql } from 'gatsby';
import Candidate from './Candidate';

const Race = props => {
  const { data } = props;

  const { candidates } = data;

  if (candidates) {
    return (
      <div className="container-candidate">
        {candidates.map(candidate => (
          <Candidate data={candidate} />
        ))}
      </div>
    );
  }
  return <div className="candidate-set" />;
};

export default Race;

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
`;
