import { useState, useRef, useEffect } from 'react';
import {
  AlertTriangle, ShieldAlert, FileText, ChevronRight, CheckCircle2,
  ArrowLeft, User, Info, Clock, CheckCircle, AlertCircle,
  Ticket, Paperclip, X, Download, FileIcon,
} from 'lucide-react';
import { CaseReport, CaseCategory, GeneralSubCategory, LocationData, CaseTimelineStage } from '../../types';
import { categorizeCaseReport, getCaseReportRouting, isSensitiveCaseCategory, type CaseCategory as CategorizationCaseCategory } from '../../utils/categorization';
import { LocationPrompt } from '../LocationPrompt';
import { caseApi } from '../../services/caseApi';

interface CaseReportsPageProps {
  onSubmitReport: (report: Omit<CaseReport, 'id' | 'status' | 'createdAt'>) => Promise<CaseReport | void>;
  submittedReports: CaseReport[];
  studentEmail: string;
  studentId: string;
  studentName?: string;
  openFormDirectly?: boolean;
}

type FormStep = 'select-category' | 'fill-form' | 'success';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 5;

const SUB_CATEGORY_LABELS: Record<GeneralSubCategory, string> = {
  fees_support: 'Fees Support',
  living_expenses: 'Living Expenses',
  others: 'Others',
};

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-info/10 text-info',
  acknowledged: 'bg-primary/10 text-primary',
  preliminary_review: 'bg-warning/10 text-warning-foreground',
  ongoing_investigation: 'bg-info/10 text-info',
  investigation_complete: 'bg-success/10 text-success',
  findings_under_review: 'bg-accent/20 text-accent-foreground',
  referred_to_disciplinary_hearing: 'bg-destructive/10 text-destructive',
  awaiting_disciplinary_hearing: 'bg-warning/10 text-warning-foreground',
  under_review: 'bg-warning/10 text-warning-foreground',
  verdict_served: 'bg-success/10 text-success',
  appealed: 'bg-destructive/10 text-destructive',
};

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  acknowledged: 'Acknowledged',
  preliminary_review: 'Preliminary Review',
  ongoing_investigation: 'Ongoing Investigation',
  investigation_complete: 'Investigation Complete',
  findings_under_review: 'Findings Under Review',
  referred_to_disciplinary_hearing: 'Referred to Disciplinary Hearing',
  awaiting_disciplinary_hearing: 'Awaiting Disciplinary Hearing',
  under_review: 'Under Review',
  verdict_served: 'Verdict Served',
  appealed: 'Appealed',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getHandlerForCase(report: CaseReport): string {
  const category = (report.detailedCategory || report.category) as CategorizationCaseCategory;
  const routing = getCaseReportRouting(category);

  // Calculate days since submission for dynamic handler assignment
  const createdAt = report.createdAt instanceof Date ? report.createdAt : new Date(report.createdAt);
  const now = new Date();
  const daysSinceSubmission = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

  switch (routing) {
    case 'iic':
      if (daysSinceSubmission <= 7) return 'Investigator (IIC)';
      if (daysSinceSubmission <= 21) return 'IIC - Under Investigation';
      if (daysSinceSubmission <= 28) return 'IIC - Report Review';
      return 'Disciplinary Committee';
    case 'registrar':
      if (daysSinceSubmission <= 7) return 'Registrar - Preliminary Review';
      return 'Registrar - Processing';
    case 'disciplinary':
      if (daysSinceSubmission <= 14) return 'Disciplinary Committee';
      return 'Disciplinary - Hearing Scheduled';
    default: // dean
      if (daysSinceSubmission <= 7) return 'Dean - Preliminary Review';
      if (daysSinceSubmission <= 21) return 'Dean - Investigation';
      return 'Dean - Awaiting Action';
  }
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    financial_aid: 'Financial Aid',
    sexual_harassment: 'Sexual Harassment',
    gbv: 'Gender-Based Violence',
    sexual_assault: 'Sexual Assault',
    physical_assault: 'Physical Assault',
    stalking: 'Stalking',
    cyberbullying: 'Cyberbullying',
    academic_misconduct: 'Academic Misconduct',
    discrimination: 'Discrimination',
    health_services: 'Health Services',
    housing: 'Housing',
    substance_abuse: 'Substance Abuse',
    mental_health: 'Mental Health',
    relationship_violence: 'Relationship Violence',
    general: 'General',
  };
  return labels[category] || category;
}

export function CaseReportsPage({ onSubmitReport, submittedReports, studentEmail, studentId, studentName, openFormDirectly }: CaseReportsPageProps) {
  const [step, setStep] = useState<FormStep>('select-category');
  const [selectedCategory, setSelectedCategory] = useState<CaseCategory | null>(null);

  useEffect(() => {
    if (openFormDirectly) {
      setSelectedCategory('general');
      setStep('fill-form');
    }
  }, [openFormDirectly]);
  const [subCategory, setSubCategory] = useState<GeneralSubCategory>('fees_support');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [formStudentName, setFormStudentName] = useState(studentName ?? '');
  const [formStudentId, setFormStudentId] = useState(studentId ?? '');
  const [formStudentEmail, setFormStudentEmail] = useState(studentEmail ?? '');
  const [studentPhone, setStudentPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentTime, setIncidentTime] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [reportedBy, setReportedBy] = useState<'victim'|'witness'|'friend'>('victim');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [lastTicketNumber, setLastTicketNumber] = useState<string | undefined>();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [selectedCaseForTimeline, setSelectedCaseForTimeline] = useState<CaseReport | null>(null);
  const [timeline, setTimeline] = useState<CaseTimelineStage[] | null>(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const descriptionSuggestion = description.trim() ? categorizeCaseReport(description).category : 'general';
  const resolvedCategory = (selectedCategory === 'general' ? descriptionSuggestion : selectedCategory) as CaseCategory | null;
  const showSensitiveFields = isSensitiveCaseCategory(resolvedCategory);

  useEffect(() => {
    if (!showSensitiveFields) {
      setEvidenceFiles([]);
      setReportedBy('victim');
      setIncidentDate('');
      setIncidentTime('');
      setIncidentLocation('');
    }
  }, [showSensitiveFields]);

  const resetForm = () => {
    setStep('select-category');
    setSelectedCategory(null);
    setSubCategory('fees_support');
    setDescription('');
    setFormStudentName(studentName ?? '');
    setFormStudentId(studentId ?? '');
    setFormStudentEmail(studentEmail ?? '');
    setStudentPhone('');
    setDepartment('');
    setYearOfStudy('');
    setIncidentDate('');
    setIncidentTime('');
    setIncidentLocation('');
    setReportedBy('victim');
    setEvidenceFiles([]);
    setFileErrors([]);
    setErrors({});
    setSubmitting(false);
    setShowSuccessModal(false);
    setLastTicketNumber(undefined);
    setShowLocationPrompt(false);
    setLocationData(null);
    setSelectedCaseForTimeline(null);
    setTimeline(null);
    setSubject('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const errs: string[] = [];
    const valid: File[] = [];

    const combined = [...evidenceFiles, ...selected];
    if (combined.length > MAX_FILES) {
      errs.push(`You can attach a maximum of ${MAX_FILES} files.`);
      e.target.value = '';
      setFileErrors(errs);
      return;
    }

    for (const file of selected) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errs.push(`"${file.name}" is not a supported file type (JPEG, PNG, PDF, DOCX only).`);
      } else if (file.size > MAX_FILE_SIZE) {
        errs.push(`"${file.name}" exceeds the 10 MB size limit (${formatFileSize(file.size)}).`);
      } else {
        valid.push(file);
      }
    }

    setFileErrors(errs);
    if (valid.length) setEvidenceFiles(prev => [...prev, ...valid]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!description.trim()) e.description = 'Please describe the situation.';

    if (showSensitiveFields) {
      if (!incidentDate.trim()) e.incidentDate = 'Please provide the date of the incident.';
      else {
        // Check if date is in the future
        const selectedDate = new Date(incidentDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);
        if (selectedDate > today) {
          e.incidentDate = 'The incident date cannot be in the future. Please select today or an earlier date.';
        }
      }
      if (!incidentTime.trim()) e.incidentTime = 'Please provide the time of the incident.';
      if (!incidentLocation.trim()) e.incidentLocation = 'Please provide the location of the incident.';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate() || !selectedCategory || submitting) return;
    if (fileErrors.length) return;
    const categorization = categorizeCaseReport(description);
    if (categorization.requiresLocationSharing && !locationData) {
      setShowLocationPrompt(true);
      return;
    }
    doSubmit();
  };

  const doSubmit = async () => {
    const category = (resolvedCategory || selectedCategory || 'general') as CaseCategory;
    setSubmitting(true);

    const isGBV = isSensitiveCaseCategory(category);
    const report: Omit<CaseReport, 'id' | 'status' | 'createdAt'> = {
      subject: subject || undefined,
      category,
      description,
      subCategory: category === 'general' ? subCategory : undefined,
      studentName: studentName || undefined,
      studentId: studentId || undefined,
      studentEmail: studentEmail || undefined,
      ...(showSensitiveFields && reportedBy ? { reportedByType: reportedBy } : {}),
      incidentDate: isGBV ? (incidentDate || undefined) : undefined,
      incidentTime: isGBV ? (incidentTime || undefined) : undefined,
      incidentLocation: isGBV ? (incidentLocation || undefined) : undefined,
      ...(locationData && { location: locationData }),
      ...(showSensitiveFields && evidenceFiles.length > 0 && { evidenceFiles: evidenceFiles as unknown as CaseReport['evidenceFiles'] }),
    };

    try {
      const created = await onSubmitReport(report);
      const ticketNumber = (created as CaseReport)?.ticketNumber;

      setDescription('');
      setSubject('');
      setIncidentDate('');
      setIncidentTime('');
      setIncidentLocation('');
      setReportedBy('victim');
      setEvidenceFiles([]);
      setFileErrors([]);
      setErrors({});
      setShowLocationPrompt(false);
      setLocationData(null);
      setSelectedCaseForTimeline(null);
      setTimeline(null);
      setLastTicketNumber(ticketNumber);
      setShowSuccessModal(true);
      setStep('select-category');
      setSelectedCategory(null);
    } catch {
      setErrors({ submit: 'Failed to submit report. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLocationShared = (location: LocationData) => {
    setLocationData(location);
    setShowLocationPrompt(false);
    doSubmit();
  };

  const handleSkipLocation = () => {
    setShowLocationPrompt(false);
    doSubmit();
  };

  const myReports = submittedReports.filter((r) => {
    const isMyCase = r.studentId === studentId || r.studentEmail === studentEmail;
    return isMyCase && !(
      isSensitiveCaseCategory(r.category) && r.isAnonymous
    );
  });

  const handleViewTimeline = async (report: CaseReport) => {
    setSelectedCaseForTimeline(report);
    setLoadingTimeline(true);
    setTimeline(null);
    try {
      const timelineData = await caseApi.getTimeline(report.id);
      setTimeline(timelineData.stages);
    } catch {
      setTimeline([]);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const getStageStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle className="w-5 h-5 text-success" />;
    if (status === 'overdue') return <AlertCircle className="w-5 h-5 text-destructive" />;
    return <Clock className="w-5 h-5 text-muted-foreground" />;
  };

  const getStageStatusColor = (status: string | null | undefined) => {
    if (status === 'completed') return 'border-success/30 bg-success/5';
    if (status === 'overdue') return 'border-destructive/30 bg-destructive/5';
    return 'border-border bg-card';
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (step === 'success') {
    const isGBV = selectedCategory != null && isSensitiveCaseCategory(selectedCategory);
    return (
      <div className="min-h-screen bg-background py-8 sm:py-12 px-3 sm:px-4 overflow-x-hidden">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-success/15 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h1 className="mb-3 text-foreground">Case recorded successfully</h1>

          {lastTicketNumber && (
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-xl px-5 py-3 mb-6">
              <Ticket className="w-5 h-5 text-primary" />
              <div className="text-left">
                <p className="text-xs text-muted-foreground">Your Case Ticket Number</p>
                <p className="text-lg font-bold text-primary tracking-widest">{lastTicketNumber}</p>
              </div>
            </div>
          )}

          <p className="text-muted-foreground mb-6 leading-relaxed">
            Redirecting you to your cases...
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => { setStep('select-category'); setSelectedCategory(null); }}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-semibold shadow-lg text-base">
              Case Progress
            </button>
            <button onClick={resetForm}
              className="px-8 py-3 border-2 border-primary/30 text-primary rounded-xl hover:border-primary hover:bg-primary/5 transition-colors font-medium text-base">
              Submit Another Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Fill form screen ───────────────────────────────────────────────────────
  if (step === 'fill-form' && selectedCategory) {
    const isGBV = isSensitiveCaseCategory(resolvedCategory);
    return (
      <div className="min-h-screen bg-background py-6 sm:py-10 px-3 sm:px-4 overflow-x-hidden">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => setStep('select-category')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {/* Header banner - matching landing page hero gradient */}
          <div className="relative overflow-hidden rounded-2xl p-6 sm:p-7 mb-8 border border-border"
               style={{ background: 'linear-gradient(135deg, #e8f5e9 0%, #f0fdf4 100%)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-10 -mt-10 blur-2xl" />
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Report a case: You are not alone, and we will help you through this.</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Sharing what happened with us is a brave first step. We will listen with care, guide your report to the right support team, and help ensure your concern is addressed with compassion and urgency.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-sm space-y-6">
            {errors.submit && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{errors.submit}</div>
            )}


            {isGBV && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Date of Incident <span className="text-destructive">*</span>
                  </label>
                  <input type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 py-2.5 rounded-lg border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm ${errors.incidentDate ? 'border-destructive' : 'border-border'}`} />
                  {errors.incidentDate && <p className="text-destructive text-xs mt-1">{errors.incidentDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Time of Incident <span className="text-destructive">*</span>
                  </label>
                  <input type="time" value={incidentTime} onChange={(e) => setIncidentTime(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-lg border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm ${errors.incidentTime ? 'border-destructive' : 'border-border'}`} />
                  {errors.incidentTime && <p className="text-destructive text-xs mt-1">{errors.incidentTime}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Location <span className="text-destructive">*</span>
                  </label>
                  <input type="text" value={incidentLocation} onChange={(e) => setIncidentLocation(e.target.value)}
                    placeholder="e.g. Library block B"
                    className={`w-full px-3 py-2.5 rounded-lg border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm placeholder:text-muted-foreground ${errors.incidentLocation ? 'border-destructive' : 'border-border'}`} />
                  {errors.incidentLocation && <p className="text-destructive text-xs mt-1">{errors.incidentLocation}</p>}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Subject <span className="text-xs text-muted-foreground font-normal">(short summary)</span></label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief subject or title"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm placeholder:text-muted-foreground" />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Description <span className="text-destructive">*</span></label>
              <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder={showSensitiveFields ? 'Describe the incident in as much detail as you are comfortable sharing.' : 'Describe your situation and what support you are seeking...'}
                className={`w-full px-3 py-2.5 rounded-lg border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm placeholder:text-muted-foreground resize-none ${errors.description ? 'border-destructive' : 'border-border'}`} />
              {errors.description && <p className="text-destructive text-xs mt-1">{errors.description}</p>}
              {description.trim() && selectedCategory === 'general' && descriptionSuggestion !== 'general' && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Suggested category: <span className="font-semibold text-foreground">{getCategoryLabel(descriptionSuggestion)}</span>. If this looks right, please choose that category before submitting so the report can receive appropriate sensitive handling.
                </p>
              )}
            </div>

            {showSensitiveFields && (
              <>
                {/* Evidence upload */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Evidence / Supporting Documents
                    <span className="ml-1 text-xs text-muted-foreground font-normal">(optional, up to 5 files, max 10 MB each)</span>
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors flex flex-col items-center gap-2 text-center">
                    <Paperclip className="w-6 h-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to attach files</p>
                    <p className="text-xs text-muted-foreground">JPEG, PNG, PDF, DOCX · max 10 MB each · up to 5 files</p>
                  </div>
                  <input ref={fileInputRef} type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.docx"
                    onChange={handleFileChange} className="hidden" />

                  {fileErrors.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {fileErrors.map((err, i) => <p key={i} className="text-destructive text-xs">{err}</p>)}
                    </div>
                  )}

                  {evidenceFiles.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {evidenceFiles.map((file, i) => (
                        <li key={i} className="flex items-center gap-3 bg-accent/20 rounded-lg px-3 py-2 text-sm">
                          <FileIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="flex-1 truncate text-foreground">{file.name}</span>
                          <span className="text-muted-foreground text-xs shrink-0">{formatFileSize(file.size)}</span>
                          <button type="button" onClick={() => removeFile(i)}
                            className="text-muted-foreground hover:text-destructive transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}


            {showSensitiveFields && (
              <div className="border-t border-border pt-6">
                <label className="block text-sm font-medium text-foreground mb-2">Reported by <span className="text-destructive">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: 'victim', label: 'Victim' },
                    { value: 'witness', label: 'Witness' },
                    { value: 'friend', label: 'Concerned Friend' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setReportedBy(opt.value as 'victim' | 'witness' | 'friend')}
                      aria-pressed={reportedBy === opt.value}
                      className={`py-2.5 rounded-lg border text-sm transition-all ${
                        reportedBy === opt.value
                          ? 'border-primary bg-primary/10 text-primary font-medium shadow-sm'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 py-3.5 rounded-xl font-medium text-sm transition-all shadow-md disabled:opacity-60 bg-primary text-primary-foreground hover:bg-primary/90">
                {submitting ? 'Submitting…' : 'Submit Report'}
              </button>
              <button onClick={() => setStep('select-category')}
                className="px-6 py-3.5 border-2 border-primary/30 text-primary rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-sm font-medium">
                Cancel
              </button>
            </div>
          </div>
        </div>
        {showLocationPrompt && <LocationPrompt onLocationShared={handleLocationShared} onSkip={handleSkipLocation} />}
      </div>
    );
  }

  // ── Cases list view ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background py-6 sm:py-10 px-3 sm:px-4 overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
                <CheckCircle2 className="h-7 w-7 text-success" />
              </div>
              <h2 className="text-center text-xl font-semibold text-foreground">Case recorded successfully</h2>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Your report has been submitted and is now visible in My Cases for tracking.
              </p>
              {lastTicketNumber && (
                <div className="mt-4 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-center text-sm text-primary">
                  Ticket: {lastTicketNumber}
                </div>
              )}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Continue to My Cases
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Timeline drawer */}
        {selectedCaseForTimeline && (
          <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50 flex justify-end">
            <div className="bg-card w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-foreground">Case Timeline</h2>
                  {selectedCaseForTimeline.ticketNumber && (
                    <p className="text-xs text-primary font-mono mt-0.5">{selectedCaseForTimeline.ticketNumber}</p>
                  )}
                </div>
                <button onClick={() => setSelectedCaseForTimeline(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent transition-colors text-muted-foreground">✕</button>
              </div>

              <div className="p-5 flex-1">
                {loadingTimeline ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">Loading timeline…</div>
                ) : timeline && timeline.length > 0 ? (
                  <div className="space-y-3">
                    {timeline.map((stage, i) => (
                      <div key={i} className={`rounded-lg border p-4 ${getStageStatusColor(stage.status)}`}>
                        <div className="flex items-center gap-3 mb-2">
                          {getStageStatusIcon(stage.status)}
                          <p className="font-medium text-foreground text-sm">{stage.label}</p>
                        </div>
                        {stage.assignedRole && <p className="text-xs text-muted-foreground">Assigned: {stage.assignedRole}</p>}
                        {stage.completedAt && <p className="text-xs text-success">Completed: {new Date(stage.completedAt).toLocaleDateString()}</p>}
                        {stage.dueAt && !stage.completedAt && <p className="text-xs text-muted-foreground">Due: {new Date(stage.dueAt).toLocaleDateString()}</p>}
                        {stage.overdueBy && <p className="text-xs text-destructive">Overdue by {stage.overdueBy}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No timeline stages available yet.</p>
                )}

                {selectedCaseForTimeline.evidenceFiles && selectedCaseForTimeline.evidenceFiles.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-foreground mb-3 text-sm font-medium">Attached Evidence</h3>
                    <ul className="space-y-2">
                      {selectedCaseForTimeline.evidenceFiles.map((f, i) => (
                        <li key={i} className="flex items-center gap-3 bg-accent/20 rounded-lg px-3 py-2 text-sm">
                          <FileIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="flex-1 truncate text-foreground">{f.name}</span>
                          <span className="text-muted-foreground text-xs shrink-0">{formatFileSize(f.size)}</span>
                          <a href={f.url} download={f.name} target="_blank" rel="noreferrer"
                            className="text-primary hover:text-primary/80 transition-colors">
                            <Download className="w-4 h-4" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="mb-2 text-2xl font-semibold text-foreground">My Cases</h1>
            <p className="text-muted-foreground text-sm">Track all your submitted cases and their current status.</p>
          </div>
          <button onClick={() => { setSelectedCategory('general'); setStep('fill-form'); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
            <FileText className="w-4 h-4" /> Report New Case
          </button>
        </div>

        {/* Cases Table */}
        {myReports.length > 0 ? (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Header */}
            <div className="hidden md:grid grid-cols-6 gap-4 px-6 py-4 bg-muted/30 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div>Title</div>
              <div>Case Number</div>
              <div>Category</div>
              <div>Submitted</div>
              <div>Handler</div>
              <div>Status</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border">
              {myReports.map((r) => (
                <div key={r.id} onClick={() => handleViewTimeline(r)}
                  className="grid grid-cols-1 md:grid-cols-6 gap-2 md:gap-4 px-4 md:px-6 py-4 cursor-pointer hover:bg-accent/20 transition-colors items-center">

                  {/* Mobile layout */}
                  <div className="md:hidden flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.subject || r.description?.slice(0, 50) || 'Untitled'}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {r.ticketNumber && (
                          <span className="inline-flex items-center gap-1 text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            <Ticket className="w-3 h-3" />{r.ticketNumber}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 ml-2" />
                  </div>
                  <div className="md:hidden grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Category: </span>
                      <span className="text-xs font-medium">{getCategoryLabel(r.category)}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Status: </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status] ?? 'bg-muted text-muted-foreground'}`}>
                        {STATUS_LABELS[r.status] ?? r.status}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs text-muted-foreground">Handler: </span>
                      <span className="text-xs font-medium">{getHandlerForCase(r)}</span>
                    </div>
                  </div>

                  {/* Desktop columns */}
                  <div className="hidden md:block">
                    <p className="text-sm text-foreground truncate">{r.subject || r.description?.slice(0, 50) || 'Untitled'}</p>
                  </div>
                  <div className="hidden md:block">
                    {r.ticketNumber ? (
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        <Ticket className="w-3 h-3" />{r.ticketNumber}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                  <div className="hidden md:block">
                    <span className="text-xs text-foreground">{getCategoryLabel(r.detailedCategory || r.category)}</span>
                  </div>
                  <div className="hidden md:block">
                    <span className="text-xs text-muted-foreground">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</span>
                  </div>
                  <div className="hidden md:block">
                    <span className="text-xs text-foreground font-medium">{getHandlerForCase(r)}</span>
                  </div>
                  <div className="hidden md:block">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[r.status] ?? 'bg-muted text-muted-foreground'}`}>
                      {STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-foreground mb-2">No Cases Yet</h3>
            <p className="text-muted-foreground text-sm mb-6">You haven't submitted any cases yet.</p>
            <button onClick={() => { setSelectedCategory('general'); setStep('fill-form'); }}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm">
              Report Your First Case
            </button>
          </div>
        )}

        {/* Submission count */}
        {myReports.length > 0 && (
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Showing {myReports.length} case{myReports.length !== 1 ? 's' : ''} · Click any case to view detailed timeline
          </p>
        )}
      </div>
    </div>
  );
}

