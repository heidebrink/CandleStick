-- CandleStick SQL Server Setup Script
-- Run this script on your SQL Server instance

-- Create database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'CandleStick')
BEGIN
    CREATE DATABASE CandleStick;
    PRINT 'Database CandleStick created successfully';
END
ELSE
BEGIN
    PRINT 'Database CandleStick already exists';
END
GO

USE CandleStick;
GO

-- Create Sessions table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Sessions')
BEGIN
    CREATE TABLE Sessions (
        Id NVARCHAR(100) PRIMARY KEY,
        StartTime BIGINT NOT NULL,
        UserId NVARCHAR(255) NULL,
        UserEmail NVARCHAR(255) NULL,
        UserName NVARCHAR(255) NULL,
        AppName NVARCHAR(255) NULL,
        OptInMode BIT DEFAULT 0,
        UserAgent NVARCHAR(500) NULL,
        ScreenResolution NVARCHAR(50) NULL,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE()
    );
    PRINT 'Table Sessions created successfully';
END
ELSE
BEGIN
    PRINT 'Table Sessions already exists';
END
GO

-- Create SessionEvents table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SessionEvents')
BEGIN
    CREATE TABLE SessionEvents (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        SessionId NVARCHAR(100) NOT NULL,
        EventData NVARCHAR(MAX) NOT NULL,
        EventIndex INT NOT NULL,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_SessionEvents_Sessions FOREIGN KEY (SessionId) 
            REFERENCES Sessions(Id) ON DELETE CASCADE
    );
    PRINT 'Table SessionEvents created successfully';
END
ELSE
BEGIN
    PRINT 'Table SessionEvents already exists';
END
GO

-- Create indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SessionEvents_SessionId')
BEGIN
    CREATE INDEX IX_SessionEvents_SessionId ON SessionEvents(SessionId);
    PRINT 'Index IX_SessionEvents_SessionId created';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Sessions_StartTime')
BEGIN
    CREATE INDEX IX_Sessions_StartTime ON Sessions(StartTime DESC);
    PRINT 'Index IX_Sessions_StartTime created';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Sessions_UserId')
BEGIN
    CREATE INDEX IX_Sessions_UserId ON Sessions(UserId);
    PRINT 'Index IX_Sessions_UserId created';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Sessions_AppName')
BEGIN
    CREATE INDEX IX_Sessions_AppName ON Sessions(AppName);
    PRINT 'Index IX_Sessions_AppName created';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Sessions_CreatedAt')
BEGIN
    CREATE INDEX IX_Sessions_CreatedAt ON Sessions(CreatedAt DESC);
    PRINT 'Index IX_Sessions_CreatedAt created';
END
GO

-- Create user (optional - adjust as needed)
-- IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'candlestick_user')
-- BEGIN
--     CREATE LOGIN candlestick_user WITH PASSWORD = 'YourSecurePassword123!';
--     PRINT 'Login candlestick_user created';
-- END
-- GO

-- USE CandleStick;
-- GO

-- IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'candlestick_user')
-- BEGIN
--     CREATE USER candlestick_user FOR LOGIN candlestick_user;
--     ALTER ROLE db_datareader ADD MEMBER candlestick_user;
--     ALTER ROLE db_datawriter ADD MEMBER candlestick_user;
--     PRINT 'User candlestick_user created and permissions granted';
-- END
-- GO

PRINT 'CandleStick database setup complete!';
PRINT 'Tables: Sessions, SessionEvents';
PRINT 'Indexes: Created for optimal query performance';
GO
