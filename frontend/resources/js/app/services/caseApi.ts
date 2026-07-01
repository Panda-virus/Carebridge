import { CaseReport, CaseTimelineSummary } from '../types';

const API_BASE = '/api';

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem('authToken');

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const caseApi = {
  // Get all cases
  getAll: () => request<CaseReport[]>('/case-reports'),

  // Get single case
  getOne: (id: string) => request<CaseReport>(`/case-reports/${id}`),

  // Create new case
  create: (data: Partial<CaseReport> | FormData) =>
    // The frontend sometimes sends FormData when uploading files
    (data as any) instanceof FormData
      ? fetch(`${API_BASE}/case-reports`, { method: 'POST', body: data as any }).then((r) => {
          if (!r.ok) throw new Error('Upload failed');
          return r.json();
        })
      : request<CaseReport>('/case-reports', {
          method: 'POST',
          body: JSON.stringify(data),
        }),

  // Update case
  update: (id: string, data: Partial<CaseReport>) =>
    request<CaseReport>(`/case-reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Get timeline for a case
  getTimeline: (id: string) =>
    request<CaseTimelineSummary>(`/case-reports/${id}/timeline`),

  // Get current stage
  getCurrentStage: (id: string) =>
    request<any>(`/case-reports/${id}/timeline/current`),

  // Get pending stages
  getPendingStages: (id: string) =>
    request<any[]>(`/case-reports/${id}/timeline/pending`),

  // Get overdue stages
  getOverdueStages: (id: string) =>
    request<any[]>(`/case-reports/${id}/timeline/overdue`),

  // Manually trigger overdue check
  checkOverdue: (id: string) =>
    request<{ message: string; notifications_sent: number }>(
      `/case-reports/${id}/timeline/check-overdue`,
      { method: 'POST' }
    ),
};
