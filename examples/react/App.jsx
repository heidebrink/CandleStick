import { useEffect, useState } from 'react';

function App() {
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    // Load the SDK script
    const script = document.createElement('script');
    script.src = 'http://localhost:5173/session-tracker.umd.js';
    script.onload = () => {
      const tracker = window.SessionTracker.init({
        apiEndpoint: 'http://localhost:3001/api'
      });
      setSessionId(tracker.getSessionId());
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div>
      <h1>React App with Session Tracking</h1>
      {sessionId && <p>Session ID: {sessionId}</p>}
      <button onClick={() => alert('Clicked!')}>Test Button</button>
    </div>
  );
}

export default App;
