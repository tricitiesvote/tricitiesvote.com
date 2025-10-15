'use client';

import { useEffect, useMemo, useState } from 'react';
import { getCsrfToken } from '@/lib/auth/getCsrfToken';
import { cn } from '@/lib/utils';

type CandidateOption = {
  id: string;
  name: string;
  electionYear: number;
};

type RaceOption = {
  id: string;
  electionYear: number;
  officeTitle: string;
  regionName: string | null;
  candidates: CandidateOption[];
};

type ParticipantRecord = {
  candidateId: string;
  participated: boolean;
  notes?: string | null;
  candidate: {
    id: string;
    name: string;
    electionYear: number;
    officeTitle: string | null;
  } | null;
};

type EngagementRecord = {
  id: string;
  slug: string;
  title: string;
  date: string | null;
  linkType: 'SHARED' | 'PER_CANDIDATE';
  primaryLink: string | null;
  secondaryLink: string | null;
  secondaryLinkTitle: string | null;
  notes: string | null;
  race: {
    id: string;
    electionYear: number;
    officeTitle: string;
    regionName: string | null;
  } | null;
  participants: ParticipantRecord[];
};

type ParticipantState = {
  status: 'yes' | 'no' | 'unset';
  notes: string;
  link: string; // Per-candidate link (only used when linkType is PER_CANDIDATE)
};

interface EngagementResponse {
  engagements: EngagementRecord[];
  races: RaceOption[];
}

const initialFormState = {
  title: '',
  date: '',
  linkType: 'SHARED' as 'SHARED' | 'PER_CANDIDATE',
  primaryLink: '',
  secondaryLink: '',
  secondaryLinkTitle: '',
  notes: '',
  raceId: '', // Keep for legacy/single-race support
  selectedRaceIds: [] as string[] // New: for multi-race selection
};

export function EngagementManager() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [engagements, setEngagements] = useState<EngagementRecord[]>([]);
  const [races, setRaces] = useState<RaceOption[]>([]);
  const [form, setForm] = useState(initialFormState);
  const [participantMap, setParticipantMap] = useState<Record<string, ParticipantState>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const raceOptions = useMemo(() => {
    return races.map((race) => ({
      value: race.id,
      label: `${race.electionYear} • ${race.regionName ?? 'Region N/A'} • ${race.officeTitle}`
    }));
  }, [races]);

  const currentRace = useMemo(() => {
    if (!form.raceId) return null;
    return races.find((race) => race.id === form.raceId) ?? null;
  }, [form.raceId, races]);

  // Get all candidates from selected races
  const selectedCandidates = useMemo(() => {
    if (form.selectedRaceIds.length === 0) return [];
    const candidates: CandidateOption[] = [];
    form.selectedRaceIds.forEach(raceId => {
      const race = races.find(r => r.id === raceId);
      if (race) {
        candidates.push(...race.candidates);
      }
    });
    // Deduplicate by candidate ID
    const uniqueCandidates = new Map<string, CandidateOption>();
    candidates.forEach(c => uniqueCandidates.set(c.id, c));
    return Array.from(uniqueCandidates.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [form.selectedRaceIds, races]);

  function resetForm() {
    setForm(initialFormState);
    setParticipantMap({});
    setEditingId(null);
    setMessage('');
  }

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/engagements');
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load engagement data');
      }

      const data = (await response.json()) as EngagementResponse;
      setEngagements(data.engagements || []);
      setRaces(data.races || []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load engagement data');
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  function handleRaceChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const { value } = event.target;
    setForm((prev) => ({
      ...prev,
      raceId: value
    }));

    setParticipantMap({});
  }

  function currentParticipantState(candidateId: string): ParticipantState {
    return participantMap[candidateId] ?? { status: 'unset', notes: '', link: '' };
  }

  function updateParticipantState(
    candidateId: string,
    updater: (previous: ParticipantState) => ParticipantState
  ) {
    setParticipantMap((prev) => {
      const next = updater(prev[candidateId] ?? { status: 'unset', notes: '', link: '' });
      return {
        ...prev,
        [candidateId]: next
      };
    });
  }

  function handleParticipantStatusChange(candidateId: string, status: 'yes' | 'no' | 'unset') {
    updateParticipantState(candidateId, (previous) => ({
      status,
      notes: previous.notes,
      link: previous.link
    }));
  }

  function handleParticipantNotesChange(candidateId: string, notes: string) {
    updateParticipantState(candidateId, (previous) => ({
      status: previous.status,
      notes,
      link: previous.link
    }));
  }

  function handleParticipantLinkChange(candidateId: string, link: string) {
    updateParticipantState(candidateId, (previous) => ({
      status: previous.status,
      notes: previous.notes,
      link
    }));
  }

  function prepareParticipantsPayload() {
    const entries = Object.entries(participantMap);
    return entries
      .filter(([, value]) => value.status !== 'unset')
      .map(([candidateId, value]) => ({
        candidateId,
        participated: value.status === 'yes',
        notes: value.notes.trim() ? value.notes.trim() : undefined,
        link: value.link.trim() ? value.link.trim() : undefined
      }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');

    try {
      if (!form.title.trim()) {
        throw new Error('Title is required');
      }

      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        date: form.date ? form.date : null,
        linkType: form.linkType,
        primaryLink: form.primaryLink.trim() || null,
        secondaryLink: form.secondaryLink.trim() || null,
        secondaryLinkTitle: form.secondaryLinkTitle.trim() || null,
        notes: form.notes.trim() || null,
        raceId: form.raceId || null,
        participants: prepareParticipantsPayload()
      };

      const endpoint = editingId
        ? `/api/admin/engagements/${editingId}`
        : '/api/admin/engagements';
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to save engagement');
      }

      if (data?.engagement) {
        setEngagements((previous) => {
          const existingIndex = previous.findIndex((item) => item.id === data.engagement.id);
          if (existingIndex === -1) {
            return [data.engagement, ...previous];
          }
          const next = [...previous];
          next[existingIndex] = data.engagement;
          return next;
        });
      }

      setMessage(editingId ? 'Engagement updated.' : 'Engagement created.');
      resetForm();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to save engagement');
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(engagement: EngagementRecord) {
    setEditingId(engagement.id);
    setMessage('');
    setError('');

    // Determine which races contain the participants in this engagement
    const participantCandidateIds = new Set(engagement.participants.map(p => p.candidateId));
    const relevantRaceIds = races
      .filter(race => race.candidates.some(c => participantCandidateIds.has(c.id)))
      .map(race => race.id);

    setForm({
      title: engagement.title ?? '',
      date: engagement.date ? engagement.date.slice(0, 10) : '',
      linkType: engagement.linkType ?? 'SHARED',
      primaryLink: engagement.primaryLink ?? '',
      secondaryLink: engagement.secondaryLink ?? '',
      secondaryLinkTitle: engagement.secondaryLinkTitle ?? '',
      notes: engagement.notes ?? '',
      raceId: engagement.race?.id ?? '',
      selectedRaceIds: relevantRaceIds.length > 0 ? relevantRaceIds : (engagement.race?.id ? [engagement.race.id] : [])
    });

    const map: Record<string, ParticipantState> = {};
    engagement.participants.forEach((participant) => {
      map[participant.candidateId] = {
        status: participant.participated ? 'yes' : 'no',
        notes: participant.notes ?? '',
        link: (participant as any).link ?? '' // TypeScript might not know about link yet
      };
    });

    setParticipantMap(map);
  }

  async function handleDelete(engagement: EngagementRecord) {
    if (!window.confirm(`Delete engagement "${engagement.title}"? This cannot be undone.`)) {
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`/api/admin/engagements/${engagement.id}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': getCsrfToken()
        }
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete engagement');
      }

      setEngagements((previous) => previous.filter((item) => item.id !== engagement.id));
      if (editingId === engagement.id) {
        resetForm();
      }
      setMessage('Engagement deleted.');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to delete engagement');
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(value: string | null): string {
    if (!value) return 'N/A';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function engagementSummary(engagement: EngagementRecord) {
    const yesCount = engagement.participants.filter((participant) => participant.participated).length;
    const total = engagement.participants.length;
    if (total === 0) {
      return 'No participants recorded';
    }
    if (yesCount === total) {
      return `${yesCount} participation${yesCount === 1 ? '' : 's'}`;
    }
    return `${yesCount} participated / ${total - yesCount} declined`;
  }

  return (
    <section className="mt-10">
      <div className="flex flex-col gap-6">
        <header>
          <h2 className="text-xl font-semibold text-slate-900">Engagements</h2>
          <p className="text-sm text-slate-600">
            Track questionnaires, forums, and other events. Create a record once and then mark
            candidate participation.
          </p>
        </header>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1.6fr,1fr]">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-medium text-slate-900">
                {editingId ? 'Edit Engagement' : 'Create Engagement'}
              </h3>
              {editingId && (
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:underline"
                  onClick={resetForm}
                >
                  Cancel edit
                </button>
              )}
            </div>
            <form className="space-y-4 px-5 py-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="title">
                  Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={form.title}
                  onChange={handleInputChange}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. TCRC Questionnaire"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Link type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="linkType"
                      value="SHARED"
                      checked={form.linkType === 'SHARED'}
                      onChange={(e) => setForm(prev => ({ ...prev, linkType: e.target.value as any }))}
                      className="text-blue-600"
                    />
                    <span>One link for all</span>
                    <span className="text-xs text-slate-500">(e.g., questionnaire)</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="linkType"
                      value="PER_CANDIDATE"
                      checked={form.linkType === 'PER_CANDIDATE'}
                      onChange={(e) => setForm(prev => ({ ...prev, linkType: e.target.value as any }))}
                      className="text-blue-600"
                    />
                    <span>One link per candidate</span>
                    <span className="text-xs text-slate-500">(e.g., video timestamp)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="date">
                  Date
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleInputChange}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Races (select one or more)
                </label>
                <div className="max-h-48 overflow-y-auto rounded border border-slate-300 p-2">
                  {raceOptions.length === 0 ? (
                    <p className="text-sm text-slate-500">No races available</p>
                  ) : (
                    <div className="space-y-1">
                      {raceOptions.map((option) => (
                        <label key={option.value} className="flex items-center gap-2 text-sm hover:bg-slate-50 px-2 py-1 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.selectedRaceIds.includes(option.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm(prev => ({
                                  ...prev,
                                  selectedRaceIds: [...prev.selectedRaceIds, option.value],
                                  raceId: prev.selectedRaceIds.length === 0 ? option.value : prev.raceId
                                }));
                              } else {
                                setForm(prev => ({
                                  ...prev,
                                  selectedRaceIds: prev.selectedRaceIds.filter(id => id !== option.value),
                                  raceId: prev.raceId === option.value ? '' : prev.raceId
                                }));
                              }
                              // Clear participant map when races change
                              setParticipantMap({});
                            }}
                            className="rounded text-blue-600"
                          />
                          <span className="flex-1">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Select races to load candidates for participation tracking
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    className="mb-1 block text-sm font-medium text-slate-700"
                    htmlFor="primaryLink"
                  >
                    Primary link
                  </label>
                  <input
                    id="primaryLink"
                    name="primaryLink"
                    type="url"
                    value={form.primaryLink}
                    onChange={handleInputChange}
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="https://"
                  />
                </div>
                <div>
                  <label
                    className="mb-1 block text-sm font-medium text-slate-700"
                    htmlFor="secondaryLink"
                  >
                    Secondary link
                  </label>
                  <input
                    id="secondaryLink"
                    name="secondaryLink"
                    type="url"
                    value={form.secondaryLink}
                    onChange={handleInputChange}
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="https://"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    className="mb-1 block text-sm font-medium text-slate-700"
                    htmlFor="secondaryLinkTitle"
                  >
                    Secondary link label
                  </label>
                  <input
                    id="secondaryLinkTitle"
                    name="secondaryLinkTitle"
                    type="text"
                    value={form.secondaryLinkTitle}
                    onChange={handleInputChange}
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Transcript"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="notes">
                    Internal notes
                  </label>
                  <input
                    id="notes"
                    name="notes"
                    type="text"
                    value={form.notes}
                    onChange={handleInputChange}
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Optional note for moderators"
                  />
                </div>
              </div>

              <div className="rounded border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-800">Candidate participation</h4>
                  <span className="text-xs text-slate-500">
                    {selectedCandidates.length} candidate{selectedCandidates.length === 1 ? '' : 's'} from {form.selectedRaceIds.length} race{form.selectedRaceIds.length === 1 ? '' : 's'}
                  </span>
                </div>

                {selectedCandidates.length > 0 ? (
                  <div className="space-y-3">
                    {selectedCandidates.map((candidate) => {
                      const participant = currentParticipantState(candidate.id);
                      return (
                        <div
                          key={candidate.id}
                          className={cn(
                            'flex flex-col gap-2 rounded border border-slate-200 p-3',
                            participant.status === 'yes' && 'border-green-200 bg-green-50',
                            participant.status === 'no' && 'border-amber-200 bg-amber-50'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-800">
                              {candidate.name}
                            </span>
                            <select
                              value={participant.status}
                              onChange={(event) =>
                                handleParticipantStatusChange(
                                  candidate.id,
                                  event.target.value as ParticipantState['status']
                                )
                              }
                              className="rounded border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="unset">—</option>
                              <option value="yes">Participated</option>
                              <option value="no">No response / declined</option>
                            </select>
                          </div>
                          {form.linkType === 'PER_CANDIDATE' && (
                            <input
                              type="url"
                              value={participant.link}
                              onChange={(event) =>
                                handleParticipantLinkChange(candidate.id, event.target.value)
                              }
                              placeholder="Candidate-specific link (e.g., video timestamp)"
                              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          )}
                          <input
                            type="text"
                            value={participant.notes}
                            onChange={(event) =>
                              handleParticipantNotesChange(candidate.id, event.target.value)
                            }
                            placeholder="Optional note (e.g., submitted late, no contact info)"
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Select one or more races above to load candidates for participation tracking
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-blue-300"
                  disabled={submitting}
                >
                  {submitting ? 'Saving…' : editingId ? 'Update engagement' : 'Create engagement'}
                </button>
                <button
                  type="button"
                  className="text-sm text-slate-600 hover:underline"
                  onClick={resetForm}
                  disabled={submitting}
                >
                  Reset form
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-medium text-slate-900">Existing engagements</h3>
              <p className="text-xs text-slate-500">
                {engagements.length} record{engagements.length === 1 ? '' : 's'}
              </p>
            </div>
            <div className="max-h-[600px] overflow-y-auto px-5 py-4">
              {loading ? (
                <p className="text-sm text-slate-500">Loading engagements…</p>
              ) : engagements.length === 0 ? (
                <p className="text-sm text-slate-500">No engagements recorded yet.</p>
              ) : (
                <ul className="space-y-4">
                  {engagements.map((engagement) => (
                    <li key={engagement.id} className="rounded border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">
                            {engagement.title}
                          </h4>
                          <p className="text-xs text-slate-500">
                            {formatDate(engagement.date)} ·{' '}
                            {engagement.race
                              ? `${engagement.race.electionYear} ${engagement.race.regionName ?? ''} ${engagement.race.officeTitle}`
                              : 'No race linked'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="text-xs font-medium text-blue-600 hover:underline"
                            onClick={() => startEdit(engagement)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-xs font-medium text-red-600 hover:underline"
                            onClick={() => handleDelete(engagement)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-slate-600">{engagementSummary(engagement)}</p>
                      {engagement.primaryLink && (
                        <p className="mt-2 text-xs">
                          <a
                            href={engagement.primaryLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Primary link
                          </a>
                          {engagement.secondaryLink && (
                            <>
                              {' · '}
                              <a
                                href={engagement.secondaryLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {engagement.secondaryLinkTitle || 'Secondary link'}
                              </a>
                            </>
                          )}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
