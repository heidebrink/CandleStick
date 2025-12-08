# Quick Start - ASP.NET MVC Integration

Get CandleStick running in your MVC app in 5 minutes.

## Step 1: Start CandleStick Services

Open **3 terminals** and run:

```bash
# Terminal 1 - Backend API
cd server
npm run dev
# Runs on http://localhost:3001

# Terminal 2 - Viewer App (also serves the SDK)
cd packages/viewer
npm run dev
# Runs on http://localhost:3000

# Terminal 3 - Your MVC App
dotnet run
# Or however you normally start your app
```

## Step 2: Add to Your _Layout.cshtml

Open `Views/Shared/_Layout.cshtml` and add this **before the closing `</body>` tag**:

```html
<!-- CandleStick Session Tracker -->
<script src="http://localhost:3000/session-tracker.umd.js"></script>
<script>
  (function() {
    try {
      window.candleStickTracker = SessionTracker.init({
        apiEndpoint: 'http://localhost:3001/api',
        userId: '@User.Identity.Name',
        userName: '@(User.Identity.IsAuthenticated ? User.Identity.Name : "Anonymous")',
        appName: 'My MVC App'
      });
      
      if (window.candleStickTracker) {
        console.log('✅ CandleStick tracking started');
        console.log('📹 Session ID:', window.candleStickTracker.getSessionId());
        console.log('👁️  View at: http://localhost:3000');
      }
    } catch (error) {
      console.warn('⚠️  CandleStick failed:', error);
    }
  })();
</script>
```

## Step 3: Test It!

1. **Run your MVC app** and navigate to any page
2. **Open** `http://localhost:3000` in another browser tab
3. **See your session** appear in the list
4. **Click on it** to watch the replay!

## That's It! 🎉

You're now recording sessions. Every click, scroll, and interaction is captured.

## Troubleshooting

### "SessionTracker is not defined"

**Problem:** The SDK script isn't loading.

**Fix:** Make sure the viewer app is running on port 3000:
```bash
cd packages/viewer
npm run dev
```

Then verify you can access: `http://localhost:3000/session-tracker.umd.js`

### Sessions not appearing

**Problem:** Sessions aren't showing up in the viewer.

**Fix:** Check that the backend API is running:
```bash
cd server
npm run dev
```

Verify it's running on: `http://localhost:3001`

### CORS errors

**Problem:** Browser console shows CORS errors.

**Fix:** The backend API should already allow all origins in development. If you still see errors, check the `server/src/index.ts` file has:
```javascript
app.use(cors());
```

## Want User Control? 🎛️

Add one line to your `appsettings.json` to show a widget that lets users control recording:

```json
{
  "CandleStick": {
    "ApiEndpoint": "http://localhost:3001/api",
    "Enabled": true,
    "OptInMode": true
  }
}
```

A candle widget (🕯️) will appear in the bottom-right corner. Users click it to start/stop recording.

See [OPT-IN-MODE.md](OPT-IN-MODE.md) for details.

## Next Steps

- [Opt-In Mode Guide](OPT-IN-MODE.md) - User-controlled recording
- [Full README](README.md) - Complete documentation
- [Configuration Options](README.md#configuration-options) - Customize tracking
- [User Identification](README.md#user-identification) - Track specific users
- [Production Deployment](README.md#production-deployment) - Go live

## Common Customizations

### Add user email

```javascript
SessionTracker.init({
  apiEndpoint: 'http://localhost:3001/api',
  userId: '@User.Identity.Name',
  userEmail: '@User.Claims.FirstOrDefault(c => c.Type == "email")?.Value',
  appName: 'My MVC App'
});
```

### Add custom metadata

```javascript
SessionTracker.init({
  apiEndpoint: 'http://localhost:3001/api',
  userId: '@User.Identity.Name',
  appName: 'My MVC App',
  metadata: {
    environment: '@Environment.EnvironmentName',
    userRole: '@User.IsInRole("Admin") ? "Admin" : "User"',
    customField: 'value'
  }
});
```

### Disable in certain environments

```csharp
@if (Environment.IsDevelopment())
{
    <!-- Only load in development -->
    <script src="http://localhost:3000/session-tracker.umd.js"></script>
    <script>
      SessionTracker.init({ /* ... */ });
    </script>
}
```
