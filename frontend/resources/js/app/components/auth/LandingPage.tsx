import { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'motion/react';
import './LandingPage.css';
import {
  HeartHandshake, LogIn, UserPlus, Shield, Clock, BookOpen,
  FileText, MessageCircle, ChevronRight, Phone, Mail, CheckCircle,
  ArrowRight, Star, Users, Award, Ticket, Lock, AlertTriangle,
  Brain, Smile, LifeBuoy, ChevronDown, MapPin, Menu, X,
} from 'lucide-react';
import { LandingPageChatbot } from './LandingPageChatbot';
import clearLimitsImage from '../../../assets/clear-limits-with-your-customers-and-your-boss.jfif';

interface LandingPageProps {
  onShowLogin: (openRegister?: boolean) => void;
  onShowRegister?: () => void;
  onReportCase?: () => void;
  onProfile?: () => void;
  onLogout?: () => void;
  onStartChat?: () => void;
  userName?: string;
  hideNavbar?: boolean;
}

/* ── Animated counter ──────────────────────────────────────────────────── */
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ── Fade-in section wrapper ───────────────────────────────────────────── */
function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Hero illustration SVG ─────────────────────────────────────────────── */
function HeroIllustration() {
  return (
    <svg viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Background circle */}
      <circle cx="240" cy="180" r="160" fill="#279B37" fillOpacity="0.07" />
      <circle cx="240" cy="180" r="120" fill="#279B37" fillOpacity="0.05" />

      {/* Main card */}
      <rect x="100" y="70" width="280" height="220" rx="20" fill="white" stroke="#279B37" strokeOpacity="0.2" strokeWidth="1.5" />

      {/* Card header bar */}
      <rect x="100" y="70" width="280" height="48" rx="20" fill="#279B37" fillOpacity="0.12" />
      <rect x="100" y="94" width="280" height="24" fill="#279B37" fillOpacity="0.12" />
      <circle cx="128" cy="94" r="12" fill="#279B37" fillOpacity="0.6" />
      <text x="148" y="99" fontFamily="sans-serif" fontSize="11" fill="#279B37" fontWeight="600">CareBridge</text>

      {/* Chat bubble 1 (bot) */}
      <rect x="120" y="134" width="140" height="36" rx="10" fill="#e8f5e9" />
      <text x="132" y="148" fontFamily="sans-serif" fontSize="9" fill="#1a5c24">Hi! How can I help</text>
      <text x="132" y="160" fontFamily="sans-serif" fontSize="9" fill="#1a5c24">you today? 👋</text>

      {/* Chat bubble 2 (user) */}
      <rect x="218" y="180" width="142" height="36" rx="10" fill="#279B37" fillOpacity="0.15" />
      <text x="230" y="194" fontFamily="sans-serif" fontSize="9" fill="#1a5c24">I need counseling</text>
      <text x="230" y="206" fontFamily="sans-serif" fontSize="9" fill="#1a5c24">support 💬</text>

      {/* Ticket badge */}
      <rect x="120" y="228" width="110" height="44" rx="10" fill="#f0fdf4" stroke="#279B37" strokeOpacity="0.3" strokeWidth="1" />
      <text x="132" y="245" fontFamily="sans-serif" fontSize="8" fill="#2e7d32" fontWeight="600">TICKET</text>
      <text x="132" y="260" fontFamily="sans-serif" fontSize="10" fill="#279B37" fontWeight="700">CBR-2026-00042</text>

      {/* Checkmark badge */}
      <circle cx="338" cy="250" r="22" fill="#279B37" fillOpacity="0.12" />
      <circle cx="338" cy="250" r="16" fill="#279B37" fillOpacity="0.2" />
      <path d="M329 250l6 6 12-12" stroke="#279B37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Floating decorative dots */}
      <circle cx="80" cy="100" r="6" fill="#279B37" fillOpacity="0.3" />
      <circle cx="400" cy="140" r="8" fill="#279B37" fillOpacity="0.2" />
      <circle cx="60" cy="260" r="10" fill="#279B37" fillOpacity="0.15" />
      <circle cx="420" cy="300" r="5" fill="#279B37" fillOpacity="0.25" />

      {/* Shield icon top-right */}
      <circle cx="390" cy="90" r="24" fill="#e8f5e9" />
      <path d="M390 78c-6 0-12 2.4-12 5.4v7.2c0 6.6 5.1 12.6 12 14.4 6.9-1.8 12-7.8 12-14.4v-7.2c0-3-6-5.4-12-5.4z" fill="#279B37" fillOpacity="0.7" />
    </svg>
  );
}

/* ── Process step illustration ─────────────────────────────────────────── */
function ProcessIllustration({ step }: { step: 1 | 2 | 3 | 4 }) {
  const icons = {
    1: (
      <>
        <circle cx="60" cy="60" r="40" fill="#e8f5e9" />
        <path d="M48 60a12 12 0 0 1 24 0" stroke="#279B37" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <circle cx="60" cy="52" r="6" fill="#279B37" fillOpacity="0.7" />
        <path d="M44 72h32" stroke="#279B37" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    2: (
      <>
        <circle cx="60" cy="60" r="40" fill="#e8f5e9" />
        <rect x="44" y="46" width="32" height="28" rx="5" fill="none" stroke="#279B37" strokeWidth="2.5" />
        <path d="M51 56h18M51 62h12" stroke="#279B37" strokeWidth="2" strokeLinecap="round" />
        <circle cx="72" cy="72" r="7" fill="#279B37" />
        <path d="M69 72l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    3: (
      <>
        <circle cx="60" cy="60" r="40" fill="#e8f5e9" />
        <rect x="42" y="50" width="36" height="20" rx="8" fill="#279B37" fillOpacity="0.2" />
        <path d="M49 58h4M49 63h14" stroke="#279B37" strokeWidth="2" strokeLinecap="round" />
        <rect x="56" y="64" width="24" height="16" rx="6" fill="#279B37" fillOpacity="0.15" />
        <path d="M62 70h10M62 75h6" stroke="#279B37" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
    4: (
      <>
        <circle cx="60" cy="60" r="40" fill="#e8f5e9" />
        <circle cx="60" cy="60" r="18" fill="none" stroke="#279B37" strokeWidth="2.5" />
        <path d="M52 60l5 5 11-11" stroke="#279B37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 120 120" className="w-20 h-20">
      {icons[step]}
    </svg>
  );
}

/* ── FAQ item ──────────────────────────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-accent/20 transition-colors"
      >
        <span className="font-medium text-foreground text-sm">{q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────────────── */
export function LandingPage({ onShowLogin, onShowRegister, onReportCase, onProfile, onLogout, onStartChat, userName, hideNavbar = false }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);

  const handleOpenChatbot = () => {
    if (onStartChat) {
      onStartChat();
      return;
    }
    setChatbotOpen(true);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: '#home', label: 'Home' },
    ...(userName ? [{ href: '#profile', label: 'Profile', action: onProfile }] : []),
    { href: '#counselling', label: 'Counselling' },
    { href: '#cases', label: 'Cases' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#faq', label: 'FAQ' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden font-sans scroll-smooth">

      {/* ── Navbar ────────────────────────────────────────────────────── */}
      {!hideNavbar && (
        <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 bg-white border-b border-border`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shrink-0 shadow-sm">
              <HeartHandshake className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <p className="font-bold text-foreground text-sm tracking-tight">CareBridge</p>
              <p className="text-xs text-muted-foreground hidden sm:block">Mzuzu University</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            {navLinks.map(link => (
              <a key={link.href} href={link.href} className="hover:text-primary transition-colors">{link.label}</a>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center p-2 rounded-lg border border-border text-foreground hover:bg-accent/30 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="hidden md:flex items-center gap-2">
            {userName ? (
              <>
                <button onClick={onProfile}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-accent/30 transition-colors text-sm font-medium">
                  <Users className="w-4 h-4" /> {userName}
                </button>
                <button onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm">
                  Log out
                </button>
              </>
            ) : (
              <>
                <button onClick={() => onShowLogin(false)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-accent/30 transition-colors text-sm font-medium">
                  <LogIn className="w-4 h-4" /> Login
                </button>
                <button onClick={() => (onShowRegister ? onShowRegister() : onShowLogin(true))}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm">
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Register</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden border-t border-border bg-background/95 backdrop-blur"
          >
            <nav className="flex flex-col p-4 gap-3">
              {navLinks.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-sm text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="border-t border-border pt-3 mt-2 flex flex-col gap-2">
                {userName ? (
                  <>
                    <button onClick={() => { onProfile?.(); setMobileMenuOpen(false); }}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-foreground hover:bg-accent/30 transition-colors text-sm font-medium">
                      <Users className="w-4 h-4" /> {userName}
                    </button>
                    <button onClick={() => { onLogout?.(); setMobileMenuOpen(false); }}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm">
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { onShowLogin(false); setMobileMenuOpen(false); }}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-foreground hover:bg-accent/30 transition-colors text-sm font-medium">
                      <LogIn className="w-4 h-4" /> Login
                    </button>
                    <button onClick={() => { (onShowRegister ? onShowRegister() : onShowLogin(true)); setMobileMenuOpen(false); }}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm">
                      <UserPlus className="w-4 h-4" /> Register
                    </button>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
          )}
        </header>
      )}

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section id="home" className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/10 to-background pt-16 pb-20 sm:pt-24 sm:pb-28 px-4">
        {/* Background decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-primary/8 blur-3xl" />

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-5">
                <HeartHandshake className="w-4 h-4" /> Mzuzu University Student Support System
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-5 leading-[1.15]">
                Break the silence.<br />
                <span className="text-primary">Getting help is not weakness</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-lg mb-8 leading-relaxed">
                You don't have to face it alone. CareBridge is Mzuzu University's safe space where it's okay to ask for help. Whether you're struggling with your mental health, dealing with personal challenges, or need to report a concern — we're here to listen without judgment. It's a sign of strength to reach out, and we'll support you every step of the way.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={handleOpenChatbot}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-lg font-semibold text-base">
                  Talk to Counsellor <ChevronRight className="w-5 h-5" />
                </button>
                <button onClick={() => {
                    if (onReportCase) {
                      onReportCase();
                    } else {
                      setChatbotOpen(true);
                    }
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-primary/30 text-primary rounded-xl hover:border-primary hover:bg-primary/5 transition-all font-semibold text-base">
                  <FileText className="w-5 h-5" /> Get Help
                </button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-4 mt-8">
                {[
                  { icon: <Lock className="w-3.5 h-3.5" />, text: '100% Confidential' },
                  { icon: <CheckCircle className="w-3.5 h-3.5" />, text: 'Licensed Counselors' },
                  { icon: <Shield className="w-3.5 h-3.5" />, text: 'Safe & Secure' },
                ].map(b => (
                  <span key={b.text} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-accent/30 border border-border rounded-full px-3 py-1.5">
                    <span className="text-primary">{b.icon}</span> {b.text}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Image */}
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
            className="hidden lg:flex justify-center items-center">
            <img src={clearLimitsImage} alt="Clear limits" className="w-full max-w-md h-auto rounded-lg" />
          </motion.div>
        </div>
      </section>

      {/* ── Counselling ───────────────────────────────────────────────── */}
      <section id="counselling" className="py-20 px-4 bg-primary/5 border-y border-border">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <FadeIn>
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Counselling Services</span>
            <h2 className="text-foreground mt-2 mb-4">Professional Mental Health Support</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Our licensed counselors provide confidential, judgment-free support for all students.
              Whether you're dealing with academic pressure, personal challenges, or mental health concerns,
              we're here to help you navigate through difficult times.
            </p>
            <div className="space-y-3">
              {[
                { icon: <Brain className="w-4 h-4" />, text: 'Individual counseling sessions' },
                { icon: <Users className="w-4 h-4" />, text: 'Group therapy sessions' },
                { icon: <MessageCircle className="w-4 h-4" />, text: '24/7 AI chat support' },
                { icon: <Shield className="w-4 h-4" />, text: 'Crisis intervention & emergency support' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-sm text-foreground">{item.text}</span>
                </div>
              ))}
            </div>
            <button onClick={handleOpenChatbot}
              className="mt-8 flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium text-sm shadow-md">
              Chat with CareBridge <MessageCircle className="w-4 h-4" />
            </button>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <BookOpen className="w-6 h-6 text-primary" />, label: 'Academic Support', count: '840+ sessions', bg: 'bg-white' },
                { icon: <Shield className="w-6 h-6 text-primary" />, label: 'Safety Reports', count: '320+ handled', bg: 'bg-primary/5' },
                { icon: <Brain className="w-6 h-6 text-primary" />, label: 'Mental Health', count: '1,200+ students', bg: 'bg-primary/5' },
                { icon: <Award className="w-6 h-6 text-primary" />, label: 'Cases Resolved', count: '98% rate', bg: 'bg-white' },
              ].map(card => (
                <div key={card.label} className={`${card.bg} rounded-2xl border border-border p-5 flex flex-col gap-3 shadow-sm`}>
                  <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
                    {card.icon}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    <p className="font-bold text-foreground text-sm mt-0.5">{card.count}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Services ──────────────────────────────────────────────────── */}
      <section id="services" className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6">Our Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              From one-on-one counseling to case reporting, CareBridge covers all your welfare and support needs.
            </p>
          </FadeIn>

          {/* Static Grid - Large Screens */}
          <div className="hidden lg:grid grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: <Brain className="w-7 h-7 text-primary" />,
                title: 'Mental Health Counselling',
                desc: `Find comfort and understanding with experienced counselors who truly care. Whether you're navigating stress, grief, or just need someone to talk to—you're never alone.`,
                tags: ['Depression', 'Anxiety', 'Stress', 'Trauma', 'Grief'],
                color: 'border-primary/30 hover:border-primary',
              },
              {
                icon: <Ticket className="w-7 h-7 text-primary" />,
                title: 'Case Reporting',
                desc: `Report concerns in a safe, judgment-free space. Your voice matters. We handle everything with care and confidentiality, and you can follow your case every step of the way.`,
                tags: ['GBV', 'Harassment', 'Welfare', 'Misconduct'],
                color: 'border-primary/30 hover:border-primary',
              },
              {
                icon: <MessageCircle className="w-7 h-7 text-primary" />,
                title: 'AI Chat & Direct Messaging',
                desc: `Chat with our AI guide anytime, or connect directly with your counselor. We're here when you need us—at your pace, on your terms, always with support.`,
                tags: ['Chatbot', 'Direct Messages', '24/7 Guide'],
                color: 'border-primary/30 hover:border-primary',
              },
            ].map((s) => (
              <div key={s.title} className={`group bg-card rounded-2xl border-2 ${s.color} transition-all duration-300 p-7 h-full flex flex-col hover:shadow-xl`}>
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  {s.icon}
                </div>
                <h3 className="text-foreground mb-3 text-lg font-semibold">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-5 flex-1">{s.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {s.tags.map(t => (
                    <span key={t} className="text-xs bg-primary/8 text-primary border border-primary/20 rounded-full px-2.5 py-0.5">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:hidden max-w-5xl mx-auto">
            {[
              {
                icon: <Brain className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />,
                title: 'Mental Health Counselling',
                desc: `Find comfort and understanding with experienced counselors who truly care. Whether you're navigating stress, grief, or just need someone to talk to—you're never alone.`,
                tags: ['Depression', 'Anxiety', 'Stress', 'Trauma', 'Grief'],
                color: 'border-primary/30 hover:border-primary',
              },
              {
                icon: <Ticket className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />,
                title: 'Case Reporting',
                desc: `Report concerns in a safe, judgment-free space. Your voice matters. We handle everything with care and confidentiality, and you can follow your case every step of the way.`,
                tags: ['GBV', 'Harassment', 'Welfare', 'Misconduct'],
                color: 'border-primary/30 hover:border-primary',
              },
              {
                icon: <MessageCircle className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />,
                title: 'AI Chat & Direct Messaging',
                desc: `Chat with our AI guide anytime, or connect directly with your counselor. We're here when you need us—at your pace, on your terms, always with support.`,
                tags: ['Chatbot', 'Direct Messages', '24/7 Guide'],
                color: 'border-primary/30 hover:border-primary',
              },
            ].map((s) => (
              <div key={s.title} className={`group bg-card rounded-xl sm:rounded-2xl border-2 ${s.color} transition-all duration-300 p-4 sm:p-6 h-full flex flex-col hover:shadow-xl`}>
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-primary/10 rounded-lg sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-5 group-hover:bg-primary/20 transition-colors">
                  {s.icon}
                </div>
                <h3 className="text-foreground mb-2 sm:mb-3 text-base sm:text-lg font-semibold">{s.title}</h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-3 sm:mb-5 flex-1">{s.desc}</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {s.tags.map(t => (
                    <span key={t} className="text-[10px] sm:text-xs bg-primary/8 text-primary border border-primary/20 rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How cases are handled ─────────────────────────────────────── */}
      <section id="cases" className="py-20 px-4 bg-primary/5 border-y border-border scroll-mt-24">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <FadeIn>
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">How Cases Are Handled</span>
            <h2 className="text-foreground mt-2 mb-4">Safe, confidential support from first report to follow-up</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Every concern is treated seriously, privately, and with care. We use a clear intake process, verified routing, and guided follow-up so students know their report is being handled safely and respectfully.
            </p>
            <div className="space-y-3">
              {[
                { icon: <Shield className="w-4 h-4" />, text: 'Reports are received privately and routed to the right support team quickly.' },
                { icon: <Lock className="w-4 h-4" />, text: 'Only authorized staff can access your case details, and sensitive information is protected.' },
                { icon: <CheckCircle className="w-4 h-4" />, text: 'You receive a clear case path and can track progress without repeating your story.' },
                { icon: <LifeBuoy className="w-4 h-4" />, text: 'Urgent concerns are escalated immediately so help reaches you as fast as possible.' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-sm text-foreground">{item.text}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setChatbotOpen(true)}
              className="mt-8 flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium text-sm shadow-md">
              Learn how support works <ArrowRight className="w-4 h-4" />
            </button>
          </FadeIn>

          {/* Graphic panel */}
          <FadeIn delay={0.15}>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <BookOpen className="w-6 h-6 text-primary" />, label: 'Academic Support', count: '840+ sessions', bg: 'bg-white' },
                { icon: <Shield className="w-6 h-6 text-primary" />, label: 'Safety Reports', count: '320+ handled', bg: 'bg-primary/5' },
                { icon: <Brain className="w-6 h-6 text-primary" />, label: 'Mental Health', count: '1,200+ students', bg: 'bg-primary/5' },
                { icon: <Award className="w-6 h-6 text-primary" />, label: 'Cases Resolved', count: '98% rate', bg: 'bg-white' },
              ].map(card => (
                <div key={card.label} className={`${card.bg} rounded-2xl border border-border p-5 flex flex-col gap-3 shadow-sm`}>
                  <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
                    {card.icon}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    <p className="font-bold text-foreground text-sm mt-0.5">{card.count}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-14">
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">How It Works</span>
            <h2 className="text-foreground mt-2 mb-3">Simple Steps to Get Support</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Getting help through CareBridge is straightforward. From registration to resolution in four easy steps.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-4 gap-6 relative">
            {/* Connector line */}
            <div className="hidden sm:block absolute top-10 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

            {[
              { step: 1 as const, title: 'Register', desc: 'Create your free student account using your Mzuzu University email address.' },
              { step: 2 as const, title: 'Choose a Service', desc: 'Select counseling, case reporting, or use the chat guide to find what you need.' },
              { step: 3 as const, title: 'Submit Your Request', desc: 'Fill in the details, attach evidence if needed, and submit. You get a ticket number instantly.' },
              { step: 4 as const, title: 'Track & Resolve', desc: 'Monitor your case or session status in real time. Get notified at every step.' },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.12} className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <ProcessIllustration step={item.step} />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold shadow-md">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-foreground text-base mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-primary/5 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-12">
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Student Voices</span>
            <h2 className="text-foreground mt-2 mb-3">What Students Are Saying</h2>
          </FadeIn>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                quote: 'CareBridge helped me navigate one of the hardest periods of my university life. The counselor was professional, empathetic, and genuinely helpful.',
                name: 'Chimwemwe M.',
                role: 'Year 3 — Education',
                rating: 5,
              },
              {
                quote: 'I was nervous to report what happened to me, but the ticketing system made it clear my case was being tracked and handled seriously. I felt heard.',
                name: 'Thandizo K.',
                role: 'Year 2 — Business',
                rating: 5,
              },
              {
                quote: 'The chat assistant guided me through the whole process in under five minutes. I had a counseling session booked the same day.',
                name: 'Kondwani P.',
                role: 'Postgraduate — ICT',
                rating: 5,
              },
            ].map((t, i) => (
              <FadeIn key={t.name} delay={i * 0.1}>
                <div className="bg-card rounded-2xl border border-border p-6 flex flex-col gap-4 h-full shadow-sm">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed flex-1 italic">"{t.quote}"</p>
                  <div className="flex items-center gap-3 pt-2 border-t border-border">
                    <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-4 bg-background scroll-mt-24">
        <div className="max-w-3xl mx-auto">
          <FadeIn className="text-center mb-12">
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">FAQ</span>
            <h2 className="text-foreground mt-2 mb-3">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Everything you need to know before getting started.</p>
          </FadeIn>

          <FadeIn className="space-y-3">
            {[
              {
                q: 'Is CareBridge free to use?',
                a: 'Yes. CareBridge is a free service provided by Mzuzu University to all enrolled students. There are no fees for counseling sessions or case reporting.',
              },
              {
                q: 'Is my information kept confidential?',
                a: 'Absolutely. All counseling sessions and case reports are handled with strict confidentiality. Your personal information is only accessible to the relevant support staff assigned to your case.',
              },
              {
                q: 'How quickly will I get a response after submitting a report?',
                a: 'General welfare cases are reviewed within 2–3 working days. Urgent cases — including gender-based violence or immediate safety concerns — are escalated immediately and handled within 24 hours.',
              },
              {
                q: 'Can I track the status of my submitted case?',
                a: 'Yes. Every case report generates a unique ticket number (e.g. CBR-2026-00042). You can use this to track your case through each stage — from submission to review, investigation, and resolution.',
              },
              {
                q: 'What types of concerns can I report?',
                a: 'You can report sexual harassment, gender-based violence, academic misconduct, discrimination, housing issues, financial aid problems, and general welfare concerns.',
              },
              {
                q: 'Can I attach evidence to my case report?',
                a: 'Yes. The case report form allows you to upload supporting files (images, PDFs, or documents) up to 10 MB each, with a maximum of 5 files per submission.',
              },
              {
                q: 'What if I need help right now?',
                a: 'If you are in immediate danger, call Campus Security on 0999 100 000 or the Emergency Counselor on 0882 200 000. You can also use the emergency option inside the CareBridge chat assistant once logged in.',
              },
            ].map(item => <FaqItem key={item.q} q={item.q} a={item.a} />)}
          </FadeIn>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 px-4 bg-primary">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <FadeIn>
            <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <HeartHandshake className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-primary-foreground mb-3 text-3xl font-bold">Ready to Take the First Step?</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto text-lg leading-relaxed">
              Reaching out is a sign of strength, not weakness. Join thousands of Mzuzu University students
              who are getting the support they deserve.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => (onShowRegister ? onShowRegister() : onShowLogin(true))}
                className="flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-primary rounded-xl hover:bg-white/90 transition-colors font-semibold shadow-lg text-base">
                Create a Free Account <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => onShowLogin(false)}
                className="flex items-center justify-center gap-2 px-7 py-3.5 border-2 border-white/30 text-white rounded-xl hover:border-white hover:bg-white/10 transition-colors font-semibold text-base">
                <LogIn className="w-4 h-4" /> Sign In
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Contact ───────────────────────────────────────────────────── */}
      <section id="contact" className="py-20 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-12">
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Contact Us</span>
            <h2 className="text-foreground mt-2 mb-3">Get in Touch</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Have questions or need support? Reach out to us through any of the channels below.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: <Phone className="w-6 h-6 text-primary" />, title: 'Phone', detail: '+265 1 333 555', sub: 'Mon – Fri, 8AM – 5PM' },
              { icon: <Mail className="w-6 h-6 text-primary" />, title: 'Email', detail: 'carebridge@mzuni.ac.mw', sub: 'We respond within 24 hours' },
              { icon: <MapPin className="w-6 h-6 text-primary" />, title: 'Location', detail: 'Mzuzu University', sub: 'Student Affairs Office' },
            ].map(contact => (
              <FadeIn key={contact.title} className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center text-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  {contact.icon}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{contact.title}</p>
                  <p className="font-semibold text-foreground text-sm">{contact.detail}</p>
                  <p className="text-xs text-muted-foreground mt-1">{contact.sub}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn className="mt-12 bg-primary/5 rounded-2xl border border-border p-8 text-center">
            <h3 className="text-foreground text-lg font-semibold mb-2">Emergency Support</h3>
            <p className="text-muted-foreground text-sm mb-4">If you are in immediate danger or need urgent assistance</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex items-center gap-2 text-primary font-medium">
                <Phone className="w-4 h-4" /> Campus Security: 0999 100 000
              </div>
              <div className="flex items-center gap-2 text-primary font-medium">
                <LifeBuoy className="w-4 h-4" /> Emergency Counselor: 0882 200 000
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Floating Chat Button ───────────────────────────────────────── */}
      <button
        onClick={handleOpenChatbot}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all hover:scale-110 flex items-center justify-center"
        title="Chat with CareBridge"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* ── Chatbot Component ───────────────────────────────────────────── */}
      <LandingPageChatbot
        isOpen={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
        onShowLogin={onShowLogin}
      />

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="bg-foreground/5 border-t border-border py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <HeartHandshake className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground">CareBridge</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Mzuzu University's official student counseling and welfare support platform.
              </p>
            </div>

            {/* Services */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Services</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5 text-primary" /> Counselling Sessions</li>
                <li className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-primary" /> Case Reporting</li>
                <li className="flex items-center gap-2"><MessageCircle className="w-3.5 h-3.5 text-primary" /> Chat Assistant</li>
                <li className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-primary" /> GBV Support</li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Contact</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-primary" /> +265 1 333 555</li>
                <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-primary" /> carebridge@mzuni.ac.mw</li>
                <li className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-primary" /> Mon – Fri, 8AM – 5PM</li>
                <li className="flex items-center gap-2 text-primary font-medium"><LifeBuoy className="w-3.5 h-3.5" /> Emergency: 0882 200 000</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Mzuzu University. All rights reserved.</p>
            <p>CareBridge — Student Counseling & Welfare System</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
