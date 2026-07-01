import { AlertTriangle, Phone, MapPin, Clock } from 'lucide-react';
import { CounselingRequest, CaseReport } from '../../types';

interface EmergencyCounselingAlertProps {
  request: CounselingRequest;
  onCallStudent: (phone: string) => void;
}

export function EmergencyCounselingAlert({ request, onCallStudent }: EmergencyCounselingAlertProps) {
  return (
    <div className="bg-destructive/10 border-2 border-destructive rounded-xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="w-12 h-12 bg-destructive rounded-full flex items-center justify-center shrink-0">
          <AlertTriangle className="w-6 h-6 text-destructive-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
            <h3 className="text-destructive font-bold">EMERGENCY ALERT</h3>
            <span className="px-2 py-1 bg-destructive text-destructive-foreground text-xs rounded-full self-start">
              IMMEDIATE ATTENTION REQUIRED
            </span>
          </div>

          <div className="space-y-3 mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Student Name:</p>
              <p className="text-foreground font-medium">{request.studentName}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Contact Number:</p>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-destructive" />
                <p className="text-foreground font-medium">{request.studentPhone || 'Not provided'}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Email:</p>
              <p className="text-foreground">{request.studentEmail}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Category:</p>
              <p className="text-foreground font-medium capitalize">
                {request.category?.replace(/_/g, ' ')}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Urgency Reason:</p>
              <div className="bg-card p-3 rounded-lg border border-destructive/30">
                <p className="text-foreground">{request.concern}</p>
              </div>
            </div>

            {request.matchedKeywords && request.matchedKeywords.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Detected Keywords:</p>
                <div className="flex flex-wrap gap-2">
                  {request.matchedKeywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-destructive/20 text-destructive text-xs rounded-full"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Submitted: {new Date(request.createdAt).toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-destructive/20 border border-destructive rounded-lg p-4 mb-4">
            <p className="text-destructive font-medium">
              ⚠️ This student may be in immediate danger. Please contact them right away.
            </p>
          </div>

          {request.studentPhone && (
            <button
              onClick={() => onCallStudent(request.studentPhone!)}
              className="w-full bg-destructive text-destructive-foreground py-3 rounded-lg hover:bg-destructive/90 transition-all flex items-center justify-center gap-2 font-medium"
            >
              <Phone className="w-5 h-5" />
              Call Student Immediately
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface EmergencyCaseAlertProps {
  caseReport: CaseReport;
  onViewLocation: () => void;
}

export function EmergencyCaseAlert({ caseReport, onViewLocation }: EmergencyCaseAlertProps) {
  return (
    <div className="bg-destructive/10 border-2 border-destructive rounded-xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="w-12 h-12 bg-destructive rounded-full flex items-center justify-center shrink-0">
          <AlertTriangle className="w-6 h-6 text-destructive-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
            <h3 className="text-destructive font-bold">EMERGENCY CASE ALERT</h3>
            <span className="px-2 py-1 bg-destructive text-destructive-foreground text-xs rounded-full self-start">
              STUDENT IN DANGER
            </span>
          </div>

          <div className="space-y-3 mb-4">
            {caseReport.studentName && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Student Name:</p>
                <p className="text-foreground font-medium">{caseReport.studentName}</p>
              </div>
            )}

            {caseReport.studentPhone && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Contact Number:</p>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-destructive" />
                  <p className="text-foreground font-medium">{caseReport.studentPhone}</p>
                </div>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground mb-1">Category:</p>
              <p className="text-foreground font-medium capitalize">
                {caseReport.detailedCategory?.replace(/_/g, ' ')}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Description:</p>
              <div className="bg-card p-3 rounded-lg border border-destructive/30">
                <p className="text-foreground">{caseReport.description}</p>
              </div>
            </div>

            {caseReport.location && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Student Location:</p>
                <div className="bg-card p-3 rounded-lg border border-destructive/30">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-destructive mt-1" />
                    <div className="text-sm">
                      <p className="text-foreground">
                        Latitude: {caseReport.location.latitude.toFixed(6)}
                      </p>
                      <p className="text-foreground">
                        Longitude: {caseReport.location.longitude.toFixed(6)}
                      </p>
                      <p className="text-muted-foreground mt-1">
                        Accuracy: ±{Math.round(caseReport.location.accuracy)}m
                      </p>
                      <p className="text-muted-foreground">
                        Time: {new Date(caseReport.location.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Reported: {new Date(caseReport.createdAt).toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-destructive/20 border border-destructive rounded-lg p-4 mb-4">
            <p className="text-destructive font-medium">
              ⚠️ This student is in immediate danger and requires urgent intervention.
            </p>
          </div>

          {caseReport.location && (
            <button
              onClick={onViewLocation}
              className="w-full bg-destructive text-destructive-foreground py-3 rounded-lg hover:bg-destructive/90 transition-all flex items-center justify-center gap-2 font-medium"
            >
              <MapPin className="w-5 h-5" />
              View Location on Map
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
