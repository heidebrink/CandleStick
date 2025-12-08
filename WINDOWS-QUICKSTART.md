# CandleStick Windows Deployment - Quick Start

Fast deployment for Windows Server on AWS Lightsail (via RDP).

## Prerequisites

- ✅ Windows Lightsail instance
- ✅ SQL Server installed
- ✅ RDP access

## 1. Connect via RDP (1 min)

AWS Lightsail Console → Your Instance → "Connect using RDP"

## 2. Install Node.js (5 min)

1. Open browser in RDP session
2. Go to https://nodejs.org/
3. Download LTS version (18.x+)
4. Run installer → Complete installation

Verify in **PowerShell**:
```powershell
node --version
npm --version
```

## 3. Install PM2 (2 min)

Open **PowerShell as Administrator**:

```powershell
npm install -g pm2
npm install -g pm2-windows-startup
pm2-startup install
```

## 4. Setup SQL Server (5 min)

Open **SQL Server Management Studio** (SSMS):

1. Connect to localhost
2. New Query
3. Copy/paste from `server/sql/setup.sql`
4. Execute (F5)

Or via command line:
```cmd
sqlcmd -S localhost -U sa -P "YourPassword" -i "C:\path\to\setup.sql"
```

## 5. Deploy Files (5 min)

### Option A: Git Clone

```powershell
cd C:\inetpub
git clone https://github.com/heidebrink/CandleStick.git
cd CandleStick
```

### Option B: Copy via RDP

1. Compress CandleStick folder on your PC
2. Copy (Ctrl+C) on your PC
3. Paste (Ctrl+V) in RDP session
4. Extract to `C:\inetpub\CandleStick`

## 6. Install & Build (10 min)

```powershell
cd C:\inetpub\CandleStick

# Server
cd server
npm install

# Viewer
cd ..\packages\viewer
npm install

# SDK
cd ..\sdk
npm install
npm run build
Copy-Item dist\session-tracker.umd.js ..\viewer\public\
```

## 7. Configure (3 min)

```powershell
cd C:\inetpub\CandleStick\server
notepad .env.production
```

Paste:

```env
PORT=3001
NODE_ENV=production
DB_SERVER=localhost
DB_DATABASE=CandleStick
DB_USER=sa
DB_PASSWORD=YourSQLPassword
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
CORS_ORIGIN=https://qa.yourapp.com
```

Save and close.

## 8. Build (3 min)

```powershell
cd C:\inetpub\CandleStick\server
npm run build:mssql

cd ..\packages\viewer
npm run build
```

## 9. Configure Firewall (2 min)

**PowerShell as Administrator**:

```powershell
New-NetFirewallRule -DisplayName "CandleStick API" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
New-NetFirewallRule -DisplayName "CandleStick Viewer" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

**AWS Lightsail Console** → Networking → Add rules:
- Custom TCP 3000
- Custom TCP 3001

## 10. Start Services (2 min)

```powershell
cd C:\inetpub\CandleStick\server
pm2 start npm --name "candlestick-api" -- run start:mssql

cd ..\packages\viewer
pm2 start npm --name "candlestick-viewer" -- run preview

pm2 save
pm2 status
```

## 11. Test (1 min)

Open browser in RDP:
- API: `http://localhost:3001/api/health`
- Viewer: `http://localhost:3000`

From your PC:
- API: `http://YOUR_LIGHTSAIL_IP:3001/api/health`
- Viewer: `http://YOUR_LIGHTSAIL_IP:3000`

## 12. Update MVC App

In your MVC app's `appsettings.json`:

```json
{
  "CandleStick": {
    "ApiEndpoint": "http://YOUR_LIGHTSAIL_IP:3001/api",
    "Enabled": true,
    "OptInMode": true
  }
}
```

## Done! 🎉

Total time: ~40 minutes

## Quick Commands

```powershell
# Check status
pm2 status

# View logs
pm2 logs

# Restart
pm2 restart all

# Test SQL
sqlcmd -S localhost -U sa -Q "SELECT @@VERSION"
```

## Troubleshooting

**Services won't start:**
```powershell
pm2 logs --lines 50
```

**SQL connection failed:**
```powershell
sqlcmd -S localhost -U sa -P "YourPassword" -Q "SELECT 1"
Get-Service MSSQLSERVER
```

**Can't access from outside:**
1. Check Windows Firewall rules
2. Check Lightsail firewall in AWS Console
3. Verify: `pm2 status` shows "online"

## Full Guide

See [DEPLOYMENT-LIGHTSAIL-WINDOWS.md](DEPLOYMENT-LIGHTSAIL-WINDOWS.md) for complete documentation.
