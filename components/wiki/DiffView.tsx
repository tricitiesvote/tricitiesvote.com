'use client';

import type { ReactNode } from 'react';
import React from 'react';

type DiffSegment = {
  type: 'same' | 'added' | 'removed';
  value: string;
};

function diffLines(oldValue: string, newValue: string): DiffSegment[] {
  const oldLines = oldValue.split(/\r?\n/);
  const newLines = newValue.split(/\r?\n/);
  const m = oldLines.length;
  const n = newLines.length;

  const dp = Array.from({ length: m + 1 }, () => Array<number>(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (oldLines[i] === newLines[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const result: DiffSegment[] = [];
  let i = 0;
  let j = 0;

  while (i < m && j < n) {
    if (oldLines[i] === newLines[j]) {
      result.push({ type: 'same', value: oldLines[i] });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ type: 'removed', value: oldLines[i] });
      i += 1;
    } else {
      result.push({ type: 'added', value: newLines[j] });
      j += 1;
    }
  }

  while (i < m) {
    result.push({ type: 'removed', value: oldLines[i] });
    i += 1;
  }

  while (j < n) {
    result.push({ type: 'added', value: newLines[j] });
    j += 1;
  }

  return result;
}

interface DiffViewProps {
  oldValue: string | null | undefined;
  newValue: string | null | undefined;
}

export function DiffView({ oldValue, newValue }: DiffViewProps): ReactNode {
  const sanitizedOld = (oldValue ?? '').toString();
  const sanitizedNew = (newValue ?? '').toString();

  if (!sanitizedOld && !sanitizedNew) {
    return <div className="text-sm text-gray-500">No content</div>;
  }

  const diff = diffLines(sanitizedOld, sanitizedNew);

  return (
    <div className="grid gap-3">
      {diff.map((segment, index) => {
        const baseClass =
          segment.type === 'same'
            ? 'bg-white'
            : segment.type === 'added'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200';
        const prefix = segment.type === 'added' ? '+' : segment.type === 'removed' ? '-' : ' ';

        return (
          <pre
            key={`${segment.type}-${index}-${segment.value}`}
            className={`${baseClass} text-sm rounded px-2 py-1 whitespace-pre-wrap`}
          >
            {`${prefix} ${segment.value || ' '}`}
          </pre>
        );
      })}
    </div>
  );
}
