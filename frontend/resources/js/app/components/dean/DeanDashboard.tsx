import React, { useState } from 'react';
import {
  FileText,
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
  XCircle,
} from 'lucide-react';
import { CaseReport, GeneralSubCategory, CaseStatus } from '../../types';
import { EmergencyCaseAlert } from '../alerts/EmergencyAlert';

interface DeanDashboardProps {
  reports: CaseReport[];
  onUpdateReport: (reportId: string, status: CaseStatus, responseNotes?: string) => void;
}

const SUB_CATEGORY_LABELS: Record<GeneralSubCategory, string> = {
  fees_support: 'Fees Support',
  living_expenses: 'Living Expenses',
  others: 'Others',
};

const STATUS_CONFIG: Record<CaseStatus, { label: string; color: string; icon: React.ReactNode }> = {
  submitted: {
    label: 'Submitted',
    color: 'bg-info/10 text-info border-info/20',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  under_review: {
    label: 'Under Review',
    color: 'bg-warning/10 text-warning-foreground border-warning/20',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
  referred: {
    label: 'Referred',
    color: 'bg-info/10 text-info border-info/20',
    icon: <FileText className="w-3.5 h-3.5" />,
  },
  resolved: {
    label: 'Resolved',
    color: 'bg-success/10 text-success border-success/20',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  closed: {
    label: 'Closed',
    color: 'bg-muted text-muted-foreground border-border',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

function ReportCard({
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

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      onUpdate(report.id, selectedStatus, responseText || undefined);
      setSaving(false);
    }, 400);
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button
        className="w-full text-left p-5 flex items-start justify-between gap-4 hover:bg-accent/10 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${statusCfg.color}`}
            >
              {statusCfg.icon}
              {statusCfg.label}
            </span>
            {report.subCategory && (
              <span className="text-xs bg-accent/20 text-accent-foreground px-2 py-0.5 rounded-full">
                {SUB_CATEGORY_LABELS[report.subCategory]}
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto">{report.id}</span>
          </div>
          <p className="text-sm text-foreground line-clamp-2 mb-1.5">{report.description}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {report.studentName}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {report.createdAt.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
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
          {/* Student identity */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                <User className="w-3 h-3" /> Full Name
              </p>
              <p className="text-sm text-foreground font-medium">{report.studentName}</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-0.5">Student ID</p>
              <p className="text-sm text-foreground font-medium">{report.studentId}</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email
              </p>
              <p className="text-sm text-foreground font-medium truncate">{report.studentEmail}</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> Department / Year
              </p>
              <p className="text-sm text-foreground font-medium">
                {report.department} · Year {report.yearOfStudy}
              </p>
            </div>
          </div>

          {/* Full description */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Description</p>
            <p className="text-sm text-foreground leading-relaxed bg-muted/20 rounded-lg p-4">
              {report.description}
            </p>
          </div>

          {/* Response section */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Response / Notes</p>
            <textarea
              rows={3}
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Add a response or notes for this student..."
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm placeholder:text-muted-foreground resize-none"
            />
          </div>

          {/* Status + save */}
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as CaseStatus)}
              className="px-3 py-2 rounded-lg border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-sm disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Response'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function DeanDashboard({ reports, onUpdateReport }: DeanDashboardProps) {
  const [activeTab, setActiveTab] = useState<'all' | CaseStatus>('all');

  const emergencyReports = reports.filter(r => r.urgencyLevel === 'immediate' && r.location);

  const filtered =
    activeTab === 'all' ? reports : reports.filter((r) => r.status === activeTab);

  const counts = {
    all: reports.length,
    submitted: reports.filter((r) => r.status === 'submitted').length,
    under_review: reports.filter((r) => r.status === 'under_review').length,
    referred: reports.filter((r) => r.status === 'referred').length,
    resolved: reports.filter((r) => r.status === 'resolved').length,
    closed: reports.filter((r) => r.status === 'closed').length,
  };

  const handleViewLocation = (report: CaseReport) => {
    if (report.location) {
      const url = `https://www.google.com/maps?q=${report.location.latitude},${report.location.longitude}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-8 overflow-x-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-foreground">Dean of Students</h1>
              <p className="text-muted-foreground">General case reports requiring attention</p>
            </div>
          </div>
        </div>

        {/* Emergency Alerts Section */}
        {emergencyReports.length > 0 && (
          <div className="mb-8 space-y-4">
            {emergencyReports.map(report => (
              <EmergencyCaseAlert
                key={report.id}
                caseReport={report}
                onViewLocation={() => handleViewLocation(report)}
              />
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { key: 'submitted', label: 'New', color: 'text-info', bg: 'bg-info/10' },
            { key: 'under_review', label: 'In Review', color: 'text-warning-foreground', bg: 'bg-warning/10' },
            { key: 'resolved', label: 'Resolved', color: 'text-success', bg: 'bg-success/10' },
            { key: 'closed', label: 'Closed', color: 'text-muted-foreground', bg: 'bg-muted' },
          ].map(({ key, label, color, bg }) => (
            <div key={key} className="bg-card rounded-xl border border-border p-5">
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                <span className={`text-sm font-bold ${color}`}>
                  {counts[key as keyof typeof counts]}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-col md:flex-row gap-1 mb-6 border-b border-border overflow-x-auto md:overflow-visible">
          {[
            { key: 'all', label: `All (${counts.all})` },
            { key: 'submitted', label: `New (${counts.submitted})` },
            { key: 'under_review', label: `In Review (${counts.under_review})` },
            { key: 'referred', label: `Referred (${counts.referred})` },
            { key: 'resolved', label: `Resolved (${counts.resolved})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as 'all' | CaseStatus)}
              className={`px-5 py-3 border-b-2 text-sm whitespace-nowrap transition-colors ${
                activeTab === key
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Reports list */}
        {filtered.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No reports in this category.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <ReportCard key={r.id} report={r} onUpdate={onUpdateReport} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
