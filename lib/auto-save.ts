'use client';

import React from 'react';

export interface AutoSaveConfig {
  /** Unique key for localStorage */
  storageKey: string;
  /** Delay in ms before saving (default: 1000) */
  debounceMs?: number;
  /** Show save status indicator (default: true) */
  showStatus?: boolean;
  /** Custom save message */
  saveMessage?: string;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Hook to auto-save form data to localStorage
 */
export function useAutoSave<T extends Record<string, unknown>>(
  formData: T,
  config: AutoSaveConfig
) {
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

  const { storageKey, debounceMs = 1000 } = config;

  // Load saved data on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        setLastSaved(data.timestamp ? new Date(data.timestamp) : null);
      }
    } catch (error) {
      console.error('Error loading auto-saved data:', error);
    }
  }, [storageKey]);

  // Auto-save when formData changes
  React.useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't save if form is empty
    const hasData = Object.values(formData).some(value => 
      value !== null && value !== undefined && value !== ''
    );

    if (!hasData) {
      return;
    }

    setSaveStatus('saving');

    // Debounce the save
    timeoutRef.current = setTimeout(() => {
      try {
        const dataToSave = {
          data: formData,
          timestamp: new Date().toISOString(),
        };
        
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        setSaveStatus('saved');
        setLastSaved(new Date());

        // Reset to idle after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Error auto-saving data:', error);
        setSaveStatus('error');
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [formData, storageKey, debounceMs]);

  // Restore saved data
  const restoreData = React.useCallback((): T | null => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.data as T;
      }
    } catch (error) {
      console.error('Error restoring auto-saved data:', error);
    }
    return null;
  }, [storageKey]);

  // Clear saved data
  const clearSavedData = React.useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setLastSaved(null);
      setSaveStatus('idle');
    } catch (error) {
      console.error('Error clearing auto-saved data:', error);
    }
  }, [storageKey]);

  return {
    saveStatus,
    lastSaved,
    restoreData,
    clearSavedData,
  };
}

/**
 * Get status text for display
 */
export function getAutoSaveStatusText(status: SaveStatus, message?: string): string {
  switch (status) {
    case 'saving':
      return message || 'جارٍ الحفظ...';
    case 'saved':
      return message || 'تم الحفظ';
    case 'error':
      return 'فشل الحفظ';
    default:
      return '';
  }
}

/**
 * Get status color class
 */
export function getAutoSaveStatusColor(status: SaveStatus): string {
  switch (status) {
    case 'saving':
      return 'text-blue-600';
    case 'saved':
      return 'text-green-600';
    case 'error':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Format last saved time
 */
export function formatLastSaved(lastSaved: Date | null): string {
  if (!lastSaved) return '';
  const now = new Date();
  const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);
  
  if (diff < 60) return 'منذ لحظات';
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  return `منذ ${Math.floor(diff / 3600)} ساعة`;
}

/**
 * Hook to detect and restore unsaved data
 */
export function useRestorePrompt(storageKey: string) {
  const [hasUnsavedData, setHasUnsavedData] = React.useState(false);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setHasUnsavedData(true);
      }
    } catch (error) {
      console.error('Error checking for unsaved data:', error);
    }
  }, [storageKey]);

  const dismissPrompt = React.useCallback(() => {
    setHasUnsavedData(false);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return {
    hasUnsavedData,
    dismissPrompt,
  };
}
