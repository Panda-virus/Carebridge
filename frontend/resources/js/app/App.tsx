import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CounselingRequest, CaseReport, CaseStatus, UserRole, CounselorSchedule, CounselingSession, ExternalCounselor } from './types';
import { StudentDashboard } from './components/StudentDashboard';
import { CounselorDashboard } from './components/CounselorDashboard';
import { DeanDashboard } from './components/dean/DeanDashboard';
import { IICDashboard } from './components/iic/IICDashboard';
import { DisciplinaryDashboard } from './components/disciplinary/DisciplinaryDashboard';
import { RegistrarDashboard } from './components/registrar/RegistrarDashboard';
import { ExternalCounselorDashboard } from './components/external/ExternalCounselorDashboard';
import { SystemAdministrator } from './components/SystemAdministrator';
import { LandingPage } from './components/auth/LandingPage';
import { LoginPage, RegisterData, RegisterModal } from './components/auth/LoginPage';
import { ProfilePage } from './components/student/ProfilePage';
import { CaseReportsPage } from './components/student/CaseReportsPage';
import { HeartHandshake, LogOut, User } from 'lucide-react';
import { categorizeCounselingRequest, categorizeCaseReport, getCaseReportRouting, CaseCategory } from './utils/categorization';
import { WorkflowAction } from './utils/caseWorkflow';
import { WorkflowActionPayload } from './components/cases/CaseWorkflowPanel';
import { autoScheduleAppointment, rescheduleForUrgent, getDefaultCounselorSchedule, getUpcomingAvailableSlots, getNextAvailableSlotAfter } from './utils/scheduling';

// ─── Credentials ────────────────────────────────────────────────────────────

interface AuthUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  gender?: string;
  program?: string;
  level?: string;
  emergencyContact?: string;
  scheduleSetupAt?: string;
}

const mapServerUserToAuthUser = (user: any): AuthUser => {
  const normalizedRole = String(user.role ?? '').toLowerCase();
  const role = normalizedRole === 'admin' || normalizedRole === 'system_administrator' || normalizedRole === 'system_admin'
    ? 'system_administrator'
    : normalizedRole as UserRole;

  return {
    id: user.id?.toString() ?? '',
    role,
    name: user.name,
    email: user.email,
    phone: user.phone ?? undefined,
    location: user.location ?? undefined,
    gender: user.gender ?? undefined,
    program: user.program ?? undefined,
    level: user.level ?? undefined,
    emergencyContact: user.emergency_contact ?? undefined,
    scheduleSetupAt: user.schedule_setup_at ?? undefined,
  };
};

class DashboardErrorBoundary extends React.Component<{
  children: React.ReactNode;
}, {
  hasError: boolean;
  errorMessage?: string;
}> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('IIC dashboard render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
          <div className="max-w-xl rounded-3xl border border-border bg-card p-10 text-center shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-destructive">Dashboard Error</p>
            <h1 className="mt-4 text-2xl font-semibold text-foreground">Something went wrong.</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              The IIC dashboard could not be displayed. Please refresh the page or contact the administrator.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">{this.state.errorMessage}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const toNumericId = (id?: string | number | null): number | undefined => {
  if (id === undefined || id === null || id === '') return undefined;
  const numericId = Number(id);
  return Number.isInteger(numericId) && numericId > 0 ? numericId : undefined;
};

const normalizeAvailableSlots = (raw: unknown) => {
  if (!Array.isArray(raw)) return [];
  return raw.map((slot: Record<string, unknown>) => ({
    dayOfWeek: Number(slot.dayOfWeek ?? slot.day_of_week ?? 0),
    startTime: String(slot.startTime ?? slot.start_time ?? '09:00'),
    endTime: String(slot.endTime ?? slot.end_time ?? '17:00'),
    slotDuration: Number(slot.slotDuration ?? slot.slot_duration ?? 60),
  }));
};

const serializeLocation = (location?: CaseReport['location']) => {
  if (!location) return undefined;
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    timestamp: location.timestamp instanceof Date
      ? location.timestamp.toISOString()
      : location.timestamp,
  };
};

const parseIncidentDate = (value?: string) => {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return undefined;
  return new Date(parsed).toISOString().split('T')[0];
};

export default function App() {
  // Set document title
  useEffect(() => {
    document.title = 'Mzuni Carebridge System';
  }, []);

  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [openRegisterOnLogin, setOpenRegisterOnLogin] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [openChatAfterLogin, setOpenChatAfterLogin] = useState(false);
  const [showCaseReportModal, setShowCaseReportModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [authTransitionState, setAuthTransitionState] = useState<'idle' | 'signing-in' | 'signing-out'>('idle');
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    gender: '',
    program: '',
    level: '',
    emergencyContact: '',
  });
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [showScheduleSetupModal, setShowScheduleSetupModal] = useState(false);

  const [counselorSchedule, setCounselorSchedule] = useState<CounselorSchedule & { id?: number }>(
    getDefaultCounselorSchedule('', 'University Counseling Team')
  );

  // ─── Counseling state ─────────────────────────────────────────────────────
  const [requests, setRequests] = useState<CounselingRequest[]>([]);

  // ─── Case reports state ───────────────────────────────────────────────────
  const [caseReports, setCaseReports] = useState<CaseReport[]>([]);
  const [sessions, setSessions] = useState<CounselingSession[]>([]);
  const [externalCounselors, setExternalCounselors] = useState<ExternalCounselor[]>([]);

  const apiFetch = async (path: string, options: RequestInit = {}) => {
    const isFormData = options.body instanceof FormData;
    const headers = isFormData
      ? {
          ...(options.headers as Record<string, string>),
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        }
      : {
          'Content-Type': 'application/json',
          ...(options.headers as Record<string, string>),
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        };

    const response = await fetch(`/api${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let message = 'Request failed';
      try {
        const payload = await response.json();
        message = payload.message || message;
      } catch {
        // ignore parse errors
      }
      throw new Error(message);
    }

    return response;
  };

  const downloadReport = async (params: { startDate: string; endDate: string; category: string; format: 'html' | 'pdf'; type?: string }) => {
    const query = new URLSearchParams();
    query.set('startDate', params.startDate);
    query.set('endDate', params.endDate);
    query.set('category', params.category);
    query.set('format', params.format);
    if (params.type && params.type !== 'default') {
      query.set('type', params.type);
    }

    const endpoint = params.type === 'user-activity'
      ? '/api/reports/users/export'
      : '/api/case-reports/export';

    const response = await fetch(`${endpoint}?${query.toString()}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      let message = 'Unable to export report.';
      try {
        const payload = await response.json();
        message = payload.message || message;
      } catch {
        // ignore parse errors
      }
      throw new Error(message);
    }

    const blob = await response.blob();
    const filename = params.type === 'user-activity'
      ? `carebridge-user-activity-report-${params.startDate}to${params.endDate}.${params.format}`
      : `carebridge-report-${params.startDate}to${params.endDate}${params.category !== 'all' ? `-${params.category}` : ''}.${params.format}`;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (!storedToken) {
      setIsRestoring(false);
      return;
    }

    const restoreSession = async () => {
      try {
        setAuthToken(storedToken);
        const response = await fetch('/api/me', {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (!response.ok) {
          throw new Error('Session expired');
        }
        const user = await response.json();
        const authState = mapServerUserToAuthUser(user);
        setAuthUser(authState);
        if (user.role === 'counselor' && !user.schedule_setup_at) {
          setShowScheduleSetupModal(true);
        }
        localStorage.setItem('authUser', JSON.stringify(authState));
      } catch {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        setAuthToken(null);
        setAuthUser(null);
      } finally {
        setIsRestoring(false);
      }
    };

    restoreSession();
  }, []);

  const parseDate = (value: string | null | undefined) => (value ? new Date(value) : undefined);

  const normalizeAttachments = (raw: any) => {
    if (!raw) return undefined;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : undefined;
      } catch {
        return undefined;
      }
    }
    if (typeof raw === 'object' && raw !== null) {
      const values = Object.values(raw);
      if (values.every((item) => item && typeof item === 'object' && !Array.isArray(item))) {
        return values;
      }
    }
    return undefined;
  };

  const normalizeCounselingRequest = (raw: any): CounselingRequest => ({
    id: raw.id.toString(),
    studentId: raw.student_id?.toString() ?? raw.student?.id?.toString() ?? '',
    studentName: raw.student_name ?? raw.student?.name ?? undefined,
    studentEmail: raw.student_email ?? raw.student?.email ?? undefined,
    studentPhone: raw.student_phone ?? raw.student?.phone ?? undefined,
    studentLocation: raw.student_location ?? undefined,
    concern: raw.concern,
    category: raw.category,
    urgencyLevel: raw.urgency_level as any,
    preferredTime: raw.preferred_time ?? '',
    status: raw.status as any,
    createdAt: parseDate(raw.created_at) ?? new Date(),
    requiresImmediateAttention: raw.requires_immediate_attention ?? false,
    matchedKeywords: raw.matched_keywords ?? [],
    autoScheduleProposal: raw.proposed_date
      ? {
          proposedDate: parseDate(raw.proposed_date) as Date,
          proposedTime: raw.proposed_time ?? '',
          studentApproved: Boolean(raw.student_approved),
          counselorApproved: Boolean(raw.counselor_approved),
          studentRejectedAt: parseDate(raw.student_rejected_at),
          counselorRejectedAt: parseDate(raw.counselor_rejected_at),
        }
      : undefined,
    counselorId: raw.counselor_id?.toString() ?? undefined,
    counselorName: raw.counselor_name ?? undefined,
    scheduledDate: parseDate(raw.scheduled_date),
    scheduledTime: raw.scheduled_time ?? undefined,
    totalSessions: raw.total_sessions ?? undefined,
    completedSessions: raw.completed_sessions ?? undefined,
    sessionNotes: raw.session_notes ?? [],
    sessionScores: raw.session_scores ?? [],
    overallScore: raw.overall_score != null ? Number(raw.overall_score) : undefined,
    externalSessionRecords: raw.external_session_records ?? [],
    recommendations: raw.recommendations ?? undefined,
    referralReason: raw.referral_reason ?? undefined,
    externalCounselorInfo: raw.external_counselor_info ?? undefined,
    externalCounselorId: raw.external_counselor_id?.toString() ?? undefined,
  });

  const normalizeCaseReport = (raw: any): CaseReport => {
    const id = raw.id ?? raw.case_id ?? raw.report_id;
    if (id === undefined || id === null) {
      throw new Error('Case report is missing id');
    }

    const category = raw.category ?? raw.case_category ?? 'general';
    const status = raw.status ?? 'submitted';
    const assignedRole = raw.assigned_role ?? raw.assignedRole ?? undefined;

    return {
      id: id.toString(),
      ticketNumber: raw.ticket_number ?? undefined,
      category,
      subCategory: raw.sub_category ?? undefined,
      detailedCategory: raw.detailed_category ?? undefined,
      description: raw.description ?? 'No description provided.',
      status: status as any,
      workflowStage: raw.workflow_stage ?? raw.workflowStage ?? 'at_iic',
      assignedRole: typeof assignedRole === 'string' ? assignedRole.toLowerCase() as UserRole : undefined,
      createdAt: parseDate(raw.created_at ?? raw.createdAt) ?? new Date(),
      responseNotes: raw.response_notes ?? raw.responseNotes ?? undefined,
      reviewedAt: parseDate(raw.reviewed_at ?? raw.reviewedAt),
      reviewedBy: raw.reviewed_by ?? raw.reviewedBy ?? undefined,
      urgencyLevel: raw.urgency_level as any,
      requiresLocationSharing: raw.requires_location_sharing ?? raw.requiresLocationSharing ?? false,
      location: raw.location ?? undefined,
      matchedKeywords: raw.matched_keywords ?? raw.matchedKeywords ?? [],
      isAnonymous: raw.is_anonymous ?? raw.isAnonymous ?? false,
      permissionRequest:
        raw.permission_request ??
        raw.permissionRequest ??
        raw.permission_request_record?.request_text ??
        raw.permissionRequestRecord?.requestText ??
        undefined,
      permissionApprovedAt: parseDate(raw.permission_approved_at ?? raw.permissionApprovedAt),
      findingsReport:
        raw.latest_finding?.findings_report ??
        raw.latestFinding?.findingsReport ??
        raw.findings_report ??
        raw.findingsReport ??
        undefined,
      findingsFiles: normalizeAttachments(
        raw.latest_finding?.findings_files ??
        raw.latestFinding?.findingsFiles ??
        raw.findings_files ??
        raw.findingsFiles
      ),
      meetingNotice: raw.meeting_notice ?? raw.meetingNotice ?? undefined,
      registrarAction: raw.registrar_action ?? raw.registrarAction ?? undefined,
      registrarActionReason: raw.registrar_action_reason ?? raw.registrarActionReason ?? undefined,
      registrarCaseFile: raw.registrar_case_file ?? raw.registrarCaseFile ?? undefined,
      meetingDate: parseDate(raw.meeting_date ?? raw.meetingDate),
      verdict: raw.verdict ?? undefined,
      studentName: raw.student_name ?? raw.studentName ?? raw.student?.name ?? raw.affectedStudent?.name ?? raw.reportedByUser?.name ?? undefined,
      studentId: raw.student_id?.toString() ?? raw.studentId?.toString() ?? raw.affected_student_id?.toString() ?? raw.affectedStudent?.id?.toString() ?? raw.reported_by_user_id?.toString() ?? raw.reportedByUser?.id?.toString() ?? undefined,
      studentEmail: raw.student_email ?? raw.studentEmail ?? raw.student?.email ?? raw.affectedStudent?.email ?? raw.reportedByUser?.email ?? undefined,
      studentPhone: raw.student_phone ?? raw.studentPhone ?? raw.student?.phone ?? raw.affectedStudent?.phone ?? raw.reportedByUser?.phone ?? undefined,
      reportedByType: raw.reported_by_type ?? raw.reportedByType ?? undefined,
      reportedByName:
        raw.reporter_name ??
        raw.reportedByName ??
        raw.user?.name ??
        raw.user?.full_name ??
        raw.student?.name ??
        raw.student?.full_name ??
        undefined,
      department: raw.department ?? undefined,
      defendantName: raw.defendant_name ?? raw.defendantName ?? undefined,
      yearOfStudy: raw.year_of_study ?? raw.yearOfStudy ?? undefined,
      incidentDate: raw.incident_date ?? raw.incidentDate ?? undefined,
      incidentTime: raw.incident_time ?? raw.incidentTime ?? undefined,
      incidentLocation: raw.incident_location ?? raw.incidentLocation ?? undefined,
      evidenceFiles: raw.evidence_files ?? raw.evidenceFiles ?? undefined,
    };
  };

  const normalizeSchedule = (raw: any): CounselorSchedule & { id?: number } => {
    const fallbackSchedule = getDefaultCounselorSchedule(
      currentCounselorId,
      currentCounselorName
    );

    return {
      id: raw.id,
      counselorId: raw.counselor_id?.toString() ?? '',
      counselorName: raw.counselor_name ?? (currentCounselorName || 'University Counseling Team'),
      weekStartDate: parseDate(raw.week_start_date) ?? new Date(),
      weekEndDate: parseDate(raw.week_end_date) ?? parseDate(raw.week_start_date) ?? new Date(),
      availableSlots: normalizeAvailableSlots(raw.available_slots).length > 0
        ? normalizeAvailableSlots(raw.available_slots)
        : fallbackSchedule.availableSlots,
      createdAt: parseDate(raw.created_at) ?? new Date(),
    };
  };

  const normalizeCounselingSession = (raw: any): CounselingSession => ({
    id: raw.id.toString(),
    requestId: raw.request_id.toString(),
    sessionNumber: raw.session_number,
    date: parseDate(raw.date) ?? new Date(),
    notes: raw.notes ?? undefined,
    score: raw.score != null ? Number(raw.score) : undefined,
    completed: raw.completed ?? false,
  });

  const normalizeExternalCounselor = (raw: any): ExternalCounselor => ({
    id: raw.id.toString(),
    name: raw.name,
    email: raw.email ?? undefined,
    phone: raw.phone ?? undefined,
    organization: raw.organization ?? undefined,
    notes: raw.notes ?? undefined,
  });

  const patchCounselingRequest = async (requestId: string, updates: Record<string, any>) => {
    if (!requestId || requestId.startsWith('REQ')) {
      return;
    }

    try {
      await apiFetch(`/counseling-requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error(`Unable to update counseling request ${requestId}`, error);
    }
  };


  const patchCaseReport = async (reportId: string, updates: Record<string, any>) => {
    if (!reportId) {
      return;
    }

    try {
      const response = await apiFetch(`/case-reports/${reportId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      return normalizeCaseReport(await response.json());
    } catch (error) {
      console.error(`Unable to update case report ${reportId}`, error);
      return undefined;
    }
  };

  const currentStudentId = authUser?.id ?? '';
  const currentCounselorId = authUser?.role === 'counselor'
    ? authUser.id
    : counselorSchedule.counselorId?.toString() ?? '';
  const currentCounselorName = authUser?.role === 'counselor'
    ? authUser.name
    : counselorSchedule.counselorName || 'University Counselor';

  const counselorPayload = () => {
    const counselorId = toNumericId(currentCounselorId);
    return counselorId ? { counselor_id: counselorId } : {};
  };

  // ─── Auth handlers ────────────────────────────────────────────────────────
  const handleLogin = async (email: string, password: string): Promise<string | null> => {
    setAuthTransitionState('signing-in');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase(), password }),
      });

      const contentType = response.headers.get('content-type') ?? '';
      const payload = contentType.includes('application/json')
        ? await response.json()
        : null;

      if (!response.ok) {
        if (response.status === 503 && payload?.message) {
          return payload.message;
        }
        return payload?.message || 'Invalid credentials. Please try again.';
      }

      if (!payload?.user || !payload?.token) {
        setAuthTransitionState('idle');
        return 'Unexpected login response. Is the backend running? Run start.ps1 from the project root.';
      }

      const user = payload.user;
      const token = payload.token;
      const authState = mapServerUserToAuthUser(user);
      setAuthToken(token ?? null);
      setAuthUser(authState);
      if (authState.role === 'counselor' && !user.schedule_setup_at) {
        setShowScheduleSetupModal(true);
      }
      localStorage.setItem('authToken', token ?? '');
      localStorage.setItem('authUser', JSON.stringify(authState));
      return null;
    } catch (error) {
      return 'Unable to reach backend. Run start.ps1 from the project root (starts API + database check + frontend).';
    } finally {
      setAuthTransitionState('idle');
    }
  };

  const handleShowLogin = (openRegister = false, reopenChat = false) => {
    setOpenRegisterOnLogin(openRegister);
    setShowLogin(true);
    if (reopenChat) {
      setOpenChatAfterLogin(true);
    }
  };

  const handleRegister = async (data: RegisterData): Promise<{ success: boolean; errors?: Record<string, string[]>; message?: string; code?: string }> => {
    const payload = {
      name: `${data.firstName} ${data.surname}`,
      email: data.email.toLowerCase(),
      phone: data.phone,
      location: data.location,
      gender: data.gender,
      program: data.program,
      level: data.level,
      password: data.password,
      password_confirmation: data.confirmPassword,
      has_ongoing_case: data.hasOngoingCase,
    };

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = await response.json();
        console.error('Register failed', errorPayload);
        return {
          success: false,
          errors: errorPayload.errors ?? undefined,
          message: errorPayload.message ?? 'Registration failed. Please review your input.',
          code: errorPayload.code ?? undefined,
        };
      }

      const userPayload = await response.json();
      console.log('Registration successful', userPayload);
      if (userPayload.token && userPayload.user) {
        const authState = mapServerUserToAuthUser(userPayload.user);
        setAuthToken(userPayload.token);
        setAuthUser(authState);
        localStorage.setItem('authToken', userPayload.token);
        localStorage.setItem('authUser', JSON.stringify(authState));
      }
      return { success: true };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        message: 'Unable to reach the backend. Please try again later.',
      };
    }
  };

  const refreshDashboardData = useCallback(async () => {
    if (!authToken || !authUser) {
      return;
    }

    try {
      const [requestsResponse, caseReportsResponse, scheduleResponse, sessionsResponse, counselorsResponse] = await Promise.all([
        apiFetch('/counseling-requests'),
        apiFetch('/case-reports'),
        apiFetch('/counselor-schedules'),
        apiFetch('/counseling-sessions'),
        apiFetch('/external-counselors'),
      ]);

      const requestsJson = await requestsResponse.json();
      const normalizedRequests = requestsJson.map(normalizeCounselingRequest);
      const scopedRequests = authUser.role === 'student'
        ? normalizedRequests.filter((request) => {
            const matchesId = request.studentId === authUser.id;
            const matchesEmail = request.studentEmail && authUser.email && request.studentEmail.toLowerCase() === authUser.email.toLowerCase();
            const matchesName = request.studentName && authUser.name && request.studentName.toLowerCase() === authUser.name.toLowerCase();
            return matchesId || matchesEmail || matchesName;
          })
        : normalizedRequests;
      setRequests(scopedRequests);

      const caseReportsJson = await caseReportsResponse.json();
      const normalizedReports: CaseReport[] = [];
      for (const rawReport of caseReportsJson) {
        try {
          normalizedReports.push(normalizeCaseReport(rawReport));
        } catch (error) {
          console.error('Skipping invalid case report payload', error, rawReport);
        }
      }
      setCaseReports(normalizedReports);

      const scheduleJson = await scheduleResponse.json();
      const matchingSchedule = scheduleJson.find((item: any) =>
        item.counselor_id?.toString() === currentCounselorId ||
        item.counselor_name === currentCounselorName
      );
      if (matchingSchedule) {
        setCounselorSchedule(normalizeSchedule(matchingSchedule));
        setShowScheduleSetupModal(false);
      } else {
        setCounselorSchedule(getDefaultCounselorSchedule(currentCounselorId, currentCounselorName));
        if (authUser.role === 'counselor' && !authUser.scheduleSetupAt) {
          setShowScheduleSetupModal(true);
        }
      }

      const sessionsJson = await sessionsResponse.json();
      setSessions(sessionsJson.map(normalizeCounselingSession));

      const counselorsJson = await counselorsResponse.json();
      setExternalCounselors(counselorsJson.map(normalizeExternalCounselor));
    } catch (error) {
      console.error('Unable to load backend data', error);
    }
  }, [authToken, authUser, currentCounselorId, currentCounselorName]);

  useEffect(() => {
    let isMounted = true;

    const refresh = async () => {
      if (!authToken || !authUser || !isMounted) {
        return;
      }
      await refreshDashboardData();
    };

    void refresh();

    const intervalId = window.setInterval(() => {
      void refresh();
    }, 5000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    };

    window.addEventListener('focus', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [authToken, authUser, refreshDashboardData]);

  const handleLogout = async () => {
    setAuthTransitionState('signing-out');

    try {
      if (authToken) {
        await apiFetch('/logout', { method: 'POST' });
      }
    } catch (error) {
      console.warn('Could not call logout endpoint', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      setAuthUser(null);
      setAuthToken(null);
      setRequests([]);
      setCaseReports([]);
      setShowProfile(false);
      setAuthTransitionState('idle');
    }
  };

  const openProfile = () => {
    if (!authUser) return;
    setProfileForm({
      name: authUser.name || '',
      email: authUser.email || '',
      phone: authUser.phone || '',
      location: authUser.location || '',
      gender: authUser.gender || '',
      program: authUser.program || '',
      level: authUser.level || '',
      emergencyContact: authUser.emergencyContact || '',
    });
    setProfileSaveError(null);
    setProfileSaveSuccess(null);
    setIsEditingProfile(false);
    setShowProfile(true);
  };

  const closeProfile = () => {
    setShowProfile(false);
    setIsEditingProfile(false);
    setProfileSaveError(null);
    setProfileSaveSuccess(null);
  };

  const handleSaveProfile = async () => {
    if (!authUser) return;
    setProfileSaveError(null);
    setProfileSaveSuccess(null);
    setIsSavingProfile(true);

    const payload = {
      name: profileForm.name.trim(),
      email: profileForm.email.trim().toLowerCase(),
      phone: profileForm.phone.trim(),
      location: profileForm.location,
      gender: profileForm.gender.trim(),
      program: profileForm.program.trim(),
      level: profileForm.level.trim(),
      emergency_contact: profileForm.emergencyContact.trim(),
    };

    try {
      const response = await apiFetch(`/users/${authUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      const updatedUser = await response.json();
      const updatedAuthUser = mapServerUserToAuthUser(updatedUser);
      setAuthUser(updatedAuthUser);
      localStorage.setItem('authUser', JSON.stringify(updatedAuthUser));
      setProfileSaveSuccess('Profile updated successfully.');
      setIsEditingProfile(false);
    } catch (error: any) {
      setProfileSaveError(error?.message || 'Unable to save profile.');
      console.error('Profile save failed', error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ─── Counseling handlers ──────────────────────────────────────────────────
  const handleRequestSession = async (newRequest: Omit<CounselingRequest, 'id' | 'status' | 'createdAt'>) => {
    const categorization = newRequest.category
      ? {
          category: newRequest.category,
          urgency: newRequest.urgencyLevel || 'medium',
          requiresImmediateAttention: newRequest.requiresImmediateAttention ?? false,
          matchedKeywords: newRequest.matchedKeywords ?? [],
        }
      : categorizeCounselingRequest(newRequest.concern);
    const availableSlots = getUpcomingAvailableSlots(counselorSchedule, requests);

    let status: CounselingRequest['status'] = 'pending_review';
    let autoScheduleProposal = newRequest.autoScheduleProposal;

    if (!autoScheduleProposal) {
      const autoSlot = autoScheduleAppointment(availableSlots, categorization.urgency, newRequest.preferredTime);
      if (autoSlot) {
        autoScheduleProposal = {
          proposedDate: autoSlot.date,
          proposedTime: autoSlot.time,
          studentApproved: false,
          counselorApproved: false,
        };
      }
    }

    if (autoScheduleProposal) {
      status = autoScheduleProposal.studentApproved && !autoScheduleProposal.counselorApproved
        ? 'student_approved'
        : 'pending_approval';

      if (categorization.urgency === 'critical' || categorization.urgency === 'immediate') {
        const urgentSlot = {
          date: autoScheduleProposal.proposedDate,
          time: autoScheduleProposal.proposedTime,
          priority: 0,
        };
        const existingAppointments = requests
          .filter(r => r.scheduledDate && r.scheduledTime)
          .map(r => ({
            id: r.id,
            date: r.scheduledDate!,
            time: r.scheduledTime!,
            urgency: r.urgencyLevel,
          }));

        const rescheduledMap = rescheduleForUrgent(urgentSlot, existingAppointments, availableSlots);

        if (rescheduledMap.size > 0) {
          setRequests(prevRequests =>
            prevRequests.map(r => {
              const newSlot = rescheduledMap.get(r.id);
              if (newSlot) {
                const updatedRequest = {
                  ...r,
                  scheduledDate: newSlot.date,
                  scheduledTime: newSlot.time,
                  status: 'pending_approval' as const,
                  autoScheduleProposal: {
                    proposedDate: newSlot.date,
                    proposedTime: newSlot.time,
                    studentApproved: false,
                    counselorApproved: false,
                  },
                };

                patchCounselingRequest(r.id, {
                  scheduled_date: newSlot.date.toISOString().split('T')[0],
                  scheduled_time: newSlot.time,
                  status: 'pending_approval',
                });

                return updatedRequest;
              }
              return r;
            })
          );
        }
      }
    }

    const payload = {
      student_id: toNumericId(authUser?.id ?? newRequest.studentId),
      concern: newRequest.concern,
      category: categorization.category,
      urgency_level: categorization.urgency,
      preferred_time: newRequest.preferredTime,
      status,
      requires_immediate_attention: categorization.requiresImmediateAttention,
      matched_keywords: categorization.matchedKeywords,
      proposed_date: autoScheduleProposal?.proposedDate?.toISOString().split('T')[0],
      proposed_time: autoScheduleProposal?.proposedTime,
      student_approved: autoScheduleProposal?.studentApproved,
      counselor_approved: autoScheduleProposal?.counselorApproved,
      counselor_id: toNumericId(newRequest.counselorId),
      total_sessions: newRequest.totalSessions,
    };

    try {
      const response = await apiFetch('/counseling-requests', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const createdRequest = normalizeCounselingRequest(await response.json());
      setRequests(prev => [...prev, createdRequest]);
    } catch (error) {
      console.error('Unable to submit counseling request', error);
      const request: CounselingRequest = {
        ...newRequest,
        id: `REQ${String(requests.length + 1).padStart(3, '0')}`,
        status,
        createdAt: new Date(),
        category: categorization.category,
        urgencyLevel: categorization.urgency,
        requiresImmediateAttention: categorization.requiresImmediateAttention,
        matchedKeywords: categorization.matchedKeywords,
        autoScheduleProposal,
        availableSlots: availableSlots.map(s => ({ date: s.date, time: s.time })),
      };
      setRequests(prev => [...prev, request]);
    }
  };

  const handleApproveSchedule = async (requestId: string, approver: 'student' | 'counselor') => {
    setRequests(prevRequests => prevRequests.map((r) => {
      if (r.id !== requestId || !r.autoScheduleProposal) return r;

      const proposal = { ...r.autoScheduleProposal };
      if (approver === 'student') {
        proposal.studentApproved = true;
      } else {
        proposal.counselorApproved = true;
      }

      const bothApproved = proposal.studentApproved && proposal.counselorApproved;
      const nextStatus = bothApproved ? 'scheduled' as const : (approver === 'student' ? 'student_approved' as const : 'counselor_approved' as const);
      const updatedRequest = {
        ...r,
        status: nextStatus,
        autoScheduleProposal: proposal,
        ...(bothApproved ? {
          scheduledDate: proposal.proposedDate,
          scheduledTime: proposal.proposedTime,
          counselorId: currentCounselorId,
          counselorName: currentCounselorName,
          totalSessions: (r.urgencyLevel === 'critical' || r.urgencyLevel === 'immediate' ? 8 : 6) as 6 | 8,
          completedSessions: 0,
        } : {}),
      };

      patchCounselingRequest(requestId, {
        status: updatedRequest.status,
        proposed_date: proposal.proposedDate?.toISOString().split('T')[0],
        proposed_time: proposal.proposedTime,
        student_approved: proposal.studentApproved,
        counselor_approved: proposal.counselorApproved,
        ...(bothApproved ? {
          scheduled_date: proposal.proposedDate?.toISOString().split('T')[0],
          scheduled_time: proposal.proposedTime,
          ...counselorPayload(),
          total_sessions: updatedRequest.totalSessions,
          completed_sessions: updatedRequest.completedSessions,
        } : {}),
      });

      return updatedRequest;
    }));
  };

  const handleRejectSchedule = async (requestId: string, rejector: 'student' | 'counselor') => {
    setRequests(prevRequests => prevRequests.map((r) => {
      if (r.id !== requestId || !r.autoScheduleProposal) return r;

      const proposal = { ...r.autoScheduleProposal };
      if (rejector === 'student') {
        proposal.studentRejectedAt = new Date();
      } else {
        proposal.counselorRejectedAt = new Date();
      }

      patchCounselingRequest(requestId, {
        status: 'approval_rejected',
        proposed_date: null,
        proposed_time: null,
        student_approved: false,
        counselor_approved: false,
        student_rejected_at: proposal.studentRejectedAt?.toISOString(),
        counselor_rejected_at: proposal.counselorRejectedAt?.toISOString(),
      });

      return {
        ...r,
        status: 'approval_rejected' as const,
        autoScheduleProposal: undefined,
      };
    }));
  };

  const handleManualSchedule = async (
    requestId: string,
    selectedDate: Date,
    selectedTime: string,
    proposer: 'student' | 'counselor'
  ) => {
    setRequests(prevRequests => prevRequests.map((r) => {
      if (r.id !== requestId) return r;

      const newProposal = {
        proposedDate: selectedDate,
        proposedTime: selectedTime,
        studentApproved: proposer === 'student',
        counselorApproved: proposer === 'counselor',
      };

      patchCounselingRequest(requestId, {
        status: 'pending_approval',
        proposed_date: selectedDate.toISOString().split('T')[0],
        proposed_time: selectedTime,
        student_approved: newProposal.studentApproved,
        counselor_approved: newProposal.counselorApproved,
      });

      return {
        ...r,
        status: 'pending_approval' as const,
        autoScheduleProposal: newProposal,
      };
    }));
  };

  const handleAcceptSchedule = async (requestId: string) => {
    setRequests(prevRequests => prevRequests.map((r) => {
      if (r.id !== requestId) return r;
      patchCounselingRequest(requestId, { status: 'in_progress' });
      return { ...r, status: 'in_progress' };
    }));
  };

  const handleScheduleRequest = async (requestId: string, scheduledDate: Date, scheduledTime: string, totalSessions: 6 | 8) => {
    setRequests(prevRequests => prevRequests.map((r) => {
      if (r.id !== requestId) return r;
      patchCounselingRequest(requestId, {
        status: 'scheduled',
        ...counselorPayload(),
        scheduled_date: scheduledDate.toISOString().split('T')[0],
        scheduled_time: scheduledTime,
        total_sessions: totalSessions,
        completed_sessions: 0,
      });
      return {
        ...r,
        status: 'scheduled',
        counselorId: currentCounselorId || undefined,
        counselorName: currentCounselorName,
        scheduledDate,
        scheduledTime,
        totalSessions,
        completedSessions: 0,
      };
    }));
  };

  const handleRejectRequest = async (requestId: string) => {
    setRequests(prevRequests => prevRequests.map((r) => {
      if (r.id !== requestId) return r;
      patchCounselingRequest(requestId, { status: 'rejected' });
      return { ...r, status: 'rejected' };
    }));
  };

  const handleDismissCase = async (requestId: string, reason: string) => {
    setRequests(prevRequests => prevRequests.map((r) => {
      if (r.id !== requestId) return r;
      patchCounselingRequest(requestId, {
        status: 'rejected',
        referral_reason: reason,
      });
      return { ...r, status: 'rejected', referralReason: reason };
    }));
  };

  const handleUpdateProgress = async (requestId: string, completedSessions: number, notes: string, score: number) => {
    const currentRequest = requests.find((request) => request.id === requestId);

    try {
      const response = await apiFetch(`/counseling-requests/${requestId}/log-session`, {
        method: 'POST',
        body: JSON.stringify({
          notes,
          score,
          completed_sessions: completedSessions,
        }),
      });
      const updated = normalizeCounselingRequest(await response.json());
      setRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));

      const sessionsResponse = await apiFetch('/counseling-sessions');
      const sessionsJson = await sessionsResponse.json();
      setSessions(sessionsJson.map(normalizeCounselingSession));

      if (
        currentRequest &&
        currentRequest.totalSessions &&
        completedSessions < currentRequest.totalSessions &&
        currentRequest.scheduledDate &&
        currentRequest.scheduledTime &&
        counselorSchedule.availableSlots.length
      ) {
        const nextSlot = getNextAvailableSlotAfter(
          counselorSchedule,
          requests.filter((request) => request.id !== requestId),
          currentRequest.scheduledDate,
          currentRequest.scheduledTime,
          requestId
        );

        if (nextSlot) {
          await patchCounselingRequest(requestId, {
            status: 'scheduled',
            scheduled_date: nextSlot.date.toISOString().split('T')[0],
            scheduled_time: nextSlot.time,
          });

          setRequests((prev) => prev.map((request) => {
            if (request.id !== requestId) return request;
            return {
              ...request,
              status: 'scheduled',
              scheduledDate: nextSlot.date,
              scheduledTime: nextSlot.time,
            };
          }));
        }
      }
    } catch (error) {
      console.error('Unable to log session', error);
      setRequests((prevRequests) => prevRequests.map((r) => {
        if (r.id !== requestId) return r;
        const nextNotes = [...(r.sessionNotes || []), `[Score: ${score}/100] ${notes}`];
        const nextScores = [...(r.sessionScores || []), score];
        const overall = nextScores.reduce((a, b) => a + b, 0) / nextScores.length;
        return {
          ...r,
          status: 'in_progress' as const,
          completedSessions,
          sessionNotes: nextNotes,
          sessionScores: nextScores,
          overallScore: overall,
        };
      }));
    }
  };

  const handleCompleteWithRecommendations = async (requestId: string, recommendations: string) => {
    setRequests(prevRequests => prevRequests.map((r) => {
      if (r.id !== requestId) return r;
      patchCounselingRequest(requestId, {
        status: 'completed',
        recommendations,
      });
      return { ...r, status: 'completed', recommendations };
    }));
  };

  const handleAddExternalRecord = async (requestId: string, notes: string, sessionNumber?: number) => {
    try {
      const response = await apiFetch(`/counseling-requests/${requestId}/external-records`, {
        method: 'POST',
        body: JSON.stringify({ notes, session_number: sessionNumber }),
      });
      const updated = normalizeCounselingRequest(await response.json());
      setRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
    } catch (error) {
      console.error('Unable to save external record', error);
    }
  };

  const handleReferExternal = async (requestId: string, reason: string, externalInfo: string, externalCounselorId?: string) => {
    setRequests(prevRequests => prevRequests.map((r) => {
      if (r.id !== requestId) return r;
      patchCounselingRequest(requestId, {
        status: 'referred',
        referral_reason: reason,
        external_counselor_id: externalCounselorId ? Number(externalCounselorId) : null,
      });
      return {
        ...r,
        status: 'referred',
        referralReason: reason,
        externalCounselorInfo: externalInfo,
        externalCounselorId,
      };
    }));
  };

  // ─── Case report handlers ─────────────────────────────────────────────────
  const handleSubmitCaseReport = async (report: Omit<CaseReport, 'id' | 'status' | 'createdAt'>): Promise<CaseReport | void> => {
    const categorization = categorizeCaseReport(report.description);

    // Build multipart FormData to support evidence file uploads
    const formData = new FormData();
    formData.append('category', report.category);
    if (report.subCategory) formData.append('sub_category', report.subCategory);
    formData.append('detailed_category', categorization.category);
    formData.append('description', report.description);
    formData.append('status', 'submitted');
    // Allow the client to override detected urgency/priority
    const effectiveUrgency = (report as any).urgencyLevel || categorization.urgency;
    formData.append('urgency_level', effectiveUrgency);
    if ((report as any).subject) formData.append('subject', (report as any).subject);
    formData.append('requires_location_sharing', String(categorization.requiresLocationSharing));
    const studentNumId = toNumericId(authUser?.id ?? report.studentId);
    if (studentNumId) formData.append('student_id', String(studentNumId));
    if (report.reportedByType) formData.append('reported_by_type', report.reportedByType);
    if (report.department) formData.append('department', report.department);
    if (report.yearOfStudy) formData.append('year_of_study', report.yearOfStudy);
    const incidentDate = parseIncidentDate(report.incidentDate);
    if (incidentDate) formData.append('incident_date', incidentDate);
    if (report.incidentLocation) formData.append('incident_location', report.incidentLocation);
    if (categorization.matchedKeywords?.length) {
      categorization.matchedKeywords.forEach((kw: string) => formData.append('matched_keywords[]', kw));
    }
    const loc = serializeLocation(report.location);
    if (loc) formData.append('location', JSON.stringify(loc));
    // Attach File objects passed through evidenceFiles
    if (report.evidenceFiles) {
      (report.evidenceFiles as unknown as File[]).forEach((file) => {
        formData.append('evidence_files[]', file);
      });
    }

    try {
      const response = await fetch('/api/case-reports', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Submission failed');
      }
      const createdReport = normalizeCaseReport(await response.json());
      setCaseReports(prev => [...prev, createdReport]);
      return createdReport;
    } catch (error) {
      console.error('Unable to submit case report', error);
      const newReport: CaseReport = {
        ...report,
        id: `CR${String(caseReports.length + 1).padStart(3, '0')}`,
        status: 'submitted',
        workflowStage: 'at_iic',
        assignedRole: 'iic',
        createdAt: new Date(),
        detailedCategory: categorization.category,
        urgencyLevel: categorization.urgency,
        requiresLocationSharing: categorization.requiresLocationSharing,
        matchedKeywords: categorization.matchedKeywords,
      };
      setCaseReports(prev => [...prev, newReport]);
      return newReport;
    }
  };

  const handleSaveCounselorSchedule = async (schedule: CounselorSchedule & { id?: number }) => {
    setCounselorSchedule(schedule);

    const payload: Record<string, any> = {
      counselor_id: toNumericId(schedule.counselorId) ?? toNumericId(authUser?.id),
      week_start_date: schedule.weekStartDate.toISOString().split('T')[0],
      week_end_date: schedule.weekEndDate.toISOString().split('T')[0],
    };

    try {
      const fullPayload = {
        ...payload,
        available_slots: schedule.availableSlots,
      };

      if (schedule.id) {
        const response = await apiFetch(`/counselor-schedules/${schedule.id}`, {
          method: 'PATCH',
          body: JSON.stringify(fullPayload),
        });
        setCounselorSchedule(normalizeSchedule(await response.json()));
      } else {
        const response = await apiFetch('/counselor-schedules', {
          method: 'POST',
          body: JSON.stringify(fullPayload),
        });
        setCounselorSchedule(normalizeSchedule(await response.json()));
      }

      const meResponse = await apiFetch('/me');
      const me = await meResponse.json();
      if (authUser) {
        const updatedUser: AuthUser = {
          ...authUser,
          scheduleSetupAt: me.schedule_setup_at ?? new Date().toISOString(),
        };
        setAuthUser(updatedUser);
        localStorage.setItem('authUser', JSON.stringify(updatedUser));
      }
      setShowScheduleSetupModal(false);
    } catch (error) {
      console.error('Unable to save counselor schedule', error);
    }
  };

  const handleScheduleSetupComplete = () => {
    if (authUser?.scheduleSetupAt || counselorSchedule.id) {
      setShowScheduleSetupModal(false);
    }
  };

  const handleUpdateCaseReport = async (reportId: string, status: CaseStatus, responseNotes?: string) => {
    const updatedReport = await patchCaseReport(reportId, {
      status,
      response_notes: responseNotes,
      reviewed_at: new Date().toISOString(),
    });

    if (updatedReport) {
      setCaseReports((prevReports) => prevReports.map((r) => (r.id === reportId ? updatedReport! : r)));
    } else {
      setCaseReports((prevReports) => prevReports.map((r) =>
        r.id === reportId ? { ...r, status, responseNotes: responseNotes ?? r.responseNotes, reviewedAt: new Date() } : r
      ));
    }
  };

  const handleAcknowledgeCase = async (reportId: string) => {
    try {
      const response = await apiFetch(`/case-reports/${reportId}/workflow/acknowledge`, {
        method: 'POST',
      });
      const updatedReport = normalizeCaseReport(await response.json());
      setCaseReports((prev) => prev.map((r) => (r.id === reportId ? updatedReport : r)));
    } catch (error) {
      console.error(`Unable to acknowledge case report ${reportId}`, error);
      await handleUpdateCaseReport(reportId, 'acknowledged');
    }
  };

  const WORKFLOW_ENDPOINTS: Record<WorkflowAction, string> = {
    request_permission: 'request-permission',
    approve_permission: 'approve-permission',
    start_investigation: 'start-investigation',
    submit_findings: 'submit-findings',
    forward_to_disciplinary: 'forward-to-disciplinary',
    dismiss_case: 'dismiss-case',
    send_meeting_notice: 'send-meeting-notice',
    record_verdict: 'record-verdict',
  };

  const handleCaseWorkflowAction = async (
    reportId: string,
    action: WorkflowAction,
    payload: WorkflowActionPayload
  ) => {
    let requestBody: BodyInit | null = null;

    const needsForm = (payload.findingsFiles && payload.findingsFiles.length > 0) || (payload.meetingFiles && payload.meetingFiles.length > 0) || (payload.verdictFiles && payload.verdictFiles.length > 0);
    if (needsForm) {
      const formData = new FormData();
      if (payload.findingsReport) formData.append('findings_report', payload.findingsReport);
      (payload.findingsFiles || []).forEach((file) => {
        formData.append('findings_files[]', file);
      });
      if (payload.responseNotes) formData.append('response_notes', payload.responseNotes);
      if (payload.meetingNotice) formData.append('meeting_notice', payload.meetingNotice);
      if (payload.meetingDate) formData.append('meeting_date', payload.meetingDate);
      if (payload.verdict) formData.append('verdict', payload.verdict);
      if (payload.permissionRequest) formData.append('permission_request', payload.permissionRequest);
      (payload.meetingFiles || []).forEach((file) => { formData.append('meeting_files[]', file); });
      (payload.verdictFiles || []).forEach((file) => { formData.append('verdict_files[]', file); });
      if (payload.meetingEmails) formData.append('meeting_emails', JSON.stringify(payload.meetingEmails));
      if (payload.verdictEmails) formData.append('verdict_emails', JSON.stringify(payload.verdictEmails));
      requestBody = formData;
    } else {
      const body: Record<string, string> = {};
      if (payload.permissionRequest) body.permission_request = payload.permissionRequest;
      if (payload.findingsReport) body.findings_report = payload.findingsReport;
      if (payload.meetingNotice) body.meeting_notice = payload.meetingNotice;
      if (payload.meetingDate) body.meeting_date = payload.meetingDate;
      if (payload.verdict) body.verdict = payload.verdict;
      const noteText = payload.responseNotes ?? payload.reason;
      if (noteText) {
        body.response_notes = noteText;
        body.reason = noteText;
      }
      if (payload.meetingEmails) body.meeting_emails = JSON.stringify(payload.meetingEmails);
      if (payload.verdictEmails) body.verdict_emails = JSON.stringify(payload.verdictEmails);
      requestBody = JSON.stringify(body);
    }

    try {
      const response = await apiFetch(
        `/case-reports/${reportId}/workflow/${WORKFLOW_ENDPOINTS[action]}`,
        { method: 'POST', body: requestBody }
      );
      const updatedReport = normalizeCaseReport(await response.json());
      setCaseReports((prev) => prev.map((r) => (r.id === reportId ? updatedReport : r)));
    } catch (error) {
      console.error(`Workflow action ${action} failed for case ${reportId}`, error);
      throw error;
    }
  };

  const handleAcceptExternalReferral = async (requestId: string) => {
    setRequests(prevRequests => prevRequests.map((r) => {
      if (r.id !== requestId) return r;
      patchCounselingRequest(requestId, { status: 'in_progress', completed_sessions: 0 });
      return { ...r, status: 'in_progress', completedSessions: 0 };
    }));
  };

  const showAuthTransitionOverlay = authTransitionState !== 'idle';

  // ─── Login screen with modal overlay ──────────────────────────────────────
  if (!authUser && !isRestoring) {
    return (
      <div className="relative">
        {showAuthTransitionOverlay && (
          <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex justify-center px-4 pt-4">
            <div className="rounded-full border border-white/40 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span>{authTransitionState === 'signing-out' ? 'Signing out...' : 'Signing in...'}</span>
              </div>
            </div>
          </div>
        )}
        <LandingPage
          chatbotOpen={showChatbot}
          onOpenChatbot={() => setShowChatbot(true)}
          onCloseChatbot={() => setShowChatbot(false)}
          onShowLogin={handleShowLogin}
          onShowRegister={() => setShowRegisterModal(true)}
          onReportCase={() => {
            setOpenRegisterOnLogin(false);
            setShowLogin(true);
          }}
          hideNavbar={showLogin}
        />
        <AnimatePresence>
          {showLogin && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[80vh] overflow-auto"
            >
                <button
                  onClick={() => { setShowLogin(false); setOpenRegisterOnLogin(false); }}
                  aria-label="Close login"
                  className="absolute top-3 right-3 z-50 w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent transition-colors"
                >
                  ✕
                </button>
                <LoginPage
                  onLogin={async (email, password) => {
                    const err = await handleLogin(email, password);
                    if (!err) {
                      setShowLogin(false);
                      setOpenRegisterOnLogin(false);
                      if (openChatAfterLogin) {
                        setShowChatbot(true);
                        setOpenChatAfterLogin(false);
                      }
                    }
                    return err;
                  }}
                  onRegister={handleRegister}
                  openRegister={openRegisterOnLogin}
                  onBack={() => { setShowLogin(false); setOpenRegisterOnLogin(false); }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showRegisterModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-auto relative"
              >
                <button
                  onClick={() => setShowRegisterModal(false)}
                  aria-label="Close register"
                  className="absolute top-3 right-3 z-50 w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent transition-colors"
                >
                  ✕
                </button>
                <RegisterModal
                  onClose={() => setShowRegisterModal(false)}
                  onSubmit={handleRegister}
                  onRegistered={() => setShowRegisterModal(false)}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // If we're still restoring session, show a neutral loader to avoid route flash
  if (isRestoring) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="rounded-md border border-border bg-white/80 px-6 py-4 text-sm font-medium text-muted-foreground shadow">Restoring session…</div>
      </div>
    );
  }

  // ─── Role header (staff roles) ────────────────────────────────────────────
  const roleLabels: Record<UserRole, string> = {
    student: 'Student Portal',
    counselor: 'Counselor Dashboard',
    dean: 'Dean of Students',
    iic: 'IIC Dashboard',
    investigator: 'Investigator Dashboard',
    registrar: "Registrar's Office",
    disciplinary_committee: 'Disciplinary Committee',
    external_counselor: 'External Counselor Portal',
    system_administrator: 'System Administration',
  };

  if (authUser.role === 'student') {
    return (
      <StudentDashboard
        studentId={authUser.id}
        userName={authUser.name}
        studentEmail={authUser.email}
        requests={requests}
        allCounselingRequests={requests}
        counselorSchedule={counselorSchedule}
        caseReports={caseReports}
        initialPage="home"
        onRequestSession={handleRequestSession}
        onApproveSchedule={(id) => handleApproveSchedule(id, 'student')}
        onRejectSchedule={(id) => handleRejectSchedule(id, 'student')}
        onManualSchedule={(id, date, time) => handleManualSchedule(id, date, time, 'student')}
        onAcceptSchedule={handleAcceptSchedule}
        onSubmitCaseReport={handleSubmitCaseReport}
        onSaveProfile={handleSaveProfile}
        onLogout={handleLogout}
        showCaseReportModal={showCaseReportModal}
        onCloseCaseReportModal={() => setShowCaseReportModal(false)}
      />
    );
  }

  const linkedExternalCounselor = externalCounselors.find(
    (counselor) => counselor.email?.toLowerCase() === authUser.email.toLowerCase()
  );

  const routeForReport = (report: CaseReport) => {
    const assignedRole = String(report.assignedRole ?? '').toLowerCase();
    const category = String(report.detailedCategory || report.category || '').toLowerCase();
    if (assignedRole === 'registrar' && ['financial_aid', 'housing'].includes(category)) return 'dean';
    if (assignedRole === 'iic' || assignedRole === 'investigator') return 'iic';
    if (assignedRole === 'dean') return 'dean';
    if (assignedRole === 'registrar') return 'registrar';
    if (assignedRole === 'disciplinary_committee') return 'disciplinary';
    return getCaseReportRouting((report.detailedCategory as CaseCategory) || (report.category as CaseCategory) || 'general');
  };

  const iicReports = caseReports.filter((report) => routeForReport(report) === 'iic');

  const registrarWorkflowReports = caseReports.filter((r) => {
    const isActiveRegistrarWorkflow =
      r.workflowStage === 'permission_pending' ||
      r.workflowStage === 'permission_approved' ||
      r.workflowStage === 'investigation' ||
      r.workflowStage === 'findings_with_registrar';

    const isRegistrarDecisionCase =
      r.workflowStage === 'with_disciplinary' ||
      r.workflowStage === 'closed' ||
      r.status === 'referred_to_disciplinary_hearing' ||
      r.status === 'closed' ||
      r.registrarAction === 'referred' ||
      r.registrarAction === 'dismissed';

    return isActiveRegistrarWorkflow || isRegistrarDecisionCase;
  });

  const registrarFeesReports = caseReports.filter(
    (report) =>
      report.category === 'general' &&
      (routeForReport(report) === 'registrar' ||
        report.subCategory === 'fees_support' ||
        report.subCategory === 'living_expenses')
  );

  const disciplinaryWorkflowReports = caseReports.filter((r) => {
    const isDisciplinaryWorkflow =
      r.workflowStage === 'with_disciplinary' ||
      r.workflowStage === 'meeting_notice_sent' ||
      r.status === 'referred_to_disciplinary_hearing';

    return isDisciplinaryWorkflow || (r.workflowStage === 'closed' && routeForReport(r) === 'disciplinary');
  });

  const deanReports = caseReports.filter(
    (report) => routeForReport(report) === 'dean'
  );

  const externalReferrals = requests.filter(
    (request) =>
      linkedExternalCounselor &&
      request.externalCounselorId === linkedExternalCounselor.id &&
      ['referred', 'in_progress', 'completed'].includes(request.status)
  );

  // Staff roles render their dashboards
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {showAuthTransitionOverlay && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex justify-center px-4 pt-4">
          <div className="rounded-full border border-white/40 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>{authTransitionState === 'signing-out' ? 'Signing out...' : 'Signing in...'}</span>
            </div>
          </div>
        </div>
      )}
      {authUser.role === 'counselor' && (
        <CounselorDashboard
          counselorId={currentCounselorId}
          counselorName={currentCounselorName}
          counselorEmail={authUser.email}
          counselorPhone={authUser.phone}
          requests={requests}
          currentSchedule={counselorSchedule}
          sessions={sessions}
          externalCounselors={externalCounselors}
          onScheduleRequest={handleScheduleRequest}
          onApproveSchedule={(id) => handleApproveSchedule(id, 'counselor')}
          onRejectSchedule={(id) => handleRejectSchedule(id, 'counselor')}
          onManualSchedule={(id, date, time) => handleManualSchedule(id, date, time, 'counselor')}
          onRejectRequest={handleRejectRequest}
          onUpdateProgress={handleUpdateProgress}
          onCompleteWithRecommendations={handleCompleteWithRecommendations}
          onReferExternal={handleReferExternal}
          onDismissCase={handleDismissCase}
          onSaveSchedule={handleSaveCounselorSchedule}
          onExport={downloadReport}
          showScheduleSetupModal={showScheduleSetupModal && !authUser.scheduleSetupAt && !counselorSchedule.id}
          onScheduleSetupComplete={handleScheduleSetupComplete}
          onLogout={handleLogout}
        />
      )}

      {authUser.role === 'dean' && (
        <DeanDashboard
          reports={deanReports}
          onUpdateReport={handleUpdateCaseReport}
        />
      )}

      {(authUser.role === 'iic' || authUser.role === 'investigator') && (
        <DashboardErrorBoundary>
          <IICDashboard
            reports={iicReports}
            onWorkflowAction={handleCaseWorkflowAction}
            onAcknowledgeCase={handleAcknowledgeCase}
            onExport={downloadReport}
            onLogout={handleLogout}
          />
        </DashboardErrorBoundary>
      )}

      {authUser.role === 'disciplinary_committee' && (
        <DisciplinaryDashboard
          reports={disciplinaryWorkflowReports}
          onWorkflowAction={handleCaseWorkflowAction}
          onExport={downloadReport}
          onLogout={handleLogout}
        />
      )}

      {authUser.role === 'registrar' && (
        <RegistrarDashboard
          workflowReports={registrarWorkflowReports}
          feesReports={registrarFeesReports}
          onWorkflowAction={handleCaseWorkflowAction}
          onUpdateFeesReport={handleUpdateCaseReport}
          onExport={downloadReport}
          onLogout={handleLogout}
        />
      )}

      {authUser.role === 'external_counselor' && (
        <ExternalCounselorDashboard
          counselorName={authUser.name}
          referrals={externalReferrals}
          onAcceptReferral={handleAcceptExternalReferral}
          onCompleteReferral={handleCompleteWithRecommendations}
          onAddExternalRecord={handleAddExternalRecord}
          onLogout={handleLogout}
        />
      )}

      {authUser.role === 'system_administrator' && (
        <SystemAdministrator reports={caseReports} authUser={authUser} onExport={downloadReport} onLogout={handleLogout} />
      )}
    </div>
  );
}
