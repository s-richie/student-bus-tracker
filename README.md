# Student Bus Tracker — Version 1

## What this version includes
- Responsive student dashboard
- Two demo bus routes
- Interactive SVG route map (no external map service required)
- Animated/simulated bus movement
- Bus stops and next-stop information
- Last-known position saved with localStorage
- Service Worker caching for offline use
- PWA manifest for installable-app behavior
- Online/offline status indicator

## How to run
A Service Worker does not normally work from `file://`, so use a local web server.

### Option A — VS Code
Install the **Live Server** extension, open this folder, then choose:
`Open with Live Server`

### Option B — Python
From this folder run:
`python -m http.server 8000`

Then open:
`http://localhost:8000`

## Test offline mode
1. Open the app through the local server.
2. Start the bus simulation.
3. Reload once so the Service Worker finishes caching.
4. Turn off the browser's network connection.
5. Reload the page.
6. The app UI, route, bus state, and last saved position should still work.

## Important
This is a Version 1 demo. The bus movement is simulated locally.

For real tracking, Version 2 should add:
- Driver login
- Driver GPS using `navigator.geolocation`
- PHP/MySQL or another backend API
- Periodic location uploads
- Student polling/WebSocket updates
- Authentication and role-based access
- Server-side timestamp and location validation

A remote bus cannot send a fresh GPS position to a student's phone while the student's phone has no network connection. Offline mode therefore shows the last location that was successfully received and cached.
