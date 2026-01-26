import { useState, useEffect, useCallback, useRef } from 'react';
import type { Patient, ReportType, Gender } from '@/types/database';

const DRAFT_KEY = 'medilab-draft-report';
const DEBOUNCE_MS = 500;

export interface NewPatientDraft {
  full_name: string;
  age: number;
  gender: Gender;
  phone?: string;
  patient_id_number?: string;
}

export interface ReportDetailsDraft {
  referring_doctor: string;
  clinical_notes: string;
  test_date: string;
}

export interface DraftReport {
  version: 1;
  savedAt: string;
  patient: Pick<Patient, 'id' | 'full_name'> | null;
  newPatientData: NewPatientDraft | null;
  selectedTemplate: ReportType | null;
  reportDetails: ReportDetailsDraft;
  reportData: Record<string, string | number | boolean | null>;
}

interface UseDraftReportReturn {
  draft: DraftReport | null;
  hasDraft: boolean;
  saveDraft: (data: Partial<Omit<DraftReport, 'version' | 'savedAt'>>) => void;
  loadDraft: () => DraftReport | null;
  clearDraft: () => void;
  draftTimestamp: string | null;
}

const createEmptyDraft = (): DraftReport => ({
  version: 1,
  savedAt: new Date().toISOString(),
  patient: null,
  newPatientData: null,
  selectedTemplate: null,
  reportDetails: {
    referring_doctor: '',
    clinical_notes: '',
    test_date: new Date().toISOString().split('T')[0],
  },
  reportData: {},
});

export function useDraftReport(): UseDraftReportReturn {
  const [draft, setDraft] = useState<DraftReport | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load draft on mount
  useEffect(() => {
    const storedDraft = loadDraftFromStorage();
    if (storedDraft) {
      setDraft(storedDraft);
    }
  }, []);

  const loadDraftFromStorage = (): DraftReport | null => {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored) as DraftReport;
      // Validate version
      if (parsed.version !== 1) return null;
      
      return parsed;
    } catch {
      return null;
    }
  };

  const saveDraftToStorage = useCallback((data: DraftReport) => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save draft to localStorage:', e);
    }
  }, []);

  const saveDraft = useCallback((data: Partial<Omit<DraftReport, 'version' | 'savedAt'>>) => {
    // Debounce saves
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setDraft((prev) => {
        const current = prev || createEmptyDraft();
        const updated: DraftReport = {
          ...current,
          ...data,
          version: 1,
          savedAt: new Date().toISOString(),
        };
        saveDraftToStorage(updated);
        return updated;
      });
    }, DEBOUNCE_MS);
  }, [saveDraftToStorage]);

  const loadDraft = useCallback((): DraftReport | null => {
    const stored = loadDraftFromStorage();
    if (stored) {
      setDraft(stored);
    }
    return stored;
  }, []);

  const clearDraft = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // Ignore
    }
    setDraft(null);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const hasDraft = draft !== null && (
    draft.patient !== null ||
    draft.newPatientData !== null ||
    draft.selectedTemplate !== null ||
    Object.keys(draft.reportData).length > 0 ||
    draft.reportDetails.referring_doctor !== '' ||
    draft.reportDetails.clinical_notes !== ''
  );

  const draftTimestamp = draft?.savedAt || null;

  return {
    draft,
    hasDraft,
    saveDraft,
    loadDraft,
    clearDraft,
    draftTimestamp,
  };
}
