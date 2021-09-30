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

const Race = ({ data }) => {
  const { candidates } = data;

  // TODO add back in comparisons
  // const thisOffice = CompareSet[office.title].office;
  // const CompareCandidates = CompareSet[office.title].component;

  // TODO add back in within the <> </> below
  //  <CompareCandidates office={thisOffice} />

  if (candidates) {
    // const thisOffice = candidates[0].office.job.slice(0, 1);
    // const thisRegion = candidates[0].office.region;
    // const thisPos = candidates[0].office.position;

    // console.log('candidates', candidates);
    // console.log('office', thisOffice);
    // console.log('region', thisRegion);
    // console.log('position', thisPos);

    return (
      <>
        <div className="container-candidate">
          {candidates.map(candidate => (
            <Candidate key={candidate.id} data={candidate} />
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
      school_answers {
        candidate
        fields {
          responder {
            name
            image
            uuid
            fields {
              slug
            }
            office {
              title
              position
              region
            }
          }
        }
        region
        position
        question_1
        question_10
        question_11
        question_12
        question_2
        question_2c
        question_3
        question_3c
        question_4
        question_4c
        question_5
        question_5c
        question_6
        question_6c
        question_7
        question_7c
        question_8
        question_9
      }
      council_answers {
        candidate
        fields {
          responder {
            name
            image
            uuid
            fields {
              slug
            }
            office {
              title
              position
              region
            }
          }
        }
        region
        position
        question_1
        question_2
        question_2c
        question_3
        question_3c
        question_4
        question_4c
        question_5
        question_5c
        question_6
        question_6c
        question_7
        question_7c
        question_8
        question_8c
        question_9
        question_9c
        question_10
        question_10c
        question_11
        question_12
      }
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
    minifiler
  }
`;
