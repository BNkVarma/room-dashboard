# Cloudflare Worker for Room Dashboard

Deploy `apple-calendar-worker.js` as a Cloudflare Worker. The dashboard uses the same Worker for:

- `/calendar?url=...` — Apple iCloud published calendars
- `/rss?url=...` — configured RSS/news feeds

## Deploy

1. Open Cloudflare Dashboard → Workers & Pages → your existing Worker.
2. Edit code and replace the Worker code with `apple-calendar-worker.js` from this package.
3. Deploy.
4. Keep the Worker URL in Dashboard → Settings → Calendar. Do not put the Apple calendar URL into the code.

## RSS reliability

Some publishers, especially Google News, may reject direct requests from Cloudflare Worker IPs. The Worker first tries the source directly, then falls back to two public RSS relays while keeping the browser-to-Worker connection CORS-safe.

The Worker only accepts hosts on its allowlist, so it is not an unrestricted open proxy.

## Dashboard settings

For Apple Calendar, enter your published `webcal://` link in the dashboard UI and enter the Worker URL in the proxy field.

For news, no separate proxy field is needed; news uses the same saved Worker URL.
