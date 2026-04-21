// GPS tracking module for KM Quest PWA
// Uses browser Geolocation API + Haversine formula

export class GPSTracker {
  constructor(onUpdate, onError) {
    this.onUpdate = onUpdate;
    this.onError = onError;
    this.watchId = null;
    this.wakeLock = null;
    this.isRecording = false;
    this.points = [];
    this.startTime = null;
    this.lastPos = null;
    this.distanceKm = 0;
    this.timerInterval = null;
    this.elapsedSec = 0;
    this.speeds = []; // rolling speed window
  }

  async start() {
    if (!navigator.geolocation) {
      this.onError('Tu dispositivo no soporta GPS. Usa Safari en iPhone.');
      return false;
    }

    // Request wake lock to prevent screen sleep
    await this._acquireWakeLock();

    this.points = [];
    this.distanceKm = 0;
    this.lastPos = null;
    this.startTime = new Date();
    this.elapsedSec = 0;
    this.speeds = [];
    this.isRecording = true;

    // Start timer
    this.timerInterval = setInterval(() => {
      this.elapsedSec++;
      this._emit();
    }, 1000);

    // Start watching position
    this.watchId = navigator.geolocation.watchPosition(
      pos => this._onPosition(pos),
      err => this._onGeoError(err),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 2000
      }
    );

    // Also listen for visibility change (pause/resume)
    this._visibilityHandler = () => {
      if (document.hidden) {
        // Don't stop, but note it
      }
    };
    document.addEventListener('visibilitychange', this._visibilityHandler);

    return true;
  }

  stop() {
    if (!this.isRecording) return null;

    this.isRecording = false;

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this._visibilityHandler) {
      document.removeEventListener('visibilitychange', this._visibilityHandler);
    }

    this._releaseWakeLock();

    if (this.distanceKm < 0.05) return null; // Too short, discard

    const session = this._buildSession();
    return session;
  }

  _onPosition(pos) {
    const { latitude: lat, longitude: lng, accuracy, speed } = pos.coords;

    // Filter: ignore positions with accuracy > 50m
    if (accuracy > 50) return;

    const point = { lat, lng, accuracy, ts: pos.timestamp, speed };

    // Filter: ignore jumps > 50m between consecutive points
    if (this.lastPos) {
      const jump = haversineKm(this.lastPos.lat, this.lastPos.lng, lat, lng) * 1000;
      if (jump > 50) return;

      const dist = haversineKm(this.lastPos.lat, this.lastPos.lng, lat, lng);
      const timeDiffSec = (pos.timestamp - this.lastPos.ts) / 1000;

      if (dist > 0.001 && timeDiffSec > 0) { // > 1m
        this.distanceKm += dist;

        // Rolling speed (use GPS speed if available, otherwise calc from distance)
        const speedKmH = (speed !== null && speed !== undefined && speed >= 0)
          ? speed * 3.6
          : (dist / (timeDiffSec / 3600));

        this.speeds.push(speedKmH);
        if (this.speeds.length > 10) this.speeds.shift();
      }
    }

    this.points.push(point);
    this.lastPos = point;
    this._emit();
  }

  _onGeoError(err) {
    const messages = {
      1: 'Permiso de ubicación denegado. Ve a Ajustes > Safari > Localización.',
      2: 'No se puede obtener la ubicación. ¿Estás al aire libre?',
      3: 'Tiempo de espera GPS agotado. Muévete a un lugar con mejor señal.'
    };
    this.onError(messages[err.code] || 'Error de GPS desconocido.');
  }

  _emit() {
    const avgSpeed = this.speeds.length > 0
      ? this.speeds.reduce((a, b) => a + b, 0) / this.speeds.length
      : 0;

    const pace = avgSpeed > 0.5 ? 60 / avgSpeed : null; // min/km

    this.onUpdate({
      distanceKm: this.distanceKm,
      elapsedSec: this.elapsedSec,
      avgSpeedKmH: avgSpeed,
      paceMinKm: pace,
      pointCount: this.points.length,
      accuracy: this.lastPos?.accuracy || null,
      isRecording: this.isRecording
    });
  }

  _buildSession() {
    const endTime = new Date();
    const durationSec = Math.round((endTime - this.startTime) / 1000);
    const avgSpeedKmH = this.distanceKm > 0 && durationSec > 0
      ? this.distanceKm / (durationSec / 3600)
      : 0;

    const avgPaceMin = avgSpeedKmH > 0.3 ? 60 / avgSpeedKmH : null;
    const estimatedSteps = Math.round(this.distanceKm * 1300);
    const estimatedCalories = Math.round(this.distanceKm * 60 * (avgSpeedKmH > 8 ? 1.1 : 0.9));

    // Check if session was "continuous" (no big gaps = tortuga badge eligibility)
    const isContinuous = this._checkContinuous();

    // Compress path for storage (keep every 5th point, max 200 points)
    const pathForStorage = this.points
      .filter((_, i) => i % 5 === 0)
      .slice(0, 200)
      .map(p => [parseFloat(p.lat.toFixed(5)), parseFloat(p.lng.toFixed(5))]);

    return {
      id: `session_${Date.now()}`,
      startTime: this.startTime.toISOString(),
      endTime: endTime.toISOString(),
      distanceKm: parseFloat(this.distanceKm.toFixed(3)),
      durationSec,
      avgSpeedKmH: parseFloat(avgSpeedKmH.toFixed(2)),
      avgPaceMin: avgPaceMin ? parseFloat(avgPaceMin.toFixed(2)) : null,
      estimatedSteps,
      estimatedCalories,
      continuous: isContinuous,
      path: pathForStorage
    };
  }

  _checkContinuous() {
    if (this.points.length < 3) return false;
    // Check no gap > 60s between consecutive points
    for (let i = 1; i < this.points.length; i++) {
      const gap = (this.points[i].ts - this.points[i - 1].ts) / 1000;
      if (gap > 60) return false;
    }
    return true;
  }

  async _acquireWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          // Re-acquire if still recording
          if (this.isRecording) this._acquireWakeLock();
        });
      } catch (_) {}
    }
  }

  _releaseWakeLock() {
    if (this.wakeLock) {
      this.wakeLock.release().catch(() => {});
      this.wakeLock = null;
    }
  }

  getCurrentPath() {
    return this.points.map(p => ({ lat: p.lat, lng: p.lng }));
  }
}

// ─── Haversine formula ───
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return deg * Math.PI / 180; }

// ─── Format helpers ───
export function formatDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatPace(paceMinKm) {
  if (!paceMinKm || paceMinKm > 30) return '--:--';
  const min = Math.floor(paceMinKm);
  const sec = Math.round((paceMinKm - min) * 60);
  return `${min}:${String(sec).padStart(2, '0')}`;
}

export function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// ─── Draw GPS path on canvas ───
export function drawPath(canvas, points) {
  if (!canvas || points.length < 2) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
  const h = canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
  ctx.clearRect(0, 0, w, h);

  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);

  const pad = 20;
  const scaleX = (w - pad * 2) / (maxLng - minLng || 0.001);
  const scaleY = (h - pad * 2) / (maxLat - minLat || 0.001);
  const scale = Math.min(scaleX, scaleY);

  const toX = lng => pad + (lng - minLng) * scale + (w - pad * 2 - (maxLng - minLng) * scale) / 2;
  const toY = lat => h - pad - (lat - minLat) * scale - (h - pad * 2 - (maxLat - minLat) * scale) / 2;

  // Draw path
  ctx.beginPath();
  ctx.strokeStyle = '#FF6B35';
  ctx.lineWidth = 2.5 * (window.devicePixelRatio || 1);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  points.forEach((p, i) => {
    i === 0 ? ctx.moveTo(toX(p.lng), toY(p.lat)) : ctx.lineTo(toX(p.lng), toY(p.lat));
  });
  ctx.stroke();

  // Start dot (green)
  const sx = toX(points[0].lng), sy = toY(points[0].lat);
  ctx.beginPath();
  ctx.arc(sx, sy, 5 * (window.devicePixelRatio || 1), 0, Math.PI * 2);
  ctx.fillStyle = '#00e676';
  ctx.fill();

  // End dot (red)
  const ex = toX(points[points.length - 1].lng), ey = toY(points[points.length - 1].lat);
  ctx.beginPath();
  ctx.arc(ex, ey, 5 * (window.devicePixelRatio || 1), 0, Math.PI * 2);
  ctx.fillStyle = '#ff4444';
  ctx.fill();
}
