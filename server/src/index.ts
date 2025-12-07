import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// CORS configuration based on environment
const corsOptions = {
  origin: CORS_ORIGIN === '*' ? '*' : CORS_ORIGIN.split(','),
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));

const DATA_DIR = process.env.DATA_DIR 
  ? join(process.cwd(), process.env.DATA_DIR)
  : join(dirname(fileURLToPath(import.meta.url)), '../../data');

// Ensure data directory exists
await fs.mkdir(DATA_DIR, { recursive: true });

interface SessionData {
  id: string;
  startTime: number;
  events: any[];
  metadata?: {
    userId?: string;
    userEmail?: string;
    userName?: string;
    appName?: string;
    userAgent?: string;
    screenResolution?: string;
    [key: string]: any;
  };
}

// Get all sessions
app.get('/api/sessions', async (req, res) => {
  try {
    const files = await fs.readdir(DATA_DIR);
    const sessions = await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(async (file) => {
          const data = await fs.readFile(join(DATA_DIR, file), 'utf-8');
          const session: SessionData = JSON.parse(data);
          return {
            id: session.id,
            startTime: session.startTime,
            eventCount: session.events.length,
            userId: session.metadata?.userId,
            userEmail: session.metadata?.userEmail,
            userName: session.metadata?.userName,
            appName: session.metadata?.appName,
            userAgent: session.metadata?.userAgent,
            screenResolution: session.metadata?.screenResolution
          };
        })
    );
    res.json(sessions.sort((a, b) => b.startTime - a.startTime));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get session events
app.get('/api/sessions/:sessionId/events', async (req, res) => {
  try {
    const filePath = join(DATA_DIR, `${req.params.sessionId}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    const session: SessionData = JSON.parse(data);
    res.json({ events: session.events });
  } catch (error) {
    res.status(404).json({ error: 'Session not found' });
  }
});

// Save session events
app.post('/api/sessions/:sessionId/events', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { events, metadata } = req.body;
    const filePath = join(DATA_DIR, `${sessionId}.json`);

    let session: SessionData;
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      session = JSON.parse(data);
      session.events.push(...events);
      // Update metadata if provided
      if (metadata) {
        session.metadata = { ...session.metadata, ...metadata };
      }
    } catch {
      session = {
        id: sessionId,
        startTime: Date.now(),
        events,
        metadata
      };
    }

    await fs.writeFile(filePath, JSON.stringify(session, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save events' });
  }
});

app.listen(PORT, () => {
  console.log(`🕯️  CandleStick API Server`);
  console.log(`   Environment: ${NODE_ENV}`);
  console.log(`   Port: ${PORT}`);
  console.log(`   CORS: ${CORS_ORIGIN}`);
  console.log(`   Data: ${DATA_DIR}`);
  console.log(`   Ready: http://localhost:${PORT}`);
});
