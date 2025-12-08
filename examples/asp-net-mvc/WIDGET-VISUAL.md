# Widget Visual Guide

## What the Widget Looks Like

When you enable opt-in mode, a candle widget appears in the bottom-right corner:

### Recording (Active)
```
┌─────────────────────────────────────┐
│                                     │
│  Your App Content                   │
│                                     │
│                                     │
│                              🕯️     │  ← Bright, animated
│                                     │     "Recording - Click to stop"
└─────────────────────────────────────┘
```

### Not Recording (Inactive)
```
┌─────────────────────────────────────┐
│                                     │
│  Your App Content                   │
│                                     │
│                                     │
│                              🕯      │  ← Dimmed
│                                     │     "Not recording - Click to start"
└─────────────────────────────────────┘
```

## Widget Features

- **Size:** 60x60 pixels
- **Position:** Fixed, bottom-right (20px from edges)
- **Hover:** Scales up to 110%
- **Click:** Toggles recording on/off
- **Animation:** Flame flickers when recording
- **Shadow:** Subtle drop shadow
- **Z-index:** 999999 (always on top)

## Enable It

Just add to your `appsettings.json`:

```json
{
  "CandleStick": {
    "OptInMode": true
  }
}
```

That's it! The widget appears automatically.

## See It In Action

1. Set `"OptInMode": true` in appsettings.json
2. Run your app
3. Look at bottom-right corner
4. Click the candle to toggle recording

---

For complete documentation, see [OPT-IN-MODE.md](OPT-IN-MODE.md)
