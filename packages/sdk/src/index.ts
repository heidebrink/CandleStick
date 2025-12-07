import { record } from 'rrweb';

export interface SessionTrackerConfig {
  apiEndpoint: string;
  sessionId?: string;
  flushInterval?: number;
  userId?: string;
  userEmail?: string;
  userName?: string;
  appName?: string;
  metadata?: Record<string, any>;
  onError?: (error: Error) => void;
}

export class SessionTracker {
  private events: any[] = [];
  private sessionId: string;
  private config: SessionTrackerConfig;
  private stopRecording?: () => void;
  private flushTimer?: number;
  private metadata: Record<string, any>;
  private failureCount: number = 0;
  private maxFailures: number = 3;

  constructor(config: SessionTrackerConfig) {
    this.config = {
      flushInterval: 5000,
      ...config
    };
    this.sessionId = config.sessionId || this.generateSessionId();
    this.metadata = {
      userId: config.userId,
      userEmail: config.userEmail,
      userName: config.userName,
      appName: config.appName,
      ...config.metadata,
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timestamp: Date.now()
    };
  }

  start() {
    try {
      this.stopRecording = record({
        emit: (event) => {
          this.events.push(event);
        },
        checkoutEveryNms: 30000
      });

      this.flushTimer = window.setInterval(() => {
        this.flush();
      }, this.config.flushInterval);

      window.addEventListener('beforeunload', () => this.flush());
    } catch (error) {
      // Silently fail - never block the user's experience
      console.warn('CandleStick: Failed to start recording', error);
    }
  }

  stop() {
    try {
      if (this.stopRecording) {
        this.stopRecording();
      }
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
      }
      this.flush();
    } catch (error) {
      // Silently fail
      console.warn('CandleStick: Failed to stop recording', error);
    }
  }

  private async flush() {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      // Use fetch with timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${this.config.apiEndpoint}/sessions/${this.sessionId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: eventsToSend,
          timestamp: Date.now(),
          metadata: this.metadata
        }),
        signal: controller.signal,
        // Don't send credentials to avoid CORS issues
        credentials: 'omit'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      this.failureCount++;
      
      // Silently fail - never block the user
      // Only log in development
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.warn('CandleStick: Failed to send events', error);
      }
      
      // Call custom error handler if provided
      if (this.config.onError && error instanceof Error) {
        try {
          this.config.onError(error);
        } catch (e) {
          // Ignore errors in error handler
        }
      }
      
      // Keep events for retry, but limit queue size to prevent memory issues
      if (this.events.length < 1000 && this.failureCount < this.maxFailures) {
        this.events.unshift(...eventsToSend);
      } else if (this.failureCount >= this.maxFailures) {
        // Stop trying after max failures to avoid wasting resources
        this.events = [];
      }
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

export function init(config: SessionTrackerConfig): SessionTracker | null {
  try {
    const tracker = new SessionTracker(config);
    tracker.start();
    return tracker;
  } catch (error) {
    // Silently fail - never block the user's application
    console.warn('CandleStick: Failed to initialize', error);
    return null;
  }
}
