import CANDIDATE from './CANDIDATE';
import CANDIDATES from './CANDIDATES';
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
  {
    ${OFFICES}
    ${CANDIDATES}
    ${NOTES}
    ${RACES}
    ${GUIDES}
  }
`;

export default GraphQLSchema;
