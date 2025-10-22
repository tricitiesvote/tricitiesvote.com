'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth, getCsrfToken } from '@/lib/auth';
import { QuestionnaireResponsesSection } from './QuestionnaireResponsesSection';
import { EndorsementsSection } from './EndorsementsSection';
import { EnforcementCasesSection } from './EnforcementCasesSection';

interface CandidateData {
  id: string;
  name: string;
  stateId: string | null;
  electionYear: number;
  incumbent: boolean;
  yearsInOffice: number | null;
  image: string | null;
  bio: string | null;
  party: string | null;
  email: string | null;
  statement: string | null;
  website: string | null;
  facebook: string | null;
  twitter: string | null;
  instagram: string | null;
  youtube: string | null;
  pdc: string | null;
  articles: string | null;
  hide: boolean;
  minifiler: boolean;
  office: {
    title: string;
  };
  endorsements: Endorsement[];
  questionnaireResponses: QuestionnaireResponse[];
  enforcementCases: EnforcementCase[];
}

interface Endorsement {
  id: string;
  endorser: string;
  url: string | null;
  filePath: string | null;
  sourceTitle: string | null;
  notes: string | null;
  type: 'LETTER' | 'SOCIAL' | 'ORG';
  forAgainst: 'FOR' | 'AGAINST';
}

interface QuestionnaireResponse {
  id: string;
  value: number | null;
  comment: string | null;
  textResponse: string | null;
  question: {
    id: string;
    question: string | null;
    type: string;
    questionnaire: {
      title: string;
    };
  };
}

interface EnforcementCase {
  id: string;
  caseNumber: string;
  opened: string;
  complainant: string;
  respondent: string;
  subject: string;
  areasOfLaw: string;
  status: string;
  description: string;
  url: string;
  matchConfidence: number | null;
  manuallyReviewed: boolean;
}

export default function CandidateEditPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const slug = params?.slug as string;
  const year = params?.year ? Number.parseInt(params.year as string, 10) : null;

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/404');
    }
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin && slug && year) {
      loadCandidate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, slug, year]);

  const loadCandidate = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/admin/candidates/by-slug/${slug}?year=${year}`);
      const data = await response.json();

      if (response.ok) {
        setCandidate(data.candidate);
      } else {
        setError(data.error || 'Failed to load candidate');
      }
    } catch (err) {
      setError('Network error while loading candidate');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!candidate) return;

    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');

      const response = await fetch(`/api/admin/candidates/${candidate.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify({
          name: candidate.name,
          stateId: candidate.stateId,
          incumbent: candidate.incumbent,
          yearsInOffice: candidate.yearsInOffice,
          image: candidate.image,
          bio: candidate.bio,
          party: candidate.party,
          email: candidate.email,
          statement: candidate.statement,
          website: candidate.website,
          facebook: candidate.facebook,
          twitter: candidate.twitter,
          instagram: candidate.instagram,
          youtube: candidate.youtube,
          pdc: candidate.pdc,
          articles: candidate.articles,
          hide: candidate.hide,
          minifiler: candidate.minifiler
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Candidate updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.error || 'Failed to save changes');
      }
    } catch (err) {
      setError('Network error while saving');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof CandidateData, value: any) => {
    if (candidate) {
      setCandidate({ ...candidate, [field]: value });
    }
  };

  if (authLoading || !isAdmin) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading candidate data...</div>;
  }

  if (error && !candidate) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>Error</h1>
        <p style={{ color: '#c00' }}>{error}</p>
        <p><Link href={`/${year}/candidate/${slug}`}>Back to candidate page</Link></p>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>Candidate not found</h1>
        <p><Link href="/">Go to home page</Link></p>
      </div>
    );
  }

  return (
    <div className="admin-edit-page">
      <header className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1>Edit: {candidate.name}</h1>
            <p style={{ fontSize: '14px', opacity: 0.7, margin: '5px 0 0 0' }}>
              {candidate.office.title} • {candidate.electionYear}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <Link href={`/${year}/candidate/${slug}`}>View public page</Link>
            <button onClick={handleSave} disabled={saving} className="admin-save-button">
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </header>

      {successMessage && (
        <div className="admin-message admin-message-success">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="admin-message admin-message-error">
          {error}
        </div>
      )}

      <main className="admin-content">
        <section className="admin-section">
          <h2>Basic Information</h2>
          <FormField label="Name" value={candidate.name} onChange={(v) => updateField('name', v)} />
          <FormField label="State ID (PDC Committee ID)" value={candidate.stateId || ''} onChange={(v) => updateField('stateId', v || null)} />
          <FormField label="Party" value={candidate.party || ''} onChange={(v) => updateField('party', v || null)} />
          <div className="admin-grid-2">
            <CheckboxField label="Incumbent" checked={candidate.incumbent} onChange={(v) => updateField('incumbent', v)} />
            <CheckboxField label="Minifiler" checked={candidate.minifiler} onChange={(v) => updateField('minifiler', v)} />
            <CheckboxField label="Hide from public" checked={candidate.hide} onChange={(v) => updateField('hide', v)} />
            <NumberField label="Years in office" value={candidate.yearsInOffice} onChange={(v) => updateField('yearsInOffice', v)} />
          </div>
        </section>

        <section className="admin-section">
          <h2>Contact & Links</h2>
          <FormField label="Email" value={candidate.email || ''} onChange={(v) => updateField('email', v || null)} />
          <FormField label="Website" value={candidate.website || ''} onChange={(v) => updateField('website', v || null)} />
          <FormField label="Facebook" value={candidate.facebook || ''} onChange={(v) => updateField('facebook', v || null)} />
          <FormField label="Twitter" value={candidate.twitter || ''} onChange={(v) => updateField('twitter', v || null)} />
          <FormField label="Instagram" value={candidate.instagram || ''} onChange={(v) => updateField('instagram', v || null)} />
          <FormField label="YouTube" value={candidate.youtube || ''} onChange={(v) => updateField('youtube', v || null)} />
          <FormField label="PDC Link" value={candidate.pdc || ''} onChange={(v) => updateField('pdc', v || null)} />
        </section>

        <section className="admin-section">
          <h2>Photo</h2>
          <FormField
            label="Image URL"
            value={candidate.image || ''}
            onChange={(v) => updateField('image', v || null)}
            help="Path relative to public directory, e.g., /images/candidates/2025/john-doe.jpg"
          />
          {candidate.image && (
            <div style={{ marginTop: '15px' }}>
              <p style={{ fontSize: '13px', opacity: 0.7, marginBottom: '8px' }}>Preview:</p>
              <Image
                src={candidate.image}
                alt={candidate.name}
                width={200}
                height={200}
                style={{ objectFit: 'cover', border: '1px solid #ddd' }}
              />
            </div>
          )}
        </section>

        <section className="admin-section">
          <h2>Bio & Statement</h2>
          <TextAreaField
            label="Bio"
            value={candidate.bio || ''}
            onChange={(v) => updateField('bio', v || null)}
            rows={6}
            help="Markdown supported"
          />
          <TextAreaField
            label="Statement"
            value={candidate.statement || ''}
            onChange={(v) => updateField('statement', v || null)}
            rows={8}
            help="Markdown supported"
          />
        </section>

        <section className="admin-section">
          <h2>Articles & News</h2>
          <TextAreaField
            label="Articles (Markdown)"
            value={candidate.articles || ''}
            onChange={(v) => updateField('articles', v || null)}
            rows={10}
            help="Markdown format for news items and articles"
          />
        </section>

        <QuestionnaireResponsesSection
          responses={candidate.questionnaireResponses}
          candidateId={candidate.id}
          onUpdate={loadCandidate}
        />

        <EndorsementsSection
          endorsements={candidate.endorsements}
          candidateId={candidate.id}
          candidateYear={candidate.electionYear}
          onUpdate={loadCandidate}
        />

        <EnforcementCasesSection
          cases={candidate.enforcementCases}
          candidateId={candidate.id}
          onUpdate={loadCandidate}
        />
      </main>
    </div>
  );
}

// Form field components
function FormField({
  label,
  value,
  onChange,
  help
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  help?: string;
}) {
  return (
    <div className="admin-field">
      <label>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {help && <small>{help}</small>}
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
  help
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  help?: string;
}) {
  return (
    <div className="admin-field">
      <label>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        style={{ fontFamily: 'monospace', fontSize: '13px' }}
      />
      {help && <small>{help}</small>}
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="admin-field-checkbox">
      <label>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        {label}
      </label>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <div className="admin-field">
      <label>{label}</label>
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number.parseInt(e.target.value, 10) : null)}
      />
    </div>
  );
}

