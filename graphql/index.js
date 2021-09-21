import CANDIDATE from './CANDIDATE';
import CANDIDATES from './CANDIDATES';
import DONATION from './DONATION';
import DONOR from './DONOR';
import CANDIDATE_DONOR from './CANDIDATE_DONOR';
// import DONOR_TYPE from './DONOR_TYPE';
import FUNDRAISING from './FUNDRAISING';
import GUIDES from './GUIDES';
import NOTES from './NOTES';
import OFFICE from './OFFICE';
import OFFICES from './OFFICES';
import RACE from './RACE';
import RACES from './RACES';
import SCHOOL_ANSWERS from './SCHOOL_ANSWERS';
import COUNCIL_QUESTIONS from './COUNCIL_QUESTIONS';
import COUNCIL_ANSWERS from './COUNCIL_ANSWERS';
import SCHOOL_QUESTIONS from './SCHOOL_QUESTIONS';

const GraphQLSchema = `
  ${OFFICE}
  ${CANDIDATE}
  ${RACE}
  ${FUNDRAISING}
  ${CANDIDATE_DONOR}
  ${DONOR}
  ${DONATION}
  {
    ${OFFICES}
    ${CANDIDATES}
    ${NOTES}
    ${RACES}
    ${GUIDES}
    ${COUNCIL_QUESTIONS}
    ${COUNCIL_ANSWERS}
    ${SCHOOL_QUESTIONS}
    ${SCHOOL_ANSWERS}
  }
`;

export default GraphQLSchema;
