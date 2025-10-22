'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { getCsrfToken } from '@/lib/auth/getCsrfToken';
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
      const response = await fetch(`/api/admin/candidates/${slug}?year=${year}`);
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading candidate data...</div>
      </div>
    );
  }

  if (error && !candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-medium mb-2">Error</h1>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <Link href={`/${year}/candidate/${slug}`} className="text-blue-600 hover:underline">
            Back to candidate page
          </Link>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-medium mb-2">Candidate not found</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            Go to home page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Edit: {candidate.name}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {candidate.office.title} • {candidate.electionYear}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href={`/${year}/candidate/${slug}`}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              View public page
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      {successMessage && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
            {successMessage}
          </div>
        </div>
      )}
      {error && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Basic Information */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <FormField label="Name" value={candidate.name} onChange={(v) => updateField('name', v)} />
              <FormField label="State ID (PDC Committee ID)" value={candidate.stateId || ''} onChange={(v) => updateField('stateId', v || null)} />
              <FormField label="Party" value={candidate.party || ''} onChange={(v) => updateField('party', v || null)} />
              <div className="grid grid-cols-2 gap-4">
                <CheckboxField label="Incumbent" checked={candidate.incumbent} onChange={(v) => updateField('incumbent', v)} />
                <CheckboxField label="Minifiler" checked={candidate.minifiler} onChange={(v) => updateField('minifiler', v)} />
                <CheckboxField label="Hide from public" checked={candidate.hide} onChange={(v) => updateField('hide', v)} />
                <NumberField label="Years in office" value={candidate.yearsInOffice} onChange={(v) => updateField('yearsInOffice', v)} />
              </div>
            </div>
          </section>

          {/* Contact & Links */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Contact & Links</h2>
            <div className="space-y-4">
              <FormField label="Email" value={candidate.email || ''} onChange={(v) => updateField('email', v || null)} />
              <FormField label="Website" value={candidate.website || ''} onChange={(v) => updateField('website', v || null)} />
              <FormField label="Facebook" value={candidate.facebook || ''} onChange={(v) => updateField('facebook', v || null)} />
              <FormField label="Twitter" value={candidate.twitter || ''} onChange={(v) => updateField('twitter', v || null)} />
              <FormField label="Instagram" value={candidate.instagram || ''} onChange={(v) => updateField('instagram', v || null)} />
              <FormField label="YouTube" value={candidate.youtube || ''} onChange={(v) => updateField('youtube', v || null)} />
              <FormField label="PDC Link" value={candidate.pdc || ''} onChange={(v) => updateField('pdc', v || null)} />
            </div>
          </section>

          {/* Photo */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Photo</h2>
            <FormField
              label="Image URL"
              value={candidate.image || ''}
              onChange={(v) => updateField('image', v || null)}
              help="Path relative to public directory, e.g., /images/candidates/2025/john-doe.jpg"
            />
            {candidate.image && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Preview:</p>
                <img
                  src={candidate.image}
                  alt={candidate.name}
                  className="w-48 h-48 object-cover rounded border border-gray-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </section>

          {/* Bio & Statement */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Bio & Statement</h2>
            <div className="space-y-4">
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
            </div>
          </section>

          {/* Articles/News */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Articles & News</h2>
            <TextAreaField
              label="Articles (Markdown)"
              value={candidate.articles || ''}
              onChange={(v) => updateField('articles', v || null)}
              rows={10}
              help="Markdown format for news items and articles"
            />
          </section>

          {/* Questionnaire Responses */}
          <QuestionnaireResponsesSection
            responses={candidate.questionnaireResponses}
            candidateId={candidate.id}
            onUpdate={loadCandidate}
          />

          {/* Endorsements */}
          <EndorsementsSection
            endorsements={candidate.endorsements}
            candidateId={candidate.id}
            candidateYear={candidate.electionYear}
            onUpdate={loadCandidate}
          />

          {/* Enforcement Cases */}
          <EnforcementCasesSection
            cases={candidate.enforcementCases}
            candidateId={candidate.id}
            onUpdate={loadCandidate}
          />
        </div>
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
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {help && <p className="text-xs text-gray-500 mt-1">{help}</p>}
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
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
      />
      {help && <p className="text-xs text-gray-500 mt-1">{help}</p>}
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
    <div className="flex items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mr-2"
      />
      <label className="text-sm font-medium text-gray-700">{label}</label>
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
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number.parseInt(e.target.value, 10) : null)}
        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

