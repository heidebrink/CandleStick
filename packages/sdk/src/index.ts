import { record } from 'rrweb';

export interface SessionTrackerConfig {
  apiEndpoint: string;
  sessionId?: string;
  flushInterval?: number;
  sessionTimeout?: number; // Minutes of inactivity before new session
  userId?: string;
  userEmail?: string;
  userName?: string;
  appName?: string;
  metadata?: Record<string, any>;
  onError?: (error: Error) => void;
  optIn?: boolean;
  showWidget?: boolean;
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
  private isTracking: boolean = false;
  private widget?: HTMLElement;

  constructor(config: SessionTrackerConfig) {
    this.config = {
      flushInterval: 5000,
      sessionTimeout: 30, // Default 30 minutes
      showWidget: config.optIn || false,
      ...config
    };
    
    // Try to restore existing session or create new one
    this.sessionId = this.getOrCreateSessionId();
    
    this.metadata = {
      userId: config.userId,
      userEmail: config.userEmail,
      userName: config.userName,
      appName: config.appName,
      optInMode: config.optIn || false,
      ...config.metadata,
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timestamp: Date.now()
    };

    // Show widget if opt-in mode
    if (this.config.showWidget) {
      this.createWidget();
    }
  }

  private getOrCreateSessionId(): string {
    const STORAGE_KEY = 'candlestick_session';
    const TIMESTAMP_KEY = 'candlestick_session_timestamp';
    
    try {
      const storedSessionId = localStorage.getItem(STORAGE_KEY);
      const storedTimestamp = localStorage.getItem(TIMESTAMP_KEY);
      
      if (storedSessionId && storedTimestamp) {
        const lastActivity = parseInt(storedTimestamp, 10);
        const now = Date.now();
        const timeoutMs = (this.config.sessionTimeout || 30) * 60 * 1000;
        
        // Check if session is still valid (within timeout)
        if (now - lastActivity < timeoutMs) {
          // Update timestamp for this page load
          localStorage.setItem(TIMESTAMP_KEY, now.toString());
          console.log('CandleStick: Resuming session', storedSessionId);
          return storedSessionId;
        } else {
          console.log('CandleStick: Session expired, creating new session');
        }
      }
      
      // Create new session
      const newSessionId = this.config.sessionId || this.generateSessionId();
      localStorage.setItem(STORAGE_KEY, newSessionId);
      localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
      console.log('CandleStick: New session created', newSessionId);
      return newSessionId;
    } catch (error) {
      // If localStorage is not available, just generate a new session
      console.warn('CandleStick: localStorage not available, using ephemeral session');
      return this.config.sessionId || this.generateSessionId();
    }
  }

  private updateSessionTimestamp() {
    const TIMESTAMP_KEY = 'candlestick_session_timestamp';
    try {
      localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      // Silently fail if localStorage is not available
    }
  }

  start() {
    // Don't auto-start if opt-in mode is enabled
    if (this.config.optIn && !this.isTracking) {
      return;
    }

    try {
      this.stopRecording = record({
        emit: (event) => {
          this.events.push(event);
          // Update session timestamp on user activity
          this.updateSessionTimestamp();
        },
        checkoutEveryNms: 30000
      });

      this.flushTimer = window.setInterval(() => {
        this.flush();
      }, this.config.flushInterval);

      window.addEventListener('beforeunload', () => {
        this.flush();
        // Don't clear session on unload - let timeout handle it
      });
      
      this.isTracking = true;
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
      
      // Clear session from storage when explicitly stopped
      this.clearSession();
    } catch (error) {
      // Silently fail
      console.warn('CandleStick: Failed to stop recording', error);
    }
  }

  private clearSession() {
    const STORAGE_KEY = 'candlestick_session';
    const TIMESTAMP_KEY = 'candlestick_session_timestamp';
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TIMESTAMP_KEY);
      console.log('CandleStick: Session cleared');
    } catch (error) {
      // Silently fail
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

  isRecording(): boolean {
    return this.isTracking;
  }

  private createWidget() {
    // Create widget container
    this.widget = document.createElement('div');
    this.widget.id = 'candlestick-widget';
    this.widget.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      cursor: pointer;
      z-index: 999999;
      transition: all 0.3s ease;
      filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
    `;

    // Create SVG candle
    this.widget.innerHTML = `
      <svg width="60" height="60" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="flame-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#ff6b00;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#ff0080;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#8000ff;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="candle-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0f0f1e;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Flame -->
        <path d="M50 10 C45 15, 40 20, 40 28 C40 35, 45 40, 50 40 C55 40, 60 35, 60 28 C60 20, 55 15, 50 10 Z" 
              fill="url(#flame-grad)" opacity="0.3" id="flame">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
        </path>
        
        <!-- Candle body -->
        <rect x="35" y="35" width="30" height="45" rx="3" 
              fill="url(#candle-grad)" stroke="#00d4ff" stroke-width="2"/>
        
        <!-- Eyes -->
        <circle cx="42" cy="52" r="3" fill="#00d4ff" opacity="0.5" class="eye"/>
        <circle cx="58" cy="52" r="3" fill="#00d4ff" opacity="0.5" class="eye"/>
        
        <!-- Smile -->
        <path d="M 42 62 Q 50 68, 58 62" stroke="#00d4ff" stroke-width="2" 
              fill="none" stroke-linecap="round" opacity="0.5" class="smile"/>
        
        <!-- Base -->
        <ellipse cx="50" cy="85" rx="20" ry="5" fill="#2a2a3e" stroke="#00d4ff" stroke-width="1"/>
      </svg>
    `;

    // Add click handler
    this.widget.addEventListener('click', () => this.toggleTracking());

    // Add hover effect
    this.widget.addEventListener('mouseenter', () => {
      this.widget!.style.transform = 'scale(1.1)';
    });
    this.widget.addEventListener('mouseleave', () => {
      this.widget!.style.transform = 'scale(1)';
    });

    document.body.appendChild(this.widget);
    this.updateWidgetState();
  }

  private updateWidgetState() {
    if (!this.widget) return;

    const flame = this.widget.querySelector('#flame');
    const eyes = this.widget.querySelectorAll('.eye');
    const smile = this.widget.querySelector('.smile');

    if (this.isTracking) {
      // Active state - bright and animated
      if (flame) (flame as SVGElement).style.opacity = '1';
      eyes.forEach(eye => (eye as SVGElement).style.opacity = '1');
      if (smile) (smile as SVGElement).style.opacity = '1';
      this.widget.title = 'Recording session - Click to stop';
    } else {
      // Inactive state - dimmed
      if (flame) (flame as SVGElement).style.opacity = '0.3';
      eyes.forEach(eye => (eye as SVGElement).style.opacity = '0.3');
      if (smile) (smile as SVGElement).style.opacity = '0.3';
      this.widget.title = 'Not recording - Click to start';
    }
  }

  private toggleTracking() {
    if (this.isTracking) {
      this.pauseTracking();
    } else {
      this.resumeTracking();
    }
  }

  private pauseTracking() {
    if (!this.isTracking) return;
    
    try {
      if (this.stopRecording) {
        this.stopRecording();
        this.stopRecording = undefined;
      }
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
        this.flushTimer = undefined;
      }
      this.flush(); // Send remaining events
      this.isTracking = false;
      this.updateWidgetState();
    } catch (error) {
      console.warn('CandleStick: Failed to pause tracking', error);
    }
  }

  private resumeTracking() {
    if (this.isTracking) return;
    
    this.start();
    this.isTracking = true;
    this.updateWidgetState();
  }

  removeWidget() {
    if (this.widget && this.widget.parentNode) {
      this.widget.parentNode.removeChild(this.widget);
      this.widget = undefined;
    }
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
