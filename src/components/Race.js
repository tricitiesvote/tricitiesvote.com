import React from 'react';
import { graphql } from 'gatsby';
import Candidate from './Candidate';
// TODO add back in comparisons
// import CompareLegislators from './compare/CompareLegislators';
// import CompareCommissioners from './compare/CompareCommissioners';
// import CompareCongress from './compare/CompareCongress';
// import CompareJudges from './compare/CompareJudges';

const Race = props => {
  const { data } = props;

  const { candidates, office } = data;

  // TODO add back in comparisons
  // const CompareSet = {
  //   'Franklin Commissioner 1': {
  //     component: CompareCommissioners,
  //     office: 'franklin1',
  //   },
  //   'Franklin Commissioner 2': {
  //     component: CompareCommissioners,
  //     office: 'franklin2',
  //   },
  //   'Benton Commissioner 1': {
  //     component: CompareCommissioners,
  //     office: 'benton1',
  //   },
  //   'Benton Commissioner 3': {
  //     component: CompareCommissioners,
  //     office: 'benton3',
  //   },
  //   '8th District Rep Pos 1': {
  //     component: CompareLegislators,
  //     office: 'ld8rep1',
  //   },
  //   '8th District Rep Pos 2': {
  //     component: CompareLegislators,
  //     office: 'ld8rep2',
  //   },
  //   '9th District Rep Pos 1': {
  //     component: CompareLegislators,
  //     office: 'ld9rep1',
  //   },
  //   '16th District Rep Pos 1': {
  //     component: CompareLegislators,
  //     office: 'ld16rep1',
  //   },
  //   '16th District Rep Pos 2': {
  //     component: CompareLegislators,
  //     office: 'ld16rep2',
  //   },
  //   '16th District Senator': {
  //     component: CompareLegislators,
  //     office: 'ld16senator',
  //   },
  //   'Benton-Franklin Superior Court Judge Pos 1': {
  //     component: CompareJudges,
  //     office: 'judge',
  //   },
  //   'U.S. Congress': {
  //     component: CompareCongress,
  //     office: 'congress',
  //   },
  // };

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
