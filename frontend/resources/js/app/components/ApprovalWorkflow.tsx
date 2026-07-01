import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { CounselingRequest } from '../types';

interface ApprovalWorkflowProps {
  request: CounselingRequest;
  userType: 'student' | 'counselor';
  onApprove: () => void;
  onReject: () => void;
  onManualSelect: (date: Date, time: string) => void;
}

export function ApprovalWorkflow({
  request,
  userType,
  onApprove,
  onReject,
  onManualSelect,
}: ApprovalWorkflowProps) {
  const proposal = request.autoScheduleProposal;
  if (!proposal) return null;

  const bothApproved = proposal.studentApproved && proposal.counselorApproved;
  const isWaitingForMe =
    (userType === 'student' && !proposal.studentApproved) ||
    (userType === 'counselor' && !proposal.counselorApproved);

  const otherPartyApproved =
    (userType === 'student' && proposal.counselorApproved) ||
    (userType === 'counselor' && proposal.studentApproved);
  const shouldShowActions = isWaitingForMe && !bothApproved && !['approval_rejected', 'scheduled', 'in_progress', 'completed', 'referred', 'rejected'].includes(request.status);

  const [showSlots, setShowSlots] = useState(false);
  const availableSlots = request.availableSlots || [];

  return (
    <div className="space-y-3 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-white to-primary/5 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-foreground">
            {request.status === 'approval_rejected' ? 'Previous Proposal' : 'Proposed Session'}
          </h4>
        </div>
        <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-primary shadow-sm">
          {bothApproved ? 'Confirmed' : 'Needs review'}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-white/80 p-3">
          <p className="mb-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">Date</p>
          <p className="font-medium text-foreground">{new Date(proposal.proposedDate).toLocaleDateString()}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-white/80 p-3">
          <p className="mb-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">Time</p>
          <p className="font-medium text-foreground">{proposal.proposedTime}</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${proposal.studentApproved ? 'border-emerald-200 bg-emerald-50' : 'border-border/60 bg-muted/40'}`}>
          {proposal.studentApproved ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
          <span className="text-sm text-foreground">Student {proposal.studentApproved ? 'Approved' : 'Pending'}</span>
        </div>
        <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${proposal.counselorApproved ? 'border-emerald-200 bg-emerald-50' : 'border-border/60 bg-muted/40'}`}>
          {proposal.counselorApproved ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
          <span className="text-sm text-foreground">Counselor {proposal.counselorApproved ? 'Approved' : 'Pending'}</span>
        </div>
      </div>

      {shouldShowActions && (
        <div className="space-y-2">
          {otherPartyApproved && (
            <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{userType === 'student' ? 'The counselor' : 'The student'} has already approved this time. Please confirm it to lock it in.</span>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={onApprove}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              <CheckCircle className="h-4 w-4" />
              Confirm Schedule
            </button>
            <button
              onClick={onReject}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive transition hover:bg-destructive/20"
            >
              <XCircle className="h-4 w-4" />
              Ask for another time
            </button>
          </div>
        </div>
      )}

      {bothApproved && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
          <CheckCircle className="h-4 w-4" />
          Your session is confirmed and ready to begin.
        </div>
      )}

      {request.status === 'approval_rejected' && (
        <div className="rounded-2xl border border-border/60 bg-white/80 p-3">
          <h4 className="mb-2 font-semibold text-foreground">Choose another option</h4>
          <p className="mb-3 text-sm text-muted-foreground">Pick a time that works better for you from the available slots below.</p>
          <button
            onClick={() => setShowSlots(!showSlots)}
            className="mb-3 w-full rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/20"
          >
            {showSlots ? 'Hide' : 'Show'} available slots
          </button>

          {showSlots && (
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {availableSlots.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/60 p-3 text-center text-sm text-muted-foreground">No other slots are available right now.</p>
              ) : (
                availableSlots.map((slot, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onManualSelect(slot.date, slot.time);
                      setShowSlots(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5 text-left transition hover:border-primary/30 hover:bg-primary/10"
                  >
                    <span className="text-sm font-medium text-foreground">{new Date(slot.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <span className="text-sm text-muted-foreground">{slot.time}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
