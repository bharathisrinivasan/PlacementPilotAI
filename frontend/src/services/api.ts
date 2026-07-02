/**
 * PlacementPilot AI — API Service
 *
 * Axios-based API client for all backend communication.
 */

import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type {
  AnalysisResult,
  HealthResponse,
  ResourcesResponse,
  RolesResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with defaults
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes — AI analysis can take time
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string; message?: string }>) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';

    console.error(`API Error [${error.response?.status}]:`, message);
    return Promise.reject(new Error(message));
  }
);

// ──────────────────────────────────────────────
// API Functions
// ──────────────────────────────────────────────

export async function checkHealth(): Promise<HealthResponse> {
  const { data } = await api.get<HealthResponse>('/api/health');
  return data;
}

export async function getRoles(): Promise<RolesResponse> {
  const { data } = await api.get<RolesResponse>('/api/roles');
  return data;
}

export async function getResources(): Promise<ResourcesResponse> {
  const { data } = await api.get<ResourcesResponse>('/api/resources');
  return data;
}

export async function analyzeResume(
  file: File,
  targetRole: string,
  jobDescription: string = ''
): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('target_role', targetRole);
  formData.append('job_description', jobDescription);

  const { data } = await api.post<AnalysisResult>('/api/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function analyzeResumeText(
  resumeText: string,
  targetRole: string,
  jobDescription: string = ''
): Promise<AnalysisResult> {
  const { data } = await api.post<AnalysisResult>('/api/analyze-text', {
    resume_text: resumeText,
    target_role: targetRole,
    job_description: jobDescription,
  });
  return data;
}

export async function atsAnalysis(
  resumeText: string,
  targetRole: string,
  jobDescription: string
): Promise<AnalysisResult> {
  const { data } = await api.post<AnalysisResult>('/api/ats-analysis', {
    resume_text: resumeText,
    target_role: targetRole,
    job_description: jobDescription,
  });
  return data;
}

export default api;
