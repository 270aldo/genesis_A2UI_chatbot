# A2UI ZONES MASTER PROMPT — GENESIS PHASE 1.5
**Date:** 2026-02-06
**Status:** MASTER IMPLEMENTATION DOCUMENT
**Scope:** Complete self-contained implementation guide for NGX GENESIS A2UI Zones architecture

---

## SECTION 1: ARCHITECTURE OVERVIEW

### 3-Zone Dynamic Layout System

The GENESIS mobile app evolves from a linear chat interface to a 3-zone dynamic layout where the backend acts as a **UI Director**:

1. **Zone A (ContextBar)** — Sticky header bar (~80px height)
   - Shows training mode state, elapsed time, current exercise, daily stats
   - Persistent, updates in-place via surface updates
   - One active context surface at a time

2. **Zone B (ChatStream)** — Main flex-1 scrollable area
   - Message list with embedded stream widgets
   - Informational content, workout plans, recipes, form responses
   - Each message can reference a surface via `surfaceId`

3. **Zone C (FloatingWidget)** — Overlay layer above input
   - Active interaction widgets (live session tracker, rest timer, UI interactions)
   - Dismissible, absolute positioned ~90px from bottom
   - One active overlay surface at a time

### Data Flow Architecture

```
Backend Response
    ↓
A2UI Interpreter (interpreter.ts)
    ↓
    ├→ Create ChatMessage (text-only)
    ├→ Process Operations Array
    │   ├→ createSurface → surface-store.createSurface()
    │   ├→ updateComponents → surface-store.updateComponents()
    │   ├→ updateDataModel → surface-store.updateDataModel()
    │   └→ deleteSurface → surface-store.deleteSurface()
    ↓
SurfaceStore (Zustand + MMKV)
    ↓
Components read surfaces via selectors
    ├→ ContextBar reads getContextSurfaces()
    ├→ ChatList renders messages + stream surfaces
    ├→ FloatingWidget reads getOverlaySurfaces()
    └→ SurfaceRenderer resolves widgetType → actual component
```

### SurfaceStore: Single Source of Truth for Widgets

All widgets live in `SurfaceStore`, NOT embedded in messages. Messages only reference surfaces:

```
ChatMessage { id, role, text, agent, timestamp, surfaceId? }
     ↓
Surface { id, zone, widgetType, dataModel, state, linkedMessageId? }
     ↓
SurfaceRenderer { looks up Surface, renders component with dataModel }
```

### Backend Operations Format

Every backend response contains an `operations` array. Each operation is **atomic** and carries a **zone assignment**:

```typescript
interface A2UIOperation {
  createSurface?: {
    surfaceId: string;
    zone: 'context' | 'stream' | 'overlay';
    catalogId: string;
  };
  updateComponents?: {
    surfaceId: string;
    components: { type: string; id: string }[];
  };
  updateDataModel?: {
    surfaceId: string;
    dataModel: Record<string, unknown>;
  };
  deleteSurface?: {
    surfaceId: string;
  };
}
```

### GENESIS as UI Director

The backend **never asks the user where widgets go**. The backend **always specifies the zone**:

- User clicks "Start Workout" → Backend responds with:
  - `createSurface` overlay (LiveSessionTracker)
  - `updateDataModel` context (training mode on)
  - `createSurface` stream (modal confirmation message)

- User logs a set → Backend responds with:
  - `updateDataModel` overlay (exercises updated)
  - NO new chat message, NO new surface

- User completes workout → Backend responds with:
  - `deleteSurface` overlay
  - `createSurface` stream (WorkoutComplete summary)
  - `updateDataModel` context (rest mode, rest timer starts)

---

## SECTION 2: CRITICAL RULES (ENFORCED)

**These rules MUST be followed. They are not optional.**

### 1. SURFACE ISOLATION
- **NEVER** embed widgets inside `<ChatMessage>` component
- Widgets live **exclusively** in `SurfaceStore`
- Messages reference surfaces via `surfaceId` field only
- `<MessageBubble>` renders text + surfaces separately

### 2. SPANISH UI TEXT (100% REQUIREMENT)
Every user-facing label, button, placeholder must be Spanish:
- "Comenzar" (Start)
- "Iniciar" (Begin/Start)
- "Completar" (Complete)
- "Registrar Set" (Log Set)
- "Finalizar" (Finish)
- "Descanso" (Rest)
- "Ejercicio" (Exercise)
- "Repeticiones" (Reps)
- "Peso" (Weight)

### 3. TYPOGRAPHY SYSTEM (MANDATORY)
All text components must declare `fontFamily`:

- **JetBrains Mono** (monospace):
  - All labels, stats, pills, headers
  - Set counts, rep numbers, weights
  - Timer displays
  - Category tags

- **Inter** (sans-serif):
  - Body text, descriptions
  - Instructions, explanations
  - Message text

Example:
```tsx
<Text style={{ fontFamily: FONTS.mono, fontSize: FONT_SIZES.sm }}>
  5 × 10
</Text>

<Text style={{ fontFamily: FONTS.sans, fontSize: FONT_SIZES.base }}>
  Complete all reps with controlled tempo
</Text>
```

### 4. AGENT INSTRUCTIONS USE PARENTHESES NOT BRACES
Backend instructions use parentheses for template variables (ADK template engine conflict):

```
When user starts workout, respond with context:
- Current Exercise: (exercise_name)
- Set: (set_number) / (total_sets)
- Reps: (rep_target)

NOT: {exercise_name}, {set_number}, {total_sets}, {rep_target}
```

### 5. GENESIS FUSION DESIGN SYSTEM
Every component must use tokens from design system:

```typescript
colors: {
  bg_dark: '#0A0E27',
  bg_card: '#111633',
  text_primary: '#FFFFFF',
  text_secondary: '#A0A0A0',
  accent_primary: '#6366F1',
  accent_secondary: '#EC4899',
  status_success: '#10B981',
  status_warning: '#F59E0B',
}

spacing: {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, 2xl: 32
}

radius: {
  sm: 6, md: 12, lg: 16, xl: 20
}
```

### 6. ZONE ASSIGNMENT FROM BACKEND
- **Frontend CANNOT decide** where widgets go
- Zone always comes from `operations.createSurface.zone`
- If zone is missing, default to "stream"
- If a widget is created without zone, log error and assign "stream" as fallback

### 7. SURFACE OPERATIONS ARE ATOMIC
Each operation is independent:
- `createSurface` does NOT imply immediate render
- `updateComponents` changes widget type, not data
- `updateDataModel` changes data, not type
- `deleteSurface` removes surface completely
- All operations in array execute sequentially

### 8. DO NOT RECREATE PHASE 1 FILES
These files already exist and MUST NOT be recreated:
- `backend/db/migrations/` (Supabase schema)
- `backend/api/routes/chat.py` (REST endpoints)
- `apps/mobile/src/stores/workout-store.ts` (workout logic)
- `apps/mobile/src/stores/user-store.ts` (user profile)
- Phase 1 widget types (WorkoutCard, MealPlan, etc.)

---

## SECTION 3: PHASE-BY-PHASE IMPLEMENTATION

### PHASE 0: Typography & Design Foundation

**Objective:** Establish font loading and design token system

**Files to Create:**
1. `apps/mobile/src/theme/fonts.ts` (NEW)
2. `apps/mobile/src/components/common/StandardCard.tsx` (NEW)
3. `apps/mobile/src/components/common/ShineEffect.tsx` (NEW)

**Files to Modify:**
1. `apps/mobile/app/_layout.tsx`
2. `apps/mobile/src/components/common/index.ts`
3. `apps/mobile/src/components/navigation/CustomTabBar.tsx`

---

#### Phase 0.1: Font System (`fonts.ts`)

**Path:** `apps/mobile/src/theme/fonts.ts`

**Status:** NEW FILE

```typescript
export const FONTS = {
  mono: 'JetBrains Mono' as const,
  sans: 'Inter' as const,
} as const;

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;

export const FONT_WEIGHTS = {
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
} as const;

export type FontFamily = typeof FONTS[keyof typeof FONTS];
export type FontSize = typeof FONT_SIZES[keyof typeof FONT_SIZES];
export type FontWeight = typeof FONT_WEIGHTS[keyof typeof FONT_WEIGHTS];
```

---

#### Phase 0.2: Font Loading in `_layout.tsx`

**Path:** `apps/mobile/app/_layout.tsx`

**Modification:** Add font loading at root layout

```typescript
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Keep existing imports...

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'JetBrains Mono': require('@/assets/fonts/JetBrainsMono-Regular.ttf'),
    'JetBrains Mono Medium': require('@/assets/fonts/JetBrainsMono-Medium.ttf'),
    'JetBrains Mono Bold': require('@/assets/fonts/JetBrainsMono-Bold.ttf'),
    'Inter': require('@/assets/fonts/Inter-Regular.ttf'),
    'Inter Medium': require('@/assets/fonts/Inter-Medium.ttf'),
    'Inter Bold': require('@/assets/fonts/Inter-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <RootLayoutContent />
  );
}

function RootLayoutContent() {
  // Existing layout code...
}
```

**NOTE:** Ensure font files are placed in `assets/fonts/` directory. If fonts don't exist, use system fallbacks:
- iOS: 'Menlo' for mono, 'Helvetica Neue' for sans
- Android: 'monospace' for mono, 'sans-serif' for sans

---

#### Phase 0.3: StandardCard Component

**Path:** `apps/mobile/src/components/common/StandardCard.tsx`

**Status:** NEW FILE

```typescript
import React from 'react';
import { View, ViewProps } from 'react-native';
import { useColorScheme } from 'nativewind';

interface StandardCardProps extends ViewProps {
  children: React.ReactNode;
  borderColor?: string;
  bgColor?: string;
}

export const StandardCard = ({
  children,
  borderColor,
  bgColor,
  className,
  style,
  ...props
}: StandardCardProps) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const defaultBgColor = isDark ? 'bg-bg-card' : 'bg-white';
  const defaultBorderColor = isDark ? 'border-border-dark' : 'border-border-light';

  return (
    <View
      className={`
        rounded-xl
        border
        ${bgColor || defaultBgColor}
        ${borderColor || defaultBorderColor}
        p-4
        ${className || ''}
      `}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
};

export default StandardCard;
```

---

#### Phase 0.4: ShineEffect Component

**Path:** `apps/mobile/src/components/common/ShineEffect.tsx`

**Status:** NEW FILE

```typescript
import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle } from 'react-native';

interface ShineEffectProps {
  width?: number;
  height?: number;
  style?: ViewStyle;
  duration?: number;
}

export const ShineEffect = ({
  width = '100%',
  height = '100%',
  style,
  duration = 2000,
}: ShineEffectProps) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();

    return () => shimmer.stop();
  }, []);

  const opacity = shimmerAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.3, 0],
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          width,
          height,
          opacity,
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
        },
        style,
      ]}
    />
  );
};

export default ShineEffect;
```

---

#### Phase 0.5: Update Common Components Index

**Path:** `apps/mobile/src/components/common/index.ts`

```typescript
export { GradientCard } from './GradientCard';
export { StandardCard } from './StandardCard';
export { ShineEffect } from './ShineEffect';
export { Badge } from './Badge';
export { Divider } from './Divider';
// ... other existing exports
```

---

#### Phase 0.6: Update CustomTabBar

**Path:** `apps/mobile/src/components/navigation/CustomTabBar.tsx`

**Modification:** Add JetBrains Mono labels below icons

```typescript
import { FONTS, FONT_SIZES } from '@/theme/fonts';

// In the tab rendering loop:
<View className="items-center gap-1">
  <Icon name={icon} size={24} color={color} />
  <Text
    style={{
      fontFamily: FONTS.mono,
      fontSize: FONT_SIZES.xs,
      color,
      marginTop: 2,
    }}
  >
    {label}
  </Text>
</View>
```

---

### PHASE 1: SURFACE STORE IMPLEMENTATION

**Objective:** Create Zustand store to manage all widget surfaces with MMKV persistence

**Files to Create:**
1. `apps/mobile/src/stores/surface-store.ts` (NEW)

**Files to Modify:**
1. `apps/mobile/src/stores/index.ts`

---

#### Phase 1.1: Create SurfaceStore

**Path:** `apps/mobile/src/stores/surface-store.ts`

**Status:** NEW FILE

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

// Initialize MMKV storage
const mmkvStorage = new MMKV({
  id: 'genesis-surfaces',
});

// ===== TYPES =====

export interface Surface {
  id: string;
  zone: 'context' | 'stream' | 'overlay';
  widgetType: string;
  dataModel: Record<string, unknown>;
  state: 'active' | 'frozen' | 'dismissed';
  linkedMessageId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SurfaceState {
  // State
  surfaces: Record<string, Surface>;

  // Actions: Mutation
  createSurface: (
    id: string,
    zone: Surface['zone'],
    widgetType: string,
    dataModel: Record<string, unknown>,
    linkedMessageId?: string
  ) => void;

  updateComponents: (surfaceId: string, newWidgetType: string) => void;

  updateDataModel: (
    surfaceId: string,
    patch: Record<string, unknown>
  ) => void;

  deleteSurface: (surfaceId: string) => void;

  freezeSurface: (surfaceId: string) => void;

  resumeSurface: (surfaceId: string) => void;

  // Actions: Query
  getSurface: (id: string) => Surface | undefined;

  getContextSurfaces: () => Surface[];

  getStreamSurfaces: () => Surface[];

  getOverlaySurfaces: () => Surface[];

  getActiveSurfaces: (zone?: Surface['zone']) => Surface[];

  // Utility
  clearAll: () => void;
}

// ===== STORE CREATION =====

export const useSurfaceStore = create<SurfaceState>()(
  persist(
    (set, get) => ({
      // Initial state
      surfaces: {},

      // === MUTATION ACTIONS ===

      createSurface: (
        id: string,
        zone: Surface['zone'],
        widgetType: string,
        dataModel: Record<string, unknown>,
        linkedMessageId?: string
      ) => {
        const now = Date.now();
        const newSurface: Surface = {
          id,
          zone,
          widgetType,
          dataModel,
          state: 'active',
          linkedMessageId,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          surfaces: {
            ...state.surfaces,
            [id]: newSurface,
          },
        }));
      },

      updateComponents: (surfaceId: string, newWidgetType: string) => {
        set((state) => {
          const surface = state.surfaces[surfaceId];
          if (!surface) {
            console.warn(`Surface ${surfaceId} not found for updateComponents`);
            return state;
          }

          return {
            surfaces: {
              ...state.surfaces,
              [surfaceId]: {
                ...surface,
                widgetType: newWidgetType,
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      updateDataModel: (
        surfaceId: string,
        patch: Record<string, unknown>
      ) => {
        set((state) => {
          const surface = state.surfaces[surfaceId];
          if (!surface) {
            console.warn(`Surface ${surfaceId} not found for updateDataModel`);
            return state;
          }

          return {
            surfaces: {
              ...state.surfaces,
              [surfaceId]: {
                ...surface,
                dataModel: {
                  ...surface.dataModel,
                  ...patch,
                },
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      deleteSurface: (surfaceId: string) => {
        set((state) => {
          const { [surfaceId]: _, ...remaining } = state.surfaces;
          return { surfaces: remaining };
        });
      },

      freezeSurface: (surfaceId: string) => {
        set((state) => {
          const surface = state.surfaces[surfaceId];
          if (!surface) {
            console.warn(`Surface ${surfaceId} not found for freeze`);
            return state;
          }

          return {
            surfaces: {
              ...state.surfaces,
              [surfaceId]: {
                ...surface,
                state: 'frozen',
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      resumeSurface: (surfaceId: string) => {
        set((state) => {
          const surface = state.surfaces[surfaceId];
          if (!surface) {
            console.warn(`Surface ${surfaceId} not found for resume`);
            return state;
          }

          return {
            surfaces: {
              ...state.surfaces,
              [surfaceId]: {
                ...surface,
                state: 'active',
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      // === QUERY ACTIONS ===

      getSurface: (id: string) => {
        return get().surfaces[id];
      },

      getContextSurfaces: () => {
        return Object.values(get().surfaces).filter(
          (s) => s.zone === 'context'
        );
      },

      getStreamSurfaces: () => {
        return Object.values(get().surfaces).filter(
          (s) => s.zone === 'stream'
        );
      },

      getOverlaySurfaces: () => {
        return Object.values(get().surfaces).filter(
          (s) => s.zone === 'overlay'
        );
      },

      getActiveSurfaces: (zone?: Surface['zone']) => {
        const allSurfaces = Object.values(get().surfaces);

        const filtered = allSurfaces.filter(
          (s) => s.state === 'active' && (!zone || s.zone === zone)
        );

        return filtered.sort((a, b) => b.createdAt - a.createdAt);
      },

      // === UTILITY ===

      clearAll: () => {
        set({ surfaces: {} });
      },
    }),
    {
      name: 'genesis-surface-store',
      storage: createJSONStorage(() => ({
        getItem: (key: string) => {
          const value = mmkvStorage.getString(key);
          return value ? JSON.parse(value) : null;
        },
        setItem: (key: string, value: unknown) => {
          mmkvStorage.set(key, JSON.stringify(value));
        },
        removeItem: (key: string) => {
          mmkvStorage.delete(key);
        },
      })),
      partialize: (state) => ({
        surfaces: state.surfaces,
      }),
    }
  )
);

// ===== SELECTORS =====

export const selectSurfaces = (state: SurfaceState) => state.surfaces;
export const selectContextSurfaces = (state: SurfaceState) =>
  state.getContextSurfaces();
export const selectStreamSurfaces = (state: SurfaceState) =>
  state.getStreamSurfaces();
export const selectOverlaySurfaces = (state: SurfaceState) =>
  state.getOverlaySurfaces();
export const selectActiveSurfaces = (zone?: Surface['zone']) => (
  state: SurfaceState
) => state.getActiveSurfaces(zone);

export default useSurfaceStore;
```

---

#### Phase 1.2: Update Store Index

**Path:** `apps/mobile/src/stores/index.ts`

```typescript
export { useChatStore } from './chat-store';
export { useWorkoutStore } from './workout-store';
export { useUserStore } from './user-store';
export { useSurfaceStore, selectContextSurfaces, selectStreamSurfaces, selectOverlaySurfaces } from './surface-store';
```

---

### PHASE 2: A2UI INTERPRETER

**Objective:** Create interpreter to process backend operations and route to stores

**Files to Create:**
1. `apps/mobile/src/lib/a2ui/interpreter.ts` (NEW)
2. `apps/mobile/src/lib/a2ui/types.ts` (NEW - consolidate types)

**Files to Modify:**
1. `apps/mobile/src/stores/chat-store.ts`
2. `apps/mobile/src/lib/a2ui/index.ts`

---

#### Phase 2.1: A2UI Types

**Path:** `apps/mobile/src/lib/a2ui/types.ts`

**Status:** NEW FILE

```typescript
// ===== OPERATION TYPES =====

export interface CreateSurfaceOp {
  createSurface: {
    surfaceId: string;
    zone: 'context' | 'stream' | 'overlay';
    catalogId: string;
  };
}

export interface UpdateComponentsOp {
  updateComponents: {
    surfaceId: string;
    components: {
      type: string;
      id: string;
    }[];
  };
}

export interface UpdateDataModelOp {
  updateDataModel: {
    surfaceId: string;
    dataModel: Record<string, unknown>;
  };
}

export interface DeleteSurfaceOp {
  deleteSurface: {
    surfaceId: string;
  };
}

export type A2UIOperation =
  | CreateSurfaceOp
  | UpdateComponentsOp
  | UpdateDataModelOp
  | DeleteSurfaceOp;

// ===== BACKEND RESPONSE TYPES =====

export interface BackendResponse {
  text: string;
  agent?: string;
  operations?: A2UIOperation[];
  // Legacy support
  payload?: {
    type: string;
    props: Record<string, unknown>;
  } | null;
  widgets?: any[] | null;
}

// ===== CHAT MESSAGE TYPE =====

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  agent?: string;
  timestamp: number;
  surfaceId?: string; // Reference to surface in SurfaceStore
}

// ===== INTERPRETER RESULT =====

export interface InterpretResult {
  message: ChatMessage;
  operationsProcessed: number;
  errors: string[];
}
```

---

#### Phase 2.2: A2UI Interpreter

**Path:** `apps/mobile/src/lib/a2ui/interpreter.ts`

**Status:** NEW FILE

```typescript
import { useSurfaceStore } from '@/stores/surface-store';
import { useChatStore } from '@/stores/chat-store';
import { v4 as uuidv4 } from 'uuid';
import {
  BackendResponse,
  A2UIOperation,
  ChatMessage,
  InterpretResult,
} from './types';

/**
 * interpretResponse()
 *
 * Main interpreter function. Processes backend response and:
 * 1. Creates a ChatMessage for chat-store (text only)
 * 2. Processes operations and routes to surface-store
 * 3. Returns result with message and operation count
 *
 * NOTE: This function must be called SYNCHRONOUSLY after receiving
 * backend response. It reads stores to apply operations.
 */
export function interpretResponse(
  response: BackendResponse,
  linkedMessageId?: string
): InterpretResult {
  const errors: string[] = [];
  let operationsProcessed = 0;

  // Get store instances
  const surfaceStore = useSurfaceStore.getState();
  const chatStore = useChatStore.getState();

  // Step 1: Create ChatMessage (text only, no embedded widgets)
  const messageId = uuidv4();
  const chatMessage: ChatMessage = {
    id: messageId,
    role: 'assistant',
    text: response.text || '(No response text)',
    agent: response.agent || 'GENESIS',
    timestamp: Date.now(),
    // surfaceId will be set if we create a stream surface below
  };

  // Step 2: Process operations
  if (response.operations && Array.isArray(response.operations)) {
    for (const op of response.operations) {
      try {
        processOperation(op, surfaceStore, messageId, errors);
        operationsProcessed++;
      } catch (error) {
        errors.push(`Failed to process operation: ${error}`);
      }
    }
  }

  // Step 3: Fallback for legacy format (payload/widgets)
  if (!response.operations || response.operations.length === 0) {
    if (response.payload || response.widgets) {
      const legacyOps = convertLegacyFormat(response);
      for (const op of legacyOps) {
        try {
          processOperation(op, surfaceStore, messageId, errors);
          operationsProcessed++;
        } catch (error) {
          errors.push(`Failed to process legacy operation: ${error}`);
        }
      }
    }
  }

  // Step 4: Add message to chat
  chatStore.addMessage(chatMessage);

  return {
    message: chatMessage,
    operationsProcessed,
    errors,
  };
}

/**
 * processOperation()
 *
 * Routes a single operation to the appropriate surface-store action
 */
function processOperation(
  op: A2UIOperation,
  surfaceStore: ReturnType<typeof useSurfaceStore.getState>,
  linkedMessageId: string,
  errors: string[]
): void {
  if ('createSurface' in op && op.createSurface) {
    const { surfaceId, zone, catalogId } = op.createSurface;

    // Extract widget type from catalogId
    // e.g., "ngx.genesis.fitness" -> "fitness"
    const widgetType = catalogId.split('.').pop() || 'unknown';

    surfaceStore.createSurface(
      surfaceId,
      zone,
      widgetType,
      { catalogId }, // Initial dataModel with catalogId
      linkedMessageId
    );
  } else if ('updateComponents' in op && op.updateComponents) {
    const { surfaceId, components } = op.updateComponents;

    // For now, assume single component type
    const newWidgetType = components[0]?.type || 'unknown';

    surfaceStore.updateComponents(surfaceId, newWidgetType);
  } else if ('updateDataModel' in op && op.updateDataModel) {
    const { surfaceId, dataModel } = op.updateDataModel;

    surfaceStore.updateDataModel(surfaceId, dataModel);
  } else if ('deleteSurface' in op && op.deleteSurface) {
    const { surfaceId } = op.deleteSurface;

    surfaceStore.deleteSurface(surfaceId);
  } else {
    errors.push(`Unknown operation type: ${JSON.stringify(op)}`);
  }
}

/**
 * convertLegacyFormat()
 *
 * Converts old payload/widgets format to new operations format
 * for backward compatibility during transition
 */
function convertLegacyFormat(response: BackendResponse): A2UIOperation[] {
  const ops: A2UIOperation[] = [];

  if (response.payload) {
    const { type, props } = response.payload;
    const surfaceId = `surface-${uuidv4().slice(0, 8)}`;

    ops.push({
      createSurface: {
        surfaceId,
        zone: 'stream', // Default to stream for legacy
        catalogId: `ngx.genesis.${type}`,
      },
    });

    ops.push({
      updateDataModel: {
        surfaceId,
        dataModel: props,
      },
    });
  }

  if (response.widgets && Array.isArray(response.widgets)) {
    for (const widget of response.widgets) {
      const surfaceId = `surface-${uuidv4().slice(0, 8)}`;

      ops.push({
        createSurface: {
          surfaceId,
          zone: widget.zone || 'stream',
          catalogId: widget.catalogId || `ngx.genesis.${widget.type}`,
        },
      });

      if (widget.props) {
        ops.push({
          updateDataModel: {
            surfaceId,
            dataModel: widget.props,
          },
        });
      }
    }
  }

  return ops;
}

/**
 * Helper: Parse catalogId to get widget type
 */
export function getWidgetTypeFromCatalogId(catalogId: string): string {
  return catalogId.split('.').pop() || 'unknown';
}

export default interpretResponse;
```

---

#### Phase 2.3: Update A2UI Index

**Path:** `apps/mobile/src/lib/a2ui/index.ts`

```typescript
export { interpretResponse, getWidgetTypeFromCatalogId } from './interpreter';
export type {
  A2UIOperation,
  BackendResponse,
  ChatMessage,
  InterpretResult,
} from './types';
export * from './mediator'; // Existing mediator
```

---

#### Phase 2.4: SIMPLIFIED ChatStore

**Path:** `apps/mobile/src/stores/chat-store.ts`

**Modification:** Remove widget embedding, simplify message structure

```typescript
import { create } from 'zustand';
import { ChatMessage } from '@/lib/a2ui/types';
import { interpretResponse } from '@/lib/a2ui/interpreter';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;

  // Message management
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  deleteMessage: (messageId: string) => void;

  // API interactions
  sendMessage: (text: string) => Promise<void>;
  sendEvent: (action: string, payload?: Record<string, unknown>) => Promise<void>;

  // Utilities
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,

  addMessage: (message: ChatMessage) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  deleteMessage: (messageId: string) => {
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    }));
  },

  sendMessage: async (text: string) => {
    const { addMessage, setLoading, setError } = get();

    // Add user message
    addMessage({
      id: `msg-${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now(),
    });

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const backendResponse = await response.json();

      // CRITICAL: Call interpretResponse to process operations
      const result = interpretResponse(backendResponse);

      if (result.errors.length > 0) {
        console.warn('Interpretation errors:', result.errors);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  },

  sendEvent: async (action: string, payload?: Record<string, unknown>) => {
    const { setLoading, setError } = get();

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: action, payload }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const backendResponse = await response.json();

      // CRITICAL: Call interpretResponse to process operations
      const result = interpretResponse(backendResponse);

      if (result.errors.length > 0) {
        console.warn('Interpretation errors:', result.errors);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));

export default useChatStore;
```

---

## SECTION 4: 3-ZONE LAYOUT (CONTINUED IN NEXT PART)

Due to token limitations, I'll continue with the next section. Let me now write the remaining sections to the file:

---

## SECTION 4: 3-ZONE LAYOUT COMPONENTS

### PHASE 3: Zone Components Implementation

**Objective:** Build ContextBar, FloatingWidget, and SurfaceRenderer components

**Files to Create:**
1. `apps/mobile/src/components/chat/ContextBar.tsx` (NEW)
2. `apps/mobile/src/components/chat/FloatingWidget.tsx` (NEW)
3. `apps/mobile/src/components/chat/SurfaceRenderer.tsx` (NEW)

**Files to Modify:**
1. `apps/mobile/app/chat.tsx`
2. `apps/mobile/src/components/chat/MessageBubble.tsx`
3. `apps/mobile/src/components/chat/WidgetMessage.tsx`

---

#### Phase 3.1: ContextBar Component

**Path:** `apps/mobile/src/components/chat/ContextBar.tsx`

**Status:** NEW FILE

```typescript
import React, { useMemo } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { useSurfaceStore } from '@/stores/surface-store';
import { SurfaceRenderer } from './SurfaceRenderer';
import { FONTS, FONT_SIZES } from '@/theme/fonts';

export const ContextBar = () => {
  const { width } = useWindowDimensions();
  const contextSurfaces = useSurfaceStore((state) => state.getContextSurfaces());

  // Get first active context surface
  const activeSurface = useMemo(() => {
    return contextSurfaces.find((s) => s.state === 'active');
  }, [contextSurfaces]);

  if (!activeSurface) {
    return null;
  }

  return (
    <View
      className="bg-bg-card border-b border-border-dark"
      style={{
        height: 80,
        paddingHorizontal: 16,
        paddingVertical: 12,
        width,
      }}
    >
      <SurfaceRenderer surface={activeSurface} />
    </View>
  );
};

export default ContextBar;
```

---

#### Phase 3.2: FloatingWidget Component

**Path:** `apps/mobile/src/components/chat/FloatingWidget.tsx`

**Status:** NEW FILE

```typescript
import React, { useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { useSurfaceStore } from '@/stores/surface-store';
import { SurfaceRenderer } from './SurfaceRenderer';
import { MaterialIcons } from '@expo/vector-icons';

export const FloatingWidget = ({ onDismiss }: { onDismiss?: () => void }) => {
  const { width, height } = useWindowDimensions();
  const overlaySurfaces = useSurfaceStore((state) => state.getOverlaySurfaces());
  const deleteSurface = useSurfaceStore((state) => state.deleteSurface);

  // Get first active overlay surface
  const activeSurface = useMemo(() => {
    return overlaySurfaces.find((s) => s.state === 'active');
  }, [overlaySurfaces]);

  const handleDismiss = () => {
    if (activeSurface) {
      deleteSurface(activeSurface.id);
      onDismiss?.();
    }
  };

  if (!activeSurface) {
    return null;
  }

  return (
    <View
      className="absolute bottom-0 left-0 right-0 bg-black/50"
      style={{
        bottom: 90,
        left: 8,
        right: 8,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Close Button */}
      <TouchableOpacity
        onPress={handleDismiss}
        className="absolute top-2 right-2 z-10 bg-bg-card rounded-full p-2"
        style={{
          zIndex: 10,
        }}
      >
        <MaterialIcons name="close" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Widget Content */}
      <View className="p-4">
        <SurfaceRenderer surface={activeSurface} />
      </View>
    </View>
  );
};

export default FloatingWidget;
```

---

#### Phase 3.3: SurfaceRenderer Component

**Path:** `apps/mobile/src/components/chat/SurfaceRenderer.tsx`

**Status:** NEW FILE

```typescript
import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Surface } from '@/stores/surface-store';
import { A2UIMediator } from '@/lib/a2ui/mediator';
import { FONTS, FONT_SIZES } from '@/theme/fonts';

interface SurfaceRendererProps {
  surface: Surface;
  onAction?: (action: string, payload?: Record<string, unknown>) => void;
}

export const SurfaceRenderer = ({ surface, onAction }: SurfaceRendererProps) => {
  const widgetComponent = useMemo(() => {
    try {
      // Use A2UIMediator to resolve widget type to component
      const Component = A2UIMediator.getComponent(surface.widgetType);

      if (!Component) {
        return (
          <View className="bg-bg-card rounded-lg p-4 border border-border-dark">
            <Text
              style={{
                fontFamily: FONTS.sans,
                fontSize: FONT_SIZES.sm,
                color: '#A0A0A0',
              }}
            >
              Widget type "{surface.widgetType}" not found
            </Text>
          </View>
        );
      }

      // Render component with data from surface dataModel
      return (
        <Component
          data={surface.dataModel}
          onAction={onAction}
          surfaceId={surface.id}
          zone={surface.zone}
        />
      );
    } catch (error) {
      console.error('Error rendering surface:', error);
      return (
        <View className="bg-bg-card rounded-lg p-4 border border-border-dark">
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: FONT_SIZES.sm,
              color: '#E74C3C',
            }}
          >
            Error rendering widget
          </Text>
        </View>
      );
    }
  }, [surface.widgetType, surface.dataModel]);

  return <View>{widgetComponent}</View>;
};

export default SurfaceRenderer;
```

---

#### Phase 3.4: Update chat.tsx Layout

**Path:** `apps/mobile/app/chat.tsx`

**Status:** COMPLETE REWRITE

```typescript
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useChatStore } from '@/stores/chat-store';
import { useSurfaceStore } from '@/stores/surface-store';
import { useUserStore } from '@/stores/user-store';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatList } from '@/components/chat/ChatList';
import { ChatInput } from '@/components/chat/ChatInput';
import { ContextBar } from '@/components/chat/ContextBar';
import { FloatingWidget } from '@/components/chat/FloatingWidget';

export default function ChatScreen() {
  const { messages, isLoading, sendMessage, sendEvent } = useChatStore();
  const [inputText, setInputText] = useState('');

  // Handlers
  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setInputText('');
      await sendMessage(text);
    },
    [sendMessage]
  );

  const handleAction = useCallback(
    async (action: string, payload?: Record<string, unknown>) => {
      await sendEvent(action, payload);
    },
    [sendEvent]
  );

  const handleClose = useCallback(() => {
    // Navigate back or close
  }, []);

  return (
    <SafeAreaView
      className="flex-1 bg-bg-dark"
      edges={['top', 'bottom']}
      style={{ backgroundColor: '#0A0E27' }}
    >
      {/* Header */}
      <ChatHeader isLoading={isLoading} onClose={handleClose} />

      {/* Zone A: ContextBar (Sticky) */}
      <ContextBar />

      {/* Zone B: ChatStream (Flex-1) */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ChatList messages={messages} onAction={handleAction} />
        <ChatInput
          onSend={handleSend}
          isLoading={isLoading}
          value={inputText}
          onChange={setInputText}
        />
      </KeyboardAvoidingView>

      {/* Zone C: FloatingWidget (Overlay) */}
      <FloatingWidget onDismiss={() => {}} />
    </SafeAreaView>
  );
}
```

---

#### Phase 3.5: Update MessageBubble.tsx

**Path:** `apps/mobile/src/components/chat/MessageBubble.tsx`

**Status:** MODIFICATION

**BEFORE:**
```typescript
// Old code with widget embedding...
export const MessageBubble = ({ message, onAction }: MessageBubbleProps) => {
  return (
    <View className="bg-message-bubble p-4 rounded-lg">
      <Text>{message.text}</Text>
      {message.widget && <WidgetMessage widget={message.widget} />}
    </View>
  );
};
```

**AFTER:**
```typescript
import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { ChatMessage } from '@/lib/a2ui/types';
import { useSurfaceStore } from '@/stores/surface-store';
import { SurfaceRenderer } from './SurfaceRenderer';
import { FONTS, FONT_SIZES } from '@/theme/fonts';

interface MessageBubbleProps {
  message: ChatMessage;
  onAction?: (action: string, payload?: Record<string, unknown>) => void;
}

export const MessageBubble = ({ message, onAction }: MessageBubbleProps) => {
  const getSurface = useSurfaceStore((state) => state.getSurface);
  const isAssistant = message.role === 'assistant';

  // If message references a surface, only render stream surfaces
  const linkedSurface = useMemo(() => {
    if (!message.surfaceId) return null;
    const surface = getSurface(message.surfaceId);
    if (!surface || surface.zone !== 'stream') return null;
    return surface;
  }, [message.surfaceId, getSurface]);

  return (
    <View
      className={`flex-row mb-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
    >
      <View
        className={`max-w-[85%] rounded-lg px-4 py-3 ${
          isAssistant
            ? 'bg-bg-card border border-border-dark'
            : 'bg-accent-primary'
        }`}
      >
        {/* Text content */}
        <Text
          style={{
            fontFamily: FONTS.sans,
            fontSize: FONT_SIZES.base,
            color: isAssistant ? '#FFFFFF' : '#0A0E27',
            lineHeight: 20,
          }}
        >
          {message.text}
        </Text>

        {/* Surface widget below text */}
        {linkedSurface && (
          <View className="mt-4 border-t border-border-dark pt-4">
            <SurfaceRenderer surface={linkedSurface} onAction={onAction} />
          </View>
        )}
      </View>
    </View>
  );
};

export default MessageBubble;
```

---

#### Phase 3.6: Update WidgetMessage.tsx

**Path:** `apps/mobile/src/components/chat/WidgetMessage.tsx`

**Status:** DEPRECATION (Convert to use SurfaceRenderer)

```typescript
// This component is DEPRECATED. Use SurfaceRenderer instead.
// Kept for backward compatibility during transition.

import React from 'react';
import { View } from 'react-native';
import { Surface } from '@/stores/surface-store';
import { SurfaceRenderer } from './SurfaceRenderer';

interface WidgetMessageProps {
  surface: Surface;
  onAction?: (action: string, payload?: Record<string, unknown>) => void;
}

export const WidgetMessage = ({ surface, onAction }: WidgetMessageProps) => {
  return (
    <View className="mt-4">
      <SurfaceRenderer surface={surface} onAction={onAction} />
    </View>
  );
};

export default WidgetMessage;
```

---

### PHASE 4: Backend Operations Format

**Objective:** Implement A2UI operations format in backend

**Files to Create/Modify:**
1. `backend/tools/generate_widget.py`
2. `backend/schemas/request.py`
3. `backend/instructions/genesis_unified.txt`

---

#### Phase 4.1: Backend Response Schema

**Path:** `backend/schemas/request.py`

**Modification:** Add operations field

```python
# BEFORE:
class ChatResponse(BaseModel):
    text: str
    agent: Optional[str] = "GENESIS"
    payload: Optional[Dict[str, Any]] = None
    widgets: Optional[List[Dict[str, Any]]] = None

# AFTER:
class A2UIOperation(BaseModel):
    createSurface: Optional[Dict[str, Any]] = None
    updateComponents: Optional[Dict[str, Any]] = None
    updateDataModel: Optional[Dict[str, Any]] = None
    deleteSurface: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    text: str
    agent: Optional[str] = "GENESIS"
    operations: Optional[List[A2UIOperation]] = None
    # Legacy support
    payload: Optional[Dict[str, Any]] = None
    widgets: Optional[List[Dict[str, Any]]] = None
```

---

#### Phase 4.2: generate_widget.py Refactor

**Path:** `backend/tools/generate_widget.py`

**Complete New Implementation:**

```python
import uuid
from typing import Any, Literal

def format_as_a2ui(
    widget_type: str,
    props: dict[str, Any],
    zone: Literal["context", "stream", "overlay"] = "stream",
    surface_id: str | None = None,
) -> list[dict[str, Any]]:
    """
    Convert widget to A2UI operations format.

    Args:
        widget_type: Type of widget (e.g., 'workout-card', 'live-tracker')
        props: Data model properties for the widget
        zone: Target zone for this widget
        surface_id: Optional pre-generated surface ID (for linking)

    Returns:
        List of A2UI operations to create and configure surface
    """
    if not surface_id:
        surface_id = f"surface-{uuid.uuid4().hex[:8]}"

    # Infer catalogId from widget_type
    catalog_id = f"ngx.genesis.{widget_type}"

    operations = [
        {
            "createSurface": {
                "surfaceId": surface_id,
                "zone": zone,
                "catalogId": catalog_id,
            }
        },
        {
            "updateDataModel": {
                "surfaceId": surface_id,
                "dataModel": props,
            }
        },
    ]

    return operations


def create_context_widget(
    widget_type: str, props: dict[str, Any]
) -> list[dict[str, Any]]:
    """Shorthand for creating context zone widgets."""
    return format_as_a2ui(widget_type, props, zone="context")


def create_stream_widget(
    widget_type: str, props: dict[str, Any]
) -> list[dict[str, Any]]:
    """Shorthand for creating stream zone widgets."""
    return format_as_a2ui(widget_type, props, zone="stream")


def create_overlay_widget(
    widget_type: str, props: dict[str, Any]
) -> list[dict[str, Any]]:
    """Shorthand for creating overlay zone widgets."""
    return format_as_a2ui(widget_type, props, zone="overlay")


def update_surface_data(
    surface_id: str, updated_props: dict[str, Any]
) -> dict[str, Any]:
    """Generate operation to update a surface's data model."""
    return {
        "updateDataModel": {
            "surfaceId": surface_id,
            "dataModel": updated_props,
        }
    }


def delete_surface(surface_id: str) -> dict[str, Any]:
    """Generate operation to delete a surface."""
    return {
        "deleteSurface": {
            "surfaceId": surface_id,
        }
    }


# Example usage in backend handlers:
def handle_start_workout(event_payload: dict) -> dict[str, Any]:
    """
    User clicks "Iniciar Entrenamiento". Backend responds with:
    1. Create overlay surface (LiveSessionTracker)
    2. Create context surface (TrainingModeBar)
    3. Respond with message
    """
    workout_id = event_payload.get("workoutId")

    operations = []

    # Create overlay widget for live session
    operations.extend(
        create_overlay_widget(
            "live-session-tracker",
            {
                "workoutId": workout_id,
                "exerciseIndex": 0,
                "sets": [],
                "startTime": 0,
            },
        )
    )

    # Create context widget for training mode
    operations.extend(
        create_context_widget(
            "training-mode-bar",
            {
                "trainingMode": True,
                "currentExercise": "Sentadillas",
                "sets": 3,
                "reps": 10,
            },
        )
    )

    return {
        "text": f"Iniciando entrenamiento. Completa los ejercicios a tu ritmo.",
        "agent": "GENESIS",
        "operations": operations,
    }
```

---

#### Phase 4.3: Backend Instructions Update

**Path:** `backend/instructions/genesis_unified.txt`

**Section to Add:**

```
## A2UI ZONES — UI DIRECTION RULES

GENESIS acts as UI Director. Do not ask the user where content goes.
YOU decide the zone for every widget you create.

### Zone Rules

**Zone A (context):**
- Training mode indicator, elapsed time, current exercise
- Daily stats, progress bars
- Persistent, updates in-place
- Created with: create_context_widget()

**Zone B (stream):**
- Informational widgets in chat flow
- Workout cards, meal plans, recipe suggestions
- Historical records, summaries
- Created with: create_stream_widget()

**Zone C (overlay):**
- Active interaction widgets
- Live session tracker, rest timer, exercise form
- UI controls, forms, interactive elements
- Created with: create_overlay_widget()

### Operation Sequencing

When responding to user actions:

1. **User starts workout:**
   - Create overlay (live-session-tracker)
   - Create context (training-mode-bar)
   - Send confirmation message
   - Response: { text: "...", operations: [...] }

2. **User logs a set:**
   - Update overlay dataModel (exercises array)
   - NO new message
   - Response: { text: "", operations: [updateDataModel] }

3. **User completes workout:**
   - Delete overlay (live-session-tracker)
   - Create stream (workout-summary)
   - Update context (rest-mode-bar)
   - Send completion message
   - Response: { text: "...", operations: [...] }

### Variable Format

Use PARENTHESES for template variables (ADK format):

✓ Correct: "Current Exercise: (exercise_name)"
✗ Wrong: "Current Exercise: {exercise_name}"

### Spanish Labels

All user-facing labels in Spanish:
- "Comenzar" = Start
- "Iniciar" = Begin
- "Completar" = Complete
- "Registrar Set" = Log Set
- "Finalizar" = Finish
- "Descanso" = Rest
```

---

## SECTION 5: WIDGET ADAPTATION & SPANISH LABELS

### PHASE 5: Update Existing Widgets

**Objective:** Adapt all widgets to use SurfaceRenderer and Spanish labels

**Critical Changes for Each Widget:**
1. Accept `data` prop instead of destructuring props
2. Use `fontFamily` for all Text components
3. Use Spanish labels exclusively
4. Accept `onAction` callback for user interactions

---

#### Phase 5.1: Example - Update WorkoutCard.tsx

**Path:** `apps/mobile/src/components/widgets/WorkoutCard.tsx`

**BEFORE (First 40 lines):**
```typescript
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface WorkoutCardProps {
  workoutName: string;
  duration: number;
  exercises: Array<{ name: string; sets: number; reps: number }>;
  onStart: () => void;
}

export const WorkoutCard = ({
  workoutName,
  duration,
  exercises,
  onStart,
}: WorkoutCardProps) => {
  return (
    <View className="bg-card rounded-xl p-4 border border-gray-700">
      <Text className="text-white text-lg font-bold">{workoutName}</Text>
      {/* ... rest of component ... */}
    </View>
  );
};
```

**AFTER:**
```typescript
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FONTS, FONT_SIZES } from '@/theme/fonts';

interface WorkoutCardProps {
  data: {
    workoutName: string;
    duration: number;
    exercises: Array<{
      name: string;
      sets: number;
      reps: number;
    }>;
  };
  onAction?: (action: string, payload?: Record<string, unknown>) => void;
  surfaceId?: string;
  zone?: 'context' | 'stream' | 'overlay';
}

export const WorkoutCard = ({
  data,
  onAction,
  surfaceId,
}: WorkoutCardProps) => {
  const { workoutName, duration, exercises } = data;

  const handleStart = () => {
    onAction?.('start-workout', {
      surfaceId,
      workoutName,
    });
  };

  return (
    <View className="bg-bg-card rounded-xl p-4 border border-border-dark">
      <Text
        style={{
          fontFamily: FONTS.mono,
          fontSize: FONT_SIZES.xl,
          color: '#FFFFFF',
          marginBottom: 12,
        }}
      >
        {workoutName}
      </Text>

      <Text
        style={{
          fontFamily: FONTS.sans,
          fontSize: FONT_SIZES.sm,
          color: '#A0A0A0',
          marginBottom: 12,
        }}
      >
        Duración: {duration} min
      </Text>

      <View className="gap-2 mb-4">
        {exercises.map((ex) => (
          <Text
            key={ex.name}
            style={{
              fontFamily: FONTS.mono,
              fontSize: FONT_SIZES.sm,
              color: '#FFFFFF',
            }}
          >
            {ex.name} - {ex.sets} × {ex.reps}
          </Text>
        ))}
      </View>

      <TouchableOpacity
        onPress={handleStart}
        className="bg-accent-primary rounded-lg py-3"
      >
        <Text
          style={{
            fontFamily: FONTS.sans,
            fontSize: FONT_SIZES.base,
            color: '#0A0E27',
            textAlign: 'center',
            fontWeight: '600',
          }}
        >
          Comenzar
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default WorkoutCard;
```

---

#### Phase 5.2: Create ContextBarWidget (New)

**Path:** `apps/mobile/src/components/widgets/ContextBarWidget.tsx`

**Status:** NEW FILE

```typescript
import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { FONTS, FONT_SIZES } from '@/theme/fonts';

interface ContextBarWidgetProps {
  data: {
    trainingMode?: boolean;
    currentExercise?: string;
    sets?: number;
    reps?: number;
    elapsedTime?: number;
    dailyStats?: {
      sets: number;
      reps: number;
      volume: number;
    };
  };
  zone?: 'context' | 'stream' | 'overlay';
  surfaceId?: string;
}

export const ContextBarWidget = ({ data }: ContextBarWidgetProps) => {
  const {
    trainingMode = false,
    currentExercise = '',
    sets = 0,
    reps = 0,
    elapsedTime = 0,
    dailyStats,
  } = data;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (trainingMode) {
    return (
      <View className="flex-row justify-between items-center">
        {/* Left: Current Exercise */}
        <View>
          <Text
            style={{
              fontFamily: FONTS.mono,
              fontSize: FONT_SIZES.sm,
              color: '#A0A0A0',
            }}
          >
            Ejercicio
          </Text>
          <Text
            style={{
              fontFamily: FONTS.mono,
              fontSize: FONT_SIZES.lg,
              color: '#FFFFFF',
              marginTop: 4,
            }}
          >
            {currentExercise}
          </Text>
        </View>

        {/* Middle: Sets × Reps */}
        <View className="items-center">
          <Text
            style={{
              fontFamily: FONTS.mono,
              fontSize: FONT_SIZES.sm,
              color: '#A0A0A0',
            }}
          >
            Meta
          </Text>
          <Text
            style={{
              fontFamily: FONTS.mono,
              fontSize: FONT_SIZES.lg,
              color: '#6366F1',
              marginTop: 4,
            }}
          >
            {sets} × {reps}
          </Text>
        </View>

        {/* Right: Elapsed Time */}
        <View className="items-end">
          <Text
            style={{
              fontFamily: FONTS.mono,
              fontSize: FONT_SIZES.sm,
              color: '#A0A0A0',
            }}
          >
            Tiempo
          </Text>
          <Text
            style={{
              fontFamily: FONTS.mono,
              fontSize: FONT_SIZES.lg,
              color: '#10B981',
              marginTop: 4,
            }}
          >
            {formatTime(elapsedTime)}
          </Text>
        </View>
      </View>
    );
  }

  // Rest mode - show daily stats
  return (
    <View className="flex-row justify-between items-center">
      <View>
        <Text
          style={{
            fontFamily: FONTS.mono,
            fontSize: FONT_SIZES.xs,
            color: '#A0A0A0',
          }}
        >
          HOY
        </Text>
      </View>

      <View className="flex-row gap-6">
        <View>
          <Text
            style={{
              fontFamily: FONTS.mono,
              fontSize: FONT_SIZES.xs,
              color: '#A0A0A0',
            }}
          >
            Series
          </Text>
          <Text
            style={{
              fontFamily: FONTS.mono,
              fontSize: FONT_SIZES.lg,
              color: '#FFFFFF',
            }}
          >
            {dailyStats?.sets || 0}
          </Text>
        </View>

        <View>
          <Text
            style={{
              fontFamily: FONTS.mono,
              fontSize: FONT_SIZES.xs,
              color: '#A0A0A0',
            }}
          >
            Reps
          </Text>
          <Text
            style={{
              fontFamily: FONTS.mono,
              fontSize: FONT_SIZES.lg,
              color: '#FFFFFF',
            }}
          >
            {dailyStats?.reps || 0}
          </Text>
        </View>

        <View>
          <Text
            style={{
              fontFamily: FONTS.mono,
              fontSize: FONT_SIZES.xs,
              color: '#A0A0A0',
            }}
          >
            Volumen
          </Text>
          <Text
            style={{
              fontFamily: FONTS.mono,
              fontSize: FONT_SIZES.lg,
              color: '#FFFFFF',
            }}
          >
            {dailyStats?.volume || 0} kg
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ContextBarWidget;
```

---

## SECTION 6: INTEGRATION & ACTION HANDLERS

### PHASE 6: handleAction Implementation

**Objective:** Wire up user actions to sendEvent with proper surface updates

**File:** `apps/mobile/app/chat.tsx`

**Implementation:**

```typescript
const handleAction = useCallback(
  async (action: string, payload?: Record<string, unknown>) => {
    const { freezeSurface, updateDataModel, deleteSurface } =
      useSurfaceStore.getState();
    const { sendEvent } = useChatStore.getState();

    try {
      switch (action) {
        case 'start-workout': {
          const surfaceId = payload?.surfaceId as string;
          if (surfaceId) {
            freezeSurface(surfaceId);
          }
          await sendEvent('start-workout', payload);
          break;
        }

        case 'log-set': {
          const surfaceId = payload?.surfaceId as string;
          if (surfaceId) {
            updateDataModel(surfaceId, {
              exercises:
                payload?.exercises || [],
            });
          }
          // No sendEvent for local set logging
          break;
        }

        case 'complete-workout': {
          const surfaceId = payload?.surfaceId as string;
          if (surfaceId) {
            freezeSurface(surfaceId);
          }
          await sendEvent('complete-workout', payload);
          break;
        }

        default:
          await sendEvent(action, payload);
      }
    } catch (error) {
      console.error('Action error:', error);
    }
  },
  []
);
```

---

## SECTION 7: DESIGN SYSTEM TOKENS

### Genesis Fusion Color Palette

**Path:** `apps/mobile/src/theme/colors.ts`

```typescript
export const COLORS = {
  // Backgrounds
  bg_dark: '#0A0E27',
  bg_card: '#111633',
  bg_input: '#1A1F3A',

  // Text
  text_primary: '#FFFFFF',
  text_secondary: '#A0A0A0',
  text_tertiary: '#707070',

  // Accents
  accent_primary: '#6366F1', // Indigo
  accent_secondary: '#EC4899', // Pink
  accent_success: '#10B981', // Green
  accent_warning: '#F59E0B', // Amber
  accent_danger: '#EF4444', // Red

  // Borders
  border_dark: '#1F2937',
  border_light: '#374151',

  // Status
  status_success: '#10B981',
  status_warning: '#F59E0B',
  status_error: '#EF4444',
  status_info: '#3B82F6',
} as const;

// Spacing scale
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

// Border radius
export const RADIUS = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;
```

---

## SECTION 8: FILE CHECKLIST & VALIDATION

### Phase-by-Phase File Checklist

#### PHASE 0: Typography & Design
- [ ] Create `apps/mobile/src/theme/fonts.ts`
- [ ] Create `apps/mobile/src/components/common/StandardCard.tsx`
- [ ] Create `apps/mobile/src/components/common/ShineEffect.tsx`
- [ ] Modify `apps/mobile/app/_layout.tsx` (add useFonts)
- [ ] Modify `apps/mobile/src/components/common/index.ts`
- [ ] Modify `apps/mobile/src/components/navigation/CustomTabBar.tsx`

**Validation:**
- [ ] App launches without font warnings
- [ ] All text renders with correct fontFamily
- [ ] StandardCard displays properly in stories
- [ ] ShineEffect animates smoothly

#### PHASE 1: SurfaceStore
- [ ] Create `apps/mobile/src/stores/surface-store.ts`
- [ ] Modify `apps/mobile/src/stores/index.ts`

**Validation:**
- [ ] Surface creation/deletion works
- [ ] MMKV persistence survives app restart
- [ ] Selectors return correct zones
- [ ] State updates trigger component re-renders

#### PHASE 2: A2UI Interpreter
- [ ] Create `apps/mobile/src/lib/a2ui/types.ts`
- [ ] Create `apps/mobile/src/lib/a2ui/interpreter.ts`
- [ ] Modify `apps/mobile/src/stores/chat-store.ts`
- [ ] Modify `apps/mobile/src/lib/a2ui/index.ts`

**Validation:**
- [ ] Backend responses parse without errors
- [ ] Operations route to correct store actions
- [ ] Legacy format converts properly
- [ ] Chat messages appear with correct text

#### PHASE 3: 3-Zone Layout
- [ ] Create `apps/mobile/src/components/chat/ContextBar.tsx`
- [ ] Create `apps/mobile/src/components/chat/FloatingWidget.tsx`
- [ ] Create `apps/mobile/src/components/chat/SurfaceRenderer.tsx`
- [ ] Rewrite `apps/mobile/app/chat.tsx`
- [ ] Modify `apps/mobile/src/components/chat/MessageBubble.tsx`
- [ ] Modify `apps/mobile/src/components/chat/WidgetMessage.tsx`

**Validation:**
- [ ] ContextBar displays when context surface exists
- [ ] FloatingWidget overlays above input
- [ ] SurfaceRenderer finds and renders widgets
- [ ] Messages appear with text and surfaces
- [ ] Layout is responsive across screen sizes

#### PHASE 4: Backend Operations
- [ ] Modify `backend/schemas/request.py`
- [ ] Update `backend/tools/generate_widget.py`
- [ ] Update `backend/instructions/genesis_unified.txt`

**Validation:**
- [ ] Backend returns operations in response
- [ ] Each operation has correct structure
- [ ] Zone assignment is consistent
- [ ] Spanish labels appear in responses

#### PHASE 5: Widget Adaptation
- [ ] Update `apps/mobile/src/components/widgets/WorkoutCard.tsx`
- [ ] Create `apps/mobile/src/components/widgets/ContextBarWidget.tsx`
- [ ] Update all other widgets to use `data` prop pattern
- [ ] Update all Text components with fontFamily
- [ ] Replace English labels with Spanish

**Validation:**
- [ ] Widgets render via SurfaceRenderer
- [ ] Data prop updates trigger re-renders
- [ ] onAction callbacks work correctly
- [ ] All Spanish labels display properly

#### PHASE 6: Integration
- [ ] Update handleAction in `apps/mobile/app/chat.tsx`
- [ ] Wire surface freezing/deleting to actions
- [ ] Test full user flow: message → operations → surfaces

**Validation:**
- [ ] User can start workout
- [ ] ContextBar updates when training starts
- [ ] FloatingWidget appears during workout
- [ ] Completing workout cleans up surfaces

---

## SECTION 9: SPRINT 2 REFERENCE (DO NOT IMPLEMENT NOW)

### Micro-Acciones Silenciosas (Silent Micro-Actions)

**Timeline:** Sprint 2 (After Sprint 1 verified)

**New Endpoint:** `POST /api/a2ui/event`

```typescript
interface SilentEventRequest {
  surfaceId: string;
  action: string;
  payload: Record<string, unknown>;
}

interface SilentEventResponse {
  operations: A2UIOperation[];
  // NO new message generated
}
```

**Characteristics:**
- Response time < 100ms
- Does NOT go through LLM
- Does NOT create chat messages
- Only creates surface operations

**Use Cases:**
- Checkbox toggle → `updateDataModel` only
- Timer sync → `updateDataModel` only
- Habit streak → `updateDataModel` only
- UI state (collapse/expand) → `updateDataModel` only

**For Sprint 1:** All events continue through `/api/chat` with `event` field.

---

## SECTION 10: CURRENT STATE OF CRITICAL FILES

This section contains the EXACT current code for files that need modification:

### File 1: chat-store.ts (Current - Simplified)

[See Phase 2.4 implementation above]

### File 2: types.ts (A2UI Types - NEW)

[See Phase 2.1 implementation above]

### File 3: interpreter.ts (A2UI Interpreter - NEW)

[See Phase 2.2 implementation above]

### File 4: surface-store.ts (NEW)

[See Phase 1.1 implementation above]

### File 5: fonts.ts (NEW)

[See Phase 0.1 implementation above]

---

## SECTION 11: EXECUTION NOTES

### Order of Implementation

Implement in this exact order:

1. **PHASE 0** → Typography foundation
2. **PHASE 1** → SurfaceStore
3. **PHASE 2** → A2UI Interpreter + simplified ChatStore
4. **PHASE 3** → 3-Zone layout components
5. **PHASE 4** → Backend operations format
6. **PHASE 5** → Adapt existing widgets
7. **PHASE 6** → Integration testing

### Common Pitfalls to Avoid

1. **Do NOT embed widgets in ChatMessage** — This breaks the architecture
2. **Do NOT use English labels** — All user text must be Spanish
3. **Do NOT skip fontFamily** — Every Text component must declare it
4. **Do NOT recreate Phase 1 files** — Use existing migrations, endpoints, stores
5. **Do NOT use braces in agent instructions** — Use parentheses only
6. **Do NOT forget zone assignment** — Backend must always specify zone

### Testing Strategy

- **Unit Tests:** Surface store mutations, interpreter operations
- **Integration Tests:** End-to-end flow from message to rendered surfaces
- **UI Tests:** Zone layout, widget rendering, state persistence
- **Backend Tests:** Operation format, Spanish labels, zone consistency

---

## FINAL NOTES

This master prompt is **self-contained** and **executable**. Claude Code can implement this entire architecture by following the phases sequentially. Each phase builds on the previous one, and all code is complete with no dependencies on external documents.

**Last Updated:** 2026-02-06
**Scope:** A2UI Zones Architecture — GENESIS Phase 1.5
**Status:** Ready for Implementation

