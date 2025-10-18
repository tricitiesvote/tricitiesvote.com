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
        // For PER_CANDIDATE engagements, determine participation by link presence
        // For SHARED engagements, use the explicit status
        const engagement = availableEngagements.find(e => e.id === engagementId);

        if (engagement?.linkType === 'PER_CANDIDATE') {
          // Only include if there's a link (which means participated)
          if (state.link && state.link.trim()) {
            participants.push({
              engagementId,
              participated: true,
              link: state.link.trim()
            });
          } else {
            // Include as "did not participate" (no link)
            participants.push({
              engagementId,
              participated: false,
              link: undefined
            });
          }
        } else {
          // SHARED engagement - only include if status is set
          if (state.status !== 'unset') {
            participants.push({
              engagementId,
              participated: state.status === 'yes',
              link: undefined
            });
          }
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
      <div className="wiki-edit-form" style={{
        border: '1px solid #ddd',
        padding: '1rem',
        marginTop: '1rem',
        backgroundColor: '#f9f9f9',
        borderRadius: '4px'
      }}>
        <form onSubmit={handleSubmit}>
          <h5 style={{ marginTop: 0, marginBottom: '1rem' }}>Edit Community Engagement</h5>

          {isLoading && <p style={{ fontSize: '0.9em', color: '#666' }}>Loading engagements...</p>}

          {!isLoading && availableEngagements.length === 0 && (
            <p style={{ fontSize: '0.9em', color: '#666' }}>No engagements available</p>
          )}

          {!isLoading && availableEngagements.map(engagement => {
            const state = participationMap.get(engagement.id) || { status: 'unset', link: '' };

            return (
              <div key={engagement.id} style={{
                marginBottom: '1.5rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid #eee'
              }}>
                <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>{engagement.title}</div>

                {engagement.linkType === 'SHARED' ? (
                  // For SHARED engagements: simple yes/no radio
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name={`engagement-${engagement.id}`}
                        checked={state.status === 'yes'}
                        onChange={() => handleParticipationChange(engagement.id, 'yes')}
                      />
                      <span>Participated</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name={`engagement-${engagement.id}`}
                        checked={state.status === 'no'}
                        onChange={() => handleParticipationChange(engagement.id, 'no')}
                      />
                      <span>Did not participate</span>
                    </label>
                  </div>
                ) : (
                  // For PER_CANDIDATE engagements: just a link input
                  // (presence of link = participated, empty = did not participate)
                  <div>
                    <input
                      type="url"
                      value={state.link}
                      onChange={(e) => {
                        const link = e.target.value;
                        handleLinkChange(engagement.id, link);
                        // Auto-set participation based on whether link is present
                        handleParticipationChange(engagement.id, link.trim() ? 'yes' : 'no');
                      }}
                      placeholder="Enter link if participated (e.g., video timestamp)"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '3px',
                        fontSize: '0.9em'
                      }}
                    />
                    <div style={{ fontSize: '0.8em', color: '#666', marginTop: '0.25rem' }}>
                      {state.link.trim() ? '✅ Participated' : '❌ Did not participate'}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ marginTop: '1rem' }}>
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Explain why this change is needed..."
              required
              rows={3}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '3px',
                fontFamily: 'inherit',
                fontSize: '0.9em'
              }}
            />
          </div>

          {error && (
            <div style={{ color: '#c00', fontSize: '0.9em', marginTop: '0.5rem' }}>{error}</div>
          )}

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: isSubmitting ? '#999' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontSize: '0.9em'
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Change'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '0.9em'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Edit mode - display with edit button
  return (
    <div style={{ position: 'relative' }}>
      <CandidateEngagementList entries={currentEngagements} />

      {user && editMode && (
        <button
          onClick={() => setIsEditing(true)}
          title="Edit engagement participation"
          style={{
            position: 'absolute',
            right: '-30px',
            top: '0',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.2em',
            opacity: 0.3,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.3')}
        >
          ✏️
        </button>
      )}

      {success && (
        <div style={{
          position: 'absolute',
          top: '-2rem',
          left: 0,
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          color: '#155724',
          padding: '0.5rem 0.75rem',
          borderRadius: '3px',
          fontSize: '0.9em'
        }}>
          Edit submitted for review!
        </div>
      )}
    </div>
  );
}
