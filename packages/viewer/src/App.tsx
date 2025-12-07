import { useState, useEffect } from 'react';
import SessionList from './components/SessionList';
import SessionPlayer from './components/SessionPlayer';
import TestPage from './components/TestPage';
import './App.css';

interface Session {
  id: string;
  startTime: number;
  eventCount: number;
  userId?: string;
  userEmail?: string;
  userName?: string;
  userAgent?: string;
  screenResolution?: string;
}

function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [view, setView] = useState<'viewer' | 'test'>('viewer');

  useEffect(() => {
    if (view === 'viewer') {
      fetchSessions();
    }
  }, [view]);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions');
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Session Tracker</h1>
        <nav>
          <button 
            className={view === 'viewer' ? 'active' : ''}
            onClick={() => setView('viewer')}
          >
            View Sessions
          </button>
          <button 
            className={view === 'test' ? 'active' : ''}
            onClick={() => setView('test')}
          >
            Test Tracking
          </button>
        </nav>
      </header>

      <main className="main">
        {view === 'viewer' ? (
          <div className="viewer-layout">
            <aside className="sidebar">
              <SessionList 
                sessions={sessions}
                selectedSession={selectedSession}
                onSelectSession={setSelectedSession}
                onRefresh={fetchSessions}
              />
            </aside>
            <div className="content">
              {selectedSession ? (
                <SessionPlayer sessionId={selectedSession} />
              ) : (
                <div className="empty-state">
                  Select a session to view replay
                </div>
              )}
            </div>
          </div>
        ) : (
          <TestPage />
        )}
      </main>
    </div>
  );
}

export default App;
