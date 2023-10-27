import CANDIDATE from './CANDIDATE';
import CANDIDATES from './CANDIDATES';
import DONATION from './DONATION';
import DONOR from './DONOR';
import CANDIDATE_DONOR from './CANDIDATE_DONOR';
// import DONOR_TYPE from './DONOR_TYPE';
import ENDORSEMENTS from './ENDORSEMENTS';
import FUNDRAISING from './FUNDRAISING';
import GUIDES from './GUIDES';
import NOTES from './NOTES';
import OFFICE from './OFFICE';
import OFFICES from './OFFICES';
import RACE from './RACE';
import RACES from './RACES';
import COUNCIL_QUESTIONS from './COUNCIL_QUESTIONS';
import SCHOOL_QUESTIONS from './SCHOOL_QUESTIONS';
import PORT_QUESTIONS from './PORT_QUESTIONS';
import COUNCIL_ANSWERS from './COUNCIL_ANSWERS';
import COUNCIL_ANSWER from './COUNCIL_ANSWER';
import SCHOOL_ANSWERS from './SCHOOL_ANSWERS';
import SCHOOL_ANSWER from './SCHOOL_ANSWER';
import PORT_ANSWERS from './PORT_ANSWERS';
import PORT_ANSWER from './PORT_ANSWER';

const GraphQLSchema = `
  ${OFFICE}
  ${CANDIDATE}
  ${RACE}
  ${FUNDRAISING}
  ${CANDIDATE_DONOR}
  ${DONOR}
  ${DONATION}
  ${COUNCIL_ANSWER}
  ${SCHOOL_ANSWER}
  ${PORT_ANSWER}
  {
    ${ENDORSEMENTS}
    ${OFFICES}
    ${CANDIDATES}
    ${NOTES}
    ${RACES}
    ${GUIDES}
    ${COUNCIL_QUESTIONS}
    ${COUNCIL_ANSWERS}
    ${SCHOOL_QUESTIONS}
    ${SCHOOL_ANSWERS}
    ${PORT_QUESTIONS}
    ${PORT_ANSWERS}
  }
`;

export default GraphQLSchema;
