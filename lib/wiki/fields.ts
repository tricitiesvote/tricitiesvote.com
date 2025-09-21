export const candidateEditableFields = [
  'name',
  'bio',
  'statement',
  'image',
  'website',
  'email',
  'phone',
  'twitter',
  'facebook',
  'instagram',
  'engagement',
  'articles'
] as const;

export type CandidateEditableField = typeof candidateEditableFields[number];

export const candidateEditableFieldSet = new Set<CandidateEditableField>(candidateEditableFields);

export const raceEditableFields = ['intro', 'body', 'announcements'] as const;
export type RaceEditableField = typeof raceEditableFields[number];
export const raceEditableFieldSet = new Set<RaceEditableField>(raceEditableFields);

export const officeEditableFields = ['title', 'description', 'jobTitle'] as const;
export type OfficeEditableField = typeof officeEditableFields[number];
export const officeEditableFieldSet = new Set<OfficeEditableField>(officeEditableFields);

export const guideEditableFields = ['announcements'] as const;
export type GuideEditableField = typeof guideEditableFields[number];
export const guideEditableFieldSet = new Set<GuideEditableField>(guideEditableFields);
