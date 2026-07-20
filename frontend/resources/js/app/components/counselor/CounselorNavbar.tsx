import { useState } from 'react';
import { Menu, X, Home, FileText, Settings, LogOut, HeartHandshake, CalendarClock } from 'lucide-react';

interface CounselorNavbarProps {
  counselorName: string;
  activeTab: 'home' | 'cases' | 'schedule' | 'settings';
  onTabChange: (tab: 'home' | 'cases' | 'schedule' | 'settings') => void;
  activeCaseSubTab?: 'pending' | 'active' | 'completed' | 'referred' | 'dismissed';
  onCaseSubTabChange?: (tab: 'pending' | 'active' | 'completed' | 'referred' | 'dismissed') => void;
  onLogout: () => void;
}

export function CounselorNavbar({
  counselorName,
  activeTab,
  onTabChange,
  activeCaseSubTab,
  onCaseSubTabChange,
  onLogout,
}: CounselorNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'cases', label: 'Cases', icon: FileText },
    { id: 'schedule', label: 'Schedule', icon: CalendarClock },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const caseSubTabs = [
    { id: 'pending', label: 'Pending Requests' },
    { id: 'active', label: 'Active Sessions' },
    { id: 'completed', label: 'Completed Cases' },
    { id: 'referred', label: 'Referred Cases' },
    { id: 'dismissed', label: 'Dismissed Cases' },
  ];

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-2">
          {/* Logo and title */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <HeartHandshake className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="hidden sm:block min-w-0">
              <p className="text-sm font-medium text-foreground leading-tight truncate">CareBridge</p>
              <p className="text-xs text-muted-foreground">Counselor</p>
            </div>
          </div>

          {/* Desktop navigation tabs */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id as 'home' | 'cases' | 'settings');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    activeTab === item.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* User info and logout */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-foreground truncate max-w-[150px]">{counselorName}</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-accent/30 rounded-lg text-muted-foreground hover:text-foreground"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 space-y-1 border-t border-border pt-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id as 'home' | 'cases' | 'settings');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    activeTab === item.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Case subtabs - only show on cases tab */}
      {activeTab === 'cases' && onCaseSubTabChange && (
        <div className={`border-t border-border overflow-x-auto md:overflow-visible ${mobileMenuOpen ? 'block' : ''}`}>
          <div className="px-4 sm:px-6 flex flex-col md:flex-row md:justify-center items-center gap-2 py-3 text-sm">
            {caseSubTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  onCaseSubTabChange(tab.id as any);
                  setMobileMenuOpen(false);
                }}
                className={`px-3 py-1 rounded-lg whitespace-nowrap transition-colors ${
                  activeCaseSubTab === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
