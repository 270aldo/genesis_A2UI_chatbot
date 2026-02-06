import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../lib/mmkv';

export type SurfaceZone = 'context' | 'stream' | 'overlay';
export type SurfaceState = 'active' | 'frozen' | 'dismissed';

export interface Surface {
  id: string;
  zone: SurfaceZone;
  widgetType: string;
  dataModel: Record<string, unknown>;
  state: SurfaceState;
  linkedMessageId?: string;
  createdAt: number;
  updatedAt: number;
}

interface SurfaceStoreState {
  surfaces: Record<string, Surface>;

  // CRUD
  createSurface: (
    id: string,
    zone: SurfaceZone,
    widgetType: string,
    dataModel?: Record<string, unknown>,
    linkedMessageId?: string,
  ) => void;
  updateComponents: (surfaceId: string, newWidgetType: string) => void;
  updateDataModel: (surfaceId: string, dataModel: Record<string, unknown>) => void;
  deleteSurface: (surfaceId: string) => void;

  // Lifecycle
  freezeSurface: (surfaceId: string) => void;
  resumeSurface: (surfaceId: string) => void;
  clearZone: (zone: SurfaceZone) => void;
  clearAll: () => void;

  // Selectors
  getSurface: (id: string) => Surface | undefined;
  getContextSurfaces: () => Surface[];
  getStreamSurfaces: () => Surface[];
  getOverlaySurfaces: () => Surface[];
  getActiveSurfaces: (zone?: SurfaceZone) => Surface[];
}

const filterByZone = (surfaces: Record<string, Surface>, zone: SurfaceZone): Surface[] =>
  Object.values(surfaces).filter(
    (s) => s.zone === zone && s.state !== 'dismissed',
  );

export const useSurfaceStore = create<SurfaceStoreState>()(
  persist(
    (set, get) => ({
      surfaces: {},

      createSurface: (id, zone, widgetType, dataModel = {}, linkedMessageId) => {
        const now = Date.now();
        set((state) => ({
          surfaces: {
            ...state.surfaces,
            [id]: {
              id,
              zone,
              widgetType,
              dataModel,
              state: 'active',
              linkedMessageId,
              createdAt: now,
              updatedAt: now,
            },
          },
        }));
      },

      updateComponents: (surfaceId, newWidgetType) => {
        set((state) => {
          const surface = state.surfaces[surfaceId];
          if (!surface) return state;
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

      updateDataModel: (surfaceId, dataModel) => {
        set((state) => {
          const surface = state.surfaces[surfaceId];
          if (!surface) return state;
          return {
            surfaces: {
              ...state.surfaces,
              [surfaceId]: {
                ...surface,
                dataModel: { ...surface.dataModel, ...dataModel },
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      deleteSurface: (surfaceId) => {
        set((state) => {
          const { [surfaceId]: _, ...rest } = state.surfaces;
          return { surfaces: rest };
        });
      },

      freezeSurface: (surfaceId) => {
        set((state) => {
          const surface = state.surfaces[surfaceId];
          if (!surface) return state;
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

      resumeSurface: (surfaceId) => {
        set((state) => {
          const surface = state.surfaces[surfaceId];
          if (!surface) return state;
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

      clearZone: (zone) => {
        set((state) => {
          const remaining: Record<string, Surface> = {};
          for (const [id, surface] of Object.entries(state.surfaces)) {
            if (surface.zone !== zone) {
              remaining[id] = surface;
            }
          }
          return { surfaces: remaining };
        });
      },

      clearAll: () => {
        set({ surfaces: {} });
      },

      // Selectors
      getSurface: (id) => get().surfaces[id],

      getContextSurfaces: () => filterByZone(get().surfaces, 'context'),

      getStreamSurfaces: () => filterByZone(get().surfaces, 'stream'),

      getOverlaySurfaces: () => filterByZone(get().surfaces, 'overlay'),

      getActiveSurfaces: (zone) => {
        const all = Object.values(get().surfaces).filter(
          (s) => s.state === 'active',
        );
        return zone ? all.filter((s) => s.zone === zone) : all;
      },
    }),
    {
      name: 'surface-store',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => {
        const persisted: Record<string, Surface> = {};
        for (const [id, surface] of Object.entries(state.surfaces)) {
          if (surface.state !== 'dismissed') {
            persisted[id] = surface;
          }
        }
        return { surfaces: persisted };
      },
    },
  ),
);
