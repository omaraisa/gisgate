'use client';

import React from 'react';
import { SaveStatus, getAutoSaveStatusText, getAutoSaveStatusColor, formatLastSaved } from '@/lib/auto-save';

export interface AutoSaveIndicatorProps {
  status: SaveStatus;
  lastSaved: Date | null;
  message?: string;
}

/**
 * Component to display auto-save status
 */
export function AutoSaveIndicator({
  status,
  lastSaved,
  message,
}: AutoSaveIndicatorProps) {
  if (status === 'idle') {
    return null;
  }

  const statusText = getAutoSaveStatusText(status, message);
  const statusColor = getAutoSaveStatusColor(status);
  const lastSavedText = formatLastSaved(lastSaved);

  return (
    <div className={`text-sm ${statusColor} flex items-center gap-2`}>
      {status === 'saving' && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {status === 'saved' && (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {status === 'error' && (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      <span>{statusText}</span>
      {lastSaved && status === 'saved' && (
        <span className="text-gray-500">({lastSavedText})</span>
      )}
    </div>
  );
}
