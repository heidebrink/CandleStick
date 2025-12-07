import { useState, useMemo } from 'react';

interface Session {
  id: string;
  startTime: number;
  eventCount: number;
  userId?: string;
  userEmail?: string;
  userName?: string;
  appName?: string;
  optInMode?: boolean;
  userAgent?: string;
  screenResolution?: string;
}

interface Props {
  sessions: Session[];
  selectedSession: string | null;
  onSelectSession: (id: string) => void;
  onRefresh: () => void;
}

export default function SessionList({ sessions, selectedSession, onSelectSession, onRefresh }: Props) {
  const [userFilter, setUserFilter] = useState('');
  const [appFilter, setAppFilter] = useState('');

  // Get unique apps for filter dropdown
  const uniqueApps = useMemo(() => {
    const apps = new Set(sessions.map(s => s.appName).filter(Boolean));
    return Array.from(apps).sort();
  }, [sessions]);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      const matchesUser = !userFilter || 
        session.userName?.toLowerCase().includes(userFilter.toLowerCase()) ||
        session.userEmail?.toLowerCase().includes(userFilter.toLowerCase()) ||
        session.userId?.toLowerCase().includes(userFilter.toLowerCase());
      
      const matchesApp = !appFilter || session.appName === appFilter;
      
      return matchesUser && matchesApp;
    });
  }, [sessions, userFilter, appFilter]);

  return (
    <div className="session-list">
      <div className="session-list-header">
        <h2>Sessions</h2>
        <button onClick={onRefresh} className="refresh-btn">↻</button>
      </div>

      <div className="session-filters">
        <input
          type="text"
          placeholder="Filter by user..."
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="filter-input"
        />
        <select
          value={appFilter}
          onChange={(e) => setAppFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Applications</option>
          {uniqueApps.map(app => (
            <option key={app} value={app}>{app}</option>
          ))}
        </select>
        {(userFilter || appFilter) && (
          <button 
            onClick={() => { setUserFilter(''); setAppFilter(''); }}
            className="clear-filters"
          >
            Clear
          </button>
        )}
      </div>

      <div className="session-items">
        {filteredSessions.length === 0 ? (
          <p className="empty-message">
            {sessions.length === 0 ? 'No sessions recorded yet' : 'No sessions match filters'}
          </p>
        ) : (
          filteredSessions.map(session => (
            <div
              key={session.id}
              className={`session-item ${selectedSession === session.id ? 'selected' : ''}`}
              onClick={() => {
                console.log('Session clicked:', session.id);
                onSelectSession(session.id);
              }}
            >
              {session.appName && (
                <div className="session-app">
                  📱 {session.appName}
                </div>
              )}
              {(session.userName || session.userEmail || session.userId) && (
                <div className="session-user">
                  👤 {session.userName || session.userEmail || session.userId}
                </div>
              )}
              {session.optInMode && (
                <div className="session-optin">
                  🕯️ User Opted In
                </div>
              )}
              <div className="session-id">{session.id}</div>
              <div className="session-meta">
                <span>{new Date(session.startTime).toLocaleString()}</span>
                <span>{session.eventCount} events</span>
                {session.screenResolution && <span>📱 {session.screenResolution}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
