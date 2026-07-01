import { CounselingRequest } from '../types';
import { CheckCircle, Clock } from 'lucide-react';

interface DismissedCasesProps {
  requests: CounselingRequest[];
}

export function DismissedCases({ requests }: DismissedCasesProps) {
  const dismissedRequests = requests.filter(r => r.status === 'rejected');

  if (dismissedRequests.length === 0) {
    return (
      <div className="bg-card rounded-xl p-12 border border-border text-center">
        <CheckCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-foreground mb-2">No Dismissed Cases</h3>
        <p className="text-muted-foreground">You don't have any dismissed cases at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {dismissedRequests.map((request) => (
        <div key={request.id} className="bg-card rounded-xl p-4 sm:p-6 border border-border">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h3 className="text-foreground mb-1">{request.studentName}</h3>
              <p className="text-muted-foreground break-all">{request.studentEmail}</p>
            </div>
            <div className="px-3 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive self-start shrink-0">
              Dismissed
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Concern Category:</p>
              <p className="text-foreground capitalize">{request.category || 'Not specified'}</p>
            </div>

            <div>
              <p className="text-muted-foreground text-sm mb-1">Urgency Level:</p>
              <p className="text-foreground capitalize">{request.urgencyLevel}</p>
            </div>

            <div>
              <p className="text-muted-foreground text-sm mb-1">Requested Date:</p>
              <p className="text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="text-muted-foreground text-sm mb-1">Preferred Time:</p>
              <p className="text-foreground">{request.preferredTime}</p>
            </div>

            <div className="md:col-span-2">
              <p className="text-muted-foreground text-sm mb-1">Original Concern:</p>
              <p className="text-foreground">{request.concern}</p>
            </div>

            {request.referralReason && (
              <div className="md:col-span-2">
                <p className="text-muted-foreground text-sm mb-1">Dismissal Reason:</p>
                <p className="text-foreground">{request.referralReason}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
