import { useState } from 'react';
import { HeartHandshake, LogOut, Menu, X, User } from 'lucide-react';

interface StudentNavbarProps {
  currentPage: string;
  userName: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function StudentNavbar({ currentPage, userName, onNavigate, onLogout }: StudentNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'profile', label: 'Profile' },
    { id: 'counselling', label: 'Counselling' },
    { id: 'case-reports', label: 'Cases' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 font-sans">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-sm">
            <HeartHandshake className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">CareBridge</p>
            <p className="text-xs text-muted-foreground hidden sm:block">Student Portal</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => { e.preventDefault(); onNavigate(item.id); }}
              className={`hover:text-primary transition-colors ${currentPage === item.id ? 'text-primary' : ''}`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 rounded-lg">
            <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-sm text-foreground font-medium truncate max-w-[120px]">{userName}</span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        <button
          className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-white">
          <div className="space-y-1 px-4 py-3">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => { e.preventDefault(); onNavigate(item.id); setMobileOpen(false); }}
                className={
                  currentPage === item.id
                    ? 'w-full text-left px-4 py-3 rounded-lg text-sm bg-primary/10 text-primary'
                    : 'w-full text-left px-4 py-3 rounded-lg text-sm text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors'
                }
              >
                {item.label}
              </a>
            ))}
            <div className="border-t border-border pt-3 mt-2 space-y-1">
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                {userName}
              </div>
              <button
                onClick={() => { onLogout(); setMobileOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
