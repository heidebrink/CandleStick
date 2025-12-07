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

interface Props {
  sessions: Session[];
  selectedSession: string | null;
  onSelectSession: (id: string) => void;
  onRefresh: () => void;
}

export default function SessionList({ sessions, selectedSession, onSelectSession, onRefresh }: Props) {
  return (
    <div className="session-list">
      <div className="session-list-header">
        <h2>Sessions</h2>
        <button onClick={onRefresh} className="refresh-btn">↻</button>
      </div>
      <div className="session-items">
        {sessions.length === 0 ? (
          <p className="empty-message">No sessions recorded yet</p>
        ) : (
          sessions.map(session => (
            <div
              key={session.id}
              className={`session-item ${selectedSession === session.id ? 'selected' : ''}`}
              onClick={() => onSelectSession(session.id)}
            >
              {(session.userName || session.userEmail || session.userId) && (
                <div className="session-user">
                  👤 {session.userName || session.userEmail || session.userId}
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
