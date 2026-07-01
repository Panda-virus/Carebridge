import React, { useState } from 'react';
import {
  Stethoscope,
  Clock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  Phone,
  Calendar,
  Send,
  ArrowRight,
  FileText,
  AlertCircle,
  ArrowLeft,
  FolderOpen,
  Star,
} from 'lucide-react';
import { CounselingRequest } from '../../types';
import { CounselorNavbar } from '../counselor/CounselorNavbar';

interface ExternalCounselorDashboardProps {
  counselorName: string;
  referrals: CounselingRequest[];
  onAcceptReferral: (requestId: string) => void;
  onAddExternalRecord: (requestId: string, notes: string, sessionNumber?: number) => void;
  onCompleteReferral: (requestId: string, recommendations: string) => void;
  onLogout: () => void;
}

function ExternalCasePage({
  request,
  onBack,
  onAccept,
  onAddRecord,
  onComplete,
}: {
  request: CounselingRequest;
  onBack: () => void;
  onAccept: (id: string) => void;
  onAddRecord: (id: string, notes: string, sessionNumber?: number) => void;
  onComplete: (id: string, recommendations: string) => void;
}) {
  const [recordNotes, setRecordNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');

  const records = request.externalSessionRecords ?? [];

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Referrals
      </button>

      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <FolderOpen className="w-5 h-5 text-info" />
          <h2 className="text-foreground font-medium">Case #{request.id}</h2>
          <span className="text-xs bg-info/10 text-info px-2 py-0.5 rounded-full capitalize">{request.status.replace(/_/g, ' ')}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Student</p>
            <p className="text-sm font-medium">{request.studentName}</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm font-medium truncate">{request.studentEmail}</p>
          </div>
          {request.overallScore != null && (
            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Overall Score</p>
              <p className={`text-sm font-medium ${request.overallScore < 70 ? 'text-destructive' : 'text-success'}`}>
                {request.overallScore.toFixed(1)}/100
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Concern</p>
            <p className="text-sm bg-muted/20 rounded-lg p-4">{request.concern}</p>
          </div>
          {request.referralReason && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Referral Reason</p>
              <p className="text-sm bg-info/5 border border-info/20 rounded-lg p-4">{request.referralReason}</p>
            </div>
          )}
          {request.sessionNotes && request.sessionNotes.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-1">University Counselor Notes</p>
              <ul className="space-y-2">
                {request.sessionNotes.map((note, i) => (
                  <li key={i} className="text-sm bg-muted/20 rounded-lg p-3">{note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {request.status === 'referred' && (
          <button
            onClick={() => onAccept(request.id)}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium flex items-center justify-center gap-2 mb-6"
          >
            <CheckCircle className="w-4 h-4" /> Accept Referral &amp; Open Case
          </button>
        )}

        {(request.status === 'in_progress' || request.status === 'referred') && (
          <div className="border-t border-border pt-6 space-y-4">
            <h3 className="text-foreground font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" /> Session Records
            </h3>

            {records.length > 0 && (
              <div className="space-y-2 mb-4">
                {records.map((rec, i) => (
                  <div key={i} className="bg-muted/30 rounded-lg p-3 text-sm">
                    <p className="text-xs text-muted-foreground mb-1">
                      Session {rec.session_number} · {new Date(rec.recorded_at).toLocaleString()}
                      {rec.recorded_by && ` · ${rec.recorded_by}`}
                    </p>
                    <p className="text-foreground whitespace-pre-wrap">{rec.notes}</p>
                  </div>
                ))}
              </div>
            )}

            {request.status === 'in_progress' && (
              <>
                <textarea
                  rows={4}
                  value={recordNotes}
                  onChange={(e) => setRecordNotes(e.target.value)}
                  placeholder="Record session notes, observations, and treatment progress..."
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-sm resize-none"
                />
                <button
                  onClick={() => {
                    if (recordNotes.trim()) {
                      onAddRecord(request.id, recordNotes, records.length + 1);
                      setRecordNotes('');
                    }
                  }}
                  disabled={!recordNotes.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50"
                >
                  Save Record
                </button>

                <div className="pt-4 border-t border-border">
                  <label className="block text-sm font-medium mb-1.5">Final Recommendations (close case)</label>
                  <textarea
                    rows={3}
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-border text-sm resize-none mb-2"
                  />
                  <button
                    onClick={() => recommendations.trim() && onComplete(request.id, recommendations)}
                    disabled={!recommendations.trim()}
                    className="w-full py-2.5 bg-success text-success-foreground rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    Complete Referral
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {request.status === 'completed' && request.recommendations && (
          <div className="bg-success/5 border border-success/20 rounded-lg p-4 text-sm">
            <p className="font-medium mb-1">Final Recommendations</p>
            <p>{request.recommendations}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ReferralCard({
  request,
  onOpen,
}: {
  request: CounselingRequest;
  onOpen: (id: string) => void;
}) {
  const statusLabel =
    request.status === 'referred' ? 'New Referral' :
    request.status === 'in_progress' ? 'In Progress' :
    request.status === 'completed' ? 'Completed' : request.status;

  const statusColor =
    request.status === 'referred' ? 'bg-info/10 text-info border-info/20' :
    request.status === 'in_progress' ? 'bg-primary/10 text-primary border-primary/20' :
    request.status === 'completed' ? 'bg-success/10 text-success border-success/20' :
    'bg-muted text-muted-foreground border-border';

  return (
    <div className="bg-card rounded-xl border border-border p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${statusColor}`}>
            {statusLabel}
          </span>
          {request.overallScore != null && request.overallScore < 70 && (
            <span className="inline-flex items-center gap-1 text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
              <Star className="w-3 h-3" /> Auto-referred (score {request.overallScore.toFixed(0)})
            </span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">{request.id}</span>
        </div>
        <p className="text-sm text-foreground line-clamp-2 mb-1">{request.concern}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><User className="w-3 h-3" />{request.studentName}</span>
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{request.createdAt.toLocaleDateString()}</span>
        </div>
      </div>
      <button
        onClick={() => onOpen(request.id)}
        className="shrink-0 flex items-center gap-2 px-4 py-2 bg-info text-info-foreground rounded-lg hover:bg-info/90 text-sm font-medium"
      >
        <FolderOpen className="w-4 h-4" /> Open Case
      </button>
    </div>
  );
}

export function ExternalCounselorDashboard({
  counselorName,
  referrals,
  onAcceptReferral,
  onAddExternalRecord,
  onCompleteReferral,
  onLogout,
}: ExternalCounselorDashboardProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'referred' | 'in_progress' | 'completed'>('all');
  const [openCaseId, setOpenCaseId] = useState<string | null>(null);

  const openCase = referrals.find((r) => r.id === openCaseId);

  const filtered =
    activeTab === 'all' ? referrals :
    referrals.filter((r) => r.status === activeTab);

  const counts = {
    all: referrals.length,
    referred: referrals.filter((r) => r.status === 'referred').length,
    in_progress: referrals.filter((r) => r.status === 'in_progress').length,
    completed: referrals.filter((r) => r.status === 'completed').length,
  };

  if (openCase) {
    return (
      <div className="min-h-screen bg-background overflow-x-hidden">
        <CounselorNavbar
          counselorName={counselorName}
          activeTab="cases"
          onTabChange={() => {}}
          onLogout={onLogout}
        />
        <div className="max-w-3xl mx-auto p-3 sm:p-4 md:p-8">
          <ExternalCasePage
            request={openCase}
            onBack={() => setOpenCaseId(null)}
            onAccept={onAcceptReferral}
            onAddRecord={onAddExternalRecord}
            onComplete={onCompleteReferral}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <CounselorNavbar
        counselorName={counselorName}
        activeTab="cases"
        onTabChange={() => {}}
        onLogout={onLogout}
      />
      <div className="max-w-5xl mx-auto p-3 sm:p-4 md:p-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-info/10 rounded-xl flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-info" />
          </div>
          <div>
            <h1 className="text-foreground">External Counselor Portal</h1>
            <p className="text-muted-foreground">Welcome, {counselorName}</p>
          </div>
        </div>

        <div className="bg-info/5 border border-info/20 rounded-xl p-4 mb-8 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-info shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Referred Cases</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cases appear here when auto-referred (score below 70) or manually referred by the university counselor.
              Open a case to accept it and record session notes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { key: 'referred', label: 'New Referrals' },
            { key: 'in_progress', label: 'Active Cases' },
            { key: 'completed', label: 'Completed' },
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
            { key: 'referred', label: `New (${counts.referred})` },
            { key: 'in_progress', label: `Active (${counts.in_progress})` },
            { key: 'completed', label: `Done (${counts.completed})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`px-4 py-3 border-b-2 text-sm whitespace-nowrap ${
                activeTab === key ? 'border-info text-info font-medium' : 'border-transparent text-muted-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-4 opacity-50" />
            No referrals assigned to you yet.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <ReferralCard key={r.id} request={r} onOpen={setOpenCaseId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
