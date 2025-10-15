'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { getCsrfToken } from '@/lib/auth/getCsrfToken';
import { useEditMode } from '@/lib/wiki/EditModeProvider';
import { CandidateEngagementList } from '@/components/candidate/CandidateEngagementList';

interface Engagement {
  id: string;
  slug: string;
  title: string;
  linkType: 'SHARED' | 'PER_CANDIDATE';
  primaryLink?: string | null;
}

interface ParticipationState {
  status: 'yes' | 'no' | 'unset';
  link: string;
}

interface EditableCandidateEngagementsProps {
  candidateId: string;
  electionYear: number;
  raceId?: string | null;
  currentEngagements: Array<{
    participated: boolean;
    notes?: string | null;
    link?: string | null;
    engagement: {
      id: string;
      slug: string;
      title: string;
      date?: Date | string | null;
      primaryLink?: string | null;
      secondaryLink?: string | null;
      secondaryLinkTitle?: string | null;
      notes?: string | null;
    } | null;
  }>;
}

export function EditableCandidateEngagements({
  candidateId,
  electionYear,
  raceId,
  currentEngagements
}: EditableCandidateEngagementsProps) {
  const { user } = useAuth();
  const { editMode } = useEditMode();
  const [isEditing, setIsEditing] = useState(false);
  const [availableEngagements, setAvailableEngagements] = useState<Engagement[]>([]);
  const [participationMap, setParticipationMap] = useState<Map<string, ParticipationState>>(new Map());
  const [rationale, setRationale] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Initialize participation map from current engagements
  useEffect(() => {
    const map = new Map<string, ParticipationState>();
    currentEngagements.forEach(entry => {
      if (entry.engagement) {
        map.set(entry.engagement.id, {
          status: entry.participated ? 'yes' : 'no',
          link: entry.link || ''
        });
      }
    });
    setParticipationMap(map);
  }, [currentEngagements]);

  // Fetch available engagements when entering edit mode
  useEffect(() => {
    if (!isEditing) return;

    const fetchEngagements = async () => {
      setIsLoading(true);
      setError('');
      try {
        // Fetch by raceId if available, otherwise by year
        const url = raceId
          ? `/api/engagements?raceId=${raceId}`
          : `/api/engagements?year=${electionYear}`;

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setAvailableEngagements(data.engagements || []);
        } else {
          setError('Failed to load available engagements');
        }
      } catch (err) {
        setError('Network error loading engagements');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEngagements();
  }, [isEditing, raceId, electionYear]);

  const handleParticipationChange = (engagementId: string, status: 'yes' | 'no' | 'unset') => {
    setParticipationMap(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(engagementId) || { status: 'unset', link: '' };
      newMap.set(engagementId, { ...current, status });
      return newMap;
    });
  };

  const handleLinkChange = (engagementId: string, link: string) => {
    setParticipationMap(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(engagementId) || { status: 'unset', link: '' };
      newMap.set(engagementId, { ...current, link });
      return newMap;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rationale.trim()) {
      setError('Please provide a rationale for your change');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Build the participation payload
      const participants: Array<{
        engagementId: string;
        participated: boolean;
        link?: string;
      }> = [];

      participationMap.forEach((state, engagementId) => {
        if (state.status !== 'unset') {
          participants.push({
            engagementId,
            participated: state.status === 'yes',
            link: state.link || undefined
          });
        }
      });

      const response = await fetch('/api/edits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify({
          entityType: 'CANDIDATE',
          entityId: candidateId,
          field: 'engagements',
          newValue: JSON.stringify(participants),
          rationale
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setIsEditing(false);
        setRationale('');
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || 'Failed to submit edit');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setRationale('');
    setError('');
    // Reset participation map to current state
    const map = new Map<string, ParticipationState>();
    currentEngagements.forEach(entry => {
      if (entry.engagement) {
        map.set(entry.engagement.id, {
          status: entry.participated ? 'yes' : 'no',
          link: entry.link || ''
        });
      }
    });
    setParticipationMap(map);
  };

  // Display mode
  if (!editMode) {
    return <CandidateEngagementList entries={currentEngagements} />;
  }

  // Edit mode - form view
  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4 border border-gray-300 rounded p-4 bg-gray-50">
        <h5 className="font-semibold">Edit Community Engagement</h5>

        {isLoading && <div className="text-sm text-gray-600">Loading engagements...</div>}

        {!isLoading && availableEngagements.length === 0 && (
          <div className="text-sm text-gray-600">No engagements available for this race</div>
        )}

        {!isLoading && availableEngagements.map(engagement => {
          const state = participationMap.get(engagement.id) || { status: 'unset', link: '' };

          return (
            <div key={engagement.id} className="border-b border-gray-200 pb-3 last:border-0">
              <div className="font-medium text-sm mb-2">{engagement.title}</div>

              <div className="flex items-center gap-4 mb-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`engagement-${engagement.id}`}
                    checked={state.status === 'yes'}
                    onChange={() => handleParticipationChange(engagement.id, 'yes')}
                  />
                  <span>✅ Participated</span>
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`engagement-${engagement.id}`}
                    checked={state.status === 'no'}
                    onChange={() => handleParticipationChange(engagement.id, 'no')}
                  />
                  <span>❌ Declined</span>
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`engagement-${engagement.id}`}
                    checked={state.status === 'unset'}
                    onChange={() => handleParticipationChange(engagement.id, 'unset')}
                  />
                  <span>No response</span>
                </label>
              </div>

              {engagement.linkType === 'PER_CANDIDATE' && state.status === 'yes' && (
                <div className="mt-2">
                  <input
                    type="url"
                    value={state.link}
                    onChange={(e) => handleLinkChange(engagement.id, e.target.value)}
                    placeholder="Link (e.g., video timestamp)"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
              )}
            </div>
          );
        })}

        <div className="mt-4">
          <textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="Explain why this change is needed..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            required
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Change'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  // Edit mode - display with edit button
  return (
    <div className="group relative">
      <CandidateEngagementList entries={currentEngagements} />

      {user && editMode && (
        <button
          onClick={() => setIsEditing(true)}
          className="absolute -right-6 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Edit engagement participation"
        >
          ✏️
        </button>
      )}

      {success && (
        <div className="absolute -top-8 left-0 bg-green-100 border border-green-300 text-green-700 px-2 py-1 rounded text-sm">
          Edit submitted for review!
        </div>
      )}
    </div>
  );
}
