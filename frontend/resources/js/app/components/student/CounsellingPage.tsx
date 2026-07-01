import { Calendar, Clock, CheckCircle, AlertCircle, XCircle, ArrowRight, FileText, MessageCircle, Plus } from 'lucide-react';
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
  const getStatusConfig = (status: CounselingRequest['status']) => {
    switch (status) {
      case 'pending_review':
        return { icon: Clock, label: 'Pending Review', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
      case 'pending_approval':
        return { icon: Clock, label: 'Awaiting Approval', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
      case 'student_approved':
        return { icon: Clock, label: 'Awaiting Counselor', color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200' };
      case 'counselor_approved':
        return { icon: Clock, label: 'Awaiting Your Approval', color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200' };
      case 'approval_rejected':
        return { icon: AlertCircle, label: 'Schedule Rejected', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' };
      case 'scheduled':
        return { icon: Calendar, label: 'Scheduled', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };
      case 'in_progress':
        return { icon: ArrowRight, label: 'In Progress', color: 'text-primary', bg: 'bg-primary/10 border-primary/20' };
      case 'completed':
        return { icon: CheckCircle, label: 'Completed', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };
      case 'referred':
        return { icon: FileText, label: 'Referred', color: 'text-slate-700', bg: 'bg-slate-100 border-slate-200' };
      case 'rejected':
        return { icon: XCircle, label: 'Declined', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' };
      default:
        return { icon: Clock, label: 'Pending', color: 'text-muted-foreground', bg: 'bg-muted border-border/60' };
    }
  };

  return (
    <div className="rounded-[24px] border border-border/70 bg-white/90 p-4 shadow-sm sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Student support</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">My counselling sessions</h1>
          <p className="mt-1 text-sm text-muted-foreground">A simple view of your assigned counselor, upcoming appointments, and session progress.</p>
        </div>
        <button
          type="button"
          onClick={onRequestCounseling}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Request counselling
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-[20px] border border-border/70 bg-background/70 p-8 text-center">
          <MessageCircle className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">No counselling requests yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">Start with a simple request and we’ll guide you through the next steps.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const statusConfig = getStatusConfig(request.status);
            const StatusIcon = statusConfig.icon;
            const shouldShowApproval = Boolean(request.autoScheduleProposal) && !['scheduled', 'in_progress', 'completed', 'referred', 'rejected'].includes(request.status) && !(request.autoScheduleProposal?.studentApproved && request.autoScheduleProposal?.counselorApproved);
            const progressValue = request.totalSessions
              ? Math.min(100, Math.round(((request.completedSessions || 0) / request.totalSessions) * 100))
              : 0;

            return (
              <div key={request.id} className="rounded-[20px] border border-border/70 bg-background/70 p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Request #{request.id}</span>
                      <span className="text-sm text-muted-foreground">Submitted {new Date(request.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-base font-semibold text-foreground">{request.concern}</h3>
                  </div>
                  <div className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-1.5 ${statusConfig.bg}`}>
                    <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                    <span className={`text-sm font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <div className="rounded-2xl border border-border/70 bg-white/80 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Assigned counselor</p>
                    <p className="mt-1 font-medium text-foreground">{request.counselorName || 'Pending assignment'}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-white/80 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Scheduled date</p>
                    <p className="mt-1 flex items-center gap-2 font-medium text-foreground">
                      <Calendar className="h-4 w-4" />
                      {request.scheduledDate ? new Date(request.scheduledDate).toLocaleDateString() : 'Pending'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-white/80 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Time</p>
                    <p className="mt-1 flex items-center gap-2 font-medium text-foreground">
                      <Clock className="h-4 w-4" />
                      {request.scheduledTime || 'Pending'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-white/80 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Sessions planned</p>
                    <p className="mt-1 font-medium text-foreground">{request.totalSessions ? `${request.totalSessions} sessions` : 'Pending'}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-white/80 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Progress</p>
                    {request.totalSessions ? (
                      <div className="mt-2">
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">{request.completedSessions || 0}/{request.totalSessions}</span>
                          <span className="text-muted-foreground">{progressValue}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${progressValue}%` }} />
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 font-medium text-foreground">Pending</p>
                    )}
                  </div>
                </div>

                {shouldShowApproval && (
                  <div className="mt-4">
                    <ApprovalWorkflow
                      request={request}
                      userType="student"
                      onApprove={() => onApproveSchedule(request.id)}
                      onReject={() => onRejectSchedule(request.id)}
                      onManualSelect={(date, time) => onManualSchedule(request.id, date, time)}
                    />
                  </div>
                )}

                {request.referralReason && request.externalCounselorInfo && (
                  <div className="mt-4 rounded-2xl border border-info/20 bg-info/10 p-4 text-sm text-foreground">
                    <p className="font-semibold text-info">Referral</p>
                    <p className="mt-1">{request.referralReason}</p>
                    <p className="mt-1 text-muted-foreground">External counselor: {request.externalCounselorInfo}</p>
                  </div>
                )}

                {request.status === 'scheduled' && (
                  <div className="mt-4">
                    <button
                      onClick={() => onAcceptSchedule(request.id)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                    >
                      <CheckCircle className="h-5 w-5" />
                      Accept schedule
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
