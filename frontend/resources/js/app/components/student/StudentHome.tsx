import { LandingPage } from '../auth/LandingPage';

interface StudentHomeProps {
  onNavigate: (page: string) => void;
  onRequestCounseling: () => void;
  onStartChat?: () => void;
}

export function StudentHome({ onNavigate, onRequestCounseling, onStartChat }: StudentHomeProps) {
  return (
    <div className="overflow-hidden bg-transparent">
      <LandingPage
        hideNavbar={true}
        showHowItWorks={false}
        onShowLogin={() => onRequestCounseling()}
        onShowRegister={() => onNavigate('case-reports')}
        onReportCase={() => onNavigate('case-reports')}
        onProfile={() => onNavigate('profile')}
        onStartChat={onStartChat}
        onLogout={() => onNavigate('home')}
        userName="Student"
      />
    </div>
  );
}
