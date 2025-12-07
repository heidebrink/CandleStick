# CandleStick Opt-In Mode

## Overview

Opt-in mode allows users to control when their session is being recorded. A clickable candle widget appears in the bottom-right corner, giving users full control over tracking.

## Why Use Opt-In Mode?

✅ **Privacy Compliance** - GDPR, CCPA, and other privacy regulations  
✅ **User Trust** - Transparent about tracking  
✅ **Selective Recording** - Only record when users consent  
✅ **Support/Debug Mode** - Users can enable tracking when reporting issues  

## How It Works

1. **Widget appears** in bottom-right corner (dim candle)
2. **User clicks candle** to start recording (candle lights up)
3. **Session is recorded** while candle is bright
4. **User clicks again** to stop recording (candle dims)
5. **Only recorded portions** are saved

## Implementation

### Basic Setup

```html
<script src="https://cdn.yourapp.com/candlestick/session-tracker.umd.js"></script>
<script>
  SessionTracker.init({
    apiEndpoint: 'https://tracking-api.yourapp.com/api',
    userId: currentUser.id,
    userName: currentUser.name,
    appName: 'My App',
    optIn: true,        // Enable opt-in mode
    showWidget: true    // Show the widget
  });
</script>
```

### ASP.NET MVC

```html
@inject IConfiguration Configuration

<script src="https://cdn.yourapp.com/candlestick/session-tracker.umd.js"></script>
<script>
  SessionTracker.init({
    apiEndpoint: '@Configuration["CandleStick:ApiEndpoint"]',
    userId: '@User.Identity.Name',
    userName: '@User.Identity.Name',
    userEmail: '@User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value',
    appName: 'My ASP.NET App',
    optIn: true,
    showWidget: true
  });
</script>
```

### PHP

```php
<script src="https://cdn.yourapp.com/candlestick/session-tracker.umd.js"></script>
<script>
  SessionTracker.init({
    apiEndpoint: '<?php echo getenv("CANDLESTICK_API_ENDPOINT"); ?>',
    userId: '<?php echo $_SESSION["user_id"]; ?>',
    userName: '<?php echo $_SESSION["user_name"]; ?>',
    appName: 'My PHP App',
    optIn: true,
    showWidget: true
  });
</script>
```

### React

```javascript
import { useEffect } from 'react';
import { useUser } from '@/hooks/useUser';

export function useCandleStickOptIn() {
  const user = useUser();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.yourapp.com/candlestick/session-tracker.umd.js';
    script.onload = () => {
      window.SessionTracker.init({
        apiEndpoint: process.env.NEXT_PUBLIC_CANDLESTICK_API,
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        appName: 'My React App',
        optIn: true,
        showWidget: true
      });
    };
    document.body.appendChild(script);
  }, [user]);
}
```

## Widget Customization

### Positioning

```javascript
// Default: bottom-right
SessionTracker.init({
  apiEndpoint: '/api',
  optIn: true,
  showWidget: true
});

// Custom positioning via CSS
const style = document.createElement('style');
style.textContent = `
  #candlestick-widget {
    bottom: 20px !important;
    left: 20px !important;  /* Move to bottom-left */
    right: auto !important;
  }
`;
document.head.appendChild(style);
```

### Hide Widget (Programmatic Control)

```javascript
const tracker = SessionTracker.init({
  apiEndpoint: '/api',
  optIn: true,
  showWidget: false  // No widget, control programmatically
});

// Start tracking programmatically
document.getElementById('start-tracking-btn').addEventListener('click', () => {
  tracker.resumeTracking();
});

// Stop tracking programmatically
document.getElementById('stop-tracking-btn').addEventListener('click', () => {
  tracker.pauseTracking();
});
```

## Use Cases

### 1. Support Mode

Enable tracking when users report issues:

```javascript
// Show "Enable Session Recording" button in support form
<button onclick="enableTracking()">
  🕯️ Enable Session Recording (helps us debug)
</button>

<script>
  const tracker = SessionTracker.init({
    apiEndpoint: '/api',
    optIn: true,
    showWidget: true
  });
  
  function enableTracking() {
    alert('Session recording enabled. Please reproduce the issue.');
    // Widget is already visible, user can click it
  }
</script>
```

### 2. Beta Testing

Let beta testers opt-in to tracking:

```javascript
if (user.isBetaTester) {
  SessionTracker.init({
    apiEndpoint: '/api',
    userId: user.id,
    appName: 'My App (Beta)',
    optIn: true,
    showWidget: true,
    metadata: {
      betaTester: true,
      betaGroup: user.betaGroup
    }
  });
}
```

### 3. Privacy-First Apps

For apps in regulated industries:

```javascript
// Show consent dialog first
if (await showConsentDialog()) {
  SessionTracker.init({
    apiEndpoint: '/api',
    userId: user.id,
    optIn: true,
    showWidget: true,
    metadata: {
      consentGiven: true,
      consentDate: new Date().toISOString()
    }
  });
}
```

### 4. Developer Mode

Enable tracking for developers/admins only:

```javascript
if (user.role === 'admin' || user.role === 'developer') {
  SessionTracker.init({
    apiEndpoint: '/api',
    userId: user.id,
    optIn: true,
    showWidget: true,
    metadata: {
      role: user.role,
      environment: 'production'
    }
  });
}
```

## Widget States

### 🕯️ Dim Candle (Not Recording)
- Flame is faint
- Eyes and smile are dim
- Tooltip: "Not recording - Click to start"
- No data is being captured

### 🕯️ Bright Candle (Recording)
- Flame is animated and bright
- Eyes and smile are visible
- Tooltip: "Recording session - Click to stop"
- Session data is being captured

## API Methods

```javascript
const tracker = SessionTracker.init({
  apiEndpoint: '/api',
  optIn: true,
  showWidget: true
});

// Check if currently recording
if (tracker.isRecording()) {
  console.log('Recording active');
}

// Get session ID
const sessionId = tracker.getSessionId();

// Remove widget (if needed)
tracker.removeWidget();

// Stop tracking completely
tracker.stop();
```

## Privacy Considerations

### What Users See

When opt-in mode is enabled:
1. Widget is visible at all times
2. Clear visual indicator of recording state
3. User has full control
4. No hidden tracking

### What Gets Recorded

- **Before user clicks**: Nothing
- **While candle is bright**: All interactions
- **After user clicks to stop**: Nothing
- **On page reload**: Starts in "not recording" state

### Best Practices

✅ **Be transparent** - Tell users what you're recording  
✅ **Respect choices** - Don't auto-enable on reload  
✅ **Provide value** - Explain why tracking helps  
✅ **Easy to disable** - One click to stop  
✅ **Visual feedback** - Clear recording state  

## Compliance

### GDPR Compliance

```javascript
// Only enable after explicit consent
if (userGaveConsent) {
  SessionTracker.init({
    apiEndpoint: '/api',
    optIn: true,
    showWidget: true,
    metadata: {
      gdprConsent: true,
      consentDate: new Date().toISOString()
    }
  });
}
```

### CCPA Compliance

```javascript
// Respect "Do Not Sell" preference
if (!user.doNotSell) {
  SessionTracker.init({
    apiEndpoint: '/api',
    optIn: true,
    showWidget: true
  });
}
```

## Testing

1. Open http://localhost:3000
2. Click "🕯️ Opt-In Mode" tab
3. Notice the candle widget in bottom-right (dim)
4. Interact with elements - not recorded
5. Click the candle - it lights up!
6. Interact again - now being recorded
7. Click candle again - recording stops
8. Go to "View Sessions" - see only recorded portions

## Summary

Opt-in mode gives users control over session recording:

- 🕯️ **Visual widget** shows recording state
- 🔒 **Privacy-first** - no recording without consent
- 👆 **One-click** toggle on/off
- ✅ **Compliance-ready** for GDPR, CCPA
- 🎯 **Perfect for** support, beta testing, regulated industries
