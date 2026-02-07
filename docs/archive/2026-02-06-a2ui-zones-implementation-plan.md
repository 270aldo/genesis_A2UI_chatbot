# NGX GENESIS A2UI Zones Implementation Plan
**Date:** 2026-02-06
**Phase:** Sprint 1 - Multi-Zone Architecture with Surface-Driven Rendering
**Status:** Ready for Implementation

---

## Executive Summary

This plan evolves the Phase 1 A2UI codebase from single-widget message embedding to a multi-zone architecture driven by a Surface Store. The evolution introduces three persistent zones (Context, Stream, Overlay) managed by Zustand, with an A2UI Interpreter orchestrating all operations from backend responses. This creates a coherent, scalable framework for complex AI-driven fitness experiences.

**Key Metrics:**
- 7 implementation phases
- 28 files created/modified
- 0 breaking changes to existing Supabase schema
- 100% backward compatible with Phase 1 stores + endpoints
- Spanish UI language consistency across all zones

---

## PHASE 0: Typography & Design System Foundation

### What to Build
Establish a coherent typography system using JetBrains Mono for technical elements and Inter for body text. Fix critical missing font configuration that blocks proper tab bar rendering and creates visual inconsistency across the app.

### Files to Create/Modify
- **app/_layout.tsx** - Add expo-font loading for JetBrains Mono, Inter
- **theme/fonts.ts** (NEW) - Centralized font constants
- **components/common/StandardCard.tsx** (NEW) - Extracted from GradientCard
- **components/common/ShineEffect.tsx** (NEW) - Extracted from GradientCard
- **components/common/GradientCard.tsx** - Remove StandardCard + ShineEffect logic
- **components/common/index.ts** - Export StandardCard, ShineEffect
- **components/navigation/CustomTabBar.tsx** - Render labels with JetBrains Mono
- **app/(tabs)/index.tsx** - Update Spanish labels
- **app/(tabs)/train.tsx** - Update Spanish labels
- **app/(tabs)/chat.tsx** - Update Spanish labels
- **app/(tabs)/settings.tsx** - Update Spanish labels (if exists)

### Key Code Patterns

**theme/fonts.ts:**
```typescript
import { useFonts } from 'expo-font';

export const FONTS = {
  // JetBrains Mono for technical/UI elements
  monoMedium: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_700Bold',
  monoRegular: 'JetBrainsMono_400Regular',
  // Inter for body/readable text
  interRegular: 'Inter_400Regular',
  interMedium: 'Inter_500Medium',
  interSemiBold: 'Inter_600SemiBold',
  interBold: 'Inter_700Bold',
};

export const FONT_SIZES = {
  label: 12,
  caption: 14,
  body: 16,
  subheading: 18,
  heading: 24,
};
```

**app/_layout.tsx (font loading segment):**
```typescript
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import JetBrainsMono from '@expo-google-fonts/jetbrains-mono';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ...JetBrainsMono,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }
  // ... rest of layout
}
```

**CustomTabBar.tsx (label rendering):**
```typescript
import { FONTS, FONT_SIZES } from '@/theme/fonts';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <BlurView intensity={90} style={styles.container}>
      <LinearGradient colors={['rgba(20,20,20,0.8)', 'rgba(10,10,10,0.9)']} style={styles.gradient}>
        {state.routes.map((route, index) => {
          const label = LABEL_MAP[route.name] || route.name; // { train: 'Entrenar', chat: 'Chat', etc. }
          return (
            <Pressable key={route.name} onPress={() => navigation.navigate(route.name)} style={styles.tab}>
              <Icon name={ICON_MAP[route.name]} size={24} color={isFocused ? '#00D9FF' : '#888'} />
              <Text style={[styles.label, { fontFamily: FONTS.monoMedium, fontSize: FONT_SIZES.label }]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </LinearGradient>
    </BlurView>
  );
}
```

**StandardCard.tsx (extracted):**
```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ShineEffect } from './ShineEffect';

interface StandardCardProps {
  children: React.ReactNode;
  intensity?: number; // gradient intensity 0-1
  variant?: 'primary' | 'secondary' | 'accent';
}

export function StandardCard({ children, intensity = 0.8, variant = 'primary' }: StandardCardProps) {
  const colors = {
    primary: ['rgba(0,217,255,0.1)', 'rgba(100,50,200,0.08)'],
    secondary: ['rgba(50,50,100,0.1)', 'rgba(100,100,150,0.08)'],
    accent: ['rgba(255,100,200,0.08)', 'rgba(200,50,255,0.06)'],
  };

  return (
    <LinearGradient colors={colors[variant]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <ShineEffect intensity={intensity} />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,217,255,0.2)',
    overflow: 'hidden',
  },
});
```

**ShineEffect.tsx (extracted):**
```typescript
import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export function ShineEffect({ intensity = 0.8 }) {
  const shineAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnim, { toValue: 1, duration: 3000, useNativeDriver: false }),
        Animated.timing(shineAnim, { toValue: -1, duration: 3000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.shine,
        {
          opacity: shineAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, intensity * 0.5, 0] }),
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  shine: {
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
  },
});
```

### Validation Criteria
- [ ] expo-font properly loads JetBrains Mono and Inter fonts without errors
- [ ] Tab bar renders 4 labels (Entrenar, Chat, Inicio, Ajustes) below icons
- [ ] All labels use JetBrains Mono, size 12px
- [ ] StandardCard.tsx extracted and works identically to original GradientCard behavior
- [ ] ShineEffect.tsx extracted and animates correctly
- [ ] GradientCard imports StandardCard and ShineEffect
- [ ] All tab screens show Spanish labels consistently
- [ ] No missing font family warnings in console

### Dependencies
None - Phase 0 is foundational.

---

## PHASE 1: SurfaceStore

### What to Build
Create a new Zustand store to manage all A2UI surfaces (widgets, cards, overlays) independently from chat messages. Surfaces are persistent, mutable objects with zone assignment, data model binding, and state isolation. This replaces the embedded widget model.

### Files to Create/Modify
- **stores/surface-store.ts** (NEW) - Core Zustand store with MMKV persistence
- **lib/a2ui/types.ts** - Update Surface interface (add to existing types)
- **stores/index.ts** - Export useSurfaceStore
- **lib/a2ui/constants.ts** - Add ZONE constants

### Key Code Patterns

**lib/a2ui/types.ts (additions):**
```typescript
export type A2UIZone = 'context' | 'stream' | 'overlay';

export interface Surface {
  // Core identity
  id: string; // UUID, unique per surface
  zone: A2UIZone; // determines placement and behavior
  widgetType: 'workout-card' | 'live-tracker' | 'complete-summary' | 'context-bar' | 'custom';

  // Data binding
  dataModel: Record<string, any>; // e.g., { sessionId, exerciseName, sets_completed }
  state: Record<string, any>; // e.g., { isExpanded, selectedTab, timer_running }

  // Relationship to chat
  linkedMessageId?: string; // if this surface was created in response to a message
  linkedActionId?: string; // if this surface was triggered by an action

  // Lifecycle
  createdAt: number; // timestamp
  updatedAt: number;
  frozen?: boolean; // if true, user cannot interact with this surface

  // Styling
  styleOverrides?: {
    backgroundColor?: string;
    borderColor?: string;
    width?: number | string;
    height?: number | string;
  };
}

export interface A2UIOperation {
  type: 'create-surface' | 'update-surface' | 'delete-surface' | 'freeze-surface' | 'unfreeze-surface';
  data: Partial<Surface>;
  targetSurfaceId?: string; // for update, delete, freeze operations
}
```

**stores/surface-store.ts:**
```typescript
import { create } from 'zustand';
import { mmkvPersist } from './mmkv-persist';
import { Surface, A2UIZone } from '@/lib/a2ui/types';

interface SurfaceStore {
  // State
  surfaces: Record<string, Surface>;

  // Actions
  createSurface: (surface: Omit<Surface, 'id' | 'createdAt' | 'updatedAt'>) => Surface;
  updateSurface: (id: string, updates: Partial<Surface>) => void;
  deleteSurface: (id: string) => void;
  freezeSurface: (id: string) => void;
  unfreezeSurface: (id: string) => void;

  // Selectors
  getSurfaceById: (id: string) => Surface | undefined;
  getSurfacesByZone: (zone: A2UIZone) => Surface[];
  getContextSurfaces: () => Surface[]; // zone === 'context'
  getStreamSurfaces: () => Surface[]; // zone === 'stream'
  getOverlaySurfaces: () => Surface[]; // zone === 'overlay'

  // Utilities
  clearAllSurfaces: () => void;
  replaceSurfaces: (surfaces: Surface[]) => void; // for hydration
}

export const useSurfaceStore = create<SurfaceStore>()(
  mmkvPersist(
    (set, get) => ({
      surfaces: {},

      createSurface: (surface) => {
        const id = generateUUID();
        const now = Date.now();
        const newSurface: Surface = {
          ...surface,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          surfaces: { ...state.surfaces, [id]: newSurface },
        }));
        return newSurface;
      },

      updateSurface: (id, updates) => {
        set((state) => {
          const surface = state.surfaces[id];
          if (!surface) return state;
          return {
            surfaces: {
              ...state.surfaces,
              [id]: { ...surface, ...updates, updatedAt: Date.now() },
            },
          };
        });
      },

      deleteSurface: (id) => {
        set((state) => {
          const { [id]: _, ...remaining } = state.surfaces;
          return { surfaces: remaining };
        });
      },

      freezeSurface: (id) => {
        get().updateSurface(id, { frozen: true });
      },

      unfreezeSurface: (id) => {
        get().updateSurface(id, { frozen: false });
      },

      getSurfaceById: (id) => {
        return get().surfaces[id];
      },

      getSurfacesByZone: (zone) => {
        return Object.values(get().surfaces).filter((s) => s.zone === zone);
      },

      getContextSurfaces: () => get().getSurfacesByZone('context'),
      getStreamSurfaces: () => get().getSurfacesByZone('stream'),
      getOverlaySurfaces: () => get().getSurfacesByZone('overlay'),

      clearAllSurfaces: () => set({ surfaces: {} }),

      replaceSurfaces: (surfaces) => {
        set({ surfaces: surfaces.reduce((acc, s) => ({ ...acc, [s.id]: s }), {}) });
      },
    }),
    {
      name: 'surface-store',
      version: 1,
    }
  )
);
```

**lib/a2ui/constants.ts:**
```typescript
export const ZONES = {
  CONTEXT: 'context' as const,
  STREAM: 'stream' as const,
  OVERLAY: 'overlay' as const,
} as const;

export const WIDGET_TYPES = {
  WORKOUT_CARD: 'workout-card',
  LIVE_TRACKER: 'live-tracker',
  COMPLETE_SUMMARY: 'complete-summary',
  CONTEXT_BAR: 'context-bar',
  CUSTOM: 'custom',
} as const;
```

### Validation Criteria
- [ ] useSurfaceStore hook initializes without errors
- [ ] MMKV persistence saves/loads surfaces correctly
- [ ] createSurface generates unique UUIDs
- [ ] getSurfacesByZone filters correctly
- [ ] updateSurface modifies state in-place and updates timestamp
- [ ] freezeSurface prevents user interactions (enforced in components)
- [ ] No surfaces leak between test sessions

### Dependencies
- Phase 0 (fonts loaded, stores working)
- Existing MMKV infrastructure from Phase 1 baseline

---

## PHASE 2: A2UI Interpreter

### What to Build
Replace the simple `parseResponse()` function with `interpretResponse()` that processes all operations in an array, routes each to the correct store (surface-store, workout-store, etc.), and maintains consistency across the app state. Simplify chat-store to only store text messages and surface references.

### Files to Create/Modify
- **lib/a2ui/interpreter.ts** (NEW) - Core interpreter logic
- **lib/a2ui/index.ts** - Update to export interpretResponse
- **stores/chat-store.ts** - Remove widget embedding, simplify message structure
- **lib/a2ui/event-emitter.ts** - No changes, still used for async operations

### Key Code Patterns

**lib/a2ui/interpreter.ts:**
```typescript
import { A2UIOperation, Surface } from './types';
import { useSurfaceStore } from '@/stores/surface-store';
import { useChatStore } from '@/stores/chat-store';
import { useWorkoutStore } from '@/stores/workout-store';

export interface InterpretResponse {
  operations: A2UIOperation[];
  textContent: string;
  messageId: string;
}

export async function interpretResponse(
  response: any,
  chatMessageId: string
): Promise<InterpretResponse> {
  const surfaceStore = useSurfaceStore.getState();
  const chatStore = useChatStore.getState();
  const workoutStore = useWorkoutStore.getState();

  const operations = response.operations || [];
  const textContent = response.text || '';

  // Process each operation sequentially
  for (const op of operations) {
    switch (op.type) {
      case 'create-surface':
        const surface = surfaceStore.createSurface({
          zone: op.data.zone,
          widgetType: op.data.widgetType,
          dataModel: op.data.dataModel || {},
          state: op.data.state || {},
          linkedMessageId: chatMessageId,
          styleOverrides: op.data.styleOverrides,
        });
        // Mark message as surface-containing if in stream
        if (surface.zone === 'stream') {
          chatStore.linkMessageToSurface(chatMessageId, surface.id);
        }
        break;

      case 'update-surface':
        if (op.targetSurfaceId) {
          surfaceStore.updateSurface(op.targetSurfaceId, op.data);
        }
        break;

      case 'delete-surface':
        if (op.targetSurfaceId) {
          surfaceStore.deleteSurface(op.targetSurfaceId);
        }
        break;

      case 'freeze-surface':
        if (op.targetSurfaceId) {
          surfaceStore.freezeSurface(op.targetSurfaceId);
        }
        break;

      case 'start-workout':
        // Route to workout-store
        const sessionId = await workoutStore.startSession(op.data);
        surfaceStore.createSurface({
          zone: 'overlay',
          widgetType: 'live-tracker',
          dataModel: { sessionId, ...op.data },
          state: { isRunning: true },
          linkedMessageId: chatMessageId,
        });
        break;

      case 'log-set':
        // Route to workout-store
        await workoutStore.logSet(op.data.sessionId, op.data.setData);
        const trackerSurface = Object.values(surfaceStore.surfaces).find(
          (s) => s.widgetType === 'live-tracker' && s.dataModel.sessionId === op.data.sessionId
        );
        if (trackerSurface) {
          surfaceStore.updateSurface(trackerSurface.id, {
            state: { ...trackerSurface.state, lastSetLogged: Date.now() },
            dataModel: { ...trackerSurface.dataModel, setsCompleted: (trackerSurface.dataModel.setsCompleted || 0) + 1 },
          });
        }
        break;

      case 'complete-workout':
        // Route to workout-store
        await workoutStore.completeSession(op.data.sessionId);
        // Freeze live-tracker
        const trackerToFreeze = Object.values(surfaceStore.surfaces).find(
          (s) => s.widgetType === 'live-tracker' && s.dataModel.sessionId === op.data.sessionId
        );
        if (trackerToFreeze) {
          surfaceStore.freezeSurface(trackerToFreeze.id);
        }
        // Create completion summary in stream
        surfaceStore.createSurface({
          zone: 'stream',
          widgetType: 'complete-summary',
          dataModel: { sessionId: op.data.sessionId, ...op.data },
          state: {},
          linkedMessageId: chatMessageId,
        });
        break;
    }
  }

  return {
    operations,
    textContent,
    messageId: chatMessageId,
  };
}
```

**stores/chat-store.ts (simplified):**
```typescript
import { create } from 'zustand';
import { mmkvPersist } from './mmkv-persist';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  linkedSurfaceId?: string; // reference to surface created in response
  error?: string;
}

interface ChatStore {
  messages: ChatMessage[];
  isLoading: boolean;

  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => ChatMessage;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  linkMessageToSurface: (messageId: string, surfaceId: string) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
}

export const useChatStore = create<ChatStore>()(
  mmkvPersist(
    (set, get) => ({
      messages: [],
      isLoading: false,

      addMessage: (message) => {
        const id = generateUUID();
        const newMessage: ChatMessage = {
          ...message,
          id,
          timestamp: Date.now(),
        };
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
        return newMessage;
      },

      updateMessage: (id, updates) => {
        set((state) => ({
          messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        }));
      },

      linkMessageToSurface: (messageId, surfaceId) => {
        get().updateMessage(messageId, { linkedSurfaceId: surfaceId });
      },

      clearMessages: () => set({ messages: [] }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'chat-store',
      version: 2, // bump version for migration
    }
  )
);
```

### Validation Criteria
- [ ] interpretResponse processes all operations in array
- [ ] create-surface operations create surfaces with correct zone
- [ ] start-workout creates overlay live-tracker + updates workout-store
- [ ] log-set updates both workout-store and live-tracker surface
- [ ] complete-workout freezes tracker + creates completion surface
- [ ] Chat messages contain only text + optional surfaceId reference
- [ ] No embedded widgets in messages
- [ ] Interpreter handles missing operations array gracefully

### Dependencies
- Phase 1 (SurfaceStore exists and works)
- Phase 0 (fonts available, stores configured)

---

## PHASE 3: 3-Zone Layout

### What to Build
Restructure chat.tsx to use three persistent zones managed by Zustand selectors. Implement ContextBar (reads getContextSurfaces), ChatStream (simplified text messages), and FloatingWidget (absolute overlay reading getOverlaySurfaces). Update MessageBubble to render surfaces via surface-store lookup instead of embedded widgets.

### Files to Create/Modify
- **app/(tabs)/chat.tsx** - Restructure SafeAreaView into 3 zones
- **components/chat/ContextBar.tsx** (NEW) - Zone A, renders context surfaces
- **components/chat/FloatingWidget.tsx** (NEW) - Zone C, renders overlay surfaces
- **components/chat/ChatList.tsx** - Update to render only text + surface references
- **components/chat/MessageBubble.tsx** - Update for simplified messages
- **components/chat/WidgetMessage.tsx** - Update to use surface-store lookup

### Key Code Patterns

**app/(tabs)/chat.tsx (restructured):**
```typescript
import React, { useCallback } from 'react';
import { SafeAreaView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSurfaceStore } from '@/stores/surface-store';
import { useChatStore } from '@/stores/chat-store';
import { ContextBar } from '@/components/chat/ContextBar';
import { ChatList } from '@/components/chat/ChatList';
import { FloatingWidget } from '@/components/chat/FloatingWidget';
import { ChatInput } from '@/components/chat/ChatInput';

export default function ChatScreen() {
  const messages = useChatStore((state) => state.messages);
  const contextSurfaces = useSurfaceStore((state) => state.getContextSurfaces());
  const overlaySurfaces = useSurfaceStore((state) => state.getOverlaySurfaces());

  // ... existing chat logic

  return (
    <SafeAreaView style={styles.container}>
      {/* Zone A: ContextBar */}
      {contextSurfaces.length > 0 && <ContextBar surfaces={contextSurfaces} />}

      {/* Zone B: ChatStream */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ChatList messages={messages} />
        <ChatInput onSendMessage={handleSendMessage} />
      </KeyboardAvoidingView>

      {/* Zone C: FloatingWidget (Overlay) */}
      {overlaySurfaces.length > 0 && <FloatingWidget surfaces={overlaySurfaces} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  flex: {
    flex: 1,
  },
});
```

**components/chat/ContextBar.tsx:**
```typescript
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Surface } from '@/lib/a2ui/types';
import { renderSurfaceWidget } from '@/lib/a2ui/surface-renderer';

interface ContextBarProps {
  surfaces: Surface[];
}

export function ContextBar({ surfaces }: ContextBarProps) {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
        {surfaces.map((surface) => (
          <View key={surface.id} style={styles.surfaceWrapper}>
            {renderSurfaceWidget(surface)}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,217,255,0.1)',
    backgroundColor: 'rgba(10,10,10,0.5)',
  },
  content: {
    paddingHorizontal: 12,
    gap: 12,
  },
  surfaceWrapper: {
    marginRight: 8,
  },
});
```

**components/chat/FloatingWidget.tsx:**
```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface } from '@/lib/a2ui/types';
import { renderSurfaceWidget } from '@/lib/a2ui/surface-renderer';

interface FloatingWidgetProps {
  surfaces: Surface[];
}

export function FloatingWidget({ surfaces }: FloatingWidgetProps) {
  // Only render the most recent overlay surface
  const surface = surfaces[surfaces.length - 1];
  if (!surface) return null;

  return (
    <View style={[styles.container, surface.styleOverrides]}>
      {renderSurfaceWidget(surface)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80, // above chat input
    right: 16,
    left: 16,
    backgroundColor: 'rgba(10,10,10,0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,217,255,0.2)',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
});
```

**lib/a2ui/surface-renderer.ts (NEW):**
```typescript
import React from 'react';
import { Surface } from './types';
import { WorkoutCard } from '@/components/widgets/WorkoutCard';
import { LiveSessionTracker } from '@/components/widgets/LiveSessionTracker';
import { WorkoutComplete } from '@/components/widgets/WorkoutComplete';
import { ContextBarWidget } from '@/components/widgets/ContextBarWidget';

export function renderSurfaceWidget(surface: Surface): React.ReactNode {
  if (surface.frozen) {
    // Render read-only version
    return (
      <View style={{ opacity: 0.6, pointerEvents: 'none' }}>
        {renderSurfaceWidgetContent(surface)}
      </View>
    );
  }

  return renderSurfaceWidgetContent(surface);
}

function renderSurfaceWidgetContent(surface: Surface): React.ReactNode {
  switch (surface.widgetType) {
    case 'workout-card':
      return (
        <WorkoutCard
          key={surface.id}
          data={surface.dataModel}
          state={surface.state}
          onUpdate={(updates) => {
            useSurfaceStore.getState().updateSurface(surface.id, { state: updates });
          }}
        />
      );
    case 'live-tracker':
      return (
        <LiveSessionTracker
          key={surface.id}
          sessionId={surface.dataModel.sessionId}
          state={surface.state}
          onStateChange={(updates) => {
            useSurfaceStore.getState().updateSurface(surface.id, { state: updates });
          }}
        />
      );
    case 'complete-summary':
      return (
        <WorkoutComplete
          key={surface.id}
          sessionId={surface.dataModel.sessionId}
          stats={surface.dataModel}
        />
      );
    case 'context-bar':
      return (
        <ContextBarWidget
          key={surface.id}
          data={surface.dataModel}
          state={surface.state}
        />
      );
    default:
      return null;
  }
}
```

### Validation Criteria
- [ ] ContextBar renders correctly when context surfaces exist
- [ ] ChatList displays only text messages (no embedded widgets)
- [ ] FloatingWidget appears above ChatInput
- [ ] FloatingWidget is absolutely positioned and floats smoothly
- [ ] Surfaces render via renderSurfaceWidget function
- [ ] Frozen surfaces appear read-only (opacity 0.6, pointerEvents: 'none')
- [ ] Zone switching (appearing/disappearing surfaces) is seamless
- [ ] No performance degradation with 5+ surfaces

### Dependencies
- Phase 2 (Interpreter, simplified chat-store)
- Phase 1 (SurfaceStore)
- Phase 0 (Fonts, styling)

---

## PHASE 4: Backend Operations Format

### What to Build
Modify the Python backend to respond with an `operations` array format instead of `widgets` object. Update `main.py` to return the new structure, modify `generate_widget.py` to accept zone parameter, and update genesis_unified.txt with orchestration rules.

### Files to Create/Modify
- **backend/main.py** - Update response format to use operations array
- **backend/tools/generate_widget.py** - Add zone parameter
- **backend/instructions/genesis_unified.txt** - Add zone orchestration rules
- **backend/schemas/request.py** - Update response schema

### Key Code Patterns

**backend/main.py (updated /api/chat endpoint):**
```python
from pydantic import BaseModel, Field
from typing import Optional, List

class OperationData(BaseModel):
    type: str = Field(..., description="create-surface|update-surface|delete-surface|freeze-surface|start-workout|log-set|complete-workout")
    data: dict = Field(default_factory=dict)
    targetSurfaceId: Optional[str] = None

class ChatResponse(BaseModel):
    text: str = Field(..., description="Main response text in Spanish")
    operations: List[OperationData] = Field(default_factory=list, description="Array of A2UI operations")

@app.post("/api/v1/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    # Process user input
    user_message = request.message
    context = request.context or {}

    # Call Claude with genesis_unified.txt instructions
    response = await call_claude_with_system(
        system_prompt=GENESIS_UNIFIED_INSTRUCTIONS,
        user_message=user_message,
        context=context,
    )

    # Parse response to extract operations
    operations = parse_operations_from_claude_response(response)

    return ChatResponse(
        text=extract_text_from_response(response),
        operations=operations,
    )

def parse_operations_from_claude_response(response: str) -> List[OperationData]:
    # Claude returns JSON block with operations array
    # Example: {"operations": [{"type": "create-surface", "data": {...}}]}
    import json
    import re

    json_match = re.search(r'\{[\s\S]*\}', response)
    if not json_match:
        return []

    try:
        parsed = json.loads(json_match.group())
        ops = parsed.get('operations', [])
        return [OperationData(**op) for op in ops]
    except:
        return []
```

**backend/tools/generate_widget.py (updated):**
```python
def generate_widget(
    widget_type: str,
    exercise_name: str,
    sets: int,
    zone: str = "stream",  # NEW parameter
    **kwargs
) -> dict:
    """
    Generate widget JSON with zone parameter.

    Args:
        widget_type: 'workout-card', 'live-tracker', 'complete-summary', 'context-bar'
        exercise_name: Name of the exercise (e.g., "Sentadillas")
        sets: Number of sets
        zone: 'context', 'stream', or 'overlay'
    """

    widget_schemas = {
        'workout-card': {
            'type': 'create-surface',
            'data': {
                'zone': zone,
                'widgetType': 'workout-card',
                'dataModel': {
                    'exerciseName': exercise_name,
                    'targetSets': sets,
                    'imageUrl': fetch_exercise_image(exercise_name),
                    'description': fetch_exercise_description(exercise_name),
                },
                'state': {
                    'expanded': True,
                    'selectedSets': 0,
                },
            },
        },
        'live-tracker': {
            'type': 'create-surface',
            'data': {
                'zone': zone,
                'widgetType': 'live-tracker',
                'dataModel': {
                    'sessionId': kwargs.get('sessionId'),
                    'exerciseName': exercise_name,
                    'targetSets': sets,
                    'startTime': int(time.time() * 1000),
                },
                'state': {
                    'isRunning': True,
                    'setsCompleted': 0,
                },
            },
        },
        'complete-summary': {
            'type': 'create-surface',
            'data': {
                'zone': zone,
                'widgetType': 'complete-summary',
                'dataModel': {
                    'sessionId': kwargs.get('sessionId'),
                    'exerciseName': exercise_name,
                    'totalSets': kwargs.get('totalSets', sets),
                    'totalReps': kwargs.get('totalReps', 0),
                    'totalWeight': kwargs.get('totalWeight', 0),
                    'duration': kwargs.get('duration', 0),
                },
                'state': {},
            },
        },
    }

    return widget_schemas.get(widget_type, {})
```

**backend/instructions/genesis_unified.txt (additions):**
```
## Zone Orchestration Rules

### Context Zone (zone="context")
- Displays persistent, compact information relevant across the conversation
- Examples: training mode indicator, daily stats summary, active session header
- Use case: "¿Cuál es mi rutina de hoy?" → ContextBarWidget with day's exercises
- Placement: Top of chat, horizontal scroll, max 2 visible items
- Behavior: Multiple contexts can coexist; oldest auto-removes when 4+ active

### Stream Zone (zone="stream")
- Displays messages, cards, and UI elements inline within chat flow
- Examples: WorkoutCard, WorkoutComplete, exercise details
- Use case: "Dame mi rutina de pecho" → WorkoutCard in stream, user taps "Iniciar"
- Placement: Within chat message flow, full width
- Behavior: Each stream surface becomes immutable after user interaction (freeze)

### Overlay Zone (zone="overlay")
- Floating, persistent widget above chat input
- Example: LiveSessionTracker floats during active workout
- Use case: User says "Voy a empezar" → LiveSessionTracker appears in overlay
- Placement: Absolute positioning above ChatInput, 70% width, bottom-right
- Behavior: Only one overlay active at a time; new overlays replace old ones

### Operation Sequences

#### Flow: Start Workout
1. User: "Voy a hacer sentadillas"
2. Claude response with operations:
   - create-surface(zone="stream", type="workout-card", data={exercise, sets})
3. User taps "Iniciar" on WorkoutCard → triggers handleAction("start-workout")
4. handleAction calls /api/v1/sessions → gets sessionId
5. interpretResponse processes:
   - freeze-surface(workout-card) in stream
   - create-surface(zone="overlay", type="live-tracker", data={sessionId})
   - create-surface(zone="context", type="context-bar", data={exercise, mode="logging"})

#### Flow: Log Set During Workout
1. User taps "Registrar" on LiveSessionTracker
2. handleAction("log-set", {sessionId, reps, weight})
3. Backend logs to set_logs table
4. interpretResponse processes:
   - update-surface(live-tracker, state={setsCompleted+1})
   - (optional) create-surface for encouragement message in stream

#### Flow: Complete Workout
1. User taps "Finalizar" on LiveSessionTracker
2. handleAction("complete-workout", {sessionId})
3. Backend marks workout_sessions.status = "completed"
4. interpretResponse processes:
   - freeze-surface(live-tracker) in overlay
   - create-surface(zone="stream", type="complete-summary", data={stats})
   - delete-surface(context-bar)

### Spanish Language Guidelines
- All widget labels: Spanish (Entrenar, Registrar, Finalizar, etc.)
- All placeholder text: Spanish (Ej: "Ingrese repeticiones")
- All status messages: Spanish (Ej: "Sesión iniciada", "Set registrado")
- Claude responses: Always Spanish, never mixed language
```

### Validation Criteria
- [ ] /api/v1/chat returns ChatResponse with text + operations array
- [ ] parse_operations_from_claude_response correctly extracts operations
- [ ] generate_widget includes zone parameter
- [ ] All widget schemas match Surface interface
- [ ] Zone orchestration rules implemented in backend logic
- [ ] Claude system prompt includes zone decision rules
- [ ] All Spanish labels present in widget generation
- [ ] Backend supports backward compatibility (fallback if operations missing)

### Dependencies
- Phase 3 (Frontend expects operations format)
- Phase 2 (Interpreter processes operations)

---

## PHASE 5: Widget Adaptation

### What to Build
Update all widgets (WorkoutCard, LiveSessionTracker, WorkoutComplete, ContextBarWidget) to work with surface-driven rendering, accept state updates via surface-store callbacks, and use Genesis Fusion design tokens with JetBrains Mono typography.

### Files to Create/Modify
- **components/widgets/WorkoutCard.tsx** - Accept surface data model, add zone awareness
- **components/widgets/LiveSessionTracker.tsx** - Full refactor for overlay rendering
- **components/widgets/WorkoutComplete.tsx** - Update styling, Spanish labels
- **components/widgets/ContextBarWidget.tsx** (NEW) - Compact context display
- **components/widgets/index.ts** - Export all widgets
- **theme/design-tokens.ts** - Genesis Fusion color + spacing constants

### Key Code Patterns

**theme/design-tokens.ts (NEW):**
```typescript
export const COLORS = {
  // Primary palette
  cyan: '#00D9FF',
  cyanLight: 'rgba(0,217,255,0.1)',
  cyanBorder: 'rgba(0,217,255,0.2)',

  // Accent palette
  purple: '#6432C8',
  purpleLight: 'rgba(100,50,200,0.1)',
  purpleBorder: 'rgba(100,50,200,0.2)',

  // Background
  dark: '#0a0a0a',
  darkCard: 'rgba(20,20,20,0.5)',
  darkCardLight: 'rgba(30,30,30,0.7)',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#999999',
  textMuted: '#666666',

  // Status
  success: '#00ff00',
  warning: '#ffaa00',
  error: '#ff3333',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
};
```

**components/widgets/WorkoutCard.tsx (surface-aware):**
```typescript
import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Surface } from '@/lib/a2ui/types';
import { COLORS, SPACING, BORDER_RADIUS } from '@/theme/design-tokens';
import { FONTS, FONT_SIZES } from '@/theme/fonts';
import { handleAction } from '@/lib/a2ui/action-handler';

interface WorkoutCardProps {
  data: Record<string, any>;
  state: Record<string, any>;
  onUpdate?: (state: Record<string, any>) => void;
  surfaceId?: string;
  frozen?: boolean;
}

export function WorkoutCard({
  data,
  state,
  onUpdate,
  surfaceId,
  frozen = false,
}: WorkoutCardProps) {
  const handleStart = useCallback(() => {
    if (frozen) return;
    handleAction('start-workout', { exerciseName: data.exerciseName, targetSets: data.targetSets });
  }, [frozen, data]);

  return (
    <LinearGradient
      colors={[COLORS.cyanLight, COLORS.purpleLight]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, frozen && styles.frozen]}
    >
      <View style={styles.header}>
        {data.imageUrl && (
          <Image source={{ uri: data.imageUrl }} style={styles.image} />
        )}
        <View style={styles.headerText}>
          <Text style={[styles.title, { fontFamily: FONTS.monoBold }]}>
            {data.exerciseName || 'Ejercicio'}
          </Text>
          <Text style={[styles.sets, { fontFamily: FONTS.monoRegular }]}>
            {data.targetSets} series
          </Text>
        </View>
      </View>

      {data.description && (
        <Text style={[styles.description, { fontFamily: FONTS.interRegular }]}>
          {data.description}
        </Text>
      )}

      <Pressable
        style={[styles.button, frozen && styles.buttonDisabled]}
        onPress={handleStart}
        disabled={frozen}
      >
        <Text style={[styles.buttonText, { fontFamily: FONTS.monoBold }]}>
          Iniciar
        </Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
    overflow: 'hidden',
  },
  frozen: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.darkCard,
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: COLORS.cyan,
    fontSize: FONT_SIZES.heading,
    marginBottom: SPACING.xs,
  },
  sets: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  button: {
    backgroundColor: COLORS.purple,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
  },
});
```

**components/widgets/LiveSessionTracker.tsx (overlay-optimized):**
```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useWorkoutStore } from '@/stores/workout-store';
import { COLORS, SPACING } from '@/theme/design-tokens';
import { FONTS } from '@/theme/fonts';
import { handleAction } from '@/lib/a2ui/action-handler';

interface LiveSessionTrackerProps {
  sessionId: string;
  state: Record<string, any>;
  onStateChange?: (state: Record<string, any>) => void;
}

export function LiveSessionTracker({
  sessionId,
  state,
  onStateChange,
}: LiveSessionTrackerProps) {
  const session = useWorkoutStore((store) => store.sessions[sessionId]);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (!state.isRunning) return;
    const interval = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [state.isRunning]);

  const handleLogSet = () => {
    handleAction('log-set', { sessionId });
  };

  const handleComplete = () => {
    handleAction('complete-workout', { sessionId });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontFamily: FONTS.monoBold }]}>
        {session?.exercise_name || 'Sesión Activa'}
      </Text>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { fontFamily: FONTS.monoRegular }]}>Sets</Text>
          <Text style={[styles.statValue, { fontFamily: FONTS.monoBold }]}>
            {state.setsCompleted || 0}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { fontFamily: FONTS.monoRegular }]}>Tiempo</Text>
          <Text style={[styles.statValue, { fontFamily: FONTS.monoBold }]}>
            {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={handleLogSet}>
          <Text style={[styles.actionText, { fontFamily: FONTS.monoBold }]}>
            Registrar
          </Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.completeButton]} onPress={handleComplete}>
          <Text style={[styles.actionText, { fontFamily: FONTS.monoBold }]}>
            Finalizar
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 12,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
  },
  title: {
    color: COLORS.cyan,
    fontSize: 18,
    marginBottom: SPACING.md,
  },
  stats: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    gap: SPACING.lg,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: SPACING.xs,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.purple,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: COLORS.success,
  },
  actionText: {
    color: COLORS.textPrimary,
    fontSize: 14,
  },
});
```

**components/widgets/ContextBarWidget.tsx (NEW):**
```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/theme/design-tokens';
import { FONTS } from '@/theme/fonts';

interface ContextBarWidgetProps {
  data: Record<string, any>;
  state: Record<string, any>;
}

export function ContextBarWidget({ data, state }: ContextBarWidgetProps) {
  return (
    <View style={styles.container}>
      <View style={styles.modeIndicator}>
        <Text style={[styles.label, { fontFamily: FONTS.monoRegular }]}>Modo</Text>
        <Text style={[styles.value, { fontFamily: FONTS.monoBold }]}>
          {data.mode === 'logging' ? 'Registrando' : 'Planificando'}
        </Text>
      </View>

      {data.exerciseName && (
        <View style={styles.exerciseInfo}>
          <Text style={[styles.exerciseName, { fontFamily: FONTS.monoBold }]}>
            {data.exerciseName}
          </Text>
          {data.targetSets && (
            <Text style={[styles.sets, { fontFamily: FONTS.monoRegular }]}>
              {data.targetSets} series
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  modeIndicator: {
    flex: 1,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 2,
  },
  value: {
    color: COLORS.cyan,
    fontSize: 13,
  },
  exerciseInfo: {
    flex: 2,
  },
  exerciseName: {
    color: COLORS.textPrimary,
    fontSize: 12,
  },
  sets: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
});
```

### Validation Criteria
- [ ] WorkoutCard renders with exercise image, name, target sets
- [ ] WorkoutCard "Iniciar" button triggers handleAction
- [ ] LiveSessionTracker shows timer, set counter, action buttons
- [ ] LiveSessionTracker updates in real-time during active workout
- [ ] ContextBarWidget displays compact mode + exercise info
- [ ] All widgets use Design Tokens (COLORS, SPACING, FONTS)
- [ ] All labels in Spanish
- [ ] Frozen state (opacity 0.6) applied when disabled
- [ ] No console errors when rendering multiple widgets

### Dependencies
- Phase 5 requires Phase 4 (backend operations)
- Phase 5 requires Phase 3 (surface rendering)

---

## PHASE 6: Integration & Flow Testing

### What to Build
Wire the complete end-to-end flow: user message → Claude response with operations → interpretResponse processes all operations → surfaces created in correct zones → zone components render surfaces → user interactions trigger backend actions → surfaces update in-place. Test all four key workflows.

### Files to Create/Modify
- **lib/a2ui/action-handler.ts** - Update handleAction to use surface-store
- **app/(tabs)/chat.tsx** - Wire handleAction with interpretResponse
- **lib/a2ui/index.ts** - Export integration utilities
- **__tests__/flows** (NEW) - Add integration test scenarios

### Key Code Patterns

**lib/a2ui/action-handler.ts (surface-integrated):**
```typescript
import { useChatStore } from '@/stores/chat-store';
import { useSurfaceStore } from '@/stores/surface-store';
import { useWorkoutStore } from '@/stores/workout-store';
import { interpretResponse } from './interpreter';
import { apiClient } from '@/lib/api-client';

export async function handleAction(
  action: string,
  payload: Record<string, any>
): Promise<void> {
  const chatStore = useChatStore.getState();
  const surfaceStore = useSurfaceStore.getState();
  const workoutStore = useWorkoutStore.getState();

  try {
    switch (action) {
      case 'start-workout': {
        // Create workout session backend + get sessionId
        const response = await apiClient.post('/api/v1/sessions', {
          exercise_name: payload.exerciseName,
          target_sets: payload.targetSets,
        });
        const sessionId = response.data.id;

        // Call /api/v1/chat with event
        const chatResponse = await apiClient.post('/api/v1/chat', {
          message: `Voy a empezar ${payload.exerciseName}`,
          context: { sessionId, action: 'start-workout' },
        });

        // Interpret response to create overlay + context surfaces
        await interpretResponse(chatResponse.data, '');
        break;
      }

      case 'log-set': {
        const response = await apiClient.post('/api/v1/sets', {
          session_id: payload.sessionId,
          reps: payload.reps || 0,
          weight: payload.weight || 0,
        });

        // Update live-tracker surface with new set count
        const trackerSurface = Object.values(surfaceStore.surfaces).find(
          (s) => s.widgetType === 'live-tracker' && s.dataModel.sessionId === payload.sessionId
        );

        if (trackerSurface) {
          surfaceStore.updateSurface(trackerSurface.id, {
            dataModel: {
              ...trackerSurface.dataModel,
              setsCompleted: (trackerSurface.dataModel.setsCompleted || 0) + 1,
            },
            state: { ...trackerSurface.state, lastSetLogged: Date.now() },
          });
        }
        break;
      }

      case 'complete-workout': {
        const response = await apiClient.put(`/api/v1/sessions/${payload.sessionId}`, {
          status: 'completed',
        });

        // Freeze live-tracker
        const trackerSurface = Object.values(surfaceStore.surfaces).find(
          (s) => s.widgetType === 'live-tracker' && s.dataModel.sessionId === payload.sessionId
        );
        if (trackerSurface) {
          surfaceStore.freezeSurface(trackerSurface.id);
        }

        // Create completion summary in stream
        surfaceStore.createSurface({
          zone: 'stream',
          widgetType: 'complete-summary',
          dataModel: {
            sessionId: payload.sessionId,
            totalSets: response.data.sets_count,
            totalReps: response.data.total_reps,
            totalWeight: response.data.total_weight,
            duration: response.data.duration,
          },
          state: {},
        });
        break;
      }
    }
  } catch (error) {
    console.error(`Action ${action} failed:`, error);
    chatStore.addMessage({
      role: 'assistant',
      text: `Error: No se pudo completar la acción. Intenta de nuevo.`,
      error: error.message,
    });
  }
}
```

**app/(tabs)/chat.tsx (handleAction integration):**
```typescript
const handleSendMessage = async (text: string) => {
  if (!text.trim()) return;

  chatStore.setLoading(true);
  const userMessage = chatStore.addMessage({
    role: 'user',
    text,
  });

  try {
    const response = await apiClient.post('/api/v1/chat', {
      message: text,
      context: {}, // can include session context
    });

    // Create assistant message
    const assistantMessage = chatStore.addMessage({
      role: 'assistant',
      text: response.data.text,
    });

    // Interpret operations and create surfaces
    await interpretResponse(response.data, assistantMessage.id);

  } catch (error) {
    console.error('Chat error:', error);
    chatStore.addMessage({
      role: 'assistant',
      text: 'Lo siento, ocurrió un error. Intenta de nuevo.',
      error: error.message,
    });
  } finally {
    chatStore.setLoading(false);
  }
};
```

### Test Scenarios

**Scenario 1: Start Workout**
```
1. User says "Dame mi rutina de pecho"
   - Expected: WorkoutCard in stream with exercises
2. User taps "Iniciar" on WorkoutCard
   - Expected: overlay LiveSessionTracker appears, context bar updates
3. Both surfaces update in-place (no new messages)
   - Expected: no new message bubble, surfaces visible continuously
```

**Scenario 2: Log Sets**
```
1. LiveSessionTracker visible with "Registrar" button
2. User taps "Registrar" 3 times
   - Expected: counter increments 1, 2, 3 in real-time
3. No new message bubbles created
   - Expected: surface state updates only
```

**Scenario 3: Complete Workout**
```
1. User taps "Finalizar" on LiveSessionTracker
   - Expected: tracker becomes read-only (frozen)
2. WorkoutComplete summary appears in stream
   - Expected: shows total sets, reps, weight, duration
3. Context bar disappears
   - Expected: context surfaces cleared
```

**Scenario 4: Context Persistence**
```
1. User says "Voy a entrenar pecho"
   - Expected: ContextBar appears at top
2. User sends 5 more messages
   - Expected: ContextBar remains visible, not cleared
3. User says "Terminé"
   - Expected: ContextBar disappears after completion
```

### Validation Criteria
- [ ] Scenario 1 passes: WorkoutCard → overlay tracker
- [ ] Scenario 2 passes: set counter increments without new messages
- [ ] Scenario 3 passes: tracker frozen, completion summary shows
- [ ] Scenario 4 passes: context bar persists across 5 messages
- [ ] No memory leaks (surfaces removed after deletion)
- [ ] Zone transitions smooth (no flashing/flickering)
- [ ] All Spanish labels consistent
- [ ] Error handling for network failures

### Dependencies
- Phase 5 (widgets adapted)
- Phase 4 (backend operations)
- Phase 3 (zone layout)

---

## PHASE 7: Tab Screen Integration

### What to Build
Update tab screens (train.tsx, index.tsx) to read from surface-store for active sessions and context. Ensure tab screens and chat screen share the same surface state, enabling seamless switching between tabs without losing active workouts or surfaces.

### Files to Create/Modify
- **app/(tabs)/train.tsx** - Read active overlay surfaces (live-tracker)
- **app/(tabs)/index.tsx** - Read context surfaces for home dashboard
- **app/(tabs)/settings.tsx** - Update Spanish labels

### Key Code Patterns

**app/(tabs)/train.tsx (surface-integrated):**
```typescript
import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSurfaceStore } from '@/stores/surface-store';
import { useWorkoutStore } from '@/stores/workout-store';
import { renderSurfaceWidget } from '@/lib/a2ui/surface-renderer';
import { COLORS, SPACING } from '@/theme/design-tokens';
import { FONTS } from '@/theme/fonts';

export default function TrainScreen() {
  const overlaySurfaces = useSurfaceStore((state) => state.getOverlaySurfaces());
  const streamSurfaces = useSurfaceStore((state) => state.getStreamSurfaces());
  const sessions = useWorkoutStore((state) => state.sessions);

  const activeSession = useMemo(() => {
    const trackerSurface = overlaySurfaces.find((s) => s.widgetType === 'live-tracker');
    if (!trackerSurface) return null;
    return sessions[trackerSurface.dataModel.sessionId];
  }, [overlaySurfaces, sessions]);

  const recentWorkouts = useMemo(() => {
    return Object.values(sessions)
      .filter((s) => s.status === 'completed')
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, 5);
  }, [sessions]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { fontFamily: FONTS.monoBold }]}>
        Mi Entrenamientos
      </Text>

      {activeSession && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: FONTS.monoBold }]}>
            Sesión Activa
          </Text>
          {overlaySurfaces.map((surface) => (
            <View key={surface.id} style={styles.widgetContainer}>
              {renderSurfaceWidget(surface)}
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontFamily: FONTS.monoBold }]}>
          Historial Reciente
        </Text>
        {recentWorkouts.map((workout) => (
          <View key={workout.id} style={styles.workoutCard}>
            <Text style={[styles.workoutName, { fontFamily: FONTS.monoBold }]}>
              {workout.exercise_name}
            </Text>
            <Text style={[styles.workoutStats, { fontFamily: FONTS.monoRegular }]}>
              {workout.sets_count} series • {new Date(workout.created_at).toLocaleDateString('es-ES')}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    color: COLORS.cyan,
    fontSize: 24,
    marginBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    marginBottom: SPACING.md,
  },
  widgetContainer: {
    marginBottom: SPACING.md,
  },
  workoutCard: {
    backgroundColor: COLORS.darkCard,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
  },
  workoutName: {
    color: COLORS.cyan,
    fontSize: 16,
    marginBottom: SPACING.xs,
  },
  workoutStats: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
});
```

**app/(tabs)/index.tsx (context-aware home):**
```typescript
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSurfaceStore } from '@/stores/surface-store';
import { useWorkoutStore } from '@/stores/workout-store';
import { renderSurfaceWidget } from '@/lib/a2ui/surface-renderer';
import { COLORS, SPACING } from '@/theme/design-tokens';
import { FONTS } from '@/theme/fonts';

export default function HomeScreen() {
  const contextSurfaces = useSurfaceStore((state) => state.getContextSurfaces());
  const stats = useWorkoutStore((state) => state.stats);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { fontFamily: FONTS.monoBold }]}>
        Inicio
      </Text>

      {contextSurfaces.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: FONTS.monoBold }]}>
            Tu Contexto
          </Text>
          {contextSurfaces.map((surface) => (
            <View key={surface.id} style={styles.widgetContainer}>
              {renderSurfaceWidget(surface)}
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontFamily: FONTS.monoBold }]}>
          Estadísticas
        </Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { fontFamily: FONTS.monoBold }]}>
              {stats.thisWeekWorkouts || 0}
            </Text>
            <Text style={[styles.statLabel, { fontFamily: FONTS.monoRegular }]}>
              Entrenamientos Esta Semana
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { fontFamily: FONTS.monoBold }]}>
              {stats.currentStreak || 0}
            </Text>
            <Text style={[styles.statLabel, { fontFamily: FONTS.monoRegular }]}>
              Racha de Días
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    color: COLORS.cyan,
    fontSize: 24,
    marginBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    marginBottom: SPACING.md,
  },
  widgetContainer: {
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.darkCard,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.cyan,
    fontSize: 20,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },
});
```

### Validation Criteria
- [ ] train.tsx reads active overlay surfaces
- [ ] train.tsx displays recent workouts from workout-store
- [ ] index.tsx displays context surfaces
- [ ] index.tsx shows stats (this week workouts, streak)
- [ ] Switching from chat → train → chat preserves active surfaces
- [ ] No data loss when switching tabs
- [ ] All Spanish labels consistent across tabs
- [ ] Live data updates as surfaces change

### Dependencies
- Phase 6 (integration testing)
- Phase 5 (widgets)
- Phase 1 (workout-store)

---

## Sprint 2: Micro-Acciones Silenciosas (Milestone Futuro)

### Overview
This section documents the future lightweight event handling endpoint that will bypass the LLM and provide instant feedback for simple state changes. This will significantly improve UX for rapid interactions during active workouts.

### Specification

**Endpoint:** `POST /api/a2ui/event`

**Request Schema:**
```json
{
  "surfaceId": "uuid-of-surface",
  "action": "checkbox-toggle|timer-sync|habit-toggle|form-input",
  "payload": {
    "fieldName": "string",
    "value": "any"
  }
}
```

**Response Schema:**
```json
{
  "operations": [
    {
      "type": "update-surface",
      "targetSurfaceId": "uuid",
      "data": {
        "state": {
          "fieldName": "value",
          "updatedAt": 1707221400000
        }
      }
    }
  ],
  "success": true,
  "executedAt": 1707221400000
}
```

### Use Cases
1. **Checkbox Toggle:** User taps ✓ on habit tracker → instant visual feedback
2. **Timer Sync:** Timer reaches 0 → auto-update surface state
3. **Quick Form Input:** User types weight → surface state updates without waiting for Claude
4. **UI Preference:** User expands card → save expansion state locally

### Sprint 1 Implementation Notes
- All events continue through `/api/v1/chat` with `event` field in request
- Event operations handled by interpretResponse like normal operations
- Mark as READY for Sprint 2 when:
  - All Phase 7 tests pass
  - No pending action-handler refactors
  - Backend stable for 1 week

### When to Implement
- After Sprint 1 complete and stabilized
- When user feedback indicates response lag > 200ms on actions
- Frontend ready: event-emitter.ts extended with event type routing

---

## File Checklist

### Phase 0: Typography & Design System
- [ ] `app/_layout.tsx` - expo-font configuration
- [ ] `theme/fonts.ts` - FONTS + FONT_SIZES constants
- [ ] `components/common/StandardCard.tsx` - extracted component
- [ ] `components/common/ShineEffect.tsx` - extracted component
- [ ] `components/common/GradientCard.tsx` - updated to use extracted components
- [ ] `components/common/index.ts` - exports StandardCard, ShineEffect
- [ ] `components/navigation/CustomTabBar.tsx` - label rendering
- [ ] `theme/design-tokens.ts` - COLORS, SPACING, BORDER_RADIUS

### Phase 1: SurfaceStore
- [ ] `stores/surface-store.ts` - Zustand store with MMKV
- [ ] `lib/a2ui/types.ts` - Surface, A2UIOperation interfaces
- [ ] `lib/a2ui/constants.ts` - ZONES, WIDGET_TYPES
- [ ] `stores/index.ts` - export useSurfaceStore

### Phase 2: A2UI Interpreter
- [ ] `lib/a2ui/interpreter.ts` - interpretResponse function
- [ ] `lib/a2ui/index.ts` - export interpretResponse
- [ ] `stores/chat-store.ts` - simplified ChatMessage interface

### Phase 3: 3-Zone Layout
- [ ] `components/chat/ContextBar.tsx` - zone A component
- [ ] `components/chat/FloatingWidget.tsx` - zone C component
- [ ] `components/chat/ChatList.tsx` - updated for text-only
- [ ] `components/chat/MessageBubble.tsx` - simplified
- [ ] `lib/a2ui/surface-renderer.ts` - renderSurfaceWidget function
- [ ] `app/(tabs)/chat.tsx` - restructured layout

### Phase 4: Backend Operations
- [ ] `backend/main.py` - /api/v1/chat response format
- [ ] `backend/tools/generate_widget.py` - zone parameter
- [ ] `backend/instructions/genesis_unified.txt` - orchestration rules
- [ ] `backend/schemas/request.py` - ChatResponse schema

### Phase 5: Widget Adaptation
- [ ] `components/widgets/WorkoutCard.tsx` - surface-aware
- [ ] `components/widgets/LiveSessionTracker.tsx` - overlay-optimized
- [ ] `components/widgets/WorkoutComplete.tsx` - styling updates
- [ ] `components/widgets/ContextBarWidget.tsx` - new compact widget
- [ ] `components/widgets/index.ts` - all widget exports

### Phase 6: Integration & Flow Testing
- [ ] `lib/a2ui/action-handler.ts` - updated for surface-store
- [ ] `app/(tabs)/chat.tsx` - handleAction wiring
- [ ] `__tests__/flows/` - integration test scenarios

### Phase 7: Tab Screen Integration
- [ ] `app/(tabs)/train.tsx` - surface-store integration
- [ ] `app/(tabs)/index.tsx` - context + stats display
- [ ] `app/(tabs)/settings.tsx` - Spanish label updates

### Configuration & Documentation
- [ ] Update package.json for dependencies (expo-font, etc.)
- [ ] Update .env for backend URL (if needed)
- [ ] Create migration guide for Phase 1 → Phase 2 upgrade
- [ ] Add CONTRIBUTING.md for future contributors

---

## Success Criteria (Final Validation)

- [ ] All 7 phases complete
- [ ] Zero console errors or warnings
- [ ] JetBrains Mono renders on all labels
- [ ] Tab bar shows 4 Spanish labels below icons
- [ ] Scenario 1-4 (integration tests) all pass
- [ ] Context surfaces persist across 5+ messages
- [ ] Live-tracker floats smoothly during workout
- [ ] Completion summary displays correctly
- [ ] Tab switching preserves active surfaces
- [ ] All UI text in Spanish
- [ ] No memory leaks (surfaces cleaned up)
- [ ] MMKV persistence working (state survives app restart)

---

**Document Prepared:** 2026-02-06
**Next Step:** Begin Phase 0 implementation
**Estimated Timeline:** 2-3 weeks full implementation + testing
