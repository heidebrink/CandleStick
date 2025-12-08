# CandleStick Setup Diagram

Visual guide showing how all the pieces connect.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Your ASP.NET MVC App                        │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Views/Shared/_Layout.cshtml                               │ │
│  │                                                           │ │
│  │  <script src="http://localhost:3000/                     │ │
│  │           session-tracker.umd.js"></script>              │ │
│  │  <script>                                                │ │
│  │    SessionTracker.init({                                 │ │
│  │      apiEndpoint: 'http://localhost:3001/api'           │ │
│  │    });                                                   │ │
│  │  </script>                                               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                           │                                     │
│                           │ Loads SDK from                      │
│                           ▼                                     │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌──────────────────┐                  ┌──────────────────┐
│  Viewer App      │                  │  Backend API     │
│  Port 3000       │                  │  Port 3001       │
│                  │                  │                  │
│  Serves:         │                  │  Stores:         │
│  - SDK file      │                  │  - Session data  │
│  - Viewer UI     │◄─────────────────│  - Events        │
│                  │  Fetches sessions│  - Metadata      │
└──────────────────┘                  └──────────────────┘
```

## Data Flow

```
1. User visits your MVC app
   │
   ├─► Browser loads _Layout.cshtml
   │
   ├─► Browser fetches SDK from http://localhost:3000/session-tracker.umd.js
   │
   ├─► SDK initializes and starts recording
   │
   ├─► User interacts with page (clicks, types, scrolls)
   │
   ├─► SDK captures events
   │
   ├─► Every 5 seconds, SDK sends events to http://localhost:3001/api
   │
   └─► Backend stores events in data/ folder

2. You want to view the session
   │
   ├─► Open http://localhost:3000 in browser
   │
   ├─► Viewer fetches session list from http://localhost:3001/api
   │
   ├─► Click on a session
   │
   ├─► Viewer fetches session events from http://localhost:3001/api
   │
   └─► Viewer replays the session
```

## Port Reference

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **Viewer App** | 3000 | http://localhost:3000 | View sessions + serves SDK |
| **Backend API** | 3001 | http://localhost:3001 | Stores session data |
| **Your MVC App** | varies | http://localhost:5000 (example) | Your application |

## File Locations

```
CandleStick/
├── server/                          # Backend API
│   ├── src/index.ts                # API server code
│   ├── data/                       # Session data stored here
│   └── package.json
│
├── packages/
│   ├── sdk/                        # Session tracking SDK
│   │   ├── src/index.ts           # SDK source code
│   │   └── dist/
│   │       └── session-tracker.umd.js  # Built SDK file
│   │
│   └── viewer/                     # Viewer web app
│       ├── public/
│       │   └── session-tracker.umd.js  # SDK served from here
│       └── src/                    # Viewer UI code
│
└── examples/
    └── asp-net-mvc/                # This example
        ├── Views/
        │   └── Shared/
        │       └── _Layout.cshtml  # Add SDK here
        ├── appsettings.json        # Configuration
        └── README.md               # Documentation
```

## Integration Points

### 1. SDK Loading
```html
<!-- In your _Layout.cshtml -->
<script src="http://localhost:3000/session-tracker.umd.js"></script>
```
- Loads from viewer app (port 3000)
- Viewer serves the pre-built SDK file
- No build step needed in your MVC app

### 2. SDK Initialization
```javascript
SessionTracker.init({
  apiEndpoint: 'http://localhost:3001/api'  // Points to backend
});
```
- Tells SDK where to send data
- Backend API receives and stores events

### 3. Viewing Sessions
```
http://localhost:3000
```
- Open viewer in browser
- Viewer fetches sessions from backend
- Click to replay

## Common Mistakes

### ❌ Wrong SDK URL
```html
<!-- DON'T use port 5173 -->
<script src="http://localhost:5173/session-tracker.umd.js"></script>
```

### ✅ Correct SDK URL
```html
<!-- DO use port 3000 (viewer app) -->
<script src="http://localhost:3000/session-tracker.umd.js"></script>
```

### ❌ Wrong API Endpoint
```javascript
// DON'T point to viewer
SessionTracker.init({
  apiEndpoint: 'http://localhost:3000/api'  // Wrong!
});
```

### ✅ Correct API Endpoint
```javascript
// DO point to backend
SessionTracker.init({
  apiEndpoint: 'http://localhost:3001/api'  // Correct!
});
```

## Startup Sequence

### Terminal 1: Backend API
```bash
cd server
npm run dev

# Output:
# 🕯️  CandleStick API Server
# Port: 3001
# Ready: http://localhost:3001
```

### Terminal 2: Viewer App
```bash
cd packages/viewer
npm run dev

# Output:
# VITE v5.4.21  ready in 286 ms
# ➜  Local:   http://localhost:3000/
```

### Terminal 3: Your MVC App
```bash
cd YourMvcApp
dotnet run

# Output:
# Now listening on: http://localhost:5000
```

## Verification Steps

1. ✅ **Backend running?**
   - Visit http://localhost:3001
   - Should see: `{"message":"CandleStick API"}`

2. ✅ **Viewer running?**
   - Visit http://localhost:3000
   - Should see: Viewer UI

3. ✅ **SDK accessible?**
   - Visit http://localhost:3000/session-tracker.umd.js
   - Should see: JavaScript code

4. ✅ **MVC app running?**
   - Visit your app URL
   - Open browser console
   - Should see: `✅ CandleStick tracking started`

5. ✅ **Sessions recording?**
   - Interact with your MVC app
   - Refresh http://localhost:3000
   - Should see: Your session in the list

## Need Help?

- [Quick Start Guide](QUICK-START.md) - Get started in 5 minutes
- [Troubleshooting Guide](TROUBLESHOOTING.md) - Fix common issues
- [Full README](README.md) - Complete documentation
