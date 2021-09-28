import React from 'react';
import { graphql } from 'gatsby';
import Candidate from './Candidate';
// import CompareCityCouncilCandidates from './compare/CompareCityCouncilCandidates';
// import CompareSchoolBoardCandidates from './compare/CompareSchoolBoardCandidates';
// TODO add back in comparisons
// import CompareLegislators from './compare/CompareLegislators';
// import CompareCommissioners from './compare/CompareCommissioners';
// import CompareCongress from './compare/CompareCongress';
// import CompareJudges from './compare/CompareJudges';

const Race = props => {
  const { data } = props;

  const { candidates } = data;

  // console.log('candidates', candidates);
  console.log('slice', candidates[0].office.job.slice(0, 1));
  console.log('region', candidates[0].office.region);
  console.log('position', candidates[0].office.position);

  // TODO add back in comparisons
  // const thisOffice = CompareSet[office.title].office;
  // const CompareCandidates = CompareSet[office.title].component;

  // TODO add back in within the <> </> below
  //  <CompareCandidates office={thisOffice} />

  if (candidates) {
    return (
      <>
        <div className="container-candidate">
          {candidates.map(candidate => (
            <Candidate data={candidate} />
          ))}
        </div>
      </>
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
