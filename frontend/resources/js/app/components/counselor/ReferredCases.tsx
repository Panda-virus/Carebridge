import { CounselingRequest, ExternalCounselor } from '../types';
import { ExternalLink, User, Phone, Mail, MessageSquare } from 'lucide-react';

interface ReferredCasesProps {
  requests: CounselingRequest[];
  externalCounselors: ExternalCounselor[];
}

export function ReferredCases({ requests, externalCounselors }: ReferredCasesProps) {
  const referredRequests = requests.filter(r => r.status === 'referred');

  if (referredRequests.length === 0) {
    return (
      <div className="bg-card rounded-xl p-12 border border-border text-center">
        <ExternalLink className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-foreground mb-2">No Referred Cases</h3>
        <p className="text-muted-foreground">You don't have any cases referred to external counselors at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {referredRequests.map((request) => {
        const externalCounselor = externalCounselors.find(c => c.id === request.externalCounselorId);

        return (
          <div key={request.id} className="bg-card rounded-xl p-4 sm:p-6 border border-border">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h3 className="text-foreground mb-1">{request.studentName}</h3>
                <p className="text-muted-foreground break-all">{request.studentEmail}</p>
              </div>
              <div className="px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent self-start shrink-0">
                Referred
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

              <div className="md:col-span-2">
                <p className="text-muted-foreground text-sm mb-1">Reason for Referral:</p>
                <p className="text-foreground">{request.referralReason || 'Not specified'}</p>
              </div>
            </div>

            {externalCounselor && (
              <div className="bg-background rounded-lg p-4 border border-border">
                <h4 className="text-foreground mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  External Counselor Details
                </h4>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <span className="text-muted-foreground w-20">Name:</span>
                    <span className="text-foreground">{externalCounselor.name}</span>
                  </p>
                  {externalCounselor.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{externalCounselor.phone}</span>
                    </p>
                  )}
                  {externalCounselor.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{externalCounselor.email}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {request.externalSessionRecords && request.externalSessionRecords.length > 0 && (
              <div className="mt-4 bg-background rounded-lg p-4 border border-border">
                <h4 className="text-foreground mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Session Records ({request.externalSessionRecords.length})
                </h4>
                <div className="space-y-3">
                  {request.externalSessionRecords.map((record, idx) => (
                    <div key={idx} className="border-l-2 border-primary/30 pl-3">
                      <p className="text-sm text-muted-foreground">Session {record.session_number}</p>
                      <p className="text-sm text-foreground mt-1">{record.notes}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(record.recorded_at).toLocaleDateString()} {new Date(record.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
