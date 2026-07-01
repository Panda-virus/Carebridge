export type UserRole =
  | 'student'
  | 'counselor'
  | 'dean'
  | 'iic'
  | 'investigator'
  | 'registrar'
  | 'disciplinary_committee'
  | 'external_counselor'
  | 'system_administrator';

export type SessionStatus =
  | 'pending_review'        // Student submitted, waiting for auto-schedule
  | 'pending_approval'      // Auto-scheduled, waiting for both parties approval
  | 'student_approved'      // Student approved, waiting for counselor
  | 'counselor_approved'    // Counselor approved, waiting for student
  | 'approval_rejected'     // One party rejected, need manual scheduling
  | 'scheduled'             // Both approved, confirmed
  | 'in_progress'           // Sessions ongoing
  | 'completed'             // All sessions done, recommendations added
  | 'referred'              // Referred to external counselor
  | 'rejected';             // Counselor rejected the request

export type CounselingCategory =
  | 'depression'
  | 'anxiety'
  | 'ptsd'
  | 'addiction'
  | 'relationship'
  | 'academic_stress'
  | 'grief'
  | 'self_harm'
  | 'suicide'
  | 'eating_disorder'
  | 'general';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical' | 'immediate';

export interface ScheduleProposal {
  proposedDate: Date;
  proposedTime: string;
  studentApproved: boolean;
  counselorApproved: boolean;
  studentRejectedAt?: Date;
  counselorRejectedAt?: Date;
}

export interface CounselingRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  studentLocation?: string;
  concern: string;
  category?: CounselingCategory;
  urgencyLevel: UrgencyLevel;
  preferredTime: string;
  status: SessionStatus;
  createdAt: Date;
  requiresImmediateAttention?: boolean;
  matchedKeywords?: string[];

  // Auto-scheduling
  autoScheduleProposal?: ScheduleProposal;
  availableSlots?: Array<{ date: Date; time: string }>;

  // Counselor response
  counselorId?: string;
  counselorName?: string;
  scheduledDate?: Date;
  scheduledTime?: string;
  totalSessions?: 6 | 8;

  // Progress tracking
  completedSessions?: number;
  sessionNotes?: string[];
  sessionScores?: number[];
  overallScore?: number;
  externalSessionRecords?: Array<{
    session_number: number;
    notes: string;
    recorded_at: string;
    recorded_by?: string;
  }>;

  // Completion
  recommendations?: string;
  referralReason?: string;
  externalCounselorInfo?: string;
  externalCounselorId?: string;
}

export type CaseCategory =
  | 'general'
  | 'sexual_harassment_gbv'
  | 'financial_aid'
  | 'sexual_harassment'
  | 'gbv'
  | 'sexual_assault'
  | 'physical_assault'
  | 'stalking'
  | 'cyberbullying'
  | 'academic_misconduct'
  | 'discrimination'
  | 'health_services'
  | 'housing'
  | 'substance_abuse'
  | 'mental_health'
  | 'relationship_violence';
export type GeneralSubCategory = 'fees_support' | 'living_expenses' | 'others';
export type CaseStatus =
  | 'submitted'
  | 'acknowledged'
  | 'preliminary_review'
  | 'ongoing_investigation'
  | 'investigation_complete'
  | 'findings_under_review'
  | 'referred_to_disciplinary_hearing'
  | 'awaiting_disciplinary_hearing'
  | 'under_review'
  | 'verdict_served'
  | 'appealed';

export type CaseWorkflowStage =
  | 'at_iic'
  | 'permission_pending'
  | 'permission_approved'
  | 'investigation'
  | 'findings_with_registrar'
  | 'with_disciplinary'
  | 'meeting_notice_sent'
  | 'closed';

export type DetailedCaseCategory =
  | 'financial_aid'
  | 'sexual_harassment'
  | 'gbv'
  | 'sexual_assault'
  | 'physical_assault'
  | 'stalking'
  | 'cyberbullying'
  | 'academic_misconduct'
  | 'discrimination'
  | 'health_services'
  | 'housing'
  | 'substance_abuse'
  | 'mental_health'
  | 'relationship_violence'
  | 'general';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
}

export interface CaseTimelineStage {
  stage: string;
  label: string;
  startedAt?: string;
  dueAt: string;
  completedAt?: string;
  assignedRole?: string;
  status: 'completed' | 'pending' | 'overdue';
  overdueBy?: string;
}

export interface CaseTimelineSummary {
  totalStages: number;
  completedStages: number;
  overdueStages: number;
  pendingStages: number;
  currentStage?: {
    stage: string;
    label: string;
    dueAt: string;
    assignedRole?: string;
  };
  stages: CaseTimelineStage[];
}

export interface CaseReport {
  id: string;
  subject?: string;
  ticketNumber?: string;
  category: CaseCategory;
  subCategory?: GeneralSubCategory;
  detailedCategory?: DetailedCaseCategory;
  description: string;
  status: CaseStatus;
  workflowStage?: CaseWorkflowStage;
  assignedRole?: UserRole;
  createdAt: Date;
  responseNotes?: string;
  reviewedAt?: Date;
  reviewedBy?: string;
  urgencyLevel?: UrgencyLevel;
  requiresLocationSharing?: boolean;
  location?: LocationData;
  matchedKeywords?: string[];
  isAnonymous?: boolean;

  // Workflow documents
  permissionRequest?: string;
  permissionApprovedAt?: Date;
  findingsReport?: string;
  meetingNotice?: string;
  meetingDate?: Date;
  verdict?: string;

  // Identity (required for all submissions)
  studentName?: string;
  studentId?: string;
  studentEmail?: string;
  studentPhone?: string;
  reportedByType?: 'victim' | 'witness' | 'friend' | 'other';
  reportedByName?: string;
  defendantName?: string;
  department?: string;
  yearOfStudy?: string;

  // GBV/SH incident details
  incidentDate?: string;
  incidentTime?: string;
  incidentLocation?: string;

  // Evidence attachments
  evidenceFiles?: Array<{
    name: string;
    size: number;
    mime: string;
    path: string;
    url: string;
  }>;
  findingsFiles?: Array<{
    name: string;
    size: number;
    mime: string;
    path: string;
    url: string;
  }>;
  registrarAction?: 'referred' | 'dismissed';
  registrarActionReason?: string;
  registrarCaseFile?: string;

  // Timeline
  timeline?: CaseTimelineSummary;
}

export interface CounselorSchedule {
  counselorId: string;
  counselorName: string;
  weekStartDate: Date;
  weekEndDate: Date;
  availableSlots: Array<{
    dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
    startTime: string;
    endTime: string;
    slotDuration: number; // in minutes
  }>;
  createdAt: Date;
}

export interface CounselingSession {
  id: string;
  requestId: string;
  sessionNumber: number;
  date: Date;
  notes?: string;
  score?: number;
  completed?: boolean;
}

export interface ExternalCounselor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  organization?: string;
  notes?: string;
}
