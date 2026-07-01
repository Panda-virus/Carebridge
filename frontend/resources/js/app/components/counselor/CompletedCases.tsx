import { CounselingRequest } from '../types';
import { CheckCircle, Clock, FileText } from 'lucide-react';

interface CompletedCasesProps {
  requests: CounselingRequest[];
}

export function CompletedCases({ requests }: CompletedCasesProps) {
  const completedRequests = requests.filter(r => r.status === 'completed');

  if (completedRequests.length === 0) {
    return (
      <div className="bg-card rounded-xl p-12 border border-border text-center">
        <CheckCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-foreground mb-2">No Completed Cases</h3>
        <p className="text-muted-foreground">You don't have any completed cases yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {completedRequests.map((request) => (
        <div key={request.id} className="bg-card rounded-xl p-4 sm:p-6 border border-border">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h3 className="text-foreground mb-1">{request.studentName}</h3>
              <p className="text-muted-foreground break-all">{request.studentEmail}</p>
            </div>
            <div className="px-3 py-1 rounded-full bg-success/10 text-success border border-success self-start shrink-0">
              Completed
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Concern Category:</p>
              <p className="text-foreground capitalize">{request.category || 'Not specified'}</p>
            </div>

            <div>
              <p className="text-muted-foreground text-sm mb-1">Total Sessions Completed:</p>
              <p className="text-foreground">{request.completedSessions} / {request.totalSessions} sessions</p>
            </div>

            <div>
              <p className="text-muted-foreground text-sm mb-1">Overall Score:</p>
              <p className={`text-foreground font-semibold ${
                request.overallScore! < 70 ? 'text-destructive' : 'text-success'
              }`}>
                {request.overallScore?.toFixed(1) || 'N/A'} / 100
              </p>
            </div>

            <div>
              <p className="text-muted-foreground text-sm mb-1">Completed Date:</p>
              <p className="text-foreground">{new Date(request.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {request.recommendations && (
            <div className="bg-background rounded-lg p-4 border border-border">
              <h4 className="text-foreground mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Recommendations
              </h4>
              <p className="text-foreground text-sm whitespace-pre-wrap">{request.recommendations}</p>
            </div>
          )}

          {request.sessionNotes && request.sessionNotes.length > 0 && (
            <div className="mt-4 bg-background rounded-lg p-4 border border-border">
              <h4 className="text-foreground mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Session Notes
              </h4>
              <div className="space-y-3">
                {request.sessionNotes.map((note, idx) => (
                  <div key={idx} className="border-l-2 border-primary/30 pl-3">
                    <p className="text-xs text-muted-foreground mb-1">Session {idx + 1}</p>
                    <p className="text-sm text-foreground">{note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
