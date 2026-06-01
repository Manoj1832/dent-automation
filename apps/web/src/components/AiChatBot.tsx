'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageSquare, X, Send, Mic, MicOff, Bot, User,
  UserPlus, Calendar, Stethoscope, Loader2, Volume2,
  Sparkles,
} from 'lucide-react';
import { aiApi } from '@/lib/api';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const VOICE_ACTIONS = [
  { id: 'add_patient', label: 'Add Patient', icon: UserPlus, color: '#00B4A6' },
  { id: 'book_appointment', label: 'Book Appointment', icon: Calendar, color: '#0EA5E9' },
  { id: 'search_patient', label: 'Search Patient', icon: Stethoscope, color: '#8B5CF6' },
];

export default function AiChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I\'m Clinic AI. I can help you search patients, check appointments, or create records. You can also use voice commands! 🎙️', timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [showVoiceActions, setShowVoiceActions] = useState(false);
  const [activeVoiceAction, setActiveVoiceAction] = useState<string | null>(null);
  const [sessionId] = useState(() => 'sess_' + Math.random().toString(36).substring(2, 11));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ─── CHAT ────────────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (text: string, action?: string) => {
    if (!text.trim() && !action) return;

    const userMessage: Message = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiApi.chat({
        message: text,
        sessionId,
        action: action || activeVoiceAction || undefined,
      });

      const reply = res.data?.data?.reply || 'Sorry, no response.';
      const actionResult = res.data?.data?.action_result;

      setMessages(prev => [...prev, { role: 'assistant', content: reply, timestamp: new Date() }]);

      // If an action was performed, clear the voice action mode
      if (actionResult) {
        setActiveVoiceAction(null);
        speak(reply);
      } else {
        // If we are in a voice action flow, speak the reply and then listen again
        if (action || activeVoiceAction) {
          speak(reply, () => {
            startListening();
          });
        } else {
          speak(reply);
        }
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Connection error. Try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${errorMsg}`, timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  }, [messages, activeVoiceAction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // ─── VOICE ───────────────────────────────────────────────────────────────────

  const speak = (text: string, onEnd?: () => void) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      const clean = text.replace(/[•\-\*#]/g, '').replace(/\n+/g, '. ');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-IN';
      
      if (onEnd) {
        utterance.onend = () => {
          // slight delay to ensure microphone doesn't catch the tail end of speech
          setTimeout(onEnd, 300);
        };
        utterance.onerror = () => onEnd();
      }
      
      window.speechSynthesis.speak(utterance);
    } else {
      if (onEnd) onEnd();
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setListening(false);
      sendMessage(transcript);
    };

    recognition.onerror = (event: any) => {
      setListening(false);
      if (event.error !== 'aborted') {
        toast.error('Voice recognition error: ' + event.error);
      }
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const handleVoiceAction = (actionId: string) => {
    setShowVoiceActions(false);
    setActiveVoiceAction(actionId);

    const actionLabels: Record<string, string> = {
      add_patient: 'I want to add a new patient.',
      book_appointment: 'I want to book an appointment.',
      search_patient: 'I want to search for a patient.',
    };

    sendMessage(actionLabels[actionId] || actionId, actionId);
  };

  // ─── STYLES ──────────────────────────────────────────────────────────────────

  const S = {
    fab: {
      position: 'fixed' as const, bottom: 24, right: 24, zIndex: 9999,
      width: 60, height: 60, borderRadius: '50%',
      background: 'linear-gradient(135deg, #0F2D6B, #0EA5E9)',
      border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 20px rgba(15,45,107,0.35)',
      transition: 'transform 0.2s, box-shadow 0.2s',
    },
    panel: {
      position: 'fixed' as const, bottom: 90, right: 20, zIndex: 9999,
      width: 'calc(100vw - 40px)', maxWidth: 340, height: 480, maxHeight: 'calc(100vh - 110px)',
      backgroundColor: '#FFFFFF', borderRadius: 20,
      boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
      display: 'flex', flexDirection: 'column' as const,
      overflow: 'hidden', border: '1px solid #E8EDF2',
    },
    header: {
      background: 'linear-gradient(135deg, #0F2D6B, #1a3f7a)',
      padding: '16px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    },
    messagesArea: {
      flex: 1, overflowY: 'auto' as const,
      padding: '16px', display: 'flex', flexDirection: 'column' as const,
      gap: 12, maxHeight: 380, minHeight: 200,
    },
    inputBar: {
      padding: '12px 16px', borderTop: '1px solid #E8EDF2',
      display: 'flex', alignItems: 'center', gap: 8,
      backgroundColor: '#F9FAFB',
    },
  };

  return (
    <>
      {/* FAB Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={S.fab}
          onMouseEnter={e => { (e.target as HTMLElement).style.transform = 'scale(1.1)'; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.transform = 'scale(1)'; }}
        >
          <Sparkles size={26} color="#FFFFFF" />
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div style={S.panel}>
          {/* Header */}
          <div style={S.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={20} color="#FFFFFF" />
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Clinic AI</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 500 }}>
                  {activeVoiceAction ? '🎙️ Voice action mode' : 'Ask anything about your clinic'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setShowVoiceActions(!showVoiceActions)}
                style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: showVoiceActions ? '#0EA5E9' : 'rgba(255,255,255,0.15)' }}
                title="Voice Actions"
              >
                <Volume2 size={16} color="#FFFFFF" />
              </button>
              <button
                onClick={() => { setOpen(false); setShowVoiceActions(false); }}
                style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.15)' }}
              >
                <X size={16} color="#FFFFFF" />
              </button>
            </div>
          </div>

          {/* Voice Actions Drawer */}
          {showVoiceActions && (
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #E8EDF2', backgroundColor: '#F4F6F9' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🎙️ Voice Actions — tap to start
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {VOICE_ACTIONS.map(action => (
                  <button
                    key={action.id}
                    onClick={() => handleVoiceAction(action.id)}
                    style={{
                      flex: 1, padding: '10px 8px', borderRadius: 12,
                      border: `2px solid ${action.color}20`, background: `${action.color}08`,
                      cursor: 'pointer', display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 6, transition: 'all 0.2s',
                    }}
                  >
                    <action.icon size={20} color={action.color} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: action.color }}>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div style={S.messagesArea}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: 8,
                }}
              >
                {msg.role === 'assistant' && (
                  <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <Bot size={14} color="#0F2D6B" />
                  </div>
                )}
                <div style={{
                  maxWidth: '80%', padding: '10px 14px', borderRadius: 16,
                  fontSize: 13, lineHeight: 1.5, fontWeight: 500,
                  backgroundColor: msg.role === 'user' ? '#0F2D6B' : '#F4F6F9',
                  color: msg.role === 'user' ? '#FFFFFF' : '#1E293B',
                  borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                  borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 16,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#0F2D6B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <User size={14} color="#FFFFFF" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={14} color="#0F2D6B" />
                </div>
                <div style={{ padding: '10px 14px', borderRadius: 16, backgroundColor: '#F4F6F9', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Loader2 size={14} color="#0EA5E9" style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: 12, color: '#64748B' }}>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSubmit} style={S.inputBar}>
            <button
              type="button"
              onClick={listening ? stopListening : startListening}
              style={{
                width: 38, height: 38, borderRadius: 10, border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: listening ? '#EF4444' : '#EEF2FF',
                transition: 'all 0.2s',
                animation: listening ? 'pulse 1.5s infinite' : 'none',
              }}
              title={listening ? 'Stop listening' : 'Start voice input'}
            >
              {listening ? <MicOff size={18} color="#FFFFFF" /> : <Mic size={18} color="#0F2D6B" />}
            </button>
            <button
              type="button"
              onClick={() => {
                stopListening();
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              }}
              style={{
                width: 38, height: 38, borderRadius: 10, border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: '#FEE2E2', transition: 'all 0.2s',
              }}
              title="Stop AI Speech & Listening"
            >
              <div style={{ width: 12, height: 12, backgroundColor: '#EF4444', borderRadius: 2 }} />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={listening ? 'Listening...' : 'Ask Clinic AI...'}
              disabled={loading || listening}
              style={{
                flex: 1, height: 38, border: '1.5px solid #E8EDF2', borderRadius: 10,
                padding: '0 12px', fontSize: 13, fontWeight: 500,
                outline: 'none', fontFamily: 'inherit', color: '#1E293B',
                backgroundColor: '#FFFFFF',
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                width: 38, height: 38, borderRadius: 10, border: 'none',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: input.trim() && !loading ? '#0F2D6B' : '#E8EDF2',
                transition: 'all 0.2s',
              }}
            >
              <Send size={16} color={input.trim() && !loading ? '#FFFFFF' : '#94A3B8'} />
            </button>
          </form>
        </div>
      )}

      {/* Global animation styles */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
        }
      `}</style>
    </>
  );
}
