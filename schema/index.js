import CandidateFundraisingJson from './CandidateFundraisingJson';
import CandidateDonorTypesJson from './CandidateDonorTypesJson';
import CandidateDonorsJson from './CandidateDonorsJson';
import CandidatesJson from './CandidatesJson';
import DonationsJson from './DonationsJson';
import DonorsJson from './DonorsJson';
import Fields from './Fields';
import GuidesJson from './GuidesJson';
import NoteFields from './NoteFields';
import NotesJson from './NotesJson';
import OfficesJson from './OfficesJson';
import RacesJson from './RacesJson';
import EndorsementsJson from './EndorsementsJson';

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
${EndorsementsJson}
`;

export default SchemaCustomization;