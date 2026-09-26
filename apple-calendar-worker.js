const ALLOWED_HOST = /(^|\.)icloud\.com$/i;

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
  return new Response(body, {
    status,
    headers: { ...cors(origin), ...extra },
  });
}

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") || "*";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(origin) });
    }
    if (request.method !== "GET") {
      return response("Method Not Allowed", 405, origin, { Allow: "GET, OPTIONS" });
    }

    const incoming = new URL(request.url);
    if (incoming.pathname !== "/calendar") {
      return response("Use /calendar?url=<Apple published calendar URL>", 404, origin, { "Content-Type": "text/plain; charset=utf-8" });
    }

    const raw = incoming.searchParams.get("url");
    if (!raw) return response("Missing url", 400, origin);

    let target;
    try {
      target = new URL(raw.replace(/^webcal(s?):\/\//i, "https://"));
    } catch {
      return response("Invalid calendar URL", 400, origin);
    }

    // This is intentionally a narrow proxy: it is for Apple published calendars,
    // not arbitrary URLs. This avoids turning the Worker into an open proxy.
    if (target.protocol !== "https:" || !ALLOWED_HOST.test(target.hostname)) {
      return response("Only Apple iCloud calendar URLs are allowed", 403, origin);
    }

    try {
      const upstream = await fetch(target.toString(), {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent": "RoomDashboard/1.0 AppleCalendarProxy",
          "Accept": "text/calendar,text/plain;q=0.9,*/*;q=0.5",
        },
      });

      // Apple/iCloud published calendar URLs can redirect. Follow the redirect
      // and validate the resulting response is still an iCalendar feed.
      if (!upstream.ok) {
        return response(`Apple calendar returned HTTP ${upstream.status}`, 502, origin);
      }

      const text = await upstream.text();
      if (!/BEGIN:VCALENDAR/i.test(text)) {
        return response("The upstream response was not a valid iCalendar feed", 502, origin);
      }

      return response(text, 200, origin, {
        "Content-Type": "text/calendar; charset=utf-8",
        "Cache-Control": "public, max-age=300",
        "X-Room-Dashboard-Proxy": "cloudflare-apple-calendar",
      });
    } catch (err) {
      return response("Could not connect to Apple Calendar", 502, origin);
    }
  },
};
