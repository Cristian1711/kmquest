// Health data module for KM Quest PWA
// Handles: Apple Health XML export import + DeviceMotion step counting
// No HealthKit needed — works without Apple Developer account

// ─── Apple Health XML Import ───

/**
 * Parse Apple Health export ZIP or XML file.
 * User exports from: Health app → Profile → Export All Health Data → share ZIP
 */
export async function importHealthFile(file, onProgress) {
  const name = file.name.toLowerCase();

  if (name.endsWith('.zip')) {
    return await parseHealthZip(file, onProgress);
  } else if (name.endsWith('.xml')) {
    return await parseHealthXML(file, onProgress);
  } else {
    throw new Error('Formato no soportado. Selecciona el archivo export.zip o export.xml de Apple Health.');
  }
}

async function parseHealthZip(file, onProgress) {
  // Dynamically load JSZip from CDN
  if (!window.JSZip) {
    onProgress?.({ status: 'Cargando descompresor...', pct: 5 });
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
  }

  onProgress?.({ status: 'Descomprimiendo archivo...', pct: 10 });

  const zip = await window.JSZip.loadAsync(file);
  const xmlFile = zip.file('apple_health_export/export.xml') ||
                  zip.file(/export\.xml$/i)?.[0];

  if (!xmlFile) {
    throw new Error('No se encontró export.xml dentro del ZIP. ¿Es el archivo correcto?');
  }

  onProgress?.({ status: 'Leyendo datos de salud...', pct: 30 });
  const xmlText = await xmlFile.async('text');
  return parseXMLText(xmlText, onProgress);
}

async function parseHealthXML(file, onProgress) {
  onProgress?.({ status: 'Leyendo archivo XML...', pct: 10 });
  const text = await file.text();
  return parseXMLText(text, onProgress);
}

function parseXMLText(xmlText, onProgress) {
  onProgress?.({ status: 'Analizando datos...', pct: 40 });

  // Use regex-based parsing for better performance on large files
  const dailyData = {};
  let totalSteps = 0;
  let totalDistanceKm = 0;
  let recordCount = 0;

  // Step count records
  const stepPattern = /type="HKQuantityTypeIdentifierStepCount"[^>]*startDate="([^"]+)"[^>]*value="([^"]+)"/g;
  let m;
  while ((m = stepPattern.exec(xmlText)) !== null) {
    const date = m[1].slice(0, 10);
    const value = parseFloat(m[2]);
    if (!isNaN(value) && value >= 0) {
      dailyData[date] = dailyData[date] || { steps: 0, distanceKm: 0, calories: 0, activeMinutes: 0 };
      dailyData[date].steps += value;
      totalSteps += value;
      recordCount++;
    }
  }

  onProgress?.({ status: 'Procesando distancias...', pct: 60 });

  // Distance records (km or m)
  const distPattern = /type="HKQuantityTypeIdentifierDistanceWalkingRunning"[^>]*startDate="([^"]+)"[^>]*unit="([^"]+)"[^>]*value="([^"]+)"/g;
  while ((m = distPattern.exec(xmlText)) !== null) {
    const date = m[1].slice(0, 10);
    const unit = m[2];
    let value = parseFloat(m[3]);
    if (isNaN(value) || value < 0) continue;
    if (unit === 'm' || unit === 'meter' || unit === 'meters') value /= 1000;
    dailyData[date] = dailyData[date] || { steps: 0, distanceKm: 0, calories: 0, activeMinutes: 0 };
    dailyData[date].distanceKm += value;
    totalDistanceKm += value;
    recordCount++;
  }

  onProgress?.({ status: 'Procesando calorías...', pct: 75 });

  // Active calories
  const calPattern = /type="HKQuantityTypeIdentifierActiveEnergyBurned"[^>]*startDate="([^"]+)"[^>]*value="([^"]+)"/g;
  while ((m = calPattern.exec(xmlText)) !== null) {
    const date = m[1].slice(0, 10);
    const value = parseFloat(m[2]);
    if (!isNaN(value) && value >= 0) {
      dailyData[date] = dailyData[date] || { steps: 0, distanceKm: 0, calories: 0, activeMinutes: 0 };
      dailyData[date].calories += value;
    }
  }

  // Exercise minutes
  const exPattern = /type="HKQuantityTypeIdentifierAppleExerciseTime"[^>]*startDate="([^"]+)"[^>]*value="([^"]+)"/g;
  while ((m = exPattern.exec(xmlText)) !== null) {
    const date = m[1].slice(0, 10);
    const value = parseFloat(m[2]);
    if (!isNaN(value) && value >= 0) {
      dailyData[date] = dailyData[date] || { steps: 0, distanceKm: 0, calories: 0, activeMinutes: 0 };
      dailyData[date].activeMinutes += value;
    }
  }

  onProgress?.({ status: 'Finalizando...', pct: 90 });

  // Round values for storage efficiency
  Object.values(dailyData).forEach(d => {
    d.steps = Math.round(d.steps);
    d.distanceKm = parseFloat(d.distanceKm.toFixed(3));
    d.calories = Math.round(d.calories);
    d.activeMinutes = Math.round(d.activeMinutes);
  });

  const importedDays = Object.keys(dailyData).length;

  onProgress?.({ status: `✓ ${importedDays} días importados`, pct: 100 });

  return {
    dailyData,
    totalSteps: Math.round(totalSteps),
    totalDistanceKm: parseFloat(totalDistanceKm.toFixed(3)),
    importedDays,
    recordCount,
    lastSync: new Date().toISOString(),
    connected: true
  };
}

// ─── Aggregation helpers ───

export function aggregateHealthData(dailyData) {
  let totalSteps = 0, totalDistanceKm = 0, totalCalories = 0, totalActiveMin = 0;
  Object.values(dailyData).forEach(d => {
    totalSteps += d.steps || 0;
    totalDistanceKm += d.distanceKm || 0;
    totalCalories += d.calories || 0;
    totalActiveMin += d.activeMinutes || 0;
  });
  return {
    totalSteps: Math.round(totalSteps),
    totalDistanceKm: parseFloat(totalDistanceKm.toFixed(3)),
    totalCalories: Math.round(totalCalories),
    totalActiveMin: Math.round(totalActiveMin)
  };
}

export function getTodayHealthData(dailyData) {
  const today = new Date().toISOString().slice(0, 10);
  return dailyData[today] || { steps: 0, distanceKm: 0, calories: 0, activeMinutes: 0 };
}

export function getLast90DaysData(dailyData) {
  const result = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, ...(dailyData[key] || { steps: 0, distanceKm: 0, calories: 0 }) });
  }
  return result;
}

export function getLast8WeeksKm(dailyData, gpsSessions) {
  const weeks = [];
  for (let w = 7; w >= 0; w--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() - w * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    let km = 0;
    for (let d = new Date(weekStart); d < weekEnd; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      km += (dailyData[key]?.distanceKm || 0);
    }

    // Add GPS sessions for this week
    gpsSessions?.forEach(s => {
      const sd = new Date(s.startTime);
      if (sd >= weekStart && sd < weekEnd) {
        const dateKey = s.startTime.slice(0, 10);
        // Only add if not already in health data (dedup)
        if (!dailyData[dateKey]?.distanceKm) km += s.distanceKm || 0;
      }
    });

    const label = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
    weeks.push({ label, km: parseFloat(km.toFixed(1)), weekStart: weekStart.toISOString() });
  }
  return weeks;
}

export function computeStreakFromHealthAndGPS(dailyData, gpsSessions) {
  const activeDays = new Set();

  // Add days from health data (with any activity)
  Object.entries(dailyData).forEach(([date, d]) => {
    if ((d.steps || 0) > 500 || (d.distanceKm || 0) > 0.1) {
      activeDays.add(date);
    }
  });

  // Add days from GPS sessions
  gpsSessions?.forEach(s => {
    activeDays.add(s.startTime.slice(0, 10));
  });

  // Compute current streak backwards from today
  let streak = 0;
  let record = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if active today or yesterday (grace period for today not finished)
  const todayKey = today.toISOString().slice(0, 10);
  const yestKey = new Date(today.getTime() - 86400000).toISOString().slice(0, 10);
  const startFrom = activeDays.has(todayKey) ? today : (activeDays.has(yestKey) ? new Date(today.getTime() - 86400000) : null);

  if (startFrom) {
    for (let d = new Date(startFrom); ; d.setDate(d.getDate() - 1)) {
      const key = d.toISOString().slice(0, 10);
      if (activeDays.has(key)) { streak++; } else break;
    }
  }

  // Compute record streak
  const sortedDays = [...activeDays].sort();
  let cur = 0;
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) { cur = 1; continue; }
    const prev = new Date(sortedDays[i - 1]);
    const curr = new Date(sortedDays[i]);
    const diff = (curr - prev) / 86400000;
    cur = diff === 1 ? cur + 1 : 1;
    record = Math.max(record, cur);
  }
  record = Math.max(record, streak);

  return { current: streak, record, activeDays: activeDays.size };
}

// ─── DeviceMotion Step Counter ───

export class StepCounter {
  constructor(onStep) {
    this.onStep = onStep;
    this.active = false;
    this.steps = 0;
    this._handler = null;
    this._lastMag = 0;
    this._threshold = 1.2;
    this._lastStepTime = 0;
    this._minStepInterval = 300; // ms — minimum time between steps
    this._buffer = [];
    this._bufferSize = 10;
  }

  async start() {
    if (!window.DeviceMotionEvent) return false;

    // iOS 13+ requires permission
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceMotionEvent.requestPermission();
        if (permission !== 'granted') return false;
      } catch (_) {
        return false;
      }
    }

    this.active = true;
    this.steps = 0;

    this._handler = e => this._onMotion(e);
    window.addEventListener('devicemotion', this._handler);
    return true;
  }

  stop() {
    this.active = false;
    if (this._handler) {
      window.removeEventListener('devicemotion', this._handler);
      this._handler = null;
    }
  }

  _onMotion(event) {
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;

    const mag = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);

    // Smooth with rolling average
    this._buffer.push(mag);
    if (this._buffer.length > this._bufferSize) this._buffer.shift();
    const avg = this._buffer.reduce((a, b) => a + b, 0) / this._buffer.length;

    // Peak detection: was below threshold, now above
    const now = Date.now();
    if (this._lastMag < avg && mag > avg + this._threshold) {
      if (now - this._lastStepTime > this._minStepInterval) {
        this.steps++;
        this._lastStepTime = now;
        this.onStep(this.steps);
      }
    }
    this._lastMag = mag;
  }
}

// ─── Demo / mock data for web preview ───
export function generateDemoData() {
  const dailyData = {};
  const today = new Date();

  // Generate 180 days of realistic demo data
  for (let i = 179; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);

    // Skip some days for realism
    if (Math.random() < 0.15) continue;

    const steps = Math.round(3000 + Math.random() * 12000);
    const distanceKm = parseFloat((steps * 0.00075).toFixed(3));
    const calories = Math.round(steps * 0.04);
    const activeMinutes = Math.round(steps / 100);

    dailyData[key] = { steps, distanceKm, calories, activeMinutes };
  }

  const agg = aggregateHealthData(dailyData);
  return {
    dailyData,
    ...agg,
    importedDays: Object.keys(dailyData).length,
    lastSync: new Date().toISOString(),
    connected: false, // demo mode
    isDemo: true
  };
}

// ─── Helper: load external script ───
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
