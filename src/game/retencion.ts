// Retención: racha, misiones, cofres, monedas, garaje y logros. Lógica pura (se testea sola).
// Límites éticos: todo se gana jugando, nada se compra con dinero real y nada castiga
// de forma agresiva dejar de jugar (los protectores de racha se ganan jugando).

import { rngSemilla } from './ruta'
import type { JuegoId } from './juegos'

export const DIA_MS = 24 * 60 * 60 * 1000

/** Día local en formato AAAA-MM-DD. */
export function diaLocal(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const diasEntre = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / DIA_MS)

/** Semana (lunes) a la que pertenece un día. */
export function semanaLocal(ts: number): string {
  const d = new Date(ts)
  const lunes = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7))
  return diaLocal(lunes.getTime())
}

// ---------- Racha diaria ----------

export interface Racha {
  actual: number
  mejor: number
  ultimoDia: string | null
  protectores: number
}
export const RACHA_INICIAL: Racha = { actual: 0, mejor: 0, ultimoDia: null, protectores: 0 }
export const MAX_PROTECTORES = 2

export type CambioRacha = 'igual' | 'sube' | 'protegida' | 'reinicio'

/**
 * Registra que hoy se ha jugado. Si ayer no se jugó pero hay un protector, la racha
 * se salva (gastando el protector). Cada 7 días de racha se gana un protector.
 */
export function actualizarRacha(r: Racha, hoy: string): { racha: Racha; cambio: CambioRacha; protectorGanado: boolean } {
  if (r.ultimoDia === hoy) return { racha: r, cambio: 'igual', protectorGanado: false }
  const hueco = r.ultimoDia ? diasEntre(r.ultimoDia, hoy) : Infinity
  let actual: number, protectores = r.protectores, cambio: CambioRacha
  if (hueco === 1) {
    actual = r.actual + 1
    cambio = 'sube'
  } else if (hueco === 2 && protectores > 0) {
    actual = r.actual + 1
    protectores--
    cambio = 'protegida'
  } else {
    actual = 1
    cambio = 'reinicio'
  }
  const protectorGanado = actual % 7 === 0 && protectores < MAX_PROTECTORES
  if (protectorGanado) protectores++
  return { racha: { actual, mejor: Math.max(r.mejor, actual), ultimoDia: hoy, protectores }, cambio, protectorGanado }
}

/** La racha que se ve hoy: si ya se ha roto (y no hay protector que la salve), es 0. */
export function rachaVisible(r: Racha, hoy: string): number {
  if (!r.ultimoDia) return 0
  const hueco = diasEntre(r.ultimoDia, hoy)
  if (hueco <= 1) return r.actual
  if (hueco === 2 && r.protectores > 0) return r.actual
  return 0
}

// ---------- Partidas (lo que alimenta misiones y logros) ----------

export interface EventoPartida {
  tipo: 'nivel' | 'repaso' | 'juego' | 'jefe' | 'simulacro'
  juego?: JuegoId
  aciertos: number
  total: number
  estrellas: number
  mejorCombo: number
  victoria?: boolean
  hora: number
}

export const monedasPartida = (e: EventoPartida) =>
  e.aciertos * 2 + e.estrellas * 5 + (e.tipo === 'jefe' && e.victoria ? 50 : 0) + (e.tipo === 'simulacro' && e.victoria ? 40 : 0)

// ---------- Misiones ----------

export interface Mision {
  id: string
  texto: string
  objetivo: number
  monedas: number
  /** Cuánto avanza con una partida. */
  avance: (e: EventoPartida) => number
}

const MISIONES_DIA: Omit<Mision, 'id'>[] = [
  { texto: 'Acierta 20 preguntas', objetivo: 20, monedas: 30, avance: (e) => (e.tipo === 'juego' && e.juego !== 'verdad' ? 0 : e.aciertos) },
  { texto: 'Juega 3 partidas', objetivo: 3, monedas: 25, avance: () => 1 },
  { texto: 'Gana 2 partidas de Rey del Cruce', objetivo: 2, monedas: 35, avance: (e) => (e.juego === 'cruce' && e.estrellas >= 1 ? 1 : 0) },
  { texto: 'Acierta 15 señales en Señal Rush', objetivo: 15, monedas: 30, avance: (e) => (e.juego === 'senales' ? e.aciertos : 0) },
  { texto: 'Descubre 8 trampas en ¿Verdad o Trampa?', objetivo: 8, monedas: 30, avance: (e) => (e.juego === 'verdad' ? e.aciertos : 0) },
  { texto: 'Saca 3 estrellas en un nivel', objetivo: 1, monedas: 40, avance: (e) => (e.tipo === 'nivel' && e.estrellas === 3 ? 1 : 0) },
  { texto: 'Consigue un combo de 5', objetivo: 1, monedas: 30, avance: (e) => (e.mejorCombo >= 5 ? 1 : 0) },
  { texto: 'Termina un repaso de tus fallos', objetivo: 1, monedas: 30, avance: (e) => (e.tipo === 'repaso' ? 1 : 0) },
]
const MISIONES_SEMANA: Omit<Mision, 'id'>[] = [
  { texto: 'Acierta 150 preguntas esta semana', objetivo: 150, monedas: 150, avance: (e) => e.aciertos },
  { texto: 'Juega 15 partidas esta semana', objetivo: 15, monedas: 120, avance: () => 1 },
  { texto: 'Vence a un jefe', objetivo: 1, monedas: 150, avance: (e) => (e.tipo === 'jefe' && e.victoria ? 1 : 0) },
  { texto: 'Aprueba un simulacro', objetivo: 1, monedas: 200, avance: (e) => (e.tipo === 'simulacro' && e.victoria ? 1 : 0) },
]

const semillaDe = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 2147483647, 7)

function elegirMisiones(pool: Omit<Mision, 'id'>[], n: number, clave: string, prefijo: string): Mision[] {
  const rng = rngSemilla(semillaDe(clave))
  const idx = pool.map((_, i) => i).sort(() => rng() - 0.5).slice(0, n)
  return idx.map((i) => ({ ...pool[i], id: `${prefijo}-${clave}-${i}` }))
}

/** Las 3 misiones del día (las mismas para todo el día). */
export const misionesDelDia = (dia: string) => elegirMisiones(MISIONES_DIA, 3, dia, 'd')
/** Las 2 misiones de la semana. */
export const misionesDeSemana = (semana: string) => elegirMisiones(MISIONES_SEMANA, 2, semana, 's')

export interface EstadoMisiones {
  dia: string
  semana: string
  progreso: Record<string, number>
  cumplidas: string[]
}

/** Aplica una partida a las misiones. Devuelve las misiones recién cumplidas. */
export function avanzarMisiones(est: EstadoMisiones | undefined, e: EventoPartida, ahora: number): { estado: EstadoMisiones; nuevas: Mision[] } {
  const dia = diaLocal(ahora), semana = semanaLocal(ahora)
  const base: EstadoMisiones = { dia, semana, progreso: {}, cumplidas: [] }
  const s: EstadoMisiones = est ? { ...est, progreso: { ...est.progreso }, cumplidas: [...est.cumplidas] } : base
  // Al cambiar de día o de semana, se limpian las misiones viejas.
  if (s.dia !== dia || s.semana !== semana) {
    const vivas = (id: string) => id.startsWith(`d-${dia}`) || id.startsWith(`s-${semana}`)
    s.progreso = Object.fromEntries(Object.entries(s.progreso).filter(([id]) => vivas(id)))
    s.cumplidas = s.cumplidas.filter(vivas)
    s.dia = dia
    s.semana = semana
  }
  const nuevas: Mision[] = []
  for (const m of [...misionesDelDia(dia), ...misionesDeSemana(semana)]) {
    if (s.cumplidas.includes(m.id)) continue
    s.progreso[m.id] = Math.min(m.objetivo, (s.progreso[m.id] ?? 0) + m.avance(e))
    if (s.progreso[m.id] >= m.objetivo) {
      s.cumplidas.push(m.id)
      nuevas.push(m)
    }
  }
  return { estado: s, nuevas }
}

// ---------- Garaje (coches inventados, sin marcas reales) ----------

export interface CocheGaraje {
  id: string
  nombre: string
  color: string
  franja: string
  precio: number
}

export const COCHES: CocheGaraje[] = [
  { id: 'pegatino', nombre: 'Pegatino', color: '#FFD23F', franja: '#1E1B2E', precio: 0 },
  { id: 'rayo-lima', nombre: 'Rayo Lima', color: '#A3E635', franja: '#1E1B2E', precio: 150 },
  { id: 'furgo-coral', nombre: 'Furgo Coral', color: '#FF7A6B', franja: '#FFFFFF', precio: 250 },
  { id: 'clasico-menta', nombre: 'Clásico Menta', color: '#5EEAD4', franja: '#FFFFFF', precio: 400 },
  { id: 'taxi-mandarina', nombre: 'Taxi Mandarina', color: '#FB923C', franja: '#1E1B2E', precio: 600 },
  { id: 'burbuja-eco', nombre: 'Burbuja Eco', color: '#4ADE80', franja: '#3DA5FF', precio: 800 },
  { id: 'bolido-noche', nombre: 'Bólido Noche', color: '#FF3D81', franja: '#2DE2E6', precio: 1200 },
  { id: 'monstruo-morado', nombre: 'Monstruo Morado', color: '#7C5CFF', franja: '#FFD23F', precio: 2000 },
]
export const cochePorId = (id: string | undefined) => COCHES.find((c) => c.id === id) ?? COCHES[0]

// ---------- Cofres (recompensa variable, siempre ganada jugando) ----------

export type TipoCofre = 'diario' | 'misiones' | 'jefe'
export interface Premio {
  monedas: number
  protector: boolean
  coche: string | null
}

export function abrirCofre(tipo: TipoCofre, rng: () => number, cochesPoseidos: string[], protectores: number): Premio {
  const [min, max, pProtector, pCoche] = tipo === 'jefe' ? [100, 200, 0.3, 0.35] : tipo === 'misiones' ? [40, 120, 0.2, 0.12] : [15, 60, 0.1, 0.06]
  // Reparto sesgado hacia premios pequeños con alguna sorpresa grande.
  const t = Math.pow(rng(), 2)
  const monedas = Math.round(min + (max - min) * t)
  const protector = protectores < MAX_PROTECTORES && rng() < pProtector
  const libres = COCHES.filter((c) => c.precio > 0 && !cochesPoseidos.includes(c.id)).sort((a, b) => a.precio - b.precio)
  const coche = libres.length && rng() < pCoche ? libres[Math.floor(rng() * Math.min(3, libres.length))].id : null
  return { monedas, protector, coche }
}

// ---------- Logros ----------

export interface Estadisticas {
  partidas: number
  aciertos: number
  tresEstrellas: number
  perfectos: number
  mejorCombo: number
  senales: number
  crucesPerfectos: number
  jefes: string[]
  buho: boolean
  madrugador: boolean
}
export const STATS_INICIALES: Estadisticas = {
  partidas: 0, aciertos: 0, tresEstrellas: 0, perfectos: 0, mejorCombo: 0, senales: 0, crucesPerfectos: 0, jefes: [], buho: false, madrugador: false,
}

export function sumarEstadisticas(s: Estadisticas, e: EventoPartida): Estadisticas {
  const hora = new Date(e.hora).getHours()
  return {
    partidas: s.partidas + 1,
    aciertos: s.aciertos + e.aciertos,
    tresEstrellas: s.tresEstrellas + (e.tipo === 'nivel' && e.estrellas === 3 ? 1 : 0),
    perfectos: s.perfectos + (e.tipo === 'nivel' && e.aciertos === e.total && e.total >= 8 ? 1 : 0),
    mejorCombo: Math.max(s.mejorCombo, e.mejorCombo),
    senales: s.senales + (e.juego === 'senales' ? e.aciertos : 0),
    crucesPerfectos: s.crucesPerfectos + (e.juego === 'cruce' && e.aciertos === e.total ? 1 : 0),
    jefes: s.jefes,
    buho: s.buho || hora >= 23,
    madrugador: s.madrugador || hora < 8,
  }
}

export interface ContextoLogros {
  stats: Estadisticas
  rachaMejor: number
  nivelesCompletados: number
  simulacros: { aciertos: number; total: number; fecha: number }[]
  coches: number
}

export interface Logro {
  id: string
  nombre: string
  descripcion: string
  cumple: (c: ContextoLogros) => boolean
}

export const LOGROS: Logro[] = [
  { id: 'primera-marcha', nombre: 'Primera marcha', descripcion: 'Acierta tu primera pregunta.', cumple: (c) => c.stats.aciertos >= 1 },
  { id: 'matricula', nombre: 'Matrícula de honor', descripcion: 'Saca 3 estrellas en un nivel.', cumple: (c) => c.stats.tresEstrellas >= 1 },
  { id: 'cero-multas', nombre: 'Cero multas', descripcion: 'Termina un nivel sin ningún fallo.', cumple: (c) => c.stats.perfectos >= 1 },
  { id: 'en-llamas', nombre: 'En llamas', descripcion: 'Consigue un combo de 10.', cumple: (c) => c.stats.mejorCombo >= 10 },
  { id: 'km-10', nombre: 'Kilómetro 10', descripcion: 'Completa 10 niveles del mapa.', cumple: (c) => c.nivelesCompletados >= 10 },
  { id: 'guardia-urbano', nombre: 'Guardia urbano', descripcion: 'Una partida de Rey del Cruce sin un solo choque.', cumple: (c) => c.stats.crucesPerfectos >= 1 },
  { id: 'ojo-halcon', nombre: 'Ojo de halcón', descripcion: 'Acierta 50 señales en Señal Rush.', cumple: (c) => c.stats.senales >= 50 },
  { id: 'rey-rotonda', nombre: 'Rey de la rotonda', descripcion: 'Vence a La Inspectora Rotonda.', cumple: (c) => c.stats.jefes.includes('prioridad') },
  { id: 'buho', nombre: 'Búho nocturno', descripcion: 'Juega después de las 23:00.', cumple: (c) => c.stats.buho },
  { id: 'madrugador', nombre: 'Madrugador', descripcion: 'Juega antes de las 8:00.', cumple: (c) => c.stats.madrugador },
  { id: 'semana-fuego', nombre: 'Semana en llamas', descripcion: 'Mantén una racha de 7 días.', cumple: (c) => c.rachaMejor >= 7 },
  { id: 'imparable', nombre: 'Imparable', descripcion: 'Mantén una racha de 30 días.', cumple: (c) => c.rachaMejor >= 30 },
  { id: 'apto', nombre: '¡Apto!', descripcion: 'Aprueba un Simulacro Oficial.', cumple: (c) => c.simulacros.some((s) => s.aciertos >= 27) },
  {
    id: 'listo-dgt', nombre: 'Listo para la DGT', descripcion: 'Aprueba 3 simulacros seguidos con 28 o más.',
    cumple: (c) => {
      const ult = [...c.simulacros].sort((a, b) => b.fecha - a.fecha).slice(0, 3)
      return ult.length === 3 && ult.every((s) => s.aciertos >= 28)
    },
  },
  { id: 'coleccionista', nombre: 'Coleccionista', descripcion: 'Ten 4 coches en tu garaje.', cumple: (c) => c.coches >= 4 },
  { id: 'leyenda', nombre: 'Leyenda del Asfalto', descripcion: 'Vence a los 13 jefes.', cumple: (c) => c.stats.jefes.length >= 13 },
]

export const logrosNuevos = (c: ContextoLogros, tenidos: string[]) => LOGROS.filter((l) => !tenidos.includes(l.id) && l.cumple(c))
