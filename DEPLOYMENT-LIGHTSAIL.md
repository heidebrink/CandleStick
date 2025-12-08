# Deploying CandleStick to AWS Lightsail

Guide for deploying CandleStick backend API and viewer to AWS Lightsail with SQL Server.

## Prerequisites

- AWS Lightsail instance (running)
- SQL Server installed on Lightsail
- Node.js 18+ installed on Lightsail
- Domain/subdomain for the API (optional but recommended)

## Architecture

```
Lightsail Instance
├── SQL Server (existing)
├── CandleStick API (Node.js) - Port 3001
└── CandleStick Viewer (Node.js) - Port 3000
```

## Step 1: Prepare SQL Server Database

### Create Database

Connect to your SQL Server and run:

```sql
CREATE DATABASE CandleStick;
GO

USE CandleStick;
GO

-- Sessions table
CREATE TABLE Sessions (
    Id NVARCHAR(100) PRIMARY KEY,
    StartTime BIGINT NOT NULL,
    UserId NVARCHAR(255),
    UserEmail NVARCHAR(255),
    UserName NVARCHAR(255),
    AppName NVARCHAR(255),
    OptInMode BIT DEFAULT 0,
    UserAgent NVARCHAR(500),
    ScreenResolution NVARCHAR(50),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Events table (stores JSON events)
CREATE TABLE SessionEvents (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    SessionId NVARCHAR(100) NOT NULL,
    EventData NVARCHAR(MAX) NOT NULL, -- JSON
    EventIndex INT NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (SessionId) REFERENCES Sessions(Id) ON DELETE CASCADE
);

-- Index for faster queries
CREATE INDEX IX_SessionEvents_SessionId ON SessionEvents(SessionId);
CREATE INDEX IX_Sessions_StartTime ON Sessions(StartTime DESC);
CREATE INDEX IX_Sessions_UserId ON Sessions(UserId);
```

### Create SQL Server User (if needed)

```sql
CREATE LOGIN candlestick_user WITH PASSWORD = 'YourSecurePassword123!';
GO

USE CandleStick;
GO

CREATE USER candlestick_user FOR LOGIN candlestick_user;
GO

ALTER ROLE db_datareader ADD MEMBER candlestick_user;
ALTER ROLE db_datawriter ADD MEMBER candlestick_user;
GO
```

## Step 2: Install Dependencies on Lightsail

SSH into your Lightsail instance:

```bash
ssh -i your-key.pem ubuntu@your-lightsail-ip
```

### Install Node.js (if not installed)

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Should be 18+
npm --version
```

### Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

## Step 3: Deploy CandleStick Files

### Option A: Using Git

```bash
cd /var/www
sudo git clone https://github.com/heidebrink/CandleStick.git
cd CandleStick
```

### Option B: Upload Files

```bash
# From your local machine
scp -i your-key.pem -r CandleStick ubuntu@your-lightsail-ip:/home/ubuntu/
```

Then on Lightsail:
```bash
sudo mv /home/ubuntu/CandleStick /var/www/
cd /var/www/CandleStick
```

## Step 4: Install SQL Server Driver

```bash
cd /var/www/CandleStick/server
npm install mssql
```

## Step 5: Configure Environment

Create production environment file:

```bash
cd /var/www/CandleStick/server
nano .env.production
```

Add:

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# SQL Server Configuration
DB_TYPE=mssql
DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=CandleStick
DB_USER=candlestick_user
DB_PASSWORD=YourSecurePassword123!
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true

# CORS Configuration (your QA app URL)
CORS_ORIGIN=https://qa.yourapp.com,https://yourapp.com

# Optional: If using domain for API
API_URL=https://candlestick-api.yourapp.com
```

## Step 6: Update Server Code for SQL Server

The server code needs to be updated to use SQL Server instead of file storage. I'll create this in the next step.

## Step 7: Build and Install

### Backend API

```bash
cd /var/www/CandleStick/server
npm install
npm run build  # If using TypeScript build
```

### Viewer App

```bash
cd /var/www/CandleStick/packages/viewer
npm install
npm run build
```

### SDK

```bash
cd /var/www/CandleStick/packages/sdk
npm install
npm run build
```

## Step 8: Start with PM2

### Start Backend API

```bash
cd /var/www/CandleStick/server
pm2 start npm --name "candlestick-api" -- run start
```

### Start Viewer

```bash
cd /var/www/CandleStick/packages/viewer
pm2 start npm --name "candlestick-viewer" -- run preview
```

### Save PM2 Configuration

```bash
pm2 save
pm2 startup  # Follow the instructions to enable auto-start
```

## Step 9: Configure Nginx (Reverse Proxy)

### Install Nginx

```bash
sudo apt-get update
sudo apt-get install -y nginx
```

### Configure API

```bash
sudo nano /etc/nginx/sites-available/candlestick-api
```

Add:

```nginx
server {
    listen 80;
    server_name candlestick-api.yourapp.com;  # Or use IP

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type' always;
    }
}
```

### Configure Viewer

```bash
sudo nano /etc/nginx/sites-available/candlestick-viewer
```

Add:

```nginx
server {
    listen 80;
    server_name candlestick.yourapp.com;  # Or use different port

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Enable Sites

```bash
sudo ln -s /etc/nginx/sites-available/candlestick-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/candlestick-viewer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 10: Configure Lightsail Firewall

### A. Lightsail Networking (AWS Console)

1. Go to AWS Lightsail Console
2. Select your instance
3. Click "Networking" tab
4. Add firewall rules:

```
Application     Protocol    Port range
HTTP            TCP         80
HTTPS           TCP         443
Custom          TCP         3000        (Viewer - optional, use Nginx instead)
Custom          TCP         3001        (API - optional, use Nginx instead)
```

**Recommended:** Only open ports 80 and 443, use Nginx as reverse proxy.

### B. Instance Firewall (UFW)

SSH into your instance and configure UFW:

```bash
# Check status
sudo ufw status

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow SSH (if not already allowed)
sudo ufw allow 22/tcp

# If accessing Node.js directly (not recommended for production)
# sudo ufw allow 3000/tcp
# sudo ufw allow 3001/tcp

# Enable firewall
sudo ufw enable
sudo ufw reload
```

**Note:** Lightsail browser-based SSH (Connect using SSH) only works on port 22 for Linux instances. Regular SSH access is unaffected.

## Step 11: SSL Certificate (Optional but Recommended)

### Using Let's Encrypt

```bash
sudo apt-get install -y certbot python3-certbot-nginx

# For API
sudo certbot --nginx -d candlestick-api.yourapp.com

# For Viewer
sudo certbot --nginx -d candlestick.yourapp.com
```

## Step 12: Update Your MVC App

Update your MVC app's configuration to point to the Lightsail API:

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

```bash
# API logs
pm2 logs candlestick-api

# Viewer logs
pm2 logs candlestick-viewer

# All logs
pm2 logs
```

### Restart Services

```bash
pm2 restart candlestick-api
pm2 restart candlestick-viewer
```

### Monitor Status

```bash
pm2 status
pm2 monit
```

### Database Maintenance

```sql
-- Check session count
SELECT COUNT(*) FROM Sessions;

-- Check storage size
EXEC sp_spaceused 'Sessions';
EXEC sp_spaceused 'SessionEvents';

-- Clean old sessions (older than 30 days)
DELETE FROM Sessions 
WHERE CreatedAt < DATEADD(day, -30, GETDATE());
```

## Backup Strategy

### Database Backup

```sql
BACKUP DATABASE CandleStick 
TO DISK = 'C:\Backups\CandleStick_backup.bak'
WITH FORMAT, COMPRESSION;
```

Or set up automated backups in SQL Server.

## Troubleshooting

### API Not Starting

```bash
# Check logs
pm2 logs candlestick-api --lines 100

# Check if port is in use
sudo netstat -tulpn | grep 3001

# Test SQL connection
cd /var/www/CandleStick/server
node -e "const sql = require('mssql'); sql.connect('Server=localhost;Database=CandleStick;User Id=candlestick_user;Password=YourPassword;').then(() => console.log('Connected!')).catch(err => console.error(err));"
```

### CORS Issues

Check your `.env.production` file has the correct CORS_ORIGIN.

### SQL Server Connection Issues

```bash
# Test SQL Server is running
sudo systemctl status mssql-server

# Check SQL Server logs
sudo tail -f /var/opt/mssql/log/errorlog
```

## Performance Tuning

### SQL Server Indexes

```sql
-- Add indexes for common queries
CREATE INDEX IX_Sessions_AppName ON Sessions(AppName);
CREATE INDEX IX_Sessions_CreatedAt ON Sessions(CreatedAt DESC);
```

### PM2 Cluster Mode

For better performance, run API in cluster mode:

```bash
pm2 start npm --name "candlestick-api" -i max -- run start
```

## Security Checklist

- [ ] SQL Server user has minimal permissions
- [ ] Strong passwords used
- [ ] SSL/TLS enabled
- [ ] Firewall configured
- [ ] CORS properly configured
- [ ] Regular backups scheduled
- [ ] Logs monitored
- [ ] PM2 auto-restart enabled

## Next Steps

1. Set up monitoring (e.g., CloudWatch, Datadog)
2. Configure log rotation
3. Set up automated backups
4. Create staging environment
5. Document rollback procedures
