import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Dumbbell, Salad, Brain, BarChart3, MessageCircle } from 'lucide-react';
import { ChatPanel } from './ChatPanel';
import { v4 as uuid } from 'uuid';
import { supabase } from '../services/supabase';

const getOrCreateLocalId = (key: string, prefix: string) => {
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id = `${prefix}-${uuid()}`;
    localStorage.setItem(key, id);
    return id;
  } catch {
    return `${prefix}-${uuid()}`;
  }
};

interface TabItem {
  path: string;
  label: string;
  icon: typeof Home;
  color: string;
}

const TABS: TabItem[] = [
  { path: '/', label: 'Home', icon: Home, color: '#6D00FF' },
  { path: '/train', label: 'Train', icon: Dumbbell, color: '#EF4444' },
  { path: '/fuel', label: 'Fuel', icon: Salad, color: '#22C55E' },
  { path: '/mind', label: 'Mind', icon: Brain, color: '#A855F7' },
  { path: '/track', label: 'Track', icon: BarChart3, color: '#3B82F6' },
];

export const AppShell: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentSessionId] = useState(() => getOrCreateLocalId('ngx_session_id', 'session'));
  const [currentUserId, setCurrentUserId] = useState(() => getOrCreateLocalId('ngx_user_id', 'user'));

  // Sync user ID with Supabase auth
  useEffect(() => {
    let isMounted = true;
    const syncUser = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const user = data.session?.user;
        if (user && isMounted) {
          localStorage.setItem('ngx_user_id', user.id);
          setCurrentUserId(user.id);
        }
      } catch {
        // ignore auth errors
      }
    };
    syncUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      if (user) {
        localStorage.setItem('ngx_user_id', user.id);
        setCurrentUserId(user.id);
      }
    });
    return () => { isMounted = false; authListener.subscription.unsubscribe(); };
  }, []);

  const activeTab = TABS.find(t => t.path === location.pathname) || TABS[0];

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-white font-sans overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        <Outlet />
      </div>

      {/* Floating Chat FAB */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed z-30 right-5 shadow-lg shadow-[#6D00FF]/30 transition-all active:scale-90 hover:shadow-[#6D00FF]/50 hover:scale-105"
        style={{
          bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px) + 0.75rem)',
          width: 52,
          height: 52,
          borderRadius: 26,
          background: 'linear-gradient(135deg, #6D00FF, #A855F7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MessageCircle size={22} className="text-white" fill="white" />
      </button>

      {/* Bottom Tab Bar */}
      <nav
        className="shrink-0 border-t border-white/5 px-2"
        style={{
          background: 'rgba(5,5,5,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex items-center justify-around h-[4.5rem] max-w-lg mx-auto">
          {TABS.map((tab) => {
            const isActive = tab.path === location.pathname || (tab.path === '/' && location.pathname === '/');
            const Icon = tab.icon;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all"
                style={{ minWidth: 56 }}
              >
                <Icon
                  size={22}
                  className="transition-colors"
                  style={{ color: isActive ? tab.color : 'rgba(255,255,255,0.35)' }}
                />
                <span
                  className="text-[10px] font-semibold transition-all"
                  style={{
                    color: isActive ? tab.color : 'rgba(255,255,255,0.35)',
                    opacity: isActive ? 1 : 0,
                    maxHeight: isActive ? 14 : 0,
                    overflow: 'hidden',
                    transition: 'opacity 0.2s, max-height 0.2s, color 0.2s',
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Chat Panel Overlay */}
      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        sessionId={currentSessionId}
        userId={currentUserId}
      />
    </div>
  );
};
