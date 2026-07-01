import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { getSavedChatConversation, saveChatConversation } from '../../services/chatConversationApi';

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
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const savedConversation = getSavedChatConversation();
    if (!savedConversation || messages.length > 0) return;

    const restoredMessages = Array.isArray(savedConversation.messages)
      ? (savedConversation.messages as Array<{ id?: string; sender?: MessageSender; text?: string; timestamp?: string }>).map((message) => ({
          id: message.id ?? `bot-${Math.random()}`,
          sender: message.sender === 'user' ? 'user' : 'bot',
          text: message.text ?? '',
          timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
        }))
      : [];

    if (restoredMessages.length === 0) return;

    setMessages(restoredMessages);
    setStage((savedConversation.stage as ChatStage | undefined) ?? 'welcome');
    msgCounter = restoredMessages.reduce((max, message) => {
      const numericId = Number(message.id.replace(/\D/g, ''));
      return Number.isFinite(numericId) ? Math.max(max, numericId) : max;
    }, 0);
  }, [isOpen, messages.length]);

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
        botMsg(`Hi there! 👋 I'm CareBridge's friendly assistant.`),
        botMsg(
          `I'm here to help you get the support you need. Whether you're looking for counseling, need to report a concern, or just have questions — I've got you!`,
          ['I need help', 'Tell me more']
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
      if (lower.includes('help') || lower.includes('counsel') || lower.includes('report') || lower.includes('chat')) {
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
            ['I need help', 'Register', 'Sign in']
          ),
        ]);
      } else {
        showBotMessages([
          botMsg(`I'm here to help! Would you like to:`),
          botMsg(
            `• Get counseling support\n• Report a concern\n• Chat with our AI assistant`,
            ['I need help', 'Tell me more']
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
            className="fixed bottom-24 right-6 z-50 w-[90vw] max-w-md h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">CareBridge Assistant</p>
                  <p className="text-xs text-primary-foreground/80">Always here to help</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex gap-2 max-w-[80%] ${
                      msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        msg.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {msg.sender === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm ${
                        msg.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-white border border-border'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Quick Replies */}
              {messages[messages.length - 1]?.quickReplies && !isTyping && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {messages[messages.length - 1].quickReplies!.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => handleQuickReply(reply)}
                      className="px-3 py-1.5 bg-white border-2 border-primary text-primary rounded-full text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white border border-border rounded-2xl px-3 py-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-3 bg-white">
              <div className="flex gap-2">
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
                  className="flex-1 px-3 py-2 bg-gray-100 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  onClick={() => handleSend(inputValue)}
                  disabled={!inputValue.trim()}
                  className="w-10 h-10 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
