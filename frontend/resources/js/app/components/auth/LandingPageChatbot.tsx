import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { clearSavedChatConversation, saveChatConversation } from '../../services/chatConversationApi';

type MessageSender = 'bot' | 'user';
type ChatStage = 'welcome' | 'intro' | 'auth_choice';

interface ChatMessage {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: Date;
  quickReplies?: string[];
}

interface LandingPageChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  onShowLogin: (openRegister?: boolean) => void;
}

let msgCounter = 0;
function botMsg(text: string, quickReplies?: string[]): ChatMessage {
  return {
    id: `bot-${++msgCounter}`,
    sender: 'bot',
    text,
    timestamp: new Date(),
    quickReplies,
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

export function LandingPageChatbot({ isOpen, onClose, onShowLogin }: LandingPageChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stage, setStage] = useState<ChatStage>('welcome');
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setStage('welcome');
      setInputValue('');
      msgCounter = 0;
      clearSavedChatConversation();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    saveChatConversation({
      stage,
      messages: messages.map((message) => ({
        id: message.id,
        sender: message.sender,
        text: message.text,
        timestamp: message.timestamp.toISOString(),
      })),
    });
  }, [isOpen, messages, stage]);

  useEffect(() => {
    if (!isOpen || messages.length > 0) return;

    const timer = setTimeout(() => {
      showBotMessages([
        botMsg(`Hello and welcome to CareBridge. 😊 You're in a safe space here, and I’m ready to walk you through support options with care.`),
        botMsg(
          `How can I help you today? Choose one of the options below and I’ll guide you through it.`,
          ['Get counselling', 'How to report a case', 'How to access services', 'How cases are handled']
        ),
      ]);
      setStage('intro');
    }, 500);

    return () => clearTimeout(timer);
  }, [isOpen, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const showBotMessages = (msgs: ChatMessage[]) => {
    if (msgs.length === 0) return;
    setIsTyping(true);

    msgs.forEach((msg, i) => {
      setTimeout(() => {
        setMessages(prev => [...prev, msg]);
        if (i === msgs.length - 1) setIsTyping(false);
      }, 600 + i * 800);
    });
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    const trimmed = text.trim();

    setMessages(prev => [...prev, userMsg(trimmed)]);
    setInputValue('');

    if (stage === 'intro') {
      const lower = trimmed.toLowerCase();

      if (lower.includes('get counselling') || lower.includes('counselling')) {
        setStage('auth_choice');
        showBotMessages([
          botMsg(`Counselling support is available to registered students only. To book a session and receive personalized help, please sign in or create an account first.`),
          botMsg(
            `Would you like to register as a new user or sign in to continue?`,
            ['Register as new user', 'Sign in']
          ),
        ]);
      } else if (lower.includes('how to report a case') || (lower.includes('report') && lower.includes('case')) ) {
        setStage('auth_choice');
        showBotMessages([
          botMsg(`Reporting a case is designed to be safe, confidential, and simple. Here are the steps:`),
          botMsg(
            `1. Create an account or sign in.
2. Choose “Report a concern”.
3. Describe what happened clearly and honestly.
4. Attach any evidence if available.
5. Submit your report.

A support team member will then review it and keep you updated.`,
            ['Register as new user', 'Sign in']
          ),
        ]);
      } else if (lower.includes('how cases are handled') || lower.includes('how cases are handled') || lower.includes('cases are handled')) {
        setStage('auth_choice');
        showBotMessages([
          botMsg(`At CareBridge, every report is handled with care and confidentiality.`),
          botMsg(
            `Your concern is received privately, routed to the right support team, and investigated fairly. We protect your privacy, review the details, and then make a decision based on the facts. You are kept informed through the process and supported until the case is resolved.`,
            ['Register as new user', 'Sign in']
          ),
        ]);
      } else if (lower.includes('how to access services') || lower.includes('access services')) {
        setStage('auth_choice');
        showBotMessages([
          botMsg(`To access CareBridge services, please register or login first. Once you're signed in, you can:`),
          botMsg(
            `• Request counseling sessions
• Report a concern securely
• Chat with our support team
• Track your case and follow-up actions

If you need immediate guidance, our counselors and support staff are available after login.`,
            ['Register as new user', 'Sign in']
          ),
        ]);
      } else if (lower.includes('help') || lower.includes('counsel') || lower.includes('report') || lower.includes('chat')) {
        setStage('auth_choice');
        showBotMessages([
          botMsg(`I understand you need help. I'm here to support you! 💚`),
          botMsg(
            `To get started and connect you with the right support, I'll need you to create an account or sign in.`,
            ['Register as new user', 'Sign in']
          ),
        ]);
      } else if (lower.includes('more') || lower.includes('about') || lower.includes('what')) {
        showBotMessages([
          botMsg(`CareBridge is Mzuzu University's student support platform. We offer:`),
          botMsg(
            `• Confidential counseling sessions\n• Case reporting for concerns\n• 24/7 AI chat support\n• Emergency assistance`,
            ['Get counselling', 'How to report a case', 'How to access services', 'How cases are handled']
          ),
        ]);
      } else {
        showBotMessages([
          botMsg(`I'm here to help! Would you like to:`),
          botMsg(
            `• Get counselling
• Report a concern
• Learn how cases are handled
• Access services`,
            ['Get counselling', 'How to report a case', 'How to access services', 'How cases are handled']
          ),
        ]);
      }
    } else if (stage === 'auth_choice') {
      const lower = trimmed.toLowerCase();
      if (lower.includes('register') || lower.includes('new') || lower.includes('sign up')) {
        onClose();
        onShowLogin(true);
      } else if (lower.includes('sign in') || lower.includes('login') || lower.includes('existing')) {
        onClose();
        onShowLogin(false);
      } else {
        showBotMessages([
          botMsg(`Please choose one of the options below:`),
          botMsg(
            `• **Register** - Create a new account\n• **Sign In** - Access your existing account`,
            ['Register as new user', 'Sign in']
          ),
        ]);
      }
    }
  };

  const handleQuickReply = (reply: string) => {
    handleSend(reply);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Chat Window */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed z-50 bottom-24 right-6 w-[90vw] max-w-md max-h-[calc(100dvh-6rem)] h-[min(560px,calc(100dvh-6rem))] bg-[#faf8f5] rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: '#279B37' }}>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-medium leading-tight">CareBridge AI</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-white/70 text-xs">Always here for you</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#faf8f5]">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.sender === 'user' ? 'bg-[#279B37] text-white' : 'bg-[#c8e6c9] text-[#1e7a2c]'
                    }`}
                  >
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-5 ${
                      msg.sender === 'user'
                        ? 'bg-[#279B37] text-white'
                        : 'bg-white border border-[#d9e7d5] text-[#1c3b20]'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    {msg.quickReplies && msg.quickReplies.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.quickReplies.map((reply) => (
                          <button
                            key={reply}
                            onClick={() => handleQuickReply(reply)}
                            className="px-3 py-1.5 rounded-full border border-[#279B37] text-[#279B37] text-xs font-medium hover:bg-[#279B37] hover:text-white transition-colors"
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-end gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-[#c8e6c9]">
                    <Bot className="w-4 h-4 text-[#1e7a2c]" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-[#e8f5e9]">
                    <div className="flex gap-1 items-center h-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#279B37] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#279B37] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#279B37] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 py-3 border-t border-[#c8e6c9] bg-[#f1f8f2]">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#279B37] bg-white">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(inputValue);
                    }
                  }}
                  placeholder="Type your message..."
                  className="flex-1 text-sm outline-none bg-transparent"
                />
                <button
                  onClick={() => handleSend(inputValue)}
                  disabled={!inputValue.trim()}
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: inputValue.trim() ? '#279B37' : '#88c98e' }}
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
              <p className="text-center text-xs mt-2 text-[#6d6d6d]">
                🔒 Your conversation is confidential
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
