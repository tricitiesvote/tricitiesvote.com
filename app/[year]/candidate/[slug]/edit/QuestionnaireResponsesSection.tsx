'use client';

import { useState } from 'react';
import { getCsrfToken } from '@/lib/auth/getCsrfToken';

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
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Questionnaire Responses</h2>
        <p className="text-sm text-gray-500">No questionnaire responses found.</p>
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
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Questionnaire Responses</h2>
      <p className="text-sm text-gray-600 mb-4">
        Edit existing responses. Cannot create or delete responses from this interface.
      </p>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(grouped).map(([questionnaireTitle, questionnaireResponses]) => (
          <div key={questionnaireTitle} className="border-b border-gray-200 pb-6 last:border-b-0">
            <h3 className="font-medium text-gray-900 mb-3">{questionnaireTitle}</h3>
            <div className="space-y-4">
              {questionnaireResponses.map((response) => (
                <div key={response.id} className="bg-gray-50 p-4 rounded border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {response.question.question || 'Question'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Type: {response.question.type}
                      </p>
                    </div>
                    {editingId !== response.id && (
                      <button
                        onClick={() => startEdit(response)}
                        className="ml-4 text-sm text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  {editingId === response.id ? (
                    <div className="mt-3 space-y-3">
                      {response.question.type === 'scale' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Value (scale)
                          </label>
                          <input
                            type="number"
                            value={editValue ?? ''}
                            onChange={(e) => setEditValue(e.target.value ? Number.parseInt(e.target.value, 10) : null)}
                            className="w-32 px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Comment
                        </label>
                        <textarea
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                          rows={2}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Text Response
                        </label>
                        <textarea
                          value={editTextResponse}
                          onChange={(e) => setEditTextResponse(e.target.value)}
                          rows={4}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded font-mono"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(response.id)}
                          disabled={saving}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={saving}
                          className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 space-y-2 text-sm">
                      {response.value !== null && (
                        <div>
                          <span className="font-medium text-gray-700">Value:</span> {response.value}
                        </div>
                      )}
                      {response.comment && (
                        <div>
                          <span className="font-medium text-gray-700">Comment:</span>
                          <p className="text-gray-600 mt-1">{response.comment}</p>
                        </div>
                      )}
                      {response.textResponse && (
                        <div>
                          <span className="font-medium text-gray-700">Text Response:</span>
                          <p className="text-gray-600 mt-1 whitespace-pre-wrap">{response.textResponse}</p>
                        </div>
                      )}
                      {!response.value && !response.comment && !response.textResponse && (
                        <p className="text-gray-500 italic">No response provided</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
