import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  try {
    const path = event.path;
    const method = event.httpMethod;

    // Get all sessions
    if (path === '/api/sessions' && method === 'GET') {
      const command = new ScanCommand({
        TableName: process.env.DYNAMODB_TABLE,
        ProjectionExpression: 'id, startTime, eventCount, userId, userEmail, userName, appName, optInMode, userAgent, screenResolution',
      });

      const result = await docClient.send(command);
      const sessions = (result.Items || []).sort((a, b) => (b.startTime || 0) - (a.startTime || 0));

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(sessions),
      };
    }

    // Get session events
    if (path.match(/^\/api\/sessions\/[^\/]+\/events$/) && method === 'GET') {
      const sessionId = path.split('/')[3];
      
      const command = new GetCommand({
        TableName: process.env.DYNAMODB_TABLE,
        Key: { id: sessionId },
      });

      const result = await docClient.send(command);
      
      if (!result.Item) {
        return {
          statusCode: 404,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Session not found' }),
        };
      }

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ events: result.Item.events || [] }),
      };
    }

    // Save session events
    if (path.match(/^\/api\/sessions\/[^\/]+\/events$/) && method === 'POST') {
      const sessionId = path.split('/')[3];
      const body = JSON.parse(event.body || '{}');
      const { events, metadata } = body;

      // Check if session exists
      const getCommand = new GetCommand({
        TableName: process.env.DYNAMODB_TABLE,
        Key: { id: sessionId },
      });

      const existingSession = await docClient.send(getCommand);

      if (existingSession.Item) {
        // Update existing session
        const existingEvents = existingSession.Item.events || [];
        const existingMetadata = existingSession.Item.metadata || {};
        
        const updateCommand = new UpdateCommand({
          TableName: process.env.DYNAMODB_TABLE,
          Key: { id: sessionId },
          UpdateExpression: 'SET events = :events, metadata = :metadata, eventCount = :eventCount, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':events': [...existingEvents, ...events],
            ':metadata': { ...existingMetadata, ...metadata },
            ':eventCount': existingEvents.length + events.length,
            ':updatedAt': Date.now(),
          },
        });

        await docClient.send(updateCommand);
      } else {
        // Create new session
        const putCommand = new PutCommand({
          TableName: process.env.DYNAMODB_TABLE,
          Item: {
            id: sessionId,
            startTime: Date.now(),
            events,
            metadata: metadata || {},
            eventCount: events.length,
            userId: metadata?.userId,
            userEmail: metadata?.userEmail,
            userName: metadata?.userName,
            appName: metadata?.appName,
            optInMode: metadata?.optInMode,
            userAgent: metadata?.userAgent,
            screenResolution: metadata?.screenResolution,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60), // 90 days TTL
          },
        });

        await docClient.send(putCommand);
      }

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: true }),
      };
    }

    // Health check
    if (path === '/health' && method === 'GET') {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          status: 'ok',
          timestamp: Date.now(),
          service: 'candlestick-lambda',
        }),
      };
    }

    // Not found
    return {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Not found' }),
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};