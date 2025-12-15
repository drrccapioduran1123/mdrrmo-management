# Progressive Web App (PWA) Implementation

## Overview

The MDRRMO Pio Duran File Inventory and Management System has been converted to a Progressive Web App (PWA), enabling offline functionality, app installation, and intelligent caching strategies.

## Features

### 1. **Offline Support**
- Service Worker caches static assets and API responses
- Three intelligent cache strategies:
  - **Network-first** for API calls (`/api/*`) - fetches fresh data, falls back to cache
  - **Cache-first** for static assets (JS, CSS, images, fonts) - uses cached versions
  - **Network with timeout** for fallback requests - tries network, uses cache if unavailable

### 2. **App Installation**
- Users can install the app on mobile and desktop devices
- Standalone app mode removes browser chrome for native app experience
- Custom app icon and splash screens
- Shortcuts to Dashboard, Maps, and Documents pages
- File sharing integration (share documents/images directly with the app)

### 3. **Periodic Update Checks**
- Service Worker checks for updates every 60 seconds
- Automatically caches new versions in background
- Notifies users when updates are available
- One-click update installation

### 4. **Online/Offline Status Detection**
- Real-time online/offline status tracking
- UI elements can adapt based on connectivity
- Graceful error handling when offline

## Architecture

### Files

#### `client/public/manifest.json`
Web App Manifest defining PWA metadata:
- App name, description, icons
- Display mode (standalone)
- Theme colors
- App shortcuts
- Share target configuration
- Screenshot metadata

#### `client/src/service-worker.ts`
Service Worker handling:
- Cache management (install, activate events)
- Fetch interception with strategy routing
- Message-based communication with clients
- Update detection and background sync

#### `client/src/hooks/use-pwa.ts`
React hooks providing:
- `usePWA()` - Service worker registration, update checks, install prompts
- `useOnlineStatus()` - Online/offline status tracking

#### `client/index.html`
Updated with:
- Manifest link: `<link rel="manifest" href="/manifest.json">`
- PWA meta tags for mobile browsers
- Apple Web App meta tags for iOS

#### `client/src/main.tsx`
Updated to:
- Initialize PWA on app start: `usePWA()`
- Register service worker if supported

#### `vite.config.ts`
Updated build configuration:
- Service worker bundled separately as `service-worker.js`
- Proper output structure for PWA deployment

## Cache Strategies

### API Requests (`/api/*`)
```
Network → Cache → Offline Response
```
Always tries to fetch fresh data from server. If offline or network fails, uses cached responses. If no cache exists, returns 503 Service Unavailable.

### Static Assets (JS, CSS, Images, Fonts)
```
Cache → Network (background)
```
Immediately serves from cache. Network requests update cache in background. New assets cached on first load.

### Navigation Requests
```
Cache → Network (5s timeout) → /index.html Fallback
```
Attempts to serve from cache. If not found, tries network (5-second timeout). Falls back to /index.html for app shell.

### Default Fallback
```
Network (5s timeout) → Cache → Offline Response
```
Attempts network request with 5-second timeout. Uses cache if network fails. Returns 503 if neither available.

## How It Works

### Installation Flow

1. User visits app on mobile/desktop
2. Browser detects manifest.json
3. "Add to Home Screen" prompt appears (automatic on some browsers)
4. User installs app → Service Worker registers
5. Offline functionality immediately available

### Update Detection Flow

1. Service Worker checks for updates every 60 seconds
2. If new version found, downloads in background
3. Dispatches `pwa-update` CustomEvent
4. UI shows "Update available" button
5. User clicks update → `SKIP_WAITING` message sent to service worker
6. Service Worker installs new version
7. Page reloads with new content

### Offline Usage Flow

1. User navigates pages while offline
2. Service Worker intercepts all requests
3. **API requests**: Return cached data if available, else 503 error
4. **Static assets**: Use cached versions
5. **Navigation**: Serve app shell (/index.html)
6. App remains fully functional with cached data
7. When online, syncs with server

## Configuration

### Cache Names
- `mdrrmo-v1` - Static assets cache (versioned for updates)
- `mdrrmo-runtime` - Dynamic assets cache
- `mdrrmo-api` - API responses cache

Update version number in service-worker.ts to force cache invalidation.

### Customization

**Update check interval**: Edit `use-pwa.ts` line ~50
```typescript
setInterval(() => registration?.update(), 60000); // Change 60000 ms
```

**Cache strategies**: Edit `service-worker.ts` `STATIC_ASSETS` array to add/remove files

**Offline response**: Customize in `service-worker.ts` fetch event handler

## Testing

### In Chrome DevTools
1. Open DevTools → Application tab
2. Check **Service Workers** section
3. Verify "Status: activated and running"
4. Check **Cache Storage** for stored data
5. **Network tab**: Throttle to "Offline" to test

### Install Testing
1. Mobile: Long-press homescreen → "Add to Home Screen"
2. Desktop: Browser menu → "Install app..."
3. Standalone mode removes address bar and browser UI

### Update Testing
1. Build and deploy new version
2. Open app → Service Worker detects new version
3. "Update available" button appears
4. Click update → page reloads with new content

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Worker | ✅ | ✅ | ✅ 11.1+ | ✅ |
| Web App Manifest | ✅ | ✅ | ⚠️ Limited | ✅ |
| Offline Caching | ✅ | ✅ | ✅ | ✅ |
| Install Prompt | ✅ | ✅ | ✅ (iOS) | ✅ |

## Building for Production

```bash
npm run build
```

Output structure:
```
dist/public/
  ├── index.html           # App shell
  ├── manifest.json        # PWA metadata
  ├── service-worker.js    # Service Worker (minified)
  └── assets/
      ├── main-*.js        # App bundle
      └── main-*.css       # Styles
```

Deploy entire `dist/public/` folder to web server.

**Important**: Serve with correct MIME types:
- `.js` → `application/javascript`
- `.json` → `application/json`

## Monitoring

Check service worker activity:
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('SW Registrations:', registrations);
});

// Check cache size
let total = 0;
caches.keys().then(names => {
  Promise.all(names.map(name => {
    return caches.open(name).then(cache => {
      return cache.keys().then(requests => {
        return Promise.all(requests.map(request => {
          return cache.match(request).then(response => {
            if (response) {
              total += response.headers.get('content-length') || 0;
            }
          });
        }));
      });
    });
  })).then(() => console.log(`Total cache size: ${(total / 1024 / 1024).toFixed(2)} MB`));
});
```

## Troubleshooting

### Service Worker Not Registering
- Check browser console for errors
- Ensure `/service-worker.js` is being served
- Clear site data: DevTools → Application → Clear storage

### Cache Not Working
- Verify cache names in service-worker.ts
- Check Network tab in DevTools for cache hit headers
- Clear cache and reload

### Update Not Showing
- Service Worker checks every 60 seconds
- May take up to 60s after deployment
- Force check: Reload page multiple times
- Check DevTools → Service Workers for new version

### Install Prompt Not Appearing
- Browser may suppress prompt if dismissed multiple times
- Reset site settings: Settings → Clear browsing data
- Ensure manifest.json is valid: Use [WebApp Manifest Validator](https://manifest-validator.appspot.com/)

## Future Enhancements

1. **Background Sync**: Queue offline actions, sync when online
2. **Push Notifications**: Server-sent notifications
3. **Periodic Background Sync**: Update data every X minutes
4. **Shared Storage**: Cache large datasets for offline analysis
5. **Workbox Integration**: Advanced caching strategies library

## References

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web App Manifest Spec](https://www.w3.org/TR/appmanifest/)
- [Service Worker Spec](https://w3c.github.io/ServiceWorker/)
- [Chrome PWA Checklist](https://web.dev/pwa-checklist/)
