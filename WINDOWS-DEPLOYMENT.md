# CandleStick Windows Deployment Guide

## Prerequisites

1. **Node.js 18+** - Download from https://nodejs.org
2. **SQL Server** - SQL Server Express or full version
3. **Git** - For cloning the repository

## Quick Setup

### 1. Clone and Install

```powershell
git clone https://github.com/heidebrink/CandleStick.git
cd CandleStick
npm install
cd server
npm install
```

### 2. Database Setup

**Option A: SQL Server Express (Recommended)**
```powershell
# Download SQL Server Express from Microsoft
# Create database during installation or use SSMS
```

**Option B: Use existing SQL Server**
```sql
-- Connect to your SQL Server and run:
CREATE DATABASE CandleStick;
```

### 3. Configure Environment

Copy and edit the environment file:
```powershell
copy server\.env.windows server\.env
notepad server\.env
```

Update with your SQL Server details:
```env
PORT=3001
NODE_ENV=production
CORS_ORIGIN=*

DB_SERVER=localhost
DB_NAME=CandleStick
DB_USER=sa
DB_PASSWORD=YourStrongPassword123!
DB_ENCRYPT=false
DB_TRUST_CERT=true
```

### 4. Build and Start

```powershell
# Build the server
cd server
npm run build:mssql

# Start the server
npm run start:mssql
```

## Production Deployment

### Option 1: Windows Service (Recommended)

Install PM2 for Windows service management:
```powershell
npm install -g pm2
npm install -g pm2-windows-service

# Install as Windows service
pm2-service-install
pm2 start dist/index-mssql.js --name "candlestick-api"
pm2 save
```

### Option 2: IIS with iisnode

1. Install IIS and iisnode
2. Create `web.config`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="dist/index-mssql.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="DynamicContent">
          <match url="/*" />
          <action type="Rewrite" url="dist/index-mssql.js"/>
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

### Option 3: Docker (Windows Containers)

```dockerfile
FROM node:18-windowsservercore
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --production
COPY server/dist ./dist
EXPOSE 3001
CMD ["node", "dist/index-mssql.js"]
```

## Troubleshooting

### TypeScript Errors

If you see TypeScript compilation errors:

```powershell
# Clean install
rm -rf node_modules package-lock.json
npm install

# Build with explicit flags
npm run build:mssql
```

### SQL Server Connection Issues

1. **Enable TCP/IP Protocol**:
   - Open SQL Server Configuration Manager
   - Enable TCP/IP for your SQL Server instance
   - Restart SQL Server service

2. **Firewall**:
   ```powershell
   # Allow SQL Server through Windows Firewall
   netsh advfirewall firewall add rule name="SQL Server" dir=in action=allow protocol=TCP localport=1433
   ```

3. **Authentication**:
   - Enable SQL Server Authentication
   - Create a user with appropriate permissions

### Common Fixes

**Error: "Cannot find module"**
```powershell
npm install --save-dev @types/node @types/express @types/cors
```

**Error: "esModuleInterop"**
- Already fixed in the updated `tsconfig.json`

**Error: "Database connection failed"**
- Check SQL Server is running: `services.msc`
- Verify connection string in `.env`
- Test connection with SSMS

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `production` |
| `CORS_ORIGIN` | Allowed origins | `https://yourapp.com` |
| `DB_SERVER` | SQL Server host | `localhost` |
| `DB_NAME` | Database name | `CandleStick` |
| `DB_USER` | Database user | `sa` |
| `DB_PASSWORD` | Database password | `YourPassword123!` |
| `DB_ENCRYPT` | Use encryption | `false` |
| `DB_TRUST_CERT` | Trust certificate | `true` |

## Monitoring

### Health Check

```powershell
curl http://localhost:3001/health
```

### Logs

```powershell
# PM2 logs
pm2 logs candlestick-api

# Windows Event Viewer
eventvwr.msc
```

## Security Considerations

1. **Change default passwords**
2. **Use Windows Authentication** if possible
3. **Enable SQL Server encryption** in production
4. **Configure proper CORS origins**
5. **Use HTTPS** in production
6. **Regular security updates**

## Performance Tuning

1. **SQL Server**:
   - Configure appropriate memory settings
   - Set up proper indexes
   - Regular maintenance plans

2. **Node.js**:
   - Use PM2 cluster mode
   - Configure connection pooling
   - Monitor memory usage

## Backup Strategy

```sql
-- Automated backup script
BACKUP DATABASE CandleStick 
TO DISK = 'C:\Backups\CandleStick_backup.bak'
WITH FORMAT, INIT;
```

## Support

- Check logs: `pm2 logs candlestick-api`
- Database issues: Use SQL Server Management Studio
- Windows-specific: Check Event Viewer
- General: GitHub Issues