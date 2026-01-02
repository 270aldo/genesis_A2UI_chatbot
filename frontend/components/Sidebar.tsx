import React from 'react';
import { Session } from '../types';
import { Plus, MessageSquare, Clock } from 'lucide-react';
import { COLORS } from '../constants';

interface SidebarProps {
  isOpen: boolean;
  sessions: Session[];
  currentSessionId?: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  sessions, 
  currentSessionId, 
  onSelectSession, 
  onNewSession,
  onCloseMobile
}) => {
  const groupedSessions = {
    today: sessions.filter(s => new Date(s.date).toDateString() === new Date().toDateString()),
    yesterday: sessions.filter(s => {
      const d = new Date(s.date);
      const y = new Date();
      y.setDate(y.getDate() - 1);
      return d.toDateString() === y.toDateString();
    }),
    previous: sessions.filter(s => {
      const d = new Date(s.date);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return d < yesterday;
    })
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onCloseMobile}
      />

      {/* Sidebar Content */}
      <div className={`fixed md:static top-0 left-0 h-full w-72 bg-[#080808] border-r border-white/5 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full md:w-0 md:-translate-x-0 md:overflow-hidden'} shadow-2xl md:shadow-none`}>
        
        {/* Header */}
        <div className="p-4 border-b border-white/5">
          <button 
            onClick={() => { onNewSession(); onCloseMobile(); }}
            className="w-full flex items-center gap-3 bg-[#6D00FF] hover:bg-[#6D00FF]/90 text-white p-3 rounded-xl transition-all shadow-lg shadow-[#6D00FF]/20 group"
          >
            <div className="bg-white/20 p-1 rounded-lg"><Plus size={16} /></div>
            <span className="text-xs font-bold tracking-wide">NEW SESSION</span>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-hide">
          {Object.entries(groupedSessions).map(([key, group]) => (
            group.length > 0 && (
              <div key={key}>
                <p className="px-3 text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">{key}</p>
                <div className="space-y-1">
                  {group.map(session => (
                    <button
                      key={session.id}
                      onClick={() => { onSelectSession(session.id); onCloseMobile(); }}
                      className={`w-full text-left p-3 rounded-xl transition-all group relative overflow-hidden ${currentSessionId === session.id ? 'bg-white/5 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                    >
                      <div className="relative z-10">
                        <p className="text-xs font-medium truncate">{session.title}</p>
                        <p className="text-[10px] text-white/30 truncate mt-0.5">{session.preview}</p>
                      </div>
                      {currentSessionId === session.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-[#6D00FF] rounded-r-full" />}
                    </button>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>

        {/* User / Footer */}
        <div className="p-4 border-t border-white/5 bg-[#0a0a0a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 border border-white/10" />
            <div>
              <p className="text-xs font-bold text-white">Guest User</p>
              <p className="text-[10px] text-white/40">Pro Plan Active</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};