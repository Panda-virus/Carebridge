import { useState } from 'react';
import { Calendar, Clock, AlertTriangle, Check, X } from 'lucide-react';
import { CounselingRequest } from '../types';
import { ApprovalWorkflow } from './ApprovalWorkflow';

interface PendingRequestsProps {
  requests: CounselingRequest[];
  counselorId: string;
  counselorName: string;
  onSchedule: (requestId: string, scheduledDate: Date, scheduledTime: string, totalSessions: 6 | 8) => void;
  onApprove: (requestId: string) => void;
  onRejectSchedule: (requestId: string) => void;
  onManualSelect: (requestId: string, date: Date, time: string) => void;
  onReject: (requestId: string) => void;
}

export function PendingRequests({ requests, counselorId, counselorName, onSchedule, onApprove, onRejectSchedule, onManualSelect, onReject }: PendingRequestsProps) {
  const [schedulingRequest, setSchedulingRequest] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    time: '',
    totalSessions: 6 as 6 | 8,
  });

  const handleSchedule = (requestId: string) => {
    const date = new Date(scheduleForm.date);
    onSchedule(requestId, date, scheduleForm.time, scheduleForm.totalSessions);
    setSchedulingRequest(null);
    setScheduleForm({ date: '', time: '', totalSessions: 6 });
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-destructive/10 text-destructive border-destructive';
      case 'medium':
        return 'bg-warning/10 text-warning border-warning';
      case 'low':
        return 'bg-success/10 text-success border-success';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const primaryActionClass = 'rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90';
  const secondaryActionClass = 'rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition-all hover:bg-accent';
  const dangerActionClass = 'rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive transition-all hover:bg-destructive/20';

  if (requests.length === 0) {
    return (
      <div className="bg-card rounded-xl p-12 border border-border text-center">
        <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-foreground mb-2">No Pending Requests</h3>
        <p className="text-muted-foreground">All requests have been reviewed.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card p-4">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-muted/20 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left">Student</th>
            <th className="px-4 py-3 text-left">Concern</th>
            <th className="px-4 py-3 text-left">Timing</th>
            <th className="px-4 py-3 text-left">Workflow</th>
            <th className="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {requests.map((request) => (
            <>
              <tr key={request.id} className="align-top">
                <td className="px-4 py-4 align-top">
                  <div className="font-medium text-foreground">{request.studentName}</div>
                  <div className="text-xs text-muted-foreground break-all">{request.studentEmail}</div>
                </td>
                <td className="px-4 py-4 align-top text-foreground max-w-xs">
                  <div className="line-clamp-2">{request.concern}</div>
                </td>
                <td className="px-4 py-4 align-top text-foreground">
                  <div>{request.preferredTime ? request.preferredTime : 'No preference'}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{new Date(request.createdAt).toLocaleString()}</div>
                </td>
                <td className="px-4 py-4 align-top">
                  <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${getUrgencyColor(request.urgencyLevel)}`}>
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span className="capitalize">{request.urgencyLevel} priority</span>
                  </div>
                  {request.autoScheduleProposal && (
                    <div className="mt-2 text-xs text-muted-foreground">Auto-schedule proposal available</div>
                  )}
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="flex flex-col gap-2">
                    {request.autoScheduleProposal ? (
                      <>
                        <button
                          onClick={() => onApprove(request.id)}
                          className={primaryActionClass}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setSchedulingRequest(request.id)}
                          className={secondaryActionClass}
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => onRejectSchedule(request.id)}
                          className={dangerActionClass}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setSchedulingRequest(request.id)}
                          className={primaryActionClass}
                        >
                          Schedule
                        </button>
                        <button
                          onClick={() => onReject(request.id)}
                          className={`${secondaryActionClass} hover:border-destructive hover:text-destructive`}
                        >
                          Decline
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
              {schedulingRequest === request.id && (
                <tr>
                  <td colSpan={5} className="px-4 pb-4">
                    <div className="rounded-2xl border border-border bg-muted/20 p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Calendar className="h-4 w-4" />
                        Schedule Appointment
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm text-foreground">Date</label>
                          <input
                            type="date"
                            value={scheduleForm.date}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                            className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm text-foreground">Time</label>
                          <select
                            value={scheduleForm.time}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                            className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value="">Select time</option>
                            <option value="9:00 AM">9:00 AM</option>
                            <option value="10:00 AM">10:00 AM</option>
                            <option value="11:00 AM">11:00 AM</option>
                            <option value="1:00 PM">1:00 PM</option>
                            <option value="2:00 PM">2:00 PM</option>
                            <option value="3:00 PM">3:00 PM</option>
                            <option value="4:00 PM">4:00 PM</option>
                            <option value="5:00 PM">5:00 PM</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="mb-2 block text-sm text-foreground">Total Sessions</label>
                        <select
                          value={scheduleForm.totalSessions}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, totalSessions: Number(e.target.value) as 6 | 8 })}
                          className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value={6}>6 sessions (Standard)</option>
                          <option value={8}>8 sessions (High urgency)</option>
                        </select>
                      </div>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <button
                          onClick={() => handleSchedule(request.id)}
                          disabled={!scheduleForm.date || !scheduleForm.time}
                          className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="inline-flex items-center gap-2"><Check className="h-4 w-4" />Confirm Schedule</span>
                        </button>
                        <button
                          onClick={() => setSchedulingRequest(null)}
                          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-accent"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
