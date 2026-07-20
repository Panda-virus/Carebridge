import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, AlertTriangle, CheckCircle, Bot, User } from 'lucide-react';
import { CounselingRequest, CaseReport, CounselorSchedule } from '../../types';
import {
  CaseCategory,
  CounselingCategory,
  getCaseReportRouting,
  UrgencyLevel,
} from '../../utils/categorization';
import {
  autoScheduleAppointment,
  filterBookedSlots,
  formatSlotLabel,
  generateAvailableSlots,
  TimeSlot,
} from '../../utils/scheduling';
import {
  clearChatSessionToken,
  clearSavedChatConversation,
  getSavedChatConversation,
  saveChatConversation,
} from '../../services/chatConversationApi';

// ─── Types ─────────────────────────────────────────────────────────────────

type MessageSender = 'bot' | 'user';
type ChatStage =
  | 'welcome'
  | 'service_choice'
  | 'counseling_category'
  | 'counseling_describe'
  | 'schedule_proposal'
  | 'schedule_reschedule'
  | 'case_category'
  | 'case_describe'
  | 'case_incident_date'
  | 'case_location'
  | 'case_reporter_role'
  | 'collect_name'
  | 'collect_student_id'
  | 'collect_email'
  | 'collect_phone'
  | 'collect_department'
  | 'collect_year'
  | 'confirm'
  | 'emergency'
  | 'submitted';

interface ChatMessage {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: Date;
  isEmergency?: boolean;
  quickReplies?: string[];
}

interface CollectedData {
  serviceType?: 'counseling' | 'case_report' | 'emergency';
  selectedCategory?: CounselingCategory | CaseCategory;
  concern?: string;
  caseDescription?: string;
  urgencyLevel?: UrgencyLevel;
  proposedSlot?: TimeSlot;
  selectedSlot?: TimeSlot;
  isAnonymous?: boolean;
  reportedByType?: 'victim' | 'witness' | 'friend';
  studentName?: string;
  studentId?: string;
  studentEmail?: string;
  studentPhone?: string;
  department?: string;
  yearOfStudy?: string;
  incidentDate?: string;
  incidentLocation?: string;
}

interface CareBridgeChatbotProps {
  studentId: string;
  userName: string;
  studentEmail: string;
  counselorSchedule: CounselorSchedule;
  existingRequests: CounselingRequest[];
  onRequestSession: (request: Omit<CounselingRequest, 'id' | 'status' | 'createdAt'>) => void;
  onSubmitCaseReport: (report: Omit<CaseReport, 'id' | 'status' | 'createdAt'>) => void;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  resetConversationKey?: number;
}

// ─── Emergency keywords ────────────────────────────────────────────────────
const EMERGENCY_TRIGGERS = [
  'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die',
  'better off dead', 'no reason to live', 'hurt myself', 'self harm',
  'self-harm', 'cutting myself', 'being attacked', 'being raped',
  'in danger right now', 'help me now', 'emergency'
];

function detectEmergency(text: string): boolean {
  const lower = text.toLowerCase();
  return EMERGENCY_TRIGGERS.some(t => lower.includes(t));
}

// ─── Bot message builder ───────────────────────────────────────────────────
let msgCounter = 0;
function botMsg(text: string, quickReplies?: string[], isEmergency?: boolean): ChatMessage {
  return {
    id: `bot-${++msgCounter}`,
    sender: 'bot',
    text,
    timestamp: new Date(),
    quickReplies,
    isEmergency,
  };
}

function userMsg(text: string): ChatMessage {
  return {
    id: `user-${++msgCounter}`,
    sender: 'user',
    text,
    timestamp: new Date(),
  };
}

// ─── Routing description ───────────────────────────────────────────────────
function getRoutingDescription(category: string): string {
  switch (category) {
    case 'suicide':
    case 'self_harm':
      return 'our counselor with **URGENT priority** — they will contact you within the hour';
    case 'depression':
    case 'anxiety':
    case 'ptsd':
    case 'grief':
    case 'eating_disorder':
    case 'addiction':
      return 'our University Counsellor for professional mental health support';
    case 'relationship':
    case 'academic_stress':
    case 'general':
      return 'our University Counsellor for a supportive session';
    case 'sexual_harassment':
    case 'gbv':
      return 'the IIC (Investigating & Intervention Committee) for confidential handling';
    case 'financial_aid':
      return 'the Dean of Students office for fees and financial aid support';
    case 'academic_misconduct':
      return 'the Disciplinary Committee for review and action';
    case 'discrimination':
    case 'health_services':
    case 'housing':
      return 'the Dean of Students office for review and action';
    default:
      return 'the appropriate support team';
  }
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    depression: 'Depression & Low Mood',
    anxiety: 'Anxiety & Stress',
    ptsd: 'Trauma & PTSD',
    addiction: 'Addiction & Substance Use',
    relationship: 'Relationship Issues',
    academic_stress: 'Academic Stress',
    grief: 'Grief & Loss',
    self_harm: 'Self-Harm',
    suicide: 'Crisis Support',
    eating_disorder: 'Eating Disorder',
    general: 'General Counseling',
    financial_aid: 'Financial Aid',
    sexual_harassment: 'Sexual Harassment',
    gbv: 'Gender-Based Violence',
    academic_misconduct: 'Academic Misconduct',
    discrimination: 'Discrimination',
    health_services: 'Health Services',
    housing: 'Housing Issues',
  };
  return labels[category] || 'General Support';
}

const COUNSELING_CATEGORY_OPTIONS: { label: string; category: CounselingCategory }[] = [
  { label: 'Depression & Low Mood', category: 'depression' },
  { label: 'Anxiety & Stress', category: 'anxiety' },
  { label: 'Academic Stress', category: 'academic_stress' },
  { label: 'Relationship Issues', category: 'relationship' },
  { label: 'Grief & Loss', category: 'grief' },
  { label: 'Trauma & PTSD', category: 'ptsd' },
  { label: 'Addiction & Substance Use', category: 'addiction' },
  { label: 'Eating Disorder', category: 'eating_disorder' },
  { label: 'General Counseling', category: 'general' },
];

const CASE_CATEGORY_OPTIONS: { label: string; category: CaseCategory }[] = [
  { label: 'Sexual Harassment', category: 'sexual_harassment' },
  { label: 'Gender-Based Violence', category: 'gbv' },
  { label: 'Academic Misconduct', category: 'academic_misconduct' },
  { label: 'Discrimination', category: 'discrimination' },
  { label: 'Financial Aid / Fees', category: 'financial_aid' },
  { label: 'Health Services', category: 'health_services' },
  { label: 'Housing Issues', category: 'housing' },
  { label: 'General / Other', category: 'general' },
];

const REPORTER_ROLE_OPTIONS: { label: string; value: 'victim' | 'witness' | 'friend' }[] = [
  { label: 'I am the victim', value: 'victim' },
  { label: 'I am a concerned friend', value: 'friend' },
  { label: 'I am a witness', value: 'witness' },
];

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatOfficeHoursSummary(schedule: CounselorSchedule | undefined): string | null {
  if (!schedule?.availableSlots?.length) {
    return null;
  }

  const summary = schedule.availableSlots
    .slice()
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    .map((slot) => `${DAY_LABELS[slot.dayOfWeek] || 'Day'} • ${slot.startTime}–${slot.endTime}`)
    .join(' • ');

  return summary ? `Our counseling team is typically available on ${summary}.` : null;
}

function resolveCounselingCategory(input: string): CounselingCategory | null {
  const match = COUNSELING_CATEGORY_OPTIONS.find(
    (opt) => opt.label.toLowerCase() === input.toLowerCase()
  );
  return match?.category ?? null;
}

function resolveCaseCategory(input: string): CaseCategory | null {
  const match = CASE_CATEGORY_OPTIONS.find(
    (opt) => opt.label.toLowerCase() === input.toLowerCase()
  );
  return match?.category ?? null;
}

function defaultCounselingUrgency(category: CounselingCategory): UrgencyLevel {
  if (category === 'suicide' || category === 'self_harm') return 'immediate';
  if (['depression', 'ptsd', 'eating_disorder', 'addiction'].includes(category)) return 'high';
  return 'medium';
}

function defaultCaseUrgency(category: CaseCategory): UrgencyLevel {
  if (category === 'gbv' || category === 'sexual_harassment') return 'high';
  return 'medium';
}

function getCounselingUrgency(concern: string, category: CounselingCategory): UrgencyLevel {
  return detectEmergency(concern) ? 'immediate' : defaultCounselingUrgency(category);
}

function parseCaseReportInput(input: string, currentCategory?: CaseCategory): Partial<CollectedData> {
  const normalized = input.toLowerCase();
  const inferredCategory = currentCategory ?? (
    normalized.includes('sexual harassment') || normalized.includes('sexual assault')
      ? 'sexual_harassment'
      : normalized.includes('gender-based violence') || normalized.includes('gender based violence') || normalized.includes('gbv')
        ? 'gbv'
        : normalized.includes('discrimination')
          ? 'discrimination'
          : normalized.includes('financial aid') || normalized.includes('fees')
            ? 'financial_aid'
            : normalized.includes('academic misconduct') || normalized.includes('cheating')
              ? 'academic_misconduct'
              : normalized.includes('housing')
                ? 'housing'
                : normalized.includes('health')
                  ? 'health_services'
                  : undefined
  );

  const dateMatch = normalized.match(/\b(today|yesterday|last week|last month|this morning|this afternoon|this evening|last night|last weekend|ongoing)\b/) ||
    input.match(/\b(?:on|around|during|since)\s+([a-z0-9,./ -]{2,25})/i);

  const locationMatch = input.match(/\b(?:at|in|near|around|inside|outside|by|from)\s+([a-z0-9][a-z0-9 ,/.-]{2,40})/i);

  const reportedByType = normalized.includes('witness') || normalized.includes('saw it') || normalized.includes('i witnessed')
    ? 'witness'
    : normalized.includes('concerned friend') || normalized.includes('friend') || normalized.includes('as a friend')
      ? 'friend'
      : normalized.includes('victim') || normalized.includes('i am the victim')
        ? 'victim'
        : undefined;

  return {
    selectedCategory: inferredCategory,
    caseDescription: input,
    incidentDate: dateMatch?.[1] || dateMatch?.[0] || undefined,
    incidentLocation: locationMatch?.[1] || undefined,
    reportedByType,
  };
}

// ─── Main component ────────────────────────────────────────────────────────
export function CareBridgeChatbot({
  studentId,
  userName,
  studentEmail,
  counselorSchedule,
  existingRequests,
  onRequestSession,
  onSubmitCaseReport,
  isOpen: isOpenProp,
  onOpenChange,
  resetConversationKey,
}: CareBridgeChatbotProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = isOpenProp ?? internalIsOpen;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stage, setStage] = useState<ChatStage>('welcome');
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [data, setData] = useState<CollectedData>({});
  const [locationShared, setLocationShared] = useState(false);
  const [submittedType, setSubmittedType] = useState<'counseling' | 'case' | null>(null);
  const setIsOpen = useCallback((value: boolean) => {
    if (isOpenProp !== undefined) {
      onOpenChange?.(value);
    } else {
      setInternalIsOpen(value);
    }
  }, [isOpenProp, onOpenChange]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const slotOptionsRef = useRef<Map<string, TimeSlot>>(new Map());

  useEffect(() => {
    if (!isOpen || messages.length > 0) return;

    const savedConversation = getSavedChatConversation();
    if (!savedConversation) return;

    const restoredMessages = Array.isArray(savedConversation.messages)
      ? (savedConversation.messages as Array<{
          id?: string;
          sender?: MessageSender;
          text?: string;
          timestamp?: string;
          isEmergency?: boolean;
          quickReplies?: string[];
        }>).map((message) => ({
          id: message.id ?? `bot-${Math.random()}`,
          sender: message.sender === 'user' ? 'user' : 'bot',
          text: message.text ?? '',
          timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
          isEmergency: message.isEmergency,
          quickReplies: message.quickReplies,
        }))
      : [];

    if (restoredMessages.length === 0) return;

    const restoredStage = (savedConversation.stage as ChatStage | undefined) ?? 'welcome';
    const restoredData = (savedConversation.collected_data as CollectedData | undefined) ?? {};
    const restoredLocationShared = Boolean(savedConversation.locationShared);
    const restoredSubmittedType = savedConversation.submittedType as 'counseling' | 'case' | null | undefined;

    setMessages(restoredMessages);
    setStage(restoredStage);
    setData(restoredData);
    setLocationShared(restoredLocationShared);
    setSubmittedType(restoredSubmittedType ?? null);
    msgCounter = restoredMessages.reduce((max, message) => {
      const numericId = Number(message.id.replace(/\D/g, ''));
      return Number.isFinite(numericId) ? Math.max(max, numericId) : max;
    }, 0);
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (!isOpen || (stage === 'welcome' && messages.length === 0)) return;

    const authToken = localStorage.getItem('authToken');
    saveChatConversation(
      {
        user_id: studentId ? parseInt(studentId, 10) : undefined,
        stage,
        collected_data: data as Record<string, unknown>,
        messages: messages.map((m) => ({
          sender: m.sender,
          text: m.text,
          timestamp: m.timestamp.toISOString(),
        })),
        service_type: data.serviceType,
        submitted: stage === 'submitted',
      },
      authToken
    );
  }, [isOpen, stage, data, messages, studentId]);

  // ─── Show bot messages with typing delay ─────────────────────────────────
  const showBotMessages = useCallback((msgs: ChatMessage[]) => {
    if (msgs.length === 0) return;
    setIsTyping(true);

    const delays = msgs.map((_, i) => 600 + i * 800);

    msgs.forEach((msg, i) => {
      setTimeout(() => {
        setMessages(prev => [...prev, msg]);
        if (i === msgs.length - 1) setIsTyping(false);
      }, delays[i]);
    });
  }, []);

  // ─── Reset ─────────────────────────────────────────────────────────────────
  const resetChat = useCallback(() => {
    setMessages([]);
    setStage('welcome');
    setData({});
    setInputValue('');
    setLocationShared(false);
    setSubmittedType(null);
    clearChatSessionToken();
    clearSavedChatConversation();
    msgCounter = 0;
  }, []);

  useEffect(() => {
    if (!resetConversationKey) return;
    resetChat();
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 300);
  }, [resetConversationKey, resetChat, setIsOpen]);

  // ─── Init on open ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || messages.length > 0) return;

    showBotMessages([
      botMsg(`Hi ${userName.split(' ')[0]}! 👋 I'm CareBridge's supportive assistant.`),
      botMsg(
        `I'm here to listen and help connect you with the right support. Everything you share is **confidential**.\n\nWhat brings you here today?`,
        ['I need counseling support', 'I want to report something', 'I\'m in immediate danger']
      ),
    ]);
    setStage('service_choice');
  }, [isOpen, messages.length, userName, showBotMessages]);

  // ─── Handle user input ────────────────────────────────────────────────────
  const handleSend = useCallback((text: string) => {
    if (!text.trim()) return;
    const trimmed = text.trim();

    setMessages(prev => [...prev, userMsg(trimmed)]);
    setInputValue('');

    // Emergency detection
    if (detectEmergency(trimmed) && stage !== 'emergency' && stage !== 'submitted') {
      handleEmergency(trimmed);
      return;
    }

    processStage(trimmed);
  }, [stage, data]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleEmergency = useCallback((text: string) => {
    setStage('emergency');
    setData(prev => ({ ...prev, concern: text, serviceType: 'emergency' }));

    showBotMessages([
      botMsg(
        '🚨 **Your safety is our immediate priority.**\n\nI can see you may be in crisis right now. You are not alone — we are here with you.',
        undefined,
        true
      ),
      botMsg(
        '**Emergency Resources (Available 24/7):**\n• Campus Security: **0999 100 000**\n• Emergency Counselor on call: **0882 200 000**\n• National Crisis Line: **116**\n\nAn urgent alert is being sent to our counseling team with your information.',
        undefined,
        true
      ),
      botMsg(
        'Can I share your location so our team can reach you quickly?',
        ['Yes, share my location', 'No, I\'ll contact them directly'],
        true
      ),
    ]);
  }, [showBotMessages]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setInputValue('');
    setTimeout(() => inputRef.current?.blur(), 50);
  }, [setIsOpen]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 300);
  }, [setIsOpen]);

  const processStage = useCallback((input: string) => {
    switch (stage) {
      case 'service_choice':
      case 'welcome': {
        const lower = input.toLowerCase();
        if (lower.includes('how do i report') || lower.includes('how to report') || lower.includes('guide')) {
          showBotMessages([
            botMsg(
              'To report a case, simply choose the issue type and describe what happened. We will guide you through the whole process, ask for key details, and help route your report to the right university authority.',
              ['I want to report something', 'How is a reported case handled?', 'I need counseling support']
            ),
          ]);
        } else if (lower.includes('how is') && lower.includes('case handled') || lower.includes('case handled')) {
          showBotMessages([
            botMsg(
              'Reported cases are reviewed by the appropriate team, such as IIC, Dean of Students, or Disciplinary Committee, depending on the issue. We keep information confidential, and the team will take the next steps while keeping you informed.',
              ['I want to report something', 'How do I report a case?', 'I need counseling support']
            ),
          ]);
        } else if (lower.includes('counsel') || lower.includes('talk') || lower.includes('support') || lower.includes('session')) {
          setData(prev => ({ ...prev, serviceType: 'counseling' }));
          setStage('counseling_category');
          showBotMessages([
            botMsg("I'm glad you reached out. It takes real courage to ask for help."),
            botMsg(
              "I can help you describe what you're feeling and guide you to a counselor who can support you.",
              COUNSELING_CATEGORY_OPTIONS.map((opt) => opt.label)
            ),
          ]);
        } else if (lower.includes('report') || lower.includes('incident') || lower.includes('something happened') || lower.includes('case')) {
          setData(prev => ({ ...prev, serviceType: 'case_report' }));
          setStage('case_category');
          showBotMessages([
            botMsg("Thank you for trusting us with this. I'm here to support you through the process and connect you to the right university authority."),
            botMsg(
              "What type of issue would you like to report?",
              CASE_CATEGORY_OPTIONS.map((opt) => opt.label)
            ),
          ]);
        } else if (lower.includes('danger') || lower.includes('crisis') || lower.includes('emergency')) {
          handleEmergency(input);
        } else {
          showBotMessages([
            botMsg(
              "Please choose one of the options below so I can connect you with the right support.",
              ['I need counseling support', 'I want to report something', 'How do I report a case?', 'How is a reported case handled?', 'I\'m in immediate danger']
            ),
          ]);
        }
        break;
      }

      case 'counseling_category': {
        const category = resolveCounselingCategory(input);
        if (!category) {
          showBotMessages([
            botMsg(
              "Please tap one of the options below to continue.",
              COUNSELING_CATEGORY_OPTIONS.map((opt) => opt.label)
            ),
          ]);
          break;
        }
        setData(prev => ({ ...prev, selectedCategory: category }));
        setStage('counseling_describe');
        showBotMessages([
          botMsg(`Thank you. I hear you that this is about ${getCategoryLabel(category)}.`),
          botMsg(
            "When you're ready, share a little of what you've been experiencing. I’ll help guide you to a counselor who can support you.",
          ),
        ]);
        break;
      }

      case 'counseling_describe': {
        const concern = input;
        const category = (data.selectedCategory || 'general') as CounselingCategory;
        const urgency = getCounselingUrgency(concern, category);

        if (detectEmergency(concern)) {
          handleEmergency(concern);
          return;
        }

        const nextData = { ...data, concern, urgencyLevel: urgency };
        setData(nextData);
        showBotMessages([
          botMsg(
            'Thank you for sharing this with me. Your experience matters, and I’m here to help you connect with a counselor who can support you further.'
          ),
        ]);
        setTimeout(() => proposeSchedule(nextData), 600);
        break;
      }

      case 'schedule_proposal': {
        const lower = input.toLowerCase();
        if (lower.includes('accept') || lower.includes('approve') || lower.includes('book')) {
          const slot = data.proposedSlot;
          if (!slot) {
            showBotMessages([botMsg('Something went wrong. Please try again.', ['Choose another time'])]);
            setStage('schedule_reschedule');
            showRescheduleOptions(data);
            break;
          }
          submitCounselingRequest({ ...data, selectedSlot: slot });
          break;
        }
        if (lower.includes('reschedule') || lower.includes('another') || lower.includes('different')) {
          setStage('schedule_reschedule');
          showRescheduleOptions(data);
          break;
        }
        showBotMessages([
          botMsg('Please tap **Approve this time** or **Choose another time**.', ['Approve this time', 'Choose another time']),
        ]);
        break;
      }

      case 'schedule_reschedule': {
        const slot = slotOptionsRef.current.get(input);
        if (!slot) {
          showBotMessages([
            botMsg('Please pick one of the available times below.'),
          ]);
          showRescheduleOptions(data);
          break;
        }
        submitCounselingRequest({ ...data, selectedSlot: slot });
        break;
      }

      case 'case_category': {
        const parsed = parseCaseReportInput(input, data.selectedCategory as CaseCategory | undefined);
        const category = parsed.selectedCategory ?? resolveCaseCategory(input);
        if (!category) {
          showBotMessages([
            botMsg(
              "Please tap one of the options below to continue.",
              CASE_CATEGORY_OPTIONS.map((opt) => opt.label)
            ),
          ]);
          break;
        }

        setData(prev => ({
          ...prev,
          selectedCategory: category,
          caseDescription: parsed.caseDescription || input,
          incidentDate: parsed.incidentDate ?? prev.incidentDate,
          incidentLocation: parsed.incidentLocation ?? prev.incidentLocation,
          reportedByType: parsed.reportedByType ?? prev.reportedByType,
        }));

        if (parsed.incidentDate || parsed.incidentLocation) {
          setStage('case_reporter_role');
          showBotMessages([
            botMsg(`Thank you. I hear you that this is about ${getCategoryLabel(category)}.`),
            botMsg('Who are you reporting as?', REPORTER_ROLE_OPTIONS.map((opt) => opt.label)),
          ]);
        } else {
          setStage('case_describe');
          showBotMessages([
            botMsg(`Thank you. I hear you that this is about ${getCategoryLabel(category)}.`),
            botMsg(
              "I’m sorry this has happened. Please describe what occurred when you feel ready. I’ll help make sure this reaches the right authority.",
            ),
          ]);
        }
        break;
      }

      case 'case_describe': {
        if (detectEmergency(input)) {
          handleEmergency(input);
          return;
        }

        const parsed = parseCaseReportInput(input, (data.selectedCategory || 'general') as CaseCategory);
        setData(prev => ({
          ...prev,
          caseDescription: parsed.caseDescription || input,
          selectedCategory: parsed.selectedCategory ?? prev.selectedCategory,
          incidentDate: parsed.incidentDate ?? prev.incidentDate,
          incidentLocation: parsed.incidentLocation ?? prev.incidentLocation,
          reportedByType: parsed.reportedByType ?? prev.reportedByType,
        }));

        const category = (parsed.selectedCategory || data.selectedCategory || 'general') as CaseCategory;
        const hasParsedContext = Boolean(parsed.incidentDate || parsed.incidentLocation);

        if (hasParsedContext) {
          setStage('case_reporter_role');
          showBotMessages([
            botMsg("Thank you for sharing this. I want you to make sure this reaches the right authority."),
            botMsg('Who are you reporting as?', REPORTER_ROLE_OPTIONS.map((opt) => opt.label)),
          ]);
        } else {
          setStage('case_incident_date');
          showBotMessages([
            botMsg("Thank you for sharing this with us. I’ll help make sure this reaches the right authority."),
            botMsg("When did this happen? (You can say something like 'last week', 'January 15th', or 'ongoing')"),
          ]);
        }
        break;
      }

      case 'case_incident_date': {
        setData(prev => ({ ...prev, incidentDate: input }));
        if (data.incidentLocation) {
          setStage('case_reporter_role');
          showBotMessages([
            botMsg('Who are you reporting as?', REPORTER_ROLE_OPTIONS.map((opt) => opt.label)),
          ]);
        } else {
          setStage('case_location');
          showBotMessages([
            botMsg("Where did this happen? (e.g. 'Science Block', 'Hostel Block C', 'Online/virtual'). If you're unsure, just share what you remember."),
          ]);
        }
        break;
      }

      case 'case_location': {
        setData(prev => ({ ...prev, incidentLocation: input }));
        setStage('case_reporter_role');
        showBotMessages([
          botMsg('Who are you reporting as?', REPORTER_ROLE_OPTIONS.map((opt) => opt.label)),
        ]);
        break;
      }

      case 'case_reporter_role': {
        const role = input.toLowerCase().includes('witness') || input.toLowerCase().includes('saw it')
          ? 'witness'
          : input.toLowerCase().includes('friend') || input.toLowerCase().includes('concerned')
            ? 'friend'
            : input.toLowerCase().includes('victim')
              ? 'victim'
              : undefined;

        if (!role) {
          showBotMessages([
            botMsg('Please choose who you are reporting as.', REPORTER_ROLE_OPTIONS.map((opt) => opt.label)),
          ]);
          break;
        }

        setData(prev => ({ ...prev, reportedByType: role }));
        setStage('collect_name');
        showBotMessages([
          botMsg("Thank you. I’ll include that context in the report so the right support team can handle it properly."),
          botMsg("What is your full name?"),
        ]);
        break;
      }

      case 'collect_name': {
        setData(prev => ({ ...prev, studentName: input }));
        setStage('collect_student_id');
        showBotMessages([botMsg("What is your Student ID number?")]);
        break;
      }

      case 'collect_student_id': {
        setData(prev => ({ ...prev, studentId: input }));
        setStage('collect_email');
        showBotMessages([botMsg("What is your university email address?")]);
        break;
      }

      case 'collect_email': {
        setData(prev => ({ ...prev, studentEmail: input }));
        setStage('collect_department');
        showBotMessages([botMsg("What department are you in? (e.g. 'Computer Science', 'Business Administration')")]);
        break;
      }

      case 'collect_department': {
        setData(prev => ({ ...prev, department: input }));
        setStage('collect_year');
        showBotMessages([botMsg("What year of study are you in?", ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Postgraduate'])]);
        break;
      }

      case 'collect_year': {
        const year = input.replace('Year ', '').replace('Postgraduate', '5');
        setData(prev => ({ ...prev, yearOfStudy: year }));
        setStage('confirm');
        showConfirmation({ ...data, yearOfStudy: year });
        break;
      }

      case 'confirm': {
        const lower = input.toLowerCase();
        if (lower.includes('yes') || lower.includes('submit') || lower.includes('confirm') || lower.includes('correct')) {
          submitCase();
        } else {
          showBotMessages([
            botMsg(
              "No problem! Would you like to start over or make a correction?",
              ['Start over', 'Everything is correct, submit it']
            ),
          ]);
        }
        break;
      }

      case 'emergency': {
        const lower = input.toLowerCase();
        if (lower.includes('yes') || lower.includes('share') || lower.includes('location')) {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              () => {
                setLocationShared(true);
                showBotMessages([
                  botMsg('✅ Location shared. Our counselor team has been alerted and will contact you shortly.', undefined, true),
                  botMsg('In the meantime, please try to stay somewhere safe. Is there someone you trust who can be with you right now?', ['Yes, I have someone', 'No, I\'m alone']),
                ]);
              },
              () => {
                showBotMessages([botMsg('Unable to get location. Please call our emergency line: **0882 200 000**', undefined, true)]);
              }
            );
          }
        } else {
          showBotMessages([
            botMsg('That\'s okay. Please reach out to our emergency counselor directly: **0882 200 000**\n\nI\'ve sent an alert to the counseling team. You\'re not alone.', undefined, true),
          ]);
        }

        // Submit emergency counseling request
        setTimeout(() => submitEmergencyCase(), 2000);
        break;
      }

      case 'submitted': {
        const lower = input.toLowerCase();
        if (lower.includes('close') || lower.includes('bye') || lower.includes('goodbye')) {
          handleClose();
        } else if (lower.includes('new') || lower.includes('start') || lower.includes('another')) {
          resetChat();
        } else {
          showBotMessages([
            botMsg("Would you like to start a new request or close the chat?", ['Start a new request', 'Close chat']),
          ]);
        }
        break;
      }

      default:
        break;
    }
  }, [stage, data, showBotMessages, handleEmergency, counselorSchedule, existingRequests, handleClose, resetChat]);

  function getAvailableSlots(urgency: UrgencyLevel): TimeSlot[] {
    const allSlots = generateAvailableSlots(counselorSchedule);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();

    return filterBookedSlots(allSlots, existingRequests).filter((slot) => {
      const slotDate = new Date(slot.date);
      slotDate.setHours(0, 0, 0, 0);

      if (slotDate.getTime() < today.getTime()) {
        return false;
      }

      if (slotDate.getTime() === today.getTime()) {
        const [hour, minute] = slot.time.split(':').map(Number);
        const slotMinutes = hour * 60 + minute;
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        return slotMinutes > nowMinutes;
      }

      return true;
    });
  }

  function proposeSchedule(currentData: CollectedData) {
    const urgency = currentData.urgencyLevel || 'medium';
    const available = getAvailableSlots(urgency);
    const proposed = autoScheduleAppointment(available, urgency, 'any');

    if (!proposed) {
      setStage('schedule_reschedule');
      showBotMessages([
        botMsg("Thank you for sharing. I couldn't find an automatic slot right now, but our counseling team will reach out to arrange a session that suits you."),
      ]);
      showRescheduleOptions(currentData);
      return;
    }

    setData((prev) => ({ ...prev, proposedSlot: proposed }));
    setStage('schedule_proposal');

    const officeHoursMessage = formatOfficeHoursSummary(counselorSchedule);
    const introMessage = officeHoursMessage
      ? `${officeHoursMessage}\n\nI’ve suggested the next available counseling slot based on your needs.`
      : "Thank you for sharing. I’ve suggested the next available counseling slot based on your needs.";

    showBotMessages([
      botMsg(introMessage),
      botMsg(
        `Here's a suggested session with **${counselorSchedule.counselorName || 'our counseling team'}**:\n\n📅 **${formatSlotLabel(proposed.date, proposed.time)}**\n\nWould you like to approve this time or choose another one?`,
        ['Approve this time', 'Choose another time']
      ),
    ]);
  }

  function showRescheduleOptions(currentData: CollectedData) {
    const urgency = currentData.urgencyLevel || 'medium';
    const available = getAvailableSlots(urgency).slice(0, 8);

    if (available.length === 0) {
      showBotMessages([
        botMsg("There are no open slots right now. Our counseling office will contact you to arrange a time."),
      ]);
      return;
    }

    slotOptionsRef.current = new Map(
      available.map((slot) => [formatSlotLabel(slot.date, slot.time), slot])
    );

    showBotMessages([
      botMsg(
        'Pick a time that works for you:',
        available.map((slot) => formatSlotLabel(slot.date, slot.time))
      ),
    ]);
  }

  function submitCounselingRequest(requestData: CollectedData) {
    const category = (requestData.selectedCategory || 'general') as CounselingCategory;
    const urgency = requestData.urgencyLevel || getCounselingUrgency(requestData.concern || '', category);
    const slot = requestData.selectedSlot || requestData.proposedSlot;

    if (!slot) {
      showBotMessages([botMsg('Please select a session time to continue.')]);
      setStage('schedule_reschedule');
      showRescheduleOptions(requestData);
      return;
    }

    onRequestSession({
      studentId,
      studentName: userName,
      studentEmail,
      concern: requestData.concern || '',
      category,
      urgencyLevel: urgency,
      requiresImmediateAttention: urgency === 'immediate',
      matchedKeywords: [],
      preferredTime: 'any',
      autoScheduleProposal: {
        proposedDate: slot.date,
        proposedTime: slot.time,
        studentApproved: true,
        counselorApproved: false,
      },
    });

    setSubmittedType('counseling');
    setStage('submitted');
    showBotMessages([
      botMsg('✅ **Counseling request submitted!**'),
      botMsg(
        `Your session is proposed for **${formatSlotLabel(slot.date, slot.time)}**.\n\nOur counselor will confirm shortly. You'll be notified once it's approved.`
      ),
      botMsg("Is there anything else I can help you with?", ['Start a new request', 'Close chat']),
    ]);
  }

  // ─── Show confirmation ─────────────────────────────────────────────────────
  function showConfirmation(finalData: CollectedData) {
    const isCounseling = finalData.serviceType === 'counseling';

    if (isCounseling) {
      return;
    } else {
      const category = (finalData.selectedCategory || 'general') as CaseCategory;
      const routing = getCaseReportRouting(category);
      const routingLabels: Record<string, string> = {
        iic: 'IIC (Investigating & Intervention Committee)',
        dean: 'Dean of Students',
        registrar: "Registrar's Office",
        disciplinary: 'Disciplinary Committee',
      };
      const routingLabel = routingLabels[routing] || 'the appropriate support team';
      const urgency = detectEmergency(finalData.caseDescription || '')
        ? 'immediate'
        : defaultCaseUrgency(category);
      const urgencyEmoji = { immediate: '🔴', critical: '🟠', high: '🟡', medium: '🔵', low: '🟢' }[urgency] || '🔵';
      const reporterLabel = finalData.reportedByType === 'friend'
        ? 'Concerned friend'
        : finalData.reportedByType === 'witness'
          ? 'Witness'
          : 'Victim';

      showBotMessages([
        botMsg(`Here's a summary of your case report:\n\n**Category:** ${getCategoryLabel(category)}\n**Urgency:** ${urgencyEmoji} ${urgency.charAt(0).toUpperCase() + urgency.slice(1)}\n**Reported as:** ${reporterLabel}\n**Details:** ${finalData.incidentDate || 'Not provided'} • ${finalData.incidentLocation || 'Not provided'}\n\nThis will be routed to: **${routingLabel}**\n\nShall I submit this on your behalf?`,
          ['Yes, submit my report', 'No, let me change something']
        ),
      ]);
    }
  }

  // ─── Submit case ───────────────────────────────────────────────────────────
  function submitCase() {
    if (data.serviceType === 'counseling') {
      submitCounselingRequest(data);
      return;
    }

    const category = (data.selectedCategory || 'general') as CaseCategory;
    const routing = getCaseReportRouting(category);
    const isGBV = routing === 'iic';
    const urgency = detectEmergency(data.caseDescription || '')
      ? 'immediate'
      : defaultCaseUrgency(category);

    onSubmitCaseReport({
      category: isGBV ? 'sexual_harassment_gbv' : 'general',
      description: data.caseDescription || '',
      detailedCategory: category,
      urgencyLevel: urgency,
      requiresLocationSharing: urgency === 'immediate',
      matchedKeywords: [],
      studentName: data.studentName || userName || undefined,
      studentId: data.studentId || studentId || undefined,
      studentEmail: data.studentEmail || studentEmail || undefined,
      department: data.department,
      yearOfStudy: data.yearOfStudy,
      incidentDate: data.incidentDate,
      incidentLocation: data.incidentLocation,
      reportedByType: data.reportedByType,
    });
    setSubmittedType('case');

    setStage('submitted');
    showBotMessages([
      botMsg('✅ **Successfully submitted!**'),
      botMsg(
        "Your case report has been submitted and routed to the appropriate team. They will review it confidentially and take appropriate action.\n\nThank you for trusting CareBridge. 💙"
      ),
      botMsg("Is there anything else I can help you with?", ['Start a new request', 'Close chat']),
    ]);
  }

  function submitEmergencyCase() {
    onRequestSession({
      studentId,
      studentName: userName,
      studentEmail: '',
      concern: data.concern || 'Emergency crisis — requires immediate attention',
      urgencyLevel: 'immediate',
      requiresImmediateAttention: true,
      matchedKeywords: ['emergency', 'crisis'],
      preferredTime: 'any',
    });
    setSubmittedType('counseling');
  }

  // ─── Reset (UI handler) ────────────────────────────────────────────────────
  function handleResetChat() {
    resetChat();
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        onClick={isOpen ? handleClose : handleOpen}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-colors"
        style={{ backgroundColor: isOpen ? '#1e7a2c' : '#279B37' }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open CareBridge Chat"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.2 }}>
              <MessageCircle className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse ring (when closed) */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ backgroundColor: '#279B37' }} />
        )}
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed z-50 flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-border inset-x-3 bottom-[4.75rem] sm:inset-x-auto sm:right-4 sm:bottom-24 sm:left-auto w-auto sm:w-[min(380px,calc(100vw-2rem))] h-[min(560px,calc(100dvh-6rem))] max-h-[calc(100dvh-6rem)]"
            style={{ backgroundColor: '#faf8f5' }}
          >
            {/* Header */}
            <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: '#279B37' }}>
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium leading-tight">CareBridge AI</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-white/70 text-xs">Always here for you</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetChat}
                  className="text-white/60 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
                >
                  New chat
                </button>
                <button
                  onClick={handleClose}
                  aria-label="Close chat"
                  className="text-white/60 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ backgroundColor: '#faf8f5' }}>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} onQuickReply={handleSend} />
              ))}

              {isTyping && (
                <div className="flex items-end gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#c8e6c9' }}>
                    <Bot className="w-4 h-4" style={{ color: '#279B37' }} />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-bl-sm" style={{ backgroundColor: '#e8f5e9' }}>
                    <div className="flex gap-1 items-center h-4">
                      {[0, 1, 2].map(i => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{ backgroundColor: '#279B37', animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            {stage !== 'submitted' && (
              <div className="px-4 py-3 border-t" style={{ borderColor: '#c8e6c9', backgroundColor: '#f1f8f2' }}>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ backgroundColor: 'white', borderColor: '#279B37' }}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(inputValue);
                      }
                    }}
                    placeholder={
                      stage === 'emergency' ? 'Type your response...' :
                      stage === 'collect_name' ? 'Your full name...' :
                      stage === 'collect_email' ? 'Your email address...' :
                      stage === 'collect_phone' ? 'Your phone number or "skip"...' :
                      'Type your message...'
                    }
                    className="flex-1 text-sm outline-none bg-transparent"
                    style={{ color: '#1a5c24' }}
                  />
                  <button
                    onClick={() => handleSend(inputValue)}
                    disabled={!inputValue.trim()}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40"
                    style={{ backgroundColor: inputValue.trim() ? '#279B37' : '#88c98e' }}
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
                <p className="text-center text-xs mt-2" style={{ color: '#a08060' }}>
                  🔒 Your conversation is confidential
                </p>
              </div>
            )}

            {stage === 'submitted' && (
              <div className="px-4 py-3 border-t text-center" style={{ borderColor: '#c8e6c9', backgroundColor: '#f1f8f2' }}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5" style={{ color: '#6b8f5e' }} />
                  <span className="text-sm font-medium" style={{ color: '#6b8f5e' }}>
                    {submittedType === 'counseling' ? 'Counseling request submitted' : 'Case report submitted'}
                  </span>
                </div>
                <button
                  onClick={handleResetChat}
                  className="text-sm px-4 py-2 rounded-lg transition-colors"
                  style={{ backgroundColor: '#279B37', color: 'white' }}
                >
                  Start new conversation
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Message bubble component ──────────────────────────────────────────────
function MessageBubble({ message, onQuickReply }: { message: ChatMessage; onQuickReply: (text: string) => void }) {
  const isBot = message.sender === 'bot';

  const renderText = (text: string) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={i}>
          {i > 0 && <br />}
          {parts.map((part, j) =>
            part.startsWith('**') && part.endsWith('**') ? (
              <strong key={j}>{part.slice(2, -2)}</strong>
            ) : (
              part
            )
          )}
        </span>
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-end gap-2 ${isBot ? '' : 'flex-row-reverse'}`}
    >
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-1"
        style={{ backgroundColor: isBot ? '#c8e6c9' : '#279B37' }}
      >
        {isBot ? (
          <Bot className="w-4 h-4" style={{ color: '#279B37' }} />
        ) : (
          <User className="w-4 h-4 text-white" />
        )}
      </div>

      <div className={`flex flex-col gap-2 max-w-[80%] ${isBot ? 'items-start' : 'items-end'}`}>
        {/* Bubble */}
        <div
          className={`px-4 py-2.5 text-sm leading-relaxed ${
            message.isEmergency
              ? 'rounded-2xl border-2'
              : isBot
              ? 'rounded-2xl rounded-bl-sm'
              : 'rounded-2xl rounded-br-sm'
          }`}
          style={
            message.isEmergency
              ? { backgroundColor: '#fff0f0', borderColor: '#e05555', color: '#7a1515' }
              : isBot
              ? { backgroundColor: '#e8f5e9', color: '#1a5c24' }
              : { backgroundColor: '#279B37', color: 'white' }
          }
        >
          {message.isEmergency && (
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: '#e05555' }} />
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#e05555' }}>Emergency Alert</span>
            </div>
          )}
          <span>{renderText(message.text)}</span>
        </div>

        {/* Quick replies */}
        {message.quickReplies && message.quickReplies.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.quickReplies.map((reply) => (
              <button
                key={reply}
                onClick={() => onQuickReply(reply)}
                className="text-xs px-3 py-1.5 rounded-full border transition-all hover:shadow-sm"
                style={{ borderColor: '#279B37', color: '#279B37', backgroundColor: 'white' }}
                onMouseEnter={e => {
                  (e.target as HTMLElement).style.backgroundColor = '#e8f5e9';
                }}
                onMouseLeave={e => {
                  (e.target as HTMLElement).style.backgroundColor = 'white';
                }}
              >
                {reply}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
