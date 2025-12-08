import express from 'express';
import cors from 'cors';
import sql from 'mssql';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// CORS configuration
const corsOptions = {
  origin: CORS_ORIGIN === '*' ? '*' : CORS_ORIGIN.split(','),
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));

// SQL Server configuration
const sqlConfig: sql.config = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_DATABASE || 'CandleStick',
  // Support both Windows Authentication and SQL Authentication
  ...(process.env.DB_INTEGRATED_SECURITY === 'true' 
    ? { 
        authentication: {
          type: 'ntlm',
          options: {
            domain: process.env.DB_DOMAIN || '',
            userName: process.env.DB_USER || '',
            password: process.env.DB_PASSWORD || ''
          }
        }
      }
    : {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
      }),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

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

// Initialize database connection
let pool: sql.ConnectionPool;

async function initDatabase() {
  try {
    pool = await sql.connect(sqlConfig);
    console.log('✅ Connected to SQL Server');
    
    // Test query
    await pool.request().query('SELECT 1');
    console.log('✅ Database connection verified');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await pool.request().query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

// Get all sessions
app.get('/api/sessions', async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT 
        s.Id as id,
        s.StartTime as startTime,
        COUNT(e.Id) as eventCount,
        s.UserId as userId,
        s.UserEmail as userEmail,
        s.UserName as userName,
        s.AppName as appName,
        s.OptInMode as optInMode,
        s.UserAgent as userAgent,
        s.ScreenResolution as screenResolution,
        s.CreatedAt as createdAt,
        s.UpdatedAt as updatedAt
      FROM Sessions s
      LEFT JOIN SessionEvents e ON s.Id = e.SessionId
      GROUP BY 
        s.Id, s.StartTime, s.UserId, s.UserEmail, s.UserName, 
        s.AppName, s.OptInMode, s.UserAgent, s.ScreenResolution,
        s.CreatedAt, s.UpdatedAt
      ORDER BY s.StartTime DESC
    `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get session events
app.get('/api/sessions/:sessionId/events', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await pool.request()
      .input('sessionId', sql.NVarChar(100), sessionId)
      .query(`
        SELECT EventData, EventIndex
        FROM SessionEvents
        WHERE SessionId = @sessionId
        ORDER BY EventIndex ASC
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Parse JSON events
    const events = result.recordset.map(row => JSON.parse(row.EventData));
    
    res.json({ events });
  } catch (error) {
    console.error('Error fetching session events:', error);
    res.status(500).json({ error: 'Failed to fetch session events' });
  }
});

// Save session events
app.post('/api/sessions/:sessionId/events', async (req, res) => {
  const transaction = new sql.Transaction(pool);
  
  try {
    const { sessionId } = req.params;
    const { events, metadata } = req.body;
    
    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'Events array is required' });
    }
    
    await transaction.begin();
    
    // Check if session exists
    const sessionCheck = await transaction.request()
      .input('sessionId', sql.NVarChar(100), sessionId)
      .query('SELECT Id FROM Sessions WHERE Id = @sessionId');
    
    if (sessionCheck.recordset.length === 0) {
      // Create new session
      await transaction.request()
        .input('id', sql.NVarChar(100), sessionId)
        .input('startTime', sql.BigInt, metadata?.timestamp || Date.now())
        .input('userId', sql.NVarChar(255), metadata?.userId || null)
        .input('userEmail', sql.NVarChar(255), metadata?.userEmail || null)
        .input('userName', sql.NVarChar(255), metadata?.userName || null)
        .input('appName', sql.NVarChar(255), metadata?.appName || null)
        .input('optInMode', sql.Bit, metadata?.optInMode || false)
        .input('userAgent', sql.NVarChar(500), metadata?.userAgent || null)
        .input('screenResolution', sql.NVarChar(50), metadata?.screenResolution || null)
        .query(`
          INSERT INTO Sessions (
            Id, StartTime, UserId, UserEmail, UserName, 
            AppName, OptInMode, UserAgent, ScreenResolution
          )
          VALUES (
            @id, @startTime, @userId, @userEmail, @userName,
            @appName, @optInMode, @userAgent, @screenResolution
          )
        `);
    } else if (metadata) {
      // Update session metadata
      await transaction.request()
        .input('sessionId', sql.NVarChar(100), sessionId)
        .input('userId', sql.NVarChar(255), metadata.userId || null)
        .input('userEmail', sql.NVarChar(255), metadata.userEmail || null)
        .input('userName', sql.NVarChar(255), metadata.userName || null)
        .input('appName', sql.NVarChar(255), metadata.appName || null)
        .input('optInMode', sql.Bit, metadata.optInMode || false)
        .input('userAgent', sql.NVarChar(500), metadata.userAgent || null)
        .input('screenResolution', sql.NVarChar(50), metadata.screenResolution || null)
        .query(`
          UPDATE Sessions
          SET 
            UserId = COALESCE(@userId, UserId),
            UserEmail = COALESCE(@userEmail, UserEmail),
            UserName = COALESCE(@userName, UserName),
            AppName = COALESCE(@appName, AppName),
            OptInMode = @optInMode,
            UserAgent = COALESCE(@userAgent, UserAgent),
            ScreenResolution = COALESCE(@screenResolution, ScreenResolution),
            UpdatedAt = GETDATE()
          WHERE Id = @sessionId
        `);
    }
    
    // Get current max event index
    const maxIndexResult = await transaction.request()
      .input('sessionId', sql.NVarChar(100), sessionId)
      .query('SELECT ISNULL(MAX(EventIndex), -1) as maxIndex FROM SessionEvents WHERE SessionId = @sessionId');
    
    let currentIndex = maxIndexResult.recordset[0].maxIndex + 1;
    
    // Insert events
    for (const event of events) {
      await transaction.request()
        .input('sessionId', sql.NVarChar(100), sessionId)
        .input('eventData', sql.NVarChar(sql.MAX), JSON.stringify(event))
        .input('eventIndex', sql.Int, currentIndex++)
        .query(`
          INSERT INTO SessionEvents (SessionId, EventData, EventIndex)
          VALUES (@sessionId, @eventData, @eventIndex)
        `);
    }
    
    await transaction.commit();
    res.json({ success: true, eventsAdded: events.length });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error saving session events:', error);
    res.status(500).json({ error: 'Failed to save events' });
  }
});

// Delete session
app.delete('/api/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    await pool.request()
      .input('sessionId', sql.NVarChar(100), sessionId)
      .query('DELETE FROM Sessions WHERE Id = @sessionId');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Cleanup old sessions (optional endpoint)
app.post('/api/cleanup', async (req, res) => {
  try {
    const { daysOld = 30 } = req.body;
    
    const result = await pool.request()
      .input('daysOld', sql.Int, daysOld)
      .query(`
        DELETE FROM Sessions 
        WHERE CreatedAt < DATEADD(day, -@daysOld, GETDATE())
      `);
    
    res.json({ 
      success: true, 
      deletedSessions: result.rowsAffected[0] 
    });
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
    res.status(500).json({ error: 'Failed to cleanup sessions' });
  }
});

// Start server
async function start() {
  await initDatabase();
  
  app.listen(PORT, () => {
    console.log(`🕯️  CandleStick API Server (SQL Server)`);
    console.log(`   Environment: ${NODE_ENV}`);
    console.log(`   Port: ${PORT}`);
    console.log(`   CORS: ${CORS_ORIGIN}`);
    console.log(`   Database: ${sqlConfig.server}/${sqlConfig.database}`);
    console.log(`   Ready: http://localhost:${PORT}`);
  });
}

// Handle shutdown gracefully
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database connection...');
  await pool.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing database connection...');
  await pool.close();
  process.exit(0);
});

start().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
