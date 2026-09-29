/* ==========================================================================
   Room Dashboard — app.js
   Vanilla JS, no build step. All data comes from free, key-less public APIs.
   ========================================================================== */

(function(){
"use strict";

/* --------------------------------------------------------------------
   1. CONFIG / CONSTANTS
   -------------------------------------------------------------------- */

const STORAGE_KEY = "roomDashboard.settings.v1";
const NEWS_CACHE_KEY = "roomDashboard.newsCache.v1";
const WEATHER_CACHE_KEY = "roomDashboard.weatherCache.v1";
const AIR_CACHE_KEY = "roomDashboard.airCache.v1";
const CALENDAR_CACHE_KEY = "roomDashboard.appleCalendarCache.v1";

// Public, free, key-less CORS proxy used only for feeds that don't send
// CORS headers themselves. See the README for the limitations of this.
const CORS_PROXY = "";
const FEED_PROXY_FALLBACK = "https://falling-term-61d5.nikhilvarma982000.workers.dev/";
const APPLE_CALENDAR_PROXY_FALLBACK = "";

const WEATHER_METRICS = [
  { key: "feelsLike", label: "Feels like" },
  { key: "rain",      label: "Rain probability" },
  { key: "wind",      label: "Wind" },
  { key: "humidity",  label: "Humidity" },
  { key: "pressure",  label: "Pressure" },
  { key: "uv",        label: "UV index" },
  { key: "precip",    label: "Precipitation" }
];

const NEWS_CATEGORIES = [
  { key: "tech",       label: "Tech & AI" },
  { key: "business",   label: "Business" },
  { key: "science",    label: "Science & space" },
  { key: "us",         label: "US news" },
  { key: "world",      label: "World news" },
  { key: "automotive", label: "Automotive" },
  { key: "sports",     label: "Sports" }
];

// Each source is either kind:"hn" (Hacker News official API, no proxy
// needed, CORS-friendly) or kind:"rss" (fetched through CORS_PROXY).
const NEWS_SOURCES = [
  { id: "hn",           name: "Hacker News",              category: "tech",       kind: "hn" },
  { id: "techcrunch",   name: "TechCrunch",                category: "tech",       kind: "rss", url: "https://techcrunch.com/feed/" },
  { id: "arstechnica",  name: "Ars Technica",              category: "tech",       kind: "rss", url: "https://feeds.arstechnica.com/arstechnica/index" },
  { id: "theverge",     name: "The Verge",                 category: "tech",       kind: "rss", url: "https://www.theverge.com/rss/index.xml" },
  { id: "mit",          name: "MIT Technology Review",     category: "tech",       kind: "rss", url: "https://www.technologyreview.com/feed/" },
  { id: "cnbc",         name: "CNBC",                      category: "business",   kind: "rss", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html" },
  { id: "googlebiz",    name: "Google News · Business",    category: "business",   kind: "rss", url: "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en" },
  { id: "nasa",         name: "NASA",                      category: "science",    kind: "rss", url: "https://www.nasa.gov/feed/" },
  { id: "space",        name: "Space.com",                 category: "science",    kind: "rss", url: "https://www.space.com/feeds/all" },
  { id: "googlesci",    name: "Google News · Science",     category: "science",    kind: "rss", url: "https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=en-US&gl=US&ceid=US:en" },
  { id: "googleus",     name: "Google News · US",          category: "us",         kind: "rss", url: "https://news.google.com/rss/headlines/section/geo/United%20States?hl=en-US&gl=US&ceid=US:en" },
  { id: "googleworld",  name: "Google News · World",       category: "world",      kind: "rss", url: "https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-US&gl=US&ceid=US:en" },
  { id: "googleauto",   name: "Google News · Automotive",  category: "automotive", kind: "rss", url: "https://news.google.com/rss/search?q=cars%20OR%20automotive%20when:2d&hl=en-US&gl=US&ceid=US:en" },
  { id: "googlesports", name: "Google News · Sports",      category: "sports",     kind: "rss", url: "https://news.google.com/rss/headlines/section/topic/SPORTS?hl=en-US&gl=US&ceid=US:en" }
];

const DISPLAY_CARDS = [
  { key: "weather",        label: "Weather" },
  { key: "weatherDetails", label: "Conditions" },
  { key: "airQuality",     label: "Air quality" },
  { key: "news",           label: "Live news" },
  { key: "clock",          label: "Clock" },
  { key: "calendar",       label: "Calendar" },
  { key: "nextEvent",      label: "Next event" },
  { key: "reminders",      label: "Reminders" },
  { key: "sunMoon",         label: "Sun & moon" }
];

// Short, calm quotes shown under the clock. Rotates once per day, fully
// offline — no API dependency, so it always works even with no internet.
const QUOTES = [
  "The quieter you become, the more you can hear.",
  "Simplicity is the ultimate sophistication.",
  "Slow is smooth, and smooth is fast.",
  "What we plant in the present, we harvest in the future.",
  "A calm mind brings inner strength and self-confidence.",
  "Small steps every day.",
  "Do the best you can until you know better.",
  "Rest is not idleness.",
  "The days are long, but the years are short.",
  "Nothing is permanent in this wicked world, not even our troubles.",
  "You are not obligated to finish everything in one day.",
  "Order and simplicity are the first steps toward mastery.",
  "Wherever you are, be there entirely.",
  "Well begun is half done.",
  "One day at a time.",
  "The best way out is always through.",
  "Have patience. All things are difficult before they become easy.",
  "Silence is a source of great strength.",
  "Look deep into nature, and you will understand everything better.",
  "Almost everything will work again if you unplug it for a few minutes, including you.",
  "It always seems impossible until it's done.",
  "Fall seven times, stand up eight.",
  "Little by little, one travels far.",
  "The mind is everything. What you think, you become.",
  "Be like water.",
  "Turn your face to the sun and the shadows fall behind you.",
  "Somewhere, something incredible is waiting to be known.",
  "Study hard what interests you the most.",
  "Out of clutter, find simplicity.",
  "Make each day your masterpiece."
];

const WMO = {
  0:  { text: "Clear sky",        icon: "sun",      bg: "clear"  },
  1:  { text: "Mostly clear",     icon: "sun",      bg: "clear"  },
  2:  { text: "Partly cloudy",    icon: "cloud-sun",bg: "cloudy" },
  3:  { text: "Overcast",         icon: "cloud",    bg: "cloudy" },
  45: { text: "Fog",              icon: "fog",      bg: "fog"    },
  48: { text: "Rime fog",         icon: "fog",      bg: "fog"    },
  51: { text: "Light drizzle",    icon: "rain",     bg: "rain"   },
  53: { text: "Drizzle",          icon: "rain",     bg: "rain"   },
  55: { text: "Dense drizzle",    icon: "rain",     bg: "rain"   },
  56: { text: "Freezing drizzle", icon: "rain",     bg: "rain"   },
  57: { text: "Freezing drizzle", icon: "rain",     bg: "rain"   },
  61: { text: "Light rain",       icon: "rain",     bg: "rain"   },
  63: { text: "Rain",             icon: "rain",     bg: "rain"   },
  65: { text: "Heavy rain",       icon: "rain",     bg: "rain"   },
  66: { text: "Freezing rain",    icon: "rain",     bg: "rain"   },
  67: { text: "Freezing rain",    icon: "rain",     bg: "rain"   },
  71: { text: "Light snow",       icon: "snow",     bg: "snow"   },
  73: { text: "Snow",             icon: "snow",     bg: "snow"   },
  75: { text: "Heavy snow",       icon: "snow",     bg: "snow"   },
  77: { text: "Snow grains",      icon: "snow",     bg: "snow"   },
  80: { text: "Rain showers",     icon: "rain",     bg: "rain"   },
  81: { text: "Rain showers",     icon: "rain",     bg: "rain"   },
  82: { text: "Violent showers",  icon: "rain",     bg: "rain"   },
  85: { text: "Snow showers",     icon: "snow",     bg: "snow"   },
  86: { text: "Snow showers",     icon: "snow",     bg: "snow"   },
  95: { text: "Thunderstorm",     icon: "storm",    bg: "storm"  },
  96: { text: "Thunderstorm",     icon: "storm",    bg: "storm"  },
  99: { text: "Thunderstorm",     icon: "storm",    bg: "storm"  }
};

/* --------------------------------------------------------------------
   2. ICONS (circles / rects / lines / polygons only — no path syntax)
   -------------------------------------------------------------------- */

function cloudShape(fill){
  return `<rect x="18" y="54" width="62" height="27" rx="13.5" fill="${fill}"/>
    <circle cx="36" cy="51" r="17" fill="${fill}"/>
    <circle cx="57" cy="45" r="21" fill="${fill}"/>
    <circle cx="75" cy="54" r="14" fill="${fill}"/>`;
}
function sunRays(cx, cy, r, color, rayLen){
  const rays = [0,45,90,135,180,225,270,315].map(deg => {
    const rad = deg * Math.PI/180;
    const x1 = cx + Math.cos(rad) * (r+6);
    const y1 = cy + Math.sin(rad) * (r+6);
    const x2 = cx + Math.cos(rad) * (r+6+rayLen);
    const y2 = cy + Math.sin(rad) * (r+6+rayLen);
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`;
  }).join("");
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>${rays}`;
}

const ICONS = {
  sun: () => `<svg viewBox="0 0 100 100">${sunRays(50,52,20,"var(--accent-amber)",10)}</svg>`,
  "cloud-sun": () => `<svg viewBox="0 0 100 100">
      ${sunRays(30,28,11,"var(--accent-amber)",6)}
      ${cloudShape("var(--text-secondary)")}
    </svg>`,
  cloud: () => `<svg viewBox="0 0 100 100">${cloudShape("var(--text-secondary)")}</svg>`,
  fog: () => `<svg viewBox="0 0 100 100">
      ${cloudShape("var(--text-tertiary)")}
      <g stroke="var(--text-tertiary)" stroke-width="4" stroke-linecap="round">
        <line x1="14" y1="90" x2="86" y2="90"/>
        <line x1="24" y1="78" x2="76" y2="78"/>
      </g>
    </svg>`,
  rain: () => `<svg viewBox="0 0 100 100">
      ${cloudShape("var(--text-secondary)")}
      <g stroke="var(--accent-blue)" stroke-width="4" stroke-linecap="round">
        <line x1="34" y1="90" x2="30" y2="100"/>
        <line x1="52" y1="94" x2="48" y2="104"/>
        <line x1="70" y1="90" x2="66" y2="100"/>
      </g>
    </svg>`,
  snow: () => `<svg viewBox="0 0 100 100">
      ${cloudShape("var(--text-secondary)")}
      <g fill="#DCE6F5">
        <circle cx="34" cy="92" r="3.5"/>
        <circle cx="52" cy="98" r="3.5"/>
        <circle cx="70" cy="92" r="3.5"/>
      </g>
    </svg>`,
  storm: () => `<svg viewBox="0 0 100 100">
      ${cloudShape("var(--text-secondary)")}
      <polygon points="58,58 42,84 52,84 46,100 68,72 56,72 62,58" fill="var(--accent-yellow)"/>
    </svg>`
};

function renderIcon(name){ return (ICONS[name] || ICONS.cloud)(); }

const MOON_PHASE_NAMES = [
  "New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous",
  "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"
];

function sunIcon(direction){
  const color = direction === "up" ? "var(--accent-amber)" : "var(--accent-orange)";
  const arrow = direction === "up"
    ? `<polygon points="50,6 41,20 59,20" fill="${color}"/>`
    : `<polygon points="50,54 41,40 59,40" fill="${color}"/>`;
  return `<svg viewBox="0 0 100 60">
    <line x1="8" y1="46" x2="92" y2="46" stroke="var(--text-tertiary)" stroke-width="3" stroke-linecap="round"/>
    <circle cx="50" cy="30" r="13" fill="${color}"/>
    ${arrow}
  </svg>`;
}

function moonIcon(k){
  const R = 30, cx = 50, cy = 50;
  const illum = 1 - Math.abs(1 - 2*k);
  const waxing = k < 0.5;
  const offset = 2 * R * illum * (waxing ? -1 : 1);
  return `<svg viewBox="0 0 100 100">
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="#E7E2D2"/>
    <circle cx="${(cx+offset).toFixed(1)}" cy="${cy}" r="${R}" fill="var(--bg-elevated)"/>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.5"/>
  </svg>`;
}

function moonPhaseFraction(date){
  const synodicMonth = 29.530588853;
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14, 0);
  const days = (date.getTime() - knownNewMoon) / 86400000;
  let phase = (days % synodicMonth) / synodicMonth;
  if(phase < 0) phase += 1;
  return phase;
}

/* --------------------------------------------------------------------
   3. SETTINGS
   -------------------------------------------------------------------- */

function defaultSettings(){
  return {
    location: { name: "Minneapolis, MN", lat: 44.9778, lon: -93.2650 },
    units: "imperial",
    weatherMetrics: { feelsLike:true, rain:true, wind:true, humidity:true, pressure:false, uv:false, precip:false },
    newsCategories: { tech:true, business:true, science:true, us:false, world:false, automotive:false, sports:false },
    newsSources: { hn:true, techcrunch:true, arstechnica:false, theverge:false, mit:false, cnbc:true, googlebiz:false, nasa:true, space:true, googlesci:false, googleus:false, googleworld:false, googleauto:false, googlesports:false },
    newsCount: 10,
    newsRefreshMinutes: 5,
    newsHeadlinesPerPage: 3,
    newsAutoRotate: true,
    appleCalendar: { enabled:false, url:"", refreshMinutes:5, proxyUrl:"" },
    appleCalendarEvents: [],
    calendarEvents: [
      { id: "evt-sample", title: "CCAR-F: Claude Certified Architect – Foundations", date: nextSaturdayISO(), time: "13:00", location: "" }
    ],
    reminders: [
      { id: "rem-1", text: "Practice guitar", done: false },
      { id: "rem-2", text: "Laundry", done: false },
      { id: "rem-3", text: "Check tomorrow's schedule", done: false }
    ],
    nightMode: { start: "22:00", end: "07:00", mode: "auto", alarmText: "Alarm · 7:00 AM" },
    display: {
      cards: { weather:true, weatherDetails:true, airQuality:true, news:true, clock:true, calendar:true, nextEvent:true, reminders:true, sunMoon:true },
      clockSize: "regular"
    }
  };
}

function nextSaturdayISO(){
  const d = new Date();
  const day = d.getDay();
  const add = (6 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + add);
  return d.toISOString().slice(0,10);
}

function reviveCalendarEvents(events){
  if(!Array.isArray(events)) return [];
  return events.map(ev => {
    if(!ev || typeof ev !== "object") return null;
    const out = { ...ev };
    if(out.start && !(out.start instanceof Date)) {
      const d = new Date(out.start);
      if(!Number.isNaN(d.getTime())) out.start = d;
    }
    if(out.end && !(out.end instanceof Date)) {
      const d = new Date(out.end);
      if(!Number.isNaN(d.getTime())) out.end = d;
    }
    return out;
  }).filter(ev => ev && ev.start instanceof Date && !Number.isNaN(ev.start.getTime()));
}

function loadSettings(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return defaultSettings();
    const parsed = JSON.parse(raw);
    // Shallow-merge with defaults so new fields introduced later don't break old saves.
    const def = defaultSettings();
    return {
      location: Object.assign({}, def.location, parsed.location),
      units: parsed.units || def.units,
      weatherMetrics: Object.assign({}, def.weatherMetrics, parsed.weatherMetrics),
      newsCategories: Object.assign({}, def.newsCategories, parsed.newsCategories),
      newsSources: Object.assign({}, def.newsSources, parsed.newsSources),
      newsCount: parsed.newsCount || def.newsCount,
      newsRefreshMinutes: parsed.newsRefreshMinutes || def.newsRefreshMinutes,
      newsHeadlinesPerPage: 3,
      newsAutoRotate: parsed.newsAutoRotate !== undefined ? !!parsed.newsAutoRotate : def.newsAutoRotate,
      appleCalendar: Object.assign({}, def.appleCalendar, parsed.appleCalendar),
      // A saved calendar URL is enough to enable background syncing. This
      // prevents an older settings record with enabled:false from disabling
      // automatic refresh after the user already configured the URL.
      ...(parsed.appleCalendar?.url ? { appleCalendar: Object.assign({}, def.appleCalendar, parsed.appleCalendar, { enabled: true }) } : {}),
      // localStorage serializes Date objects as strings; revive Apple events
      // before any code calls Date methods such as getTime().
      appleCalendarEvents: reviveCalendarEvents(parsed.appleCalendarEvents),
      calendarEvents: Array.isArray(parsed.calendarEvents) ? parsed.calendarEvents : def.calendarEvents,
      reminders: Array.isArray(parsed.reminders) ? parsed.reminders : def.reminders,
      nightMode: Object.assign({}, def.nightMode, parsed.nightMode),
      display: {
        cards: Object.assign({}, def.display.cards, parsed.display && parsed.display.cards),
        clockSize: (parsed.display && parsed.display.clockSize) || def.display.clockSize
      }
    };
  }catch(e){
    console.warn("Settings failed to load, using defaults", e);
    return defaultSettings();
  }
}

let settings = loadSettings();

function saveSettings(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function uid(prefix){
  return prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
}

/* --------------------------------------------------------------------
   4. DOM SHORTCUTS
   -------------------------------------------------------------------- */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const el = {
  ambient: $("#ambient"),
  clockTime: $("#clock-time"),
  clockDate: $("#clock-date"),
  clockQuote: $("#clock-quote"),
  clockCard: $("#card-clock"),
  nightOverlay: $("#night-overlay"),
  nightTime: $("#night-time"),
  nightAlarm: $("#night-alarm"),

  weatherIcon: $("#weather-icon"),
  weatherTemp: $("#weather-temp"),
  weatherCond: $("#weather-cond"),
  weatherPlace: $("#weather-place"),
  weatherHigh: $("#weather-high"),
  weatherLow: $("#weather-low"),
  freshWeather: $("#fresh-weather"),
  metricsGrid: $("#metrics-grid"),

  aqiNumber: $("#aqi-number"),
  aqiLabel: $("#aqi-label"),
  airDot: $("#air-dot"),
  airPm25: $("#air-pm25"),
  airPlace: $("#air-place"),
  freshAir: $("#fresh-air"),

  newsList: $("#news-list"),
  newsListSecondary: $("#news-list-secondary"),
  newsSecondaryTitle: $("#news-secondary-title"),
  newsSecondaryPage: $("#news-secondary-page"),
  freshNews: $("#fresh-news"),
  newsCategoryTitle: $("#news-category-title"),
  newsCategoryStrip: $("#news-category-strip"),
  newsPageIndicator: $("#news-page-indicator"),
  newsPrev: $("#news-prev"),
  newsNext: $("#news-next"),

  calTitle: $("#calendar-title"),
  calWeekdays: $("#calendar-weekdays"),
  calGrid: $("#calendar-grid"),
  calPrev: $("#calendar-prev"),
  calNext: $("#calendar-next"),
  upcomingEventsList: $("#upcoming-events-list"),
  eventCount: $("#event-count"),

  eventCountdown: $("#event-countdown"),
  eventName: $("#event-name"),
  eventMeta: $("#event-meta"),

  remindersList: $("#reminders-list"),

  sunriseIcon: $("#sunrise-icon"),
  sunsetIcon: $("#sunset-icon"),
  sunriseTime: $("#sunrise-time"),
  sunsetTime: $("#sunset-time"),
  moonIcon: $("#moon-icon"),
  moonPhase: $("#moon-phase"),
  moonIllum: $("#moon-illum"),

  settingsBtn: $("#settings-btn"),
  settingsPanel: $("#settings-panel"),
  settingsBackdrop: $("#settings-backdrop"),
  settingsClose: $("#settings-close")
};

/* --------------------------------------------------------------------
   5. CLOCK + NIGHT MODE + QUOTE
   -------------------------------------------------------------------- */

function dayOfYear(d){
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d - start;
  return Math.floor(diff / 86400000);
}

function timeStrToMinutes(str){
  const [h,m] = str.split(":").map(Number);
  return h*60 + m;
}

function isNightNow(now){
  const mode = settings.nightMode.mode || "auto";
  if(mode === "night") return true;
  if(mode === "day") return false;
  const startM = timeStrToMinutes(settings.nightMode.start);
  const endM = timeStrToMinutes(settings.nightMode.end);
  const nowM = now.getHours()*60 + now.getMinutes();
  if(startM === endM) return false;
  if(startM < endM){
    return nowM >= startM && nowM < endM;
  }
  // wraps past midnight
  return nowM >= startM || nowM < endM;
}

let forcedNightPreview = false;

function updateAmbientTimeClass(){
  const now = new Date();
  const hour = now.getHours() + now.getMinutes()/60;
  let timeClass = "time-day";
  if(hour >= 5.5 && hour < 7.5) timeClass = "time-dawn";
  else if(hour >= 7.5 && hour < 17.5) timeClass = "time-day";
  else if(hour >= 17.5 && hour < 20.5) timeClass = "time-dusk";
  else timeClass = "time-night";
  // Change only the time-of-day class. Keep the current weather class so the
  // background remains a combination of real weather + current time.
  el.ambient.classList.remove("time-dawn","time-day","time-dusk","time-night");
  el.ambient.classList.add(timeClass);
}

function tickClock(){
  const now = new Date();
  updateAmbientTimeClass();

  const timeStr = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  el.clockTime.textContent = timeStr;
  el.clockDate.textContent = dateStr;

  const night = forcedNightPreview || isNightNow(now);
  document.body.classList.toggle("night-mode", night);

  if(night){
    el.nightTime.textContent = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    el.nightAlarm.textContent = settings.nightMode.alarmText || "";
  }
}

function renderQuote(){
  const idx = dayOfYear(new Date()) % QUOTES.length;
  el.clockQuote.textContent = "\u201C" + QUOTES[idx] + "\u201D";
}

function applyClockSize(){
  el.clockCard.classList.toggle("large", settings.display.clockSize === "large");
}

/* --------------------------------------------------------------------
   6. FRESHNESS HELPER
   -------------------------------------------------------------------- */

function freshnessLabel(ts){
  if(!ts) return "—";
  const mins = Math.round((Date.now() - ts) / 60000);
  if(mins < 1) return "Updated just now";
  if(mins < 60) return `Updated ${mins}m ago`;
  const hrs = Math.round(mins/60);
  return `Updated ${hrs}h ago`;
}

/* --------------------------------------------------------------------
   7. WEATHER
   -------------------------------------------------------------------- */

function weatherCacheGet(){
  try{ return JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY)); }catch(e){ return null; }
}
function weatherCacheSet(data){
  localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
}

async function fetchWeather(){
  const { lat, lon } = settings.location;
  const imperial = settings.units === "imperial";
  const params = new URLSearchParams({
    latitude: lat, longitude: lon,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,is_day",
    hourly: "precipitation_probability,uv_index",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset",
    temperature_unit: imperial ? "fahrenheit" : "celsius",
    wind_speed_unit: imperial ? "mph" : "kmh",
    precipitation_unit: imperial ? "inch" : "mm",
    timezone: "auto",
    forecast_days: "7"
  });
  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if(!res.ok) throw new Error("weather http " + res.status);
  const json = await res.json();
  weatherCacheSet(json);
  return json;
}

function renderWeather(json, fromCacheTs){
  const c = json.current;
  const info = WMO[c.weather_code] || { text: "—", icon: "cloud", bg: "cloudy" };
  const isDay = c.is_day !== 0;

  el.weatherIcon.innerHTML = renderIcon(info.icon);
  el.weatherTemp.textContent = Math.round(c.temperature_2m) + "°";
  el.weatherCond.textContent = info.text;
  el.weatherPlace.textContent = settings.location.name;
  const daily = json.daily || {};
  const todayMax = daily.temperature_2m_max?.[0];
  const todayMin = daily.temperature_2m_min?.[0];
  const todayRain = daily.precipitation_probability_max?.[0];
  el.weatherHigh.textContent = "H:" + (Number.isFinite(todayMax) ? Math.round(todayMax) : "—") + "°";
  el.weatherLow.textContent = "L:" + (Number.isFinite(todayMin) ? Math.round(todayMin) : "—") + "°";
  const rainEl = document.querySelector("#weather-rain");
  if(rainEl) rainEl.textContent = "🌧 " + (Number.isFinite(todayRain) ? Math.round(todayRain) : "—") + "%";

  // Ambient background is deliberately a combination of the live weather
  // condition and the independently calculated time-of-day palette.
  // This keeps rain/fog/clouds visible even after sunset.
  const weatherClass = "weather-" + info.bg;
  el.ambient.classList.remove("weather-clear","weather-cloudy","weather-rain","weather-snow","weather-fog","weather-storm","weather-night","is-day","is-night");
  el.ambient.classList.add(weatherClass, isDay ? "is-day" : "is-night");
  updateAmbientTimeClass();

  renderForecast(json);

  // conditions / metrics grid
  const hourIdx = Math.max(0, json.hourly.time.indexOf(c.time.slice(0,13) + ":00"));
  const windUnit = settings.units === "imperial" ? "mph" : "km/h";
  const precipUnit = settings.units === "imperial" ? "in" : "mm";

  const values = {
    feelsLike: Math.round(c.apparent_temperature) + "°",
    rain: (json.hourly.precipitation_probability[hourIdx] ?? 0) + "%",
    wind: Math.round(c.wind_speed_10m) + " " + windUnit,
    humidity: Math.round(c.relative_humidity_2m) + "%",
    pressure: Math.round(c.surface_pressure) + " hPa",
    uv: (json.hourly.uv_index[hourIdx] ?? 0).toFixed(1),
    precip: (c.precipitation ?? 0) + " " + precipUnit
  };
  const labels = { feelsLike:"Feels like", rain:"Rain chance", wind:"Wind", humidity:"Humidity", pressure:"Pressure", uv:"UV index", precip:"Precipitation" };

  el.metricsGrid.innerHTML = "";
  WEATHER_METRICS.forEach(m => {
    if(!settings.weatherMetrics[m.key]) return;
    const div = document.createElement("div");
    div.className = "metric";
    div.innerHTML = `<span class="metric-label">${labels[m.key]}</span><span class="metric-value">${values[m.key]}</span>`;
    el.metricsGrid.appendChild(div);
  });

  el.freshWeather.textContent = freshnessLabel(fromCacheTs || Date.now());

  renderSunMoon(json);
}

function renderForecast(json){
  const list = document.querySelector("#forecast-list");
  if(!list || !json.daily?.time) return;

  const days = json.daily.time.slice(1, 8);
  const mins = json.daily.temperature_2m_min || [];
  const maxs = json.daily.temperature_2m_max || [];
  const rains = json.daily.precipitation_probability_max || [];
  const codes = json.daily.weather_code || [];
  const available = days.map((_, i) => ({ min: mins[i + 1], max: maxs[i + 1] })).filter(x => Number.isFinite(x.min) && Number.isFinite(x.max));
  const allTemps = available.flatMap(x => [x.min, x.max]);
  const rangeMin = allTemps.length ? Math.min(...allTemps) : 0;
  const rangeMax = allTemps.length ? Math.max(...allTemps) : 1;
  const span = Math.max(1, rangeMax - rangeMin);

  list.innerHTML = days.map((dateStr, offset) => {
    const i = offset + 1;
    const date = new Date(dateStr + "T12:00:00");
    const info = WMO[codes[i]] || { icon: "cloud", text: "—" };
    const min = mins[i];
    const max = maxs[i];
    const rain = rains[i];
    const left = Number.isFinite(min) ? ((min - rangeMin) / span) * 100 : 0;
    const width = Number.isFinite(min) && Number.isFinite(max) ? Math.max(8, ((max - min) / span) * 100) : 8;
    const day = date.toLocaleDateString(undefined, { weekday: "short" });
    const rainText = Number.isFinite(rain) ? Math.round(rain) + "%" : "—";
    return `<div class="forecast-row">
      <span class="forecast-day">${day}</span>
      <span class="forecast-icon" title="${info.text}">${renderIcon(info.icon)}</span>
      <span class="forecast-min">${Number.isFinite(min) ? Math.round(min) + "°" : "—"}</span>
      <span class="forecast-track"><span class="forecast-range" style="left:${left}%;width:${width}%"></span></span>
      <span class="forecast-max">${Number.isFinite(max) ? Math.round(max) + "°" : "—"}</span>
      <span class="forecast-rain">${rainText}</span>
    </div>`;
  }).join("");
}

function renderSunMoon(json){
  if(!el.sunriseTime) return;
  if(json.daily && json.daily.sunrise && json.daily.sunset){
    const sunrise = new Date(json.daily.sunrise[0]);
    const sunset = new Date(json.daily.sunset[0]);
    el.sunriseTime.textContent = sunrise.toLocaleTimeString(undefined, { hour:"numeric", minute:"2-digit" });
    el.sunsetTime.textContent = sunset.toLocaleTimeString(undefined, { hour:"numeric", minute:"2-digit" });
  }
  el.sunriseIcon.innerHTML = sunIcon("up");
  el.sunsetIcon.innerHTML = sunIcon("down");

  const k = moonPhaseFraction(new Date());
  const illum = Math.round((1 - Math.abs(1 - 2*k)) * 100);
  const idx = Math.round(k * 8) % 8;
  el.moonIcon.innerHTML = moonIcon(k);
  el.moonPhase.textContent = MOON_PHASE_NAMES[idx];
  el.moonIllum.textContent = illum + "% illuminated";
}

async function refreshWeather(){
  try{
    const json = await fetchWeather();
    renderWeather(json, Date.now());
  }catch(e){
    console.warn("Weather fetch failed, trying cache", e);
    const cached = weatherCacheGet();
    if(cached && cached.data){
      renderWeather(cached.data, cached.ts);
    }else{
      el.weatherCond.textContent = "Unavailable";
      el.freshWeather.textContent = "No data yet";
      renderSunMoon({}); // moon phase is computed locally and works offline
    }
  }
}

/* --------------------------------------------------------------------
   8. AIR QUALITY
   -------------------------------------------------------------------- */

function airCacheGet(){
  try{ return JSON.parse(localStorage.getItem(AIR_CACHE_KEY)); }catch(e){ return null; }
}
function airCacheSet(data){
  localStorage.setItem(AIR_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
}

function aqiCategory(aqi){
  if(aqi <= 50)  return { label: "Good", color: "var(--accent-green)" };
  if(aqi <= 100) return { label: "Moderate", color: "var(--accent-yellow)" };
  if(aqi <= 150) return { label: "Unhealthy for sensitive groups", color: "var(--accent-orange)" };
  if(aqi <= 200) return { label: "Unhealthy", color: "var(--accent-red)" };
  if(aqi <= 300) return { label: "Very unhealthy", color: "var(--accent-purple)" };
  return { label: "Hazardous", color: "var(--accent-red)" };
}

async function fetchAir(){
  const { lat, lon } = settings.location;
  const params = new URLSearchParams({
    latitude: lat, longitude: lon,
    current: "us_aqi,pm2_5",
    timezone: "auto"
  });
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if(!res.ok) throw new Error("air http " + res.status);
  const json = await res.json();
  airCacheSet(json);
  return json;
}

function renderAir(json, ts){
  const aqi = Math.round(json.current.us_aqi);
  const cat = aqiCategory(aqi);
  el.aqiNumber.textContent = isFinite(aqi) ? aqi : "—";
  el.aqiNumber.style.color = cat.color;
  el.aqiLabel.textContent = cat.label;
  el.airDot.style.background = cat.color;
  el.airDot.style.color = cat.color;
  el.airPm25.textContent = "PM2.5 " + json.current.pm2_5.toFixed(1);
  el.airPlace.textContent = settings.location.name;
  el.freshAir.textContent = freshnessLabel(ts);
}

async function refreshAir(){
  try{
    const json = await fetchAir();
    renderAir(json, Date.now());
  }catch(e){
    console.warn("Air quality fetch failed, trying cache", e);
    const cached = airCacheGet();
    if(cached && cached.data){
      renderAir(cached.data, cached.ts);
    }else{
      el.aqiLabel.textContent = "Unavailable";
      el.freshAir.textContent = "No data yet";
    }
  }
}

/* --------------------------------------------------------------------
   9. NEWS
   -------------------------------------------------------------------- */

function newsCacheGet(){
  try{ return JSON.parse(localStorage.getItem(NEWS_CACHE_KEY)); }catch(e){ return null; }
}
function newsCacheSet(items){
  localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify({ items, ts: Date.now() }));
}

function activeNewsSources(){
  return NEWS_SOURCES.filter(s => settings.newsCategories[s.category] && settings.newsSources[s.id]);
}

function cleanNewsText(value){
  if(!value) return "";
  const box = document.createElement("div");
  box.innerHTML = value;
  return (box.textContent || box.innerText || "").replace(/\s+/g, " ").trim();
}

function rssDescription(item){
  const candidates = [
    item.querySelector("description")?.textContent,
    item.querySelector("summary")?.textContent,
    item.querySelector("content")?.textContent
  ];
  // content:encoded is namespaced and may not be found by a simple selector.
  if(!candidates.some(Boolean)){
    const encoded = Array.from(item.children).find(n => /(^|:)encoded$/i.test(n.localName || n.nodeName || ""));
    if(encoded) candidates.push(encoded.textContent);
  }
  return cleanNewsText(candidates.find(Boolean) || "");
}

let newsByCategory = {};
let newsCategoryIndex = 0;
let newsPageIndex = 0;
let newsRotationTimer = null;
let newsTouchStartX = null;
let calendarViewDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let calendarTouchStartX = null;

function enabledNewsCategories(){
  const available = new Set(activeNewsSources().map(s => s.category));
  return NEWS_CATEGORIES.filter(c => settings.newsCategories[c.key] && available.has(c.key));
}

function newsPageDurationMs(){
  const categories = Math.max(1, enabledNewsCategories().length);
  const pages = Math.max(1, Math.ceil((settings.newsCount || 10) / Math.max(1, 3)));
  return Math.max(15000, Math.round((settings.newsRefreshMinutes * 60000) / categories / pages));
}

function renderNewsNavigation(){
  const cats = enabledNewsCategories();
  if(!cats.length){
    el.newsCategoryTitle.textContent = "Live news";
    el.newsCategoryStrip.innerHTML = "";
    el.newsPageIndicator.textContent = "—";
    return;
  }
  if(newsCategoryIndex >= cats.length) newsCategoryIndex = 0;
  const cat = cats[newsCategoryIndex];
  const items = newsByCategory[cat.key] || [];
  const perPage = Math.max(1, 3);
  const pages = Math.max(1, Math.ceil(items.length / perPage));
  if(newsPageIndex >= pages) newsPageIndex = 0;
  el.newsCategoryTitle.textContent = cat.label;
  el.newsCategoryStrip.innerHTML = cats.map((c,i)=>`<span class="news-category-pill ${i===newsCategoryIndex?'active':''}">${c.label}</span>`).join("");
  el.newsPageIndicator.textContent = `${newsPageIndex+1}/${pages}`;
}

function renderNewsItems(container, items){
  if(!container) return;
  container.innerHTML = "";
  const page = document.createElement("div");
  page.className = "news-page";
  if(!items.length){
    page.innerHTML = `<div class="news-empty">No headlines available for this category.</div>`;
  }
  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "news-item";
    const a = document.createElement("a");
    a.className = "news-title";
    a.href = item.url || "#";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = item.title;
    div.appendChild(a);
    if(item.description){
      const desc = document.createElement("div");
      desc.className = "news-description";
      desc.textContent = item.description;
      div.appendChild(desc);
    }
    const meta = document.createElement("div");
    meta.className = "news-meta";
    meta.innerHTML = `<span class="news-source">${escapeHtml(item.source || "News")}</span><span>${timeAgo(item.date)}</span>`;
    div.appendChild(meta);
    page.appendChild(div);
  });
  container.appendChild(page);
}

function renderCurrentNewsPage(ts){
  const cats = enabledNewsCategories();
  if(!cats.length){
    el.newsList.innerHTML = `<div class="news-empty">No categories or sources enabled. Choose some in settings.</div>`;
    if(el.newsListSecondary) el.newsListSecondary.innerHTML = `<div class="news-empty">No news configured.</div>`;
    el.freshNews.textContent = "—";
    if(el.newsSecondaryTitle) el.newsSecondaryTitle.textContent = "More news";
    if(el.newsSecondaryPage) el.newsSecondaryPage.textContent = "—";
    renderNewsNavigation();
    return;
  }
  renderNewsNavigation();
  const cat = cats[newsCategoryIndex];
  const items = newsByCategory[cat.key] || [];
  const perPage = 3;
  const start = newsPageIndex * perPage;
  const pageItems = items.slice(start, start + perPage);
  // The dashboard now uses one continuous news surface spanning columns 2–3.
  // Keep all three stories together so the typography and summaries stay readable.
  renderNewsItems(el.newsList, pageItems);
  el.freshNews.textContent = ts ? `Fetched ${freshnessLabel(ts).replace(/^Updated /, "")}` : "—";
}

function moveNews(delta){
  const cats = enabledNewsCategories();
  if(!cats.length) return;
  if(delta !== 0){
    if(delta === 1 && newsPageIndex < Math.max(0, Math.ceil((newsByCategory[cats[newsCategoryIndex].key]||[]).length / Math.max(1, 3)) - 1)){
      newsPageIndex++;
    }else if(delta === -1 && newsPageIndex > 0){
      newsPageIndex--;
    }else{
      newsCategoryIndex = (newsCategoryIndex + (delta > 0 ? 1 : -1) + cats.length) % cats.length;
      newsPageIndex = delta > 0 ? 0 : Math.max(0, Math.ceil((newsByCategory[cats[newsCategoryIndex].key]||[]).length / Math.max(1, 3)) - 1);
    }
  }
  renderCurrentNewsPage(lastNewsTimestamp || Date.now());
  restartNewsRotationTimer();
}

function restartNewsRotationTimer(){
  if(newsRotationTimer) clearInterval(newsRotationTimer);
  if(!settings.newsAutoRotate) return;
  newsRotationTimer = setInterval(()=>moveNews(1), newsPageDurationMs());
}

async function fetchHN(source){
  const idsRes = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
  if(!idsRes.ok) throw new Error("hn list failed");
  const ids = (await idsRes.json()).slice(0, 12);
  const items = await Promise.all(ids.map(async id => {
    try{
      const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      const item = await r.json();
      return { title:item.title, description:cleanNewsText(item.text||""), url:item.url||`https://news.ycombinator.com/item?id=${id}`, source:source.name, date:(item.time||0)*1000, category:source.category };
    }catch(e){ return null; }
  }));
  return items.filter(Boolean);
}

function feedProxyEndpoint(path, targetUrl){
  const configured = (settings.appleCalendar.proxyUrl || FEED_PROXY_FALLBACK || "").trim();
  if(!configured) throw new Error("Set the Cloudflare Worker URL in Settings → Calendar");
  const proxyUrl = new URL(configured);
  if(!proxyUrl.pathname || proxyUrl.pathname === "/" || proxyUrl.pathname === "/calendar" || proxyUrl.pathname === "/rss") proxyUrl.pathname = path;
  proxyUrl.searchParams.set("url", targetUrl);
  return proxyUrl.toString();
}

async function fetchRSS(source){
  const endpoint = feedProxyEndpoint("/rss", source.url);
  const res = await fetch(endpoint,{cache:"no-store"});
  if(!res.ok) throw new Error("rss http " + res.status);
  const text = await res.text();
  const xml = new DOMParser().parseFromString(text,"application/xml");
  if(xml.querySelector("parsererror")) throw new Error("rss parse error");
  return Array.from(xml.querySelectorAll("item")).slice(0, 12).map(item=>{
    const title=(item.querySelector("title")?.textContent||"").trim();
    const link=(item.querySelector("link")?.textContent||"").trim();
    const pubDate=item.querySelector("pubDate")?.textContent;
    const date=pubDate?new Date(pubDate).getTime():Date.now();
    return {title,description:rssDescription(item),url:link,source:source.name,date:isNaN(date)?Date.now():date,category:source.category};
  }).filter(i=>i.title);
}

let lastNewsTimestamp = Date.now();
async function refreshNews(){
  const sources = activeNewsSources();
  if(sources.length === 0){
    newsByCategory = {}; renderCurrentNewsPage(Date.now()); return;
  }
  const results = await Promise.allSettled(sources.map(s=>s.kind==="hn"?fetchHN(s):fetchRSS(s)));
  const grouped = {};
  let anySucceeded=false;
  results.forEach(r=>{
    if(r.status==="fulfilled"){
      anySucceeded=true;
      r.value.forEach(item=>{ (grouped[item.category] ||= []).push(item); });
    }
  });
  if(anySucceeded){
    Object.keys(grouped).forEach(k=>{
      const seen=new Set();
      grouped[k]=grouped[k].sort((a,b)=>b.date-a.date).filter(x=>{const key=x.title.toLowerCase();if(seen.has(key))return false;seen.add(key);return true;}).slice(0,settings.newsCount||10);
    });
    newsByCategory=grouped;
    lastNewsTimestamp=Date.now();
    newsCacheSet(Object.values(grouped).flat().map(x=>x));
  }else{
    const cached=newsCacheGet();
    if(cached?.items?.length){
      const groupedCached={};
      cached.items.forEach(x=>(groupedCached[x.category||"tech"] ||= []).push(x));
      newsByCategory=groupedCached; lastNewsTimestamp=cached.ts;
    }
  }
  renderCurrentNewsPage(lastNewsTimestamp);
  restartNewsRotationTimer();
}

function timeAgo(ts){
  const mins=Math.max(0,Math.round((Date.now()-ts)/60000));
  if(mins<1)return "just now"; if(mins<60)return mins+"m ago"; const hrs=Math.round(mins/60); if(hrs<24)return hrs+"h ago"; return Math.round(hrs/24)+"d ago";
}

/* --------------------------------------------------------------------
   10. CALENDAR
   -------------------------------------------------------------------- */

function calendarCacheGet(){
  try{ return JSON.parse(localStorage.getItem(CALENDAR_CACHE_KEY)); }catch(e){ return null; }
}
function calendarCacheSet(events){
  localStorage.setItem(CALENDAR_CACHE_KEY, JSON.stringify({ events, ts: Date.now() }));
}
function normalizeCalendarUrl(url){
  let value = (url || "").trim();
  if(value.startsWith("webcal://")) value = "https://" + value.slice(9);
  if(value.startsWith("webcals://")) value = "https://" + value.slice(10);
  return value;
}
function unfoldIcs(text){
  return text.replace(/\r\n/g,"\n").replace(/\r/g,"\n").replace(/\n[ \t]/g,"");
}
function decodeIcsText(value){
  return String(value || "").replace(/\\n/gi,"\n").replace(/\\,/g,",").replace(/\\;/g,";").replace(/\\\\/g,"\\").trim();
}
function parseIcsProp(line){
  const idx = line.indexOf(":");
  if(idx < 0) return null;
  const left = line.slice(0,idx), value = line.slice(idx+1);
  const bits = left.split(";");
  const name = bits.shift().toUpperCase();
  const params = {};
  bits.forEach(bit => {
    const eq = bit.indexOf("=");
    if(eq > -1) params[bit.slice(0,eq).toUpperCase()] = bit.slice(eq+1).replace(/^"|"$/g,"");
  });
  return {name, params, value};
}
function timeZoneOffsetMs(date, timeZone){
  try{
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", second:"2-digit", hourCycle:"h23" }).formatToParts(date);
    const p = {}; parts.forEach(x => { if(x.type !== "literal") p[x.type] = x.value; });
    const asUTC = Date.UTC(+p.year, +p.month-1, +p.day, +p.hour, +p.minute, +p.second);
    return asUTC - date.getTime();
  }catch(e){ return 0; }
}
function parseIcsDate(value, params){
  const raw = String(value || "").trim();
  if(!raw) return null;
  if(params && params.VALUE === "DATE"){
    const y=+raw.slice(0,4), m=+raw.slice(4,6)-1, d=+raw.slice(6,8);
    return new Date(y,m,d,0,0,0,0);
  }
  const y=+raw.slice(0,4), m=+raw.slice(4,6)-1, d=+raw.slice(6,8), h=+raw.slice(9,11), min=+raw.slice(11,13), sec=+(raw.slice(13,15)||0);
  if(raw.endsWith("Z")) return new Date(Date.UTC(y,m,d,h,min,sec));
  const tz = params && params.TZID;
  if(tz){
    let utc = Date.UTC(y,m,d,h,min,sec);
    let date = new Date(utc - timeZoneOffsetMs(new Date(utc), tz));
    date = new Date(utc - timeZoneOffsetMs(date, tz));
    return date;
  }
  return new Date(y,m,d,h,min,sec,0);
}
function parseRRule(value){
  const out={};
  String(value||"").split(";").forEach(part=>{
    const [k,v] = part.split("=");
    if(k && v) out[k.toUpperCase()] = v.toUpperCase();
  });
  return out;
}
function untilDate(rule){
  if(!rule.UNTIL) return null;
  return parseIcsDate(rule.UNTIL, {}) || null;
}
function addMonthsSafe(date, months){
  const d = new Date(date.getTime()), day=d.getDate();
  d.setDate(1); d.setMonth(d.getMonth()+months); d.setDate(Math.min(day, new Date(d.getFullYear(),d.getMonth()+1,0).getDate()));
  return d;
}
function expandRecurringEvent(base, rule, horizonDays=180){
  if(!rule || !rule.FREQ) return [base];
  const results=[];
  const start=base.start, duration=base.end ? base.end.getTime()-base.start.getTime() : 0;
  const until=untilDate(rule) || new Date(Date.now()+horizonDays*86400000);
  const maxCount=rule.COUNT ? Math.max(1, +rule.COUNT) : 1000;
  const interval=Math.max(1, +(rule.INTERVAL||1));
  const byday=rule.BYDAY ? rule.BYDAY.split(",") : [];
  let count=0;
  const push=(dt)=>{ if(dt>until || count>=maxCount || dt.getTime()>Date.now()+horizonDays*86400000) return false; results.push({...base,start:new Date(dt),end:base.end?new Date(dt.getTime()+duration):null, date:formatLocalDate(dt), time:base.allDay?"00:00":formatLocalTime(dt), id:base.uid+"-"+dt.getTime()}); count++; return true; };
  push(start);
  let cursor=new Date(start);
  if(rule.FREQ==="DAILY"){
    while(count<maxCount){ cursor.setDate(cursor.getDate()+interval); if(!push(cursor)) break; }
  }else if(rule.FREQ==="WEEKLY"){
    const days=byday.length?byday:[dayCode(start.getDay())];
    let weekStart=new Date(start); weekStart.setHours(0,0,0,0); weekStart.setDate(weekStart.getDate()-weekStart.getDay());
    let week=0;
    while(count<maxCount){
      week += 1; const baseWeek=new Date(weekStart); baseWeek.setDate(baseWeek.getDate()+week*7*interval);
      for(const code of days){
        const wd=dayCodeToNum(code.replace(/^[-+]?\d+/,"")); if(wd==null) continue;
        const dt=new Date(baseWeek); dt.setDate(baseWeek.getDate()+wd); dt.setHours(start.getHours(),start.getMinutes(),start.getSeconds(),0);
        if(dt<=start) continue; if(!push(dt)) return results;
      }
    }
  }else if(rule.FREQ==="MONTHLY"){
    while(count<maxCount){ cursor=addMonthsSafe(cursor,interval); if(!push(cursor)) break; }
  }else if(rule.FREQ==="YEARLY"){
    while(count<maxCount){ cursor=new Date(cursor.getFullYear()+interval,cursor.getMonth(),cursor.getDate(),cursor.getHours(),cursor.getMinutes(),cursor.getSeconds()); if(!push(cursor)) break; }
  }
  return results;
}
function dayCode(day){ return ["SU","MO","TU","WE","TH","FR","SA"][day]; }
function dayCodeToNum(code){ return {SU:0,MO:1,TU:2,WE:3,TH:4,FR:5,SA:6}[code]; }
function formatLocalDate(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function formatLocalTime(d){ return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; }

function parseICS(text){
  const lines=unfoldIcs(text).split("\n");
  const events=[]; let current=null;
  for(const line of lines){
    if(line.toUpperCase()==="BEGIN:VEVENT"){ current={}; continue; }
    if(line.toUpperCase()==="END:VEVENT"){
      if(current && current.dtstart){
        const start=current.dtstart, end=current.dtend || null;
        const base={ uid:current.uid||uid("apple"), title:decodeIcsText(current.summary)||"Untitled event", location:decodeIcsText(current.location||""), start, end, allDay:current.allDay||false, source:"Apple Calendar", remote:true, date:formatLocalDate(start), time:current.allDay?"00:00":formatLocalTime(start) };
        if(current.status !== "CANCELLED"){
          const expanded=expandRecurringEvent(base,current.rrule);
          events.push(...expanded);
        }
      }
      current=null; continue;
    }
    if(!current) continue;
    const prop=parseIcsProp(line); if(!prop) continue;
    if(prop.name==="UID") current.uid=decodeIcsText(prop.value);
    else if(prop.name==="SUMMARY") current.summary=prop.value;
    else if(prop.name==="LOCATION") current.location=prop.value;
    else if(prop.name==="STATUS") current.status=prop.value.toUpperCase();
    else if(prop.name==="DTSTART"){ current.dtstart=parseIcsDate(prop.value,prop.params); current.allDay=prop.params.VALUE==="DATE"; }
    else if(prop.name==="DTEND") current.dtend=parseIcsDate(prop.value,prop.params);
    else if(prop.name==="RRULE") current.rrule=parseRRule(prop.value);
  }
  return events.filter(e=>e.start && e.start.getTime()>=Date.now()-86400000).sort((a,b)=>a.start-b.start);
}
function allCalendarEvents(){
  return [...settings.calendarEvents, ...reviveCalendarEvents(settings.appleCalendarEvents)];
}
async function refreshAppleCalendar(){
  const url=normalizeCalendarUrl(settings.appleCalendar.url);
  if(!settings.appleCalendar.enabled || !url){
    settings.appleCalendarEvents=[];
    return false;
  }
  try{
    const proxy = (settings.appleCalendar.proxyUrl || APPLE_CALENDAR_PROXY_FALLBACK).trim();
    if(!proxy) throw new Error("Set the Cloudflare Worker URL in Settings → Calendar");
    const proxyUrl = new URL(proxy);
    if(!proxyUrl.pathname || proxyUrl.pathname === "/" || proxyUrl.pathname === "/calendar" || proxyUrl.pathname === "/rss") proxyUrl.pathname = "/calendar";
    proxyUrl.searchParams.set("url", url);
    const endpoint = proxyUrl.toString();
    const res=await fetch(endpoint,{cache:"no-store"});
    if(!res.ok) throw new Error("calendar http "+res.status);
    const text=await res.text();
    if(!/BEGIN:VCALENDAR/i.test(text)) throw new Error("not an iCalendar feed");
    const events=parseICS(text);
    settings.appleCalendarEvents=events.slice(0,200);
    calendarCacheSet(settings.appleCalendarEvents);
    saveSettings();
    setCalendarStatus(`Synced ${events.length} events · ${new Date().toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}`,"ok");
    renderCalendar(); renderNextEvent(); renderEventsEditList();
    return true;
  }catch(e){
    console.warn("Apple Calendar sync failed", e);
    const cached=calendarCacheGet();
    if(cached && Array.isArray(cached.events)) settings.appleCalendarEvents=reviveCalendarEvents(cached.events);
    const detail = e && e.message ? ` (${e.message})` : "";
    setCalendarStatus("Sync failed" + detail + " — using last saved calendar data","error");
    renderCalendar(); renderNextEvent(); renderEventsEditList();
    return false;
  }
}
function setCalendarStatus(text,kind){
  const node=$("#apple-calendar-status"); if(!node) return;
  node.textContent=text; node.classList.remove("ok","error"); if(kind) node.classList.add(kind);
}

function sameDate(a, b){
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

function renderCalendar(){
  const view = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), 1);
  const now = new Date();
  el.calTitle.textContent = view.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  el.calWeekdays.innerHTML = "";
  ["S","M","T","W","T","F","S"].forEach(d => {
    const span = document.createElement("span");
    span.textContent = d;
    el.calWeekdays.appendChild(span);
  });

  const year = view.getFullYear(), month = view.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const eventDates = allCalendarEvents().map(e => e.date);

  el.calGrid.innerHTML = "";
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  for(let i=0; i<totalCells; i++){
    const cell = document.createElement("div");
    cell.className = "cal-day";
    let dayNum, cellDate, muted = false;
    if(i < startOffset){
      dayNum = daysInPrevMonth - (startOffset - i - 1);
      cellDate = new Date(year, month-1, dayNum);
      muted = true;
    }else if(i >= startOffset + daysInMonth){
      dayNum = i - startOffset - daysInMonth + 1;
      cellDate = new Date(year, month+1, dayNum);
      muted = true;
    }else{
      dayNum = i - startOffset + 1;
      cellDate = new Date(year, month, dayNum);
    }
    if(muted) cell.classList.add("muted");
    if(!muted && sameDate(cellDate, now)) cell.classList.add("today");
    const iso = formatLocalDate(cellDate);
    const hasEvent = eventDates.includes(iso);
    cell.innerHTML = `<span>${dayNum}</span>`;
    if(hasEvent && !muted){
      const dot = document.createElement("span");
      dot.className = "dot";
      cell.appendChild(dot);
    }
    el.calGrid.appendChild(cell);
  }
}

function shiftCalendarMonth(delta){
  calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth()+delta, 1);
  renderCalendar();
}

/* --------------------------------------------------------------------
   11. NEXT EVENT
   -------------------------------------------------------------------- */

function upcomingEvents(){
  const now = Date.now();
  return allCalendarEvents()
    .map(e => ({ ...e, ts: e.start instanceof Date ? e.start.getTime() : new Date(`${e.date}T${e.time || "00:00"}`).getTime() }))
    .filter(e => !isNaN(e.ts) && e.ts >= now)
    .sort((a,b) => a.ts - b.ts);
}

function formatCountdown(ts){
  const diff = ts - Date.now();
  if(diff <= 0) return "Now";
  const mins = Math.floor(diff/60000);
  const hrs = Math.floor(mins/60);
  const days = Math.floor(hrs/24);
  if(days >= 1) return `in ${days}d`;
  if(hrs >= 1) return `in ${hrs}h`;
  return `in ${mins}m`;
}

function renderNextEvent(){
  const upcoming = upcomingEvents().slice(0, 3);
  if(el.eventCount) el.eventCount.textContent = upcoming.length;
  if(!el.upcomingEventsList) return;

  if(!upcoming.length){
    el.upcomingEventsList.innerHTML = `<div class="upcoming-events-empty">No upcoming events<br><span>Add one in settings</span></div>`;
    return;
  }

  el.upcomingEventsList.innerHTML = "";
  upcoming.forEach((event, index) => {
    const item = document.createElement("div");
    item.className = "upcoming-event-item";

    const main = document.createElement("div");
    main.className = "upcoming-event-main";

    const name = document.createElement("div");
    name.className = "upcoming-event-name";
    name.textContent = event.title || "Untitled event";

    const dateObj = new Date(event.ts);
    const timeStr = dateObj.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    const dateStr = dateObj.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    const meta = document.createElement("div");
    meta.className = "upcoming-event-meta";
    meta.textContent = timeStr + " · " + dateStr + (event.location ? " · " + event.location : "");

    main.appendChild(name);
    main.appendChild(meta);

    const countdown = document.createElement("div");
    countdown.className = "upcoming-event-countdown";
    countdown.textContent = formatCountdown(event.ts);

    item.appendChild(main);
    item.appendChild(countdown);
    el.upcomingEventsList.appendChild(item);
  });
}

/* --------------------------------------------------------------------
   12. REMINDERS
   -------------------------------------------------------------------- */

function renderReminders(){
  el.remindersList.innerHTML = "";
  if(!settings.reminders.length){
    el.remindersList.innerHTML = `<div class="reminders-empty">No reminders. Add some in settings.</div>`;
    return;
  }
  settings.reminders.forEach(r => {
    const li = document.createElement("li");
    li.className = "reminder-item" + (r.done ? " done" : "");
    li.innerHTML = `<span class="reminder-check"></span><span class="reminder-text">${escapeHtml(r.text)}</span>`;
    li.addEventListener("click", () => {
      r.done = !r.done;
      saveSettings();
      renderReminders();
    });
    el.remindersList.appendChild(li);
  });
}

function escapeHtml(str){
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

/* --------------------------------------------------------------------
   13. DISPLAY (card visibility)
   -------------------------------------------------------------------- */

function applyDisplaySettings(){
  DISPLAY_CARDS.forEach(c => {
    const cardEl = document.querySelector(`[data-card="${c.key}"]`);
    if(cardEl) cardEl.hidden = !settings.display.cards[c.key];
  });
  const inlineAir = document.querySelector("#inline-air");
  if(inlineAir) inlineAir.hidden = !settings.display.cards.airQuality;
  applyClockSize();
}

/* --------------------------------------------------------------------
   14. SETTINGS PANEL WIRING
   -------------------------------------------------------------------- */

function openSettings(){ document.body.classList.add("settings-open"); }
function closeSettings(){ document.body.classList.remove("settings-open"); }

function setupTabs(){
  $$(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      $$(".tab-btn").forEach(b => b.classList.remove("active"));
      $$(".tab-pane").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      $(`.tab-pane[data-pane="${btn.dataset.tab}"]`).classList.add("active");
    });
  });
}

function renderCheckList(container, config, stateObj, onChange){
  container.innerHTML = "";
  config.forEach(item => {
    const row = document.createElement("div");
    row.className = "check-item" + (stateObj[item.key || item.id] ? " on" : "");
    const key = item.key || item.id;
    row.innerHTML = `<span>${item.label}${item.category ? ` <span style="color:var(--text-tertiary);font-size:12px">· ${item.categoryLabel||""}</span>` : ""}</span><span class="switch"></span>`;
    row.addEventListener("click", () => {
      stateObj[key] = !stateObj[key];
      row.classList.toggle("on", stateObj[key]);
      saveSettings();
      onChange && onChange();
    });
    container.appendChild(row);
  });
}

function renderSettingsStaticLists(){
  renderCheckList($("#weather-metrics-list"), WEATHER_METRICS, settings.weatherMetrics, refreshWeather);
  renderCheckList($("#news-categories-list"), NEWS_CATEGORIES, settings.newsCategories, refreshNews);

  const sourceItems = NEWS_SOURCES.map(s => ({ key: s.id, label: s.name }));
  renderCheckList($("#news-sources-list"), sourceItems, settings.newsSources, refreshNews);

  renderCheckList($("#display-cards-list"), DISPLAY_CARDS, settings.display.cards, applyDisplaySettings);

  $("#news-count").value = settings.newsCount;
  $("#news-refresh").value = settings.newsRefreshMinutes;
  $("#news-headlines-per-page").value = settings.newsHeadlinesPerPage;
  $("#news-auto-rotate").checked = settings.newsAutoRotate;
  $("#apple-calendar-url").value = settings.appleCalendar.url || "";
  $("#apple-calendar-proxy").value = settings.appleCalendar.proxyUrl || "";
  setCalendarStatus(settings.appleCalendar.enabled && settings.appleCalendar.url ? "Connected · tap Sync to refresh" : "Not connected", settings.appleCalendar.enabled && settings.appleCalendar.url ? "ok" : "");

  $("#night-start").value = settings.nightMode.start;
  $("#night-end").value = settings.nightMode.end;
  $("#night-alarm-input").value = settings.nightMode.alarmText;
  $$("#night-mode-toggle .seg-btn").forEach(b => b.classList.toggle("active", b.dataset.nightMode === (settings.nightMode.mode || "auto")));

  $("#loc-name-display").textContent = settings.location.name;
  $("#loc-coords-display").textContent = settings.location.lat.toFixed(3) + ", " + settings.location.lon.toFixed(3);

  $$("#units-toggle .seg-btn").forEach(b => b.classList.toggle("active", b.dataset.units === settings.units));
  $$("#clock-size-toggle .seg-btn").forEach(b => b.classList.toggle("active", b.dataset.size === settings.display.clockSize));

  renderEventsEditList();
  renderRemindersEditList();
}

function renderEventsEditList(){
  const list = $("#events-list");
  list.innerHTML = "";
  const remote = reviveCalendarEvents(settings.appleCalendarEvents).filter(e => e.start.getTime() >= Date.now()-86400000).sort((a,b)=>a.start-b.start).slice(0,20);
  const local = [...settings.calendarEvents].sort((a,b) => new Date(a.date+"T"+(a.time||"00:00")) - new Date(b.date+"T"+(b.time||"00:00")));
  if(!remote.length && !local.length){ list.innerHTML = `<div class="empty-note">No events yet.</div>`; return; }

  remote.forEach(ev => {
    const li=document.createElement("li"); li.className="editable-item remote-calendar";
    const dateObj=ev.start instanceof Date ? ev.start : new Date(ev.start);
    const dateStr=dateObj.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"});
    const timeStr=ev.allDay?"All day":dateObj.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"});
    li.innerHTML=`<div class="editable-item-text"><div class="ei-title">${escapeHtml(ev.title)}<span class="remote-badge">Apple</span></div><div class="ei-sub">${dateStr} · ${timeStr}${ev.location ? " · "+escapeHtml(ev.location):""}</div></div>`;
    list.appendChild(li);
  });

  local.forEach(ev => {
    const li = document.createElement("li");
    li.className = "editable-item";
    const dateObj = new Date(ev.date + "T" + (ev.time || "00:00"));
    const dateStr = dateObj.toLocaleDateString(undefined, { weekday:"short", month:"short", day:"numeric" });
    const timeStr = ev.time ? dateObj.toLocaleTimeString(undefined, { hour:"numeric", minute:"2-digit" }) : "";
    li.innerHTML = `<div class="editable-item-text"><div class="ei-title">${escapeHtml(ev.title)}</div><div class="ei-sub">${dateStr}${timeStr ? " · "+timeStr : ""}${ev.location ? " · "+escapeHtml(ev.location) : ""}</div></div><button class="editable-item-remove">✕</button>`;
    li.querySelector(".editable-item-remove").addEventListener("click", () => {
      settings.calendarEvents = settings.calendarEvents.filter(e => e.id !== ev.id);
      saveSettings();
      renderEventsEditList(); renderCalendar(); renderNextEvent();
    });
    list.appendChild(li);
  });
}
function renderRemindersEditList(){
  const list = $("#reminders-edit-list");
  list.innerHTML = "";
  if(!settings.reminders.length){
    list.innerHTML = `<div class="empty-note">No reminders yet.</div>`;
    return;
  }
  settings.reminders.forEach(r => {
    const li = document.createElement("li");
    li.className = "editable-item";
    li.innerHTML = `<div class="editable-item-text"><div class="ei-title">${escapeHtml(r.text)}</div></div><button class="editable-item-remove">✕</button>`;
    li.querySelector(".editable-item-remove").addEventListener("click", () => {
      settings.reminders = settings.reminders.filter(x => x.id !== r.id);
      saveSettings();
      renderRemindersEditList();
      renderReminders();
    });
    list.appendChild(li);
  });
}

let geocodeTimer = null;
function setupLocationSearch(){
  const input = $("#city-search");
  const resultsBox = $("#search-results");

  input.addEventListener("input", () => {
    clearTimeout(geocodeTimer);
    const q = input.value.trim();
    if(q.length < 2){ resultsBox.classList.remove("show"); return; }
    geocodeTimer = setTimeout(async () => {
      try{
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`);
        const json = await res.json();
        renderGeocodeResults(json.results || []);
      }catch(e){
        resultsBox.classList.remove("show");
      }
    }, 350);
  });

  function renderGeocodeResults(results){
    resultsBox.innerHTML = "";
    if(!results.length){ resultsBox.classList.remove("show"); return; }
    results.forEach(r => {
      const div = document.createElement("div");
      div.className = "search-result-item";
      const region = [r.admin1, r.country].filter(Boolean).join(", ");
      div.innerHTML = `${r.name}<div class="sr-sub">${region}</div>`;
      div.addEventListener("click", () => {
        settings.location = { name: r.name + (r.admin1 ? ", " + r.admin1 : ""), lat: r.latitude, lon: r.longitude };
        saveSettings();
        input.value = "";
        resultsBox.classList.remove("show");
        $("#loc-name-display").textContent = settings.location.name;
        $("#loc-coords-display").textContent = settings.location.lat.toFixed(3) + ", " + settings.location.lon.toFixed(3);
        refreshWeather();
        refreshAir();
      });
      resultsBox.appendChild(div);
    });
    resultsBox.classList.add("show");
  }
}

function setupMiscControls(){
  $("#settings-btn").addEventListener("click", openSettings);
  $("#settings-close").addEventListener("click", closeSettings);
  $("#settings-backdrop").addEventListener("click", closeSettings);

  $$("#units-toggle .seg-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      settings.units = btn.dataset.units;
      saveSettings();
      $$("#units-toggle .seg-btn").forEach(b => b.classList.toggle("active", b === btn));
      refreshWeather();
    });
  });

  $$("#clock-size-toggle .seg-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      settings.display.clockSize = btn.dataset.size;
      saveSettings();
      $$("#clock-size-toggle .seg-btn").forEach(b => b.classList.toggle("active", b === btn));
      applyClockSize();
    });
  });

  $("#news-count").addEventListener("change", (e) => {
    settings.newsCount = Math.max(3, Math.min(12, Number(e.target.value) || 6));
    saveSettings();
    refreshNews();
  });
  $("#news-refresh").addEventListener("change", (e) => {
    settings.newsRefreshMinutes = Math.max(3, Number(e.target.value) || 5);
    saveSettings();
    restartNewsTimer();
    restartNewsRotationTimer();
  });
  $("#news-headlines-per-page").addEventListener("change", (e) => {
    settings.newsHeadlinesPerPage = 3;
    saveSettings(); newsPageIndex = 0; renderCurrentNewsPage(lastNewsTimestamp); restartNewsRotationTimer();
  });
  $("#news-auto-rotate").addEventListener("change", (e) => {
    settings.newsAutoRotate = e.target.checked; saveSettings(); restartNewsRotationTimer();
  });

  el.newsPrev.addEventListener("click", () => moveNews(-1));
  el.newsNext.addEventListener("click", () => moveNews(1));
  el.newsList.addEventListener("touchstart", e => { newsTouchStartX = e.changedTouches[0].clientX; }, {passive:true});
  el.newsList.addEventListener("touchend", e => {
    if(newsTouchStartX === null) return;
    const dx = e.changedTouches[0].clientX - newsTouchStartX;
    if(Math.abs(dx) > 45) moveNews(dx < 0 ? 1 : -1);
    newsTouchStartX = null;
  }, {passive:true});

  el.calPrev.addEventListener("click", () => shiftCalendarMonth(-1));
  el.calNext.addEventListener("click", () => shiftCalendarMonth(1));
  el.calGrid.addEventListener("touchstart", e => { calendarTouchStartX = e.changedTouches[0].clientX; }, {passive:true});
  el.calGrid.addEventListener("touchend", e => {
    if(calendarTouchStartX === null) return;
    const dx = e.changedTouches[0].clientX - calendarTouchStartX;
    if(Math.abs(dx) > 45) shiftCalendarMonth(dx < 0 ? 1 : -1);
    calendarTouchStartX = null;
  }, {passive:true});

  $("#sync-apple-calendar-btn").addEventListener("click", async () => {
    const url = normalizeCalendarUrl($("#apple-calendar-url").value);
    if(!url){ setCalendarStatus("Paste an Apple published calendar link first","error"); return; }
    settings.appleCalendar.url = url;
    settings.appleCalendar.proxyUrl = $("#apple-calendar-proxy").value.trim();
    settings.appleCalendar.enabled = true;
    saveSettings();
    setCalendarStatus("Syncing…");
    await refreshAppleCalendar();
  });

  $("#clear-apple-calendar-btn").addEventListener("click", () => {
    settings.appleCalendar = { enabled:false, url:"", refreshMinutes:5, proxyUrl:"" };
    settings.appleCalendarEvents = [];
    saveSettings();
    $("#apple-calendar-url").value = "";
    setCalendarStatus("Not connected");
    renderCalendar(); renderNextEvent(); renderEventsEditList();
  });

  $("#add-event-btn").addEventListener("click", () => {
    const title = $("#new-event-title").value.trim();
    const date = $("#new-event-date").value;
    const time = $("#new-event-time").value || "09:00";
    const location = $("#new-event-location").value.trim();
    if(!title || !date) return;
    settings.calendarEvents.push({ id: uid("evt"), title, date, time, location });
    saveSettings();
    $("#new-event-title").value = "";
    $("#new-event-date").value = "";
    $("#new-event-time").value = "";
    $("#new-event-location").value = "";
    renderEventsEditList();
    renderCalendar();
    renderNextEvent();
  });

  $("#add-reminder-btn").addEventListener("click", () => {
    const text = $("#new-reminder-text").value.trim();
    if(!text) return;
    settings.reminders.push({ id: uid("rem"), text, done: false });
    saveSettings();
    $("#new-reminder-text").value = "";
    renderRemindersEditList();
    renderReminders();
  });

  $("#night-start").addEventListener("change", e => { settings.nightMode.start = e.target.value; saveSettings(); tickClock(); });
  $("#night-end").addEventListener("change", e => { settings.nightMode.end = e.target.value; saveSettings(); tickClock(); });
  $("#night-alarm-input").addEventListener("input", e => { settings.nightMode.alarmText = e.target.value; saveSettings(); });
  $$("#night-mode-toggle .seg-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      settings.nightMode.mode = btn.dataset.nightMode;
      saveSettings();
      $$("#night-mode-toggle .seg-btn").forEach(b => b.classList.toggle("active", b === btn));
      tickClock();
    });
  });

  $("#preview-night-btn").addEventListener("click", () => {
    forcedNightPreview = !forcedNightPreview;
    $("#preview-night-btn").textContent = forcedNightPreview ? "Exit preview" : "Preview night mode";
    tickClock();
  });

  $("#reset-settings-btn").addEventListener("click", () => {
    if(confirm("Reset all dashboard settings to defaults? This can't be undone.")){
      localStorage.removeItem(STORAGE_KEY);
      settings = loadSettings();
      renderSettingsStaticLists();
      applyDisplaySettings();
      refreshAll();
    }
  });
}

/* --------------------------------------------------------------------
   15. TIMERS
   -------------------------------------------------------------------- */

let newsTimer = null;
let refreshInFlight = false;
let lastDataRefreshAt = 0;

function restartNewsTimer(){
  if(newsTimer) clearInterval(newsTimer);
  newsTimer = setInterval(() => refreshNews(), Math.max(3, settings.newsRefreshMinutes || 5) * 60000);
  restartNewsRotationTimer();
}

async function refreshAll(reason = "manual"){
  if(refreshInFlight) return;
  refreshInFlight = true;
  lastDataRefreshAt = Date.now();
  try{
    // Render cached content immediately, then replace it with live data.
    const wc = weatherCacheGet();
    if(wc?.data) renderWeather(wc.data, wc.ts);
    const ac = airCacheGet();
    if(ac?.data) renderAir(ac.data, ac.ts);
    const nc = newsCacheGet();
    if(nc?.items?.length && !Object.keys(newsByCategory).length){
      const grouped = {};
      nc.items.forEach(x => (grouped[x.category || "tech"] ||= []).push(x));
      newsByCategory = grouped;
      lastNewsTimestamp = nc.ts || Date.now();
      renderCurrentNewsPage(lastNewsTimestamp);
    }
    renderCalendar();
    renderNextEvent();
    renderReminders();

    await Promise.allSettled([refreshWeather(), refreshAir(), refreshNews(), refreshAppleCalendar()]);
    renderCalendar();
    renderNextEvent();
    lastDataRefreshAt = Date.now();
  } finally {
    refreshInFlight = false;
  }
}

function refreshIfStale(reason = "resume"){
  const fiveMinutes = 5 * 60000;
  if(Date.now() - lastDataRefreshAt >= fiveMinutes) refreshAll(reason);
}

/* --------------------------------------------------------------------
   16. INIT
   -------------------------------------------------------------------- */

function init(){
  applyDisplaySettings();
  renderQuote();
  tickClock();
  setInterval(tickClock, 1000);
  setInterval(renderNextEvent, 60000);
  // Keep time-sensitive UI elements current even between network refreshes.
  // Weather/air/calendar data are fetched on their own 5-minute cadence below.
  // The calendar is re-rendered every minute so today/event dots stay current,
  // and the news freshness label keeps counting from the last successful fetch.
  setInterval(() => {
    renderCalendar();
    renderNextEvent();
    renderSunMoon({});
    if(newsByCategory && Object.keys(newsByCategory).length) renderCurrentNewsPage(lastNewsTimestamp);
  }, 60000);

  setupTabs();
  setupLocationSearch();
  setupMiscControls();
  renderSettingsStaticLists();

  // One live refresh cycle immediately on every page load. The settings are
  // read from localStorage, so there is no need to open Settings to trigger it.
  refreshAll("startup");

  // Keep the data live while the iPad stays on the dashboard. Each network
  // source is fetched at its own cadence, while refreshIfStale() handles the
  // case where iPadOS suspends timers while the screen/app is asleep.
  setInterval(() => refreshIfStale("interval"), 60 * 1000);
  window.addEventListener("focus", () => refreshIfStale("focus"));
  window.addEventListener("pageshow", () => refreshIfStale("pageshow"));
  document.addEventListener("visibilitychange", () => {
    if(document.visibilityState === "visible") refreshIfStale("visibility");
  });
  restartNewsTimer();

  // Midnight rollover: re-render calendar + quote once the day changes.
  setInterval(() => {
    const now = new Date();
    if(now.getHours() === 0 && now.getMinutes() === 0){
      renderCalendar();
      renderQuote();
    }
  }, 60000);
}

document.addEventListener("DOMContentLoaded", init);

})();
