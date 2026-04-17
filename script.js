// --- DOM Elements ---
const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');

// Overlays
const loadingOverlay = document.getElementById('loading-overlay');
const errorOverlay = document.getElementById('error-overlay');
const errorMessage = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');
const dashboard = document.getElementById('weather-dashboard');

// Top Bar Unit Toggle
const btnC = document.getElementById('btn-c');
const btnF = document.getElementById('btn-f');

// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

// Main Banner
const bannerLocation = document.getElementById('banner-location');
const bannerTemp = document.getElementById('banner-temp');
const bannerCondition = document.getElementById('banner-condition');
const bannerSubtext = document.getElementById('banner-subtext');
const bannerIcon = document.getElementById('banner-icon');
const nearbyList = document.getElementById('nearby-locations-list');

// Hourly
const hourlyContainer = document.getElementById('hourly-container');

// Forecast
const forecastContainer = document.getElementById('forecast-container');

// Highlights
const hlUv = document.getElementById('hl-uv');
const hlUvBadge = document.getElementById('hl-uv-badge');
const uvFill = document.getElementById('uv-fill');
const uvKnob = document.getElementById('uv-knob');

const hlWind = document.getElementById('hl-wind');
const windArrow = document.getElementById('wind-arrow');

const hlHumidity = document.getElementById('hl-humidity');
const humidityFill = document.getElementById('humidity-fill');
const dewPointLabel = document.getElementById('dew-point');

const hlVisibility = document.getElementById('hl-visibility');
const hlVisDesc = document.getElementById('hl-vis-desc');

// --- State ---
let isCelsius = true;
let isDarkMode = false;
let currentWeatherData = null;
let selectedDayIndex = 0; // Active view day

const NEARBY_CITIES = ['Montreal', 'Toronto', 'Kingston'];
let nearbyData = [];

const fabBtn = document.querySelector('.fab-btn');

// --- Initialization ---
function init() {
  searchForm.addEventListener('submit', handleSearch);

  btnC.addEventListener('click', () => setUnit(true));
  btnF.addEventListener('click', () => setUnit(false));

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);

    // Theme preference from storage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      toggleTheme();
    }
  }

  retryBtn.addEventListener('click', hideError);

  if (fabBtn) {
    fabBtn.addEventListener('click', fetchCurrentLocationWeather);
  }

  fetchCurrentLocationWeather();
  fetchNearbyLocations();
}

// toggleTheme
function toggleTheme() {
  isDarkMode = !isDarkMode;
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
    themeIcon.classList.remove('fa-moon');
    themeIcon.classList.add('fa-sun');
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.classList.remove('dark-mode');
    themeIcon.classList.remove('fa-sun');
    themeIcon.classList.add('fa-moon');
    localStorage.setItem('theme', 'light');
  }
}

// --- API Logic ---

// handleSearch
async function handleSearch(e) {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return;
  fetchWeather(city);
}

// fetchNearbyLocations
async function fetchNearbyLocations() {
  try {
    const promises = NEARBY_CITIES.map(async (city) => {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) return { name: city, temp: 0 };
      const { latitude, longitude } = geoData.results[0];

      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&timezone=auto`);
      const wData = await weatherRes.json();

      return { name: city, temp: wData.current.temperature_2m };
    });

    nearbyData = await Promise.all(promises);
    renderNearbyLocations();
  } catch (e) {
    console.warn("Failed to fetch nearby locations", e);
  }
}

// renderNearbyLocations
function renderNearbyLocations() {
  if (!nearbyList || nearbyData.length === 0) return;
  nearbyList.innerHTML = '';
  nearbyData.forEach(city => {
    nearbyList.innerHTML += `<li><span>${city.name}</span> <span>${formatTemp(city.temp)}°<span class="unit-sym">${isCelsius ? 'C' : 'F'}</span></span></li>`;
  });
}

// fetchWeather
async function fetchWeather(city) {
  showLoading();

  try {
    // 1. Geocode
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) throw new Error('Network error trying to fetch location.');

    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) {
      throw new Error(`Location "${city}" not found.`);
    }

    const { latitude, longitude, name, admin1, country } = geoData.results[0];
    const displayLocation = admin1 ? `${name}, ${admin1}` : `${name}, ${country}`;

    await loadWeatherData(latitude, longitude, displayLocation);

  } catch (error) {
    showError(error.message);
  }
}

// fetchCurrentLocationWeather
function fetchCurrentLocationWeather() {
  if (navigator.geolocation) {
    showLoading();
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeatherByCoords(latitude, longitude);
      },
      (error) => {
        console.warn("Geolocation denied or error:", error);
        hideLoading();
        fetchWeather('San Francisco'); // Fallback
      }
    );
  } else {
    fetchWeather('San Francisco'); // Fallback
  }
}

// fetchWeatherByCoords
async function fetchWeatherByCoords(latitude, longitude) {
  showLoading();
  try {
    let displayLocation = "Current Location";
    try {
      const reverseGeoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
      const revRes = await fetch(reverseGeoUrl);
      if (revRes.ok) {
        const revData = await revRes.json();
        const city = revData.city || revData.locality;
        const state = revData.principalSubdivision;
        const country = revData.countryCode;
        if (city && state) {
          displayLocation = `${city}, ${state}`;
        } else if (city && country) {
          displayLocation = `${city}, ${country}`;
        } else if (city) {
          displayLocation = city;
        }
      }
    } catch (e) {
      console.warn("Reverse geocoding failed", e);
    }

    await loadWeatherData(latitude, longitude, displayLocation);
  } catch (error) {
    showError(error.message);
  }
}

// loadWeatherData
async function loadWeatherData(latitude, longitude, displayLocation) {
  try {
    // 2. Weather
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&hourly=temperature_2m,weather_code,visibility&timezone=auto&forecast_days=14`;
    const weatherRes = await fetch(weatherUrl);
    if (!weatherRes.ok) throw new Error('Failed to retrieve weather data.');

    const wData = await weatherRes.json();

    currentWeatherData = {
      location: displayLocation,
      current: {
        temp: wData.current.temperature_2m,
        code: wData.current.weather_code,
        humidity: wData.current.relative_humidity_2m,
        windSpd: wData.current.wind_speed_10m,
        windDir: wData.current.wind_direction_10m,
      },
      daily: [],
      hourly: []
    };

    for (let i = 0; i < wData.daily.time.length; i++) {
      if (wData.daily.time[i]) {
        currentWeatherData.daily.push({
          date: wData.daily.time[i],
          max: wData.daily.temperature_2m_max[i],
          min: wData.daily.temperature_2m_min[i],
          code: wData.daily.weather_code[i],
          uv: wData.daily.uv_index_max[i] || 0
        });
      }
    }

    for (let i = 0; i < wData.hourly.time.length; i++) {
      currentWeatherData.hourly.push({
        time: wData.hourly.time[i],
        temp: wData.hourly.temperature_2m[i],
        code: wData.hourly.weather_code[i],
        visibility: wData.hourly.visibility[i]
      });
    }

    cityInput.value = '';
    cityInput.blur();

    selectedDayIndex = 0; // Reset index
    updateUI();

  } catch (error) {
    showError(error.message);
  }
}

// --- Update UI Main Function ---
function updateUI() {
  if (!currentWeatherData) return;
  hideLoading();

  const data = currentWeatherData;
  const targetDay = data.daily[selectedDayIndex];

  // Update global unit symbols
  document.querySelectorAll('.unit-sym').forEach(el => el.textContent = isCelsius ? 'C' : 'F');

  // 1. Banner
  bannerLocation.textContent = data.location.toUpperCase();

  // Live temp if today, else max
  const bannerTempValue = selectedDayIndex === 0 ? data.current.temp : targetDay.max;
  bannerTemp.innerHTML = `${formatTemp(bannerTempValue)}<span class="deg-sym">°</span><span class="unit-sym">${isCelsius ? 'C' : 'F'}</span>`;

  // Condition for specific day
  const currentAttr = getWeatherAttributes(selectedDayIndex === 0 ? data.current.code : targetDay.code);
  bannerCondition.textContent = currentAttr.text;
  bannerIcon.className = `fa-solid ${currentAttr.icon}`;
  if (selectedDayIndex === 0) {
    bannerSubtext.textContent = `Expect ${currentAttr.text.toLowerCase()} conditions throughout the day.`;
  } else {
    bannerSubtext.textContent = `Forecasted ${currentAttr.text.toLowerCase()} for the day.`;
  }

  // Dynamic Themes
  const weatherBanner = document.querySelector('.weather-banner');
  if (weatherBanner) {
    weatherBanner.style.background = currentAttr.theme.grad;
    weatherBanner.style.color = currentAttr.theme.text;
  }
  document.documentElement.style.setProperty('--accent-blue', currentAttr.theme.accent);
  document.documentElement.style.setProperty('--shadow-blue', currentAttr.theme.shadow);
  document.documentElement.style.setProperty('--accent-light', currentAttr.theme.light);

  // 2. Hourly Forecast
  hourlyContainer.innerHTML = '';
  // Hourly slice: current hour (Day 0) or 00:00-23:00
  let startIndex = 0;
  if (selectedDayIndex === 0) {
    startIndex = new Date().getHours();
  } else {
    startIndex = selectedDayIndex * 24;
  }
  const endIndex = startIndex + 24;

  const hourlySlice = data.hourly.slice(startIndex, endIndex);

  hourlySlice.forEach(hour => {
    // Parse 'YYYY-MM-DDTHH:00'
    const d = new Date(hour.time);
    // Format to "1PM", "12AM" etc.
    const timeString = d.toLocaleTimeString('en-US', { hour: 'numeric' }).replace(' ', '');
    const hAttr = getWeatherAttributes(hour.code);

    const div = document.createElement('div');
    div.className = 'hourly-card-small';
    div.innerHTML = `
        <span class="hc-time">${timeString}</span>
        <i class="fa-solid ${hAttr.icon} hc-icon"></i>
        <span class="hc-temp">${formatTemp(hour.temp)}°</span>
     `;
    hourlyContainer.appendChild(div);
  });

  // 3. 14-Day Forecast Grid
  forecastContainer.innerHTML = '';
  data.daily.forEach((day, index) => {
    const d = new Date(day.date + 'T12:00:00');
    // Label index 0 as 'Today'
    const dayName = index === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayAttr = getWeatherAttributes(day.code);

    const div = document.createElement('div');
    div.className = `forecast-card-small ${index === selectedDayIndex ? 'active' : ''}`;

    // Click to change day
    div.addEventListener('click', () => {
      selectedDayIndex = index;
      updateUI();
    });

    div.innerHTML = `
      <span class="fc-day">${dayName}</span>
      <i class="fa-solid ${dayAttr.icon} fc-icon"></i>
      <div class="fc-temps">
        <span class="fc-high">${formatTemp(day.max)}°</span>
        <span class="fc-low">${formatTemp(day.min)}°</span>
      </div>
    `;
    forecastContainer.appendChild(div);
  });

  // 4. Highlights (current live or day avg/mocked data)

  // UV Index
  const uv = Math.round(targetDay.uv);
  hlUv.textContent = uv;
  const uvPct = Math.min((uv / 11) * 100, 100);
  uvFill.style.width = `${uvPct}%`;
  uvKnob.style.left = `${uvPct}%`;

  if (uv <= 2) { hlUvBadge.textContent = "LOW"; hlUvBadge.style.color = "var(--accent-blue)"; }
  else if (uv <= 5) { hlUvBadge.textContent = "MODERATE"; hlUvBadge.style.color = "#f59e0b"; } /* yellow/orange */
  else if (uv <= 7) { hlUvBadge.textContent = "HIGH"; hlUvBadge.style.color = "#ea580c"; } /* orange */
  else { hlUvBadge.textContent = "EXTREME"; hlUvBadge.style.color = "#ef4444"; } /* red */

  // Wind: use Day 0 logic
  hlWind.textContent = data.current.windSpd.toFixed(1);
  windArrow.style.transform = `rotate(${data.current.windDir + 45}deg)`;

  const hum = data.current.humidity;
  hlHumidity.textContent = hum;
  humidityFill.style.width = `${hum}%`;
  const tC = data.current.temp;
  const tD = isCelsius ? (tC - ((100 - hum) / 5)) : cToF(tC - ((100 - hum) / 5));
  dewPointLabel.textContent = Math.round(tD);

  // Visibility: target day at 12:00 PM (startIndex + 12)
  const targetVisIndex = (selectedDayIndex * 24) + 12;
  const targetVis = data.hourly[targetVisIndex].visibility;
  const visKm = (targetVis / 1000).toFixed(1);
  hlVisibility.textContent = visKm;
  if (visKm > 10) hlVisDesc.textContent = "Clear visibility all day.";
  else if (visKm > 5) hlVisDesc.textContent = "Moderate conditions near the coast.";
  else hlVisDesc.textContent = "Poor visibility due to fog or rain.";
}

// --- Helpers ---
// setUnit
function setUnit(celsius) {
  isCelsius = celsius;
  if (isCelsius) {
    btnC.classList.add('active');
    btnF.classList.remove('active');
  } else {
    btnC.classList.remove('active');
    btnF.classList.add('active');
  }
  updateUI();
  renderNearbyLocations();
}

// cToF
function cToF(celsius) {
  return (celsius * 9 / 5) + 32;
}

// formatTemp
function formatTemp(tempC) {
  if (tempC === undefined || tempC === null) return "--";
  const val = isCelsius ? tempC : cToF(tempC);
  return Math.round(val);
}

// getWeatherAttributes
function getWeatherAttributes(code) {
  const attr = {
    icon: 'fa-cloud', text: 'Cloudy',
    theme: { grad: 'linear-gradient(135deg, #cbd5e1, #94a3b8)', text: '#1e293b', accent: '#64748b', light: '#f1f5f9', shadow: '0 8px 16px rgba(100, 116, 139, 0.3)' }
  };

  if (code === 0) {
    attr.icon = 'fa-sun'; attr.text = 'Clear Sky';
    attr.theme = { grad: 'linear-gradient(135deg, #fcd34d, #f59e0b)', text: '#1f2937', accent: '#f59e0b', light: '#fffbeb', shadow: '0 8px 16px rgba(245, 158, 11, 0.3)' };
  } else if ([1, 2, 3].includes(code)) {
    attr.icon = 'fa-cloud-sun'; attr.text = 'Partly Cloudy';
    attr.theme = { grad: 'linear-gradient(135deg, #bae6fd, #0ea5e9)', text: '#0f172a', accent: '#0ea5e9', light: '#f0f9ff', shadow: '0 8px 16px rgba(14, 165, 233, 0.3)' };
  } else if ([45, 48].includes(code)) {
    attr.icon = 'fa-smog'; attr.text = 'Foggy';
    attr.theme = { grad: 'linear-gradient(135deg, #d1d5db, #9ca3af)', text: '#111827', accent: '#6b7280', light: '#f3f4f6', shadow: '0 8px 16px rgba(107, 114, 128, 0.3)' };
  } else if ([51, 53, 55, 56, 57].includes(code)) {
    attr.icon = 'fa-cloud-rain'; attr.text = 'Drizzle';
    attr.theme = { grad: 'linear-gradient(135deg, #93c5fd, #3b82f6)', text: '#ffffff', accent: '#3b82f6', light: '#eff6ff', shadow: '0 8px 16px rgba(59, 130, 246, 0.3)' };
  } else if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    attr.icon = 'fa-cloud-showers-heavy'; attr.text = 'Rainy';
    attr.theme = { grad: 'linear-gradient(135deg, #60a5fa, #2563eb)', text: '#ffffff', accent: '#2563eb', light: '#eff6ff', shadow: '0 8px 16px rgba(37, 99, 235, 0.4)' };
  } else if ([71, 73, 75, 77, 85, 86].includes(code)) {
    attr.icon = 'fa-snowflake'; attr.text = 'Snow';
    attr.theme = { grad: 'linear-gradient(135deg, #f8fafc, #cbd5e1)', text: '#1e293b', accent: '#64748b', light: '#f8fafc', shadow: '0 8px 16px rgba(148, 163, 184, 0.3)' };
  } else if ([95, 96, 99].includes(code)) {
    attr.icon = 'fa-cloud-bolt'; attr.text = 'Thunderstorm';
    attr.theme = { grad: 'linear-gradient(135deg, #818cf8, #4f46e5)', text: '#ffffff', accent: '#4f46e5', light: '#eef2ff', shadow: '0 8px 16px rgba(79, 70, 229, 0.4)' };
  }
  return attr;
}

// showLoading
function showLoading() {
  loadingOverlay.classList.remove('hidden');
  errorOverlay.classList.add('hidden');
}

// hideLoading
function hideLoading() {
  loadingOverlay.classList.add('hidden');
}

// showError
function showError(msg) {
  loadingOverlay.classList.add('hidden');
  errorMessage.textContent = msg;
  errorOverlay.classList.remove('hidden');
}

// hideError
function hideError() {
  errorOverlay.classList.add('hidden');
  if (currentWeatherData) updateUI();
}

init();
