# Session Tracker

A LogRocket-like session recording and replay system with an embeddable SDK and viewer web app.

## Project Structure

- `packages/sdk` - Embeddable tracking SDK
- `packages/viewer` - Web app for viewing sessions
- `server` - Backend API for storing/retrieving sessions

## Quick Start

1. Install dependencies:
```bash
npm install
cd packages/sdk && npm install
cd ../viewer && npm install
cd ../../server && npm install
```

2. Start the backend server:
```bash
cd server && npm run dev
```

3. Build the SDK (in another terminal):
```bash
cd packages/sdk && npm run build
```

4. Start the viewer app (in another terminal):
```bash
cd packages/viewer && npm run dev
```

5. Open http://localhost:3000 in your browser

## Usage

### Embedding in ANY Web App

The SDK works with **any web framework** - just add these two lines before your closing `</body>` tag:

```html
<script src="http://localhost:5173/session-tracker.umd.js"></script>
<script>
  var tracker = SessionTracker.init({
    apiEndpoint: 'http://localhost:3001/api'
  });
</script>
```

That's it! Works with:
- ✅ ASP.NET MVC / Blazor
- ✅ PHP / Laravel / WordPress
- ✅ React / Vue / Angular
- ✅ Vanilla HTML/JavaScript
- ✅ Any other web framework

See the `examples/` folder for framework-specific integration examples.

### Configuration Options

```javascript
SessionTracker.init({
  apiEndpoint: 'http://localhost:3001/api',  // Required
  sessionId: 'custom-id',                     // Optional
  flushInterval: 5000,                        // Optional (ms)
  metadata: {                                 // Optional
    userId: 'user123',
    environment: 'production'
  }
});
```

### Testing

Use the "Test Tracking" tab in the viewer app to interact with elements and generate session data.

## Features

- Real-time session recording using rrweb
- Session replay with playback controls
- Test page for generating sample sessions
- REST API for session storage
