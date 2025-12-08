# Opt-In Mode - User-Controlled Recording

Give your users control over session recording with a friendly widget.

## What is Opt-In Mode?

Opt-in mode adds a **candle widget** in the bottom-right corner of your app that lets users:
- ✅ Start/stop recording with a click
- ✅ See when recording is active (bright candle)
- ✅ See when recording is paused (dimmed candle)
- ✅ Control their own privacy

## The Widget

When enabled, users see a cute animated candle icon:

```
🕯️  ← Bright and animated when recording
🕯   ← Dimmed when not recording
```

**Features:**
- Hover effect (scales up slightly)
- Click to toggle recording on/off
- Visual feedback (brightness changes)
- Tooltip shows current state
- Non-intrusive (bottom-right corner)

## Quick Setup

### 1. Enable in Configuration

**appsettings.json:**
```json
{
  "CandleStick": {
    "ApiEndpoint": "http://localhost:3001/api",
    "Enabled": true,
    "OptInMode": true
  }
}
```

### 2. That's It!

The widget will automatically appear. No code changes needed - it's already in the `_Layout.cshtml` example.

## How It Works

### With Opt-In Mode (OptInMode: true)

```javascript
SessionTracker.init({
  apiEndpoint: 'http://localhost:3001/api',
  optIn: true,        // Don't start recording automatically
  showWidget: true    // Show the control widget
});
```

**Behavior:**
1. Page loads → Widget appears (dimmed)
2. User clicks widget → Recording starts (bright)
3. User clicks again → Recording stops (dimmed)
4. Recording state persists across page loads

### Without Opt-In Mode (OptInMode: false - default)

```javascript
SessionTracker.init({
  apiEndpoint: 'http://localhost:3001/api'
  // optIn and showWidget default to false
});
```

**Behavior:**
1. Page loads → Recording starts immediately
2. No widget shown
3. Always recording

## Configuration Options

### In appsettings.json

```json
{
  "CandleStick": {
    "ApiEndpoint": "http://localhost:3001/api",
    "Enabled": true,
    "OptInMode": true    // Set to true to enable opt-in mode
  }
}
```

### In Code (Alternative)

If you want to control it programmatically instead of config:

```html
<script>
  SessionTracker.init({
    apiEndpoint: 'http://localhost:3001/api',
    optIn: true,        // Require user to opt-in
    showWidget: true,   // Show the control widget
    userId: '@User.Identity.Name'
  });
</script>
```

## Use Cases

### Development: Auto-Record
```json
// appsettings.Development.json
{
  "CandleStick": {
    "OptInMode": false  // Always record in dev
  }
}
```

### Production: User Choice
```json
// appsettings.Production.json
{
  "CandleStick": {
    "OptInMode": true   // Let users decide in production
  }
}
```

### Privacy-Sensitive Apps
```json
{
  "CandleStick": {
    "OptInMode": true   // Always require consent
  }
}
```

### Internal Tools
```json
{
  "CandleStick": {
    "OptInMode": false  // Auto-record for support purposes
  }
}
```

## Widget Customization

The widget is styled with inline CSS but you can customize it:

### Hide the Widget (but keep opt-in behavior)

```javascript
SessionTracker.init({
  apiEndpoint: 'http://localhost:3001/api',
  optIn: true,        // Require opt-in
  showWidget: false   // But don't show widget
});

// Then control it programmatically:
// window.candleStickTracker.start();
// window.candleStickTracker.stop();
```

### Custom Control Button

```html
<button onclick="toggleRecording()">
  Toggle Recording
</button>

<script>
  function toggleRecording() {
    if (window.candleStickTracker.isRecording()) {
      window.candleStickTracker.stop();
      console.log('Recording stopped');
    } else {
      window.candleStickTracker.start();
      console.log('Recording started');
    }
  }
</script>
```

## User Experience

### First Visit
1. User lands on your site
2. Sees the candle widget (dimmed)
3. Hovers over it: "Not recording - Click to start"
4. Clicks it → Recording starts
5. Widget brightens up

### Subsequent Visits
1. User returns to your site
2. Widget appears in previous state
3. If they were recording before, it auto-resumes
4. If they weren't, it stays off

### Privacy-Conscious Users
- Can immediately see if recording is active
- Can turn it off with one click
- Choice persists across sessions
- No hidden tracking

## Programmatic Control

### Check Recording Status

```javascript
if (window.candleStickTracker.isRecording()) {
  console.log('Currently recording');
} else {
  console.log('Not recording');
}
```

### Start Recording

```javascript
window.candleStickTracker.start();
```

### Stop Recording

```javascript
window.candleStickTracker.stop();
```

### Remove Widget

```javascript
window.candleStickTracker.removeWidget();
```

## Privacy & Compliance

### GDPR Compliance

Opt-in mode helps with GDPR compliance:

```json
{
  "CandleStick": {
    "OptInMode": true  // Users must explicitly consent
  }
}
```

### Privacy Policy Integration

```html
<div class="privacy-notice">
  <p>
    We use session recording to improve your experience.
    Click the candle icon (🕯️) in the bottom-right to control recording.
  </p>
</div>
```

### Conditional Opt-In

```csharp
@{
    // Only require opt-in for certain users
    var requireOptIn = !User.IsInRole("Internal");
}

<script>
  SessionTracker.init({
    apiEndpoint: '@Configuration["CandleStick:ApiEndpoint"]',
    optIn: @requireOptIn.ToString().ToLower(),
    showWidget: @requireOptIn.ToString().ToLower()
  });
</script>
```

## Troubleshooting

### Widget Not Appearing

**Check:**
1. Is `showWidget: true` set?
2. Is the SDK loaded successfully?
3. Any CSS conflicts hiding it?

**Debug:**
```javascript
console.log('Widget enabled:', window.candleStickTracker);
```

### Widget Appears But Doesn't Work

**Check:**
1. Browser console for errors
2. Backend API is running
3. `optIn: true` is set

**Debug:**
```javascript
window.candleStickTracker.start();  // Try starting manually
console.log('Recording:', window.candleStickTracker.isRecording());
```

### Recording Doesn't Persist

**Cause:** Browser blocking localStorage

**Fix:** Check browser privacy settings, ensure localStorage is enabled

## Examples

### Example 1: Simple Opt-In

```javascript
SessionTracker.init({
  apiEndpoint: 'http://localhost:3001/api',
  optIn: true,
  showWidget: true
});
```

### Example 2: Opt-In with User Info

```javascript
SessionTracker.init({
  apiEndpoint: 'http://localhost:3001/api',
  optIn: true,
  showWidget: true,
  userId: '@User.Identity.Name',
  userName: '@User.Claims.FirstOrDefault(c => c.Type == "name")?.Value'
});
```

### Example 3: Environment-Based

```csharp
@{
    var optInMode = Configuration.GetValue<bool>("CandleStick:OptInMode");
}

<script>
  SessionTracker.init({
    apiEndpoint: '@Configuration["CandleStick:ApiEndpoint"]',
    optIn: @optInMode.ToString().ToLower(),
    showWidget: @optInMode.ToString().ToLower(),
    userId: '@User.Identity.Name'
  });
</script>
```

### Example 4: Custom Styling

```html
<style>
  /* Override widget position */
  #candlestick-widget {
    bottom: 80px !important;  /* Move up if you have a footer */
    right: 20px !important;
  }
</style>
```

## Best Practices

### ✅ Do

- Enable opt-in mode for public-facing apps
- Show the widget so users know they're in control
- Mention the widget in your privacy policy
- Test the widget on mobile devices

### ❌ Don't

- Hide the widget while requiring opt-in (confusing)
- Force recording without user consent
- Remove the widget without providing alternative controls
- Forget to test the user experience

## Summary

**Opt-in mode gives users control:**

```json
// appsettings.json
{
  "CandleStick": {
    "OptInMode": true  // ← Add this line
  }
}
```

**That's it!** The widget appears automatically and users can control their recording.

---

**Related Guides:**
- [Quick Start](QUICK-START.md)
- [Full README](README.md)
- [Troubleshooting](TROUBLESHOOTING.md)
