import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Cpu, MoreVertical, Plus, Mic, Send, Bot, X, Image as ImageIcon, Menu
} from 'lucide-react';
import { Message, Attachment, Session } from './types';
import { COLORS, getAgentColor } from './constants';
import { A2UIMediator } from './components/Widgets';
import { generateContent, API_URL } from './services/api';
import { Sidebar } from './components/Sidebar';
import { VoiceMode, VoiceButton } from './components/voice';
import { v4 as uuid } from 'uuid';

// Widget Queue & Telemetry
import { useAttentionBudget, type QueueWidgetPayload } from './src/hooks';
import { useTelemetry, eventBus } from './src/services/events';
import type { AgentId, WidgetType, Priority } from './src/contracts';

// Mock Data for Sessions
const MOCK_SESSIONS: Session[] = [
  { id: '1', title: 'Chest & Triceps Focus', date: new Date().toISOString(), preview: 'Starting hypertrophy block...' },
  { id: '2', title: 'Nutrition Review', date: new Date(Date.now() - 86400000).toISOString(), preview: 'Calculating macros for cut...' },
  { id: '3', title: 'Sleep Optimization', date: new Date(Date.now() - 172800000).toISOString(), preview: 'Analyzing deep sleep stages...' },
];

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open on desktop
  const [currentSessionId, setCurrentSessionId] = useState<string>('1');
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);

  // ============================================
  // TELEMETRY & WIDGET QUEUE
  // ============================================

  // Initialize telemetry service
  useTelemetry({ debug: import.meta.env.DEV });

  // Attention budget and widget queue
  const {
    visible: visibleWidgets,
    enqueue: enqueueWidget,
    dismiss: dismissWidget,
    markInteracted,
    markCompleted,
    startWorkout,
    endWorkout,
    state: attentionState,
    queueLength,
  } = useAttentionBudget();

  // Helper to enqueue widget from AI response
  const enqueueAIWidget = useCallback((
    widgetType: string,
    props: Record<string, unknown>,
    agentId: string,
    priority: Priority = 'medium'
  ) => {
    const payload: QueueWidgetPayload = {
      widgetId: uuid(),
      widgetType: widgetType as WidgetType,
      agentId: agentId as AgentId,
      priority,
      position: 'inline', // AI responses are inline
      queueBehavior: 'defer',
      dismissable: true,
      createdAt: new Date().toISOString(),
      data: props,
    };
    enqueueWidget(payload);
  }, [enqueueWidget]);

  // ============================================
  // MESSAGES STATE
  // ============================================

  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      agent: 'GENESIS', 
      text: 'Conexión segura establecida con Genesis Core. ¿En qué trabajamos hoy?', 
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      payload: {
        type: 'quick-actions',
        props: {
          title: 'Inicio Rápido',
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

  // Auto-scroll
  useEffect(() => { 
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight; 
    }
  }, [messages, isTyping]);

  // Responsive sidebar check
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Backend health indicator
  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const response = await fetch(`${API_URL}/health`, { method: 'GET' });
        if (!isMounted) return;
        setBackendStatus(response.ok ? 'online' : 'offline');
      } catch (error) {
        if (!isMounted) return;
        setBackendStatus('offline');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleSend = async (e?: React.FormEvent | React.KeyboardEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    const txt = textOverride || input;
    if (!txt.trim() && attachments.length === 0) return;

    const newMsg: Message = { 
      role: 'user', 
      text: txt, 
      attachments: [...attachments],
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };

    setMessages(prev => [...prev, newMsg]);
    if (!textOverride) setInput('');
    
    const currentAttachments = [...attachments];
    setAttachments([]);
    setIsTyping(true);

    try {
      const result = await generateContent(newMsg.text || "Analiza esta imagen", currentAttachments);
      
      const aiMsg: Message = {
        role: 'assistant',
        text: result.text || "Información recibida.",
        agent: result.agent || "GENESIS",
        payload: result.payload,
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: "Error de comunicación con el servidor.",
        agent: "GENESIS",
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAction = async (id: string, data: any) => {
    const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // 1. Optimistic UI / Visual Feedback
    // We add a hidden message to the state so we track the interaction history
    setMessages(prev => [...prev, { 
      role: 'user', 
      text: `[ACTION: ${id}]`, 
      timestamp,
      isHidden: true 
    }]);

    setIsTyping(true);

    try {
      // 2. Send System Event to Backend
      // Format: SYSTEM_EVENT: ACTION_TRIGGERED id=X payload={...}
      const systemEventText = `SYSTEM_EVENT: ACTION_TRIGGERED id=${id} payload=${JSON.stringify(data || {})}`;
      const result = await generateContent(systemEventText);

      // 3. Render Real Response
      const aiMsg: Message = {
        role: 'assistant',
        text: result.text || "Acción procesada.",
        agent: result.agent || "GENESIS",
        payload: result.payload,
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: "Error al procesar la acción.",
        agent: "GENESIS",
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setInput(prev => prev + " (Transcripción simulada...)");
    } else {
      setIsRecording(true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxBytes = 5 * 1024 * 1024; // 5MB guardrail for base64 payloads
    if (file.size > maxBytes) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'La imagen es demasiado grande para procesarla. Intenta con una menor a 5MB.',
        agent: 'GENESIS',
        payload: { type: 'alert-banner', props: { type: 'warning', message: 'Imagen > 5MB.' } },
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
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
      const previewUrl = result;

      setAttachments(prev => [
        ...prev,
        {
          type: 'image',
          url: previewUrl,
          data: base64,
          mimeType,
          name: file.name,
          size: file.size
        }
      ]);
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    const url = attachments[index]?.url;
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const statusConfig = {
    online: { dotClass: 'bg-[#00FF88] animate-pulse', label: 'Backend Online' },
    offline: { dotClass: 'bg-[#FF4444]', label: 'Backend Offline' },
    checking: { dotClass: 'bg-[#FBBF24] animate-pulse', label: 'Checking Backend' }
  } as const;

  const status = statusConfig[backendStatus];

  // Filter floating widgets from visible queue
  const floatingWidgets = visibleWidgets.filter(w => w.payload.position === 'floating');
  const highPriorityWidgets = visibleWidgets.filter(w => w.payload.priority === 'high' && w.payload.position !== 'floating');

  return (
    <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <Sidebar 
        isOpen={isSidebarOpen}
        sessions={MOCK_SESSIONS}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewSession={() => {
           setMessages([{ 
             role: 'assistant', 
             agent: 'GENESIS', 
             text: 'Nueva sesión iniciada.', 
             timestamp: new Date().toLocaleTimeString() 
           }]);
           setCurrentSessionId('new');
        }}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full relative w-full">
        
        {/* HEADER */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#050505]/90 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 -ml-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-colors">
              <Menu size={20} />
            </button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6D00FF] to-[#00D4FF] flex items-center justify-center shadow-lg shadow-[#6D00FF]/20">
              <Cpu size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold tracking-tight text-sm">Genesis Chat</h1>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`}></span>
                <span className="text-[10px] text-white/40">{status.label}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Queue indicator */}
            {queueLength > 0 && (
              <div className="px-2 py-1 rounded-full bg-[#6D00FF]/20 border border-[#6D00FF]/30 text-[10px] text-[#6D00FF]">
                {queueLength} queued
              </div>
            )}
            {/* Workout mode indicator */}
            {attentionState.isWorkoutActive && (
              <div className="px-2 py-1 rounded-full bg-[#EF4444]/20 border border-[#EF4444]/30 text-[10px] text-[#EF4444] flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#EF4444] rounded-full animate-pulse"></span>
                Workout Mode
              </div>
            )}
            {/* Voice Mode Button */}
            <VoiceButton onClick={() => setIsVoiceModeOpen(true)} />
            <button className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        {/* CHAT AREA */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
          <div className="h-4"></div>
          {messages.filter(msg => !msg.isHidden).map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in`}>
              
              {/* Avatar Assistant */}
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                  <Bot size={14} className="text-white/60" />
                </div>
              )}

              <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                
                {/* Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex gap-2 mb-2 flex-wrap justify-end">
                    {msg.attachments.map((att, idx) => (
                      <div key={idx} className="w-32 h-32 rounded-xl border border-white/10 overflow-hidden relative group">
                        <img src={att.url} alt="attachment" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Text Bubble */}
                {msg.text && (
                  <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-[#1a1a1a] text-white rounded-tr-sm border border-white/10' 
                      : 'bg-transparent text-white/90 px-0 py-0'
                  }`}>
                    {msg.text}
                  </div>
                )}

                {/* Widgets */}
                {msg.payload && (
                  <div className="w-full max-w-sm mt-3">
                    <A2UIMediator payload={msg.payload} onAction={(id, d) => handleAction(id, d)} agent={msg.agent} />
                  </div>
                )}

                {/* Metadata */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-3 mt-2 ml-1">
                    <div className="flex items-center gap-1.5 opacity-50">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: getAgentColor(msg.agent) }}></span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">{msg.agent}</span>
                    </div>
                    <span className="text-[10px] text-white/20">{msg.timestamp}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-4 animate-in">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                <Bot size={14} className="text-white/60" />
              </div>
              <div className="flex items-center gap-1 h-8">
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce delay-75"></span>
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce delay-150"></span>
              </div>
            </div>
          )}
          <div className="h-4"></div>
        </div>

        {/* INPUT AREA (FIXED) */}
        <div className="p-6 bg-[#050505] relative z-30">
          
          {/* Voice Overlay */}
          {isRecording && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-[#6D00FF]/50 px-6 py-3 rounded-full flex items-center gap-4 shadow-2xl animate-in fade-in zoom-in">
              <div className="flex gap-1 h-4 items-center">
                {[1,2,3,4,5,4,3,2].map((h,i) => (
                  <div key={i} className="w-1 bg-[#6D00FF] rounded-full animate-pulse" style={{ height: h*4, animationDelay: `${i*0.1}s` }}></div>
                ))}
              </div>
              <span className="text-xs font-bold text-white">Escuchando...</span>
              <button onClick={toggleRecording} className="p-1 hover:bg-white/10 rounded-full outline-none">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Attachment Previews */}
          {attachments.length > 0 && (
            <div className="flex gap-3 mb-3 overflow-x-auto pb-2">
              {attachments.map((att, i) => (
                <div key={i} className="relative w-16 h-16 rounded-xl border border-white/10 overflow-hidden shrink-0 group">
                  <img src={att.url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" alt="preview" />
                  <button onClick={() => removeAttachment(i)} className="absolute top-0.5 right-0.5 bg-black/50 hover:bg-black p-0.5 rounded-full text-white outline-none">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Main Input Bar */}
          <div className="max-w-4xl mx-auto bg-[#1a1a1a] border border-white/10 rounded-[2rem] p-2 flex items-end shadow-2xl relative transition-all focus-within:border-[#6D00FF]/50 focus-within:bg-[#1a1a1a]">
            
            {/* Actions Left */}
            <div className="flex items-center gap-1 pb-1 pl-1">
              <button 
                className="p-2.5 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors outline-none focus:outline-none"
                title="More Actions"
              >
                <Plus size={20} />
              </button>
              <button 
                className="p-2.5 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors outline-none focus:outline-none" 
                onClick={() => fileInputRef.current?.click()}
                title="Add Image"
              >
                <ImageIcon size={20} />
              </button>
            </div>

            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*" />

            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe tu plan, rutina o sube una foto..."
              className="flex-1 bg-transparent border-none text-white text-sm p-3 max-h-32 min-h-[44px] resize-none focus:ring-0 outline-none placeholder:text-white/20 scrollbar-hide"
              rows={1}
            />

            <div className="flex items-center gap-1 pr-2 pb-1">
              {input.trim().length === 0 && attachments.length === 0 ? (
                <button 
                  onClick={toggleRecording}
                  className={`p-2.5 rounded-full transition-all outline-none focus:outline-none ${isRecording ? 'bg-[#FF4444] text-white animate-pulse' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                >
                  <Mic size={20} />
                </button>
              ) : (
                <button 
                  onClick={(e) => handleSend(e)}
                  className="p-2.5 bg-white text-black rounded-full hover:bg-[#6D00FF] hover:text-white transition-all transform active:scale-90 outline-none focus:outline-none"
                >
                  <Send size={18} fill="currentColor" />
                </button>
              )}
            </div>
          </div>
          
          <p className="text-center text-[10px] text-white/20 mt-4">
            Genesis OS v3.0 Powered by Gemini
          </p>
        </div>

        {/* FLOATING WIDGETS LAYER */}
        {floatingWidgets.length > 0 && (
          <div className="fixed bottom-32 right-4 z-50 flex flex-col gap-3 max-w-sm">
            {floatingWidgets.map(widget => (
              <div
                key={widget.id}
                className="animate-in slide-in-from-right duration-300 relative"
              >
                <button
                  onClick={() => dismissWidget(widget.id, 'user_action')}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center z-10"
                >
                  <X size={12} />
                </button>
                <A2UIMediator
                  payload={{
                    type: widget.payload.widgetType,
                    props: widget.payload.data as Record<string, unknown>,
                  }}
                  onAction={(id, d) => {
                    markInteracted(widget.id);
                    handleAction(id, d);
                  }}
                  agent={widget.payload.agentId}
                />
              </div>
            ))}
          </div>
        )}

        {/* HIGH PRIORITY WIDGETS BANNER */}
        {highPriorityWidgets.length > 0 && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
            {highPriorityWidgets.slice(0, 1).map(widget => (
              <div
                key={widget.id}
                className="animate-in slide-in-from-top duration-300 relative bg-[#1a1a1a] border border-[#6D00FF]/30 rounded-2xl shadow-2xl overflow-hidden"
              >
                <button
                  onClick={() => dismissWidget(widget.id, 'user_action')}
                  className="absolute top-3 right-3 w-6 h-6 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center z-10"
                >
                  <X size={12} />
                </button>
                <A2UIMediator
                  payload={{
                    type: widget.payload.widgetType,
                    props: widget.payload.data as Record<string, unknown>,
                  }}
                  onAction={(id, d) => {
                    markCompleted(widget.id, d);
                    handleAction(id, d);
                  }}
                  agent={widget.payload.agentId}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VOICE MODE OVERLAY */}
      <VoiceMode
        isOpen={isVoiceModeOpen}
        onClose={() => setIsVoiceModeOpen(false)}
        onWidgetReceived={(payload) => {
          // Add widget from voice as a new message
          const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          setMessages(prev => [...prev, {
            role: 'assistant',
            text: '',
            agent: 'GENESIS',
            payload,
            timestamp,
          }]);
        }}
        sessionId={currentSessionId}
      />
    </div>
  );
};

export default App;