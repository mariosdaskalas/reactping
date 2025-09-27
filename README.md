# reactping

ReactPing — client-only React app that performs HTTP-based "pings" from the browser.

What this project contains
- A Vite + React client in the `client/` folder. It measures latency by issuing HTTP requests
	(via fetch) or loading an Image as a fallback.

How to run locally
1. cd client
2. npm install
3. npm run dev

Vite will print the local dev URL (usually http://localhost:5173). Open that URL in your browser.

How to use the app
- Enter a full URL (recommended) or host (the app will prepend http:// if missing).
- Choose the number of pings and the interval in milliseconds.
- Start to begin a sequence of HTTP-based pings. The app will show per-request latency and a small
	summary (sent/received/average).