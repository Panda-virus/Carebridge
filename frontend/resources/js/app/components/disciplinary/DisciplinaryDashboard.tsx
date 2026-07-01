import React, { useState } from 'react';
import {
  Gavel,
  Clock,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  BookOpen,
  Calendar,
  Lock,
  LogOut,
} from 'lucide-react';
import { CaseReport, CaseWorkflowStage, UserRole } from '../../types';
import { CaseWorkflowPanel, WorkflowActionPayload } from '../cases/CaseWorkflowPanel';
import { WorkflowAction, WORKFLOW_STAGE_LABELS, disciplinaryWorkflowStages } from '../../utils/caseWorkflow';

interface DisciplinaryDashboardProps {
  reports: CaseReport[];
  onWorkflowAction: (reportId: string, action: WorkflowAction, payload: WorkflowActionPayload) => void;
  onLogout?: () => void;
}

function DisciplinaryCaseCard({
  report,
  onWorkflowAction,
  savingId,
}: {
  report: CaseReport;
  onWorkflowAction: DisciplinaryDashboardProps['onWorkflowAction'];
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
            <span className="text-xs bg-warning/10 text-warning-foreground px-2 py-0.5 rounded-full">
              {WORKFLOW_STAGE_LABELS[report.workflowStage ?? 'with_disciplinary']}
            </span>
            {isAnonymous && (
              <span className="inline-flex items-center gap-1 text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                <Lock className="w-3 h-3" /> Anonymous Reporter
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto">{report.id}</span>
          </div>
          <p className="text-sm text-foreground line-clamp-2 mb-1.5">{report.description}</p>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Received {report.createdAt.toLocaleDateString()}
          </span>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-border p-5 space-y-5">
          {!isAnonymous && (report.studentName || report.studentEmail) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {report.studentName && (
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><User className="w-3 h-3" /> Student</p>
                  <p className="text-sm font-medium">{report.studentName}</p>
                </div>
              )}
              {report.studentEmail && (
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
                  <p className="text-sm font-medium truncate">{report.studentEmail}</p>
                </div>
              )}
              {(report.department || report.yearOfStudy) && (
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><BookOpen className="w-3 h-3" /> Dept / Year</p>
                  <p className="text-sm font-medium">{report.department || '—'} · Year {report.yearOfStudy || '—'}</p>
                </div>
              )}
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Original Report</p>
            <p className="text-sm text-foreground bg-muted/20 rounded-lg p-4">{report.description}</p>
          </div>

          {report.findingsReport && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">IIC Findings (via Registrar)</p>
              <p className="text-sm text-foreground bg-warning/5 border border-warning/20 rounded-lg p-4 whitespace-pre-wrap">
                {report.findingsReport}
              </p>
            </div>
          )}

          <CaseWorkflowPanel
            report={report}
            role={'disciplinary_committee' as UserRole}
            onWorkflowAction={onWorkflowAction}
            saving={savingId === report.id}
          />
        </div>
      )}
    </div>
  );
}

export function DisciplinaryDashboard({ reports, onWorkflowAction, onLogout }: DisciplinaryDashboardProps) {
  const [activeTab, setActiveTab] = useState<'all' | CaseWorkflowStage>('all');
  const [savingId, setSavingId] = useState<string | null>(null);

  const stages = disciplinaryWorkflowStages();
  const filtered =
    activeTab === 'all'
      ? reports
      : reports.filter((r) => (r.workflowStage ?? 'with_disciplinary') === activeTab);

  const counts = {
    all: reports.length,
    with_disciplinary: reports.filter((r) => r.workflowStage === 'with_disciplinary').length,
    meeting_notice_sent: reports.filter((r) => r.workflowStage === 'meeting_notice_sent').length,
    closed: reports.filter((r) => r.workflowStage === 'closed').length,
  };

  const handleAction = async (reportId: string, action: WorkflowAction, payload: WorkflowActionPayload) => {
    setSavingId(reportId);
    await onWorkflowAction(reportId, action, payload);
    setSavingId(null);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-3 sm:px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
              <Gavel className="h-5 w-5 text-warning-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">CareBridge</p>
              <p className="text-xs text-muted-foreground">Disciplinary Committee</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>
      <div className="mx-auto max-w-5xl p-3 sm:p-4 md:p-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center">
            <Gavel className="w-5 h-5 text-warning-foreground" />
          </div>
          <div>
            <h1 className="text-foreground">Disciplinary Committee</h1>
            <p className="text-muted-foreground">Review findings, schedule hearings, and record verdicts</p>
          </div>
        </div>

        <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 mb-8">
          <p className="text-sm font-medium text-foreground">Committee Process</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review forwarded findings → Send meeting notice to victim and required parties → Record verdict and close case
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { key: 'with_disciplinary', label: 'Awaiting Meeting Notice' },
            { key: 'meeting_notice_sent', label: 'Meetings Scheduled' },
            { key: 'closed', label: 'Closed' },
          ].map(({ key, label }) => (
            <div key={key} className="bg-card rounded-xl border border-border p-5">
              <p className="text-2xl font-bold">{counts[key as keyof typeof counts]}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
          {[
            { key: 'all', label: `All (${counts.all})` },
            ...stages.map((s) => ({ key: s, label: WORKFLOW_STAGE_LABELS[s] })),
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as 'all' | CaseWorkflowStage)}
              className={`px-4 py-3 border-b-2 text-sm whitespace-nowrap transition-colors ${
                activeTab === key ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Gavel className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No cases in this stage.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <DisciplinaryCaseCard key={r.id} report={r} onWorkflowAction={handleAction} savingId={savingId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
