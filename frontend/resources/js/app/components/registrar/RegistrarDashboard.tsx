import React, { useState } from 'react';
import {
  GraduationCap,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  BookOpen,
  Calendar,
  Send,
  FileText,
  XCircle,
  Scale,
  LogOut,
} from 'lucide-react';
import { CaseReport, CaseStatus, GeneralSubCategory, UserRole } from '../../types';
import { WorkflowAction, WORKFLOW_STAGE_LABELS } from '../../utils/caseWorkflow';
import { WorkflowActionPayload } from '../cases/CaseWorkflowPanel';

interface RegistrarDashboardProps {
  workflowReports: CaseReport[];
  feesReports: CaseReport[];
  onWorkflowAction: (reportId: string, action: WorkflowAction, payload: WorkflowActionPayload) => void;
  onUpdateFeesReport: (reportId: string, status: CaseStatus, responseNotes?: string) => void;
  onLogout?: () => void;
}

const SUB_CATEGORY_LABELS: Record<GeneralSubCategory, string> = {
  fees_support: 'Fees Support',
  living_expenses: 'Living Expenses',
  others: 'Others',
};

const STATUS_CONFIG: Record<CaseStatus, { label: string; color: string; icon: React.ReactNode }> = {
  submitted: { label: 'Submitted', color: 'bg-info/10 text-info border-info/20', icon: <Clock className="w-3.5 h-3.5" /> },
  under_review: { label: 'Under Review', color: 'bg-warning/10 text-warning-foreground border-warning/20', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  referred: { label: 'Referred', color: 'bg-info/10 text-info border-info/20', icon: <FileText className="w-3.5 h-3.5" /> },
  resolved: { label: 'Resolved', color: 'bg-success/10 text-success border-success/20', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  closed: { label: 'Closed', color: 'bg-muted text-muted-foreground border-border', icon: <XCircle className="w-3.5 h-3.5" /> },
};

function WorkflowCaseRow({
  report,
  onApprove,
  onWorkflowAction,
  onOpenNotesModal,
  savingId,
  forApprovedPage,
  forFindingsReview,
  forReferredPage,
  index,
}: {
  report: CaseReport;
  onApprove: (reportId: string) => void;
  onWorkflowAction: (reportId: string, action: any, payload?: any) => void;
  onOpenNotesModal?: (reportId: string, action: 'forward_to_disciplinary' | 'dismiss_case', required?: boolean) => void;
  savingId: string | null;
  forApprovedPage?: boolean;
  forFindingsReview?: boolean;
  forReferredPage?: boolean;
  index?: number;
}) {
  const isPending = report.workflowStage === 'permission_pending';
  const handler = report.reviewedBy ? `Registrar ${report.reviewedBy}` : 'Registrar';
  const title = report.subject ?? report.description;

  if (forFindingsReview) {
    return (
      <tr className="border-b border-border last:border-none hover:bg-accent/10 transition-colors">
        <td className="px-4 py-3 text-sm text-muted-foreground">{typeof index === 'number' ? index + 1 : '—'}</td>
        <td className="px-4 py-3 text-sm text-foreground font-medium">{report.ticketNumber ?? report.id}</td>
        <td className="px-4 py-3 text-sm text-foreground break-words line-clamp-2">{title}</td>
        <td className="px-4 py-3 text-sm text-foreground max-w-[40rem]">
          {report.findingsReport ? (
            <div className="whitespace-pre-wrap break-words">{report.findingsReport}</div>
          ) : (
            <div className="text-muted-foreground">No findings report submitted.</div>
          )}
          {Array.isArray(report.findingsFiles) && report.findingsFiles.length ? (
            <div className="mt-2 space-y-2">
              {report.findingsFiles.map((file) => {
                const downloadHref = file.path
                  ? `/api/case-reports/${report.id}/findings-file?file_path=${encodeURIComponent(file.path)}&file_name=${encodeURIComponent(file.name)}`
                  : file.url;
                return (
                  <a
                    key={file.path}
                    href={downloadHref}
                    download={file.name}
                    className="text-primary underline"
                  >
                    {file.name}
                  </a>
                );
              })}
            </div>
          ) : null}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-2">
            {report.registrarCaseFile && (
              <button
                type="button"
                onClick={() => window.alert(report.registrarCaseFile)}
                className="text-sm text-muted-foreground underline"
              >
                View Case File
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenNotesModal?.(report.id, 'forward_to_disciplinary', false)}
              disabled={savingId === report.id}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Refer
            </button>
            <button
              type="button"
              onClick={() => onOpenNotesModal?.(report.id, 'dismiss_case', true)}
              disabled={savingId === report.id}
              className="inline-flex items-center justify-center rounded-lg bg-destructive px-3 py-1.5 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Dismiss
            </button>
          </div>
        </td>
      </tr>
    );
  }

  if (forReferredPage) {
    return (
      <tr className="border-b border-border last:border-none hover:bg-accent/10 transition-colors">
        <td className="px-4 py-3 text-sm text-foreground font-medium">{report.ticketNumber ?? report.id}</td>
        <td className="px-4 py-3 text-sm text-foreground break-words line-clamp-2">{report.subject ?? report.description}</td>
        <td className="px-4 py-3 text-sm text-foreground">{report.registrarAction ?? report.status}</td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-2">
            {report.registrarCaseFile && (
              <button
                type="button"
                onClick={() => window.alert(report.registrarCaseFile)}
                className="text-sm text-muted-foreground underline"
              >
                View Case File
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  }

  if (forApprovedPage) {
    return (
      <tr className="border-b border-border last:border-none hover:bg-accent/10 transition-colors">
        <td className="px-4 py-3 text-sm text-foreground font-medium">{report.ticketNumber ?? report.id}</td>
        <td className="px-4 py-3 text-sm text-foreground break-words line-clamp-2">{title}</td>
        <td className="px-4 py-3 text-sm text-foreground">{handler}</td>
        <td className="px-4 py-3 text-sm text-foreground">
          <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
            Approved for Investigation
          </span>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border last:border-none hover:bg-accent/10 transition-colors">
      <td className="px-4 py-3 text-sm text-foreground font-medium">{report.ticketNumber ?? report.id}</td>
      <td className="px-4 py-3 text-sm text-foreground break-words">{title}</td>
      <td className="px-4 py-3 text-sm text-foreground break-words whitespace-pre-wrap max-w-[35rem]">
        {report.permissionRequest ?? 'No request submitted.'}
      </td>
      <td className="px-4 py-3 text-right">
        {isPending ? (
          <button
            type="button"
            onClick={() => onApprove(report.id)}
            disabled={savingId === report.id}
            className="inline-flex items-center justify-center rounded-lg bg-success px-4 py-2 text-sm font-semibold text-success-foreground transition-colors hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingId === report.id ? 'Approving…' : 'Approve'}
          </button>
        ) : (
          <span className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
            {WORKFLOW_STAGE_LABELS[report.workflowStage ?? 'permission_pending']}
          </span>
        )}
      </td>
    </tr>
  );
}

function FeesCaseCard({
  report,
  onUpdate,
}: {
  report: CaseReport;
  onUpdate: (id: string, status: CaseStatus, notes?: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [responseText, setResponseText] = useState(report.responseNotes || '');
  const [selectedStatus, setSelectedStatus] = useState<CaseStatus>(report.status);
  const [saving, setSaving] = useState(false);
  const statusCfg = STATUS_CONFIG[report.status];

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button className="w-full text-left p-5 flex items-start justify-between gap-4 hover:bg-accent/10 transition-colors" onClick={() => setExpanded((v) => !v)}>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${statusCfg.color}`}>
              {statusCfg.icon}{statusCfg.label}
            </span>
            {report.subCategory && (
              <span className="text-xs bg-accent/20 text-accent-foreground px-2 py-0.5 rounded-full">
                {SUB_CATEGORY_LABELS[report.subCategory]}
              </span>
            )}
          </div>
          <p className="text-sm text-foreground line-clamp-2">{report.description}</p>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />}
      </button>
      {expanded && (
        <div className="border-t border-border p-5 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><User className="w-3 h-3" /> Name</p>
              <p className="text-sm font-medium">{report.studentName || '—'}</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
              <p className="text-sm font-medium truncate">{report.studentEmail || '—'}</p>
            </div>
          </div>
          <textarea rows={3} value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder="Registrar response..." className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-sm resize-none" />
          <div className="flex items-center gap-3">
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as CaseStatus)} className="px-3 py-2 rounded-lg border border-border text-sm">
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <button onClick={() => { setSaving(true); onUpdate(report.id, selectedStatus, responseText); setSaving(false); }} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
              <Send className="w-4 h-4" />{saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function RegistrarDashboard({
  workflowReports,
  feesReports,
  onWorkflowAction,
  onUpdateFeesReport,
  onLogout,
}: RegistrarDashboardProps) {
  const [workflowTab, setWorkflowTab] = useState<'all' | 'permission_pending' | 'investigation' | 'findings_with_registrar' | 'referred'>('permission_pending');
  const [verdictsTab, setVerdictsTab] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [modalReport, setModalReport] = useState<null | { report: CaseReport; action: 'forward_to_disciplinary' | 'dismiss_case'; required: boolean }>(null);
  const [modalNotes, setModalNotes] = useState('');
  const [modalSaving, setModalSaving] = useState(false);

  const permissionPending = workflowReports.filter((r) => r.workflowStage === 'permission_pending');
  const approvedCases = workflowReports.filter(
    (r) => r.workflowStage === 'permission_approved' || r.workflowStage === 'investigation'
  );
  const findingsPending = workflowReports.filter((r) => r.workflowStage === 'findings_with_registrar');
  const referredCases = workflowReports.filter((r) => r.registrarAction === 'referred' || r.workflowStage === 'with_disciplinary' || r.status === 'referred_to_disciplinary_hearing');
  const verdictCases = workflowReports.filter((r) => Boolean(r.verdict));
  const filteredWorkflowReports =
    workflowTab === 'all'
      ? workflowReports
      : workflowTab === 'investigation'
      ? workflowReports.filter((r) => r.workflowStage === 'permission_approved' || r.workflowStage === 'investigation')
      : workflowTab === 'referred'
      ? referredCases
      : workflowReports.filter((r) => r.workflowStage === workflowTab);

  const handleApprove = async (reportId: string) => {
    setSavingId(reportId);
    await onWorkflowAction(reportId, 'approve_permission', {});
    setSavingId(null);
  };

  const handleVerdictApprove = async (reportId: string) => {
    setSavingId(reportId);
    await onWorkflowAction(reportId, 'approve_verdict', {});
    setSavingId(null);
  };

  const handleTabChange = (nextTab: 'all' | 'permission_pending' | 'investigation' | 'findings_with_registrar' | 'referred') => {
    setWorkflowTab(nextTab);
    setVerdictsTab(false);
  };

  const openNotesModal = (reportId: string, action: 'forward_to_disciplinary' | 'dismiss_case', required = false) => {
    const report = workflowReports.find((r) => r.id === reportId);
    if (!report) return;
    setModalReport({ report, action, required });
    setModalNotes('');
    setShowNotesModal(true);
  };

  const handleConfirmModal = async () => {
    if (!modalReport) return;
    if (modalReport.required && !modalNotes.trim()) return;
    setModalSaving(true);
    setSavingId(modalReport.report.id);
    try {
      if (modalReport.action === 'forward_to_disciplinary') {
        await onWorkflowAction(modalReport.report.id, 'forward_to_disciplinary', { responseNotes: modalNotes });
      } else {
        await onWorkflowAction(modalReport.report.id, 'dismiss_case', { reason: modalNotes });
      }
    } catch (e) {
      // ignore — caller will handle
    }
    setModalSaving(false);
    setModalReport(null);
    setModalNotes('');
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-3 sm:px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">CareBridge</p>
              <p className="text-xs text-muted-foreground">Registrar Dashboard</p>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          )}
        </div>
      </nav>

      {showNotesModal && modalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl bg-card rounded-2xl border border-border p-6 mx-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{modalReport.action === 'dismiss_case' ? 'Dismiss Case' : 'Case File'}</h3>
                <p className="text-xs text-muted-foreground">Time: Case File <span className="font-medium">{modalReport.action === 'forward_to_disciplinary' ? '(to disciplinary committee)' : ''}</span></p>
              </div>
              <div className="text-sm text-muted-foreground">{modalReport.report.ticketNumber ?? modalReport.report.id}</div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Case Number</label>
                <input readOnly value={modalReport.report.ticketNumber ?? modalReport.report.id} className="w-full mt-1 rounded-lg border border-border px-3 py-2 bg-muted/5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Case Description</label>
                <textarea readOnly value={modalReport.report.description || modalReport.report.subject || ''} className="w-full mt-1 min-h-[80px] rounded-lg border border-border px-3 py-2 bg-muted/5 text-sm resize-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Findings</label>
                {modalReport.report.findingsReport ? (
                  <div className="w-full mt-1 min-h-[80px] rounded-lg border border-border px-3 py-2 bg-muted/5 text-sm whitespace-pre-wrap">{modalReport.report.findingsReport}</div>
                ) : (
                  <div className="w-full mt-1 rounded-lg border border-border px-3 py-2 bg-muted/5 text-sm text-muted-foreground">No findings available.</div>
                )}
                {Array.isArray(modalReport.report.findingsFiles) && modalReport.report.findingsFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {modalReport.report.findingsFiles.map((file) => (
                      <a key={file.path || file.url} href={file.path ? `/api/case-reports/${modalReport.report.id}/findings-file?file_path=${encodeURIComponent(file.path)}&file_name=${encodeURIComponent(file.name)}` : file.url} download={file.name} className="text-primary underline block">{file.name}</a>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Add Notes {modalReport.action === 'dismiss_case' ? <span className="text-xs text-muted-foreground">(required)</span> : <span className="text-xs text-muted-foreground">(optional)</span>}</label>
                <textarea
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder={modalReport.required ? 'Reason (required)...' : 'Notes (optional)...'}
                  className="w-full mt-1 min-h-[100px] rounded-lg border border-border bg-transparent px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-4">
              <button onClick={() => { setShowNotesModal(false); setModalReport(null); setModalNotes(''); }} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground">Cancel</button>
              <button
                onClick={handleConfirmModal}
                disabled={(modalReport.required && !modalNotes.trim()) || modalSaving}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {modalSaving ? 'Processing…' : modalReport.action === 'dismiss_case' ? 'Dismiss Case' : 'Refer'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6 md:px-8 md:py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Registrar Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Approve permission requests, review findings, and manage case progress.</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4">
          <button
            onClick={() => handleTabChange('permission_pending')}
            className={`px-4 py-2 border-b-2 text-sm font-medium transition-colors ${workflowTab === 'permission_pending' && !verdictsTab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            Permission Pending ({permissionPending.length})
          </button>
          <button
            onClick={() => handleTabChange('investigation')}
            className={`px-4 py-2 border-b-2 text-sm font-medium transition-colors ${workflowTab === 'investigation' && !verdictsTab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            Approved ({approvedCases.length})
          </button>
          <button
            onClick={() => handleTabChange('referred')}
            className={`px-4 py-2 border-b-2 text-sm font-medium transition-colors ${workflowTab === 'referred' && !verdictsTab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            Referred Cases ({referredCases.length})
          </button>
          <button
            onClick={() => setVerdictsTab((v) => !v)}
            className={`px-4 py-2 border-b-2 text-sm font-medium transition-colors ${verdictsTab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            Verdicts ({verdictCases.length})
          </button>
          <button
            onClick={() => handleTabChange('findings_with_registrar')}
            className={`px-4 py-2 border-b-2 text-sm font-medium transition-colors ${workflowTab === 'findings_with_registrar' && !verdictsTab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            Findings Review ({findingsPending.length})
          </button>
          <button
            onClick={() => handleTabChange('all')}
            className={`px-4 py-2 border-b-2 text-sm font-medium transition-colors ${workflowTab === 'all' && !verdictsTab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            All Cases ({workflowReports.length})
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-xl border border-border p-5">
            <p className="text-2xl font-bold text-foreground">{permissionPending.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Permission Requests Pending</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <p className="text-2xl font-bold text-foreground">{approvedCases.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Approved Cases</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <p className="text-2xl font-bold text-foreground">{findingsPending.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Findings Awaiting Review</p>
          </div>
        </div>

        {verdictsTab ? (
          verdictCases.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
              No verdicts have been recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground">
                    <th className="px-4 py-3 text-sm font-semibold">Case Number</th>
                    <th className="px-4 py-3 text-sm font-semibold">Case Title</th>
                    <th className="px-4 py-3 text-sm font-semibold">Verdict</th>
                    <th className="px-4 py-3 text-sm font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {verdictCases.map((report) => (
                    <tr key={report.id} className="border-b border-border last:border-none hover:bg-accent/10 transition-colors">
                      <td className="px-4 py-3 text-sm text-foreground font-medium">{report.ticketNumber ?? report.id}</td>
                      <td className="px-4 py-3 text-sm text-foreground break-words line-clamp-2">{report.subject ?? report.description}</td>
                      <td className="px-4 py-3 text-sm text-foreground max-w-[34rem] whitespace-pre-wrap">{report.verdict}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleVerdictApprove(report.id)}
                          disabled={savingId === report.id}
                          className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {savingId === report.id ? 'Approving…' : 'Approve'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : filteredWorkflowReports.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
            No cases found for this view.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground">
                  {workflowTab === 'findings_with_registrar' ? (
                    <>
                      <th className="px-4 py-3 text-sm font-semibold">No.</th>
                      <th className="px-4 py-3 text-sm font-semibold">Case Number</th>
                      <th className="px-4 py-3 text-sm font-semibold">Case Title</th>
                      <th className="px-4 py-3 text-sm font-semibold">Findings</th>
                      <th className="px-4 py-3 text-sm font-semibold text-right">Action</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 text-sm font-semibold">Case Number</th>
                      <th className="px-4 py-3 text-sm font-semibold">Case Title</th>
                      {workflowTab === 'investigation' ? (
                        <>
                          <th className="px-4 py-3 text-sm font-semibold">Handler</th>
                          <th className="px-4 py-3 text-sm font-semibold">Status</th>
                        </>
                      ) : (
                        <>
                          <th className="px-4 py-3 text-sm font-semibold">Submitted Request</th>
                          <th className="px-4 py-3 text-sm font-semibold text-right">Action</th>
                        </>
                      )}
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredWorkflowReports.map((report, index) => (
                  <WorkflowCaseRow
                    key={report.id}
                    report={report}
                    index={index}
                    onApprove={handleApprove}
                    onWorkflowAction={onWorkflowAction}
                    onOpenNotesModal={openNotesModal}
                    savingId={savingId}
                    forApprovedPage={workflowTab === 'investigation'}
                    forFindingsReview={workflowTab === 'findings_with_registrar'}
                    forReferredPage={workflowTab === 'referred'}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
