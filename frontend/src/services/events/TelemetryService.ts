/**
 * NGX GENESIS A2UI - Telemetry Service
 *
 * Escucha eventos del EventBus y los envía a:
 * 1. Backend API (POST /api/events) - Para procesamiento inmediato
 * 2. Supabase (widget_events table) - Para persistencia y analytics
 *
 * Features:
 * - Batching: Agrupa eventos para reducir requests
 * - Retry: Reintenta envíos fallidos con backoff exponencial
 * - Offline queue: Guarda eventos en localStorage si no hay conexión
 * - Sampling: Puede samplear eventos de bajo valor para reducir volumen
 */

import { eventBus, BaseEvent, EventCategory } from './EventBus';

// ============================================
// CONFIGURATION
// ============================================

export interface TelemetryConfig {
  // Endpoints
  apiEndpoint: string;           // Backend API URL
  supabaseUrl?: string;          // Supabase project URL
  supabaseAnonKey?: string;      // Supabase anon key

  // Batching
  batchSize: number;             // Max events per batch (default: 10)
  batchIntervalMs: number;       // Max wait before sending (default: 5000)

  // Retry
  maxRetries: number;            // Max retry attempts (default: 3)
  retryDelayMs: number;          // Initial retry delay (default: 1000)

  // Sampling (0-1, 1 = send all)
  sampleRates: Partial<Record<EventCategory, number>>;

  // Debug
  debug: boolean;                // Log events to console
  enabled: boolean;              // Enable/disable telemetry
}

const DEFAULT_CONFIG: TelemetryConfig = {
  apiEndpoint: '/api/events',
  batchSize: 10,
  batchIntervalMs: 5000,
  maxRetries: 3,
  retryDelayMs: 1000,
  sampleRates: {
    widget: 1,
    session: 1,
    user: 1,
    navigation: 0.5,   // Sample 50% of navigation events
    error: 1,
    performance: 0.1,  // Sample 10% of performance events
    ai: 1,
  },
  debug: false,
  enabled: true,
};

// ============================================
// OFFLINE STORAGE
// ============================================

const STORAGE_KEY = 'ngx_telemetry_queue';

function saveToStorage(events: BaseEvent[]): void {
  try {
    const existing = loadFromStorage();
    const combined = [...existing, ...events].slice(-100); // Keep last 100
    localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
  } catch (e) {
    console.warn('[Telemetry] Failed to save to localStorage:', e);
  }
}

function loadFromStorage(): BaseEvent[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

// ============================================
// TELEMETRY SERVICE CLASS
// ============================================

export class TelemetryService {
  private config: TelemetryConfig;
  private eventQueue: BaseEvent[] = [];
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private unsubscribe: (() => void) | null = null;
  private isOnline = true;
  private retryQueue: BaseEvent[] = [];

  constructor(config: Partial<TelemetryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Check online status
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  // ==========================================
  // LIFECYCLE
  // ==========================================

  /**
   * Start listening to events
   */
  start(): void {
    if (!this.config.enabled) {
      console.log('[Telemetry] Disabled, not starting');
      return;
    }

    // Load any queued events from storage
    const storedEvents = loadFromStorage();
    if (storedEvents.length > 0) {
      this.eventQueue.push(...storedEvents);
      clearStorage();
      if (this.config.debug) {
        console.log(`[Telemetry] Loaded ${storedEvents.length} events from storage`);
      }
    }

    // Subscribe to all events
    this.unsubscribe = eventBus.onAll(this.handleEvent);

    if (this.config.debug) {
      console.log('[Telemetry] Started');
    }
  }

  /**
   * Stop listening and flush remaining events
   */
  async stop(): Promise<void> {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Flush remaining events
    if (this.eventQueue.length > 0) {
      await this.flush();
    }

    // Save any remaining to storage
    if (this.retryQueue.length > 0) {
      saveToStorage(this.retryQueue);
    }

    if (this.config.debug) {
      console.log('[Telemetry] Stopped');
    }
  }

  // ==========================================
  // EVENT HANDLING
  // ==========================================

  private handleEvent = (event: BaseEvent): void => {
    // Check sampling
    const sampleRate = this.config.sampleRates[event.category] ?? 1;
    if (Math.random() > sampleRate) {
      return; // Skip this event
    }

    if (this.config.debug) {
      console.log('[Telemetry] Event:', event.eventType, event);
    }

    this.eventQueue.push(event);

    // Check if we should send immediately
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    } else if (!this.batchTimer) {
      // Schedule batch send
      this.batchTimer = setTimeout(() => {
        this.batchTimer = null;
        this.flush();
      }, this.config.batchIntervalMs);
    }
  };

  // ==========================================
  // SENDING
  // ==========================================

  /**
   * Send all queued events
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    if (!this.isOnline) {
      saveToStorage(events);
      if (this.config.debug) {
        console.log('[Telemetry] Offline, saved to storage');
      }
      return;
    }

    try {
      await this.sendBatch(events);
    } catch (error) {
      console.error('[Telemetry] Failed to send:', error);
      this.retryQueue.push(...events);
      this.scheduleRetry();
    }
  }

  private async sendBatch(events: BaseEvent[]): Promise<void> {
    const response = await fetch(this.config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (this.config.debug) {
      console.log(`[Telemetry] Sent ${events.length} events`);
    }
  }

  // ==========================================
  // RETRY LOGIC
  // ==========================================

  private retryAttempt = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  private scheduleRetry(): void {
    if (this.retryTimer) return;
    if (this.retryAttempt >= this.config.maxRetries) {
      // Give up, save to storage
      saveToStorage(this.retryQueue);
      this.retryQueue = [];
      this.retryAttempt = 0;
      return;
    }

    const delay = this.config.retryDelayMs * Math.pow(2, this.retryAttempt);
    this.retryAttempt++;

    this.retryTimer = setTimeout(async () => {
      this.retryTimer = null;

      if (!this.isOnline || this.retryQueue.length === 0) {
        return;
      }

      const events = [...this.retryQueue];
      this.retryQueue = [];

      try {
        await this.sendBatch(events);
        this.retryAttempt = 0; // Reset on success
      } catch {
        this.retryQueue.push(...events);
        this.scheduleRetry();
      }
    }, delay);
  }

  // ==========================================
  // ONLINE/OFFLINE HANDLING
  // ==========================================

  private handleOnline = (): void => {
    this.isOnline = true;
    if (this.config.debug) {
      console.log('[Telemetry] Online');
    }

    // Load from storage and send
    const storedEvents = loadFromStorage();
    if (storedEvents.length > 0) {
      clearStorage();
      this.eventQueue.push(...storedEvents);
      this.flush();
    }

    // Retry failed events
    if (this.retryQueue.length > 0) {
      this.scheduleRetry();
    }
  };

  private handleOffline = (): void => {
    this.isOnline = false;
    if (this.config.debug) {
      console.log('[Telemetry] Offline');
    }
  };

  // ==========================================
  // CONFIGURATION
  // ==========================================

  /**
   * Update configuration
   */
  configure(config: Partial<TelemetryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Enable/disable telemetry
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Set debug mode
   */
  setDebug(debug: boolean): void {
    this.config.debug = debug;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

// Determine API endpoint based on environment
const apiUrl = typeof window !== 'undefined' && import.meta?.env?.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:8000';

export const telemetryService = new TelemetryService({
  apiEndpoint: `${apiUrl}/api/events`,
  debug: typeof window !== 'undefined' && import.meta?.env?.DEV === true,
});

// ============================================
// REACT HOOK
// ============================================

import { useEffect } from 'react';

/**
 * Hook to initialize telemetry service
 */
export function useTelemetry(config?: Partial<TelemetryConfig>): void {
  useEffect(() => {
    if (config) {
      telemetryService.configure(config);
    }
    telemetryService.start();

    return () => {
      telemetryService.stop();
    };
  }, []);
}

/**
 * Hook to track screen views
 */
export function useScreenTracking(screenName: string): void {
  useEffect(() => {
    eventBus.emit({
      eventType: 'screen_view',
      category: 'navigation',
      properties: {
        screenName,
      },
    });
  }, [screenName]);
}
