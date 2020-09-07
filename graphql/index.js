import CANDIDATE from './CANDIDATE';
import CANDIDATES from './CANDIDATES';
// import DONATION from './DONATION';
import DONOR from './DONOR';
// import DONOR_TYPE from './DONOR_TYPE';
import FUNDRAISING from './FUNDRAISING';
import GUIDES from './GUIDES';
import NOTES from './NOTES';
import OFFICE from './OFFICE';
import OFFICES from './OFFICES';
import RACE from './RACE';
import RACES from './RACES';

const GraphQLSchema = `
  ${OFFICE}
  ${CANDIDATE}
  ${RACE}
  ${FUNDRAISING}
  ${DONOR}
  {
    ${OFFICES}
    ${CANDIDATES}
    ${NOTES}
    ${RACES}
    ${GUIDES}
  }
`;

export default GraphQLSchema;
