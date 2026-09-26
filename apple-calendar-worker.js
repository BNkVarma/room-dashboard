const ALLOWED_CALENDAR_HOST = /(^|\.)icloud\.com$/i;
const ALLOWED_FEED_HOSTS = new Set([
  "techcrunch.com",
  "feeds.arstechnica.com",
  "www.theverge.com",
  "www.technologyreview.com",
  "www.cnbc.com",
  "news.google.com",
  "www.nasa.gov",
  "www.space.com",
]);

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}
function response(body, status, origin, extra = {}) {
  return new Response(body, { status, headers: { ...cors(origin), ...extra } });
}
function hostAllowed(host, allowSet) {
  return allowSet.has(host) || [...allowSet].some(h => host.endsWith("." + h));
}

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") || "*";
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method !== "GET") return response("Method Not Allowed", 405, origin, { Allow: "GET, OPTIONS" });

    const incoming = new URL(request.url);
    const path = incoming.pathname;
    if (path !== "/calendar" && path !== "/rss") {
      return response("Use /calendar or /rss with ?url=<feed URL>", 404, origin, { "Content-Type": "text/plain; charset=utf-8" });
    }

    const raw = incoming.searchParams.get("url");
    if (!raw) return response("Missing url", 400, origin);

    let target;
    try {
      target = new URL(raw.replace(/^webcal(s?):\/\//i, "https://"));
    } catch {
      return response("Invalid URL", 400, origin);
    }
    if (target.protocol !== "https:") return response("Only HTTPS feeds are allowed", 403, origin);

    if (path === "/calendar") {
      if (!ALLOWED_CALENDAR_HOST.test(target.hostname)) {
        return response("Only Apple iCloud calendar URLs are allowed", 403, origin);
      }
    } else if (!hostAllowed(target.hostname, ALLOWED_FEED_HOSTS)) {
      return response("Feed host is not on the dashboard allowlist", 403, origin);
    }

    try {
      const upstream = await fetch(target.toString(), {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent": "RoomDashboard/1.1 FeedProxy",
          "Accept": path === "/calendar" ? "text/calendar,text/plain;q=0.9,*/*;q=0.5" : "application/rss+xml, application/xml, text/xml, text/plain;q=0.9,*/*;q=0.5",
        },
      });
      if (!upstream.ok) return response(`Upstream returned HTTP ${upstream.status}`, 502, origin);
      const text = await upstream.text();
      if (path === "/calendar" && !/BEGIN:VCALENDAR/i.test(text)) return response("The upstream response was not a valid iCalendar feed", 502, origin);
      if (path === "/rss" && !/<(?:rss|feed|rdf:RDF)\b/i.test(text)) return response("The upstream response was not a recognized RSS/Atom feed", 502, origin);
      return response(text, 200, origin, {
        "Content-Type": path === "/calendar" ? "text/calendar; charset=utf-8" : "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=300",
        "X-Room-Dashboard-Proxy": path === "/calendar" ? "cloudflare-apple-calendar" : "cloudflare-news-rss",
      });
    } catch (err) {
      return response(`Could not connect to upstream feed: ${err?.message || "network error"}`, 502, origin);
    }
  },
};
