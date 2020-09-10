import CandidateFundraisingJson from './CandidateFundraisingJson';
import CandidateDonorTypesJson from './CandidateDonorTypesJson';
import CandidatesJson from './CandidatesJson';
import DonationsJson from './DonationsJson';
import DonorsJson from './DonorsJson';
import Fields from './Fields';
import GuidesJson from './GuidesJson';
import NoteFields from './NoteFields';
import NotesJson from './NotesJson';
import OfficesJson from './OfficesJson';
import RacesJson from './RacesJson';

const SchemaCustomization = `
${CandidateFundraisingJson}

${CandidateDonorTypesJson}

${CandidatesJson}

${DonationsJson}

${DonorsJson}

${Fields}

${GuidesJson}

${NoteFields}

${NotesJson}

${OfficesJson}

${RacesJson}
`;

export default SchemaCustomization;
