import { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  CheckCircle2,
  ArrowLeft,
  Calendar,
  MapPin,
} from 'lucide-react';
import { CaseReport, LocationData } from '../../types';
import { categorizeCaseReport } from '../../utils/categorization';
import { LocationPrompt } from '../LocationPrompt';

interface AnonymousReportPageProps {
  onSubmit: (report: Omit<CaseReport, 'id' | 'status' | 'createdAt'>) => void;
  onBack: () => void;
}

export function AnonymousReportPage({ onSubmit, onBack }: AnonymousReportPageProps) {
  const [description, setDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [descError, setDescError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  const handleSubmit = () => {
    if (!description.trim()) {
      setDescError('Please describe the incident before submitting.');
      return;
    }

    // Check if case requires location sharing
    const categorization = categorizeCaseReport(description);
    if (categorization.requiresLocationSharing && !locationData) {
      setShowLocationPrompt(true);
      return;
    }

    submitReport();
  };

  const submitReport = () => {
    onSubmit({
      description,
      incidentDate: incidentDate || undefined,
      incidentLocation: incidentLocation || undefined,
      ...(locationData && { location: locationData }),
    });
    setSubmitted(true);
  };

  const handleLocationShared = (location: LocationData) => {
    setLocationData(location);
    setShowLocationPrompt(false);
    submitReport();
  };

  const handleSkipLocation = () => {
    setShowLocationPrompt(false);
    submitReport();
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-success/15 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-foreground mb-3">Report Submitted</h1>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Your anonymous report has been sent to the Internal Investigating Committee (IIC) dashboard. The case will follow the official pipeline: IIC permission request → Registrar approval → Investigation → Disciplinary Committee hearings → Verdict.
          </p>
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5 mb-8 text-left flex items-start gap-3">
            <Lock className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground mb-1">Your identity is fully protected</p>
              <p className="text-sm text-muted-foreground">
                No personal information was stored. The IIC will request investigation permission from the Registrar before proceeding.
              </p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 sm:px-6 py-4 flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>
      </div>

      <div className="flex-1 flex items-start justify-center p-4 pt-8">
        <div className="w-full max-w-xl">
          {/* Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h1 className="text-foreground">Anonymous Report</h1>
              <p className="text-muted-foreground text-sm">Sexual Harassment / Gender-Based Violence</p>
            </div>
          </div>

          {/* Anonymity notice */}
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 mb-6 flex items-start gap-3">
            <Lock className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">No identity information is collected</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                This form is fully anonymous. Your report goes directly to the IIC without any identifying details.
              </p>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 space-y-5">
            {/* Incident details — optional */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Date of Incident
                  <span className="ml-1 text-xs text-muted-foreground font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="date"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Location
                  <span className="ml-1 text-xs text-muted-foreground font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={incidentLocation}
                    onChange={(e) => setIncidentLocation(e.target.value)}
                    placeholder="e.g. Library block B"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Describe the Incident <span className="text-destructive">*</span>
              </label>
              <textarea
                rows={6}
                value={description}
                onChange={(e) => { setDescription(e.target.value); setDescError(''); }}
                placeholder="Describe what happened in as much detail as you are comfortable sharing. Your identity remains completely anonymous."
                className={`w-full px-3 py-2.5 rounded-lg border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm placeholder:text-muted-foreground resize-none ${descError ? 'border-destructive' : 'border-border'}`}
              />
              {descError && <p className="text-destructive text-xs mt-1">{descError}</p>}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={handleSubmit}
                className="flex-1 py-3 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-all font-medium shadow-md"
              >
                Submit Anonymous Report
              </button>
              <button
                onClick={onBack}
                className="px-5 py-3 border border-border rounded-lg text-foreground hover:bg-accent/30 transition-all text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Location Prompt for Emergency Cases */}
      {showLocationPrompt && (
        <LocationPrompt
          onLocationShared={handleLocationShared}
          onSkip={handleSkipLocation}
        />
      )}
    </div>
  );
}
