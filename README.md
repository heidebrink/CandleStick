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
<script src="http://localhost:3000/session-tracker.umd.js"></script>
<script>
  var tracker = SessionTracker.init({
    apiEndpoint: 'http://localhost:3001/api'
  });
</script>
```

**Note:** The SDK is served by the viewer app at `http://localhost:3000/session-tracker.umd.js`

That's it! Works with:
- ✅ **ASP.NET MVC** - [Quick Start](examples/asp-net-mvc/QUICK-START.md) | [Full Guide](examples/asp-net-mvc/README.md)
- ✅ ASP.NET Blazor
- ✅ PHP / Laravel / WordPress
- ✅ React / Vue / Angular
- ✅ Vanilla HTML/JavaScript
- ✅ Any other web framework

See the `examples/` folder for framework-specific integration examples.

### Configuration Options

```javascript
SessionTracker.init({
  apiEndpoint: 'http://localhost:3001/api',  // Required
  
  // User & app identification (recommended)
  userId: 'user123',                          // User ID from your system
  userName: 'John Doe',                       // User's display name
  userEmail: 'john@example.com',              // User's email
  appName: 'My Web App',                      // Application name
  
  // Other options
  sessionId: 'custom-id',                     // Optional: Custom session ID
  flushInterval: 5000,                        // Optional: How often to send data (ms)
  metadata: {                                 // Optional: Any custom data
    accountType: 'premium',
    environment: 'production'
  }
});
```

**User Identification Examples:**

ASP.NET MVC:
```javascript
SessionTracker.init({
  apiEndpoint: '/api',
  userId: '@User.Identity.Name',
  userName: '@User.Claims.FirstOrDefault(c => c.Type == "name")?.Value',
  userEmail: '@User.Claims.FirstOrDefault(c => c.Type == "email")?.Value',
  appName: 'My ASP.NET MVC App'
});
```

PHP:
```javascript
SessionTracker.init({
  apiEndpoint: '/api',
  userId: '<?php echo $_SESSION["user_id"]; ?>',
  userName: '<?php echo $_SESSION["user_name"]; ?>',
  userEmail: '<?php echo $_SESSION["user_email"]; ?>',
  appName: 'My PHP App'
});
```

### Testing

Use the "Test Tracking" tab in the viewer app to interact with elements and generate session data.

## Features

- Real-time session recording using rrweb
- Session replay with playback controls
- Test page for generating sample sessions
- REST API for session storage
