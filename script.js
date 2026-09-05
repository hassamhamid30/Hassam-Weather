/* ================================================================
   HASSAM WEATHER — script.js
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

const API_KEY   = '7827e5d85b0014264cb0afbf6e22f885';
const BASE_URL  = 'https://api.openweathermap.org/data/2.5';
const GEO_URL   = 'https://api.openweathermap.org/geo/1.0';
const NOMINATIM = 'https://nominatim.openstreetmap.org';

/* ================================================================
   APP STATE
   ================================================================ */
let currentUnit        = 'metric';
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
    for (let i = 0; i < count; i++) this.particles.push(this.createParticle());
  }
  createParticle() {
    const W = this.canvas.width;
    const H = this.canvas.height;
    if (this.type === 'rain') return {
      x:Math.random()*W, y:Math.random()*H-H,
      speed:8+Math.random()*12, len:20+Math.random()*30,
      opacity:0.3+Math.random()*0.5, width:0.5+Math.random()
    };
    if (this.type === 'snow') return {
      x:Math.random()*W, y:Math.random()*H,
      radius:1+Math.random()*4, speed:0.5+Math.random()*1.5,
      drift:(Math.random()-0.5)*0.5, opacity:0.4+Math.random()*0.6
    };
    if (this.type === 'stars') return {
      x:Math.random()*W, y:Math.random()*H,
      radius:Math.random()*1.5, opacity:Math.random(),
      twinkleSpeed:0.02+Math.random()*0.04,
      twinkleDir:Math.random()>0.5?1:-1
    };
    if (this.type === 'sunny') return {
      x:Math.random()*W, y:Math.random()*H,
      radius:1+Math.random()*3, speed:0.2+Math.random()*0.5,
      opacity:0.1+Math.random()*0.4, vy:-(0.3+Math.random()*0.5)
    };
    return {};
  }
  draw() {
    const ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;
    ctx.clearRect(0,0,W,H);
    this.particles.forEach(p => {
      if (this.type==='rain') {
        ctx.beginPath();
        ctx.strokeStyle=`rgba(174,214,241,${p.opacity})`;
        ctx.lineWidth=p.width;
        ctx.moveTo(p.x,p.y); ctx.lineTo(p.x-2,p.y+p.len); ctx.stroke();
        p.y+=p.speed; p.x-=1;
        if(p.y>H){p.y=-p.len;p.x=Math.random()*W;} return;
      }
      if (this.type==='snow') {
        ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,255,255,${p.opacity})`; ctx.fill();
        p.y+=p.speed; p.x+=p.drift;
        if(p.y>H){p.y=-10;p.x=Math.random()*W;} return;
      }
      if (this.type==='stars') {
        p.opacity+=p.twinkleSpeed*p.twinkleDir;
        if(p.opacity>=1||p.opacity<=0) p.twinkleDir*=-1;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,255,255,${p.opacity})`; ctx.fill(); return;
      }
      if (this.type==='sunny') {
        ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,220,100,${p.opacity})`; ctx.fill();
        p.y+=p.vy; p.opacity-=0.003;
        if(p.opacity<=0) Object.assign(p,this.createParticle());
      }
    });
  }
  animate() { this.draw(); this.animId=requestAnimationFrame(()=>this.animate()); }
  stop()    { if(this.animId) cancelAnimationFrame(this.animId); }
  start()   { this.stop(); this.animate(); }
}

/* ================================================================
   BACKGROUND THEMES
   ================================================================ */
const bgThemes = {
  clear:  { gradient:'linear-gradient(135deg,#0f3460 0%,#1a6fc4 35%,#00aaff 65%,#0077cc 100%)',
            orb1:'radial-gradient(circle,#1a8fe3,transparent)',
            orb2:'radial-gradient(circle,#0055aa,transparent)',
            orb3:'radial-gradient(circle,rgba(255,200,0,0.15),transparent)', particles:'sunny' },
  clouds: { gradient:'linear-gradient(135deg,#1a2a4a 0%,#2c4870 40%,#4a6fa5 70%,#3a5a80 100%)',
            orb1:'radial-gradient(circle,#3a5a80,transparent)',
            orb2:'radial-gradient(circle,#2c4870,transparent)',
            orb3:'radial-gradient(circle,rgba(150,180,210,0.1),transparent)', particles:'none' },
  rain:   { gradient:'linear-gradient(135deg,#0d1b2a 0%,#1a2d4a 40%,#0d2137 70%,#0a1520 100%)',
            orb1:'radial-gradient(circle,#0d3a5c,transparent)',
            orb2:'radial-gradient(circle,#063a5a,transparent)',
            orb3:'radial-gradient(circle,rgba(0,150,200,0.1),transparent)', particles:'rain' },
  snow:   { gradient:'linear-gradient(135deg,#1a2a4a 0%,#2c4060 40%,#354a6e 70%,#1e3050 100%)',
            orb1:'radial-gradient(circle,#3a5a80,transparent)',
            orb2:'radial-gradient(circle,#b0c8e0,transparent)',
            orb3:'radial-gradient(circle,rgba(180,210,240,0.1),transparent)', particles:'snow' },
  night:  { gradient:'linear-gradient(135deg,#04081a 0%,#0a1030 40%,#0e1540 70%,#050b20 100%)',
            orb1:'radial-gradient(circle,#1a2050,transparent)',
            orb2:'radial-gradient(circle,#3a1a6e,transparent)',
            orb3:'radial-gradient(circle,rgba(100,80,200,0.1),transparent)', particles:'stars' }
};

function applyTheme(condition) {
  const theme = bgThemes[condition] || bgThemes.clear;
  document.getElementById('bgGradient').style.background = theme.gradient;
  document.getElementById('bgOrb1').style.background     = theme.orb1;
  document.getElementById('bgOrb2').style.background     = theme.orb2;
  document.getElementById('bgOrb3').style.background     = theme.orb3;
  if (!particleSystem) return;
  if (theme.particles === 'none') {
    particleSystem.stop(); particleSystem.particles = [];
    particleSystem.ctx.clearRect(0,0,particleSystem.canvas.width,particleSystem.canvas.height);
  } else { particleSystem.setType(theme.particles); particleSystem.start(); }
}

function getConditionKey(weatherMain, isNight) {
  if (isNight) return 'night';
  const m = (weatherMain||'').toLowerCase();
  if (m.includes('clear'))                                                  return 'clear';
  if (m.includes('cloud'))                                                  return 'clouds';
  if (m.includes('rain')||m.includes('drizzle')||m.includes('thunder'))    return 'rain';
  if (m.includes('snow'))                                                   return 'snow';
  return 'clear';
}

/* ================================================================
   WEATHER EMOJI MAP
   ================================================================ */
const weatherEmojis = {
  'clear sky':'☀️','few clouds':'🌤️','scattered clouds':'⛅',
  'broken clouds':'🌥️','overcast clouds':'☁️','shower rain':'🌧️',
  'rain':'🌦️','thunderstorm':'⛈️','snow':'❄️','mist':'🌫️',
  'haze':'🌫️','fog':'🌫️','smoke':'💨','dust':'🌪️','sand':'🌪️',
  'ash':'🌋','squall':'💨','tornado':'🌪️','light rain':'🌧️',
  'moderate rain':'🌧️','heavy rain':'⛈️','drizzle':'🌦️',
  'light snow':'🌨️','heavy snow':'❄️'
};

function getWeatherEmoji(description, isNight) {
  if (isNight&&(description.includes('clear')||description.includes('few'))) return '🌙';
  const desc=(description||'').toLowerCase();
  for (const [key,emoji] of Object.entries(weatherEmojis)) { if(desc.includes(key)) return emoji; }
  if(desc.includes('cloud')) return '☁️';
  if(desc.includes('rain'))  return '🌧️';
  if(desc.includes('snow'))  return '❄️';
  if(desc.includes('clear')) return isNight?'🌙':'☀️';
  return '🌡️';
}

/* ================================================================
   SVG WEATHER ILLUSTRATIONS
   ================================================================ */
function getWeatherSVG(condition, isNight) {
  const condKey = getConditionKey(condition, isNight);
  const svgs = {
    clear:`<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FFD700"/>
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
        ${Array.from({length:8},(_,i)=>`
          <line x1="100" y1="18" x2="100" y2="8" transform="rotate(${i*45} 100 100)">
            <animateTransform attributeName="transform" type="rotate"
              from="${i*45} 100 100" to="${i*45+360} 100 100" dur="10s" repeatCount="indefinite"/>
          </line>`).join('')}
      </g></svg>`,

    clouds:`<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="cg1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#b0c8e8"/><stop offset="100%" stop-color="#7090b0"/>
        </radialGradient>
        <radialGradient id="cg2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#d0e0f0"/><stop offset="100%" stop-color="#90aac8"/>
        </radialGradient>
      </defs>
      <g opacity="0.5">
        <circle cx="70" cy="80" r="28" fill="url(#cg1)"/>
        <circle cx="100" cy="72" r="34" fill="url(#cg1)"/>
        <circle cx="130" cy="80" r="26" fill="url(#cg1)"/>
        <rect x="42" y="80" width="116" height="40" rx="20" fill="url(#cg1)"/>
      </g>
      <g>
        <circle cx="72" cy="108" r="30" fill="url(#cg2)"/>
        <circle cx="105" cy="98" r="38" fill="url(#cg2)"/>
        <circle cx="138" cy="108" r="28" fill="url(#cg2)"/>
        <rect x="42" y="108" width="124" height="42" rx="21" fill="url(#cg2)"/>
      </g>
      <animateTransform attributeName="transform" type="translate"
        values="0,0;8,0;0,0" dur="5s" repeatCount="indefinite"/>
      </svg>`,

    rain:`<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="rg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#7090b0"/><stop offset="100%" stop-color="#405870"/>
        </radialGradient>
      </defs>
      <circle cx="72" cy="90" r="30" fill="url(#rg)"/>
      <circle cx="105" cy="80" r="38" fill="url(#rg)"/>
      <circle cx="138" cy="90" r="28" fill="url(#rg)"/>
      <rect x="42" y="90" width="124" height="35" rx="17" fill="url(#rg)"/>
      ${Array.from({length:7},(_,i)=>`
        <line x1="${50+i*17}" y1="138" x2="${46+i*17}" y2="160"
          stroke="#60a8d0" stroke-width="2.5" stroke-linecap="round" opacity="0.8">
          <animate attributeName="y1" values="130;138;130" dur="${0.8+i*0.12}s" repeatCount="indefinite"/>
          <animate attributeName="y2" values="152;160;152" dur="${0.8+i*0.12}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="${0.8+i*0.12}s" repeatCount="indefinite"/>
        </line>`).join('')}
      </svg>`,

    snow:`<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sng" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#c0d8f0"/><stop offset="100%" stop-color="#8098b8"/>
        </radialGradient>
      </defs>
      <circle cx="72" cy="85" r="30" fill="url(#sng)"/>
      <circle cx="105" cy="75" r="38" fill="url(#sng)"/>
      <circle cx="138" cy="85" r="28" fill="url(#sng)"/>
      <rect x="42" y="85" width="124" height="35" rx="17" fill="url(#sng)"/>
      ${Array.from({length:6},(_,i)=>`
        <text x="${50+i*19}" y="145" font-size="16" fill="white" opacity="0.8" text-anchor="middle">❄
          <animate attributeName="y" values="135;155;135" dur="${1+i*0.2}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="${1+i*0.2}s" repeatCount="indefinite"/>
        </text>`).join('')}
      </svg>`,

    night:`<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="mg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#f0e0b8"/><stop offset="100%" stop-color="#c0a870"/>
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
      ${[{x:50,y:40,r:1.5},{x:155,y:55,r:1},{x:35,y:110,r:1.2},
         {x:170,y:120,r:1.8},{x:80,y:155,r:1},{x:160,y:150,r:1.3}].map(s=>`
        <circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="white">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite"/>
        </circle>`).join('')}
      </svg>`
  };
  return svgs[condKey]||svgs.clear;
}

/* ================================================================
   LIVE CLOCK
   ================================================================ */
function startClock(tzOffset) {
  if (clockInterval) clearInterval(clockInterval);
  function updateClock() {
    const nowUtc  = new Date();
    const localMs = nowUtc.getTime()+(nowUtc.getTimezoneOffset()*60000)+(tzOffset*1000);
    const local   = new Date(localMs);
    const h=local.getHours().toString().padStart(2,'0');
    const m=local.getMinutes().toString().padStart(2,'0');
    const s=local.getSeconds().toString().padStart(2,'0');
    const el=document.getElementById('live-clock');
    if(el) el.textContent=`${h}:${m}:${s}`;
  }
  updateClock();
  clockInterval=setInterval(updateClock,1000);
}

/* ================================================================
   TEMPERATURE ANIMATION
   ================================================================ */
function animateTemp(targetTemp, elementId) {
  const el=document.getElementById(elementId);
  if(!el) return;
  const target=Math.round(targetTemp), duration=1200, startTime=performance.now();
  function update(now) {
    const elapsed=now-startTime, progress=Math.min(elapsed/duration,1);
    const eased=1-Math.pow(1-progress,3);
    el.textContent=Math.round(eased*target);
    if(progress<1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

/* ================================================================
   FORMAT HELPERS
   ================================================================ */
function formatTime(unixTs, tzOffset) {
  const d=new Date((unixTs+tzOffset)*1000), h=d.getUTCHours(), m=d.getUTCMinutes();
  const ampm=h>=12?'PM':'AM';
  return `${(h%12||12).toString().padStart(2,'0')}:${m.toString().padStart(2,'0')} ${ampm}`;
}
function formatHour(unixTs, tzOffset) {
  const d=new Date((unixTs+tzOffset)*1000), h=d.getUTCHours();
  return `${h%12||12}${h>=12?'PM':'AM'}`;
}
function getDayName(unixTs, tzOffset) {
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date((unixTs+tzOffset)*1000).getUTCDay()];
}
function getDateStr(unixTs, tzOffset) {
  const d=new Date((unixTs+tzOffset)*1000);
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}
function isNightTime(current,sunrise,sunset){ return current<sunrise||current>sunset; }
function capitalise(str){ return str?str.charAt(0).toUpperCase()+str.slice(1):str; }

/* ================================================================
   DESCRIPTION HELPERS
   ================================================================ */
function getWindDescription(kmh) {
  if(kmh<1)  return 'Calm';        if(kmh<6)  return 'Light Breeze';
  if(kmh<12) return 'Gentle Breeze'; if(kmh<20) return 'Moderate Breeze';
  if(kmh<29) return 'Fresh Breeze'; if(kmh<39) return 'Strong Breeze';
  if(kmh<50) return 'Near Gale';   if(kmh<62) return 'Gale';
  return 'Storm';
}
function getHumidityDesc(h) {
  if(h<30) return 'Very Dry'; if(h<50) return 'Comfortable';
  if(h<70) return 'Moderate'; if(h<85) return 'Humid'; return 'Very Humid';
}
function getVisibilityDesc(v) {
  if(v>=10000) return 'Crystal Clear'; if(v>=7000) return 'Good';
  if(v>=4000)  return 'Moderate';      if(v>=2000) return 'Poor'; return 'Very Poor';
}
function getPressureDesc(p) {
  if(p<1000) return 'Low Pressure'; if(p<1013) return 'Below Normal';
  if(p<1020) return 'Normal';        if(p<1030) return 'High Pressure'; return 'Very High';
}

/* ================================================================
   UNIT CONVERSION
   ================================================================ */
function celsiusToF(c)  { return Math.round(c*9/5+32); }
function convertTemp(c) { return currentUnit==='imperial'?celsiusToF(c):Math.round(c); }
function unitLabel()    { return currentUnit==='imperial'?'°F':'°C'; }
function windConvert(ms){ return currentUnit==='imperial'?`${Math.round(ms*2.237)} mph`:`${Math.round(ms*3.6)} km/h`; }

/* ================================================================
   LOADING / TOAST
   ================================================================ */
function showLoading(){ document.getElementById('loadingOverlay').classList.remove('hidden'); }
function hideLoading(){ document.getElementById('loadingOverlay').classList.add('hidden'); }
function showToast(msg,type='error'){
  const t=document.getElementById('toast');
  t.textContent=msg; t.className=`toast ${type} show`;
  setTimeout(()=>t.classList.remove('show'),3500);
}

/* ================================================================
   BUILD INFO CARDS
   ================================================================ */
function buildInfoCards(data) {
  const grid=document.getElementById('infoGrid');
  const wind=data.wind.speed, windKmh=Math.round(wind*3.6), windDir=data.wind.deg||0;
  const humidity=data.main.humidity, visibility=data.visibility||10000, pressure=data.main.pressure;
  const dirLabels=['N','NE','E','SE','S','SW','W','NW'];
  const dirLabel=dirLabels[Math.round(windDir/45)%8];

  const cards=[
    {icon:'💧',label:'Humidity',value:`${humidity}%`,desc:getHumidityDesc(humidity),bar:humidity},
    {icon:'💨',label:'Wind Speed',value:windConvert(wind),desc:`${dirLabel} · ${getWindDescription(windKmh)}`,bar:Math.min((windKmh/100)*100,100)},
    {icon:'👁️',label:'Visibility',value:visibility>=1000?`${(visibility/1000).toFixed(1)} km`:`${visibility} m`,desc:getVisibilityDesc(visibility),bar:Math.min((visibility/10000)*100,100)},
    {icon:'🌡️',label:'Pressure',value:`${pressure} hPa`,desc:getPressureDesc(pressure),bar:Math.min(((pressure-970)/60)*100,100)},
    {icon:'🌅',label:'Sunrise',value:formatTime(data.sys.sunrise,data.timezone),desc:'Local time'},
    {icon:'🌇',label:'Sunset',value:formatTime(data.sys.sunset,data.timezone),desc:'Local time'},
    {icon:'🌡️',label:'Feels Like',value:`${convertTemp(data.main.feels_like)}${unitLabel()}`,desc:data.main.feels_like>data.main.temp?'Warmer than actual':'Cooler than actual'},
    {icon:'💧',label:'Dew Point',value:`${convertTemp(data.main.temp_min)}${unitLabel()} – ${convertTemp(data.main.temp_max)}${unitLabel()}`,desc:'Min / Max today',bar:null}
  ];

  grid.innerHTML=cards.map(c=>`
    <div class="info-card">
      <span class="info-icon">${c.icon}</span>
      <div class="info-label">${c.label}</div>
      <div class="info-value">${c.value}</div>
      ${c.desc?`<div class="info-desc">${c.desc}</div>`:''}
      ${c.bar!==undefined&&c.bar!==null?`<div class="info-bar"><div class="info-bar-fill" style="width:0%;" data-width="${c.bar}%"></div></div>`:''}
    </div>`).join('');

  setTimeout(()=>{
    grid.querySelectorAll('.info-bar-fill').forEach(b=>{b.style.width=b.dataset.width;});
  },100);
}

/* ================================================================
   BUILD HOURLY FORECAST
   ================================================================ */
function buildHourly(forecastData,currentDt,tzOffset){
  const container=document.getElementById('hourlyScroll');
  container.innerHTML=forecastData.list.slice(0,12).map((item,idx)=>{
    const night=isNightTime(item.dt,forecastData.city.sunrise,forecastData.city.sunset);
    const emoji=getWeatherEmoji(item.weather[0].description,night);
    const temp=convertTemp(item.main.temp);
    return `<div class="hourly-card ${idx===0?'current':''}">
      <div class="hourly-time">${idx===0?'Now':formatHour(item.dt,tzOffset)}</div>
      <span class="hourly-icon">${emoji}</span>
      <div class="hourly-temp">${temp}${unitLabel()}</div>
    </div>`;
  }).join('');
}

/* ================================================================
   BUILD 5-DAY FORECAST
   ================================================================ */
function build5Day(forecastData,tzOffset){
  const container=document.getElementById('forecastList');
  const dailyMap={};
  forecastData.list.forEach(item=>{
    const d=new Date((item.dt+tzOffset)*1000);
    const key=`${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
    if(!dailyMap[key]) dailyMap[key]={dt:item.dt,temps:[],conditions:[],descriptions:[]};
    dailyMap[key].temps.push(item.main.temp);
    dailyMap[key].conditions.push(item.weather[0].main);
    dailyMap[key].descriptions.push(item.weather[0].description);
  });
  container.innerHTML=Object.values(dailyMap).slice(0,5).map((day,idx)=>{
    const high=Math.max(...day.temps), low=Math.min(...day.temps);
    const desc=day.descriptions[Math.floor(day.descriptions.length/2)];
    const emoji=getWeatherEmoji(desc,false);
    const barWidth=Math.max(20,Math.min(100,((high-low)/20)*100));
    return `<div class="forecast-card">
      <div class="forecast-day">
        <div>${idx===0?'Today':getDayName(day.dt,tzOffset)}</div>
        <div class="forecast-date">${getDateStr(day.dt,tzOffset)}</div>
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
    </div>`;
  }).join('');
}

/* ================================================================
   UPDATE SUN ARC
   ================================================================ */
function updateSunArc(sunrise,sunset,currentDt,tzOffset){
  document.getElementById('sunriseTime').textContent=formatTime(sunrise,tzOffset);
  document.getElementById('sunsetTime').textContent =formatTime(sunset, tzOffset);
  const totalDuration=sunset-sunrise;
  const elapsed=Math.max(0,Math.min(currentDt-sunrise,totalDuration));
  const progress=totalDuration>0?elapsed/totalDuration:0;
  const dayHours=Math.floor(totalDuration/3600), dayMins=Math.floor((totalDuration%3600)/60);
  document.getElementById('dayLength').textContent=`${dayHours}h ${dayMins}m`;
  const x=20+progress*260, arcY=75-Math.sin(Math.PI*progress)*75;
  const dot=document.getElementById('sunDot');
  if(dot){dot.setAttribute('cx',x);dot.setAttribute('cy',arcY);}
}

/* ================================================================
   UPDATE WIND CARD
   ================================================================ */
function updateWindCard(data){
  const wind=data.wind.speed, windKmh=Math.round(wind*3.6);
  const pct=Math.min(windKmh/100,1);
  const color=pct>0.7?'#ff4444':pct>0.4?'#ffa500':'#00d4ff';
  const glow =pct>0.7?'rgba(255,68,68,0.4)':pct>0.4?'rgba(255,165,0,0.4)':'rgba(0,212,255,0.3)';
  document.getElementById('windCondition').textContent=getWindDescription(windKmh);
  document.getElementById('windDetails').textContent=
    `${windConvert(wind)} · ${data.wind.deg||0}° direction · Gusts: ${windConvert(data.wind.gust||wind)}`;
  document.getElementById('windSpeed2').textContent=windKmh;
  const circle=document.getElementById('aqiCircle');
  if(circle){
    circle.style.setProperty('--aqi-color',color);
    circle.style.setProperty('--aqi-pct',`${pct*100}%`);
    circle.style.setProperty('--aqi-glow',glow);
  }
}

/* ================================================================
   RENDER WEATHER
   ================================================================ */
function renderWeather(current,forecast,locationLabel){
  currentWeatherData={current,forecast,locationLabel};
  const tz=current.timezone, sunrise=current.sys.sunrise, sunset=current.sys.sunset, dt=current.dt;
  const night=isNightTime(dt,sunrise,sunset);
  const condKey=getConditionKey(current.weather[0].main,night);
  currentCondition=condKey;
  applyTheme(condKey);
  document.getElementById('mainWeatherIcon').innerHTML=getWeatherSVG(current.weather[0].main,night);

  if(locationLabel&&locationLabel.city){
    document.getElementById('cityName').textContent   =locationLabel.city;
    document.getElementById('countryName').textContent=`${locationLabel.country} · ${capitalise(current.weather[0].description)}`;
  } else {
    document.getElementById('cityName').textContent   =current.name;
    document.getElementById('countryName').textContent=`${current.sys.country} · ${capitalise(current.weather[0].description)}`;
  }

  document.getElementById('currentDate').textContent=new Date().toLocaleDateString('en-US',{
    weekday:'long',year:'numeric',month:'long',day:'numeric'
  });
  document.getElementById('tempUnit').textContent=unitLabel();
  animateTemp(convertTemp(current.main.temp),'tempValue');
  document.getElementById('weatherCondition').textContent=capitalise(current.weather[0].description);
  document.getElementById('feelsLike').textContent=`Feels like ${convertTemp(current.main.feels_like)}${unitLabel()}`;

  buildInfoCards(current);
  buildHourly(forecast,dt,tz);
  build5Day(forecast,tz);
  updateSunArc(sunrise,sunset,dt,tz);
  updateWindCard(current);
  startClock(tz);

  document.getElementById('welcomeScreen').style.display='none';
  const wc=document.getElementById('weatherContent');
  wc.classList.add('active');
  wc.style.animation='none';
  setTimeout(()=>{wc.style.animation='fadeInUp 0.6s ease';},10);
  hideLoading();
}

/* ================================================================
   WEATHER API
   ================================================================ */
async function fetchWeatherByCoords(lat,lon,locationLabel){
  showLoading();
  try {
    const [cRes,fRes]=await Promise.all([
      fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
      fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`)
    ]);
    if(!cRes.ok){const err=await cRes.json();throw new Error(err.message||'Weather data unavailable');}
    const [current,forecast]=await Promise.all([cRes.json(),fRes.json()]);
    renderWeather(current,forecast,locationLabel||null);
    showToast(`Weather loaded for ${locationLabel?locationLabel.city:current.name}`,'success');
  } catch(err){
    hideLoading();
    showToast(`❌ ${err.message||'Failed to fetch weather'}`,'error');
    console.error('HASSAM WEATHER error:',err);
  }
}

async function fetchWeatherByCity(cityName){
  showLoading();
  try {
    const [cRes,fRes]=await Promise.all([
      fetch(`${BASE_URL}/weather?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric`),
      fetch(`${BASE_URL}/forecast?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric`)
    ]);
    if(!cRes.ok){const err=await cRes.json();throw new Error(err.message||'City not found');}
    const [current,forecast]=await Promise.all([cRes.json(),fRes.json()]);
    renderWeather(current,forecast,null);
    showToast(`Weather loaded for ${current.name}`,'success');
  } catch(err){
    hideLoading();
    showToast(`❌ ${err.message||'Failed to fetch weather'}`,'error');
    console.error('HASSAM WEATHER error:',err);
  }
}

/* ================================================================
   GEOCODING — OWM
   ================================================================ */
async function geocodeOWM(query){
  try {
    const res=await fetch(`${GEO_URL}/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`);
    const data=await res.json();
    return Array.isArray(data)?data:[];
  } catch{return [];}
}

/* ================================================================
   GEOCODING — Nominatim (villages, hamlets, local areas)
   ================================================================ */
async function geocodeNominatim(query){
  try {
    const params=new URLSearchParams({
      q:query,format:'json',limit:'10',
      addressdetails:'1',extratags:'1',namedetails:'1','accept-language':'en'
    });
    const res=await fetch(`${NOMINATIM}/search?${params}`,{
      headers:{'User-Agent':'HassamWeatherApp/1.0'}
    });
    const data=await res.json();
    return Array.isArray(data)?data:[];
  } catch{return [];}
}

/* ================================================================
   REVERSE GEOCODING — Nominatim (GPS display name only)
   ================================================================ */
async function reverseGeocode(lat,lon){
  try {
    const params=new URLSearchParams({
      lat,lon,format:'json',zoom:'14',addressdetails:'1','accept-language':'en'
    });
    const res=await fetch(`${NOMINATIM}/reverse?${params}`,{
      headers:{'User-Agent':'HassamWeatherApp/1.0'}
    });
    const data=await res.json();
    if(!data||!data.address) throw new Error('no address');
    return buildLabelFromAddress(data.address);
  } catch {
    try {
      const res=await fetch(`${GEO_URL}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`);
      const data=await res.json();
      if(!data||!data.length) return null;
      const p=data[0];
      return{city:p.name||'',country:[p.state,p.country].filter(Boolean).join(', ')};
    } catch{return null;}
  }
}

/* ================================================================
   ADDRESS → CLEAN LABEL
   Priority (most local first):
   village > hamlet > suburb > neighbourhood > quarter >
   town > city_district > city > municipality > county
   ================================================================ */
function buildLabelFromAddress(addr){
  if(!addr) return null;
  const city=
    addr.village||addr.hamlet||addr.suburb||addr.neighbourhood||
    addr.quarter||addr.town||addr.city_district||addr.city||
    addr.municipality||addr.county||addr.state_district||addr.state||'';
  const district=addr.county||addr.state_district||addr.district||'';
  const state  =addr.state||'';
  const country=addr.country||(addr.country_code||'').toUpperCase();
  const seen=new Set();
  const parts=[district,state,country].filter(s=>{
    s=s.trim(); if(!s||seen.has(s)) return false; seen.add(s); return true;
  });
  return{city:city.trim(),country:parts.join(', ')};
}

/* ================================================================
   ADMIN-TYPE DETECTION
   ================================================================ */
const ADMIN_TYPES=new Set([
  'administrative','political','district','division',
  'tehsil','taluka','taluk','county','province',
  'state','region','municipality','town_council','city_council'
]);
const ADMIN_SUFFIXES=[
  ' Tehsil',' Taluka',' Taluk',' District',' Division',
  ' City Tehsil',' Town Committee',' Sub-District',
  ' County',' Province',' Oblast',' Administrative Unit',
  ' Metropolitan',' Corporation'
];
function isAdminResult(name,type){
  if(type&&ADMIN_TYPES.has(type.toLowerCase())) return true;
  const n=(name||'').toLowerCase();
  return ADMIN_SUFFIXES.some(s=>n.endsWith(s.toLowerCase()));
}

/* ================================================================
   PLACE-TYPE SCORE TABLE
   ================================================================ */
const PLACE_SCORE={
  village:100,hamlet:95,locality:92,isolated_dwelling:88,
  suburb:85,neighbourhood:82,quarter:80,
  town:75,borough:70,city_district:65,city:60,municipality:45,
  county:20,state_district:15,state:10,
  administrative:5,district:5,division:5,region:3,province:3
};

/* ================================================================
   SCORING
   ================================================================ */
function scoreNominatim(item,query){
  const q=(query||'').toLowerCase().trim();
  const type=(item.type||'').toLowerCase(), cls=(item.class||'').toLowerCase();
  const rawName=(item.namedetails&&item.namedetails.name)
    ?item.namedetails.name:(item.display_name||'').split(',')[0];
  const nameLow=rawName.toLowerCase().trim();
  const dispLow=(item.display_name||'').toLowerCase();
  let score=PLACE_SCORE[type]||PLACE_SCORE[cls]||0;
  if(nameLow===q)              score+=200;
  else if(nameLow.startsWith(q)) score+=100;
  else if(nameLow.includes(q))   score+=50;
  else if(dispLow.includes(q))   score+=20;
  if(isAdminResult(rawName,type)) score-=150;
  if(cls==='boundary')            score-=200;
  if(type==='administrative')     score-=100;
  score+=parseFloat(item.importance||0)*30;
  return score;
}
function scoreOWM(item,query){
  const q=(query||'').toLowerCase().trim();
  const name=(item.name||'').toLowerCase();
  let score=50;
  if(name===q)               score+=200;
  else if(name.startsWith(q)) score+=80;
  else if(name.includes(q))   score+=30;
  if(isAdminResult(item.name,null)) score-=150;
  return score;
}

/* ================================================================
   NORMALISE
   ================================================================ */
function normaliseOWM(items,query){
  return items.map(item=>{
    const city=item.name||'', state=item.state||'', country=item.country||'';
    return{
      lat:item.lat, lon:item.lon,
      label:{city, country:[state,country].filter(Boolean).join(', '), full:[city,state,country].filter(Boolean).join(', ')},
      score:scoreOWM(item,query), source:'owm'
    };
  });
}
function normaliseNominatim(items,query){
  return items
    .filter(item=>!(item.class==='boundary'&&ADMIN_TYPES.has((item.type||'').toLowerCase())))
    .map(item=>{
      const addr=item.address||{};
      const label=buildLabelFromAddress(addr);
      const rawFirst=(item.display_name||'').split(',')[0].trim();
      return{
        lat:parseFloat(item.lat), lon:parseFloat(item.lon),
        label:label||{city:rawFirst,country:addr.country||''},
        score:scoreNominatim(item,query), source:'nominatim'
      };
    });
}

/* ================================================================
   HAVERSINE DISTANCE
   ================================================================ */
function haversineKm(lat1,lon1,lat2,lon2){
  const R=6371, dL=(lat2-lat1)*Math.PI/180, dO=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dL/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dO/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

/* ================================================================
   COMBINED GEOCODE
   ================================================================ */
async function geocodeCombined(query){
  const [owmRaw,nomRaw]=await Promise.all([geocodeOWM(query),geocodeNominatim(query)]);
  const all=[...normaliseNominatim(nomRaw,query),...normaliseOWM(owmRaw,query)];
  const deduped=[];
  all.forEach(candidate=>{
    const dup=deduped.find(e=>haversineKm(candidate.lat,candidate.lon,e.lat,e.lon)<1.0);
    if(dup){if(candidate.score>dup.score) Object.assign(dup,candidate);}
    else deduped.push({...candidate});
  });
  deduped.sort((a,b)=>b.score-a.score);
  return deduped;
}

/* ================================================================
   HTML SANITISER
   ================================================================ */
function sanitise(str){
  return (str||'')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ================================================================
   POSITION DROPDOWN
   ──────────────────────────────────────────────────────────────
   On mobile (≤768px) the dropdown uses position:fixed so it
   can escape any overflow:hidden ancestor.
   We calculate its top from the input's getBoundingClientRect().
   On desktop we reset to CSS-driven absolute positioning.
   ================================================================ */
function positionDropdown(){
  const dd    = document.getElementById('searchDropdown');
  const input = document.getElementById('searchInput');
  if(!dd || !input) return;

  if(window.innerWidth <= 768){
    const rect   = input.getBoundingClientRect();
    const top    = rect.bottom + 8;                    // 8px gap below input
    const left   = 12;                                 // matches CSS left:12px
    const right  = 12;
    const maxH   = window.innerHeight - top - 16;      // stop before bottom edge

    dd.style.top       = `${top}px`;
    dd.style.maxHeight = `${Math.max(120, maxH)}px`;   // at least 120px tall
    dd.style.left      = `${left}px`;
    dd.style.right     = `${right}px`;
    dd.style.width     = `calc(100vw - ${left+right}px)`;
  } else {
    /* Reset — CSS handles desktop layout */
    dd.style.top       = '';
    dd.style.maxHeight = '';
    dd.style.left      = '';
    dd.style.right     = '';
    dd.style.width     = '';
  }
}

/* ================================================================
   SHOW DROPDOWN
   ──────────────────────────────────────────────────────────────
   Each result renders as TWO lines so complete information is
   always visible regardless of screen width:

     Line 1: locality / city name    (bold, white, larger)
     Line 2: region, country         (lighter, smaller)

   Both lines wrap freely — no truncation, no nowrap.
   ================================================================ */
function showDropdown(candidates){
  const dd=document.getElementById('searchDropdown');
  if(!candidates||!candidates.length){ dd.classList.remove('active'); return; }

  const shown=candidates.slice(0,6);

  dd.innerHTML=shown.map(c=>{
    /* Encode for data attributes, sanitise for display */
    const cityDisplay    = sanitise(c.label.city    || 'Unknown location');
    const countryDisplay = sanitise(c.label.country || '');

    return `
      <div class="dropdown-item"
           data-lat="${c.lat}"
           data-lon="${c.lon}"
           data-city="${encodeURIComponent(c.label.city    || '')}"
           data-country="${encodeURIComponent(c.label.country || '')}">
        <span class="dropdown-item-icon">📍</span>
        <span class="dropdown-item-text">
          <span class="dropdown-item-city">${cityDisplay}</span>
          ${countryDisplay
            ? `<span class="dropdown-item-country">${countryDisplay}</span>`
            : ''}
        </span>
      </div>`;
  }).join('');

  dd.classList.add('active');

  /* Calculate position AFTER adding to DOM (so height is known) */
  positionDropdown();

  /* Bind events — both click and touchend for mobile reliability */
  dd.querySelectorAll('.dropdown-item').forEach(item=>{
    const handleSelect = e => {
      e.preventDefault();
      e.stopPropagation();

      const lat     = parseFloat(item.dataset.lat);
      const lon     = parseFloat(item.dataset.lon);
      const city    = decodeURIComponent(item.dataset.city);
      const country = decodeURIComponent(item.dataset.country);

      document.getElementById('searchInput').value = city;
      dd.classList.remove('active');

      /* Always fetch by exact coordinates */
      fetchWeatherByCoords(lat, lon, { city, country });
    };

    item.addEventListener('click',    handleSelect);
    item.addEventListener('touchend', handleSelect, { passive: false });
  });
}

/* ================================================================
   SEARCH HANDLER
   ================================================================ */
async function handleSearch(query){
  if(!query||!query.trim()){
    showToast('Please enter a city, town, or village name');
    return;
  }
  showLoading();
  try {
    const candidates=await geocodeCombined(query.trim());
    if(candidates.length){
      const best=candidates[0];
      document.getElementById('searchInput').value=best.label.city;
      document.getElementById('searchDropdown').classList.remove('active');
      await fetchWeatherByCoords(best.lat,best.lon,best.label);
    } else {
      document.getElementById('searchDropdown').classList.remove('active');
      await fetchWeatherByCity(query.trim());
    }
  } catch(err){
    hideLoading();
    showToast(`❌ ${err.message||'Search failed'}`,'error');
    console.error('HASSAM WEATHER search error:',err);
  }
}

/* ================================================================
   GEOLOCATION
   ================================================================ */
function getLocation(){
  if(!navigator.geolocation){ showToast('Geolocation not supported'); return; }
  showLoading();
  navigator.geolocation.getCurrentPosition(
    async pos=>{
      const lat=pos.coords.latitude, lon=pos.coords.longitude;
      const label=await reverseGeocode(lat,lon);
      await fetchWeatherByCoords(lat,lon,label);
    },
    ()=>{ hideLoading(); showToast('Location access denied. Please search manually.'); },
    {enableHighAccuracy:true,timeout:12000,maximumAge:0}
  );
}

/* ================================================================
   INITIALISE
   ================================================================ */
document.addEventListener('DOMContentLoaded',()=>{

  /* Particles */
  const canvas=document.getElementById('particle-canvas');
  particleSystem=new ParticleSystem(canvas);
  particleSystem.setType('stars');
  particleSystem.start();

  const input    = document.getElementById('searchInput');
  const dropdown = document.getElementById('searchDropdown');

  /* Re-position on resize / orientation change */
  window.addEventListener('resize', positionDropdown);
  window.addEventListener('orientationchange', ()=>setTimeout(positionDropdown, 300));

  /* Autocomplete */
  input.addEventListener('input',()=>{
    clearTimeout(searchTimeout);
    const val=input.value.trim();
    if(val.length<2){ dropdown.classList.remove('active'); return; }
    searchTimeout=setTimeout(async()=>{
      const candidates=await geocodeCombined(val);
      showDropdown(candidates);
    },420);
  });

  /* Enter key */
  input.addEventListener('keydown',e=>{
    if(e.key==='Enter'){ dropdown.classList.remove('active'); handleSearch(input.value.trim()); }
    if(e.key==='Escape') dropdown.classList.remove('active');
  });

  /* Close on outside click / touch */
  const closeDD = e=>{
    if(!e.target.closest('.search-wrapper')&&!e.target.closest('.search-dropdown'))
      dropdown.classList.remove('active');
  };
  document.addEventListener('click',   closeDD);
  document.addEventListener('touchstart', closeDD, {passive:true});

  /* Search button */
  document.getElementById('searchBtn').addEventListener('click',()=>{
    dropdown.classList.remove('active');
    handleSearch(input.value.trim());
  });

  /* Location button */
  document.getElementById('locationBtn').addEventListener('click', getLocation);

  /* Refresh */
  document.getElementById('refreshBtn').addEventListener('click',()=>{
    if(currentWeatherData){
      const lat=currentWeatherData.current.coord.lat;
      const lon=currentWeatherData.current.coord.lon;
      const label=currentWeatherData.locationLabel||null;
      fetchWeatherByCoords(lat,lon,label);
    } else { showToast('Search for a location first'); }
  });

  /* Unit toggle */
  document.getElementById('unitToggleBtn').addEventListener('click',()=>{
    currentUnit=currentUnit==='metric'?'imperial':'metric';
    document.getElementById('unitToggleBtn').textContent=currentUnit==='metric'?'°C':'°F';
    if(currentWeatherData)
      renderWeather(currentWeatherData.current,currentWeatherData.forecast,currentWeatherData.locationLabel||null);
  });

  /* Auto-detect on load */
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(
      async pos=>{
        const lat=pos.coords.latitude, lon=pos.coords.longitude;
        const label=await reverseGeocode(lat,lon);
        await fetchWeatherByCoords(lat,lon,label);
      },
      ()=>fetchWeatherByCity('London'),
      {enableHighAccuracy:true,timeout:6000,maximumAge:0}
    );
  } else { fetchWeatherByCity('London'); }

});