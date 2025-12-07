# User Identification in CandleStick

## Overview

CandleStick supports three user identification parameters to help you track and search sessions:

- **`userId`** - Database ID for searching/filtering
- **`userName`** - Display name for viewing in admin
- **`userEmail`** - Email address (optional)

## Basic Usage

```javascript
SessionTracker.init({
  apiEndpoint: '/api',
  userId: 'user_12345',        // Your database user ID
  userName: 'John Doe',         // Display name
  userEmail: 'john@example.com' // Optional
});
```

## Framework Examples

### ASP.NET MVC

```csharp
// _Layout.cshtml
<script src="https://cdn.yourapp.com/candlestick/session-tracker.umd.js"></script>
<script>
  SessionTracker.init({
    apiEndpoint: '@Configuration["CandleStick:ApiEndpoint"]',
    userId: '@User.FindFirstValue(ClaimTypes.NameIdentifier)',  // Database ID
    userName: '@User.Identity.Name',                             // Display name
    userEmail: '@User.FindFirstValue(ClaimTypes.Email)',        // Email
    appName: 'My ASP.NET App'
  });
</script>
```

### PHP / Laravel

```php
<!-- layout.blade.php -->
<script src="https://cdn.yourapp.com/candlestick/session-tracker.umd.js"></script>
<script>
  SessionTracker.init({
    apiEndpoint: '<?php echo env("CANDLESTICK_API_ENDPOINT"); ?>',
    userId: '<?php echo Auth::id(); ?>',              // Database ID
    userName: '<?php echo Auth::user()->name; ?>',    // Display name
    userEmail: '<?php echo Auth::user()->email; ?>',  // Email
    appName: 'My Laravel App'
  });
</script>
```

### React / Next.js

```javascript
// hooks/useCandleStick.js
import { useEffect } from 'react';
import { useUser } from '@/hooks/useUser';

export function useCandleStick() {
  const user = useUser();

  useEffect(() => {
    if (!user) return;

    const script = document.createElement('script');
    script.src = 'https://cdn.yourapp.com/candlestick/session-tracker.umd.js';
    script.onload = () => {
      window.SessionTracker.init({
        apiEndpoint: process.env.NEXT_PUBLIC_CANDLESTICK_API,
        userId: user.id,           // Database ID
        userName: user.name,       // Display name
        userEmail: user.email,     // Email
        appName: 'My React App'
  });
    };
    document.body.appendChild(script);
  }, [user]);
}
```

### Vue / Nuxt

```javascript
// plugins/candlestick.js
export default defineNuxtPlugin(() => {
  const user = useUser();
  
  if (!user.value) return;

  const script = document.createElement('script');
  script.src = 'https://cdn.yourapp.com/candlestick/session-tracker.umd.js';
  script.onload = () => {
    window.SessionTracker.init({
      apiEndpoint: import.meta.env.VITE_CANDLESTICK_API,
      userId: user.value.id,           // Database ID
      userName: user.value.name,       // Display name
      userEmail: user.value.email,     // Email
      appName: 'My Vue App'
    });
  };
  document.body.appendChild(script);
});
```

### Angular

```typescript
// services/candlestick.service.ts
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class CandleStickService {
  constructor(private auth: AuthService) {}

  init() {
    this.auth.user$.subscribe(user => {
      if (!user) return;

      const script = document.createElement('script');
      script.src = 'https://cdn.yourapp.com/candlestick/session-tracker.umd.js';
      script.onload = () => {
        (window as any).SessionTracker.init({
          apiEndpoint: environment.candlestick.apiEndpoint,
          userId: user.id,           // Database ID
          userName: user.name,       // Display name
          userEmail: user.email,     // Email
          appName: 'My Angular App'
        });
      };
      document.body.appendChild(script);
    });
  }
}
```

## Searching & Filtering

### In the Viewer

The CandleStick viewer automatically indexes these fields for searching:

1. **Filter by User** - Type in the search box:
   - Searches `userId`, `userName`, and `userEmail`
   - Case-insensitive
   - Partial matches work

2. **Display** - Sessions show:
   - 👤 **userName** (or userEmail or userId as fallback)
   - Session ID
   - Timestamp
   - Event count

### Via API

```bash
# Get all sessions (includes user info)
curl http://localhost:3001/api/sessions

# Response includes:
{
  "id": "session-id",
  "userId": "user_12345",
  "userName": "John Doe",
  "userEmail": "john@example.com",
  "startTime": 1234567890,
  "eventCount": 42
}
```

### Custom Backend Queries

If you're building your own admin interface:

```javascript
// Filter sessions by userId
const sessions = await fetch('/api/sessions')
  .then(r => r.json())
  .then(sessions => sessions.filter(s => s.userId === 'user_12345'));

// Find all sessions for a user
const userSessions = sessions.filter(s => 
  s.userId === targetUserId ||
  s.userName === targetUserName ||
  s.userEmail === targetEmail
);
```

## Best Practices

### 1. Always Include userId

```javascript
// ✅ Good - userId for database lookups
SessionTracker.init({
  apiEndpoint: '/api',
  userId: user.id,        // Database ID
  userName: user.name
});

// ❌ Bad - no userId
SessionTracker.init({
  apiEndpoint: '/api',
  userName: user.name  // Can't search by DB ID
});
```

### 2. Use userName for Display

```javascript
// ✅ Good - readable name
SessionTracker.init({
  apiEndpoint: '/api',
  userId: '12345',
  userName: 'John Doe'  // Easy to identify in admin
});

// ❌ Bad - hard to identify
SessionTracker.init({
  apiEndpoint: '/api',
  userId: '12345'
  // No userName - shows userId in admin
});
```

### 3. Handle Anonymous Users

```javascript
// For logged-out users
SessionTracker.init({
  apiEndpoint: '/api',
  userId: 'anonymous',
  userName: 'Anonymous User',
  metadata: {
    isAnonymous: true
  }
});

// Or don't track anonymous users at all
if (user.isLoggedIn) {
  SessionTracker.init({
    apiEndpoint: '/api',
    userId: user.id,
    userName: user.name
  });
}
```

### 4. Update User Info on Login

```javascript
// Initial load (anonymous)
let tracker = SessionTracker.init({
  apiEndpoint: '/api',
  userId: 'anonymous',
  userName: 'Guest'
});

// After login - stop old session, start new one
function onUserLogin(user) {
  if (tracker) {
    tracker.stop();
  }
  
  tracker = SessionTracker.init({
    apiEndpoint: '/api',
    userId: user.id,
    userName: user.name,
    userEmail: user.email
  });
}
```

## Privacy Considerations

### GDPR / CCPA Compliance

```javascript
// Only track after consent
if (userGaveConsent) {
  SessionTracker.init({
    apiEndpoint: '/api',
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    metadata: {
      consentGiven: true,
      consentDate: new Date().toISOString()
    }
  });
}
```

### PII Handling

```javascript
// Option 1: Hash sensitive data
SessionTracker.init({
  apiEndpoint: '/api',
  userId: hashUserId(user.id),  // Hashed ID
  userName: user.displayName,    // Public name only
  // Don't include email if not needed
});

// Option 2: Use pseudonyms
SessionTracker.init({
  apiEndpoint: '/api',
  userId: user.id,
  userName: user.username,  // Username, not real name
  // No email
});
```

## Troubleshooting

### User Info Not Showing

**Problem:** Sessions don't show user information

**Solution:** Check that you're passing the parameters:

```javascript
// ❌ Wrong
SessionTracker.init({
  apiEndpoint: '/api'
  // Missing user info
});

// ✅ Correct
SessionTracker.init({
  apiEndpoint: '/api',
  userId: user.id,
  userName: user.name
});
```

### Can't Search by User

**Problem:** Search doesn't find user sessions

**Solution:** Make sure userId/userName are strings:

```javascript
// ❌ Wrong - number
SessionTracker.init({
  userId: 12345  // Number
});

// ✅ Correct - string
SessionTracker.init({
  userId: '12345'  // String
});
```

### User Info Not Updating

**Problem:** User info is stale after login

**Solution:** Stop and restart tracking:

```javascript
// Stop old session
tracker.stop();

// Start new session with updated user info
tracker = SessionTracker.init({
  userId: newUser.id,
  userName: newUser.name
});
```

## Summary

**Required for good UX:**
- ✅ `userId` - For database lookups and filtering
- ✅ `userName` - For displaying in admin interface

**Optional but recommended:**
- ✅ `userEmail` - Additional identification
- ✅ `appName` - If tracking multiple apps

**Example:**
```javascript
SessionTracker.init({
  apiEndpoint: '/api',
  userId: user.id,        // Database ID
  userName: user.name,    // Display name
  userEmail: user.email,  // Email
  appName: 'My App'
});
```

This gives you full searchability and clear identification in your admin interface!
