import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CounselingRequest, CaseReport, CounselorSchedule } from '../types';
import { StudentNavbar } from './student/StudentNavbar';
import { StudentHome } from './student/StudentHome';
import { CounsellingPage } from './student/CounsellingPage';
import { CaseReportsPage } from './student/CaseReportsPage';
import { ProfilePage, ProfileData } from './student/ProfilePage';
import { SettingsPage } from './student/SettingsPage';
import { NotificationsPage } from './student/NotificationsPage';
import { CounselingRequestModal } from './student/CounselingRequestModal';
import { CareBridgeChatbot } from './chatbot/CareBridgeChatbot';

interface StudentDashboardProps {
  studentId: string;
  userName: string;
  studentEmail: string;
  requests: CounselingRequest[];
  allCounselingRequests: CounselingRequest[];
  counselorSchedule: CounselorSchedule;
  caseReports: CaseReport[];
  initialPage?: string;
  showCaseReportModal?: boolean;
  onCloseCaseReportModal?: () => void;
  onRequestSession: (request: Omit<CounselingRequest, 'id' | 'status' | 'createdAt'>) => void;
  onApproveSchedule: (requestId: string) => void;
  onRejectSchedule: (requestId: string) => void;
  onManualSchedule: (requestId: string, date: Date, time: string) => void;
  onAcceptSchedule: (requestId: string) => void;
  onSubmitCaseReport: (report: Omit<CaseReport, 'id' | 'status' | 'createdAt'>) => Promise<CaseReport | void>;
  onSaveProfile: (profileData: ProfileData) => Promise<void>;
  onLogout: () => void;
}

export function StudentDashboard({
  studentId,
  userName,
  studentEmail,
  requests,
  allCounselingRequests,
  counselorSchedule,
  caseReports,
  initialPage,
  showCaseReportModal,
  onCloseCaseReportModal,
  onRequestSession,
  onApproveSchedule,
  onRejectSchedule,
  onManualSchedule,
  onAcceptSchedule,
  onSubmitCaseReport,
  onSaveProfile,
  onLogout,
}: StudentDashboardProps) {
  const [currentPage, setCurrentPage] = useState(initialPage ?? 'home');
  const [showCounselingModal, setShowCounselingModal] = useState(false);
  const [caseReportsViewKey, setCaseReportsViewKey] = useState(0);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [chatbotResetKey, setChatbotResetKey] = useState(0);

  const openCounselingModal = () => setShowCounselingModal(true);
  const openChatbot = () => {
    setChatbotResetKey((value) => value + 1);
    setChatbotOpen(true);
  };

  const handleNavigate = (page: string) => {
    if (page === 'case-reports') {
      // Navigate to the cases list view. Do not auto-open the report form.
      setCurrentPage('case-reports');
      return;
    }
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'notifications':
        return <NotificationsPage caseReports={caseReports} />;
      case 'home':
        return <StudentHome onNavigate={handleNavigate} onRequestCounseling={openCounselingModal} onStartChat={openChatbot} />;
      case 'profile':
        return (
          <ProfilePage
            studentId={studentId}
            userName={userName}
            userEmail={studentEmail}
            onSaveProfile={onSaveProfile}
            onDeleteAccount={onLogout}
          />
        );
      case 'counselling':
        return (
          <CounsellingPage
            requests={requests}
            onRequestCounseling={openCounselingModal}
            onAcceptSchedule={onAcceptSchedule}
            onApproveSchedule={onApproveSchedule}
            onRejectSchedule={onRejectSchedule}
            onManualSchedule={onManualSchedule}
          />
        );
      case 'case-reports':
        return (
          <CaseReportsPage
            key={caseReportsViewKey}
            onSubmitReport={onSubmitCaseReport}
            submittedReports={caseReports}
            studentEmail={studentEmail}
            studentId={studentId}
            studentName={userName}
            openFormDirectly={currentPage === 'case-reports' && caseReportsViewKey > 0}
          />
        );
      case 'settings':
        return <SettingsPage studentId={studentId} userName={userName} userEmail={studentEmail} />;
      default:
        return <StudentHome onNavigate={handleNavigate} onRequestCounseling={openCounselingModal} onStartChat={openChatbot} />;
    }
  };

  const pageTransition = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.22, ease: 'easeOut' as const },
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_rgba(39,155,55,0.12),_transparent_24%),linear-gradient(180deg,_#f8fdf8_0%,_#ffffff_100%)]">
      <StudentNavbar
        currentPage={currentPage}
        userName={userName}
        onNavigate={handleNavigate}
        onLogout={onLogout}
      />
      <div className="min-h-screen px-3 py-4 pt-20 sm:px-5 sm:py-6 sm:pt-20 lg:px-8 lg:py-8 lg:pt-20">
        <div className="mx-auto max-w-6xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={pageTransition.initial}
              animate={pageTransition.animate}
              exit={pageTransition.exit}
              transition={pageTransition.transition}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <CounselingRequestModal
        isOpen={showCounselingModal}
        onClose={() => setShowCounselingModal(false)}
        studentId={studentId}
        userName={userName}
        studentEmail={studentEmail}
        counselorSchedule={counselorSchedule}
        existingRequests={allCounselingRequests}
        onSubmit={onRequestSession}
      />

      {/* Case Report Modal */}
      <AnimatePresence>
        {showCaseReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[85vh] overflow-auto"
            >
              <button
                onClick={onCloseCaseReportModal}
                aria-label="Close report form"
                className="absolute top-3 right-3 z-50 w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent transition-colors"
              >
                ✕
              </button>
              <CaseReportsPage
                onSubmitReport={onSubmitCaseReport}
                submittedReports={caseReports}
                studentEmail={studentEmail}
                studentId={studentId}
                studentName={userName}
                openFormDirectly={true}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CareBridgeChatbot
        studentId={studentId}
        userName={userName}
        studentEmail={studentEmail}
        counselorSchedule={counselorSchedule}
        existingRequests={allCounselingRequests}
        onRequestSession={onRequestSession}
        onSubmitCaseReport={onSubmitCaseReport}
        isOpen={chatbotOpen}
        onOpenChange={setChatbotOpen}
        resetConversationKey={chatbotResetKey}
      />
    </div>
  );
}
