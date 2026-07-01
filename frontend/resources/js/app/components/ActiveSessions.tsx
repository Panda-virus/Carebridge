import { useMemo, useState } from 'react';
import { Calendar, Clock, CheckCircle, TrendingUp, XCircle } from 'lucide-react';
import { CounselingRequest, CounselingSession, ExternalCounselor } from '../types';
import { DismissCaseModal } from './counselor/DismissCaseModal';

interface ActiveSessionsProps {
  requests: CounselingRequest[];
  sessions: CounselingSession[];
  externalCounselors: ExternalCounselor[];
  onUpdateProgress: (requestId: string, completedSessions: number, notes: string, score: number) => void;
  onCompleteWithRecommendations: (requestId: string, recommendations: string) => void;
  onReferExternal: (requestId: string, reason: string, externalInfo: string, externalCounselorId?: string) => void;
  onDismissCase?: (requestId: string, reason: string) => void;
}

export function ActiveSessions({
  requests,
  sessions,
  externalCounselors,
  onUpdateProgress,
  onCompleteWithRecommendations,
  onReferExternal,
  onDismissCase,
}: ActiveSessionsProps) {
  const [progressRequestId, setProgressRequestId] = useState<string | null>(null);
  const [dismissModalOpen, setDismissModalOpen] = useState(false);
  const [dismissingRequestId, setDismissingRequestId] = useState<string | null>(null);
  const [dismissingStudentName, setDismissingStudentName] = useState('');
  const [formData, setFormData] = useState({
    completedSessions: 0,
    sessionNotes: '',
    sessionScore: 75,
  });

  const handleUpdate = (requestId: string) => {
    onUpdateProgress(requestId, formData.completedSessions, formData.sessionNotes, formData.sessionScore);
    setProgressRequestId(null);
    setFormData({ completedSessions: 0, sessionNotes: '', sessionScore: 75 });
  };

  const handleDismiss = (reason: string) => {
    if (dismissingRequestId && onDismissCase) {
      onDismissCase(dismissingRequestId, reason);
      setDismissModalOpen(false);
      setDismissingRequestId(null);
      setDismissingStudentName('');
    }
  };

  const progressRequest = useMemo(
    () => requests.find((r) => r.id === progressRequestId) || null,
    [progressRequestId, requests]
  );

  const primaryActionClass = 'rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90';
  const dangerActionClass = 'rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive transition-all hover:bg-destructive/20';

  const openProgressModal = (request: CounselingRequest) => {
    setProgressRequestId(request.id);
    setFormData({
      completedSessions: (request.completedSessions || 0) + 1,
      sessionNotes: '',
      sessionScore: 75,
    });
  };

  const closeProgressModal = () => {
    setProgressRequestId(null);
  };

  if (requests.length === 0) {
    return (
      <div className="bg-card rounded-xl p-12 border border-border text-center">
        <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-foreground mb-2">No Active Sessions</h3>
        <p className="text-muted-foreground">You don't have any active counseling sessions at the moment.</p>
      </div>
    );
  }

  return (
    <>
      <DismissCaseModal
        isOpen={dismissModalOpen}
        studentName={dismissingStudentName}
        onConfirm={handleDismiss}
        onCancel={() => {
          setDismissModalOpen(false);
          setDismissingRequestId(null);
          setDismissingStudentName('');
        }}
      />

      <div className="overflow-x-auto rounded-2xl border border-border bg-card p-4 shadow-sm">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/20 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Student</th>
              <th className="px-4 py-3 text-left">Scheduled</th>
              <th className="px-4 py-3 text-left">Progress</th>
              <th className="px-4 py-3 text-left">Concern</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {requests.map((request) => {
              const progressPercent = request.totalSessions
                ? Math.round(((request.completedSessions || 0) / request.totalSessions) * 100)
                : 0;

              return (
                <tr key={request.id} className="align-top">
                  <td className="px-4 py-4 align-top">
                    <div className="font-medium text-foreground">{request.studentName}</div>
                    <div className="text-xs text-muted-foreground break-all">{request.studentEmail}</div>
                  </td>
                  <td className="px-4 py-4 align-top text-foreground">
                    {request.scheduledDate ? new Date(request.scheduledDate).toLocaleDateString() : 'Not set'}
                    <div className="mt-1 text-xs text-muted-foreground">{request.scheduledTime || '—'}</div>
                    <div className="mt-2 inline-flex rounded-full border border-border bg-muted/10 px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      {request.status.replace('_', ' ')}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="mb-2 text-xs text-muted-foreground">{request.completedSessions || 0} / {request.totalSessions || 0}</div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} />
                    </div>
                    {typeof request.overallScore === 'number' && (
                      <div className="mt-2 text-xs font-medium text-foreground">{request.overallScore.toFixed(0)}/100</div>
                    )}
                  </td>
                  <td className="px-4 py-4 align-top text-foreground max-w-xs">
                    <div className="line-clamp-2">{request.concern}</div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => openProgressModal(request)}
                        className={primaryActionClass}
                      >
                        Update Progress
                      </button>
                      {onDismissCase && (
                        <button
                          onClick={() => {
                            setDismissingRequestId(request.id);
                            setDismissingStudentName(request.studentName);
                            setDismissModalOpen(true);
                          }}
                          className={dangerActionClass}
                        >
                          Dismiss Case
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {progressRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-[32px] border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Update Progress for {progressRequest.studentName}</h2>
                <p className="text-sm text-muted-foreground">Record the latest session outcome and the next slot will be reserved automatically when possible.</p>
              </div>
              <button onClick={closeProgressModal} className="text-muted-foreground hover:text-foreground">Close</button>
            </div>

            <div className="mt-6 grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Completed Sessions</label>
                <input
                  type="number"
                  min={0}
                  max={progressRequest.totalSessions || 99}
                  value={formData.completedSessions}
                  onChange={(e) => setFormData({ ...formData, completedSessions: Number(e.target.value) })}
                  className="w-full rounded-2xl border border-border bg-input-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Session Notes</label>
                <textarea
                  value={formData.sessionNotes}
                  onChange={(e) => setFormData({ ...formData, sessionNotes: e.target.value })}
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-border bg-input-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Write your session notes here..."
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Session Score</label>
                  <span className="text-sm font-semibold text-foreground">{formData.sessionScore}/100</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={formData.sessionScore}
                  onChange={(e) => setFormData({ ...formData, sessionScore: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => handleUpdate(progressRequest.id)}
                className="flex-1 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
              >
                Save Progress
              </button>
              <button
                onClick={closeProgressModal}
                className="flex-1 rounded-2xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-all hover:bg-accent/20"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}