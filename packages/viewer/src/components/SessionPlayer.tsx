import { useEffect, useRef, useState } from 'react';
import rrwebPlayer from 'rrweb-player';
import 'rrweb-player/dist/style.css';

interface Props {
  sessionId: string;
}

export default function SessionPlayer({ sessionId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let player: any;

    const loadSession = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('Loading session:', sessionId);
        const response = await fetch(`/api/sessions/${sessionId}/events`);
        if (!response.ok) throw new Error('Failed to load session');
        
        const data = await response.json();
        console.log('Session events loaded:', data.events.length);
        
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          player = new rrwebPlayer({
            target: containerRef.current,
            props: {
              events: data.events,
              width: 1024,
              height: 768,
              autoPlay: false
            }
          });
          console.log('Player initialized');
        }
      } catch (err) {
        console.error('Session player error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    return () => {
      if (player) {
        player.$destroy();
      }
    };
  }, [sessionId]);

  if (loading) return <div className="player-loading">Loading session...</div>;
  if (error) return <div className="player-error">Error: {error}</div>;

  return <div ref={containerRef} className="player-container" />;
}
