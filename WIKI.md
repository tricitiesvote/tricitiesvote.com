# Tri-Cities Vote Wiki System

A community-driven data improvement system for the Tri-Cities Vote election guide, allowing controlled crowdsourcing of candidate information with moderator oversight.

## Core Design Principles

1. **Progressive Trust** - Contributors earn increased editing privileges through successful contributions
2. **Transparency** - All edits have public audit trails with rationales
3. **Simplicity** - Passwordless email authentication and inline editing
4. **Safety** - Moderator review before changes go live

## User Roles

### Community Member
- Can suggest additions/changes to any data
- Must provide rationale for all edits
- Subject to trust-based rate limits
- Default role for new accounts

### Candidate
- Can suggest additions/changes to any data (same as community)
- Account manually linked to candidate record by admin
- May have verified badge on their edits
- Subject to same trust system

### Moderator
- Reviews and approves/rejects proposed changes
- Can make direct changes without review
- Can leave replies on edits
- Receives email notifications of pending edits

### Admin
- Can grant moderator access
- Can change/update anything directly
- Primary changes still made via import scripts
- Full database access

## Trust System

The system uses progressive trust levels to manage edit privileges:

1. **New User** (0 edits accepted)
   - Can submit 1 edit
   - Must wait for review before submitting another

2. **After First Edit**
   - **Accepted**: Can submit 3 more edits
   - **Rejected**: Can submit 1 more edit

3. **Established Contributor** (3+ edits accepted)
   - Can have up to 10 pending edits
   - Trusted community member status

4. **Mixed Record**
   - Users with both accepted and rejected edits limited to 1-3 pending edits
   - Protects against gaming the system

This creates natural rate limiting and enables shadow-banning problematic users by leaving their edits unreviewed.

## Authentication System

### Email-Only Authentication
- No passwords - email magic links only
- Links expire after 15 minutes
- JWT session tokens after successful login
- Email verification required for all accounts

### Account Creation Flow
1. User clicks "Sign in to Edit"
2. Enters email address
3. Receives magic link via email
4. Clicks link to authenticate
5. Account created if new, otherwise logged in

### Candidate Accounts
- Created directly by admin (invite link required)
- Admin links account to candidate record at creation time
- Verified badge displayed on edits once linked

## Edit Workflow

### User Experience
1. **Initiate Edit Mode**
   - "Suggest Changes" button in upper right of any page
   - Prompts login if not authenticated
   - Transforms page to edit mode

2. **Edit Mode Interface**
   - Editable fields show pencil icon on hover
   - Click field to open inline edit form
   - "+" buttons appear for addable items (endorsements, links, etc)
   - Non-editable content grayed out slightly

3. **Making an Edit**
   - Inline form shows current value
   - User enters new value
   - Required rationale field explains change
   - Submit creates pending edit

4. **Post-Submission**
   - User sees confirmation
   - Edit appears in their pending edits list
   - Cannot edit same field until reviewed
   - Can continue editing other fields per trust limit

### Moderator Review
1. **Notification**
   - Email alert when edits accumulate
   - Dashboard shows pending edit queue

2. **Review Interface**
   - Side-by-side diff view (old vs new)
   - Rationale displayed prominently
   - User's edit history visible
   - One-click approve/reject buttons

3. **Actions Available**
   - **Approve**: Edit applied to database
   - **Reject**: Edit marked rejected with optional note
   - **Request Changes**: Send back with feedback
   - **Defer**: Leave pending for another moderator

4. **Conflict Resolution**
   - Last approved edit wins
   - Superseded edits marked in history
   - Moderator can see all edits to a field
   - Applies wiki override so import scripts do not overwrite accepted data

## Structured Engagement Tracking

- **Data model**: Engagement events (questionnaires, forums, surveys) live in the `Engagement` table, with per-candidate participation recorded in `CandidateEngagement`. Each entry covers metadata (title, date, primary/secondary links, notes) plus a deterministic slug.
- **Admin workflow**: Moderators manage engagements at `/admin/engagements`. The form lets you create events, associate them with a race, and mark each candidate as participated/declined with optional notes (e.g., “no response” or “submitted late”).
- **API endpoints**: The UI talks to `POST /api/admin/engagements` for creation and `PATCH/DELETE /api/admin/engagements/:id` for edits. All endpoints require MODERATOR or ADMIN role and a valid CSRF token.
- **Import scripts**: New collectors (`npm run import:tcrc`, `import:tcrc:videos`, `import:ballotpedia:load`, `import:wrcg:load`) upsert into the same tables. Scripts should never write to the legacy `candidate.engagement` markdown field.
- **Legacy fallback**: The front-end still renders the old markdown blob when no structured data exists, so historical copy remains visible. Prefer structured entries going forward; only use the markdown field for archival context.

## Endorsement Management

- **Admin workflow**: Moderators can add or remove endorsements at `/admin/endorsements`. Two flows exist—one for web links, one for file uploads (PDFs/images). Uploaded files are stored under `public/uploads/endorsements/{year}` and surfaced automatically on candidate pages.
- **API endpoints**: `GET/POST /api/admin/endorsements` lists and creates endorsements (POST handles both JSON payloads and multipart file uploads). `DELETE /api/admin/endorsements/:id` removes a record and its associated file. CSRF tokens and MODERATOR/ADMIN roles are required.
- **Data model**: Each `Endorsement` now supports `url`, `filePath`, optional `sourceTitle`, and `notes`, alongside existing `type`/`forAgainst` fields.
- **Imports**: The letters-to-the-editor loader continues to produce URL-based endorsements. Future scripts can add file uploads by writing into these same columns.
- **Community suggestions**: When edit mode is enabled on candidate pages, contributors can submit supporting or opposing endorsements. Submissions create `ENDORSEMENT` edits (link or upload). Uploaded files are staged under `/uploads/endorsements/pending/{year}` and moved into the final directory once a moderator approves the edit.

## Ballot Measure Entries

- **Race setup**: Measures use the `BALLOT_MEASURE` office type. Each initiative is paired with two pseudo-candidates (“Pro …” and “Con …”) so endorsements, contributions, and compare layouts behave just like council races.
- **Content fields**:
  - `intro` → concise overview surfaced above the compare grid (aim for 2–3 sentences; the UI truncates after ~220 characters).
  - `body` → longer Markdown block. Start with context and include `### Pro` / `### Con` sections (pamphlet copy drops straight in).
  - Optional `announcements` / `articles` fields continue to work for events and background reading.
- **Committees**: Store the PDC committee ID in `candidate.stateId` (`Pro Districts`, `Con Districts`, etc.). Run `./node_modules/.bin/ts-node scripts/import/pdc-committees.ts` to refresh all-time contribution totals.
- **Editing flow**: Moderators can edit `intro` / `body` via the wiki UI (`/moderate`) or rely on import scripts. Preview the compare page after edits to confirm formatting.
- **Compare/Race behaviour**: Measure summaries render above the two committee cards; questionnaires stay hidden unless you explicitly add a measure-friendly survey.

## Database Schema & Data Flow

### Schema considerations
- **Editable Fields**: Only fields flagged as wiki-editable receive overrides; import scripts skip these fields unless admin clears the override
- **Overrides**: store approved values in dedicated columns (e.g. `statementWiki`, `bioWiki`). Pages display the wiki value first, falling back to imported data.
- **Multi-value Data**: normalize endorsements, contact links, etc., and allow overrides at the row level (e.g. endorsement override record referencing original entry)
- **Engagement Tracking**: store questionnaires/forums in `Engagement` + `CandidateEngagement`. Imports and moderators should upsert there; keep the legacy `candidate.engagement` field only as a fallback display value.
- **Edit Metadata**: include `fieldPath` (dot path) and `appliedRevisionId` to support rollback and targeted revalidation
- **Login Token Cleanup**: scheduled job to purge expired tokens
- **Audit Log**: `Edit` retains history; consider separate `Activity` table for moderator actions
- **Revalidation**: every approved edit triggers `revalidatePath` (or Netlify hook) for affected pages (candidate, race, guide, home)
- **Rate Limits**: trust limits enforced per-user; cap simultaneous edits per entity/field to prevent flooding

```prisma
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  name            String?
  role            UserRole  @default(COMMUNITY)
  candidateId     String?   @unique
  candidate       Candidate? @relation(fields: [candidateId], references: [id])

  // Trust scoring
  editsAccepted   Int       @default(0)
  editsRejected   Int       @default(0)
  editsPending    Int       @default(0)

  edits           Edit[]
  moderatedEdits  Edit[]    @relation("ModeratedEdits")
  loginTokens     LoginToken[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

enum UserRole {
  COMMUNITY
  CANDIDATE
  MODERATOR
  ADMIN
}

model LoginToken {
  id          String   @id @default(cuid())
  token       String   @unique @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  used        Boolean  @default(false)
  expiresAt   DateTime
  createdAt   DateTime @default(now())
}

model Edit {
  id            String      @id @default(cuid())
  userId        String
  user          User        @relation(fields: [userId], references: [id])

  // What's being edited
  entityType    EntityType
  entityId      String
  field         String

  // The change
  oldValue      Json?
  newValue      Json
  rationale     String

  // Review process
  status        EditStatus  @default(PENDING)
  moderatorId   String?
  moderator     User?       @relation("ModeratedEdits", fields: [moderatorId], references: [id])
  moderatorNote String?

  // Metadata
  createdAt     DateTime    @default(now())
  reviewedAt    DateTime?
  appliedAt     DateTime?

  @@index([status, createdAt])
  @@index([userId, status])
  @@index([entityType, entityId])
}

enum EntityType {
  CANDIDATE
  RACE
  OFFICE
  ENDORSEMENT
  CONTRIBUTION
}

enum EditStatus {
  PENDING
  APPROVED
  REJECTED
  APPLIED
  SUPERSEDED
}
```

## Editable Fields

### Candidate Fields
- `name` - Display name corrections
- `bio` - Background information
- `statement` - Campaign statement
- `photo` - Profile photo URL
- `website` - Campaign website
- `email` - Contact email
- `phone` - Contact phone
- `twitter` - Twitter/X handle
- `facebook` - Facebook page
- `instagram` - Instagram handle

### Race Fields
- `description` - Race description
- `questionnaire` - Questions and answers

### Endorsements (Addable)
- `candidateId` - Which candidate
- `organization` - Org name
- `endorsementType` - FOR/AGAINST
- `url` - Link to endorsement

### Office Fields
- `title` - Office title
- `description` - Role description

## Public Audit Trail

### Edit History Page
- Shows all edits (pending, approved, rejected)
- Filterable by user, status, entity
- Displays rationale for each edit
- Shows moderator notes on rejections
- Accessible at `/edits` or `/audit`

### Per-Entity History
- Each candidate/race page has "View Edit History" link
- Shows all edits for that specific entity
- Highlights what changed and when
- Credits contributors

## Technical Implementation

### API Routes
```
POST   /api/auth/login          - Send magic link
GET    /api/auth/verify         - Verify magic link token
POST   /api/auth/logout         - Clear session
GET    /api/auth/me             - Current user info

GET    /api/edits               - List edits (filtered)
POST   /api/edits               - Create new edit
GET    /api/edits/:id           - Get specific edit
PATCH  /api/edits/:id           - Update edit status
GET    /api/edits/pending       - Moderator queue
GET    /api/edits/history/:entity/:id - Entity history

GET    /api/users/:id/edits     - User's edit history
PATCH  /api/users/:id/role      - Update user role (admin only)
```

### Email Templates
1. **Login Magic Link** - Simple link to authenticate
2. **Edit Approved** - Notify user their edit was accepted
3. **Edit Rejected** - Explain why edit was rejected
4. **Moderator Alert** - Batch notification of pending edits

### Security Considerations
- Rate limiting on auth endpoints
- CSRF protection on all mutations
- Input sanitization for all text fields
- XSS protection for rendered content
- SQL injection prevention via Prisma
- Admin actions logged for accountability

## Implementation Phases

### Phase 1: MVP (Week 1)
- [ ] Database schema and migrations
- [ ] Email authentication system
- [ ] Basic edit submission UI
- [ ] Simple moderator review page
- [ ] Apply approved edits to database

### Phase 2: Polish (Week 2)
- [ ] Trust level calculations
- [ ] Email notifications
- [ ] Public audit trail
- [ ] Inline editing UI
- [ ] Diff view for moderators

### Phase 3: Enhancement (Week 3+)
- [ ] Bulk moderation tools
- [ ] Advanced trust metrics
- [ ] Edit templates for common changes
- [ ] API for external tools
- [ ] Analytics dashboard

## Success Metrics

1. **Edit Quality** - % of edits approved
2. **Contributor Retention** - Users who make multiple edits
3. **Data Freshness** - Time from real change to database update
4. **Moderator Efficiency** - Average review time
5. **Coverage** - % of candidates with community edits

## Future Enhancements

- **Auto-approval** for trusted users on certain fields
- **Edit Campaigns** - Coordinated updates for specific data
- **Verification Badges** - For confirmed organizations
- **Edit Templates** - Common corrections (typos, formatting)
- **Moderator Teams** - Specialized reviewers by topic
- **Change Subscriptions** - Watch specific candidates/races
- **Bulk Operations** - Update multiple similar fields at once
- **Integration APIs** - Allow orgs to submit endorsements programmatically
