const CANDIDATE = require('./CANDIDATE');
const CANDIDATES = require('./CANDIDATES');
const DONATION = require('./DONATION');
const DONOR = require('./DONOR');
const CANDIDATE_DONOR = require('./CANDIDATE_DONOR');
// const DONOR_TYPE = require('./DONOR_TYPE');
const ENDORSEMENTS = require('./ENDORSEMENTS');
const FUNDRAISING = require('./FUNDRAISING');
const GUIDES = require('./GUIDES');
const NOTES = require('./NOTES');
const OFFICE = require('./OFFICE');
const OFFICES = require('./OFFICES');
const RACE = require('./RACE');
const RACES = require('./RACES');
const COUNCIL_QUESTIONS = require('./COUNCIL_QUESTIONS');
const SCHOOL_QUESTIONS = require('./SCHOOL_QUESTIONS');
const COUNCIL_ANSWERS = require('./COUNCIL_ANSWERS');
const COUNCIL_ANSWER = require('./COUNCIL_ANSWER');
const SCHOOL_ANSWERS = require('./SCHOOL_ANSWERS');
const SCHOOL_ANSWER = require('./SCHOOL_ANSWER');

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
  }
`;

module.exports = GraphQLSchema;
