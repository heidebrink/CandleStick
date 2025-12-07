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
}

export class SessionTracker {
  private events: any[] = [];
  private sessionId: string;
  private config: SessionTrackerConfig;
  private stopRecording?: () => void;
  private flushTimer?: number;
  private metadata: Record<string, any>;

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
  }

  stop() {
    if (this.stopRecording) {
      this.stopRecording();
    }
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }

  private async flush() {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      await fetch(`${this.config.apiEndpoint}/sessions/${this.sessionId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: eventsToSend,
          timestamp: Date.now(),
          metadata: this.metadata
        })
      });
    } catch (error) {
      console.error('Failed to send session events:', error);
      this.events.unshift(...eventsToSend);
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

export function init(config: SessionTrackerConfig): SessionTracker {
  const tracker = new SessionTracker(config);
  tracker.start();
  return tracker;
}
