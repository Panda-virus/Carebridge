import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowRight,
  FileText,
  MessageCircle,
  Plus,
  ShieldCheck,
  Brain,
} from 'lucide-react';
import { CounselingRequest } from '../../types';
import { ApprovalWorkflow } from '../ApprovalWorkflow';

interface CounsellingPageProps {
  requests: CounselingRequest[];
  onRequestCounseling: () => void;
  onAcceptSchedule: (requestId: string) => void;
  onApproveSchedule: (requestId: string) => void;
  onRejectSchedule: (requestId: string) => void;
  onManualSchedule: (requestId: string, date: Date, time: string) => void;
}

export function CounsellingPage({
  requests,
  onRequestCounseling,
  onAcceptSchedule,
  onApproveSchedule,
  onRejectSchedule,
  onManualSchedule,
}: CounsellingPageProps) {
  const [selectedCase, setSelectedCase] = useState<CounselingRequest | null>(null);

  const currentCases = requests.filter((r) => !['completed', 'rejected'].includes(r.status));
  const previousCases = requests.filter((r) => ['completed', 'rejected'].includes(r.status));

  const getStatusLabel = (status: CounselingRequest['status']) => {
    switch (status) {
      case 'scheduled':
        return 'Scheduled';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'rejected':
        return 'Declined';
      default:
        return 'Pending';
    }
  };

  const getNextSessionLabel = (request: CounselingRequest) => {
    if (request.scheduledDate) {
      return `${new Date(request.scheduledDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}${request.scheduledTime ? ` • ${request.scheduledTime}` : ''}`;
    }

    if (request.autoScheduleProposal?.proposedDate) {
      return `${new Date(request.autoScheduleProposal.proposedDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}${request.autoScheduleProposal.proposedTime ? ` • ${request.autoScheduleProposal.proposedTime}` : ''}`;
    }

    return 'Pending';
  };

  return (
    <div className="min-h-screen bg-white py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Hero */}
        <div className="overflow-hidden rounded-[20px] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1 text-xs font-semibold tracking-widest text-primary">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Student Support
              </p>
              <h1 className="mt-3 text-2xl font-bold text-foreground">Counselling & Support</h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-xl">A calm, guided space for personal and academic wellbeing — view your active cases, appointments, and progress.</p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={onRequestCounseling}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:shadow-lg transform transition-all hover:-translate-y-1"
              >
                <Plus className="h-4 w-4" />
                Request
              </button>
            </div>
          </div>
        </div>

        {/* Current Counselling Cases */}
        <div className="mt-6">
          {currentCases.length === 0 ? (
            <div className="rounded-[20px] border border-border bg-white p-6 text-center text-sm text-muted-foreground">No active counselling cases.</div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="grid grid-cols-12 gap-4 items-center px-6 py-4 text-xs font-semibold uppercase tracking-wider text-foreground bg-success/10 border-b border-success/20">
                <div className="col-span-6">Title</div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-2 text-center">Next Session</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              <div className="divide-y divide-border">
                {currentCases.map((c) => (
                  <div key={c.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-6">
                        <p className="text-sm font-medium text-foreground">{c.concern || 'Counselling'}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{c.counselorName ? `Counsellor: ${c.counselorName}` : 'Awaiting counsellor assignment'}</p>
                      </div>
                      <div className="col-span-2 text-center text-sm font-medium text-foreground">{getStatusLabel(c.status)}</div>
                      <div className="col-span-2 text-center text-sm text-muted-foreground">
                        {getNextSessionLabel(c)}
                      </div>
                      <div className="col-span-2 text-right">
                        <button onClick={() => setSelectedCase(c)} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-primary/5">View Details</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {(previousCases.length > 0 || currentCases.length === 0) && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4">Previous Counselling Cases</h3>
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="grid grid-cols-12 gap-4 items-center px-6 py-4 text-xs font-semibold uppercase tracking-wider text-foreground bg-success/10 border-b border-success/20">
                <div className="col-span-6">Title</div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-2 text-center">Completed</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              <div className="divide-y divide-border">
                {previousCases.length === 0 ? (
                  <div className="px-6 py-6 text-center text-sm text-muted-foreground">No previous cases.</div>
                ) : (
                  previousCases.map((c) => (
                    <div key={c.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{c.concern || 'Completed Case'}</p>
                          <p className="text-sm text-muted-foreground">Date Completed: {c.completedAt ? new Date(c.completedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '—'}</p>
                        </div>
                        <button onClick={() => setSelectedCase(c)} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-primary/5">View Summary</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {selectedCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedCase(null)} />
            <div className="relative z-10 w-full max-w-2xl rounded-lg bg-white border border-border p-6 shadow-2xl transform transition-all duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Case {String(selectedCase.id).padStart(3, '0')}</h3>
                  <p className="text-sm text-muted-foreground">{selectedCase.concern || 'Counselling'}</p>
                </div>
                <button onClick={() => setSelectedCase(null)} className="p-2 rounded hover:bg-muted">
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium text-foreground mt-1">{getStatusLabel(selectedCase.status)}</p>

                  <p className="text-sm text-muted-foreground mt-3">Counsellor</p>
                  <p className="font-medium text-foreground mt-1">{selectedCase.counselorName || 'Unassigned'}</p>

                  <p className="text-sm text-muted-foreground mt-3">Next Session</p>
                  <p className="font-medium text-foreground mt-1">{getNextSessionLabel(selectedCase)}</p>

                  <p className="text-sm text-muted-foreground mt-2">{selectedCase.completedSessions || 0} / {selectedCase.totalSessions || 0} sessions completed</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mt-4">Notes</p>
                  <div className="mt-2 text-sm text-muted-foreground max-h-40 overflow-auto">{selectedCase.notes || 'No notes available.'}</div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button onClick={() => setSelectedCase(null)} className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CounsellingPage;
