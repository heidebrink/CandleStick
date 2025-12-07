import { useEffect, useState } from 'react';

export default function TestPage() {
  const [sessionId, setSessionId] = useState<string>('');
  const [isTracking, setIsTracking] = useState(false);
  const [counter, setCounter] = useState(0);
  const [text, setText] = useState('');

  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/session-tracker.umd.js';
    script.onload = () => {
      // @ts-ignore
      const tracker = window.SessionTracker.init({
        apiEndpoint: '/api',
        userId: 'demo-user-123',
        userName: 'Demo User',
        userEmail: 'demo@example.com'
      });
      setSessionId(tracker.getSessionId());
      setIsTracking(true);
    };
    script.onerror = () => {
      console.error('Failed to load session tracker SDK');
      setIsTracking(false);
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
        <h2>Test Session Tracking</h2>
        {isTracking ? (
          <div className="tracking-status">
            <span className="status-indicator active"></span>
            <span>Recording Session: {sessionId}</span>
          </div>
        ) : (
          <div className="tracking-status">
            <span className="status-indicator"></span>
            <span>Initializing...</span>
          </div>
        )}
      </div>

      <div className="test-controls">
        <div className="control-group">
          <h3>Interactive Elements</h3>
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
        <h3>Instructions</h3>
        <ol>
          <li>Interact with the elements above</li>
          <li>Your actions are being recorded</li>
          <li>Switch to "View Sessions" to see the replay</li>
          <li>Select your session ID to watch the recording</li>
        </ol>
      </div>
    </div>
  );
}
