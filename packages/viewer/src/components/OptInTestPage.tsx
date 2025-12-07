import { useEffect, useState } from 'react';

export default function OptInTestPage() {
  const [sessionId, setSessionId] = useState<string>('');
  const [isTracking, setIsTracking] = useState(false);
  const [counter, setCounter] = useState(0);
  const [text, setText] = useState('');
  const [tracker, setTracker] = useState<any>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/session-tracker.umd.js';
    script.onload = () => {
      // @ts-ignore
      const trackerInstance = window.SessionTracker.init({
        apiEndpoint: '/api',
        userId: 'opt-in-demo-user',
        userName: 'Opt-In Demo User',
        userEmail: 'optin@example.com',
        appName: 'CandleStick Opt-In Demo',
        optIn: true,  // Enable opt-in mode
        showWidget: true  // Show the widget
      });
      
      if (trackerInstance) {
        setSessionId(trackerInstance.getSessionId());
        setTracker(trackerInstance);
        
        // Check tracking status periodically
        const interval = setInterval(() => {
          setIsTracking(trackerInstance.isRecording());
        }, 500);
        
        return () => clearInterval(interval);
      }
    };
    script.onerror = () => {
      console.error('Failed to load session tracker SDK');
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="test-page">
      <div className="test-info">
        <h2>🕯️ Opt-In Mode Test</h2>
        <div className="opt-in-status">
          <div className="status-box">
            <strong>Session ID:</strong> {sessionId || 'Loading...'}
          </div>
          <div className={`status-box ${isTracking ? 'recording' : 'paused'}`}>
            <strong>Status:</strong> {isTracking ? '🔴 Recording' : '⚪ Not Recording'}
          </div>
        </div>
        <div className="opt-in-instructions">
          <p>
            👉 <strong>Look at the bottom-right corner!</strong> Click the candle icon to start/stop tracking.
          </p>
          <ul>
            <li>🕯️ <strong>Bright candle</strong> = Recording your session</li>
            <li>🕯️ <strong>Dim candle</strong> = Not recording (privacy mode)</li>
            <li>Click the candle to toggle tracking on/off</li>
          </ul>
        </div>
      </div>

      <div className="test-controls">
        <div className="control-group">
          <h3>Interactive Elements</h3>
          <p className="hint">Try these while tracking is ON and OFF</p>
          <button onClick={() => setCounter(counter + 1)}>
            Clicked {counter} times
          </button>
          <input
            type="text"
            placeholder="Type something..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <select onChange={(e) => console.log('Selected:', e.target.value)}>
            <option>Option 1</option>
            <option>Option 2</option>
            <option>Option 3</option>
          </select>
        </div>

        <div className="control-group">
          <h3>Form Elements</h3>
          <label>
            <input type="checkbox" /> Checkbox
          </label>
          <label>
            <input type="radio" name="radio" /> Radio 1
          </label>
          <label>
            <input type="radio" name="radio" /> Radio 2
          </label>
        </div>

        <div className="control-group">
          <h3>Dynamic Content</h3>
          <button onClick={() => {
            const div = document.createElement('div');
            div.textContent = `New element ${Date.now()}`;
            div.style.padding = '10px';
            div.style.margin = '5px';
            div.style.background = '#f0f0f0';
            document.querySelector('.dynamic-content')?.appendChild(div);
          }}>
            Add Element
          </button>
          <div className="dynamic-content"></div>
        </div>
      </div>

      <div className="test-instructions">
        <h3>How to Test Opt-In Mode</h3>
        <ol>
          <li><strong>Notice the candle is dim</strong> - Tracking is OFF by default</li>
          <li><strong>Interact with elements above</strong> - These actions are NOT being recorded</li>
          <li><strong>Click the candle icon</strong> (bottom-right) - It lights up!</li>
          <li><strong>Now interact again</strong> - These actions ARE being recorded</li>
          <li><strong>Click candle again</strong> - Recording stops, candle dims</li>
          <li><strong>Go to "View Sessions"</strong> - See only the recorded portions</li>
        </ol>
        
        <div className="privacy-note">
          <strong>🔒 Privacy First:</strong> In opt-in mode, users must explicitly enable tracking. 
          This is perfect for compliance with privacy regulations (GDPR, CCPA) and respecting user consent.
        </div>
      </div>
    </div>
  );
}
