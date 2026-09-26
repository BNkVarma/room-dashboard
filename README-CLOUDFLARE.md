# Apple Calendar proxy for Room Dashboard

The dashboard is a static GitHub Pages app. Safari cannot reliably fetch an Apple published ICS feed directly because of cross-origin restrictions, so this tiny Cloudflare Worker fetches the public Apple calendar and adds CORS headers.

## Deploy (free)

1. Create/sign in to a Cloudflare account.
2. Go to **Workers & Pages → Create → Worker**.
3. Choose **Start from scratch / Hello World**.
4. Replace the Worker code with `apple-calendar-worker.js` from this folder.
5. Deploy it.
6. Your Worker URL will look like:

   `https://room-dashboard-apple-calendar.YOUR-SUBDOMAIN.workers.dev`

7. The dashboard needs the `/calendar` endpoint:

   `https://room-dashboard-apple-calendar.YOUR-SUBDOMAIN.workers.dev/calendar`

8. Open Room Dashboard → Settings → Calendar.
9. Paste your Apple published calendar URL into **Apple Calendar**.
10. Paste the Worker `/calendar` URL into **Calendar proxy URL**.
11. Tap **Sync Apple Calendar**.

The Worker is deliberately restricted to HTTPS hosts under `icloud.com`; it is not a general-purpose open proxy.

Cloudflare's current Free Workers plan includes 100,000 requests/day, which is far beyond what a single iPad dashboard needs. See the official limits/pricing docs for current limits.
