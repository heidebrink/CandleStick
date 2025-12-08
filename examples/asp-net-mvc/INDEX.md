# ASP.NET MVC Integration - Complete Guide

Welcome! This folder contains everything you need to integrate CandleStick session tracking into your ASP.NET MVC application.

## 📚 Documentation

Choose your path based on your needs:

### 🚀 Just Want to Get Started?
**[QUICK-START.md](QUICK-START.md)** - Get up and running in 5 minutes
- Minimal setup
- Copy-paste ready code
- Works immediately

### 📖 Want Complete Documentation?
**[README.md](README.md)** - Full integration guide
- All configuration options
- User identification
- Environment-specific setup
- Production deployment
- Privacy controls

### 🎛️ Want User Control?
**[OPT-IN-MODE.md](OPT-IN-MODE.md)** - Let users control recording
- Shows a widget in the corner
- Users click to start/stop recording
- Perfect for privacy compliance
- One config setting to enable

### 🔧 Running Into Issues?
**[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Solutions to common problems
- "SessionTracker is not defined"
- Sessions not appearing
- Razor syntax errors
- Performance issues
- Privacy concerns

### 📊 Want to Understand the Architecture?
**[SETUP-DIAGRAM.md](SETUP-DIAGRAM.md)** - Visual guide
- Architecture overview
- Data flow diagrams
- Port reference
- File locations
- Common mistakes

## 📁 Example Files

### Configuration
- `appsettings.json` - Development settings
- `appsettings.Production.json` - Production settings

### Views
- `Views/Shared/_Layout.cshtml` - Main layout with CandleStick integration
- `Views/Home/Index.cshtml` - Example page showing tracking

## ⚡ Quick Reference

### The Two Lines You Need

Add to your `_Layout.cshtml` before `</body>`:

```html
<script src="http://localhost:3000/session-tracker.umd.js"></script>
<script>
  SessionTracker.init({
    apiEndpoint: 'http://localhost:3001/api',
    userId: '@User.Identity.Name',
    appName: 'My MVC App'
  });
</script>
```

### Start CandleStick Services

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd packages/viewer && npm run dev
```

### View Your Sessions

Open http://localhost:3000

## 🎯 What You'll Get

- ✅ **Session Recording** - Every click, scroll, and interaction captured
- ✅ **Session Replay** - Watch exactly what users did
- ✅ **User Identification** - Know who each session belongs to
- ✅ **Zero Impact** - Fails gracefully, never breaks your app
- ✅ **Privacy-Focused** - Passwords automatically masked

## 🛠️ Recommended Reading Order

1. **First Time?** Start with [QUICK-START.md](QUICK-START.md)
2. **Want More Control?** Read [README.md](README.md)
3. **Hit a Snag?** Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
4. **Curious How It Works?** See [SETUP-DIAGRAM.md](SETUP-DIAGRAM.md)

## 💡 Common Use Cases

### Basic Tracking (Auto-Start)
```javascript
SessionTracker.init({
  apiEndpoint: 'http://localhost:3001/api'
});
```

### User-Controlled (Opt-In Mode)
```javascript
SessionTracker.init({
  apiEndpoint: 'http://localhost:3001/api',
  optIn: true,        // Don't auto-start
  showWidget: true    // Show control widget
});
```
Or simply set in `appsettings.json`:
```json
{
  "CandleStick": {
    "OptInMode": true
  }
}
```

### With User Info
```javascript
SessionTracker.init({
  apiEndpoint: 'http://localhost:3001/api',
  userId: '@User.Identity.Name',
  userName: '@User.Claims.FirstOrDefault(c => c.Type == "name")?.Value',
  userEmail: '@User.Claims.FirstOrDefault(c => c.Type == "email")?.Value'
});
```

### With Custom Metadata
```javascript
SessionTracker.init({
  apiEndpoint: 'http://localhost:3001/api',
  userId: '@User.Identity.Name',
  metadata: {
    environment: '@Environment.EnvironmentName',
    userRole: '@User.IsInRole("Admin") ? "Admin" : "User"',
    customField: 'value'
  }
});
```

### Environment-Specific
```csharp
@if (Configuration.GetValue<bool>("CandleStick:Enabled"))
{
    <script src="@Configuration["CandleStick:SdkUrl"]"></script>
    <script>
        SessionTracker.init({
            apiEndpoint: '@Configuration["CandleStick:ApiEndpoint"]',
            userId: '@User.Identity.Name'
        });
    </script>
}
```

## 🔗 Related Examples

Looking for other frameworks?

- [Vanilla HTML](../vanilla-html/) - Pure HTML/JavaScript
- [React](../react/) - React integration
- [Vue](../vue/) - Vue.js integration
- [Angular](../angular/) - Angular integration
- [PHP](../php/) - PHP integration
- [Blazor](../blazor/) - Blazor integration

## 📞 Support

### Quick Checks
1. Is the viewer app running? (http://localhost:3000)
2. Is the backend API running? (http://localhost:3001)
3. Can you access the SDK? (http://localhost:3000/session-tracker.umd.js)
4. Any errors in browser console?

### Still Stuck?
- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- Review [SETUP-DIAGRAM.md](SETUP-DIAGRAM.md)
- Look at the example files in this folder

## 🎓 Learn More

- [Main Project README](../../README.md)
- [All Examples](../README.md)
- [Integration Guide](../INTEGRATION-GUIDE.md)
- [User Identification Guide](../user-identification.md)

---

**Ready to start?** → [QUICK-START.md](QUICK-START.md)
