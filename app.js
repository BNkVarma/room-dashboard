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

// Public, free, key-less CORS proxy used only for feeds that don't send
// CORS headers themselves. See the README for the limitations of this.
const CORS_PROXY = "https://api.allorigins.win/raw?url=";

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
  { key: "reminders",      label: "Reminders" }
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
    newsCount: 6,
    newsRefreshMinutes: 10,
    calendarEvents: [
      { id: "evt-sample", title: "CCAR-F: Claude Certified Architect – Foundations", date: nextSaturdayISO(), time: "13:00", location: "" }
    ],
    reminders: [
      { id: "rem-1", text: "Practice guitar", done: false },
      { id: "rem-2", text: "Laundry", done: false },
      { id: "rem-3", text: "Check tomorrow's schedule", done: false }
    ],
    nightMode: { start: "22:00", end: "07:00", alarmText: "Alarm · 7:00 AM" },
    display: {
      cards: { weather:true, weatherDetails:true, airQuality:true, news:true, clock:true, calendar:true, nextEvent:true, reminders:true },
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
  freshNews: $("#fresh-news"),

  calTitle: $("#calendar-title"),
  calWeekdays: $("#calendar-weekdays"),
  calGrid: $("#calendar-grid"),

  eventCountdown: $("#event-countdown"),
  eventName: $("#event-name"),
  eventMeta: $("#event-meta"),

  remindersList: $("#reminders-list"),

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

function tickClock(){
  const now = new Date();

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
    daily: "temperature_2m_max,temperature_2m_min",
    temperature_unit: imperial ? "fahrenheit" : "celsius",
    wind_speed_unit: imperial ? "mph" : "kmh",
    precipitation_unit: imperial ? "inch" : "mm",
    timezone: "auto",
    forecast_days: "1"
  });
  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const res = await fetch(url);
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
  el.weatherHigh.textContent = "H:" + Math.round(json.daily.temperature_2m_max[0]) + "°";
  el.weatherLow.textContent = "L:" + Math.round(json.daily.temperature_2m_min[0]) + "°";

  // ambient background
  const hour = new Date().getHours();
  const nightHours = hour >= 21 || hour < 6;
  const bgClass = (nightHours && !isDay) ? "weather-night" : "weather-" + info.bg;
  el.ambient.className = "ambient " + bgClass;

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
  const res = await fetch(url);
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

async function fetchHN(source){
  const idsRes = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
  if(!idsRes.ok) throw new Error("hn list failed");
  const ids = (await idsRes.json()).slice(0, 8);
  const items = await Promise.all(ids.map(async id => {
    try{
      const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      const item = await r.json();
      return {
        title: item.title,
        url: item.url || `https://news.ycombinator.com/item?id=${id}`,
        source: source.name,
        date: (item.time || 0) * 1000
      };
    }catch(e){ return null; }
  }));
  return items.filter(Boolean);
}

async function fetchRSS(source){
  const proxied = CORS_PROXY + encodeURIComponent(source.url);
  const res = await fetch(proxied);
  if(!res.ok) throw new Error("rss http " + res.status);
  const text = await res.text();
  const xml = new DOMParser().parseFromString(text, "application/xml");
  if(xml.querySelector("parsererror")) throw new Error("rss parse error");
  const items = Array.from(xml.querySelectorAll("item")).slice(0, 10);
  return items.map(item => {
    const title = (item.querySelector("title")?.textContent || "").trim();
    const link = (item.querySelector("link")?.textContent || "").trim();
    const pubDate = item.querySelector("pubDate")?.textContent;
    const date = pubDate ? new Date(pubDate).getTime() : Date.now();
    return { title, url: link, source: source.name, date: isNaN(date) ? Date.now() : date };
  }).filter(i => i.title);
}

async function refreshNews(){
  const sources = activeNewsSources();
  if(sources.length === 0){
    el.newsList.innerHTML = `<div class="news-empty">No categories or sources enabled. Choose some in settings.</div>`;
    el.freshNews.textContent = "—";
    return;
  }

  const results = await Promise.allSettled(sources.map(s => s.kind === "hn" ? fetchHN(s) : fetchRSS(s)));
  let items = [];
  let anySucceeded = false;
  results.forEach(r => {
    if(r.status === "fulfilled"){
      anySucceeded = true;
      items = items.concat(r.value);
    }
  });

  if(anySucceeded){
    items.sort((a,b) => b.date - a.date);
    items = items.slice(0, settings.newsCount);
    newsCacheSet(items);
    renderNews(items, Date.now());
  }else{
    const cached = newsCacheGet();
    if(cached && cached.items && cached.items.length){
      renderNews(cached.items, cached.ts);
    }else{
      el.newsList.innerHTML = `<div class="news-empty">Couldn't load news right now. It will retry automatically.</div>`;
      el.freshNews.textContent = "—";
    }
  }
}

function timeAgo(ts){
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if(mins < 1) return "just now";
  if(mins < 60) return mins + "m ago";
  const hrs = Math.round(mins/60);
  if(hrs < 24) return hrs + "h ago";
  return Math.round(hrs/24) + "d ago";
}

function renderNews(items, ts){
  el.newsList.innerHTML = "";
  if(!items.length){
    el.newsList.innerHTML = `<div class="news-empty">No headlines available.</div>`;
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
    const meta = document.createElement("div");
    meta.className = "news-meta";
    meta.innerHTML = `<span class="news-source">${item.source}</span><span>${timeAgo(item.date)}</span>`;
    div.appendChild(a);
    div.appendChild(meta);
    el.newsList.appendChild(div);
  });
  el.freshNews.textContent = freshnessLabel(ts);
}

/* --------------------------------------------------------------------
   10. CALENDAR
   -------------------------------------------------------------------- */

function sameDate(a, b){
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

function renderCalendar(){
  const now = new Date();
  el.calTitle.textContent = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  el.calWeekdays.innerHTML = "";
  ["S","M","T","W","T","F","S"].forEach(d => {
    const span = document.createElement("span");
    span.textContent = d;
    el.calWeekdays.appendChild(span);
  });

  const year = now.getFullYear(), month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const eventDates = settings.calendarEvents.map(e => e.date);

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

    const iso = cellDate.toISOString().slice(0,10);
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

/* --------------------------------------------------------------------
   11. NEXT EVENT
   -------------------------------------------------------------------- */

function upcomingEvents(){
  const now = Date.now();
  return settings.calendarEvents
    .map(e => ({ ...e, ts: new Date(`${e.date}T${e.time || "00:00"}`).getTime() }))
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
  const upcoming = upcomingEvents();
  if(!upcoming.length){
    el.eventCountdown.textContent = "—";
    el.eventName.textContent = "No upcoming events";
    el.eventMeta.textContent = "Add one in settings";
    return;
  }
  const next = upcoming[0];
  el.eventCountdown.textContent = formatCountdown(next.ts);
  el.eventName.textContent = next.title;
  const dateObj = new Date(next.ts);
  const timeStr = dateObj.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const dateStr = dateObj.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  el.eventMeta.textContent = timeStr + " · " + dateStr + (next.location ? " · " + next.location : "");
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

  $("#night-start").value = settings.nightMode.start;
  $("#night-end").value = settings.nightMode.end;
  $("#night-alarm-input").value = settings.nightMode.alarmText;

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
  const sorted = [...settings.calendarEvents].sort((a,b) => new Date(a.date+"T"+(a.time||"00:00")) - new Date(b.date+"T"+(b.time||"00:00")));
  if(!sorted.length){
    list.innerHTML = `<div class="empty-note">No events yet.</div>`;
    return;
  }
  sorted.forEach(ev => {
    const li = document.createElement("li");
    li.className = "editable-item";
    const dateObj = new Date(ev.date + "T" + (ev.time || "00:00"));
    const dateStr = dateObj.toLocaleDateString(undefined, { weekday:"short", month:"short", day:"numeric" });
    const timeStr = ev.time ? dateObj.toLocaleTimeString(undefined, { hour:"numeric", minute:"2-digit" }) : "";
    li.innerHTML = `<div class="editable-item-text"><div class="ei-title">${escapeHtml(ev.title)}</div><div class="ei-sub">${dateStr}${timeStr ? " · "+timeStr : ""}${ev.location ? " · "+escapeHtml(ev.location) : ""}</div></div><button class="editable-item-remove">✕</button>`;
    li.querySelector(".editable-item-remove").addEventListener("click", () => {
      settings.calendarEvents = settings.calendarEvents.filter(e => e.id !== ev.id);
      saveSettings();
      renderEventsEditList();
      renderCalendar();
      renderNextEvent();
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
    settings.newsRefreshMinutes = Math.max(5, Number(e.target.value) || 10);
    saveSettings();
    restartNewsTimer();
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

  $("#night-start").addEventListener("change", e => { settings.nightMode.start = e.target.value; saveSettings(); });
  $("#night-end").addEventListener("change", e => { settings.nightMode.end = e.target.value; saveSettings(); });
  $("#night-alarm-input").addEventListener("input", e => { settings.nightMode.alarmText = e.target.value; saveSettings(); });

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
function restartNewsTimer(){
  if(newsTimer) clearInterval(newsTimer);
  newsTimer = setInterval(refreshNews, settings.newsRefreshMinutes * 60000);
}

function refreshAll(){
  refreshWeather();
  refreshAir();
  refreshNews();
  renderCalendar();
  renderNextEvent();
  renderReminders();
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
  setInterval(() => { document.querySelectorAll(".news-meta span:last-child").length && refreshNewsMeta(); }, 60000);

  setupTabs();
  setupLocationSearch();
  setupMiscControls();
  renderSettingsStaticLists();

  refreshAll();
  setInterval(refreshWeather, 5 * 60000);
  setInterval(refreshAir, 5 * 60000);
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

function refreshNewsMeta(){
  // Lightweight re-render of "time ago" labels between fetches without refetching.
  const cached = newsCacheGet();
  if(cached && cached.items) renderNews(cached.items, cached.ts);
}

document.addEventListener("DOMContentLoaded", init);

})();
