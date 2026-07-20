import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  Clock,
  ChevronDown,
  ChevronUp,
  Calendar,
  MapPin,
  Eye,
  User,
  Menu,
  X,
  LogOut,
  FileText,
  HeartHandshake,
  ClipboardList,
} from 'lucide-react';
import { CaseReport, CaseWorkflowStage, UserRole } from '../../types';
import { EmergencyCaseAlert } from '../alerts/EmergencyAlert';
import { CaseWorkflowPanel, WorkflowActionPayload } from '../cases/CaseWorkflowPanel';
import { WorkflowAction, WORKFLOW_STAGE_LABELS, isApprovedForInvestigationStage } from '../../utils/caseWorkflow';
import { downloadProtectedFile } from '../../utils/fileDownloader';
import { ReportExportPanel } from '../ReportExportPanel';

interface IICDashboardProps {
  reports: CaseReport[];
  onWorkflowAction: (reportId: string, action: WorkflowAction, payload: WorkflowActionPayload) => void;
  onAcknowledgeCase?: (reportId: string) => void;
  onExport?: (params: { month: string; category: string; format: 'html' | 'pdf'; type?: string }) => Promise<void>;
  onLogout?: () => void;
}

type TopLevelPage = 'cases' | 'findings';

interface CaseSubPage {
  key: string;
  label: string;
  stage?: CaseWorkflowStage;
  filter: (r: CaseReport) => boolean;
}

const CASE_SUB_PAGES: CaseSubPage[] = [
  {
    key: 'pending',
    label: 'Pending Cases',
    stage: 'at_iic',
    filter: (r) => (r.workflowStage ?? 'at_iic') === 'at_iic' && r.status === 'submitted',
  },
  {
    key: 'acknowledged',
    label: 'Acknowledged',
    filter: (r) => r.status === 'acknowledged' && r.workflowStage !== 'permission_pending',
  },
  {
    key: 'pending_permission',
    label: 'Pending Permission',
    stage: 'permission_pending',
    filter: (r) => r.workflowStage === 'permission_pending',
  },
  {
    key: 'investigation',
    label: 'Approved for Investigation',
    stage: 'investigation',
    filter: (r) => isApprovedForInvestigationStage(r.workflowStage),
  },
];

const REPORTED_BY_LABELS: Record<'victim' | 'witness' | 'friend', string> = {
  victim: 'Victim',
  witness: 'Witness',
  friend: 'Concerned Friend',
};

function formatReportedBy(report: CaseReport) {
  const label = report.reportedByType ? REPORTED_BY_LABELS[report.reportedByType] : undefined;
  const identity = report.reportedByName ?? report.studentName ?? report.studentEmail ?? 'Unknown reporter';
  return label ? `${identity} (${label})` : identity;
}

function formatPermissionRequest(report: CaseReport) {
  const reporter = report.reportedByName ?? report.studentName ?? report.studentEmail ?? 'Unknown reporter';
  const defendant = report.defendantName ?? 'Not specified';
  const location = report.incidentLocation ?? 'Not specified';
  const date = report.incidentDate ? new Date(report.incidentDate).toLocaleDateString() : 'Not specified';
  const time = report.incidentTime ?? 'Not specified';
  const caseIdentifier = report.ticketNumber ?? report.id;

  return `Dear Registrar,

I am writing on behalf of the Internal Investigating Committee to request permission to investigate the following case:

Case: ${caseIdentifier}
Reporter: ${reporter}
Defendant: ${defendant}
Location: ${location}
Date: ${date}
Time: ${time}

Description:
${report.description}

Please grant the IIC permission to proceed with an investigation into this matter.

Sincerely,
Internal Investigating Committee`;
}

function StageBadge({ stage }: { stage: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
      {WORKFLOW_STAGE_LABELS[stage as keyof typeof WORKFLOW_STAGE_LABELS] || stage}
    </span>
  );
}

function CaseCard({
  report,
  onWorkflowAction,
  savingId,
}: {
  report: CaseReport;
  onWorkflowAction: IICDashboardProps['onWorkflowAction'];
  savingId: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const isAnonymous = report.isAnonymous !== false && !report.studentName;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button
        className="w-full text-left p-5 flex items-start justify-between gap-4 hover:bg-accent/10 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <StageBadge stage={report.workflowStage ?? 'at_iic'} />
            {isAnonymous ? (
              <span className="inline-flex items-center gap-1 text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                <Lock className="w-3 h-3" /> Anonymous
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                <User className="w-3 h-3" /> Identified
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto">{report.id}</span>
          </div>
          <p className="text-sm text-foreground line-clamp-2 mb-1.5">{report.description}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            {report.incidentDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Incident: {new Date(report.incidentDate).toLocaleDateString()}
              </span>
            )}
            {report.incidentLocation && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {report.incidentLocation}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Reported: {report.createdAt.toLocaleDateString()}
            </span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border p-5 space-y-5">
          {!isAnonymous && report.studentName && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Reporter</p>
                <p className="text-sm font-medium">{report.studentName}</p>
              </div>
              {report.studentEmail && (
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                  <p className="text-sm font-medium truncate">{report.studentEmail}</p>
                </div>
              )}
            </div>
          )}

          {isAnonymous && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
              <Lock className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Anonymous report — no identity information stored. Handle with strict confidentiality.
              </p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Description</p>
            <p className="text-sm text-foreground leading-relaxed bg-muted/20 rounded-lg p-4">{report.description}</p>
          </div>

          <CaseWorkflowPanel
            report={report}
            role={'iic' as UserRole}
            onWorkflowAction={onWorkflowAction}
            saving={savingId === report.id}
          />
        </div>
      )}
    </div>
  );
}

function CaseTable({
  reports,
  onWorkflowAction,
  onAcknowledgeCase,
  savingId,
  showAcknowledgement = false,
  showFindingsColumn = false,
  activeSubPage,
}: {
  reports: CaseReport[];
  onWorkflowAction: IICDashboardProps['onWorkflowAction'];
  onAcknowledgeCase?: IICDashboardProps['onAcknowledgeCase'];
  savingId: string | null;
  showAcknowledgement?: boolean;
  showFindingsColumn?: boolean;
  activeSubPage?: string;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewingReportId, setPreviewingReportId] = useState<string | null>(null);
  const [permissionRequestDraft, setPermissionRequestDraft] = useState('');

  const getIncidentDateTime = (report: CaseReport) => {
    if (!report.incidentDate) return '—';
    const date = new Date(report.incidentDate).toLocaleDateString();
    return report.incidentTime ? `${date} ${report.incidentTime}` : date;
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr>
            {showFindingsColumn && <th className="px-3 py-3 text-left">No.</th>}
            <th className="px-3 py-3 text-left">Case #</th>
            {showFindingsColumn ? (
              <>
                <th className="px-3 py-3 text-left">Case Title</th>
                <th className="px-3 py-3 text-left">Findings</th>
              </>
            ) : (
              <>
                <th className="px-3 py-3 text-left">Category</th>
                <th className="px-3 py-3 text-left">Description</th>
                <th className="px-3 py-3 text-left">Reported By</th>
                <th className="px-3 py-3 text-left">Incident Date & Time</th>
                <th className="px-3 py-3 text-left">Submitted On</th>
                <th className="px-3 py-3 text-left">Stage</th>
              </>
            )}
            {showFindingsColumn ? null : <th className="px-3 py-3 text-left">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {reports.map((report, index) => {
            const isSubmitted = report.status === 'submitted';
            const showAcknowledgeButton = showAcknowledgement && isSubmitted && onAcknowledgeCase;
            return (
              <React.Fragment key={report.id}>
                <tr className="border-t border-border hover:bg-accent/10">
                  {showFindingsColumn && (
                    <td className="px-3 py-4 align-top text-muted-foreground">{index + 1}</td>
                  )}
                  <td className="px-3 py-4 align-top font-medium text-foreground">
                    {report.ticketNumber ?? report.id}
                  </td>
                  {showFindingsColumn ? (
                    <>
                      <td className="px-3 py-4 align-top font-medium text-foreground">
                        {report.subject ?? report.description}
                      </td>
                      <td className="px-3 py-4 align-top text-muted-foreground max-w-md space-y-3">
                        {report.findingsReport ? (
                          <div className="whitespace-pre-wrap break-words">{report.findingsReport}</div>
                        ) : (
                          <div className="text-muted-foreground">No findings report submitted.</div>
                        )}
                        {Array.isArray(report.findingsFiles) && report.findingsFiles.length ? (
                          <div className="space-y-2">
                            {report.findingsFiles.map((file) => {
                              const handleDownloadFile = async () => {
                                if (file.path) {
                                  await downloadProtectedFile(
                                    `/api/case-reports/${report.id}/findings-file?file_path=${encodeURIComponent(file.path)}&file_name=${encodeURIComponent(file.name)}`,
                                    file.name
                                  );
                                  return;
                                }
                                if (file.url) {
                                  window.open(file.url, '_blank', 'noreferrer');
                                }
                              };

                              return (
                                <button key={file.path || file.url} type="button" onClick={handleDownloadFile} className="text-primary underline text-left">
                                  {file.name}
                                </button>
                              );
                            })}
                          </div>
                        ) : null}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-4 align-top text-muted-foreground">
                        {report.detailedCategory || report.category}
                      </td>
                      <td className="px-3 py-4 align-top whitespace-pre-wrap wrap-break-word max-w-md">
                        {report.description}
                      </td>
                      <td className="px-3 py-4 align-top text-muted-foreground">
                        {formatReportedBy(report)}
                      </td>
                      <td className="px-3 py-4 align-top text-muted-foreground">
                        {getIncidentDateTime(report)}
                      </td>
                      <td className="px-3 py-4 align-top text-muted-foreground">
                        {report.createdAt.toLocaleString()}
                      </td>
                      <td className="px-3 py-4 align-top">
                        <StageBadge stage={report.workflowStage ?? 'at_iic'} />
                      </td>
                    </>
                  )}
                  {showFindingsColumn ? null : (
                    <td className="px-3 py-4 align-top space-y-2">
                    {showAcknowledgeButton && (
                      <button
                        onClick={() => onAcknowledgeCase?.(report.id)}
                        disabled={savingId === report.id}
                        className="inline-flex items-center rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingId === report.id ? 'Acknowledging…' : 'Acknowledge'}
                      </button>
                    )}
                    {activeSubPage === 'acknowledged' && report.workflowStage !== 'permission_pending' && (
                      <button
                        onClick={() => {
                          setPreviewingReportId(report.id);
                          setPermissionRequestDraft(formatPermissionRequest(report));
                        }}
                        className="inline-flex items-center rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        Request permission
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedId((current) => (current === report.id ? null : report.id))}
                      className="inline-flex items-center rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-destructive hover:text-destructive"
                    >
                      {expandedId === report.id
                        ? 'Hide details'
                        : showFindingsColumn
                        ? 'View submitted report'
                        : activeSubPage === 'investigation'
                        ? 'Submit investigation findings'
                        : 'View details'}
                    </button>
                    {previewingReportId === report.id && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
                          <div className="flex items-center justify-between border-b border-border px-5 py-4">
                            <div>
                              <p className="text-sm font-semibold text-foreground">Preview Permission Request</p>
                              <p className="text-xs text-muted-foreground">Review the request before sending it to the Registrar.</p>
                            </div>
                            <button
                              onClick={() => {
                                setPreviewingReportId(null);
                                setPermissionRequestDraft('');
                              }}
                              className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="p-5 space-y-4">
                            <div className="rounded-2xl bg-muted/50 p-4">
                              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Edit request before sending</p>
                              <textarea
                                value={permissionRequestDraft}
                                onChange={(e) => setPermissionRequestDraft(e.target.value)}
                                rows={14}
                                className="min-h-[260px] w-full resize-y rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground"
                                placeholder="Write the permission request for the registrar..."
                              />
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                              <button
                                onClick={() => {
                                  setPreviewingReportId(null);
                                  setPermissionRequestDraft('');
                                }}
                                className="rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground hover:bg-accent/50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => {
                                  onWorkflowAction(report.id, 'request_permission', {
                                    permissionRequest: permissionRequestDraft.trim() || formatPermissionRequest(report),
                                  });
                                  setPreviewingReportId(null);
                                  setPermissionRequestDraft('');
                                }}
                                disabled={!permissionRequestDraft.trim()}
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Send to Registrar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </td>
                )}
                </tr>
                {expandedId === report.id && (
                  <tr className="bg-muted/5">
                    <td colSpan={showFindingsColumn ? 4 : 8} className="px-3 py-4">
                      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Incident details</p>
                            <div className="rounded-xl border border-border bg-card p-4 text-sm text-foreground space-y-2">
                              <p><span className="font-semibold">Reported by:</span> {formatReportedBy(report)}</p>
                              <p><span className="font-semibold">Category:</span> {report.detailedCategory || report.category}</p>
                              <p><span className="font-semibold">Location:</span> {report.incidentLocation || 'Unknown'}</p>
                              <p><span className="font-semibold">Submitted:</span> {report.createdAt.toLocaleString()}</p>
                              <p><span className="font-semibold">Status:</span> {report.status}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Full description</p>
                            <div className="rounded-xl border border-border bg-card p-4 text-sm text-foreground whitespace-pre-wrap wrap-break-word">
                              {report.description}
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Workflow actions</p>
                          <div className="rounded-xl border border-border bg-card p-4">
                            <CaseWorkflowPanel
                              report={report}
                              role={'iic' as UserRole}
                              onWorkflowAction={onWorkflowAction}
                              saving={savingId === report.id}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SubPageContainer({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function IICDashboard({ reports, onWorkflowAction, onAcknowledgeCase, onExport, onLogout }: IICDashboardProps) {
  const [topLevelPage, setTopLevelPage] = useState<TopLevelPage>('cases');
  const [activeSubPage, setActiveSubPage] = useState<string>('pending');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const emergencyReports = reports.filter((r) => r.urgencyLevel === 'immediate' && r.location);

  const handleAction = async (reportId: string, action: WorkflowAction, payload: WorkflowActionPayload) => {
    setSavingId(reportId);
    await onWorkflowAction(reportId, action, payload);
    setSavingId(null);
  };

  const handleViewLocation = (report: CaseReport) => {
    if (report.location) {
      window.open(
        `https://www.google.com/maps?q=${report.location.latitude},${report.location.longitude}`,
        '_blank'
      );
    }
  };

  const counts = {
    pending: reports.filter((r) => (r.workflowStage ?? 'at_iic') === 'at_iic' && r.status === 'submitted').length,
    acknowledged: reports.filter((r) => r.status === 'acknowledged').length,
    pending_permission: reports.filter((r) => r.workflowStage === 'permission_pending').length,
    investigation: reports.filter((r) => isApprovedForInvestigationStage(r.workflowStage)).length,
    findings: reports.filter((r) => r.workflowStage === 'findings_with_registrar').length,
  };

  const navLink = (page: TopLevelPage, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => { setTopLevelPage(page); setMobileMenuOpen(false); }}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        topLevelPage === page
          ? 'bg-destructive/10 text-destructive'
          : 'text-foreground hover:bg-accent/50'
      }`}
    >
      {icon}
      {label}
      {page === 'cases' && counts[activeSubPage as keyof typeof counts] > 0 && (
        <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full">
          {CASE_SUB_PAGES.reduce((sum, p) => sum + counts[p.key as keyof typeof counts], 0)}
        </span>
      )}
      {page === 'findings' && counts.findings > 0 && (
        <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full">{counts.findings}</span>
      )}
    </button>
  );

  const getCurrentFilteredReports = () => {
    if (topLevelPage === 'findings') {
      return reports.filter((r) => r.workflowStage === 'findings_with_registrar');
    }

    const subPage = CASE_SUB_PAGES.find((p) => p.key === activeSubPage);
    if (!subPage) return [];
    return reports.filter(subPage.filter);
  };

  const filteredReports = getCurrentFilteredReports();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-3 sm:px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
              <HeartHandshake className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">CareBridge</p>
              <p className="text-xs text-muted-foreground">IIC Dashboard</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {navLink('cases', 'Cases', <FileText className="h-4 w-4" />)}
            {navLink('findings', 'Findings', <ClipboardList className="h-4 w-4" />)}
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

          <button
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground md:hidden"
            onClick={() => setMobileMenuOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-border bg-card/95 px-3 py-3 md:hidden">
            <div className="space-y-2">
              {navLink('cases', 'Cases', <FileText className="h-4 w-4" />)}
              {navLink('findings', 'Findings', <ClipboardList className="h-4 w-4" />)}
              {onLogout && (
                <button
                  onClick={() => { setMobileMenuOpen(false); onLogout(); }}
                  className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-6 md:px-8 md:py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-destructive/10 rounded-xl flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h1 className="text-foreground">Internal Investigating Committee</h1>
              <p className="text-muted-foreground">Case intake, permission requests, and investigations</p>
            </div>
          </div>
        </div>

        {emergencyReports.length > 0 && (
          <div className="mb-8 space-y-4">
            {emergencyReports.map((report) => (
              <EmergencyCaseAlert key={report.id} caseReport={report} onViewLocation={() => handleViewLocation(report)} />
            ))}
          </div>
        )}

        <div className="space-y-6 mb-6">
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
            <Lock className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Case Workflow</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                1. Review new report → 2. Request investigation permission from Registrar → 3. Investigate after approval → 4. Submit findings to Registrar
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row flex-wrap gap-2 border-b border-border overflow-x-auto md:overflow-visible">
            <button
              onClick={() => setTopLevelPage('cases')}
              className={`px-4 py-3 border-b-2 text-sm whitespace-nowrap transition-colors ${
                topLevelPage === 'cases'
                  ? 'border-destructive text-destructive font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Cases
            </button>
            <button
              onClick={() => setTopLevelPage('findings')}
              className={`px-4 py-3 border-b-2 text-sm whitespace-nowrap transition-colors ${
                topLevelPage === 'findings'
                  ? 'border-destructive text-destructive font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Findings
              {counts.findings > 0 && (
                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive/10 text-xs text-destructive">
                  {counts.findings}
                </span>
              )}
            </button>
          </div>
        </div>

        {topLevelPage === 'cases' && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
              {CASE_SUB_PAGES.map((sub) => (
                <button
                  key={sub.key}
                  onClick={() => setActiveSubPage(sub.key)}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    activeSubPage === sub.key
                      ? 'border-destructive/40 bg-destructive/5'
                      : 'border-border bg-card hover:border-destructive/20'
                  }`}
                >
                  <p className="text-2xl font-bold text-foreground">{counts[sub.key as keyof typeof counts]}</p>
                  <p className="text-xs text-muted-foreground mt-1">{sub.label}</p>
                </button>
              ))}
            </div>

            <SubPageContainer
              title={CASE_SUB_PAGES.find((p) => p.key === activeSubPage)?.label ?? 'Cases'}
              description={
                activeSubPage === 'pending'
                  ? 'These cases have been submitted and are awaiting acknowledgement from the IIC. As the IIC member, you can review the full case details and acknowledge them before requesting permission for investigation.'
                  : activeSubPage === 'acknowledged'
                  ? 'These cases have been acknowledged and are ready for investigation.'
                  : activeSubPage === 'pending_permission'
                  ? 'These cases are awaiting approval from the Registrar to commence investigation.'
                  : 'These cases have been approved and are currently under investigation.'
              }
            >
              {filteredReports.length === 0 ? (
                <div className="bg-card rounded-xl border border-border p-12 text-center">
                  <Eye className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No cases in this stage.</p>
                </div>
              ) : (
                <CaseTable
                  reports={filteredReports}
                  onWorkflowAction={handleAction}
                  onAcknowledgeCase={onAcknowledgeCase}
                  savingId={savingId}
                  showAcknowledgement={activeSubPage === 'pending'}
                  activeSubPage={activeSubPage}
                />
              )}
            </SubPageContainer>
          </div>
        )}

        {topLevelPage === 'findings' && (
          <div>
            <SubPageContainer
              title="Findings"
              description="Review investigation findings submitted by the committee and forward them to the Registrar for processing."
            >
              {filteredReports.length === 0 ? (
                <div className="bg-card rounded-xl border border-border p-12 text-center">
                  <ClipboardList className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No findings awaiting review.</p>
                </div>
              ) : (
                <CaseTable
                  reports={filteredReports}
                  onWorkflowAction={handleAction}
                  savingId={savingId}
                  showFindingsColumn
                  activeSubPage={activeSubPage}
                />
              )}
            </SubPageContainer>

            {onExport ? (
              <div className="mt-6">
                <ReportExportPanel
                  availableCategories={[...new Set(reports.map((r) => r.category).filter(Boolean))] as string[]}
                  onExport={onExport}
                  typeOptions={[
                    { value: 'default', label: 'Default IIC report' },
                    { value: 'detailed_case_report', label: 'Detailed case report' },
                    { value: 'investigation_report', label: 'Investigation report' },
                    { value: 'case_progress_report', label: 'Case progress report' },
                    { value: 'referral_report', label: 'Referral report' },
                  ]}
                  initialMonth={new Date().toISOString().slice(0, 7)}
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
