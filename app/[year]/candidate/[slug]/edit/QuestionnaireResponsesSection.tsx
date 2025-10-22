'use client';

import { useState } from 'react';
import { getCsrfToken } from '@/lib/auth';

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

interface Props {
  responses: QuestionnaireResponse[];
  candidateId: string;
  onUpdate: () => void;
}

export function QuestionnaireResponsesSection({ responses, candidateId, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number | null>(null);
  const [editComment, setEditComment] = useState<string>('');
  const [editTextResponse, setEditTextResponse] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const startEdit = (response: QuestionnaireResponse) => {
    setEditingId(response.id);
    setEditValue(response.value);
    setEditComment(response.comment || '');
    setEditTextResponse(response.textResponse || '');
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue(null);
    setEditComment('');
    setEditTextResponse('');
    setError('');
  };

  const saveEdit = async (responseId: string) => {
    try {
      setSaving(true);
      setError('');

      const response = await fetch(`/api/admin/questionnaire-responses/${responseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify({
          value: editValue,
          comment: editComment || null,
          textResponse: editTextResponse || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        setEditingId(null);
        onUpdate();
      } else {
        setError(data.error || 'Failed to save response');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  if (responses.length === 0) {
    return (
      <section className="admin-section">
        <h2>Questionnaire Responses</h2>
        <p style={{ fontSize: '14px', opacity: 0.6 }}>No questionnaire responses found.</p>
      </section>
    );
  }

  // Group by questionnaire
  const grouped = responses.reduce((acc, response) => {
    const title = response.question.questionnaire.title;
    if (!acc[title]) {
      acc[title] = [];
    }
    acc[title].push(response);
    return acc;
  }, {} as Record<string, QuestionnaireResponse[]>);

  return (
    <section className="admin-section">
      <h2>Questionnaire Responses</h2>
      <p style={{ fontSize: '14px', opacity: 0.7, marginBottom: '15px' }}>
        Edit existing responses. Cannot create or delete responses from this interface.
      </p>

      {error && (
        <div className="admin-message-error" style={{ marginBottom: '15px' }}>
          {error}
        </div>
      )}

      <div className="admin-responses">
        {Object.entries(grouped).map(([questionnaireTitle, questionnaireResponses]) => (
          <div key={questionnaireTitle} className="admin-response-group">
            <h3>{questionnaireTitle}</h3>
            {questionnaireResponses.map((response) => (
              <div key={response.id} className="admin-response-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: 500, margin: 0 }}>
                      {response.question.question || 'Question'}
                    </p>
                    <p style={{ fontSize: '12px', opacity: 0.6, margin: '3px 0 0 0' }}>
                      Type: {response.question.type}
                    </p>
                  </div>
                  {editingId !== response.id && (
                    <button onClick={() => startEdit(response)} style={{ fontSize: '14px' }}>
                      Edit
                    </button>
                  )}
                </div>

                {editingId === response.id ? (
                  <div style={{ marginTop: '10px' }}>
                    {response.question.type === 'scale' && (
                      <div className="admin-field">
                        <label style={{ fontSize: '12px' }}>Value (scale)</label>
                        <input
                          type="number"
                          value={editValue ?? ''}
                          onChange={(e) => setEditValue(e.target.value ? Number.parseInt(e.target.value, 10) : null)}
                          style={{ width: '120px' }}
                        />
                      </div>
                    )}

                    <div className="admin-field">
                      <label style={{ fontSize: '12px' }}>Comment</label>
                      <textarea
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="admin-field">
                      <label style={{ fontSize: '12px' }}>Text Response</label>
                      <textarea
                        value={editTextResponse}
                        onChange={(e) => setEditTextResponse(e.target.value)}
                        rows={4}
                        style={{ fontFamily: 'monospace', fontSize: '13px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => saveEdit(response.id)}
                        disabled={saving}
                        className="admin-save-button"
                        style={{ fontSize: '13px', padding: '5px 12px' }}
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={saving}
                        style={{ fontSize: '13px', padding: '5px 12px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: '8px', fontSize: '14px' }}>
                    {response.value !== null && (
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Value:</strong> {response.value}
                      </div>
                    )}
                    {response.comment && (
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Comment:</strong>
                        <p style={{ margin: '4px 0 0 0', opacity: 0.8 }}>{response.comment}</p>
                      </div>
                    )}
                    {response.textResponse && (
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Text Response:</strong>
                        <p style={{ margin: '4px 0 0 0', opacity: 0.8, whiteSpace: 'pre-wrap' }}>{response.textResponse}</p>
                      </div>
                    )}
                    {!response.value && !response.comment && !response.textResponse && (
                      <p style={{ opacity: 0.5, fontStyle: 'italic' }}>No response provided</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
