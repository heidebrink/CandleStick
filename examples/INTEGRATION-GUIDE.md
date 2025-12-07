# CandleStick Integration Guide

## How Environment Configuration Works

**Key Concept**: You configure the CandleStick API endpoint in **your application's** environment configuration, not in CandleStick itself.

## Integration by Framework

### ASP.NET MVC / Blazor

**Step 1: Add to appsettings.json (Local/Dev)**
```json
{
  "CandleStick": {
    "ApiEndpoint": "http://localhost:3001/api",
    "Enabled": true
  }
}
```

**Step 2: Add to appsettings.Production.json**
```json
{
  "CandleStick": {
    "ApiEndpoint": "https://tracking-api.yourapp.com/api",
    "Enabled": true
  }
}
```

**Step 3: Add to appsettings.Staging.json (QA)**
```json
{
  "CandleStick": {
    "ApiEndpoint": "https://tracking-api-qa.yourapp.com/api",
    "Enabled": true
  }
}
```

**Step 4: Use in _Layout.cshtml**
```html
@inject IConfiguration Configuration

@if (Configuration.GetValue<bool>("CandleStick:Enabled"))
{
    <script src="https://cdn.yourapp.com/candlestick/session-tracker.umd.js"></script>
    <script>
        SessionTracker.init({
            apiEndpoint: '@Configuration["CandleStick:ApiEndpoint"]',
            userId: '@User.Identity.Name',
            userName: '@User.Identity.Name',
            userEmail: '@User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value',
            appName: 'My App'
        });
    </script>
}
```

---

### PHP / Laravel

**Step 1: Add to .env (Local)**
```env
CANDLESTICK_API_ENDPOINT=http://localhost:3001/api
CANDLESTICK_ENABLED=true
```

**Step 2: Add to .env.production**
```env
CANDLESTICK_API_ENDPOINT=https://tracking-api.yourapp.com/api
CANDLESTICK_ENABLED=true
```

**Step 3: Add to .env.staging (QA)**
```env
CANDLESTICK_API_ENDPOINT=https://tracking-api-qa.yourapp.com/api
CANDLESTICK_ENABLED=true
```

**Step 4: Use in your layout/template**
```php
<?php if (getenv('CANDLESTICK_ENABLED') === 'true'): ?>
    <script src="https://cdn.yourapp.com/candlestick/session-tracker.umd.js"></script>
    <script>
        SessionTracker.init({
            apiEndpoint: '<?php echo getenv("CANDLESTICK_API_ENDPOINT"); ?>',
            userId: '<?php echo $_SESSION["user_id"] ?? ""; ?>',
            userName: '<?php echo $_SESSION["user_name"] ?? ""; ?>',
            userEmail: '<?php echo $_SESSION["user_email"] ?? ""; ?>',
            appName: 'My PHP App'
        });
    </script>
<?php endif; ?>
```

---

### React / Next.js

**Step 1: Add to .env.local (Local)**
```env
NEXT_PUBLIC_CANDLESTICK_API=http://localhost:3001/api
NEXT_PUBLIC_CANDLESTICK_ENABLED=true
```

**Step 2: Add to .env.production**
```env
NEXT_PUBLIC_CANDLESTICK_API=https://tracking-api.yourapp.com/api
NEXT_PUBLIC_CANDLESTICK_ENABLED=true
```

**Step 3: Add to .env.staging (QA)**
```env
NEXT_PUBLIC_CANDLESTICK_API=https://tracking-api-qa.yourapp.com/api
NEXT_PUBLIC_CANDLESTICK_ENABLED=true
```

**Step 4: Create a hook/component**
```javascript
// hooks/useCandleStick.js
import { useEffect } from 'react';
import { useUser } from '@/hooks/useUser';

export function useCandleStick() {
  const user = useUser();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_CANDLESTICK_ENABLED !== 'true') {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.yourapp.com/candlestick/session-tracker.umd.js';
    script.onload = () => {
      window.SessionTracker.init({
        apiEndpoint: process.env.NEXT_PUBLIC_CANDLESTICK_API,
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        appName: 'My React App'
      });
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [user]);
}

// Use in _app.js or layout
import { useCandleStick } from '@/hooks/useCandleStick';

export default function App({ Component, pageProps }) {
  useCandleStick();
  
  return <Component {...pageProps} />;
}
```

---

### Vue / Nuxt

**Step 1: Add to .env (Local)**
```env
VITE_CANDLESTICK_API=http://localhost:3001/api
VITE_CANDLESTICK_ENABLED=true
```

**Step 2: Add to .env.production**
```env
VITE_CANDLESTICK_API=https://tracking-api.yourapp.com/api
VITE_CANDLESTICK_ENABLED=true
```

**Step 3: Create a plugin**
```javascript
// plugins/candlestick.js
export default defineNuxtPlugin(() => {
  if (import.meta.env.VITE_CANDLESTICK_ENABLED !== 'true') {
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://cdn.yourapp.com/candlestick/session-tracker.umd.js';
  script.onload = () => {
    const user = useUser();
    window.SessionTracker.init({
      apiEndpoint: import.meta.env.VITE_CANDLESTICK_API,
      userId: user.value?.id,
      userName: user.value?.name,
      userEmail: user.value?.email,
      appName: 'My Vue App'
    });
  };
  document.body.appendChild(script);
});
```

---

### Angular

**Step 1: Add to environment.ts (Local)**
```typescript
export const environment = {
  production: false,
  candlestick: {
    apiEndpoint: 'http://localhost:3001/api',
    enabled: true
  }
};
```

**Step 2: Add to environment.prod.ts**
```typescript
export const environment = {
  production: true,
  candlestick: {
    apiEndpoint: 'https://tracking-api.yourapp.com/api',
    enabled: true
  }
};
```

**Step 3: Create a service**
```typescript
// services/candlestick.service.ts
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CandleStickService {
  init(user: any) {
    if (!environment.candlestick.enabled) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.yourapp.com/candlestick/session-tracker.umd.js';
    script.onload = () => {
      (window as any).SessionTracker.init({
        apiEndpoint: environment.candlestick.apiEndpoint,
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        appName: 'My Angular App'
      });
    };
    document.body.appendChild(script);
  }
}

// Use in app.component.ts
export class AppComponent implements OnInit {
  constructor(
    private candlestick: CandleStickService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.auth.user$.subscribe(user => {
      if (user) {
        this.candlestick.init(user);
      }
    });
  }
}
```

---

## Summary: The Flow

```
┌─────────────────────────────────────────────────────────────┐
│ YOUR APPLICATION                                            │
│                                                             │
│  1. Read environment config                                 │
│     - Local: .env.local → http://localhost:3001/api        │
│     - QA: .env.staging → https://tracking-api-qa.com/api   │
│     - Prod: .env.production → https://tracking-api.com/api │
│                                                             │
│  2. Load CandleStick SDK                                    │
│     <script src="session-tracker.umd.js"></script>         │
│                                                             │
│  3. Initialize with YOUR environment's API endpoint         │
│     SessionTracker.init({                                   │
│       apiEndpoint: YOUR_ENV_CONFIG,                         │
│       userId: currentUser.id                                │
│     })                                                      │
│                                                             │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Sends tracking data
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ CANDLESTICK API SERVER                                      │
│                                                             │
│  - Local: http://localhost:3001                            │
│  - QA: https://tracking-api-qa.yourapp.com                 │
│  - Prod: https://tracking-api.yourapp.com                  │
│                                                             │
│  Stores session data                                        │
└─────────────────────────────────────────────────────────────┘
```

## Best Practices

1. ✅ **Always use environment variables** - Never hardcode API endpoints
2. ✅ **Enable/disable per environment** - Turn off in dev if needed
3. ✅ **Use different API endpoints** - Separate data per environment
4. ✅ **Host SDK on your CDN** - Don't rely on external URLs
5. ✅ **Check user consent** - Respect privacy laws (GDPR, CCPA)
6. ✅ **Add error handling** - Gracefully fail if SDK doesn't load

## Quick Start Checklist

- [ ] Add CandleStick config to your app's environment files
- [ ] Deploy CandleStick API server (local, QA, prod)
- [ ] Host the SDK file on your CDN or server
- [ ] Add SDK script tag to your app's layout/template
- [ ] Initialize with environment-specific API endpoint
- [ ] Test in each environment
- [ ] Monitor API usage and storage

## Need Help?

See `examples/` folder for complete working examples for each framework.
