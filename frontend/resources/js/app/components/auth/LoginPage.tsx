"use client";

import React, { useState, useEffect } from 'react';
import { HeartHandshake, Eye, EyeOff, ShieldAlert, UserPlus, LogIn, User } from 'lucide-react';

interface RegisterResult {
  success: boolean;
  errors?: Record<string, string[]>;
  message?: string;
  code?: string;
}

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<string | null>;
  onRegister: (data: RegisterData) => Promise<RegisterResult>;
  onAnonymousReport?: () => void;
  openRegister?: boolean;
  onBack?: () => void;
  onProfile?: () => void;
  onLogout?: () => void;
  userName?: string;
  onSettings?: () => void;
}

export interface RegisterData {
  firstName: string;
  surname: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  location: 'oncampus' | 'offcampus';
  hasOngoingCase: boolean;
  gender: 'male' | 'female';
  program: string;
  level: string;
}

export function LoginPage({
  onLogin,
  onRegister,
  onAnonymousReport,
  openRegister = false,
  onBack,
  onProfile,
  onLogout,
  userName,
  onSettings,
}: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showRegister, setShowRegister] = useState(openRegister);

  // Sync with openRegister prop
  useEffect(() => {
    setShowRegister(openRegister);
  }, [openRegister]);

  // If opened directly to register, hide login form
  const showLoginForm = !showRegister;

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    const result = await onLogin(email.trim().toLowerCase(), password);
    if (result) setError(result);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <>
      {showLoginForm && (
        <div className="bg-card rounded-2xl border border-border shadow-2xl w-full">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <HeartHandshake className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-foreground text-lg mb-1">Welcome Back</h1>
            <p className="text-muted-foreground text-xs">Sign in to your CareBridge account</p>
          </div>

          {/* User Info (when logged in) */}
          {userName && (
            <div className="mx-6 mb-4 p-3 bg-muted/30 rounded-lg flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-foreground font-medium">Hello, {userName}</span>
              <button
                onClick={() => onProfile && onProfile()}
                className="ml-auto text-xs text-primary hover:text-primary/80 underline"
              >
                View Profile
              </button>
            </div>
          )}

          {/* Login form */}
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                onKeyDown={handleKeyDown}
                placeholder="you@mzuni.ac.mw"
                className={`w-full px-3 py-2.5 rounded-lg border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm placeholder:text-muted-foreground ${error ? 'border-destructive' : 'border-border'}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                  className={`w-full px-3 py-2.5 pr-10 rounded-lg border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm placeholder:text-muted-foreground ${error ? 'border-destructive' : 'border-border'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {successMessage && (
              <div className="bg-success/10 border border-success/20 rounded-lg px-3 py-2.5">
                <p className="text-success text-sm">{successMessage}</p>
              </div>
            )}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleLogin}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium shadow-md flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 border-t border-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 border-t border-border" />
            </div>

            <button
              onClick={() => {
                setSuccessMessage('');
                setShowRegister(true);
              }}
              className="w-full py-2.5 border-2 border-primary/40 text-primary rounded-lg hover:border-primary hover:bg-primary/5 transition-all font-medium flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Register as Student
            </button>

            {/* Profile and Settings buttons when logged in */}
            {userName && (
              <>
                <div className="border-t border-border pt-3 mt-3 space-y-2">
                  <button
                    onClick={() => onProfile && onProfile()}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-foreground hover:bg-accent transition-colors text-sm"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  <button
                    onClick={() => onSettings && onSettings()}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-foreground hover:bg-accent transition-colors text-sm"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Settings
                  </button>
                  <button
                    onClick={() => onLogout && onLogout()}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onSubmit={onRegister}
          onRegistered={() => {
            setShowRegister(false);
            setSuccessMessage('Registration complete. You can now sign in.');
          }}
          onSignInInstead={() => {
            setShowRegister(false);
            setError('');
          }}
          onProfile={() => onProfile && onProfile()}
          onLogout={() => onLogout && onLogout()}
          userName={userName}
        />
      )}
    </>
  );
}

export function RegisterModal({
  onClose,
  onSubmit,
  onSignInInstead,
  onRegistered,
  onProfile,
  onLogout,
  userName,
}: {
  onClose: () => void;
  onSubmit: (data: RegisterData) => Promise<RegisterResult>;
  onSignInInstead?: () => void;
  onRegistered?: () => void;
  onProfile?: () => void;
  onLogout?: () => void;
  userName?: string;
}) {
  const [form, setForm] = useState<RegisterData>({
    firstName: '',
    surname: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    location: 'oncampus',
    hasOngoingCase: false,
    gender: 'male',
    program: '',
    level: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterData, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailAlreadyRegistered, setEmailAlreadyRegistered] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validate = () => {
    const e: Partial<Record<keyof RegisterData, string>> = {};
    if (!form.firstName.trim()) {
      e.firstName = 'First name is required.';
    } else if (!/^[A-Za-z]+$/.test(form.firstName.trim())) {
      e.firstName = 'First name must be a single word with letters only.';
    }

    if (!form.surname.trim()) {
      e.surname = 'Surname is required.';
    } else if (!/^[A-Za-z]+$/.test(form.surname.trim())) {
      e.surname = 'Surname must contain letters only and no spaces.';
    }

    if (!form.phone.trim()) {
      e.phone = 'Phone number is required.';
    } else if (!/^[0-9]{10}$/.test(form.phone.trim())) {
      e.phone = 'Phone number must be exactly 10 digits.';
    }

    if (!form.email.trim()) {
      e.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      e.email = 'Enter a valid email address.';
    }

    if (!form.password) {
      e.password = 'Password is required.';
    } else if (form.password.length < 6) {
      e.password = 'Password must be at least 6 characters.';
    }

    if (!form.gender) {
      e.gender = 'Please select your gender.';
    }

    if (!form.program.trim()) {
      e.program = 'Program is required.';
    }

    if (!form.level.trim()) {
      e.level = 'Level is required.';
    }

    if (!form.confirmPassword) {
      e.confirmPassword = 'Please confirm your password.';
    } else if (form.password !== form.confirmPassword) {
      e.confirmPassword = 'Passwords do not match.';
    }

    setErrors(e);
    setServerError(null);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const result = await onSubmit(form);

    if (result.success) {
      if (onRegistered) {
        onRegistered();
        return;
      }
      setSubmitted(true);
      return;
    }

    const nextErrors: Partial<Record<keyof RegisterData, string>> = {};
    if (result.errors) {
      for (const [key, messages] of Object.entries(result.errors)) {
        if (key === 'name') {
          const message = messages.join(' ');
          nextErrors.firstName = message;
          nextErrors.surname = message;
          continue;
        }
        const fieldKey = key as keyof RegisterData;
        if (fieldKey in form) {
          nextErrors[fieldKey] = messages.join(' ');
        }
      }
    }
    setErrors((prev) => ({ ...prev, ...nextErrors }));
    const isDuplicateEmail = result.code === 'email_already_registered' || Boolean(result.errors?.email);
    setEmailAlreadyRegistered(isDuplicateEmail);

    if (result.errors?.has_ongoing_case) {
      setServerError(result.errors.has_ongoing_case.join(' '));
      return;
    }

    setServerError(
      isDuplicateEmail
        ? 'An account already exists with this email. Please sign in instead.'
        : (result.message ?? 'Registration failed. Please review the entered information.')
    );
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-success/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-foreground mb-2">Registration Successful!</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Your student account has been created. You can now log in with your email and the password you chose.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-foreground">Student Registration</h2>
              <p className="text-muted-foreground text-sm mt-0.5">Create your CareBridge student account</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent transition-colors text-muted-foreground">
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {serverError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive space-y-3">
              <p>{serverError}</p>
              {emailAlreadyRegistered && onSignInInstead ? (
                <button
                  type="button"
                  onClick={onSignInInstead}
                  className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Sign in instead
                </button>
              ) : null}
            </div>
          ) : null}

          {/* User Info display when registered */}
          {userName && (
            <div className="bg-success/5 border border-success/20 rounded-lg p-3 mb-4 text-sm">
              <p className="text-success font-medium">Logged in as: {userName}</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={onProfile}
                  className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90"
                >
                  Profile
                </button>
                <button
                  onClick={onLogout}
                  className="px-3 py-1 border border-border rounded text-xs hover:bg-accent"
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* Registration form (hidden when already registered) */}
          {!userName && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    First Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    placeholder="Jane"
                    className={`w-full px-3 py-2.5 rounded-lg border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm placeholder:text-muted-foreground ${errors.firstName ? 'border-destructive' : 'border-border'}`}
                  />
                  {errors.firstName && <p className="text-destructive text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Surname <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.surname}
                    onChange={(e) => setForm({ ...form, surname: e.target.value })}
                    placeholder="Doe"
                    className={`w-full px-3 py-2.5 rounded-lg border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm placeholder:text-muted-foreground ${errors.surname ? 'border-destructive' : 'border-border'}`}
                  />
                  {errors.surname && <p className="text-destructive text-xs mt-1">{errors.surname}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Phone Number <span className="text-destructive">*</span>
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0999000000"
                  className={`w-full px-3 py-2.5 rounded-lg border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm placeholder:text-muted-foreground ${errors.phone ? 'border-destructive' : 'border-border'}`}
                />
                {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
                <p className="text-muted-foreground text-xs mt-1">Enter exactly 10 digits, no spaces or symbols.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  University Email <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@mzuni.ac.mw"
                  className={`w-full px-3 py-2.5 rounded-lg border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm placeholder:text-muted-foreground ${errors.email ? 'border-destructive' : 'border-border'}`}
                />
                {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Password <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Create a password"
                    className={`w-full px-3 py-2.5 pr-10 rounded-lg border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm placeholder:text-muted-foreground ${errors.password ? 'border-destructive' : 'border-border'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Confirm Password <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Repeat your password"
                    className={`w-full px-3 py-2.5 pr-10 rounded-lg border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm placeholder:text-muted-foreground ${errors.confirmPassword ? 'border-destructive' : 'border-border'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-destructive text-xs mt-1">{errors.confirmPassword}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Location <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'oncampus', label: 'On Campus' },
                    { value: 'offcampus', label: 'Off Campus' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, location: opt.value as 'oncampus' | 'offcampus' })}
                      className={`py-2.5 px-3 rounded-lg border text-sm transition-all ${
                        form.location === opt.value
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Gender <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, gender: opt.value as 'male' | 'female' })}
                      className={`py-2.5 px-3 rounded-lg border text-sm transition-all ${
                        form.gender === opt.value
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {errors.gender && <p className="text-destructive text-xs mt-1">{errors.gender}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Program <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={form.program}
                  onChange={(e) => setForm({ ...form, program: e.target.value })}
                  placeholder="e.g. BSc Computer Science"
                  className={`w-full px-3 py-2.5 rounded-lg border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm placeholder:text-muted-foreground ${errors.program ? 'border-destructive' : 'border-border'}`}
                />
                {errors.program && <p className="text-destructive text-xs mt-1">{errors.program}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Level <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  placeholder="e.g. Undergraduate"
                  className={`w-full px-3 py-2.5 rounded-lg border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm placeholder:text-muted-foreground ${errors.level ? 'border-destructive' : 'border-border'}`}
                />
                {errors.level && <p className="text-destructive text-xs mt-1">{errors.level}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Do you have an ongoing case? <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: true, label: 'Yes' },
                    { value: false, label: 'No' },
                  ].map((opt) => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => setForm({ ...form, hasOngoingCase: opt.value })}
                      className={`py-2.5 px-3 rounded-lg border text-sm transition-all ${
                        form.hasOngoingCase === opt.value
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="p-4 sm:p-6 border-t border-border flex flex-col-reverse sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-border rounded-lg text-foreground hover:bg-accent/30 transition-colors sm:shrink-0"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
