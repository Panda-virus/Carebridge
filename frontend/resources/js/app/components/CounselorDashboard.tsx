import { useState } from 'react';
import { CounselingRequest, CounselorSchedule, CounselingSession, ExternalCounselor } from '../types';
import { PendingRequests } from './PendingRequests';
import { ActiveSessions } from './ActiveSessions';
import { CompletedCases } from './counselor/CompletedCases';
import { ReferredCases } from './counselor/ReferredCases';
import { DismissedCases } from './counselor/DismissedCases';
import { ScheduleManagement } from './counselor/ScheduleManagement';
import { FirstLoginScheduleModal } from './counselor/FirstLoginScheduleModal';
import { EmergencyCounselingAlert } from './alerts/EmergencyAlert';
import { CounselorNavbar } from './counselor/CounselorNavbar';
import { Calendar, Clock, CheckCircle, Users, CalendarClock } from 'lucide-react';

interface CounselorDashboardProps {
  counselorId: string;
  counselorName: string;
  requests: CounselingRequest[];
  currentSchedule?: CounselorSchedule;
  sessions: CounselingSession[];
  externalCounselors: ExternalCounselor[];
  onScheduleRequest: (
    requestId: string,
    scheduledDate: Date,
    scheduledTime: string,
    totalSessions: 6 | 8
  ) => void;
  onApproveSchedule: (requestId: string) => void;
  onRejectSchedule: (requestId: string) => void;
  onManualSchedule: (requestId: string, date: Date, time: string) => void;
  onRejectRequest: (requestId: string) => void;
  onUpdateProgress: (requestId: string, completedSessions: number, notes: string, score: number) => void;
  onCompleteWithRecommendations: (requestId: string, recommendations: string) => void;
  onReferExternal: (requestId: string, reason: string, externalInfo: string) => void;
  onDismissCase: (requestId: string, reason: string) => void;
  onSaveSchedule: (schedule: CounselorSchedule) => void;
  showScheduleSetupModal?: boolean;
  onScheduleSetupComplete?: () => void;
  onLogout: () => void;
}

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getOfficeStaffLabel(dayOfWeek: number) {
  if (dayOfWeek === 2 || dayOfWeek === 4) {
    return 'Chaplain';
  }
  if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
    return 'University Counsellor';
  }
  return 'No scheduled staff';
}

function formatScheduleSummary(schedule?: CounselorSchedule) {
  if (!schedule?.availableSlots?.length) {
    return 'No office hours have been set yet.';
  }

  return schedule.availableSlots
    .slice()
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    .map((slot) => {
      const staff = getOfficeStaffLabel(slot.dayOfWeek);
      return `${DAY_LABELS[slot.dayOfWeek] || 'Day'} • ${slot.startTime}–${slot.endTime} • ${staff}`;
    })
    .join(' • ');
}

export function CounselorDashboard({
  counselorId,
  counselorName,
  requests,
  currentSchedule,
  onScheduleRequest,
  onApproveSchedule,
  onRejectSchedule,
  onManualSchedule,
  onRejectRequest,
  onUpdateProgress,
  onCompleteWithRecommendations,
  onReferExternal,
  onDismissCase,
  onSaveSchedule,
  sessions,
  externalCounselors,
  showScheduleSetupModal,
  onScheduleSetupComplete,
  onLogout,
}: CounselorDashboardProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'cases' | 'schedule' | 'settings'>('home');
  const [activeCaseSubTab, setActiveCaseSubTab] = useState<'pending' | 'active' | 'completed' | 'referred' | 'dismissed'>('pending');

  const emergencyRequests = requests.filter(r => r.requiresImmediateAttention && r.status === 'pending_review');
  const pendingRequests = requests.filter(r =>
    ['pending_review', 'pending_approval', 'student_approved', 'counselor_approved', 'approval_rejected'].includes(r.status)
  );
  const activeRequests = requests.filter(r =>
    ['scheduled', 'in_progress'].includes(r.status)
  );
  const completedRequests = requests.filter(r => r.status === 'completed');
  const referredRequests = requests.filter(r => r.status === 'referred');
  const dismissedRequests = requests.filter(r => r.status === 'rejected');

  const handleCallStudent = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleCaseSubTabChange = (tab: 'pending' | 'active' | 'completed' | 'referred' | 'dismissed') => {
    setActiveCaseSubTab(tab);
    setActiveTab('cases');
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {showScheduleSetupModal && onScheduleSetupComplete && (
        <FirstLoginScheduleModal
          counselorId={counselorId}
          counselorName={counselorName}
          currentSchedule={currentSchedule}
          onSaveSchedule={onSaveSchedule}
          onComplete={onScheduleSetupComplete}
        />
      )}
      <CounselorNavbar
        counselorName={counselorName}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeCaseSubTab={activeCaseSubTab}
        onCaseSubTabChange={handleCaseSubTabChange}
        onLogout={onLogout}
      />

      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-8">
        {activeTab === 'home' && (
          <>
            <div className="mb-8">
              <h1 className="mb-2 text-foreground">Counselor Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {counselorName}</p>
            </div>

            {/* Emergency Alerts Section */}
            {emergencyRequests.length > 0 && (
              <div className="mb-8 space-y-4">
                {emergencyRequests.map(request => (
                  <EmergencyCounselingAlert
                    key={request.id}
                    request={request}
                    onCallStudent={handleCallStudent}
                  />
                ))}
              </div>
            )}

            <div className="bg-card border border-border rounded-2xl p-5 mb-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Weekly office hours</p>
                  <p className="mt-1 text-sm text-muted-foreground">Students will see these slots when counseling appointments are proposed.</p>
                </div>
                <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {currentSchedule?.availableSlots?.length ? `${currentSchedule.availableSlots.length} time blocks` : 'Not set'}
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-foreground">
                {currentSchedule?.availableSlots?.length ? (
                  currentSchedule.availableSlots
                    .slice()
                    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                    .map((slot, index) => (
                      <div key={`${slot.dayOfWeek}-${slot.startTime}-${index}`} className="flex flex-col gap-1 rounded-lg border border-border/70 bg-background/60 px-3 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium">{DAY_LABELS[slot.dayOfWeek] || 'Day'}</span>
                          <span className="text-muted-foreground">{slot.startTime}–{slot.endTime}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">{getOfficeStaffLabel(slot.dayOfWeek)}</div>
                      </div>
                    ))
                ) : (
                  <p className="rounded-lg border border-dashed border-border px-3 py-3 text-muted-foreground">No office hours have been set yet.</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <button
                onClick={() => {
                  handleCaseSubTabChange('pending');
                }}
                className="bg-card rounded-xl p-6 border border-border text-left hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pending</p>
                    <p className="text-foreground">{pendingRequests.length}</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  handleCaseSubTabChange('active');
                }}
                className="bg-card rounded-xl p-6 border border-border text-left hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-muted-foreground">Active</p>
                    <p className="text-foreground">{activeRequests.length}</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  handleCaseSubTabChange('completed');
                }}
                className="bg-card rounded-xl p-6 border border-border text-left hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-muted-foreground">Completed</p>
                    <p className="text-foreground">{completedRequests.length}</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('cases');
                  setActiveCaseSubTab('pending');
                }}
                className="bg-card rounded-xl p-6 border border-border text-left hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-accent/30 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Cases</p>
                    <p className="text-foreground">{requests.length}</p>
                  </div>
                </div>
              </button>
            </div>

            {activeRequests.length > 0 && (
              <div className="mb-6 sm:mb-8">
                <h2 className="text-lg font-medium text-foreground mb-4">Patients Currently Being Helped</h2>
                <div className="bg-card rounded-xl border border-border overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase border-b border-border">
                      <tr>
                        <th className="px-4 py-3">Full Name</th>
                        <th className="px-4 py-3">Case</th>
                        <th className="px-4 py-3">Phone Number</th>
                        <th className="px-4 py-3">Email Address</th>
                        <th className="px-4 py-3">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeRequests.map((request) => (
                        <tr key={request.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-3 text-foreground font-medium">{request.studentName}</td>
                          <td className="px-4 py-3 text-foreground capitalize">{request.category || 'General'}</td>
                          <td className="px-4 py-3 text-foreground">{request.studentPhone || '—'}</td>
                          <td className="px-4 py-3 text-foreground">{request.studentEmail}</td>
                          <td className="px-4 py-3 text-foreground">{request.studentLocation || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'cases' && (
          <>
            {activeCaseSubTab === 'pending' && (
              <PendingRequests
                requests={pendingRequests}
                counselorId={counselorId}
                counselorName={counselorName}
                onSchedule={onScheduleRequest}
                onApprove={onApproveSchedule}
                onRejectSchedule={onRejectSchedule}
                onReject={onRejectRequest}
                onManualSelect={onManualSchedule}
              />
            )}
            {activeCaseSubTab === 'active' && (
              <ActiveSessions
                requests={activeRequests}
                sessions={sessions}
                externalCounselors={externalCounselors}
                onUpdateProgress={onUpdateProgress}
                onCompleteWithRecommendations={onCompleteWithRecommendations}
                onReferExternal={onReferExternal}
                onDismissCase={onDismissCase}
              />
            )}
            {activeCaseSubTab === 'completed' && (
              <CompletedCases requests={completedRequests} />
            )}
            {activeCaseSubTab === 'referred' && (
              <ReferredCases requests={referredRequests} externalCounselors={externalCounselors} />
            )}
            {activeCaseSubTab === 'dismissed' && (
              <DismissedCases requests={dismissedRequests} />
            )}
          </>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-sm font-medium text-foreground">Current weekly office hours</p>
              <p className="mt-1 text-sm text-muted-foreground">{formatScheduleSummary(currentSchedule)}</p>
            </div>
            <ScheduleManagement
              counselorId={counselorId}
              counselorName={counselorName}
              currentSchedule={currentSchedule}
              onSaveSchedule={onSaveSchedule}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-card rounded-xl p-12 border border-border text-center">
            <h3 className="text-foreground mb-2">Settings</h3>
            <p className="text-muted-foreground">Settings panel coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
