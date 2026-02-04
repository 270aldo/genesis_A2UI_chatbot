import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Plus, Mic, Send, Bot, Image as ImageIcon
} from 'lucide-react';
import { Message, Attachment } from '../types';
import { COLORS, getAgentColor } from '../constants';
import { A2UIMediator } from './Widgets';
import { generateContent, API_URL } from '../services/api';
import { VoiceMode, VoiceButton } from './voice';
import { v4 as uuid } from 'uuid';

import { useAttentionBudget, type QueueWidgetPayload } from '../src/hooks';
import type { AgentId, WidgetType, Priority } from '../src/contracts';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  userId: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose, sessionId, userId }) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);

  const {
    visible: visibleWidgets,
    enqueue: enqueueWidget,
    dismiss: dismissWidget,
    markInteracted,
    markCompleted,
    state: attentionState,
    queueLength,
  } = useAttentionBudget();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      agent: 'GENESIS',
      text: 'Conexion segura establecida con Genesis Core. En que trabajamos hoy?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      payload: {
        type: 'quick-actions',
        props: {
          title: 'Inicio Rapido',
          actions: [
            { id: 'LOG_FOOD', label: 'Registrar Comida', icon: 'food' },
            { id: 'LOG_WORKOUT', label: 'Registrar Entreno', icon: 'dumbbell' },
            { id: 'DAILY_CHECKIN', label: 'Check-in Diario', icon: 'activity' }
          ]
        }
      }
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const response = await fetch(`${API_URL}/health`, { method: 'GET' });
        if (!isMounted) return;
        setBackendStatus(response.ok ? 'online' : 'offline');
      } catch {
        if (!isMounted) return;
        setBackendStatus('offline');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  const handleSend = async (e?: React.FormEvent | React.KeyboardEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    const txt = textOverride || input;
    if (!txt.trim() && attachments.length === 0) return;

    const newMsg: Message = {
      role: 'user',
      text: txt,
      attachments: [...attachments],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMsg]);
    if (!textOverride) setInput('');
    const currentAttachments = [...attachments];
    setAttachments([]);
    setIsTyping(true);

    try {
      const result = await generateContent(newMsg.text || 'Analiza esta imagen', currentAttachments, sessionId, userId);
      const aiMsg: Message = {
        role: 'assistant',
        text: result.text || 'Informacion recibida.',
        agent: result.agent || 'GENESIS',
        payload: result.payload,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Error de comunicacion con el servidor.',
        agent: 'GENESIS',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAction = async (id: string, data: any) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { role: 'user', text: `[ACTION: ${id}]`, timestamp, isHidden: true }]);
    setIsTyping(true);
    try {
      const systemEventText = `SYSTEM_EVENT: ACTION_TRIGGERED id=${id} payload=${JSON.stringify(data || {})}`;
      const result = await generateContent(systemEventText, [], sessionId, userId);
      const aiMsg: Message = {
        role: 'assistant',
        text: result.text || 'Accion procesada.',
        agent: result.agent || 'GENESIS',
        payload: result.payload,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Error al procesar la accion.',
        agent: 'GENESIS',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setInput(prev => prev + ' (Transcripcion simulada...)');
    } else {
      setIsRecording(true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'La imagen es demasiado grande. Intenta con una menor a 5MB.',
        agent: 'GENESIS',
        payload: { type: 'alert-banner', props: { type: 'warning', message: 'Imagen > 5MB.' } },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const [header, base64] = result.split(',');
      const mimeMatch = header?.match(/data:(.*);base64/);
      const mimeType = mimeMatch?.[1] || file.type || 'image/jpeg';
      setAttachments(prev => [...prev, { type: 'image', url: result, data: base64, mimeType, name: file.name, size: file.size }]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    const url = attachments[index]?.url;
    if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const statusConfig = {
    online: { dotClass: 'bg-[#00FF88] animate-pulse', label: 'Online' },
    offline: { dotClass: 'bg-[#FF4444]', label: 'Offline' },
    checking: { dotClass: 'bg-[#FBBF24] animate-pulse', label: 'Checking' }
  } as const;
  const status = statusConfig[backendStatus];

  const floatingWidgets = visibleWidgets.filter(w => w.payload.position === 'floating');

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Chat Panel */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-[#050505] border-t border-white/10 rounded-t-3xl shadow-2xl"
        style={{ height: 'calc(100vh - 60px)', maxHeight: 'calc(100vh - 60px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6D00FF] to-[#00D4FF] flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Genesis Chat</h2>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
                <span className="text-[10px] text-white/40">{status.label}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <VoiceButton onClick={() => setIsVoiceModeOpen(true)} />
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide" ref={scrollRef}>
          <div className="h-2" />
          {messages.filter(msg => !msg.isHidden).map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                  <Bot size={12} className="text-white/60" />
                </div>
              )}
              <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex gap-2 mb-2 flex-wrap justify-end">
                    {msg.attachments.map((att, idx) => (
                      <div key={idx} className="w-28 h-28 rounded-xl border border-white/10 overflow-hidden">
                        <img src={att.url} alt="attachment" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                {msg.text && (
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#1a1a1a] text-white rounded-tr-sm border border-white/10'
                      : 'bg-transparent text-white/90 px-0 py-0'
                  }`}>
                    {msg.text}
                  </div>
                )}
                {msg.payload && (
                  <div className="w-full max-w-sm mt-3">
                    <A2UIMediator payload={msg.payload} onAction={(id, d) => handleAction(id, d)} agent={msg.agent} />
                  </div>
                )}
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-3 mt-1.5 ml-1">
                    <div className="flex items-center gap-1.5 opacity-50">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: getAgentColor(msg.agent) }} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">{msg.agent}</span>
                    </div>
                    <span className="text-[10px] text-white/20">{msg.timestamp}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3 animate-in">
              <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                <Bot size={12} className="text-white/60" />
              </div>
              <div className="flex items-center gap-1 h-7">
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce delay-75" />
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce delay-150" />
              </div>
            </div>
          )}
          <div className="h-4" />
        </div>

        {/* Input */}
        <div className="p-4 bg-[#050505] shrink-0">
          {isRecording && (
            <div className="mb-3 bg-[#1a1a1a] border border-[#6D00FF]/50 px-4 py-2.5 rounded-full flex items-center gap-3 justify-center">
              <div className="flex gap-1 h-4 items-center">
                {[1, 2, 3, 4, 5, 4, 3, 2].map((h, i) => (
                  <div key={i} className="w-1 bg-[#6D00FF] rounded-full animate-pulse" style={{ height: h * 3, animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              <span className="text-xs font-bold text-white">Escuchando...</span>
              <button onClick={toggleRecording} className="p-1 hover:bg-white/10 rounded-full"><X size={14} /></button>
            </div>
          )}

          {attachments.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {attachments.map((att, i) => (
                <div key={i} className="relative w-14 h-14 rounded-xl border border-white/10 overflow-hidden shrink-0 group">
                  <img src={att.url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" alt="preview" />
                  <button onClick={() => removeAttachment(i)} className="absolute top-0.5 right-0.5 bg-black/50 hover:bg-black p-0.5 rounded-full text-white">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="bg-[#1a1a1a] border border-white/10 rounded-[2rem] p-2 flex items-end transition-all focus-within:border-[#6D00FF]/50">
            <div className="flex items-center gap-1 pb-1 pl-1">
              <button className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors" title="More">
                <Plus size={18} />
              </button>
              <button className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors" onClick={() => fileInputRef.current?.click()} title="Image">
                <ImageIcon size={18} />
              </button>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*" />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje..."
              className="flex-1 bg-transparent border-none text-white text-sm p-3 max-h-28 min-h-[40px] resize-none focus:ring-0 outline-none placeholder:text-white/20 scrollbar-hide"
              rows={1}
            />
            <div className="flex items-center gap-1 pr-2 pb-1">
              {input.trim().length === 0 && attachments.length === 0 ? (
                <button onClick={toggleRecording}
                  className={`p-2 rounded-full transition-all ${isRecording ? 'bg-[#FF4444] text-white animate-pulse' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                  <Mic size={18} />
                </button>
              ) : (
                <button onClick={(e) => handleSend(e)}
                  className="p-2 bg-white text-black rounded-full hover:bg-[#6D00FF] hover:text-white transition-all transform active:scale-90">
                  <Send size={16} fill="currentColor" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Floating widgets */}
        {floatingWidgets.length > 0 && (
          <div className="fixed bottom-32 right-4 z-[60] flex flex-col gap-3 max-w-xs">
            {floatingWidgets.map(widget => (
              <div key={widget.id} className="animate-in slide-in-from-right duration-300 relative">
                <button onClick={() => dismissWidget(widget.id, 'user_action')}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center z-10">
                  <X size={10} />
                </button>
                <A2UIMediator
                  payload={{ type: widget.payload.widgetType, props: widget.payload.data as Record<string, unknown> }}
                  onAction={(id, d) => { markInteracted(widget.id); handleAction(id, d); }}
                  agent="GENESIS"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Voice Mode Overlay */}
      <VoiceMode
        isOpen={isVoiceModeOpen}
        onClose={() => setIsVoiceModeOpen(false)}
        onWidgetReceived={(payload) => {
          const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setMessages(prev => [...prev, { role: 'assistant', text: '', agent: 'GENESIS', payload, timestamp }]);
        }}
        sessionId={sessionId}
        userId={userId}
      />
    </>
  );
};
