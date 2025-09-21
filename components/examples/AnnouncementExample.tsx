import { AnnouncementDisplay } from '@/components/wiki/AnnouncementDisplay';
import { EditableField } from '@/components/wiki/EditableField';

// Example usage of the AnnouncementDisplay and editable announcements
export function AnnouncementExample({
  raceId,
  raceAnnouncements,
  guideId,
  guideAnnouncements
}: {
  raceId?: string;
  raceAnnouncements?: string;
  guideId?: string;
  guideAnnouncements?: string;
}) {
  return (
    <div className="space-y-8">
      {/* Example for Race-level announcements */}
      {raceId && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Race Announcements</h2>
          <EditableField
            entityType="RACE"
            entityId={raceId}
            field="announcements"
            value={raceAnnouncements}
            placeholder="No race announcements"
            multiline={true}
            renderDisplay={(value) => <AnnouncementDisplay content={value} />}
          />
        </div>
      )}

      {/* Example for Guide-level announcements */}
      {guideId && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Regional Guide Announcements</h2>
          <EditableField
            entityType="GUIDE"
            entityId={guideId}
            field="announcements"
            value={guideAnnouncements}
            placeholder="No regional announcements"
            multiline={true}
            renderDisplay={(value) => <AnnouncementDisplay content={value} />}
          />
        </div>
      )}
    </div>
  );
}

// Example markdown content that would produce the desired multi-column layout
export const ExampleMarkdown = `
- **Pasco Candidate Meet & Greet**
  - October 12, 2025, 6:00-8:00 PM
  - Pasco Library, Community Room
  - [More details](https://my.lwv.org/washington/benton-franklin-counties/event/pasco-candidate-meet-greet)
  - Hosted by League of Women Voters of Benton & Franklin Counties

- **Town Hall Discussion**
  - October 20, 2025, 7:00-9:00 PM
  - City Hall Council Chambers
  - Open discussion with all candidates
  - Questions from community members

- **Voter Registration Drive**
  - Every Saturday in October
  - Columbia Center Mall, Main Court
  - Help available in English and Spanish
  - Bring ID and proof of address
`;

// Standalone demo component
export function AnnouncementDemo() {
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Announcements Demo</h1>
      <AnnouncementDisplay content={ExampleMarkdown} />
    </div>
  );
}