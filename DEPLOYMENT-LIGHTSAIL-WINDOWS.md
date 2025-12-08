# Deploying CandleStick to AWS Lightsail (Windows)

Complete guide for deploying CandleStick to Windows Server on AWS Lightsail with SQL Server.

## Prerequisites

- AWS Lightsail Windows instance (running)
- SQL Server installed on Lightsail
- RDP access to the instance
- Administrator privileges

## Step 1: Connect via RDP

1. Go to AWS Lightsail Console
2. Click your instance
3. Click "Connect" → "Connect using RDP"
4. Or use Windows Remote Desktop with the IP and password from Lightsail

## Step 2: Install Node.js

### Download and Install

1. Open browser on the Lightsail instance
2. Go to https://nodejs.org/
3. Download the **LTS version** (18.x or higher)
4. Run the installer
5. Check "Automatically install necessary tools" (includes build tools)
6. Complete installation

### Verify Installation

Open **PowerShell** or **Command Prompt**:

```powershell
node --version
npm --version
```

Should show v18.x or higher.

## Step 3: Install PM2 (Process Manager)

Open **PowerShell as Administrator**:

```powershell
npm install -g pm2
npm install -g pm2-windows-startup

# Configure PM2 to start on boot
pm2-startup install
```

## Step 4: Setup SQL Server Database

### Option A: Using SQL Server Management Studio (SSMS)

1. Open **SQL Server Management Studio**
2. Connect to your SQL Server instance
3. Click "New Query"
4. Copy and paste the contents of `server/sql/setup.sql`
5. Click "Execute" (F5)

### Option B: Using Command Line

Open **Command Prompt**:

```cmd
cd C:\
sqlcmd -S localhost -U sa -P "YourSAPassword" -i "path\to\setup.sql"
```

### Verify Database

```sql
USE CandleStick;
GO

SELECT * FROM INFORMATION_SCHEMA.TABLES;
GO
```

Should show `Sessions` and `SessionEvents` tables.

## Step 5: Deploy CandleStick Files

### Option A: Download from GitHub

Open **PowerShell**:

```powershell
# Install Git if not already installed
winget install Git.Git

# Clone repository
cd C:\inetpub
git clone https://github.com/heidebrink/CandleStick.git
cd CandleStick
```

### Option B: Upload Files via RDP

1. On your local machine, compress the CandleStick folder to a ZIP file
2. In RDP session, copy the ZIP file (Ctrl+C on local, Ctrl+V in RDP)
3. Extract to `C:\inetpub\CandleStick`

### Option C: Use FTP/SFTP

Use FileZilla or WinSCP to upload files to the instance.

## Step 6: Install Dependencies

Open **PowerShell** in the CandleStick directory:

```powershell
cd C:\inetpub\CandleStick

# Install server dependencies
cd server
npm install

# Install viewer dependencies
cd ..\packages\viewer
npm install

# Install and build SDK
cd ..\sdk
npm install
npm run build

# Copy SDK to viewer
Copy-Item dist\session-tracker.umd.js ..\viewer\public\
```

## Step 7: Configure Environment

Create production environment file:

```powershell
cd C:\inetpub\CandleStick\server
notepad .env.production
```

Add the following:

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# SQL Server Configuration
DB_TYPE=mssql
DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=CandleStick
DB_USER=sa
DB_PASSWORD=YourSQLServerPassword
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true

# CORS Configuration
CORS_ORIGIN=https://qa.yourapp.com,https://yourapp.com
```

Save and close.

## Step 8: Build the Application

```powershell
cd C:\inetpub\CandleStick\server
npm run build:mssql

cd ..\packages\viewer
npm run build
```

## Step 9: Configure Windows Firewall

Open **PowerShell as Administrator**:

```powershell
# Allow Node.js through firewall
New-NetFirewallRule -DisplayName "CandleStick API" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
New-NetFirewallRule -DisplayName "CandleStick Viewer" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow

# Allow HTTP/HTTPS (if not already allowed)
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
```

## Step 10: Start Services with PM2

Open **PowerShell**:

```powershell
cd C:\inetpub\CandleStick\server

# Start API
pm2 start npm --name "candlestick-api" -- run start:mssql

# Start Viewer
cd ..\packages\viewer
pm2 start npm --name "candlestick-viewer" -- run preview

# Save PM2 configuration
pm2 save

# Verify services are running
pm2 status
```

## Step 11: Configure IIS (Optional - Recommended)

If you want to use IIS as a reverse proxy instead of accessing Node.js directly:

### Install IIS URL Rewrite and ARR

1. Download and install:
   - **URL Rewrite Module**: https://www.iis.net/downloads/microsoft/url-rewrite
   - **Application Request Routing (ARR)**: https://www.iis.net/downloads/microsoft/application-request-routing

### Configure IIS Site

1. Open **IIS Manager**
2. Right-click "Sites" → "Add Website"
3. Site name: `CandleStick-API`
4. Physical path: `C:\inetpub\CandleStick\server`
5. Binding: HTTP, Port 80, Host name: `candlestick-api.yourapp.com`

### Add web.config for Reverse Proxy

Create `C:\inetpub\CandleStick\server\web.config`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="ReverseProxyInboundRule" stopProcessing="true">
                    <match url="(.*)" />
                    <action type="Rewrite" url="http://localhost:3001/{R:1}" />
                </rule>
            </rules>
        </rewrite>
        <httpProtocol>
            <customHeaders>
                <add name="Access-Control-Allow-Origin" value="*" />
                <add name="Access-Control-Allow-Methods" value="GET, POST, OPTIONS" />
                <add name="Access-Control-Allow-Headers" value="Content-Type" />
            </customHeaders>
        </httpProtocol>
    </system.webServer>
</configuration>
```

Repeat for viewer on port 3000.

## Step 12: Test the Deployment

### Test API

Open browser on Lightsail instance:
```
http://localhost:3001/api/health
```

Should return: `{"status":"healthy","database":"connected"}`

### Test Viewer

```
http://localhost:3000
```

Should show the CandleStick viewer interface.

### Test from External

From your local machine:
```
http://YOUR_LIGHTSAIL_IP:3001/api/health
http://YOUR_LIGHTSAIL_IP:3000
```

## Step 13: Configure Lightsail Firewall

1. Go to AWS Lightsail Console
2. Select your instance
3. Click "Networking" tab
4. Add firewall rules:

```
Application     Protocol    Port
RDP             TCP         3389    (already exists)
HTTP            TCP         80
HTTPS           TCP         443
Custom          TCP         3000    (Viewer)
Custom          TCP         3001    (API)
```

## Step 14: Update Your MVC App

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

Or with domain:

```json
{
  "CandleStick": {
    "ApiEndpoint": "https://candlestick-api.yourapp.com/api",
    "Enabled": true,
    "OptInMode": true
  }
}
```

## Monitoring & Maintenance

### View Logs

```powershell
# View all logs
pm2 logs

# View specific service
pm2 logs candlestick-api
pm2 logs candlestick-viewer

# View last 100 lines
pm2 logs --lines 100
```

### Restart Services

```powershell
pm2 restart candlestick-api
pm2 restart candlestick-viewer

# Or restart all
pm2 restart all
```

### Check Status

```powershell
pm2 status
pm2 monit
```

### Update Deployment

```powershell
cd C:\inetpub\CandleStick

# Pull latest changes
git pull

# Rebuild
cd server
npm install
npm run build:mssql

cd ..\packages\viewer
npm install
npm run build

cd ..\packages\sdk
npm install
npm run build
Copy-Item dist\session-tracker.umd.js ..\viewer\public\

# Restart services
pm2 restart all
```

## Database Maintenance

### Backup Database

Open **SQL Server Management Studio**:

```sql
BACKUP DATABASE CandleStick 
TO DISK = 'C:\Backups\CandleStick_backup.bak'
WITH FORMAT, COMPRESSION;
```

Or via command line:

```cmd
sqlcmd -S localhost -U sa -Q "BACKUP DATABASE CandleStick TO DISK = 'C:\Backups\CandleStick_backup.bak' WITH FORMAT, COMPRESSION"
```

### Schedule Automated Backups

1. Open **SQL Server Management Studio**
2. Expand "SQL Server Agent"
3. Right-click "Jobs" → "New Job"
4. Create backup job with schedule

### Clean Old Sessions

```sql
-- Delete sessions older than 30 days
DELETE FROM Sessions 
WHERE CreatedAt < DATEADD(day, -30, GETDATE());
```

## Troubleshooting

### PM2 Services Won't Start

```powershell
# Check Node.js version
node --version

# Check if ports are in use
netstat -ano | findstr :3001
netstat -ano | findstr :3000

# Kill process if needed
taskkill /PID [PID_NUMBER] /F

# Check PM2 logs
pm2 logs --lines 50
```

### SQL Server Connection Failed

```powershell
# Test SQL Server connection
sqlcmd -S localhost -U sa -P "YourPassword" -Q "SELECT @@VERSION"

# Check SQL Server service
Get-Service MSSQLSERVER

# Start SQL Server if stopped
Start-Service MSSQLSERVER
```

### Can't Access from External IP

1. Check Windows Firewall rules
2. Check Lightsail firewall rules in AWS Console
3. Verify services are running: `pm2 status`
4. Check if ports are listening: `netstat -ano | findstr :3001`

### CORS Errors

Check `.env.production` has correct CORS_ORIGIN:

```env
CORS_ORIGIN=https://qa.yourapp.com,https://yourapp.com
```

Restart API after changes:

```powershell
pm2 restart candlestick-api
```

## Security Best Practices

### 1. Use Strong Passwords

- SQL Server SA password
- Windows Administrator password
- Create dedicated SQL user for CandleStick

### 2. Restrict SQL Server Access

```sql
-- Create dedicated user
CREATE LOGIN candlestick_user WITH PASSWORD = 'StrongPassword123!';
GO

USE CandleStick;
GO

CREATE USER candlestick_user FOR LOGIN candlestick_user;
ALTER ROLE db_datareader ADD MEMBER candlestick_user;
ALTER ROLE db_datawriter ADD MEMBER candlestick_user;
GO
```

Update `.env.production`:

```env
DB_USER=candlestick_user
DB_PASSWORD=StrongPassword123!
```

### 3. Enable HTTPS

- Get SSL certificate (Let's Encrypt, or use AWS Certificate Manager)
- Configure IIS with SSL binding
- Update CORS_ORIGIN to use https://

### 4. Regular Updates

```powershell
# Update Node.js packages
cd C:\inetpub\CandleStick\server
npm update

# Update PM2
npm update -g pm2
```

## Performance Tuning

### SQL Server Indexes

Already created by setup.sql, but verify:

```sql
USE CandleStick;
GO

-- Check indexes
SELECT * FROM sys.indexes 
WHERE object_id = OBJECT_ID('Sessions');
```

### PM2 Cluster Mode

For better performance on multi-core systems:

```powershell
pm2 delete candlestick-api
pm2 start npm --name "candlestick-api" -i max -- run start:mssql
pm2 save
```

## Production Checklist

- [ ] Node.js 18+ installed
- [ ] PM2 installed and configured for auto-start
- [ ] SQL Server database created
- [ ] Tables and indexes created
- [ ] Environment variables configured
- [ ] Windows Firewall rules added
- [ ] Lightsail firewall rules configured
- [ ] Services running (pm2 status shows "online")
- [ ] API health check returns success
- [ ] Viewer accessible
- [ ] MVC app configured with API endpoint
- [ ] SQL Server backups scheduled
- [ ] Strong passwords used
- [ ] CORS properly configured
- [ ] Monitoring set up

## Quick Reference Commands

```powershell
# Check service status
pm2 status

# View logs
pm2 logs

# Restart services
pm2 restart all

# Stop services
pm2 stop all

# Start services
pm2 start all

# Save PM2 config
pm2 save

# Test SQL connection
sqlcmd -S localhost -U sa -Q "SELECT @@VERSION"

# Check ports
netstat -ano | findstr :3001
netstat -ano | findstr :3000

# Check Windows Firewall
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*CandleStick*"}
```

## Support

- Full Linux guide: [DEPLOYMENT-LIGHTSAIL.md](DEPLOYMENT-LIGHTSAIL.md)
- Quick start: [LIGHTSAIL-QUICKSTART.md](LIGHTSAIL-QUICKSTART.md)
- SQL setup: [server/sql/setup.sql](server/sql/setup.sql)
- GitHub Issues: https://github.com/heidebrink/CandleStick/issues
