import express from 'express';
import cors from 'cors';
import sql from 'mssql';
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

// SQL Server configuration
const sqlConfig: sql.config = {
  database: process.env.DB_DATABASE || 'CandleStick',
  server: process.env.DB_SERVER || 'localhost',
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    trustedConnection: true
  }
};

// Add user/password only if provided (for SQL Server authentication)
if (process.env.DB_USER && process.env.DB_PASSWORD) {
  sqlConfig.user = process.env.DB_USER;
  sqlConfig.password = process.env.DB_PASSWORD;
  sqlConfig.options!.trustedConnection = false;
}

interface SessionData {
  id: string;
  startTime: number;
  events: any[];
  metadata?: {
    userId?: string;
    userEmail?: string;
    userName?: string;
    appName?: string;
    optInMode?: boolean;
    userAgent?: string;
    screenResolution?: string;
    [key: string]: any;
  };
}

// Initialize database
async function initDatabase() {
  try {
    await sql.connect(sqlConfig);
    
    // Create sessions table if it doesn't exist
    const request = new sql.Request();
    await request.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='sessions' AND xtype='U')
      CREATE TABLE sessions (
        id NVARCHAR(255) PRIMARY KEY,
        startTime BIGINT NOT NULL,
        events NTEXT NOT NULL,
        metadata NTEXT,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE()
      )
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// Get all sessions
app.get('/api/sessions', async (req, res) => {
  try {
    const request = new sql.Request();
    const result = await request.query(`
      SELECT id, startTime, 
             LEN(events) as eventLength,
             metadata
      FROM sessions 
      ORDER BY startTime DESC
    `);

    const sessions = result.recordset.map((row: any) => {
      let metadata: any = {};
      try {
        metadata = row.metadata ? JSON.parse(row.metadata) : {};
      } catch (e) {
        console.warn('Failed to parse metadata for session:', row.id);
      }

      // Estimate event count from JSON length (rough approximation)
      const eventCount = Math.floor(row.eventLength / 100);

      return {
        id: row.id,
        startTime: row.startTime,
        eventCount,
        userId: metadata.userId,
        userEmail: metadata.userEmail,
        userName: metadata.userName,
        appName: metadata.appName,
        optInMode: metadata.optInMode,
        userAgent: metadata.userAgent,
        screenResolution: metadata.screenResolution
      };
    });

    res.json(sessions);
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get session events
app.get('/api/sessions/:sessionId/events', async (req, res) => {
  try {
    const request = new sql.Request();
    request.input('sessionId', sql.NVarChar, req.params.sessionId);
    
    const result = await request.query(`
      SELECT events FROM sessions WHERE id = @sessionId
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const events = JSON.parse(result.recordset[0].events);
    res.json({ events });
  } catch (error) {
    console.error('Failed to fetch session events:', error);
    res.status(404).json({ error: 'Session not found' });
  }
});

// Save session events
app.post('/api/sessions/:sessionId/events', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { events, metadata } = req.body;

    const request = new sql.Request();
    request.input('sessionId', sql.NVarChar, sessionId);

    // Check if session exists
    const existingResult = await request.query(`
      SELECT events, metadata FROM sessions WHERE id = @sessionId
    `);

    if (existingResult.recordset.length > 0) {
      // Update existing session
      const existingEvents = JSON.parse(existingResult.recordset[0].events || '[]');
      const existingMetadata = existingResult.recordset[0].metadata 
        ? JSON.parse(existingResult.recordset[0].metadata) 
        : {};

      const updatedEvents = [...existingEvents, ...events];
      const updatedMetadata = { ...existingMetadata, ...metadata };

      const updateRequest = new sql.Request();
      updateRequest.input('sessionId', sql.NVarChar, sessionId);
      updateRequest.input('events', sql.NText, JSON.stringify(updatedEvents));
      updateRequest.input('metadata', sql.NText, JSON.stringify(updatedMetadata));

      await updateRequest.query(`
        UPDATE sessions 
        SET events = @events, 
            metadata = @metadata,
            updatedAt = GETDATE()
        WHERE id = @sessionId
      `);
    } else {
      // Create new session
      const insertRequest = new sql.Request();
      insertRequest.input('sessionId', sql.NVarChar, sessionId);
      insertRequest.input('startTime', sql.BigInt, Date.now());
      insertRequest.input('events', sql.NText, JSON.stringify(events));
      insertRequest.input('metadata', sql.NText, JSON.stringify(metadata || {}));

      await insertRequest.query(`
        INSERT INTO sessions (id, startTime, events, metadata)
        VALUES (@sessionId, @startTime, @events, @metadata)
      `);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to save session events:', error);
    res.status(500).json({ error: 'Failed to save events' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    database: 'connected'
  });
});

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🕯️  CandleStick API Server (SQL Server)`);
    console.log(`   Environment: ${NODE_ENV}`);
    console.log(`   Port: ${PORT}`);
    console.log(`   CORS: ${CORS_ORIGIN}`);
    console.log(`   Database: SQL Server`);
    console.log(`   Ready: http://localhost:${PORT}`);
  });
});