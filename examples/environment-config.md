# Environment Configuration Guide

## Overview

CandleStick supports different environments (local, QA, production) through configuration.

## Server Configuration

### 1. Create Environment Files

Copy `.env.example` to create environment-specific files:

```bash
cd server
cp .env.example .env.local
cp .env.example .env.qa
cp .env.example .env.production
```

### 2. Configure Each Environment

**Local (.env.local)**
```env
PORT=3001
NODE_ENV=development
DATA_DIR=./data
CORS_ORIGIN=http://localhost:3000
```

**QA (.env.qa)**
```env
PORT=3001
NODE_ENV=qa
DATA_DIR=/var/candlestick/data
CORS_ORIGIN=https://qa.yourapp.com,https://qa-admin.yourapp.com
```

**Production (.env.production)**
```env
PORT=3001
NODE_ENV=production
DATA_DIR=/var/candlestick/data
CORS_ORIGIN=https://yourapp.com,https://admin.yourapp.com
```

### 3. Run Server with Environment

```bash
# Local
NODE_ENV=development node --env-file=.env.local dist/index.js

# QA
NODE_ENV=qa node --env-file=.env.qa dist/index.js

# Production
NODE_ENV=production node --env-file=.env.production dist/index.js
```

## Client SDK Configuration

### Option 1: Environment Variables (Recommended)

**ASP.NET MVC**
```csharp
// appsettings.json
{
  "CandleStick": {
    "ApiEndpoint": "https://tracking-api.yourapp.com/api"
  }
}

// _Layout.cshtml
<script>
  SessionTracker.init({
    apiEndpoint: '@Configuration["CandleStick:ApiEndpoint"]',
    userId: '@User.Identity.Name',
    appName: 'My App'
  });
</script>
```

**PHP**
```php
// config.php
define('CANDLESTICK_API', getenv('CANDLESTICK_API_ENDPOINT') ?: 'http://localhost:3001/api');

// index.php
<script>
  SessionTracker.init({
    apiEndpoint: '<?php echo CANDLESTICK_API; ?>',
    userId: '<?php echo $_SESSION["user_id"]; ?>',
    appName: 'My PHP App'
  });
</script>
```

**React/Next.js**
```javascript
// .env.local
NEXT_PUBLIC_CANDLESTICK_API=http://localhost:3001/api

// .env.production
NEXT_PUBLIC_CANDLESTICK_API=https://tracking-api.yourapp.com/api

// Component
SessionTracker.init({
  apiEndpoint: process.env.NEXT_PUBLIC_CANDLESTICK_API,
  userId: user.id,
  appName: 'My React App'
});
```

### Option 2: Build-Time Configuration

**JavaScript Build**
```javascript
// config.js
const config = {
  local: {
    apiEndpoint: 'http://localhost:3001/api'
  },
  qa: {
    apiEndpoint: 'https://tracking-api-qa.yourapp.com/api'
  },
  production: {
    apiEndpoint: 'https://tracking-api.yourapp.com/api'
  }
};

const env = process.env.NODE_ENV || 'local';
export default config[env];

// Usage
import config from './config';
SessionTracker.init({
  apiEndpoint: config.apiEndpoint,
  userId: currentUser.id,
  appName: 'My App'
});
```

### Option 3: Runtime Detection

```javascript
function getCandleStickConfig() {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return { apiEndpoint: 'http://localhost:3001/api' };
  } else if (hostname.includes('qa.')) {
    return { apiEndpoint: 'https://tracking-api-qa.yourapp.com/api' };
  } else {
    return { apiEndpoint: 'https://tracking-api.yourapp.com/api' };
  }
}

SessionTracker.init({
  ...getCandleStickConfig(),
  userId: currentUser.id,
  appName: 'My App'
});
```

## Deployment Examples

### Docker

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --production
COPY server/dist ./dist
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  candlestick-api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - CORS_ORIGIN=https://yourapp.com
      - DATA_DIR=/data
    volumes:
      - ./data:/data
```

### Kubernetes

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: candlestick-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: candlestick-api:latest
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3001"
        - name: CORS_ORIGIN
          valueFrom:
            configMapKeyRef:
              name: candlestick-config
              key: cors-origin
        volumeMounts:
        - name: data
          mountPath: /data
```

### AWS Elastic Beanstalk

```json
// .ebextensions/environment.config
{
  "option_settings": [
    {
      "namespace": "aws:elasticbeanstalk:application:environment",
      "option_name": "NODE_ENV",
      "value": "production"
    },
    {
      "namespace": "aws:elasticbeanstalk:application:environment",
      "option_name": "CORS_ORIGIN",
      "value": "https://yourapp.com"
    }
  ]
}
```

## Best Practices

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use environment variables** for sensitive data
3. **Separate API domains** per environment
4. **Enable CORS** only for trusted domains in production
5. **Use HTTPS** in QA and production
6. **Monitor API usage** per environment
7. **Set up different data storage** per environment

## Security Considerations

### Production Checklist

- [ ] HTTPS only
- [ ] Specific CORS origins (no wildcards)
- [ ] Rate limiting enabled
- [ ] Authentication/API keys
- [ ] Data encryption at rest
- [ ] Regular backups
- [ ] Monitoring and alerts
- [ ] Log rotation
