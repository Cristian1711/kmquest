// KM Quest — Main app orchestration
// PWA: works in Safari on iPhone, no App Store or developer account needed

import { GPSTracker, formatDuration, formatPace, formatDate, formatTime, drawPath } from './gps.js';
import { importHealthFile, aggregateHealthData, getTodayHealthData, getLast90DaysData, getLast8WeeksKm, computeStreakFromHealthAndGPS, StepCounter, generateDemoData } from './health.js';
import { BADGES, BADGE_CATEGORIES, BADGE_MAP, buildStatsSnapshot, checkBadges } from './badges.js';

// ─── Data version — bump this to wipe old localStorage on next load ───
const DATA_VERSION = 5;

// ─── State ───
let state = {
  health: null,
  gpsSessions: [],
  badges: {},
  streak: { current: 0, record: 0, activeDays: 0 },
  totals: { km: 0, steps: 0, calories: 0, sessions: 0 },
  prefs: { dailyStepGoal: 10000, isDemo: false }
};

let gpsTracker = null;
let stepCounter = null;
let currentTab = 'home';
let activeBadgeCategory = 'all';
let pendingBadgeQueue = [];
let isShowingBadge = false;
let currentGPSLivePoints = [];
let statsSource = 'combined'; // 'combined' | 'gps' | 'health'

const QUOTES = [
  '"El dolor que sientes hoy será la fuerza que sentirás mañana."',
  '"No pares cuando estés cansado. Para cuando hayas terminado."',
  '"Cada km que corres es uno que nadie puede quitarte."',
  '"El único mal entrenamiento es el que no hiciste."',
  '"Tu cuerpo puede aguantar casi cualquier cosa. Es tu mente la que tienes que convencer."',
  '"No se trata de ser mejor que los demás, sino mejor que quien eras ayer."',
  '"Las piernas te llevarán a donde la mente quiera ir."',
  '"Corre cuando puedas, camina si tienes que hacerlo, pero nunca te rindas."',
  '"Cada paso te acerca a la versión que quieres ser."',
  '"El movimiento es medicina."'
];

// ─── Initialization ───
document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  // Wipe old data if version mismatch (catches demo data, old formats, etc.)
  const storedVersion = parseInt(localStorage.getItem('kmquest_version') || '0');
  if (storedVersion < DATA_VERSION) {
    localStorage.removeItem('kmquest_state');
    localStorage.removeItem('kmquest_daily');
    localStorage.setItem('kmquest_version', DATA_VERSION);
  }

  loadState();
  setupNavigation();
  setupGPSTab();
  setupHealthTab();
  setupTrophiesTab();
  setupStatsTab();
  updateClock();
  setInterval(updateClock, 30000);

  recalculateTotals();
  updateStreak();
  renderHome();
  renderTrophies();
  renderStats();
  renderHealthTab();

  // Hide loading screen
  setTimeout(() => {
    document.getElementById('loading-screen').classList.add('hidden');
  }, 1200);
}

// ─── Persistence ───
function loadState() {
  try {
    const saved = localStorage.getItem('kmquest_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed };
      state.gpsSessions = parsed.gpsSessions || [];
      state.badges = parsed.badges || {};
    }
  } catch (_) {}
}

function saveState() {
  try {
    // Don't save health dailyData inline if it's huge — keep it separate
    const toSave = {
      ...state,
      health: state.health ? {
        ...state.health,
        dailyData: undefined // Save daily data separately
      } : null
    };
    localStorage.setItem('kmquest_state', JSON.stringify(toSave));

    if (state.health?.dailyData) {
      localStorage.setItem('kmquest_daily', JSON.stringify(state.health.dailyData));
    }
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      // Trim oldest sessions if storage full
      state.gpsSessions = state.gpsSessions.slice(-50);
      saveState();
    }
  }
}

function loadDailyData() {
  try {
    const raw = localStorage.getItem('kmquest_daily');
    if (raw && state.health) {
      state.health.dailyData = JSON.parse(raw);
    }
  } catch (_) {}
}

// ─── Clock ───
function updateClock() {
  const el = document.getElementById('status-time');
  if (el) {
    const now = new Date();
    el.textContent = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
  }
}

// ─── Navigation ───
function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      if (tab !== currentTab) switchTab(tab);
    });
  });
}

function switchTab(tab) {
  const prevPanel = document.getElementById(`tab-${currentTab}`);
  const nextPanel = document.getElementById(`tab-${tab}`);

  prevPanel?.classList.remove('active');
  prevPanel?.classList.add('exit-left');
  setTimeout(() => prevPanel?.classList.remove('exit-left'), 400);

  nextPanel?.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tab);
  });

  currentTab = tab;

  // Refresh content on tab switch
  if (tab === 'home') renderHome();
  if (tab === 'stats') renderStats();
  if (tab === 'trophies') renderTrophies();
  if (tab === 'health') renderHealthTab();
}

// ─── Totals calculation ───
function recalculateTotals() {
  loadDailyData();
  const daily = state.health?.dailyData || {};
  const sessions = state.gpsSessions;

  // Health totals
  const healthAgg = aggregateHealthData(daily);

  // GPS-only km: sessions on dates NOT already covered by health data
  let gpsOnlyKm = 0;
  let gpsOnlySteps = 0;
  sessions.forEach(s => {
    const date = s.startTime?.slice(0, 10);
    if (date && !daily[date]) {
      gpsOnlyKm += s.distanceKm || 0;
      gpsOnlySteps += s.estimatedSteps || 0;
    }
  });

  state.totals = {
    km: parseFloat((healthAgg.totalDistanceKm + gpsOnlyKm).toFixed(2)),
    steps: Math.round(healthAgg.totalSteps + gpsOnlySteps),
    calories: Math.round(healthAgg.totalCalories),
    sessions: sessions.length
  };
}

function updateStreak() {
  const s = computeStreakFromHealthAndGPS(
    state.health?.dailyData || {},
    state.gpsSessions
  );
  state.streak = s;
}

// ─── HOME TAB ───
function renderHome() {
  renderOdometer('km-display', state.totals.km);
  renderStepsDisplay();
  renderSourceBadge();
  renderMilestone();
  renderStreakCard();
  renderTrophyStrip();
  renderQuote();
}

function renderOdometer(containerId, value) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const str = value.toFixed(1);
  const [intPart, decPart] = str.split('.');

  // Check if slots already exist and have same digit count
  const existingSlots = container.querySelectorAll('.digit-slot');
  const totalNeeded = intPart.length + (decPart ? decPart.length : 0);

  if (existingSlots.length !== totalNeeded) {
    // Rebuild
    container.innerHTML = '';

    for (let i = 0; i < intPart.length; i++) {
      container.appendChild(createDigitSlot(parseInt(intPart[i]), false));
    }

    if (decPart) {
      const sep = document.createElement('span');
      sep.className = 'km-sep';
      sep.textContent = '.';
      container.appendChild(sep);

      for (let i = 0; i < decPart.length; i++) {
        container.appendChild(createDigitSlot(parseInt(decPart[i]), true));
      }
    }

    const unit = document.createElement('span');
    unit.className = 'km-unit-label';
    unit.textContent = 'km';
    container.appendChild(unit);
  } else {
    // Just update positions
    let si = 0;
    const slots = container.querySelectorAll('.digit-slot');
    for (let i = 0; i < intPart.length; i++) updateSlot(slots[si++], parseInt(intPart[i]));
    if (decPart) for (let i = 0; i < decPart.length; i++) updateSlot(slots[si++], parseInt(decPart[i]));
  }
}

function createDigitSlot(digit, isDecimal) {
  const slot = document.createElement('span');
  slot.className = 'digit-slot' + (isDecimal ? ' decimal' : '');
  const h = isDecimal ? 55 : 90;

  const reel = document.createElement('span');
  reel.className = 'digit-reel';
  reel.style.transform = `translateY(-${digit * h}px)`;

  for (let i = 0; i <= 9; i++) {
    const d = document.createElement('span');
    d.textContent = i;
    reel.appendChild(d);
  }

  slot.appendChild(reel);
  return slot;
}

function updateSlot(slot, digit) {
  const reel = slot.querySelector('.digit-reel');
  if (!reel) return;
  const h = slot.classList.contains('decimal') ? 55 : 90;
  reel.style.transform = `translateY(-${digit * h}px)`;
}

function renderStepsDisplay() {
  const el = document.getElementById('steps-display');
  if (!el) return;
  el.textContent = formatNumber(state.totals.steps);
}

function renderSourceBadge() {
  const el = document.getElementById('source-badge');
  if (!el) return;
  const isGPS = gpsTracker?.isRecording;
  const isDemo = state.prefs.isDemo;

  if (isGPS) {
    el.innerHTML = `<span class="sync-dot gps-active"></span> GPS activo`;
    el.className = 'source-badge gps-active';
  } else if (state.health?.connected) {
    const lastSync = state.health.lastSync ? timeSince(state.health.lastSync) : '?';
    el.innerHTML = `<span class="sync-dot"></span> Apple Health · sync ${lastSync}`;
    el.className = 'source-badge';
  } else {
    el.innerHTML = `<span class="sync-dot"></span> Sin datos — ve a ❤️ Health para importar`;
    el.className = 'source-badge';
  }
}

function renderMilestone() {
  const km = state.totals.km;

  // Find next milestone from distance badges
  const distBadges = BADGES.filter(b => b.cat === 'distance');
  const nextMilestone = distBadges.find(b => {
    const targetKm = parseFloat(b.req.replace(/[^0-9.]/g, '').replace('.', ''));
    // Handle European number format in req string
    const reqKm = getKmFromBadge(b);
    return reqKm > km;
  });

  if (!nextMilestone) return;

  const nextKm = getKmFromBadge(nextMilestone);
  const prevMilestone = distBadges.filter(b => getKmFromBadge(b) < km).slice(-1)[0];
  const prevKm = prevMilestone ? getKmFromBadge(prevMilestone) : 0;
  const pct = Math.min(100, Math.round(((km - prevKm) / (nextKm - prevKm)) * 100));
  const remaining = parseFloat((nextKm - km).toFixed(1));

  const titleEl = document.getElementById('milestone-name');
  const pctEl = document.getElementById('milestone-pct');
  const fillEl = document.getElementById('milestone-fill');
  const remEl = document.getElementById('milestone-remaining');
  const factEl = document.getElementById('milestone-fact');

  if (titleEl) titleEl.textContent = `${nextMilestone.emoji} ${nextMilestone.name} — ${nextMilestone.req}`;
  if (pctEl) pctEl.textContent = `${pct}%`;
  if (fillEl) fillEl.style.width = `${pct}%`;
  if (remEl) remEl.textContent = `faltan ${formatKm(remaining)} km`;
  if (factEl) factEl.textContent = `💡 ${nextMilestone.desc}`;
}

function getKmFromBadge(badge) {
  // Parse km value from req string like "100 km", "40.075 km", "384.400 km"
  const raw = badge.req.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
  return parseFloat(raw);
}

function renderStreakCard() {
  const el = document.getElementById('streak-num');
  const recEl = document.getElementById('streak-record');
  if (el) el.textContent = state.streak.current;
  if (recEl) recEl.textContent = `récord personal: ${state.streak.record} días`;
}

function renderTrophyStrip() {
  const container = document.getElementById('trophy-row-home');
  if (!container) return;

  const unlocked = Object.keys(state.badges).filter(id => state.badges[id]);
  const recent = unlocked.slice(-8).reverse();
  const next = BADGES.find(b => !state.badges[b.id]);

  container.innerHTML = '';

  const shown = [...recent.slice(0, 3)];
  if (next && !shown.includes(next.id)) shown.push(next.id || 'placeholder');

  recent.forEach(id => {
    const badge = BADGE_MAP[id];
    if (!badge) return;
    const isNew = state.badges[id]?.isNew;
    const chip = document.createElement('div');
    chip.className = 'trophy-chip' + (isNew ? ' new-unlock' : '');
    chip.innerHTML = `
      ${isNew ? '<span class="chip-new">¡nuevo!</span>' : ''}
      <span class="chip-emoji">${badge.emoji}</span>
      <div class="chip-name">${badge.name}</div>
    `;
    chip.addEventListener('click', () => showTrophyModal(badge));
    container.appendChild(chip);
  });

  // Show next locked badge
  if (next) {
    const chip = document.createElement('div');
    chip.className = 'trophy-chip locked';
    chip.innerHTML = `<span class="chip-emoji">${next.emoji}</span><div class="chip-name">${next.name}</div>`;
    container.appendChild(chip);
  }

  if (container.children.length === 0) {
    container.innerHTML = '<div class="muted" style="font-size:13px;padding:10px">Completa tu primera sesión GPS para desbloquear trofeos 🏆</div>';
  }
}

function renderQuote() {
  const el = document.getElementById('quote-text');
  if (!el) return;
  const idx = Math.floor(Date.now() / 86400000) % QUOTES.length;
  el.textContent = QUOTES[idx];
}

// ─── GPS TAB ───
function setupGPSTab() {
  const startBtn = document.getElementById('gps-start-btn');
  const stopBtn = document.getElementById('gps-stop-btn');

  startBtn?.addEventListener('click', startGPS);
  stopBtn?.addEventListener('click', stopGPS);

  renderSessionList();
}

async function startGPS() {
  const startBtn = document.getElementById('gps-start-btn');
  const stopBtn = document.getElementById('gps-stop-btn');
  const ring = document.getElementById('gps-ring');
  const errorEl = document.getElementById('gps-error');

  errorEl?.classList.add('hidden');
  currentGPSLivePoints = [];

  gpsTracker = new GPSTracker(
    stats => updateGPSLiveStats(stats),
    err => {
      if (errorEl) {
        errorEl.textContent = err;
        errorEl.classList.remove('hidden');
      }
      stopGPS();
    }
  );

  const started = await gpsTracker.start();
  if (!started) return;

  startBtn?.classList.add('hidden');
  stopBtn?.classList.remove('hidden');
  ring?.classList.add('recording');
  document.getElementById('gps-recording-dot')?.classList.add('active');
}

function stopGPS() {
  const startBtn = document.getElementById('gps-start-btn');
  const stopBtn = document.getElementById('gps-stop-btn');
  const ring = document.getElementById('gps-ring');

  const session = gpsTracker?.stop();
  gpsTracker = null;

  startBtn?.classList.remove('hidden');
  stopBtn?.classList.add('hidden');
  ring?.classList.remove('recording');
  document.getElementById('gps-recording-dot')?.classList.remove('active');

  if (session) {
    state.gpsSessions.unshift(session);
    recalculateTotals();
    updateStreak();
    checkAndUnlockBadges();
    saveState();
    renderSessionList();
    renderHome();
    renderStats();

    // Draw final path
    const canvas = document.getElementById('gps-path-canvas');
    if (canvas && session.path?.length > 1) {
      const pts = session.path.map(([lat, lng]) => ({ lat, lng }));
      drawPath(canvas, pts);
      canvas.classList.remove('hidden');
    }

    showSessionSummary(session);
  }

  // Reset live stats
  updateGPSLiveStats({ distanceKm: 0, elapsedSec: 0, avgSpeedKmH: 0, paceMinKm: null, isRecording: false });
}

function updateGPSLiveStats(stats) {
  const kmEl = document.getElementById('gps-km-live');
  const timerEl = document.getElementById('gps-timer');
  const paceEl = document.getElementById('gps-pace');
  const speedEl = document.getElementById('gps-speed');
  const accEl = document.getElementById('gps-accuracy-text');

  if (kmEl) kmEl.textContent = stats.distanceKm.toFixed(2);
  if (timerEl) timerEl.textContent = formatDuration(stats.elapsedSec);
  if (paceEl) paceEl.textContent = formatPace(stats.paceMinKm);
  if (speedEl) speedEl.textContent = stats.avgSpeedKmH.toFixed(1);

  if (accEl && stats.accuracy) {
    const dot = document.querySelector('.acc-dot');
    const acc = stats.accuracy;
    accEl.textContent = `±${Math.round(acc)}m`;
    dot?.classList.remove('good', 'ok', 'bad');
    dot?.classList.add(acc <= 10 ? 'good' : acc <= 30 ? 'ok' : 'bad');
  }

  // Update path canvas live
  if (gpsTracker?.points.length > 1) {
    const canvas = document.getElementById('gps-path-canvas');
    if (canvas) {
      canvas.classList.remove('hidden');
      const pts = gpsTracker.getCurrentPath();
      if (pts.length !== currentGPSLivePoints.length) {
        currentGPSLivePoints = pts;
        drawPath(canvas, pts);
      }
    }
  }

  renderSourceBadge();
}

function renderSessionList() {
  const container = document.getElementById('session-list');
  if (!container) return;

  if (state.gpsSessions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">📍</span>
        <div class="empty-state-text">No hay sesiones GPS todavía.<br>Pulsa "Iniciar GPS" para empezar.</div>
      </div>`;
    return;
  }

  container.innerHTML = state.gpsSessions.slice(0, 20).map(s => `
    <div class="session-item">
      <span class="session-icon">${getSessionIcon(s.distanceKm)}</span>
      <div class="session-info">
        <div class="session-km">${formatKm(s.distanceKm)} km</div>
        <div class="session-meta">${formatDuration(s.durationSec)} · ${s.avgSpeedKmH?.toFixed(1) || '--'} km/h · ${formatPace(s.avgPaceMin)}/km</div>
      </div>
      <div class="session-date">${formatDate(s.startTime)}</div>
    </div>
  `).join('');
}

function getSessionIcon(km) {
  if (km >= 42) return '🏇';
  if (km >= 21) return '🚀';
  if (km >= 10) return '⚡';
  if (km >= 5) return '🏃';
  return '🚶';
}

function showSessionSummary(session) {
  const overlay = document.getElementById('session-summary-overlay');
  if (!overlay) return;
  document.getElementById('ss-km').textContent = formatKm(session.distanceKm);
  document.getElementById('ss-time').textContent = formatDuration(session.durationSec);
  document.getElementById('ss-pace').textContent = formatPace(session.avgPaceMin);
  document.getElementById('ss-speed').textContent = session.avgSpeedKmH?.toFixed(1) || '--';
  document.getElementById('ss-calories').textContent = session.estimatedCalories;
  document.getElementById('ss-steps').textContent = formatNumber(session.estimatedSteps);
  overlay.classList.add('open');
}

document.getElementById?.('ss-close')?.addEventListener('click', () => {
  document.getElementById('session-summary-overlay')?.classList.remove('open');
});

// ─── HEALTH TAB ───
function setupHealthTab() {
  const importBtn = document.getElementById('import-health-btn');
  const fileInput = document.getElementById('health-file-input');

  importBtn?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleHealthImport(file);
    fileInput.value = '';
  });

  document.getElementById('sync-now-btn')?.addEventListener('click', () => {
    recalculateTotals();
    updateStreak();
    checkAndUnlockBadges();
    renderHome();
    renderHealthTab();
    renderStats();
    showToast('Sincronización completada ✓');
  });
}

async function handleHealthImport(file) {
  const progressEl = document.getElementById('import-progress');
  const progressFill = document.getElementById('import-progress-fill');
  const progressText = document.getElementById('import-progress-text');

  progressEl?.classList.add('active');

  try {
    const healthData = await importHealthFile(file, ({ status, pct }) => {
      if (progressText) progressText.textContent = status;
      if (progressFill) progressFill.style.width = `${pct}%`;
    });

    // Store health data
    state.health = healthData;
    state.prefs.isDemo = false;

    // Save daily data separately (can be large)
    localStorage.setItem('kmquest_daily', JSON.stringify(healthData.dailyData));
    healthData.dailyData = undefined; // Don't keep in main state to save memory

    recalculateTotals();
    updateStreak();
    checkAndUnlockBadges();
    saveState();
    renderHome();
    renderHealthTab();
    renderStats();
    renderTrophies();

    showToast(`✓ ${healthData.importedDays} días importados de Apple Health`);
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  } finally {
    progressEl?.classList.remove('active');
  }
}

function renderHealthTab() {
  const connected = state.health?.connected || false;
  const isDemo = state.prefs.isDemo;

  // Status card
  const statusEl = document.getElementById('health-status');
  if (statusEl) {
    statusEl.className = `health-status ${connected ? 'connected' : 'disconnected'}`;
    statusEl.innerHTML = connected
      ? `<span>✓</span> Apple Health conectado`
      : `<span>○</span> Modo demo activo`;
  }

  const syncInfo = document.getElementById('health-sync-info');
  if (syncInfo) {
    if (state.health?.lastSync) {
      syncInfo.textContent = `Última sync: ${timeSince(state.health.lastSync)} · ${state.health.importedDays || 0} días importados`;
    } else {
      syncInfo.textContent = 'Sin datos importados';
    }
  }

  // Demo banner
  const demoBanner = document.getElementById('demo-banner');
  if (demoBanner) demoBanner.classList.toggle('hidden', !isDemo);

  // Summary stats
  const daily = state.health?.dailyData || {};
  // Need to reload if not present
  if (!Object.keys(daily).length) {
    const savedDaily = localStorage.getItem('kmquest_daily');
    if (savedDaily) {
      try {
        state.health = state.health || {};
        state.health.dailyData = JSON.parse(savedDaily);
      } catch (_) {}
    }
  }

  const todayData = getTodayHealthData(state.health?.dailyData || {});

  const hsSteps = document.getElementById('hs-steps');
  const hsKm = document.getElementById('hs-km');
  const hsCal = document.getElementById('hs-cal');
  const hsMin = document.getElementById('hs-active');

  if (hsSteps) hsSteps.textContent = formatNumber(todayData.steps);
  if (hsKm) hsKm.textContent = todayData.distanceKm.toFixed(2);
  if (hsCal) hsCal.textContent = Math.round(todayData.calories);
  if (hsMin) hsMin.textContent = Math.round(todayData.activeMinutes);
}

// ─── TROPHIES TAB ───
function setupTrophiesTab() {
  setupCategoryPills();
  document.getElementById('trophy-modal-overlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeTrophyModal();
  });
  document.getElementById('trophy-modal-close')?.addEventListener('click', closeTrophyModal);
}

function setupCategoryPills() {
  const container = document.getElementById('category-pills');
  if (!container) return;

  BADGE_CATEGORIES.forEach(cat => {
    const pill = document.createElement('button');
    pill.className = 'cat-pill' + (cat.id === activeBadgeCategory ? ' active' : '');
    pill.textContent = `${cat.icon} ${cat.label}`;
    pill.addEventListener('click', () => {
      activeBadgeCategory = cat.id;
      container.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      renderTrophies();
    });
    container.appendChild(pill);
  });
}

function renderTrophies() {
  const grid = document.getElementById('trophies-grid');
  if (!grid) return;

  const filtered = activeBadgeCategory === 'all'
    ? BADGES
    : BADGES.filter(b => b.cat === activeBadgeCategory);

  const totalUnlocked = Object.values(state.badges).filter(Boolean).length;
  const el = document.getElementById('trophies-unlocked-count');
  if (el) el.innerHTML = `<span class="trophies-unlocked">${totalUnlocked}</span> / ${BADGES.length}`;

  grid.innerHTML = filtered.map(badge => {
    const isUnlocked = !!state.badges[badge.id];
    const isNew = state.badges[badge.id]?.isNew;
    return `
      <div class="trophy-tile ${isUnlocked ? 'unlocked' : 'locked'} ${isNew ? 'new-unlock' : ''}"
           onclick="window.showTrophyById('${badge.id}')">
        ${isNew ? '<div class="tile-new-dot"></div>' : ''}
        <span class="tile-emoji">${badge.emoji}</span>
        <div class="tile-name">${badge.name}</div>
      </div>
    `;
  }).join('');

  // Update nav badge count for new unlocks
  const newCount = Object.values(state.badges).filter(v => v?.isNew).length;
  const navBadge = document.getElementById('trophies-nav-badge');
  if (navBadge) {
    navBadge.textContent = newCount;
    navBadge.classList.toggle('hidden', newCount === 0);
  }
}

window.showTrophyById = function(id) {
  const badge = BADGE_MAP[id];
  if (badge) showTrophyModal(badge);
};

function showTrophyModal(badge) {
  const overlay = document.getElementById('trophy-modal-overlay');
  const isUnlocked = !!state.badges[badge.id];
  const unlockDate = state.badges[badge.id]?.date;

  document.getElementById('modal-emoji').textContent = badge.emoji;
  document.getElementById('modal-title').textContent = badge.name;
  document.getElementById('modal-req').textContent = badge.req;
  document.getElementById('modal-desc').textContent = badge.desc;
  document.getElementById('modal-unlocked').textContent = isUnlocked
    ? `Desbloqueado el ${new Date(unlockDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`
    : '🔒 Aún no desbloqueado';

  overlay?.classList.add('open');

  // Mark as seen
  if (state.badges[badge.id]?.isNew) {
    state.badges[badge.id].isNew = false;
    saveState();
    renderTrophies();
  }
}

function closeTrophyModal() {
  document.getElementById('trophy-modal-overlay')?.classList.remove('open');
}

// ─── STATS TAB ───
function setupStatsTab() {
  document.querySelectorAll('.src-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      statsSource = tab.dataset.source;
      document.querySelectorAll('.src-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderStats();
    });
  });
}

function getStatsDataForSource() {
  loadDailyData();
  const allDaily = state.health?.dailyData || {};
  const allSessions = state.gpsSessions;

  if (statsSource === 'gps') {
    // Only GPS sessions — build synthetic daily from sessions
    const gpsDaily = {};
    allSessions.forEach(s => {
      const d = s.startTime?.slice(0, 10);
      if (!d) return;
      gpsDaily[d] = gpsDaily[d] || { steps: 0, distanceKm: 0, calories: 0, activeMinutes: 0 };
      gpsDaily[d].distanceKm += s.distanceKm || 0;
      gpsDaily[d].steps      += s.estimatedSteps || 0;
      gpsDaily[d].calories   += s.estimatedCalories || 0;
      gpsDaily[d].activeMinutes += Math.round((s.durationSec || 0) / 60);
    });
    const totalKm    = allSessions.reduce((a, s) => a + (s.distanceKm || 0), 0);
    const totalSteps = allSessions.reduce((a, s) => a + (s.estimatedSteps || 0), 0);
    return { daily: gpsDaily, sessions: allSessions, totalKm, totalSteps };
  }

  if (statsSource === 'health') {
    // Only imported Health data — no GPS sessions
    const { totalDistanceKm: totalKm, totalSteps } = aggregateHealthData(allDaily);
    return { daily: allDaily, sessions: [], totalKm, totalSteps };
  }

  // Combined (default)
  return {
    daily: allDaily,
    sessions: allSessions,
    totalKm: state.totals.km,
    totalSteps: state.totals.steps
  };
}

function renderStats() {
  const { daily, sessions, totalKm, totalSteps } = getStatsDataForSource();

  const today = getTodayHealthData(daily);
  const last90 = getLast90DaysData(daily);
  const last8Weeks = getLast8WeeksKm(
    daily,
    statsSource === 'health' ? [] : sessions
  );

  // Today progress ring
  const goal = state.prefs.dailyStepGoal;
  const todayKey = new Date().toISOString().slice(0, 10);
  const gpsStepsToday = statsSource === 'health' ? 0 :
    sessions.filter(s => s.startTime?.slice(0, 10) === todayKey)
            .reduce((a, s) => a + (s.estimatedSteps || 0), 0);
  const todaySteps = (statsSource === 'gps' ? 0 : today.steps) + gpsStepsToday;
  const pct = Math.min(1, todaySteps / goal);

  const ring = document.querySelector('.ring-fill');
  if (ring) ring.style.strokeDashoffset = 163 - (163 * pct);
  const ringSteps = document.getElementById('ring-steps');
  if (ringSteps) ringSteps.textContent = formatNumber(todaySteps);
  const ringPct = document.getElementById('ring-pct');
  if (ringPct) ringPct.textContent = `${Math.round(pct * 100)}% del objetivo`;

  // Stat cards
  setStatCard('stat-total-km',    formatKm(totalKm),              'orange');
  setStatCard('stat-total-steps', formatNumber(totalSteps),        'cyan');
  setStatCard('stat-sessions',    sessions.length,                 'green');
  setStatCard('stat-streak',      `${state.streak.current}🔥`,    'fire');
  setStatCard('stat-record-streak', state.streak.record,           null);
  setStatCard('stat-best-session',
    formatKm(sessions.reduce((m, s) => Math.max(m, s.distanceKm || 0), 0)), 'orange');

  // Avg km/day (last 30 active days)
  const last30 = last90.slice(-30);
  const last30Km = last30.reduce((a, d) => a + (d.distanceKm || 0), 0);
  const activeDays30 = last30.filter(d => d.distanceKm > 0 || d.steps > 0).length;
  setStatCard('stat-avg-day', formatKm(activeDays30 ? last30Km / activeDays30 : 0), 'orange');

  // This week vs last week
  const thisWeekKm = last8Weeks[7]?.km || 0;
  const lastWeekKm = last8Weeks[6]?.km || 0;
  const weekDiff   = thisWeekKm - lastWeekKm;
  const weekEl = document.getElementById('stat-week-km');
  if (weekEl) {
    weekEl.querySelector('.stat-card-val').textContent = formatKm(thisWeekKm);
    weekEl.querySelector('.stat-card-sub').innerHTML = lastWeekKm > 0
      ? (weekDiff >= 0
          ? `<span class="green">↑ ${formatKm(weekDiff)} vs sem. pasada</span>`
          : `<span style="color:var(--red)">↓ ${formatKm(Math.abs(weekDiff))} vs sem. pasada</span>`)
      : '<span class="muted">primera semana</span>';
  }

  // Charts
  renderBarChart('weekly-bar-chart', last8Weeks, w => w.km, w => w.label, 'orange');
  renderMicroChart('daily-steps-chart', last90.slice(-30), d => d.steps, goal);
}

function setStatCard(id, value, colorClass) {
  const el = document.getElementById(id);
  if (!el) return;
  const valEl = el.querySelector('.stat-card-val');
  if (valEl) {
    valEl.textContent = value;
    if (colorClass) valEl.className = `stat-card-val ${colorClass}`;
  }
}

function renderBarChart(containerId, data, getValue, getLabel, color) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const values = data.map(getValue);
  const maxVal = Math.max(...values, 0.01);

  container.innerHTML = data.map(item => {
    const val = getValue(item);
    const pct = val / maxVal * 100;
    return `
      <div class="bar-col">
        <div class="bar-fill ${color === 'cyan' ? 'cyan-bar' : ''}" style="height:${Math.max(pct, 3)}%"></div>
        <div class="bar-label">${getLabel(item)}</div>
      </div>
    `;
  }).join('');
}

function renderMicroChart(containerId, data, getValue, goal) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const values = data.map(getValue);
  const maxVal = Math.max(...values, 1);
  const todayKey = new Date().toISOString().slice(0, 10);

  container.innerHTML = data.map(d => {
    const val = getValue(d);
    const pct = val / maxVal * 100;
    const isToday = d.date === todayKey;
    const goalMet = val >= goal;
    const hasData = val > 0;
    let cls = hasData ? (goalMet ? 'goal-met' : 'has-data') : 'empty';
    if (isToday) cls = 'today';
    return `<div class="micro-bar ${cls}" style="height:${Math.max(pct, 3)}%"></div>`;
  }).join('');
}

// ─── Badge unlocking ───
function checkAndUnlockBadges() {
  loadDailyData();

  const snapshot = buildStatsSnapshot({
    ...state,
    totals: state.totals,
    streak: state.streak,
    health: {
      ...state.health,
      dailyData: state.health?.dailyData || {}
    }
  });

  const newlyUnlocked = checkBadges(state, snapshot);

  newlyUnlocked.forEach(id => {
    state.badges[id] = { unlocked: true, date: new Date().toISOString(), isNew: true };
    pendingBadgeQueue.push(id);
  });

  if (newlyUnlocked.length > 0) {
    saveState();
    renderTrophies();
    showNextBadge();
  }
}

function showNextBadge() {
  if (isShowingBadge || pendingBadgeQueue.length === 0) return;

  const id = pendingBadgeQueue.shift();
  const badge = BADGE_MAP[id];
  if (!badge) { showNextBadge(); return; }

  isShowingBadge = true;

  const overlay = document.getElementById('badge-overlay');
  document.getElementById('badge-popup-emoji').textContent = badge.emoji;
  document.getElementById('badge-popup-title').textContent = badge.name;
  document.getElementById('badge-popup-req').textContent = badge.req;
  document.getElementById('badge-popup-desc').textContent = badge.desc;

  overlay?.classList.add('show');
  launchConfetti();
}

function closeBadgeOverlay() {
  document.getElementById('badge-overlay')?.classList.remove('show');
  isShowingBadge = false;
  setTimeout(showNextBadge, 600);
}

// ─── Confetti ───
function launchConfetti() {
  if (!window.confetti) {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js';
    s.onload = () => fireConfetti();
    document.head.appendChild(s);
  } else {
    fireConfetti();
  }
}

function fireConfetti() {
  if (!window.confetti) return;
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ['#FF6B35', '#ff9d35', '#00F5FF', '#ffffff', '#ffdd57'] });
  setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#FF6B35', '#00F5FF'] }), 300);
  setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#FF6B35', '#00F5FF'] }), 450);
}

// ─── Toast notifications ───
function showToast(msg, type = 'info') {
  const existing = document.getElementById('toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.style.cssText = `
    position:fixed; bottom:calc(80px + env(safe-area-inset-bottom,0px)); left:50%;
    transform:translateX(-50%); z-index:150;
    background:${type === 'error' ? '#ff4444' : '#1e1e35'};
    border:1px solid ${type === 'error' ? '#ff6666' : '#2a2a45'};
    color:#fff; padding:10px 20px; border-radius:20px; font-size:13px; font-weight:600;
    max-width:320px; text-align:center; box-shadow:0 4px 20px rgba(0,0,0,0.5);
    animation: toast-in 0.3s cubic-bezier(0.34,1.56,0.64,1);
  `;
  toast.textContent = msg;

  const style = document.createElement('style');
  style.textContent = '@keyframes toast-in{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}';
  document.head.appendChild(style);

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ─── Number formatting ───
function formatNumber(n) {
  if (!n) return '0';
  return n.toLocaleString('es-ES');
}

function formatKm(km) {
  if (!km) return '0.0';
  if (km >= 1000) return km.toLocaleString('es-ES', { maximumFractionDigits: 0 });
  return km.toFixed(1);
}

function timeSince(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'ahora mismo';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)} días`;
}

// ─── Event listeners (deferred) ───
window.addEventListener('load', () => {
  document.getElementById('badge-overlay-close')?.addEventListener('click', closeBadgeOverlay);
  document.getElementById('badge-overlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeBadgeOverlay();
  });

  document.getElementById('ss-close')?.addEventListener('click', () => {
    document.getElementById('session-summary-overlay')?.classList.remove('open');
  });

  // Manual session add from inline script
  window.addEventListener('kmquest:add-session', e => {
    const session = e.detail;
    state.gpsSessions.unshift(session);
    recalculateTotals();
    updateStreak();
    checkAndUnlockBadges();
    saveState();
    renderSessionList();
    renderHome();
    renderStats();
    showToast(`✓ ${session.distanceKm.toFixed(1)} km añadidos`);
  });
});
