/* ================================================================
   HASSAM WEATHER — script.js
   All JavaScript: API, weather logic, animations, particles, UI
   ================================================================ */

/* ================================================================
   ██████████████████████████████████████████████████████████████
   █                                                            █
   █   API CONFIGURATION — SET YOUR KEY HERE                   █
   █                                                            █
   █   Get a free key at: https://openweathermap.org/api       █
   █   Sign up → My API Keys → Copy your key → paste below     █
   █                                                            █
   ██████████████████████████████████████████████████████████████
   ================================================================ */

const API_KEY = '7827e5d85b0014264cb0afbf6e22f885';

/* ================================================================
   API BASE URLS  (do not change these)
   ================================================================ */
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL  = 'https://api.openweathermap.org/geo/1.0';

/* ================================================================
   APP STATE
   ================================================================ */
let currentUnit        = 'metric';   // 'metric' | 'imperial'
let currentWeatherData = null;
let clockInterval      = null;
let particleSystem     = null;
let currentCondition   = 'clear';
let searchTimeout      = null;

/* ================================================================
   PARTICLE SYSTEM
   ================================================================ */
class ParticleSystem {
  constructor(canvas) {
    this.canvas    = canvas;
    this.ctx       = canvas.getContext('2d');
    this.particles = [];
    this.type      = 'stars';
    this.animId    = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setType(type) {
    this.type      = type;
    this.particles = [];
    this.init();
  }

  init() {
    const count =
      this.type === 'rain'  ? 150 :
      this.type === 'snow'  ? 100 :
      this.type === 'stars' ? 120 :
      this.type === 'sunny' ?  30 : 0;

    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle() {
    const W = this.canvas.width;
    const H = this.canvas.height;

    if (this.type === 'rain') {
      return {
        x:       Math.random() * W,
        y:       Math.random() * H - H,
        speed:   8 + Math.random() * 12,
        len:     20 + Math.random() * 30,
        opacity: 0.3 + Math.random() * 0.5,
        width:   0.5 + Math.random()
      };
    }

    if (this.type === 'snow') {
      return {
        x:       Math.random() * W,
        y:       Math.random() * H,
        radius:  1 + Math.random() * 4,
        speed:   0.5 + Math.random() * 1.5,
        drift:   (Math.random() - 0.5) * 0.5,
        opacity: 0.4 + Math.random() * 0.6
      };
    }

    if (this.type === 'stars') {
      return {
        x:            Math.random() * W,
        y:            Math.random() * H,
        radius:       Math.random() * 1.5,
        opacity:      Math.random(),
        twinkleSpeed: 0.02 + Math.random() * 0.04,
        twinkleDir:   Math.random() > 0.5 ? 1 : -1
      };
    }

    if (this.type === 'sunny') {
      return {
        x:       Math.random() * W,
        y:       Math.random() * H,
        radius:  1 + Math.random() * 3,
        speed:   0.2 + Math.random() * 0.5,
        opacity: 0.1 + Math.random() * 0.4,
        vy:      -(0.3 + Math.random() * 0.5)
      };
    }

    return {};
  }

  draw() {
    const ctx = this.ctx;
    const W   = this.canvas.width;
    const H   = this.canvas.height;
    ctx.clearRect(0, 0, W, H);

    this.particles.forEach(p => {

      if (this.type === 'rain') {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(174,214,241,${p.opacity})`;
        ctx.lineWidth   = p.width;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 2, p.y + p.len);
        ctx.stroke();
        p.y += p.speed;
        p.x -= 1;
        if (p.y > H) { p.y = -p.len; p.x = Math.random() * W; }
        return;
      }

      if (this.type === 'snow') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
        ctx.fill();
        p.y += p.speed;
        p.x += p.drift;
        if (p.y > H) { p.y = -10; p.x = Math.random() * W; }
        return;
      }

      if (this.type === 'stars') {
        p.opacity += p.twinkleSpeed * p.twinkleDir;
        if (p.opacity >= 1 || p.opacity <= 0) p.twinkleDir *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
        ctx.fill();
        return;
      }

      if (this.type === 'sunny') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,220,100,${p.opacity})`;
        ctx.fill();
        p.y       += p.vy;
        p.opacity -= 0.003;
        if (p.opacity <= 0) Object.assign(p, this.createParticle());
      }
    });
  }

  animate() {
    this.draw();
    this.animId = requestAnimationFrame(() => this.animate());
  }

  stop() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }

  start() {
    this.stop();
    this.animate();
  }
}

/* ================================================================
   BACKGROUND THEMES
   ================================================================ */
const bgThemes = {
  clear: {
    gradient: 'linear-gradient(135deg, #0f3460 0%, #1a6fc4 35%, #00aaff 65%, #0077cc 100%)',
    orb1:      'radial-gradient(circle, #1a8fe3, transparent)',
    orb2:      'radial-gradient(circle, #0055aa, transparent)',
    orb3:      'radial-gradient(circle, rgba(255,200,0,0.15), transparent)',
    particles: 'sunny'
  },
  clouds: {
    gradient: 'linear-gradient(135deg, #1a2a4a 0%, #2c4870 40%, #4a6fa5 70%, #3a5a80 100%)',
    orb1:      'radial-gradient(circle, #3a5a80, transparent)',
    orb2:      'radial-gradient(circle, #2c4870, transparent)',
    orb3:      'radial-gradient(circle, rgba(150,180,210,0.1), transparent)',
    particles: 'none'
  },
  rain: {
    gradient: 'linear-gradient(135deg, #0d1b2a 0%, #1a2d4a 40%, #0d2137 70%, #0a1520 100%)',
    orb1:      'radial-gradient(circle, #0d3a5c, transparent)',
    orb2:      'radial-gradient(circle, #063a5a, transparent)',
    orb3:      'radial-gradient(circle, rgba(0,150,200,0.1), transparent)',
    particles: 'rain'
  },
  snow: {
    gradient: 'linear-gradient(135deg, #1a2a4a 0%, #2c4060 40%, #354a6e 70%, #1e3050 100%)',
    orb1:      'radial-gradient(circle, #3a5a80, transparent)',
    orb2:      'radial-gradient(circle, #b0c8e0, transparent)',
    orb3:      'radial-gradient(circle, rgba(180,210,240,0.1), transparent)',
    particles: 'snow'
  },
  night: {
    gradient: 'linear-gradient(135deg, #04081a 0%, #0a1030 40%, #0e1540 70%, #050b20 100%)',
    orb1:      'radial-gradient(circle, #1a2050, transparent)',
    orb2:      'radial-gradient(circle, #3a1a6e, transparent)',
    orb3:      'radial-gradient(circle, rgba(100,80,200,0.1), transparent)',
    particles: 'stars'
  }
};

function applyTheme(condition) {
  const theme = bgThemes[condition] || bgThemes.clear;

  document.getElementById('bgGradient').style.background = theme.gradient;
  document.getElementById('bgOrb1').style.background     = theme.orb1;
  document.getElementById('bgOrb2').style.background     = theme.orb2;
  document.getElementById('bgOrb3').style.background     = theme.orb3;

  if (!particleSystem) return;

  if (theme.particles === 'none') {
    particleSystem.stop();
    particleSystem.particles = [];
    particleSystem.ctx.clearRect(
      0, 0,
      particleSystem.canvas.width,
      particleSystem.canvas.height
    );
  } else {
    particleSystem.setType(theme.particles);
    particleSystem.start();
  }
}

function getConditionKey(weatherMain, isNight) {
  if (isNight) return 'night';
  const m = (weatherMain || '').toLowerCase();
  if (m.includes('clear'))                                                    return 'clear';
  if (m.includes('cloud'))                                                    return 'clouds';
  if (m.includes('rain') || m.includes('drizzle') || m.includes('thunder'))  return 'rain';
  if (m.includes('snow'))                                                     return 'snow';
  return 'clear';
}

/* ================================================================
   WEATHER EMOJI MAP
   ================================================================ */
const weatherEmojis = {
  'clear sky':        '☀️',
  'few clouds':       '🌤️',
  'scattered clouds': '⛅',
  'broken clouds':    '🌥️',
  'overcast clouds':  '☁️',
  'shower rain':      '🌧️',
  'rain':             '🌦️',
  'thunderstorm':     '⛈️',
  'snow':             '❄️',
  'mist':             '🌫️',
  'haze':             '🌫️',
  'fog':              '🌫️',
  'smoke':            '💨',
  'dust':             '🌪️',
  'sand':             '🌪️',
  'ash':              '🌋',
  'squall':           '💨',
  'tornado':          '🌪️',
  'light rain':       '🌧️',
  'moderate rain':    '🌧️',
  'heavy rain':       '⛈️',
  'drizzle':          '🌦️',
  'light snow':       '🌨️',
  'heavy snow':       '❄️'
};

function getWeatherEmoji(description, isNight) {
  if (isNight && (description.includes('clear') || description.includes('few'))) return '🌙';
  const desc = (description || '').toLowerCase();
  for (const [key, emoji] of Object.entries(weatherEmojis)) {
    if (desc.includes(key)) return emoji;
  }
  if (desc.includes('cloud')) return '☁️';
  if (desc.includes('rain'))  return '🌧️';
  if (desc.includes('snow'))  return '❄️';
  if (desc.includes('clear')) return isNight ? '🌙' : '☀️';
  return '🌡️';
}

/* ================================================================
   SVG WEATHER ILLUSTRATIONS
   ================================================================ */
function getWeatherSVG(condition, isNight) {
  const condKey = getConditionKey(condition, isNight);

  const svgs = {

    clear: `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="sg" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stop-color="#FFD700"/>
            <stop offset="100%" stop-color="#FF8C00"/>
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <circle cx="100" cy="100" r="38" fill="url(#sg)" filter="url(#glow)">
          <animate attributeName="r" values="36;40;36" dur="3s" repeatCount="indefinite"/>
        </circle>
        <circle cx="100" cy="100" r="52" fill="rgba(255,215,0,0.1)">
          <animate attributeName="r" values="50;56;50" dur="3s" repeatCount="indefinite"/>
        </circle>
        <circle cx="100" cy="100" r="65" fill="rgba(255,200,0,0.05)">
          <animate attributeName="r" values="63;70;63" dur="4s" repeatCount="indefinite"/>
        </circle>
        <g stroke="#FFD700" stroke-width="3.5" stroke-linecap="round" opacity="0.8">
          ${Array.from({length: 8}, (_, i) => `
            <line x1="100" y1="18" x2="100" y2="8" transform="rotate(${i * 45} 100 100)">
              <animateTransform attributeName="transform" type="rotate"
                from="${i * 45} 100 100" to="${i * 45 + 360} 100 100"
                dur="10s" repeatCount="indefinite"/>
            </line>
          `).join('')}
        </g>
      </svg>`,

    clouds: `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="cg1" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stop-color="#b0c8e8"/>
            <stop offset="100%" stop-color="#7090b0"/>
          </radialGradient>
          <radialGradient id="cg2" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stop-color="#d0e0f0"/>
            <stop offset="100%" stop-color="#90aac8"/>
          </radialGradient>
        </defs>
        <g opacity="0.5">
          <circle cx="70"  cy="80" r="28" fill="url(#cg1)"/>
          <circle cx="100" cy="72" r="34" fill="url(#cg1)"/>
          <circle cx="130" cy="80" r="26" fill="url(#cg1)"/>
          <rect x="42" y="80" width="116" height="40" rx="20" fill="url(#cg1)"/>
        </g>
        <g>
          <circle cx="72"  cy="108" r="30" fill="url(#cg2)"/>
          <circle cx="105" cy="98"  r="38" fill="url(#cg2)"/>
          <circle cx="138" cy="108" r="28" fill="url(#cg2)"/>
          <rect x="42" y="108" width="124" height="42" rx="21" fill="url(#cg2)"/>
        </g>
        <animateTransform attributeName="transform" type="translate"
          values="0,0;8,0;0,0" dur="5s" repeatCount="indefinite"/>
      </svg>`,

    rain: `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="rg" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stop-color="#7090b0"/>
            <stop offset="100%" stop-color="#405870"/>
          </radialGradient>
        </defs>
        <circle cx="72"  cy="90" r="30" fill="url(#rg)"/>
        <circle cx="105" cy="80" r="38" fill="url(#rg)"/>
        <circle cx="138" cy="90" r="28" fill="url(#rg)"/>
        <rect x="42" y="90" width="124" height="35" rx="17" fill="url(#rg)"/>
        ${Array.from({length: 7}, (_, i) => `
          <line x1="${50 + i * 17}" y1="138"
                x2="${46 + i * 17}" y2="160"
                stroke="#60a8d0" stroke-width="2.5" stroke-linecap="round" opacity="0.8">
            <animate attributeName="y1" values="130;138;130" dur="${0.8 + i * 0.12}s" repeatCount="indefinite"/>
            <animate attributeName="y2" values="152;160;152" dur="${0.8 + i * 0.12}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur="${0.8 + i * 0.12}s" repeatCount="indefinite"/>
          </line>
        `).join('')}
      </svg>`,

    snow: `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="sng" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stop-color="#c0d8f0"/>
            <stop offset="100%" stop-color="#8098b8"/>
          </radialGradient>
        </defs>
        <circle cx="72"  cy="85" r="30" fill="url(#sng)"/>
        <circle cx="105" cy="75" r="38" fill="url(#sng)"/>
        <circle cx="138" cy="85" r="28" fill="url(#sng)"/>
        <rect x="42" y="85" width="124" height="35" rx="17" fill="url(#sng)"/>
        ${Array.from({length: 6}, (_, i) => `
          <text x="${50 + i * 19}" y="145"
                font-size="16" fill="white" opacity="0.8" text-anchor="middle">❄
            <animate attributeName="y"       values="135;155;135" dur="${1 + i * 0.2}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.8;0.2;0.8" dur="${1 + i * 0.2}s" repeatCount="indefinite"/>
          </text>
        `).join('')}
      </svg>`,

    night: `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="mg" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stop-color="#f0e0b8"/>
            <stop offset="100%" stop-color="#c0a870"/>
          </radialGradient>
          <filter id="mglow">
            <feGaussianBlur stdDeviation="6" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <circle cx="105" cy="95" r="38" fill="url(#mg)" filter="url(#mglow)" opacity="0.9">
          <animate attributeName="opacity" values="0.85;1;0.85" dur="4s" repeatCount="indefinite"/>
        </circle>
        <circle cx="128" cy="72" r="30" fill="#0a1030"/>
        ${[
          {x:50, y:40, r:1.5}, {x:155, y:55, r:1},   {x:35,  y:110, r:1.2},
          {x:170,y:120,r:1.8}, {x:80,  y:155,r:1},   {x:160, y:150, r:1.3}
        ].map(s => `
          <circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="white">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite"/>
          </circle>
        `).join('')}
      </svg>`
  };

  return svgs[condKey] || svgs.clear;
}

/* ================================================================
   LIVE CLOCK
   ================================================================ */
function startClock(tzOffset) {
  if (clockInterval) clearInterval(clockInterval);

  function updateClock() {
    const nowUtc  = new Date();
    const localMs = nowUtc.getTime() + (nowUtc.getTimezoneOffset() * 60000) + (tzOffset * 1000);
    const local   = new Date(localMs);
    const h = local.getHours().toString().padStart(2, '0');
    const m = local.getMinutes().toString().padStart(2, '0');
    const s = local.getSeconds().toString().padStart(2, '0');
    const el = document.getElementById('live-clock');
    if (el) el.textContent = `${h}:${m}:${s}`;
  }

  updateClock();
  clockInterval = setInterval(updateClock, 1000);
}

/* ================================================================
   TEMPERATURE COUNT-UP ANIMATION
   ================================================================ */
function animateTemp(targetTemp, elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const target    = Math.round(targetTemp);
  const duration  = 1200;
  const startTime = performance.now();

  function update(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

/* ================================================================
   FORMAT HELPERS
   ================================================================ */
function formatTime(unixTs, tzOffset) {
  const d    = new Date((unixTs + tzOffset) * 1000);
  const h    = d.getUTCHours();
  const m    = d.getUTCMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${(h % 12 || 12).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatHour(unixTs, tzOffset) {
  const d    = new Date((unixTs + tzOffset) * 1000);
  const h    = d.getUTCHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}${ampm}`;
}

function getDayName(unixTs, tzOffset) {
  const d    = new Date((unixTs + tzOffset) * 1000);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[d.getUTCDay()];
}

function getDateStr(unixTs, tzOffset) {
  const d      = new Date((unixTs + tzOffset) * 1000);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function isNightTime(current, sunrise, sunset) {
  return current < sunrise || current > sunset;
}

/* ================================================================
   DESCRIPTION HELPERS
   ================================================================ */
function getWindDescription(kmh) {
  if (kmh < 1)  return 'Calm';
  if (kmh < 6)  return 'Light Breeze';
  if (kmh < 12) return 'Gentle Breeze';
  if (kmh < 20) return 'Moderate Breeze';
  if (kmh < 29) return 'Fresh Breeze';
  if (kmh < 39) return 'Strong Breeze';
  if (kmh < 50) return 'Near Gale';
  if (kmh < 62) return 'Gale';
  return 'Storm';
}

function getHumidityDesc(h) {
  if (h < 30) return 'Very Dry';
  if (h < 50) return 'Comfortable';
  if (h < 70) return 'Moderate';
  if (h < 85) return 'Humid';
  return 'Very Humid';
}

function getVisibilityDesc(v) {
  if (v >= 10000) return 'Crystal Clear';
  if (v >= 7000)  return 'Good';
  if (v >= 4000)  return 'Moderate';
  if (v >= 2000)  return 'Poor';
  return 'Very Poor';
}

function getPressureDesc(p) {
  if (p < 1000) return 'Low Pressure';
  if (p < 1013) return 'Below Normal';
  if (p < 1020) return 'Normal';
  if (p < 1030) return 'High Pressure';
  return 'Very High';
}

/* ================================================================
   UNIT CONVERSION
   ================================================================ */
function celsiusToF(c)  { return Math.round(c * 9 / 5 + 32); }
function convertTemp(c) { return currentUnit === 'imperial' ? celsiusToF(c) : Math.round(c); }
function unitLabel()    { return currentUnit === 'imperial' ? '°F' : '°C'; }

function windConvert(ms) {
  return currentUnit === 'imperial'
    ? `${Math.round(ms * 2.237)} mph`
    : `${Math.round(ms * 3.6)} km/h`;
}

/* ================================================================
   LOADING / TOAST
   ================================================================ */
function showLoading() {
  document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.add('hidden');
}

function showToast(msg, type = 'error') {
  const t       = document.getElementById('toast');
  t.textContent = msg;
  t.className   = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3500);
}

/* ================================================================
   BUILD INFO CARDS
   ================================================================ */
function buildInfoCards(data) {
  const grid       = document.getElementById('infoGrid');
  const wind       = data.wind.speed;
  const windKmh    = Math.round(wind * 3.6);
  const windDir    = data.wind.deg || 0;
  const humidity   = data.main.humidity;
  const visibility = data.visibility || 10000;
  const pressure   = data.main.pressure;

  const dirLabels = ['N','NE','E','SE','S','SW','W','NW'];
  const dirIdx    = Math.round(windDir / 45) % 8;
  const dirLabel  = dirLabels[dirIdx];

  const cards = [
    {
      icon:  '💧',
      label: 'Humidity',
      value: `${humidity}%`,
      desc:  getHumidityDesc(humidity),
      bar:   humidity
    },
    {
      icon:  '💨',
      label: 'Wind Speed',
      value: windConvert(wind),
      desc:  `${dirLabel} · ${getWindDescription(windKmh)}`,
      bar:   Math.min((windKmh / 100) * 100, 100)
    },
    {
      icon:  '👁️',
      label: 'Visibility',
      value: visibility >= 1000 ? `${(visibility / 1000).toFixed(1)} km` : `${visibility} m`,
      desc:  getVisibilityDesc(visibility),
      bar:   Math.min((visibility / 10000) * 100, 100)
    },
    {
      icon:  '🌡️',
      label: 'Pressure',
      value: `${pressure} hPa`,
      desc:  getPressureDesc(pressure),
      bar:   Math.min(((pressure - 970) / 60) * 100, 100)
    },
    {
      icon:  '🌅',
      label: 'Sunrise',
      value: formatTime(data.sys.sunrise, data.timezone),
      desc:  'Local time'
    },
    {
      icon:  '🌇',
      label: 'Sunset',
      value: formatTime(data.sys.sunset, data.timezone),
      desc:  'Local time'
    },
    {
      icon:  '🌡️',
      label: 'Feels Like',
      value: `${convertTemp(data.main.feels_like)}${unitLabel()}`,
      desc:  data.main.feels_like > data.main.temp ? 'Warmer than actual' : 'Cooler than actual'
    },
    {
      icon:  '💧',
      label: 'Dew Point',
      value: `${convertTemp(data.main.temp_min)}${unitLabel()} – ${convertTemp(data.main.temp_max)}${unitLabel()}`,
      desc:  'Min / Max today',
      bar:   null
    }
  ];

  grid.innerHTML = cards.map(c => `
    <div class="info-card">
      <span class="info-icon">${c.icon}</span>
      <div class="info-label">${c.label}</div>
      <div class="info-value">${c.value}</div>
      ${c.desc ? `<div class="info-desc">${c.desc}</div>` : ''}
      ${c.bar !== undefined && c.bar !== null ? `
        <div class="info-bar">
          <div class="info-bar-fill" style="width:0%;" data-width="${c.bar}%"></div>
        </div>` : ''}
    </div>
  `).join('');

  // Animate progress bars
  setTimeout(() => {
    grid.querySelectorAll('.info-bar-fill').forEach(bar => {
      bar.style.width = bar.dataset.width;
    });
  }, 100);
}

/* ================================================================
   BUILD HOURLY FORECAST
   ================================================================ */
function buildHourly(forecastData, currentDt, tzOffset) {
  const container = document.getElementById('hourlyScroll');
  const items     = forecastData.list.slice(0, 12);

  container.innerHTML = items.map((item, idx) => {
    const night = isNightTime(item.dt, forecastData.city.sunrise, forecastData.city.sunset);
    const emoji = getWeatherEmoji(item.weather[0].description, night);
    const temp  = convertTemp(item.main.temp);

    return `
      <div class="hourly-card ${idx === 0 ? 'current' : ''}">
        <div class="hourly-time">${idx === 0 ? 'Now' : formatHour(item.dt, tzOffset)}</div>
        <span class="hourly-icon">${emoji}</span>
        <div class="hourly-temp">${temp}${unitLabel()}</div>
      </div>
    `;
  }).join('');
}

/* ================================================================
   BUILD 5-DAY FORECAST
   ================================================================ */
function build5Day(forecastData, tzOffset) {
  const container = document.getElementById('forecastList');
  const dailyMap  = {};

  forecastData.list.forEach(item => {
    const d   = new Date((item.dt + tzOffset) * 1000);
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
    if (!dailyMap[key]) {
      dailyMap[key] = { dt: item.dt, temps: [], conditions: [], descriptions: [] };
    }
    dailyMap[key].temps.push(item.main.temp);
    dailyMap[key].conditions.push(item.weather[0].main);
    dailyMap[key].descriptions.push(item.weather[0].description);
  });

  const days = Object.values(dailyMap).slice(0, 5);

  container.innerHTML = days.map((day, idx) => {
    const high     = Math.max(...day.temps);
    const low      = Math.min(...day.temps);
    const desc     = day.descriptions[Math.floor(day.descriptions.length / 2)];
    const emoji    = getWeatherEmoji(desc, false);
    const barWidth = Math.max(20, Math.min(100, ((high - low) / 20) * 100));

    return `
      <div class="forecast-card">
        <div class="forecast-day">
          <div>${idx === 0 ? 'Today' : getDayName(day.dt, tzOffset)}</div>
          <div class="forecast-date">${getDateStr(day.dt, tzOffset)}</div>
        </div>
        <div class="forecast-icon">${emoji}</div>
        <div class="forecast-condition">${desc}</div>
        <div class="forecast-temps">
          <div class="forecast-high">${convertTemp(high)}${unitLabel()}</div>
          <div class="forecast-low">${convertTemp(low)}${unitLabel()}</div>
        </div>
        <div class="forecast-temp-bar">
          <div class="forecast-temp-fill" style="width:${barWidth}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

/* ================================================================
   UPDATE SUN ARC
   ================================================================ */
function updateSunArc(sunrise, sunset, currentDt, tzOffset) {
  document.getElementById('sunriseTime').textContent = formatTime(sunrise, tzOffset);
  document.getElementById('sunsetTime').textContent  = formatTime(sunset,  tzOffset);

  const totalDuration = sunset - sunrise;
  const elapsed       = Math.max(0, Math.min(currentDt - sunrise, totalDuration));
  const progress      = totalDuration > 0 ? elapsed / totalDuration : 0;

  const dayHours = Math.floor(totalDuration / 3600);
  const dayMins  = Math.floor((totalDuration % 3600) / 60);
  document.getElementById('dayLength').textContent = `${dayHours}h ${dayMins}m`;

  const x    = 20 + progress * 260;
  const arcY = 75 - Math.sin(Math.PI * progress) * 75;
  const dot  = document.getElementById('sunDot');
  if (dot) { dot.setAttribute('cx', x); dot.setAttribute('cy', arcY); }
}

/* ================================================================
   UPDATE WIND CARD
   ================================================================ */
function updateWindCard(data) {
  const wind    = data.wind.speed;
  const windKmh = Math.round(wind * 3.6);
  const desc    = getWindDescription(windKmh);
  const pct     = Math.min(windKmh / 100, 1);
  const color   = pct > 0.7 ? '#ff4444' : pct > 0.4 ? '#ffa500' : '#00d4ff';
  const glow    = pct > 0.7 ? 'rgba(255,68,68,0.4)' : pct > 0.4 ? 'rgba(255,165,0,0.4)' : 'rgba(0,212,255,0.3)';

  document.getElementById('windCondition').textContent = desc;
  document.getElementById('windDetails').textContent   =
    `${windConvert(wind)} · ${data.wind.deg || 0}° direction · Gusts: ${windConvert(data.wind.gust || wind)}`;
  document.getElementById('windSpeed2').textContent    = windKmh;

  const circle = document.getElementById('aqiCircle');
  if (circle) {
    circle.style.setProperty('--aqi-color', color);
    circle.style.setProperty('--aqi-pct',   `${pct * 100}%`);
    circle.style.setProperty('--aqi-glow',  glow);
  }
}

/* ================================================================
   MAIN RENDER FUNCTION
   ================================================================ */
function renderWeather(current, forecast, overrideLocationName) {
  /*
   * overrideLocationName — optional string used when we want to
   * show a clean reverse-geocoded name (GPS flow) instead of the
   * raw name that comes back from the weather API.
   */
  currentWeatherData = { current, forecast, overrideLocationName };

  const tz      = current.timezone;
  const sunrise = current.sys.sunrise;
  const sunset  = current.sys.sunset;
  const dt      = current.dt;
  const night   = isNightTime(dt, sunrise, sunset);
  const condKey = getConditionKey(current.weather[0].main, night);

  currentCondition = condKey;

  // Background theme
  applyTheme(condKey);

  // SVG Icon
  document.getElementById('mainWeatherIcon').innerHTML =
    getWeatherSVG(current.weather[0].main, night);

  // ── Location display ──────────────────────────────────────────
  // Use the clean override name when available (GPS reverse-geocode)
  // otherwise fall back to what the weather API returned.
  if (overrideLocationName) {
    document.getElementById('cityName').textContent    = overrideLocationName.city;
    document.getElementById('countryName').textContent =
      `${overrideLocationName.country} · ${capitalise(current.weather[0].description)}`;
  } else {
    document.getElementById('cityName').textContent    = current.name;
    document.getElementById('countryName').textContent =
      `${current.sys.country} · ${capitalise(current.weather[0].description)}`;
  }

  // Date
  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  document.getElementById('currentDate').textContent = dateStr;

  // Temperature
  document.getElementById('tempUnit').textContent = unitLabel();
  animateTemp(convertTemp(current.main.temp), 'tempValue');

  // Condition & feels like
  document.getElementById('weatherCondition').textContent =
    capitalise(current.weather[0].description);
  document.getElementById('feelsLike').textContent =
    `Feels like ${convertTemp(current.main.feels_like)}${unitLabel()}`;

  // Sub-sections
  buildInfoCards(current);
  buildHourly(forecast, dt, tz);
  build5Day(forecast, tz);
  updateSunArc(sunrise, sunset, dt, tz);
  updateWindCard(current);
  startClock(tz);

  // Show weather content
  document.getElementById('welcomeScreen').style.display = 'none';
  const wc = document.getElementById('weatherContent');
  wc.classList.add('active');
  wc.style.animation = 'none';
  setTimeout(() => { wc.style.animation = 'fadeInUp 0.6s ease'; }, 10);

  hideLoading();
}

function capitalise(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}

/* ================================================================
   FETCH WEATHER — coordinates version (GPS or chosen geocode)
   Always uses lat/lon so the correct location is queried.
   ================================================================ */
async function fetchWeatherByCoords(lat, lon, overrideLocationName) {
  showLoading();
  try {
    const [cRes, fRes] = await Promise.all([
      fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
      fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`)
    ]);

    if (!cRes.ok) {
      const err = await cRes.json();
      throw new Error(err.message || 'Weather data unavailable');
    }

    const [current, forecast] = await Promise.all([cRes.json(), fRes.json()]);

    const displayName = overrideLocationName || null;
    renderWeather(current, forecast, displayName);

    const shownName = displayName ? displayName.city : current.name;
    showToast(`Weather loaded for ${shownName}`, 'success');

  } catch (err) {
    hideLoading();
    showToast(`❌ ${err.message || 'Failed to fetch weather'}`, 'error');
    console.error('HASSAM WEATHER fetch error:', err);
  }
}

/* ================================================================
   FETCH WEATHER — city-name version (typed search fallback only)
   Used only when we could not resolve exact coordinates.
   ================================================================ */
async function fetchWeatherByCity(cityName) {
  showLoading();
  try {
    const [cRes, fRes] = await Promise.all([
      fetch(`${BASE_URL}/weather?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric`),
      fetch(`${BASE_URL}/forecast?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric`)
    ]);

    if (!cRes.ok) {
      const err = await cRes.json();
      throw new Error(err.message || 'City not found');
    }

    const [current, forecast] = await Promise.all([cRes.json(), fRes.json()]);
    renderWeather(current, forecast, null);
    showToast(`Weather loaded for ${current.name}`, 'success');

  } catch (err) {
    hideLoading();
    showToast(`❌ ${err.message || 'Failed to fetch weather'}`, 'error');
    console.error('HASSAM WEATHER fetch error:', err);
  }
}

/* ================================================================
   REVERSE GEOCODING
   ──────────────────────────────────────────────────────────────
   Converts raw GPS lat/lon → a clean human-readable location name.
   The GPS coordinates themselves are NEVER replaced — only the
   display name is derived from the reverse-geocode result.

   Priority for display name:
     1. village / town / city_district (most local)
     2. city / municipality
     3. county (fallback)
     4. state (last resort)
   ================================================================ */
async function reverseGeocode(lat, lon) {
  /*
   * We use the OpenWeatherMap reverse-geocoding endpoint.
   * It returns up to 5 candidates — we always take index 0
   * (closest match) and build a clean name from it.
   */
  try {
    const res  = await fetch(
      `${GEO_URL}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
    );
    const data = await res.json();

    if (!data || !data.length) return null;

    const place = data[0];

    /*
     * `place.name` from OWM reverse-geocode is typically the
     * nearest settlement (village / town / city).  It is almost
     * always more accurate than the `name` field returned by the
     * weather endpoint when searching by coords.
     *
     * We also read `place.state` and `place.country` for the
     * subtitle line.
     */
    const cityPart    = place.name  || '';
    const statePart   = place.state || '';
    const countryCode = place.country || '';

    /*
     * Build a clean subtitle: "State, Country"
     * e.g. "Khyber Pakhtunkhwa, PK"
     */
    const parts = [statePart, countryCode].filter(Boolean);

    return {
      city:    cityPart,
      country: parts.join(', ')
    };

  } catch (e) {
    console.warn('Reverse geocode failed:', e);
    return null;
  }
}

/* ================================================================
   GEOLOCATION
   ──────────────────────────────────────────────────────────────
   1. Get the raw GPS coordinates from the browser.
   2. Reverse-geocode ONLY for the display name.
   3. Send the ORIGINAL GPS lat/lon to the weather API — never
      substitute the geocoded city's coordinates.
   ================================================================ */
function getLocation() {
  if (!navigator.geolocation) {
    showToast('Geolocation not supported by your browser');
    return;
  }

  showLoading();

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      // ── These are the exact GPS coordinates from the device ──
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      // Reverse-geocode to get a clean display name
      const locationName = await reverseGeocode(lat, lon);

      // Fetch weather using the ORIGINAL GPS coords (never swapped)
      await fetchWeatherByCoords(lat, lon, locationName);
    },
    () => {
      hideLoading();
      showToast('Location access denied. Please search manually.');
    },
    {
      enableHighAccuracy: true,   // request the best GPS fix available
      timeout:            10000,
      maximumAge:         0       // never use a cached position
    }
  );
}

/* ================================================================
   GEOCODING FOR SEARCH
   ──────────────────────────────────────────────────────────────
   Rules for picking the best result from the OWM geocoding API:

   UNWANTED result types — skip these when a better option exists:
     • names ending in "Tehsil", "Taluka", "Taluk"
     • names ending in "District", "Division"
     • names ending in "City Tehsil", "Town Committee"
     • names containing " Tehsil" anywhere

   PREFERRED types (in order):
     1. Exact city / locality / town / village match
     2. Any result whose name matches the query closely
     3. First result as last resort

   The display name is always cleaned up:
     • Strip administrative suffixes from the returned name
     • Show "City, Country" — never the raw OWM name for admin areas
   ================================================================ */

// Suffixes that indicate an administrative boundary, not a city
const ADMIN_SUFFIXES = [
  ' Tehsil', ' Taluka', ' Taluk',
  ' District', ' Division',
  ' City Tehsil', ' Town Committee',
  ' Sub-District', ' Subdistrict',
  ' County', ' Province',
  ' Prefecture', ' Oblast',
  ' Municipality'   // keep this low priority — only strip if needed
];

function isAdminResult(name) {
  const n = name || '';
  return ADMIN_SUFFIXES.some(suffix =>
    n.toLowerCase().endsWith(suffix.toLowerCase()) ||
    n.toLowerCase().includes(' tehsil') ||
    n.toLowerCase().includes(' taluka') ||
    n.toLowerCase().includes(' taluk')
  );
}

function cleanLocationName(name) {
  let cleaned = name || '';
  // Remove all known administrative suffixes
  ADMIN_SUFFIXES.forEach(suffix => {
    const re = new RegExp(suffix.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '$', 'i');
    cleaned  = cleaned.replace(re, '').trim();
  });
  return cleaned;
}

function scoreCandidates(candidates, query) {
  /*
   * Score each candidate.  Higher = better.
   * We want proper cities / towns, not admin zones.
   */
  const q = (query || '').toLowerCase().trim();

  return candidates.map(c => {
    let score = 0;
    const name = (c.name || '').toLowerCase();

    // Exact name match with query → strong bonus
    if (name === q) score += 100;

    // Name starts with query → good match
    if (name.startsWith(q)) score += 50;

    // Name contains query → partial match
    if (name.includes(q)) score += 20;

    // Penalise administrative results heavily
    if (isAdminResult(c.name)) score -= 80;

    return { candidate: c, score };
  });
}

function pickBestCandidate(candidates, query) {
  if (!candidates || !candidates.length) return null;

  const scored = scoreCandidates(candidates, query);
  scored.sort((a, b) => b.score - a.score);

  return scored[0].candidate;
}

/* ================================================================
   AUTOCOMPLETE DROPDOWN
   ================================================================ */
async function searchCities(query) {
  if (query.length < 2) return [];
  try {
    const res  = await fetch(
      `${GEO_URL}/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`
    );
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function buildDisplayLabel(candidate) {
  /*
   * Build a clean "City, State, Country" label for the dropdown.
   * If the candidate name is an admin result, clean it up.
   */
  const rawName = candidate.name || '';
  const city    = isAdminResult(rawName) ? cleanLocationName(rawName) : rawName;
  const state   = candidate.state   || '';
  const country = candidate.country || '';

  const parts = [city, state, country].filter(Boolean);
  return { label: parts.join(', '), city, country: [state, country].filter(Boolean).join(', ') };
}

function showDropdown(cities, query) {
  const dd = document.getElementById('searchDropdown');
  if (!cities.length) { dd.classList.remove('active'); return; }

  // Score and sort for display order too
  const scored = scoreCandidates(cities, query);
  scored.sort((a, b) => b.score - a.score);
  const sorted = scored.map(s => s.candidate);

  dd.innerHTML = sorted.map(c => {
    const { label } = buildDisplayLabel(c);
    return `
      <div class="dropdown-item"
           data-lat="${c.lat}"
           data-lon="${c.lon}"
           data-name="${buildDisplayLabel(c).city}"
           data-country="${buildDisplayLabel(c).country}">
        <span class="dropdown-item-icon">📍</span>
        <span>${label}</span>
      </div>
    `;
  }).join('');

  dd.classList.add('active');

  dd.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
      const lat     = parseFloat(item.dataset.lat);
      const lon     = parseFloat(item.dataset.lon);
      const city    = item.dataset.name;
      const country = item.dataset.country;

      document.getElementById('searchInput').value = city;
      dd.classList.remove('active');

      // Always fetch by exact coordinates — never by the city-name string
      fetchWeatherByCoords(lat, lon, { city, country });
    });
  });
}

/* ================================================================
   SEARCH HANDLER
   ──────────────────────────────────────────────────────────────
   When the user presses Enter or clicks Search:
     1. Geocode the query to get candidates
     2. Pick the best (non-admin) candidate
     3. Fetch weather by the candidate's exact coordinates
     4. Fall back to city-name query only if geocoding returns nothing
   ================================================================ */
async function handleSearch(query) {
  if (!query) { showToast('Please enter a city name'); return; }

  showLoading();

  try {
    const candidates = await searchCities(query);

    if (candidates && candidates.length) {
      const best         = pickBestCandidate(candidates, query);
      const { city, country } = buildDisplayLabel(best);

      // Update search box to show the clean resolved name
      document.getElementById('searchInput').value = city;
      document.getElementById('searchDropdown').classList.remove('active');

      // Fetch weather using the EXACT coordinates of the best match
      await fetchWeatherByCoords(best.lat, best.lon, { city, country });

    } else {
      // Geocoding returned nothing — fall back to name-based query
      document.getElementById('searchDropdown').classList.remove('active');
      await fetchWeatherByCity(query);
    }

  } catch (err) {
    hideLoading();
    showToast(`❌ ${err.message || 'Search failed'}`, 'error');
    console.error('HASSAM WEATHER search error:', err);
  }
}

/* ================================================================
   INITIALISE APP ON DOM READY
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* --- Particle System --- */
  const canvas   = document.getElementById('particle-canvas');
  particleSystem = new ParticleSystem(canvas);
  particleSystem.setType('stars');
  particleSystem.start();

  /* --- Search Input --- */
  const input    = document.getElementById('searchInput');
  const dropdown = document.getElementById('searchDropdown');

  input.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const val = input.value.trim();
    if (val.length < 2) { dropdown.classList.remove('active'); return; }
    searchTimeout = setTimeout(async () => {
      const cities = await searchCities(val);
      showDropdown(cities, val);
    }, 400);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const val = input.value.trim();
      dropdown.classList.remove('active');
      handleSearch(val);
    }
    if (e.key === 'Escape') dropdown.classList.remove('active');
  });

  /* --- Close dropdown on outside click --- */
  document.addEventListener('click', e => {
    if (!e.target.closest('.search-wrapper')) {
      dropdown.classList.remove('active');
    }
  });

  /* --- Search Button --- */
  document.getElementById('searchBtn').addEventListener('click', () => {
    const val = input.value.trim();
    dropdown.classList.remove('active');
    handleSearch(val);
  });

  /* --- Location Button --- */
  document.getElementById('locationBtn').addEventListener('click', getLocation);

  /* --- Refresh Button --- */
  document.getElementById('refreshBtn').addEventListener('click', () => {
    if (currentWeatherData) {
      // Re-fetch using the same coords stored in the last weather response
      const lat = currentWeatherData.current.coord.lat;
      const lon = currentWeatherData.current.coord.lon;
      fetchWeatherByCoords(lat, lon, currentWeatherData.overrideLocationName || null);
    } else {
      showToast('Search for a city first');
    }
  });

  /* --- Unit Toggle (°C / °F) --- */
  document.getElementById('unitToggleBtn').addEventListener('click', () => {
    currentUnit = currentUnit === 'metric' ? 'imperial' : 'metric';
    document.getElementById('unitToggleBtn').textContent =
      currentUnit === 'metric' ? '°C' : '°F';
    if (currentWeatherData) {
      renderWeather(
        currentWeatherData.current,
        currentWeatherData.forecast,
        currentWeatherData.overrideLocationName || null
      );
    }
  });

  /* --- Auto-detect location on load, fall back to London --- */
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat          = pos.coords.latitude;
        const lon          = pos.coords.longitude;
        const locationName = await reverseGeocode(lat, lon);
        await fetchWeatherByCoords(lat, lon, locationName);
      },
      () => fetchWeatherByCity('London'),
      {
        enableHighAccuracy: true,
        timeout:            5000,
        maximumAge:         0
      }
    );
  } else {
    fetchWeatherByCity('London');
  }

});