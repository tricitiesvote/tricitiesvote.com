const CandidateFundraisingJson = require('./CandidateFundraisingJson');
const CandidateDonorTypesJson = require('./CandidateDonorTypesJson');
const CandidateDonorsJson = require('./CandidateDonorsJson');
const CandidatesJson = require('./CandidatesJson');
const DonationsJson = require('./DonationsJson');
const DonorsJson = require('./DonorsJson');
const Fields = require('./Fields');
const GuidesJson = require('./GuidesJson');
const NoteFields = require('./NoteFields');
const NotesJson = require('./NotesJson');
const OfficesJson = require('./OfficesJson');
const RacesJson = require('./RacesJson');
const CouncilAnswersCsv = require('./CouncilAnswersCsv');
const CouncilQuestionsCsv = require('./CouncilQuestionsCsv');
const SchoolAnswersCsv = require('./SchoolAnswersCsv');
const SchoolQuestionsCsv = require('./SchoolQuestionsCsv');
const EndorsementsJson = require('./EndorsementsJson');

const SchemaCustomization = `
${CandidateFundraisingJson}

${CandidateDonorTypesJson}

${CandidateDonorsJson}

${CandidatesJson}

${DonationsJson}

${DonorsJson}

${Fields}

${GuidesJson}

${NoteFields}

${NotesJson}

${OfficesJson}

${RacesJson}

${CouncilAnswersCsv}

${CouncilQuestionsCsv}

${SchoolAnswersCsv}

${SchoolQuestionsCsv}

${EndorsementsJson}
`;

module.exports = SchemaCustomization;
