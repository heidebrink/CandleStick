// Simple environment detection for vanilla HTML/JS apps
const CandleStickConfig = {
  getConfig() {
    const hostname = window.location.hostname;
    
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return {
        apiEndpoint: 'http://localhost:3001/api',
        enabled: true
      };
    }
    
    // QA/Staging
    if (hostname.includes('qa.') || hostname.includes('staging.')) {
      return {
        apiEndpoint: 'https://tracking-api-qa.yourapp.com/api',
        enabled: true
      };
    }
    
    // Production
    return {
      apiEndpoint: 'https://tracking-api.yourapp.com/api',
      enabled: true
    };
  }
};

// Usage:
// const config = CandleStickConfig.getConfig();
// if (config.enabled) {
//   SessionTracker.init({
//     apiEndpoint: config.apiEndpoint,
//     userId: currentUser.id,
//     appName: 'My App'
//   });
// }
