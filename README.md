# Room Dashboard

A free, self-hosted, always-on personal room display built for a 10th‑gen iPad in landscape mode. Plain HTML/CSS/JS — no build step, no backend, no paid services.

## Files

```
index.html   structure
styles.css   dark theme, layout, night mode, settings panel
app.js       clock, weather, air quality, news, calendar, reminders, sun & moon, settings
README.md    this file
```

## 1. Deploy to GitHub Pages (free)

1. Create a new **public** GitHub repository (e.g. `room-dashboard`).
2. Upload `index.html`, `styles.css`, and `app.js` to the root of the repo.
3. Go to **Settings → Pages**.
4. Under "Build and deployment", set **Source: Deploy from a branch**, branch `main`, folder `/ (root)`. Save.
5. GitHub gives you a URL like `https://yourusername.github.io/room-dashboard/`. It can take a minute to go live the first time.

That's it — no server, no build process, no environment variables.

## 2. Put it on the iPad

1. Open the GitHub Pages URL in **Safari** on the iPad.
2. Tap the **Share** icon → **Add to Home Screen**.
3. Open the app from the Home Screen icon — it launches full-screen, without Safari's address bar, and behaves like a standalone app.
4. Rotate to **landscape** and prop up the iPad. Turn on **Guided Access** (Settings → Accessibility → Guided Access) if you want to lock it into this one app so nothing else can be opened by accident, and consider disabling Auto-Lock (Settings → Display & Brightness → Auto-Lock → Never) since this is meant to stay on.

## 3. Set your location (do this first)

Tap the **⚙** button in the bottom-right corner → **Location** tab → type a city into the search box and tap a result. Coordinates update immediately and weather/air quality refetch automatically. This is stored in the browser (`localStorage`), so it survives refreshes and persists per-device — you'll set it once per iPad/browser.

## 4. Where every setting lives

The ⚙ button opens a slide-over panel with seven tabs:

- **Location** — city search (free geocoding), and a °F/mph vs °C/km/h units toggle.
- **Weather** — toggle which metrics appear on the Conditions card (feels like, rain chance, wind, humidity, pressure, UV, precipitation).
- **News** — toggle categories (Tech & AI, Business, Science & space, US, World, Automotive, Sports), toggle individual sources within those categories, set how many headlines show, and how often news refreshes.
- **Calendar** — add events (title, date, time, optional location) and remove existing ones. These are your events — nothing is fetched from an external calendar.

- **Sun & moon** — sunrise/sunset come from the same Open-Meteo weather request; moon phase and illumination are calculated locally, so moon information still works offline.
- **Reminders** — add or remove reminders. On the main dashboard, tap a reminder's circle to check it off.
- **Night mode** — start time, end time, and the alarm text shown overnight, plus a "Preview night mode" button so you can see it without waiting.
- **Display** — show/hide any individual card, and switch the clock between Regular and Large.

Everything is saved to `localStorage` the moment you change it — there's no "Save" button to forget to press.

## 5. Data sources used (all free, no API keys)

| Data | Source | Notes |
|---|---|---|
| Weather | [Open-Meteo Forecast API](https://open-meteo.com/) | No key, no rate-limit for personal use, CORS-enabled |
| Air quality | [Open-Meteo Air Quality API](https://open-meteo.com/) | US AQI + PM2.5, same terms as above |
| City search | [Open-Meteo Geocoding API](https://open-meteo.com/) | Free, no key |
| Hacker News | [Official Firebase API](https://github.com/HackerNews/API) | Free, no key, CORS-enabled directly |
| TechCrunch, Ars Technica, The Verge, MIT Technology Review, CNBC, NASA, Space.com | Each outlet's public RSS feed | Fetched through a CORS proxy — see limitation below |
| US / World / Business / Science / Automotive / Sports general news | Topic-specific [Google News RSS](https://news.google.com/rss) feeds | Also fetched through the CORS proxy |
| Quote of the day | A local, offline list rotated by day of year | No API — works even with no internet, so it's never "down" |

**All of the above are free with no subscription, no API key, and no usage limits that a single personal dashboard would ever hit.**

## 6. Known limitations (read this)

- **RSS + CORS.** Browsers block cross-origin requests to sites that don't send CORS headers, and most news outlets' RSS feeds don't. To read them from a static GitHub Pages site, the dashboard routes RSS fetches through `api.allorigins.win`, a free, public, key-less CORS proxy. This is the honest tradeoff for "100% free, no backend, static hosting": it works well in practice, but it's a third-party service Anthropic/you don't control — it can occasionally rate-limit or have downtime. Hacker News is fetched directly (no proxy needed) since its API sends proper CORS headers, so it's the most reliable source if you want a guaranteed-working baseline.
- If a source or the proxy is briefly down, that source is simply skipped for that refresh cycle — other sources still populate the news card, and if *every* source fails, the last successfully fetched headlines stay on screen with an "Updated Xm ago" label rather than showing an error.
- Same fallback behavior applies to weather and air quality: on a failed fetch, the last good reading is shown with its own "Updated X ago" label instead of a blank or broken card.
- If you want a more bulletproof long-term setup, you could later swap the RSS+proxy sources for a self-hosted RSS-to-JSON function (e.g. a free Cloudflare Worker) — the `fetchRSS()` function in `app.js` is the only place that would need to change.
- Calendar events and reminders are stored only in this browser's `localStorage`, per device — they don't sync with Apple Calendar/Reminders or any other app. Add them once in the settings panel and they'll persist across refreshes on that iPad.
- Everything (settings, cached weather/news/air data) is stored in Safari's `localStorage`. Clearing Safari's website data for this site, or using Private Browsing, will reset it.

## 7. Refresh intervals

- Clock: every second
- Weather / air quality: every 5 minutes
- News: every 10 minutes by default (configurable, 5–60 min)
- Calendar / next event countdown: every 60 seconds
- Reminders: instantly, on tap

## 8. Confirming this is free

Open-Meteo's forecast, air-quality, and geocoding APIs are free for non-commercial use with no key. Hacker News's API and all outlets' public RSS feeds are free to read. The CORS proxy (`allorigins.win`) is a free public service. GitHub Pages hosting is free for public repositories. There is nothing in this project that requires a credit card, a subscription, or an API key.

## 9. Apple Calendar (read-only) sync

The dashboard can now import an Apple Calendar that you publish as a **read-only public calendar link**.

1. On iPhone/iPad/Mac, open the Calendar app and enable **Public Calendar** for the calendar you want to display.
2. Copy the published calendar URL. Apple may give you a `webcal://...` URL; the dashboard accepts both `webcal://` and `https://` forms.
3. Open the dashboard → ⚙ → **Calendar**.
4. Paste the link into **Apple Calendar · read-only sync** and tap **Sync Apple Calendar**.
5. Events from the feed appear in the calendar, next-event card, and the event list with an **Apple** badge. They are read-only; local events remain editable separately.

The feed is refreshed every 15 minutes by default and the dashboard keeps the last successful copy if a refresh fails. Recurring daily/weekly/monthly/yearly events are expanded for the near-term dashboard window.

### Privacy warning

An Apple published calendar URL is effectively a **bearer link**: anyone who has the URL may be able to read that calendar. This dashboard stores the URL in Safari's local storage. When the browser cannot fetch the feed directly, it sends the URL to the same public CORS proxy used for RSS news (`api.allorigins.win`) so the static GitHub Pages app can read the ICS file. For a highly private calendar, use a dedicated/self-hosted proxy instead of a public proxy.


### Automatic live refresh
- Weather and air quality refresh every 5 minutes.
- Apple Calendar refreshes every 5 minutes when enabled.
- Calendar/event countdown UI re-renders every minute.
- News refresh interval defaults to 5 minutes and is configurable in Settings (minimum 3 minutes).
- News rotation remains separate from fetching, so headlines can rotate without repeatedly hitting feeds.
