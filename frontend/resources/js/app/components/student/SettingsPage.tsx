import { useMemo, useState } from 'react';
import {
  BellRing,
  ChevronRight,
  Download,
  FileText,
  Lock,
  Save,
  ShieldCheck,
  Smartphone,
  Trash2,
} from 'lucide-react';

interface SettingsPageProps {
  studentId: string;
  userName: string;
  userEmail: string;
}

interface PreferenceToggle {
  label: string;
  description: string;
  enabled: boolean;
}

export function SettingsPage({ studentId, userName, userEmail }: SettingsPageProps) {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsReminders, setSmsReminders] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [activePolicy, setActivePolicy] = useState<'privacy' | 'terms' | 'support' | null>('terms');

  const preferenceCards = useMemo<PreferenceToggle[]>(() => [
    {
      label: 'Email updates',
      description: 'Receive case progress updates and counseling reminders in your inbox.',
      enabled: emailNotifications,
    },
    {
      label: 'SMS reminders',
      description: 'Get short reminders before your counseling sessions or appointments.',
      enabled: smsReminders,
    },
    {
      label: 'Private mode',
      description: 'Hide sensitive account details in public-facing views and summaries.',
      enabled: privacyMode,
    },
  ], [compactMode, emailNotifications, privacyMode, smsReminders]);

  const policyItems = [
    {
      id: 'terms' as const,
      title: 'Terms & conditions',
      summary: 'The platform reflects the University’s anti-sexual-harassment standards and the expectation of respectful conduct.',
      points: [
        'Sexual harassment includes unwelcome sexual behaviour, coercion, quid pro quo conduct, and hostile or intimidating behaviour that affects learning, work, or wellbeing.',
        'Effective consent must be freely and actively given, and consent cannot be assumed from silence, previous conduct, or pressure.',
        'Reports should be made promptly, and false allegations may be investigated under the University’s disciplinary processes.',
      ],
    },
    {
      id: 'privacy' as const,
      title: 'Privacy policy',
      summary: 'CareBridge is guided by confidentiality, respect for privacy, and the right of complainants to seek support safely.',
      points: [
        'Personal information shared with the platform is treated confidentially and handled only for support, investigation, and safety-related purposes.',
        'The University recognises the right of complainants and witnesses to privacy and discourages unnecessary sharing of sensitive details outside approved reporting channels.',
        'Students may request support, ask for information about their case handling, or seek guidance on reporting without being forced to disclose more than necessary.',
      ],
    },
    {
      id: 'support' as const,
      title: 'Support & safety policy',
      summary: 'The University is committed to providing a safe environment, support services, and clear reporting mechanisms.',
      points: [
        'Any person who experiences or witnesses sexual harassment may report the matter through the University’s designated reporting channels, including the Registrar’s office.',
        'The University may provide medical care, psychosocial support, leave, or other relief to an aggrieved person while an inquiry is pending.',
        'The University also prohibits retaliation against anyone who reports misconduct, assists an investigation, or participates in a disciplinary process.',
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[28px] border border-border/80 bg-gradient-to-br from-white via-primary/5 to-white p-6 shadow-[0_20px_60px_-24px_rgba(39,155,55,0.3)] backdrop-blur">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Settings</p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">Manage your CareBridge experience</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Fine-tune your account, communication preferences, and the way you interact with support services.
            </p>
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
            <Save className="h-4 w-4" />
            Save changes
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="rounded-[24px] border border-border/80 bg-white/85 p-6 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.28)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Policies & legal</h2>
                <p className="text-sm text-muted-foreground">Review our guidance, terms, and support policies</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {policyItems.map((item) => (
                <div key={item.id} className="space-y-2">
                  <button
                    onClick={() => setActivePolicy(activePolicy === item.id ? null : item.id)}
                    className="flex w-full items-center justify-between rounded-2xl border border-border bg-background/70 px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent/30"
                  >
                    <span>{item.title}</span>
                    <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${activePolicy === item.id ? 'rotate-90' : ''}`} />
                  </button>

                  {activePolicy === item.id && (
                    <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">{item.summary}</p>
                      <ul className="mt-3 space-y-2">
                        {item.points.map((point) => (
                          <li key={point} className="flex gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[24px] border border-border/80 bg-white/85 p-6 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.28)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <BellRing className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
                <p className="text-sm text-muted-foreground">Choose how CareBridge reaches you</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {preferenceCards.map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-background/70 p-4">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (item.label === 'Email updates') setEmailNotifications((value) => !value);
                      else if (item.label === 'SMS reminders') setSmsReminders((value) => !value);
                      else setPrivacyMode((value) => !value);
                    }}
                    className={`relative h-6 w-11 rounded-full transition-colors ${item.enabled ? 'bg-primary' : 'bg-muted'}`}
                    aria-label={`Toggle ${item.label}`}
                  >
                    <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${item.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[24px] border border-border/80 bg-white/85 p-6 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.28)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Experience</h2>
                <p className="text-sm text-muted-foreground">Adjust the platform to suit your everyday workflow</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-background/70 p-4">
                <div>
                  <p className="font-medium text-foreground">Compact layout</p>
                  <p className="mt-1 text-sm text-muted-foreground">Reduce spacing to fit more information on screen.</p>
                </div>
                <button
                  onClick={() => setCompactMode((value) => !value)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${compactMode ? 'bg-primary' : 'bg-muted'}`}
                  aria-label="Toggle compact layout"
                >
                  <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${compactMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-border/80 bg-white/85 p-6 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.28)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Privacy & security</h2>
                <p className="text-sm text-muted-foreground">Keep your information safe and under your control</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button className="flex w-full items-center justify-between rounded-2xl border border-border bg-background/70 px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent/30">
                <span className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-primary" />
                  Download my data
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
              <button className="flex w-full items-center justify-between rounded-2xl border border-border bg-background/70 px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent/30">
                <span className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  Change password
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
              <button className="flex w-full items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
                <span className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete account
                </span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
