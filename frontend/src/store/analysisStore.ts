/**
 * PlacementPilot AI — Zustand Store
 *
 * Global state management for analysis results, selected role, and UI state.
 */

import { create } from 'zustand';
import type { AnalysisResult, AnalysisStep, RoleMetadata } from '../types';

interface AnalysisStore {
  // State
  selectedRole: string;
  analysisResult: AnalysisResult | null;
  analysisStep: AnalysisStep;
  roles: RoleMetadata[];
  error: string | null;
  resumeText: string;
  jobDescription: string;

  // Actions
  setSelectedRole: (role: string) => void;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  setAnalysisStep: (step: AnalysisStep) => void;
  setRoles: (roles: RoleMetadata[]) => void;
  setError: (error: string | null) => void;
  setResumeText: (text: string) => void;
  setJobDescription: (jd: string) => void;
  resetAnalysis: () => void;
}

export const useAnalysisStore = create<AnalysisStore>((set) => ({
  // Initial state
  selectedRole: '',
  analysisResult: null,
  analysisStep: 'idle',
  roles: [],
  error: null,
  resumeText: '',
  jobDescription: '',

  // Actions
  setSelectedRole: (role) => set({ selectedRole: role }),
  setAnalysisResult: (result) => set({ analysisResult: result, analysisStep: 'complete' }),
  setAnalysisStep: (step) => set({ analysisStep: step }),
  setRoles: (roles) => set({ roles }),
  // When an error message is set → step becomes 'error' (hides overlay, shows error text)
  // When error is cleared (null) → step returns to 'idle'
  setError: (error) => set({ error, analysisStep: error ? 'error' : 'idle' }),
  setResumeText: (text) => set({ resumeText: text }),
  setJobDescription: (jd) => set({ jobDescription: jd }),
  resetAnalysis: () =>
    set({
      analysisResult: null,
      analysisStep: 'idle',
      error: null,
    }),
}));
