# Session Tracker - Integration Examples

This folder contains examples of how to integrate the Session Tracker SDK into different types of web applications.

## Universal Integration (Works Everywhere)

The SDK is a simple JavaScript file that works in any web application. Just add these two lines before your closing `</body>` tag:

```html
<script src="http://localhost:5173/session-tracker.umd.js"></script>
<script>
  var tracker = SessionTracker.init({
    apiEndpoint: 'http://localhost:3001/api'
  });
</script>
```

## Framework-Specific Examples

### Vanilla HTML/JavaScript
See: `vanilla-html/index.html`
- Pure HTML with no framework
- Works with any static site

### ASP.NET MVC
See: `asp-net-mvc/Views/Shared/_Layout.cshtml`
- Add to your `_Layout.cshtml` file
- Automatically tracks all pages

### Blazor (Server or WebAssembly)
See: `blazor/Pages/_Host.cshtml`
- Add to `_Host.cshtml` (Server) or `index.html` (WASM)
- Integrates with Blazor lifecycle

### React
See: `react/App.jsx`
- Load SDK dynamically in useEffect
- Works with Create React App, Next.js, etc.

### Angular
See: `angular/index.html`
- Add to `index.html`
- Initializes after Angular bootstrap

### Vue
See: `vue/index.html`
- Add to `index.html`
- Available globally to all components

### PHP
See: `php/index.php`
- Works with any PHP framework (Laravel, Symfony, etc.)
- Can pass PHP session data to tracker

## Production Deployment

For production, you'll want to:

1. **Host the SDK file** on your own CDN or server
2. **Update the apiEndpoint** to your production API
3. **Use environment variables** for configuration

Example production setup:

```html
<script src="https://cdn.yourcompany.com/session-tracker.umd.js"></script>
<script>
  SessionTracker.init({
    apiEndpoint: 'https://api.yourcompany.com/tracking'
  });
</script>
```

## Configuration Options

```javascript
SessionTracker.init({
  apiEndpoint: 'http://localhost:3001/api',  // Required: Your API endpoint
  sessionId: 'custom-id',                     // Optional: Custom session ID
  flushInterval: 5000,                        // Optional: How often to send data (ms)
  metadata: {                                 // Optional: Custom metadata
    userId: 'user123',
    environment: 'production'
  }
});
```

## Testing Your Integration

1. Add the SDK to your app
2. Open your app in a browser
3. Interact with your app (click, type, navigate)
4. Open http://localhost:3000 to view the recorded session
