# CandleStick Resilience & Error Handling

## Core Principle

**CandleStick must NEVER interfere with your application's functionality.**

If the tracking API is down, slow, or unreachable, your users should never notice. The SDK is designed to fail silently and gracefully.

## Built-in Resilience Features

### 1. **Silent Failures**
All errors are caught and logged only in development. Production users never see errors.

```javascript
try {
  SessionTracker.init({ apiEndpoint: '/api' });
} catch (error) {
  // Silently fails - user's app continues normally
}
```

### 2. **Request Timeouts**
API requests timeout after 5 seconds to prevent hanging.

```javascript
// Automatic 5-second timeout
fetch(apiEndpoint, {
  signal: AbortSignal.timeout(5000)
});
```

### 3. **Queue Management**
Events are queued and retried, but limited to 1000 events to prevent memory issues.

```javascript
// Keeps last 1000 events max
if (this.events.length < 1000) {
  this.events.unshift(...failedEvents);
}
```

### 4. **Non-Blocking Script Loading**
SDK loads asynchronously and doesn't block page rendering.

```html
<!-- Async loading - never blocks page -->
<script async src="session-tracker.umd.js"></script>
```

### 5. **CORS Safety**
No credentials sent to avoid CORS issues.

```javascript
fetch(apiEndpoint, {
  credentials: 'omit'  // Prevents CORS errors
});
```

## Best Practices for Integration

### ✅ DO: Async Script Loading

```html
<!-- Good: Async loading -->
<script async src="https://cdn.yourapp.com/candlestick/session-tracker.umd.js"></script>
<script>
  window.addEventListener('load', function() {
    if (window.SessionTracker) {
      SessionTracker.init({ apiEndpoint: '/api' });
    }
  });
</script>
```

### ❌ DON'T: Synchronous Loading

```html
<!-- Bad: Blocks page rendering -->
<script src="session-tracker.umd.js"></script>
```

### ✅ DO: Check if SDK Loaded

```javascript
// Good: Check before using
if (window.SessionTracker) {
  const tracker = SessionTracker.init({ apiEndpoint: '/api' });
  if (tracker) {
    console.log('Tracking started');
  }
}
```

### ❌ DON'T: Assume SDK is Available

```javascript
// Bad: Assumes SDK loaded
SessionTracker.init({ apiEndpoint: '/api' });
```

### ✅ DO: Wrap in Try-Catch

```javascript
// Good: Safe initialization
try {
  if (window.SessionTracker) {
    SessionTracker.init({ apiEndpoint: '/api' });
  }
} catch (error) {
  // Your app continues normally
}
```

### ✅ DO: Use Feature Detection

```javascript
// Good: Check for required features
if ('fetch' in window && 'Promise' in window) {
  SessionTracker.init({ apiEndpoint: '/api' });
}
```

## Handling API Downtime

### Scenario 1: API Server is Down

**What happens:**
- SDK attempts to send events
- Request times out after 5 seconds
- Events are queued for retry
- User's app continues normally

**User impact:** None

### Scenario 2: Network is Slow

**What happens:**
- Request times out after 5 seconds
- Events are queued
- Next flush attempt retries

**User impact:** None

### Scenario 3: CORS Issues

**What happens:**
- Browser blocks request
- Error is caught silently
- Events are queued

**User impact:** None

### Scenario 4: SDK Script Fails to Load

**What happens:**
- Script load fails
- `window.SessionTracker` is undefined
- Your code checks for it
- App continues without tracking

**User impact:** None

## Monitoring & Alerts

### Server-Side Monitoring

Monitor your CandleStick API for:

```javascript
// Example health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});
```

### Client-Side Error Tracking

Track SDK initialization failures (optional):

```javascript
try {
  const tracker = SessionTracker.init({ apiEndpoint: '/api' });
  if (!tracker) {
    // Report to your error tracking service
    yourErrorTracker.log('CandleStick failed to initialize');
  }
} catch (error) {
  yourErrorTracker.log('CandleStick error', error);
}
```

## Testing Resilience

### Test 1: API Down

```bash
# Stop the API server
# Your app should work normally
```

### Test 2: Slow Network

```javascript
// Chrome DevTools: Network tab → Throttling → Slow 3G
// Your app should remain responsive
```

### Test 3: CORS Errors

```javascript
// Try loading from different domain
// Should fail silently
```

### Test 4: Script Blocked

```javascript
// Block script in browser
// App should work without tracking
```

## Production Checklist

- [ ] SDK loads asynchronously
- [ ] Initialization wrapped in try-catch
- [ ] Check for `window.SessionTracker` before using
- [ ] API has health check endpoint
- [ ] Monitoring/alerts set up for API
- [ ] Tested with API down
- [ ] Tested with slow network
- [ ] Tested with script blocked
- [ ] No console errors in production
- [ ] User experience unaffected by tracking

## Example: Bulletproof Integration

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <!-- Your app content -->
  
  <!-- CandleStick: Load async, fail silently -->
  <script>
    (function() {
      // Only load if browser supports required features
      if (!('fetch' in window) || !('Promise' in window)) {
        return;
      }

      // Load SDK asynchronously
      var script = document.createElement('script');
      script.async = true;
      script.src = 'https://cdn.yourapp.com/candlestick/session-tracker.umd.js';
      
      // Initialize when loaded
      script.onload = function() {
        try {
          if (window.SessionTracker) {
            var tracker = SessionTracker.init({
              apiEndpoint: 'https://tracking-api.yourapp.com/api',
              userId: getCurrentUserId(),
              appName: 'My App'
            });
            
            // Optional: Log success in dev only
            if (tracker && window.location.hostname === 'localhost') {
              console.log('CandleStick tracking started');
            }
          }
        } catch (error) {
          // Silently fail - never block the user
        }
      };
      
      // Silently fail if script doesn't load
      script.onerror = function() {
        // Do nothing - app continues normally
      };
      
      document.head.appendChild(script);
    })();
  </script>
</body>
</html>
```

## Summary

CandleStick is designed to be **invisible** to your users:

✅ **Never blocks** page rendering  
✅ **Never throws** uncaught errors  
✅ **Never hangs** on slow networks  
✅ **Never breaks** your app if API is down  
✅ **Always fails** silently and gracefully  

Your users' experience is the priority. Tracking is secondary.
