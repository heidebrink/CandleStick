# ASP.NET MVC Integration Example

This example shows how to integrate CandleStick session tracking into an ASP.NET MVC application.

## Quick Start

### 1. Start CandleStick Services

First, make sure the CandleStick backend and viewer are running:

```bash
# Terminal 1 - Start the backend API
cd server
npm run dev

# Terminal 2 - Start the viewer app (this also serves the SDK)
cd packages/viewer
npm run dev
```

The viewer app runs on `http://localhost:3000` and serves the SDK file at `http://localhost:3000/session-tracker.umd.js`.

### 2. Add to Your Layout File

Copy the code from `Views/Shared/_Layout.cshtml` to your application's layout file (typically `Views/Shared/_Layout.cshtml`).

The key parts are:

```html
<!-- Add before closing </body> tag -->
<script src="http://localhost:3000/session-tracker.umd.js"></script>
<script>
  var tracker = SessionTracker.init({
    apiEndpoint: 'http://localhost:3001/api',
    userId: '@User.Identity.Name',
    userName: '@User.Claims.FirstOrDefault(c => c.Type == "name")?.Value',
    userEmail: '@User.Claims.FirstOrDefault(c => c.Type == "email")?.Value',
    appName: 'My ASP.NET MVC App'
  });
</script>
```

### 3. Configure Settings (Optional)

Add CandleStick configuration to your `appsettings.json`:

```json
{
  "CandleStick": {
    "ApiEndpoint": "http://localhost:3001/api",
    "Enabled": true
  }
}
```

For production, update `appsettings.Production.json`:

```json
{
  "CandleStick": {
    "ApiEndpoint": "https://your-tracking-api.com/api",
    "Enabled": true
  }
}
```

### 4. Test It

1. Run your MVC application
2. Navigate through your app
3. Open `http://localhost:3000` in another tab
4. You should see your session appear in the list
5. Click on it to watch the replay!

## 🎛️ Opt-In Mode (User-Controlled Recording)

Want to give users control? Enable opt-in mode to show a widget that lets users start/stop recording:

```json
{
  "CandleStick": {
    "ApiEndpoint": "http://localhost:3001/api",
    "Enabled": true,
    "OptInMode": true
  }
}
```

**What happens:**
- A candle widget (🕯️) appears in the bottom-right corner
- Users click it to start/stop recording
- Widget is bright when recording, dimmed when not
- User's choice persists across sessions

**Perfect for:**
- Privacy-conscious applications
- GDPR compliance
- Giving users transparency and control

See [OPT-IN-MODE.md](OPT-IN-MODE.md) for complete documentation.

## Configuration Options

### Basic Configuration

```javascript
SessionTracker.init({
  apiEndpoint: 'http://localhost:3001/api',  // Required
  userId: '@User.Identity.Name',              // User ID from your auth system
  userName: 'John Doe',                       // User's display name
  userEmail: 'john@example.com',              // User's email
  appName: 'My MVC App'                       // Application name
});
```

### Advanced Configuration

```javascript
SessionTracker.init({
  apiEndpoint: 'http://localhost:3001/api',
  
  // User identification
  userId: '@User.Identity.Name',
  userName: '@User.Claims.FirstOrDefault(c => c.Type == "name")?.Value',
  userEmail: '@User.Claims.FirstOrDefault(c => c.Type == "email")?.Value',
  
  // App info
  appName: 'My ASP.NET MVC App',
  
  // Custom metadata
  metadata: {
    environment: '@Environment.EnvironmentName',
    userRole: '@User.IsInRole("Admin") ? "Admin" : "User"',
    accountType: 'premium',
    version: '1.0.0'
  },
  
  // Optional settings
  flushInterval: 5000,        // How often to send data (ms)
  sessionTimeout: 30,         // Minutes of inactivity before new session
  
  // Error handling
  onError: function(error) {
    console.error('Tracking error:', error);
  }
});
```

## User Identification

### Using ASP.NET Identity

```csharp
@using System.Security.Claims

<script>
  SessionTracker.init({
    apiEndpoint: '@Configuration["CandleStick:ApiEndpoint"]',
    userId: '@User.Identity.Name',
    userName: '@User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value',
    userEmail: '@User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value',
    appName: 'My MVC App'
  });
</script>
```

### Using Custom Claims

```csharp
<script>
  SessionTracker.init({
    apiEndpoint: '@Configuration["CandleStick:ApiEndpoint"]',
    userId: '@User.FindFirst("sub")?.Value',
    userName: '@User.FindFirst("name")?.Value',
    userEmail: '@User.FindFirst("email")?.Value',
    appName: 'My MVC App',
    metadata: {
      department: '@User.FindFirst("department")?.Value',
      role: '@User.FindFirst(ClaimTypes.Role)?.Value'
    }
  });
</script>
```

## Environment-Specific Configuration

### Development

In `appsettings.Development.json`:

```json
{
  "CandleStick": {
    "ApiEndpoint": "http://localhost:3001/api",
    "Enabled": true
  }
}
```

Use the local SDK:
```html
<script src="http://localhost:3000/session-tracker.umd.js"></script>
```

### Production

In `appsettings.Production.json`:

```json
{
  "CandleStick": {
    "ApiEndpoint": "https://tracking-api.yourapp.com/api",
    "Enabled": true
  }
}
```

Host the SDK on your CDN:
```html
<script src="https://cdn.yourapp.com/candlestick/session-tracker.umd.js"></script>
```

### Conditional Loading

```csharp
@if (Configuration.GetValue<bool>("CandleStick:Enabled"))
{
    <script src="@Configuration["CandleStick:SdkUrl"]"></script>
    <script>
        SessionTracker.init({
            apiEndpoint: '@Configuration["CandleStick:ApiEndpoint"]',
            userId: '@User.Identity.Name',
            appName: 'My MVC App'
        });
    </script>
}
```

## Troubleshooting

### SDK Not Loading

**Problem:** `SessionTracker is not defined` error

**Solutions:**
1. Make sure the viewer app is running on `http://localhost:3000`
2. Check browser console for CORS errors
3. Verify the SDK URL is correct: `http://localhost:3000/session-tracker.umd.js`
4. Try accessing the SDK URL directly in your browser

### Sessions Not Appearing

**Problem:** Sessions don't show up in the viewer

**Solutions:**
1. Verify the backend API is running on `http://localhost:3001`
2. Check browser console for API errors
3. Make sure `apiEndpoint` is set correctly
4. Check that tracking is enabled in your config

### CORS Issues

If you see CORS errors, make sure your backend API allows requests from your MVC app's origin.

## Production Deployment

### 1. Host the SDK

Copy `packages/sdk/dist/session-tracker.umd.js` to your CDN or static file server.

### 2. Deploy the Backend API

Deploy the `server` folder to your hosting provider. Update the API endpoint in your production config.

### 3. Update Configuration

```json
{
  "CandleStick": {
    "ApiEndpoint": "https://tracking-api.yourapp.com/api",
    "Enabled": true
  }
}
```

### 4. Update Layout

```html
<script src="https://cdn.yourapp.com/candlestick/session-tracker.umd.js"></script>
```

## Privacy & Compliance

### Disable Tracking for Specific Users

```csharp
@{
    var shouldTrack = User.Identity.IsAuthenticated && 
                      !User.IsInRole("Internal") &&
                      Configuration.GetValue<bool>("CandleStick:Enabled");
}

@if (shouldTrack)
{
    <!-- Load tracking SDK -->
}
```

### Mask Sensitive Data

The SDK automatically masks password fields. For additional masking:

```javascript
SessionTracker.init({
  apiEndpoint: 'http://localhost:3001/api',
  maskInputOptions: {
    password: true,
    email: true,
    tel: true
  }
});
```

## Support

For more examples and documentation, see:
- [Integration Guide](../INTEGRATION-GUIDE.md)
- [User Identification](../user-identification.md)
- [Environment Configuration](../environment-config.md)
