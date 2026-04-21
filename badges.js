// All 80+ badge definitions and unlock logic for KM Quest

export const BADGE_CATEGORIES = [
  { id: 'all',      label: 'Todos',    icon: '🏆' },
  { id: 'distance', label: 'Distancia', icon: '🗺️' },
  { id: 'steps',    label: 'Pasos',    icon: '👟' },
  { id: 'streak',   label: 'Rachas',   icon: '🔥' },
  { id: 'sessions', label: 'Sesiones', icon: '📍' },
  { id: 'feats',    label: 'Hazañas',  icon: '⚡' },
  { id: 'time',     label: 'Horario',  icon: '🕐' },
  { id: 'calendar', label: 'Fechas',   icon: '📅' },
  { id: 'special',  label: 'Especial', icon: '✨' },
  { id: 'health',   label: 'Health',   icon: '❤️' }
];

export const BADGES = [

  // ─── CATEGORÍA 1: Distancia acumulada (km totales) ───
  { id: 'primer-aliento',      cat: 'distance', emoji: '🌱', name: 'Primer Aliento',       req: '0.1 km',        desc: 'Empieza el viaje',                                    check: s => s.totalKm >= 0.1 },
  { id: 'primeros-pasos',      cat: 'distance', emoji: '🐾', name: 'Primeros Pasos',        req: '0.5 km',        desc: 'Más largo que el Vaticano entero',                    check: s => s.totalKm >= 0.5 },
  { id: 'larva-en-marcha',     cat: 'distance', emoji: '🐛', name: 'Larva en Marcha',       req: '1 km',          desc: '= altura del Empire State tumbado',                   check: s => s.totalKm >= 1 },
  { id: 'brote-verde',         cat: 'distance', emoji: '🌿', name: 'Brote Verde',           req: '2 km',          desc: 'Dos veces la pista de atletismo olímpica',            check: s => s.totalKm >= 2 },
  { id: 'pies-de-barro',       cat: 'distance', emoji: '🦶', name: 'Pies de Barro',         req: '3 km',          desc: 'Central Park de norte a sur',                         check: s => s.totalKm >= 3 },
  { id: 'ola-pequena',         cat: 'distance', emoji: '🌊', name: 'Ola Pequeña',           req: '5 km',          desc: '= 5.000 metros olímpicos',                            check: s => s.totalKm >= 5 },
  { id: 'primera-cima',        cat: 'distance', emoji: '🏔️', name: 'Primera Cima',          req: '7 km',          desc: '= altura del Mont Blanc en horizontal',               check: s => s.totalKm >= 7 },
  { id: 'everest-horizontal',  cat: 'distance', emoji: '⛰️', name: 'Everest Horizontal',    req: '8.848 km',      desc: '= altura exacta del Everest recorrida en horizontal', check: s => s.totalKm >= 8.848 },
  { id: 'mediofondista',       cat: 'distance', emoji: '🏅', name: 'Mediofondista',         req: '10 km',         desc: 'Distancia olímpica de los 10.000m',                   check: s => s.totalKm >= 10 },
  { id: 'semiluna',            cat: 'distance', emoji: '🌙', name: 'Semiluna',              req: '15 km',         desc: 'De Madrid a Alcalá de Henares',                       check: s => s.totalKm >= 15 },
  { id: 'medio-maraton',       cat: 'distance', emoji: '🚂', name: 'Medio Maratón',         req: '21.1 km',       desc: 'La mitad de la hazaña de Filípides',                  check: s => s.totalKm >= 21.1 },
  { id: 'tercer-mundo',        cat: 'distance', emoji: '🎖️', name: 'Tercer Mundo',          req: '30 km',         desc: 'Como cruzar la Comunidad de Madrid',                  check: s => s.totalKm >= 30 },
  { id: 'maratoniano',         cat: 'distance', emoji: '🦁', name: 'Maratoniano',           req: '42.2 km',       desc: 'Atenas → Maratón, año 490 a.C.',                      check: s => s.totalKm >= 42.2 },
  { id: 'explorador-jr',       cat: 'distance', emoji: '🌵', name: 'Explorador Jr.',        req: '60 km',         desc: 'Madrid a Guadalajara a pie',                          check: s => s.totalKm >= 60 },
  { id: 'ultrarunner-jr',      cat: 'distance', emoji: '🏙️', name: 'Ultrarunner Jr.',       req: '75 km',         desc: 'Madrid a Toledo y vuelta',                            check: s => s.totalKm >= 75 },
  { id: 'stonehenge-london',   cat: 'distance', emoji: '🗿', name: 'Stonehenge a Londres',  req: '90 km',         desc: '= esa ruta exacta',                                   check: s => s.totalKm >= 90 },
  { id: 'centurion',           cat: 'distance', emoji: '💯', name: 'Centurión',             req: '100 km',        desc: 'Madrid a Toledo a pie',                               check: s => s.totalKm >= 100 },
  { id: 'estrella-fugaz',      cat: 'distance', emoji: '🌠', name: 'Estrella Fugaz',        req: '150 km',        desc: 'Madrid a Cuenca',                                     check: s => s.totalKm >= 150 },
  { id: 'aguila-iberica',      cat: 'distance', emoji: '🦅', name: 'Águila Ibérica',        req: '200 km',        desc: 'Andalucía de punta a punta',                          check: s => s.totalKm >= 200 },
  { id: 'volcan-activo',       cat: 'distance', emoji: '🌋', name: 'Volcán Activo',         req: '300 km',        desc: 'De Tenerife a Lanzarote',                             check: s => s.totalKm >= 300 },
  { id: 'navegante',           cat: 'distance', emoji: '🧭', name: 'Navegante',             req: '400 km',        desc: '= cruzar Portugal de norte a sur',                    check: s => s.totalKm >= 400 },
  { id: 'ave-humano',          cat: 'distance', emoji: '🚄', name: 'AVE Humano',            req: '500 km',        desc: 'Madrid a Barcelona a pie',                            check: s => s.totalKm >= 500 },
  { id: 'reconquistador',      cat: 'distance', emoji: '⚔️', name: 'Reconquistador',        req: '800 km',        desc: 'Gibraltar a los Pirineos',                            check: s => s.totalKm >= 800 },
  { id: 'explorador',          cat: 'distance', emoji: '🗺️', name: 'Explorador',            req: '1.000 km',      desc: 'Londres a Roma',                                      check: s => s.totalKm >= 1000 },
  { id: 'camino-santiago',     cat: 'distance', emoji: '🏰', name: 'Camino de Santiago',    req: '1.200 km',      desc: '= Camino Francés x2',                                 check: s => s.totalKm >= 1200 },
  { id: 'anibal',              cat: 'distance', emoji: '🐘', name: 'Aníbal',                req: '2.500 km',      desc: 'Cartagena a Roma sin elefantes',                      check: s => s.totalKm >= 2500 },
  { id: 'transeuropeo',        cat: 'distance', emoji: '🌍', name: 'Transeuropeo',          req: '3.500 km',      desc: 'Lisboa a Moscú',                                      check: s => s.totalKm >= 3500 },
  { id: 'transamericano',      cat: 'distance', emoji: '🦅', name: 'Transamericano',        req: '5.000 km',      desc: 'Costa a costa de EEUU',                               check: s => s.totalKm >= 5000 },
  { id: 'diametro-terrestre',  cat: 'distance', emoji: '🌍', name: 'Diámetro Terrestre',    req: '12.756 km',     desc: 'De polo a polo del planeta Tierra',                   check: s => s.totalKm >= 12756 },
  { id: 'circunnavegador',     cat: 'distance', emoji: '🌐', name: 'Circunnavegador',       req: '40.075 km',     desc: 'Vuelta al mundo completa',                            check: s => s.totalKm >= 40075 },
  { id: 'cazador-lunar',       cat: 'distance', emoji: '🌙', name: 'Cazador Lunar',         req: '384.400 km',    desc: 'Distancia a la Luna',                                 check: s => s.totalKm >= 384400 },

  // ─── CATEGORÍA 2: Pasos acumulados ───
  { id: 'primer-millar',       cat: 'steps', emoji: '👟', name: 'Primer Millar',        req: '1.000 pasos',        desc: 'El inicio de todos los viajes',                       check: s => s.totalSteps >= 1000 },
  { id: 'caminante',           cat: 'steps', emoji: '🚶', name: 'Caminante',             req: '10.000 pasos',       desc: 'El objetivo diario, por primera vez',                 check: s => s.totalSteps >= 10000 },
  { id: 'maquina',             cat: 'steps', emoji: '🦿', name: 'Máquina',               req: '50.000 pasos',       desc: 'Eres imparable',                                      check: s => s.totalSteps >= 50000 },
  { id: 'bailarin-invisible',  cat: 'steps', emoji: '💃', name: 'Bailarín Invisible',    req: '100.000 pasos',      desc: '100K pasos ≈ 70 km recorridos',                       check: s => s.totalSteps >= 100000 },
  { id: 'hormiguita',          cat: 'steps', emoji: '🐜', name: 'Hormiguita',            req: '500.000 pasos',      desc: 'Perseverancia de insecto',                            check: s => s.totalSteps >= 500000 },
  { id: 'millonario-pasos',    cat: 'steps', emoji: '🌍', name: 'Millonario de Pasos',   req: '1.000.000 pasos',    desc: '¡Un millón de pasos! Épico.',                         check: s => s.totalSteps >= 1000000 },
  { id: 'decamillonario',      cat: 'steps', emoji: '💎', name: 'Decamillonario',        req: '10.000.000 pasos',   desc: 'Leyenda andante',                                     check: s => s.totalSteps >= 10000000 },
  { id: 'rey-del-asfalto',     cat: 'steps', emoji: '👑', name: 'Rey del Asfalto',       req: '50.000.000 pasos',   desc: 'Inmortal',                                            check: s => s.totalSteps >= 50000000 },

  // ─── CATEGORÍA 3: Rachas diarias ───
  { id: 'chispa',              cat: 'streak', emoji: '🔥', name: 'Chispa',               req: '3 días seguidos',   desc: 'El hábito empieza a formarse',                        check: s => s.currentStreak >= 3 },
  { id: 'semilla-habito',      cat: 'streak', emoji: '🌱', name: 'Semilla de Hábito',    req: '5 días seguidos',   desc: 'Ya huele a rutina',                                   check: s => s.currentStreak >= 5 },
  { id: 'semana-perfecta',     cat: 'streak', emoji: '📅', name: 'Semana Perfecta',      req: '7 días seguidos',   desc: '7 días sin excusas',                                  check: s => s.currentStreak >= 7 },
  { id: 'quincena-hierro',     cat: 'streak', emoji: '🌙', name: 'Quincena de Hierro',   req: '14 días seguidos',  desc: 'Dos semanas de pura voluntad',                        check: s => s.currentStreak >= 14 },
  { id: 'mes-sin-excusas',     cat: 'streak', emoji: '📆', name: 'Mes Sin Excusas',      req: '30 días seguidos',  desc: 'Un mes entero. Impresionante.',                       check: s => s.currentStreak >= 30 },
  { id: 'constante',           cat: 'streak', emoji: '🧊', name: 'Constante',            req: '50 días seguidos',  desc: 'No hay nada que te detenga',                          check: s => s.currentStreak >= 50 },
  { id: 'cima-habito',         cat: 'streak', emoji: '🏔️', name: 'Cima de Hábito',       req: '75 días seguidos',  desc: 'El movimiento es tu estado natural',                  check: s => s.currentStreak >= 75 },
  { id: 'centurion-racha',     cat: 'streak', emoji: '💎', name: 'Centurión de Racha',   req: '100 días seguidos', desc: '100 días consecutivos. Tú sí puedes.',                check: s => s.currentStreak >= 100 },
  { id: 'mago-habito',         cat: 'streak', emoji: '🔮', name: 'Mago del Hábito',      req: '150 días seguidos', desc: '150 días. Más que un trimestre académico.',           check: s => s.currentStreak >= 150 },
  { id: 'un-ano-entero',       cat: 'streak', emoji: '🏛️', name: 'Un Año Entero',        req: '365 días seguidos', desc: '365 días. Leyenda viva.',                             check: s => s.currentStreak >= 365 },
  { id: 'eterno',              cat: 'streak', emoji: '♾️', name: 'Eterno',               req: '500 días seguidos', desc: '500 días. Más allá del tiempo.',                      check: s => s.currentStreak >= 500 },

  // ─── CATEGORÍA 4: Sesiones y frecuencia ───
  { id: 'en-marcha',           cat: 'sessions', emoji: '👟', name: 'En Marcha',          req: '5 sesiones',    desc: 'Cinco salidas. El motor arranca.',                      check: s => s.totalSessions >= 5 },
  { id: 'disciplinado',        cat: 'sessions', emoji: '🎯', name: 'Disciplinado',        req: '10 sesiones',   desc: '10 salidas. Ya es un hábito.',                          check: s => s.totalSessions >= 10 },
  { id: 'veterano',            cat: 'sessions', emoji: '💪', name: 'Veterano',            req: '25 sesiones',   desc: '25 salidas. Respeto.',                                  check: s => s.totalSessions >= 25 },
  { id: 'cincuenton',          cat: 'sessions', emoji: '🏆', name: 'Cincuentón',          req: '50 sesiones',   desc: 'Cincuenta sesiones de pura dedicación',                 check: s => s.totalSessions >= 50 },
  { id: 'centenario',          cat: 'sessions', emoji: '🌟', name: 'Centenario',          req: '100 sesiones',  desc: '100 salidas. Extraordinario.',                          check: s => s.totalSessions >= 100 },
  { id: 'guerrero',            cat: 'sessions', emoji: '🔱', name: 'Guerrero',            req: '200 sesiones',  desc: '200 sesiones. Un guerrero sin igual.',                  check: s => s.totalSessions >= 200 },
  { id: 'leyenda',             cat: 'sessions', emoji: '👁️', name: 'Leyenda',             req: '500 sesiones',  desc: '500 salidas. Entraste en la historia.',                 check: s => s.totalSessions >= 500 },

  // ─── CATEGORÍA 5: Hazañas en una sesión GPS ───
  { id: 'veloz',               cat: 'feats', emoji: '⚡', name: 'Veloz',                req: 'Sesión > 10 km',        desc: 'Más de 10 km en una sola salida',                       check: s => s.bestSessionKm >= 10 },
  { id: 'cohete',              cat: 'feats', emoji: '🚀', name: 'Cohete',               req: 'Sesión > 20 km',        desc: 'Más de 20 km sin parar',                                check: s => s.bestSessionKm >= 20 },
  { id: 'nave-espacial',       cat: 'feats', emoji: '🛸', name: 'Nave Espacial',        req: 'Sesión > 30 km',        desc: '30 km de una tacada. Élite.',                           check: s => s.bestSessionKm >= 30 },
  { id: 'jinete-fantasma',     cat: 'feats', emoji: '🏇', name: 'Jinete Fantasma',      req: 'Sesión > 42.2 km',      desc: '¡Ultramaratón completo en GPS!',                        check: s => s.bestSessionKm >= 42.2 },
  { id: 'rayo',                cat: 'feats', emoji: '⚡', name: 'Rayo',                 req: 'Ritmo < 5 min/km',      desc: 'Ritmo medio < 5 min/km en sesión > 3 km',               check: s => s.fastestPace !== null && s.fastestPace < 5 && s.fastPaceSessionKm >= 3 },
  { id: 'vendaval',            cat: 'feats', emoji: '🌪️', name: 'Vendaval',             req: 'Ritmo < 4 min/km',      desc: 'Ritmo medio < 4 min/km en cualquier sesión',            check: s => s.fastestPace !== null && s.fastestPace < 4 },
  { id: 'tortuga-gana',        cat: 'feats', emoji: '🐢', name: 'La Tortuga Gana',      req: 'Sesión constante',      desc: 'Más de 1 km sin parar a ritmo < 8 min/km',             check: s => s.hasTortugaAchievement },

  // ─── CATEGORÍA 6: Horas del día ───
  { id: 'madrugador',          cat: 'time', emoji: '🌅', name: 'Madrugador',             req: 'Sesión antes 07:00',    desc: 'Madrugar es de valientes',                              check: s => s.earlyMorningSessions >= 1 },
  { id: 'senor-mediodia',      cat: 'time', emoji: '🌞', name: 'Señor del Mediodía',     req: 'Sesión 12:00–13:00',    desc: 'Nadie sale al mediodía. Tú sí.',                        check: s => s.noonSessions >= 1 },
  { id: 'tarde-dorada',        cat: 'time', emoji: '🌆', name: 'Tarde Dorada',           req: 'Sesión 18:00–20:00',    desc: 'La hora perfecta para correr',                          check: s => s.goldenHourSessions >= 1 },
  { id: 'noctambulo',          cat: 'time', emoji: '🦉', name: 'Noctámbulo',             req: 'Sesión después 22:00',  desc: 'La ciudad duerme, tú corres',                           check: s => s.nightSessions >= 1 },
  { id: 'ciudad-durmiente',    cat: 'time', emoji: '🌃', name: 'Ciudad Durmiente',       req: 'Sesión entre 00:00–05:00', desc: 'Eso ya es otro nivel de compromiso',                 check: s => s.deepNightSessions >= 1 },
  { id: 'amanecer-epico',      cat: 'time', emoji: '🌄', name: 'Amanecer Épico',         req: '5 sesiones antes 06:30', desc: 'Cinco auroras en movimiento',                          check: s => s.dawnSessions >= 5 },

  // ─── CATEGORÍA 7: Calendario y fechas especiales ───
  { id: 'navidad-runner',      cat: 'calendar', emoji: '🎄', name: 'Navidad Runner',      req: '25 diciembre',    desc: 'Mientras el mundo desenvuelve regalos, tú corres',      check: s => s.sessionDates.some(d => d.month === 12 && d.day === 25) },
  { id: 'ano-nuevo-piernas',   cat: 'calendar', emoji: '🎆', name: 'Año Nuevo Piernas',   req: '1 enero',         desc: 'El año empieza con el pie derecho',                     check: s => s.sessionDates.some(d => d.month === 1 && d.day === 1) },
  { id: 'san-valentin-fit',    cat: 'calendar', emoji: '❤️', name: 'San Valentín Fit',    req: '14 febrero',      desc: 'Tu corazón late fuerte por otra razón',                 check: s => s.sessionDates.some(d => d.month === 2 && d.day === 14) },
  { id: 'san-patricio',        cat: 'calendar', emoji: '☘️', name: 'San Patricio',         req: '17 marzo',        desc: 'Verde y en marcha',                                     check: s => s.sessionDates.some(d => d.month === 3 && d.day === 17) },
  { id: 'dia-trabajo',         cat: 'calendar', emoji: '👷', name: 'Día del Trabajo',      req: '1 mayo',          desc: 'Trabajando en ti mismo',                                check: s => s.sessionDates.some(d => d.month === 5 && d.day === 1) },
  { id: 'halloween-runner',    cat: 'calendar', emoji: '🎃', name: 'Halloween Runner',     req: '31 octubre',      desc: 'Disfrazado de atleta o no, da igual',                   check: s => s.sessionDates.some(d => d.month === 10 && d.day === 31) },
  { id: 'verano-sin-parar',    cat: 'calendar', emoji: '🏖️', name: 'Ni en Verano Paro',    req: 'Sesión en agosto', desc: 'En pleno calor, tú no te rindes',                      check: s => s.sessionDates.some(d => d.month === 8) },
  { id: 'otono-dorado',        cat: 'calendar', emoji: '🍂', name: 'Otoño Dorado',         req: 'Sep + Oct + Nov', desc: 'Sesiones en los 3 meses de otoño',                      check: s => [9,10,11].every(m => s.sessionDates.some(d => d.month === m)) },
  { id: 'invierno-hierro',     cat: 'calendar', emoji: '❄️', name: 'Invierno de Hierro',   req: 'Dic + Ene + Feb', desc: 'Sesiones en los 3 meses de invierno',                   check: s => [12,1,2].every(m => s.sessionDates.some(d => d.month === m)) },
  { id: 'dia-tierra',          cat: 'calendar', emoji: '🌍', name: 'Día de la Tierra',     req: '22 abril',        desc: 'Cuidas el planeta corriendo por él',                    check: s => s.sessionDates.some(d => d.month === 4 && d.day === 22) },

  // ─── CATEGORÍA 8: Logros sociales y curiosos ───
  { id: 'criatura-rutinaria',  cat: 'special', emoji: '🔁', name: 'Criatura Rutinaria',   req: 'Misma hora x7',          desc: 'Misma hora (±30 min) en 7 sesiones seguidas',           check: s => s.hasSameHourStreak },
  { id: 'rey-del-lunes',       cat: 'special', emoji: '🗓️', name: 'Rey del Lunes',         req: 'Todos los lunes de 1 mes', desc: 'Salir todos los lunes de un mes natural',              check: s => s.hasFullMonthMondays },
  { id: 'semana-completa',     cat: 'special', emoji: '🌈', name: 'Semana Completa',       req: '7 días de la semana',    desc: 'Los 7 días de la misma semana',                         check: s => s.hasFullWeek },
  { id: 'jornada-epica',       cat: 'special', emoji: '🔟', name: 'Jornada Épica',         req: '+20 km en 1 día',        desc: 'Más de 20 km en un solo día (GPS + Health)',            check: s => s.bestDayKm >= 20 },
  { id: 'tech-warrior',        cat: 'special', emoji: '📱', name: 'Tech Warrior',          req: 'GPS + Health activos',   desc: 'Tienes ambas fuentes: GPS activo y Apple Health conectado', check: s => s.totalSessions >= 1 && s.healthConnected },
  { id: 'el-metodo',           cat: 'special', emoji: '🧠', name: 'El Método',             req: '4 semanas con +3 sesiones', desc: 'Cuatro semanas seguidas con más de 3 sesiones/semana', check: s => s.hasConsistentMonth },
  { id: 'el-relojero',         cat: 'special', emoji: '⏱️', name: 'El Relojero',           req: '10 sesiones 29–31 min',  desc: '10 sesiones con duración exacta entre 29 y 31 min',    check: s => s.preciseSessionCount >= 10 },

  // ─── CATEGORÍA 9: Hitos de Apple Health ───
  { id: 'health-conectado',    cat: 'health', emoji: '💚', name: 'Health Conectado',      req: 'Conectar Apple Health', desc: 'Importaste datos de Apple Health por primera vez',      check: s => s.healthConnected },
  { id: 'arqueologo',          cat: 'health', emoji: '📊', name: 'Arqueólogo',             req: '+365 días históricos',  desc: 'Importaste más de 365 días de datos históricos',        check: s => s.healthImportedDays >= 365 },
  { id: 'ano-completo-health', cat: 'health', emoji: '🗓️', name: 'Año Completo Health',    req: '365 días con datos',    desc: 'Tienes datos de los 365 días de un año completo',       check: s => s.hasFullYearHealth },
  { id: 'en-racha-health',     cat: 'health', emoji: '📈', name: 'En Racha Health',        req: '30 días +8.000 pasos',  desc: '30 días consecutivos con más de 8.000 pasos en Health', check: s => s.healthStepStreak30 },
  { id: '10k-diarios',         cat: 'health', emoji: '🏆', name: '10K Diarios',            req: '50 días +10.000 pasos', desc: '50 días con más de 10.000 pasos en Health',             check: s => s.healthDays10k >= 50 },
  { id: '10k-rey',             cat: 'health', emoji: '👑', name: '10K Rey',                req: '100 días +10.000 pasos', desc: '100 días con más de 10.000 pasos. Leyenda.',            check: s => s.healthDays10k >= 100 }
];

// Build fast lookup map
export const BADGE_MAP = Object.fromEntries(BADGES.map(b => [b.id, b]));

/**
 * Build the stats snapshot from app state needed for badge checking.
 * This is the single function that transforms raw app data into check inputs.
 */
export function buildStatsSnapshot(state) {
  const sessions = state.gpsSessions || [];
  const healthDaily = state.health?.dailyData || {};
  const healthConnected = state.health?.connected || false;
  const healthImportedDays = state.health?.importedDays || 0;

  // Totals
  const totalKm = state.totals?.km || 0;
  const totalSteps = state.totals?.steps || 0;
  const totalSessions = sessions.length;

  // Best session km
  const bestSessionKm = sessions.reduce((max, s) => Math.max(max, s.distanceKm || 0), 0);

  // Best day km (GPS + Health combined per day)
  const dayKm = {};
  sessions.forEach(s => {
    const d = s.startTime?.slice(0, 10);
    if (d) dayKm[d] = (dayKm[d] || 0) + (s.distanceKm || 0);
  });
  Object.entries(healthDaily).forEach(([d, v]) => {
    dayKm[d] = Math.max(dayKm[d] || 0, v.distanceKm || 0);
  });
  const bestDayKm = Math.max(0, ...Object.values(dayKm));

  // Fastest pace (min/km) — only sessions with pace data
  let fastestPace = null;
  let fastPaceSessionKm = 0;
  sessions.forEach(s => {
    if (s.avgPaceMin && s.distanceKm) {
      if (fastestPace === null || s.avgPaceMin < fastestPace) {
        fastestPace = s.avgPaceMin;
        fastPaceSessionKm = s.distanceKm;
      }
    }
  });

  // Tortuga achievement: session > 1km, pace < 8 min/km, recorded as continuous
  const hasTortugaAchievement = sessions.some(s =>
    s.distanceKm >= 1 && s.avgPaceMin && s.avgPaceMin < 8 && s.continuous === true
  );

  // Session date objects for calendar badges
  const sessionDates = sessions.map(s => {
    const dt = new Date(s.startTime);
    return { month: dt.getMonth() + 1, day: dt.getDate(), hour: dt.getHours(), dow: dt.getDay() };
  });

  // Time-of-day counters
  const earlyMorningSessions = sessionDates.filter(d => d.hour < 7).length;
  const noonSessions = sessionDates.filter(d => d.hour >= 12 && d.hour < 13).length;
  const goldenHourSessions = sessionDates.filter(d => d.hour >= 18 && d.hour < 20).length;
  const nightSessions = sessionDates.filter(d => d.hour >= 22).length;
  const deepNightSessions = sessionDates.filter(d => d.hour >= 0 && d.hour < 5).length;
  const dawnSessions = sessionDates.filter(d => d.hour < 7 && (d.hour > 5 || (d.hour === 6 && new Date(sessions[sessionDates.indexOf(d)]?.startTime).getMinutes() <= 30))).length;

  // Streaks (from health or computed from session dates)
  const currentStreak = state.streak?.current || 0;

  // "Criatura Rutinaria" - same hour ±30min in 7 consecutive sessions
  let hasSameHourStreak = false;
  if (sessions.length >= 7) {
    for (let i = 0; i <= sessions.length - 7; i++) {
      const slice = sessions.slice(i, i + 7);
      const hours = slice.map(s => new Date(s.startTime).getHours() * 60 + new Date(s.startTime).getMinutes());
      const refMin = hours[0];
      if (hours.every(m => Math.abs(m - refMin) <= 30)) { hasSameHourStreak = true; break; }
    }
  }

  // "Rey del Lunes" - every Monday of a calendar month
  let hasFullMonthMondays = false;
  const mondaySessions = sessions.filter(s => new Date(s.startTime).getDay() === 1);
  if (mondaySessions.length >= 4) {
    const byYearMonth = {};
    mondaySessions.forEach(s => {
      const dt = new Date(s.startTime);
      const key = `${dt.getFullYear()}-${dt.getMonth()}`;
      byYearMonth[key] = byYearMonth[key] || new Set();
      byYearMonth[key].add(dt.getDate());
    });
    for (const [key, days] of Object.entries(byYearMonth)) {
      const [y, m] = key.split('-').map(Number);
      const allMondays = getAllMondaysInMonth(y, m);
      if (allMondays.every(d => days.has(d))) { hasFullMonthMondays = true; break; }
    }
  }

  // "Semana Completa" - all 7 days in a single ISO week
  let hasFullWeek = false;
  const weekMap = {};
  sessions.forEach(s => {
    const dt = new Date(s.startTime);
    const week = getISOWeek(dt);
    weekMap[week] = weekMap[week] || new Set();
    weekMap[week].add(dt.getDay());
  });
  hasFullWeek = Object.values(weekMap).some(days => days.size === 7);

  // "El Método" - 4 consecutive weeks with ≥3 sessions/week
  let hasConsistentMonth = false;
  if (sessions.length >= 12) {
    const weekSessions = {};
    sessions.forEach(s => {
      const week = getISOWeek(new Date(s.startTime));
      weekSessions[week] = (weekSessions[week] || 0) + 1;
    });
    const weeks = Object.entries(weekSessions).sort(([a], [b]) => a.localeCompare(b));
    for (let i = 0; i <= weeks.length - 4; i++) {
      if (weeks.slice(i, i + 4).every(([, c]) => c >= 3)) { hasConsistentMonth = true; break; }
    }
  }

  // "El Relojero" - 10 sessions between 29-31 min
  const preciseSessionCount = sessions.filter(s =>
    s.durationSec >= 29 * 60 && s.durationSec <= 31 * 60
  ).length;

  // Health-specific stats
  const healthDailySteps = Object.values(healthDaily).map(d => d.steps || 0);
  const healthDays10k = healthDailySteps.filter(s => s >= 10000).length;
  const healthStepStreak30 = computeHealthStepStreak(healthDaily, 8000) >= 30;

  // Full year health (365 days in same calendar year)
  let hasFullYearHealth = false;
  const healthYearCounts = {};
  Object.keys(healthDaily).forEach(d => {
    const y = d.slice(0, 4);
    healthYearCounts[y] = (healthYearCounts[y] || 0) + 1;
  });
  hasFullYearHealth = Object.values(healthYearCounts).some(c => c >= 365);

  return {
    totalKm, totalSteps, totalSessions, currentStreak, bestSessionKm, bestDayKm,
    fastestPace, fastPaceSessionKm, hasTortugaAchievement,
    sessionDates, earlyMorningSessions, noonSessions, goldenHourSessions,
    nightSessions, deepNightSessions, dawnSessions,
    hasSameHourStreak, hasFullMonthMondays, hasFullWeek, hasConsistentMonth,
    preciseSessionCount, healthConnected, healthImportedDays,
    healthDays10k, healthStepStreak30, hasFullYearHealth
  };
}

/**
 * Check all badges against current state snapshot.
 * Returns array of newly unlocked badge IDs.
 */
export function checkBadges(state, snapshot) {
  const unlocked = state.badges || {};
  const newlyUnlocked = [];

  for (const badge of BADGES) {
    if (unlocked[badge.id]) continue;
    try {
      if (badge.check(snapshot)) {
        newlyUnlocked.push(badge.id);
      }
    } catch (_) {}
  }

  return newlyUnlocked;
}

// ─── Helpers ───

function getAllMondaysInMonth(year, month) {
  const mondays = [];
  const d = new Date(year, month, 1);
  while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
  while (d.getMonth() === month) {
    mondays.push(d.getDate());
    d.setDate(d.getDate() + 7);
  }
  return mondays;
}

function getISOWeek(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return `${date.getFullYear()}-${String(1 + Math.round(((date - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)).padStart(2, '0')}`;
}

function computeHealthStepStreak(dailyData, minSteps) {
  const dates = Object.keys(dailyData).sort().reverse();
  let streak = 0;
  let prev = null;
  for (const d of dates) {
    if ((dailyData[d].steps || 0) < minSteps) break;
    if (prev !== null) {
      const diff = (new Date(prev) - new Date(d)) / 86400000;
      if (diff !== 1) break;
    }
    streak++;
    prev = d;
  }
  return streak;
}
