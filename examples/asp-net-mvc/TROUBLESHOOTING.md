# Troubleshooting - ASP.NET MVC Integration

Common issues and solutions when integrating CandleStick with ASP.NET MVC.

## Issue: "SessionTracker is not defined"

### Symptoms
- Browser console error: `Uncaught ReferenceError: SessionTracker is not defined`
- Script tag is in your HTML but tracker doesn't initialize

### Causes & Solutions

#### 1. Viewer app not running
**Check:** Is the viewer app running on port 3000?

```bash
cd packages/viewer
npm run dev
```

**Verify:** Open `http://localhost:3000/session-tracker.umd.js` in your browser. You should see JavaScript code, not a 404 error.

#### 2. Wrong SDK URL
**Problem:** Using `http://localhost:5173/session-tracker.umd.js` (old URL)

**Fix:** Update to `http://localhost:3000/session-tracker.umd.js`

```html
<!-- ❌ Wrong -->
<script src="http://localhost:5173/session-tracker.umd.js"></script>

<!-- ✅ Correct -->
<script src="http://localhost:3000/session-tracker.umd.js"></script>
```

#### 3. Script loading order
**Problem:** Trying to use SessionTracker before the script loads

**Fix:** Make sure the init script comes AFTER the SDK script:

```html
<!-- ✅ Correct order -->
<script src="http://localhost:3000/session-tracker.umd.js"></script>
<script>
  // This runs after SDK is loaded
  SessionTracker.init({ /* ... */ });
</script>

<!-- ❌ Wrong order -->
<script>
  // This runs before SDK is loaded - will fail!
  SessionTracker.init({ /* ... */ });
</script>
<script src="http://localhost:3000/session-tracker.umd.js"></script>
```

#### 4. Network/CORS issues
**Check:** Browser Network tab - is the SDK script loading successfully?

**Fix:** If you see CORS errors, make sure:
- Viewer app is running
- Your MVC app can access localhost:3000
- No firewall blocking the connection

---

## Issue: Sessions Not Appearing in Viewer

### Symptoms
- SDK loads successfully
- No errors in console
- But sessions don't show up in the viewer

### Causes & Solutions

#### 1. Backend API not running
**Check:** Is the backend running on port 3001?

```bash
cd server
npm run dev
```

**Verify:** Open `http://localhost:3001` in your browser. You should see a response (not connection refused).

#### 2. Wrong API endpoint
**Problem:** `apiEndpoint` points to wrong URL

**Fix:** Make sure it matches where your backend is running:

```javascript
SessionTracker.init({
  apiEndpoint: 'http://localhost:3001/api',  // ✅ Correct
  // NOT: 'http://localhost:3000/api'        // ❌ Wrong (that's the viewer)
  // NOT: 'http://localhost:5173/api'        // ❌ Wrong (nothing there)
});
```

#### 3. API errors
**Check:** Browser console for API errors

**Common errors:**
- `Failed to fetch` - Backend not running
- `404 Not Found` - Wrong API endpoint
- `CORS error` - Backend CORS not configured

**Fix:** Check backend logs for errors:
```bash
cd server
npm run dev
# Watch for errors when your app tries to send data
```

#### 4. Tracking not initialized
**Check:** Console should show: `✅ CandleStick tracking started`

**Fix:** Make sure the init code is actually running:

```javascript
try {
  var tracker = SessionTracker.init({
    apiEndpoint: 'http://localhost:3001/api'
  });
  
  if (tracker) {
    console.log('✅ Tracking started:', tracker.getSessionId());
  } else {
    console.error('❌ Tracker is null');
  }
} catch (error) {
  console.error('❌ Init failed:', error);
}
```

---

## Issue: Razor Syntax Errors

### Symptoms
- Build errors in your .cshtml files
- Razor syntax not working in JavaScript

### Causes & Solutions

#### 1. Razor in JavaScript strings
**Problem:** Razor syntax inside JavaScript strings

```javascript
// ❌ This might not work
var userId = '@User.Identity.Name';
```

**Fix:** Use proper Razor escaping:

```javascript
// ✅ This works
var userId = '@User.Identity.Name';
var userName = '@(User.Identity.IsAuthenticated ? User.Identity.Name : "Anonymous")';
```

#### 2. Claims not found
**Problem:** `User.Claims.FirstOrDefault(...)` returns null

**Fix:** Add null-coalescing:

```javascript
userName: '@(User.Claims.FirstOrDefault(c => c.Type == "name")?.Value ?? "")',
userEmail: '@(User.Claims.FirstOrDefault(c => c.Type == "email")?.Value ?? "")',
```

#### 3. Configuration not found
**Problem:** `Configuration["CandleStick:ApiEndpoint"]` is null

**Fix:** Make sure you have appsettings.json configured:

```json
{
  "CandleStick": {
    "ApiEndpoint": "http://localhost:3001/api",
    "Enabled": true
  }
}
```

And inject IConfiguration in your view:

```csharp
@inject IConfiguration Configuration
```

---

## Issue: Sessions Recording But Can't View Them

### Symptoms
- Console shows tracking started
- Sessions appear in viewer list
- But clicking on them shows nothing or errors

### Causes & Solutions

#### 1. Session data corrupted
**Check:** Backend logs for errors when retrieving sessions

**Fix:** Delete the data folder and restart:
```bash
cd server
rm -rf data  # or rmdir /s data on Windows
npm run dev
```

#### 2. Viewer app issues
**Fix:** Restart the viewer app:
```bash
cd packages/viewer
npm run dev
```

---

## Issue: Performance Problems

### Symptoms
- App feels slow after adding CandleStick
- High CPU usage
- Network tab shows lots of requests

### Causes & Solutions

#### 1. Too frequent data sending
**Fix:** Increase flush interval:

```javascript
SessionTracker.init({
  apiEndpoint: 'http://localhost:3001/api',
  flushInterval: 10000  // Send data every 10 seconds instead of 5
});
```

#### 2. Recording too much
**Fix:** Disable tracking on certain pages:

```csharp
@{
    var shouldTrack = !Request.Path.StartsWithSegments("/admin");
}

@if (shouldTrack)
{
    <!-- Load tracking SDK -->
}
```

---

## Issue: Privacy/Security Concerns

### Symptoms
- Worried about recording sensitive data
- Need to comply with privacy regulations

### Solutions

#### 1. Mask sensitive inputs
```javascript
SessionTracker.init({
  apiEndpoint: 'http://localhost:3001/api',
  maskInputOptions: {
    password: true,  // Already default
    email: true,     // Mask email fields
    tel: true,       // Mask phone numbers
    text: false      // Don't mask regular text
  }
});
```

#### 2. Disable for certain users
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

#### 3. Opt-in mode
```javascript
SessionTracker.init({
  apiEndpoint: 'http://localhost:3001/api',
  optIn: true,        // Don't start automatically
  showWidget: true    // Show widget to let user control
});
```

---

## Still Having Issues?

### Debug Checklist

1. ✅ Viewer app running on port 3000?
2. ✅ Backend API running on port 3001?
3. ✅ SDK script loading (check Network tab)?
4. ✅ Console shows "tracking started"?
5. ✅ No errors in browser console?
6. ✅ No errors in backend logs?

### Get More Help

- Check the [main README](README.md)
- Review the [Quick Start guide](QUICK-START.md)
- Look at the [vanilla HTML example](../vanilla-html/index.html) for a minimal working example
- Check backend logs: `cd server && npm run dev`
- Check browser console for errors

### Common Port Conflicts

If ports 3000 or 3001 are already in use:

**Change viewer port:**
```bash
# In packages/viewer/package.json
"dev": "vite --port 3002"
```

**Change backend port:**
```bash
# In server/src/index.ts
const PORT = 3003;
```

Then update your SDK configuration accordingly.
