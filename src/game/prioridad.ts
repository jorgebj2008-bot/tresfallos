// Motor de reglas de prioridad para "Rey del Cruce". Sin gráficos: se testea solo.
//
// Cruce de 4 brazos: 0 = norte, 1 = este, 2 = sur, 3 = oeste (circulación por la derecha).
// Para cada pareja de usuarios cuyas trayectorias se cruzan, se decide quién pasa antes
// aplicando las normas en orden de jerarquía:
//   1. Agente (RGC art. 133: sus órdenes prevalecen sobre todo)
//   2. Vehículo prioritario en servicio de urgencia (RGC arts. 67 y 69)
//   3. Semáforo (RGC art. 146)
//   4. Señales de STOP / ceda el paso (RGC art. 56)
//   5. Sin señales, prioridad a la derecha (RGC art. 57.1)
//   6. Quien gira a la izquierda cede a quien viene de frente
//   + Peatones cruzando por un paso de peatones (RGC art. 65)
// Si una pareja no se puede decidir sin ambigüedad, el escenario se descarta.

import type { Rng } from './nivel'

export type Brazo = 0 | 1 | 2 | 3
export type Movimiento = 'recto' | 'derecha' | 'izquierda'
export type Control = 'ninguna' | 'stop' | 'ceda' | 'verde' | 'rojo'
export type TipoVehiculo = 'coche' | 'moto' | 'bici' | 'ambulancia'
export type TipoEscenario = 'sin-senales' | 'senales' | 'semaforo' | 'agente' | 'urgencia' | 'peaton'
export type Regla = 'agente' | 'urgencia' | 'semaforo' | 'senal' | 'derecha' | 'izquierda' | 'peaton'

export interface Vehiculo {
  id: string
  tipo: TipoVehiculo
  brazo: Brazo
  mov: Movimiento
  color: string
  nombreColor: string
}
export interface Peaton {
  id: string
  /** Brazo cuyo paso de peatones está cruzando. */
  brazo: Brazo
}
export interface Escenario {
  tipo: TipoEscenario
  controles: Control[]
  /** Brazos a los que el agente da paso (solo en escenarios con agente). */
  agente?: Brazo[]
  vehiculos: Vehiculo[]
  peatones: Peaton[]
}
export interface Arista {
  antes: string
  despues: string
  regla: Regla
  texto: string
  fuente: string
}
export interface Solucion {
  aristas: Arista[]
}

export const NOMBRE_BRAZO = ['norte', 'este', 'sur', 'oeste']
export const salida = (b: Brazo, mov: Movimiento): Brazo => ((mov === 'recto' ? b + 2 : mov === 'derecha' ? b + 3 : b + 1) % 4) as Brazo
/** Brazo desde el que llega quien está a la derecha de quien entra por b. */
export const derechaDe = (b: Brazo): Brazo => ((b + 3) % 4) as Brazo
export const opuestos = (a: Brazo, b: Brazo) => (a + 2) % 4 === b

// ---------- Geometría ----------

type P = { x: number; y: number }

/** Trayectoria dentro del cruce (cuadrado [-1, 1], y hacia arriba = norte). */
export function trayectoria(b: Brazo, mov: Movimiento, n = 24): P[] {
  const base: P[] = []
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * (Math.PI / 2)
    if (mov === 'recto') base.push({ x: 0.5, y: -1 + (2 * i) / n })
    else if (mov === 'derecha') base.push({ x: 1 - 0.5 * Math.cos(t), y: -1 + 0.5 * Math.sin(t) })
    else base.push({ x: -1 + 1.5 * Math.cos(t), y: -1 + 1.5 * Math.sin(t) })
  }
  // La base es la del brazo sur; se gira en sentido antihorario para el resto.
  const giros = (2 - b + 4) % 4
  return base.map((p) => {
    let { x, y } = p
    for (let k = 0; k < giros; k++) [x, y] = [-y, x]
    return { x, y }
  })
}

export function conflictoVehiculos(a: Vehiculo, b: Vehiculo): boolean {
  if (a.brazo === b.brazo) return false
  const ta = trayectoria(a.brazo, a.mov), tb = trayectoria(b.brazo, b.mov)
  for (const p of ta) for (const q of tb) if (Math.hypot(p.x - q.x, p.y - q.y) < 0.3) return true
  return false
}

const conflictoPeaton = (v: Vehiculo, p: Peaton) => v.brazo === p.brazo || salida(v.brazo, v.mov) === p.brazo

// ---------- Reglas ----------

export const nombreVehiculo = (v: Vehiculo) =>
  v.tipo === 'ambulancia' ? 'la ambulancia' : v.tipo === 'moto' ? `la moto ${v.nombreColor}` : v.tipo === 'bici' ? `la bici ${v.nombreColor}` : `el coche ${v.nombreColor}`
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)
const tieneSenal = (c: Control) => c === 'stop' || c === 'ceda'

type Decision = { gana: string; pierde: string; regla: Regla; texto: string; fuente: string } | null | 'ambiguo'

export function decidir(esc: Escenario, a: Vehiculo, b: Vehiculo): Decision {
  if (!conflictoVehiculos(a, b)) return null
  const gana = (g: Vehiculo, regla: Regla, texto: string, fuente: string): Decision => ({ gana: g.id, pierde: (g === a ? b : a).id, regla, texto, fuente })

  if (esc.agente) {
    const ga = esc.agente.includes(a.brazo), gb = esc.agente.includes(b.brazo)
    if (ga !== gb) {
      const g = ga ? a : b
      return gana(g, 'agente', `El agente da paso a ${nombreVehiculo(g)}. Las órdenes del agente están por encima de semáforos y señales.`, 'RGC art. 133')
    }
  }
  const ua = a.tipo === 'ambulancia', ub = b.tipo === 'ambulancia'
  if (ua !== ub) {
    const g = ua ? a : b
    return gana(g, 'urgencia', 'La ambulancia va en servicio de urgencia, con luces y sirena: hay que dejarle paso.', 'RGC arts. 67 y 69')
  }
  const ca = esc.controles[a.brazo], cb = esc.controles[b.brazo]
  if (!esc.agente && (ca === 'verde' || ca === 'rojo') && ca !== cb) {
    const g = ca === 'verde' ? a : b
    const p = g === a ? b : a
    return gana(g, 'semaforo', `${cap(nombreVehiculo(p))} tiene el semáforo en rojo y debe esperar.`, 'RGC art. 146')
  }
  if (tieneSenal(ca) !== tieneSenal(cb)) {
    const g = tieneSenal(ca) ? b : a
    const p = g === a ? b : a
    const senal = esc.controles[p.brazo] === 'stop' ? 'un STOP' : 'un ceda el paso'
    return gana(g, 'senal', `${cap(nombreVehiculo(p))} tiene ${senal}: cede el paso a quien circula por la vía con prioridad.`, 'RGC art. 56')
  }
  // Mismo nivel: brazos perpendiculares → prioridad a la derecha.
  if (!opuestos(a.brazo, b.brazo)) {
    if (tieneSenal(ca) || tieneSenal(cb)) return 'ambiguo' // dos señales perpendiculares: no se genera
    const g = derechaDe(a.brazo) === b.brazo ? b : a
    const p = g === a ? b : a
    return gana(g, 'derecha', `${cap(nombreVehiculo(g))} llega por la derecha de ${nombreVehiculo(p)}. Sin otra norma que lo decida, prioridad a la derecha.`, 'RGC art. 57.1')
  }
  // Brazos opuestos: quien gira a la izquierda cede a quien viene de frente.
  if ((a.mov === 'izquierda') !== (b.mov === 'izquierda')) {
    const g = a.mov === 'izquierda' ? b : a
    const p = g === a ? b : a
    return gana(g, 'izquierda', `${cap(nombreVehiculo(p))} gira a la izquierda y debe ceder el paso a ${nombreVehiculo(g)}, que viene de frente.`, 'RGC, normas de intersección')
  }
  return 'ambiguo'
}

/** Aristas "quién antes que quién". null si el escenario es ambiguo o tiene un ciclo. */
export function resolver(esc: Escenario): Solucion | null {
  const aristas: Arista[] = []
  const vs = esc.vehiculos
  for (let i = 0; i < vs.length; i++)
    for (let j = i + 1; j < vs.length; j++) {
      const d = decidir(esc, vs[i], vs[j])
      if (d === 'ambiguo') return null
      if (d) aristas.push({ antes: d.gana, despues: d.pierde, regla: d.regla, texto: d.texto, fuente: d.fuente })
    }
  for (const p of esc.peatones)
    for (const v of vs)
      if (conflictoPeaton(v, p))
        aristas.push({
          antes: p.id, despues: v.id, regla: 'peaton', fuente: 'RGC art. 65',
          texto: `El peatón está cruzando por el paso de peatones: ${nombreVehiculo(v)} debe dejarle pasar.`,
        })
  // Comprobación de ciclos (orden topológico).
  const ids = [...vs.map((v) => v.id), ...esc.peatones.map((p) => p.id)]
  const hechos = new Set<string>()
  while (hechos.size < ids.length) {
    const libre = ids.find((id) => !hechos.has(id) && puedePasar(id, hechos, aristas))
    if (!libre) return null
    hechos.add(libre)
  }
  return { aristas }
}

export const puedePasar = (id: string, hechos: Set<string>, aristas: Arista[]) => aristas.every((a) => a.despues !== id || hechos.has(a.antes))

/** Por qué no podía pasar todavía: la primera norma incumplida. */
export const motivoEspera = (id: string, hechos: Set<string>, aristas: Arista[]) => aristas.find((a) => a.despues === id && !hechos.has(a.antes))

/** Profundidad del orden (cuántas "tandas" hacen falta). Más tandas = más interesante. */
function profundidad(ids: string[], aristas: Arista[]) {
  const hechos = new Set<string>()
  let tandas = 0
  while (hechos.size < ids.length) {
    const tanda = ids.filter((id) => !hechos.has(id) && puedePasar(id, hechos, aristas))
    if (!tanda.length) return Infinity
    tanda.forEach((id) => hechos.add(id))
    tandas++
  }
  return tandas
}

// ---------- Generador procedural ----------

const COLORES: [string, string][] = [['#FF5A5F', 'rojo'], ['#3DA5FF', 'azul'], ['#FFD23F', 'amarillo'], ['#22C55E', 'verde'], ['#A855F7', 'morado']]

/** Tipos de escenario disponibles según la dificultad (1 a 5). */
export function tiposPorDificultad(d: number): TipoEscenario[] {
  if (d <= 1) return ['sin-senales', 'senales']
  if (d === 2) return ['sin-senales', 'senales', 'peaton']
  if (d === 3) return ['senales', 'urgencia', 'peaton', 'semaforo']
  return ['senales', 'sin-senales', 'urgencia', 'peaton', 'semaforo', 'agente']
}

export function generar(dificultad: number, rng: Rng = Math.random): { esc: Escenario; sol: Solucion } {
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rng() * xs.length)]
  const nVeh = dificultad <= 1 ? 2 : dificultad <= 3 ? 3 : pick([3, 4])
  for (let intento = 0; intento < 500; intento++) {
    const tipo = pick(tiposPorDificultad(dificultad))
    const brazos = ([0, 1, 2, 3] as Brazo[]).sort(() => rng() - 0.5).slice(0, nVeh)
    const colores = [...COLORES].sort(() => rng() - 0.5)
    const vehiculos: Vehiculo[] = brazos.map((b, i) => ({
      id: `v${i}`,
      tipo: dificultad >= 2 && rng() < 0.25 ? pick(['moto', 'bici'] as const) : 'coche',
      brazo: b,
      mov: pick(['recto', 'recto', 'derecha', 'izquierda'] as const),
      color: colores[i][0],
      nombreColor: colores[i][1],
    }))
    const controles: Control[] = ['ninguna', 'ninguna', 'ninguna', 'ninguna']
    let agente: Brazo[] | undefined
    const peatones: Peaton[] = []
    const ejeVertical = rng() < 0.5 // true: la vía principal / el verde es norte-sur
    const enEje = (b: number, vertical: boolean) => (vertical ? b % 2 === 0 : b % 2 === 1)

    if (tipo === 'senales') {
      const s = pick(['stop', 'ceda'] as const)
      for (let b = 0; b < 4; b++) if (!enEje(b, ejeVertical)) controles[b] = s
    } else if (tipo === 'semaforo' || tipo === 'agente') {
      for (let b = 0; b < 4; b++) controles[b] = enEje(b, ejeVertical) ? 'verde' : 'rojo'
      if (tipo === 'agente') {
        // El agente da paso al eje contrario al semáforo en verde: manda el agente.
        agente = ([0, 1, 2, 3] as Brazo[]).filter((b) => !enEje(b, ejeVertical))
      }
    } else if (tipo === 'urgencia') {
      vehiculos[0] = { ...vehiculos[0], tipo: 'ambulancia', color: '#FFFFFF', nombreColor: 'blanca' }
      if (rng() < 0.5) {
        const s = pick(['stop', 'ceda'] as const)
        for (let b = 0; b < 4; b++) if (!enEje(b, ejeVertical)) controles[b] = s
      }
    } else if (tipo === 'peaton') {
      peatones.push({ id: 'p0', brazo: pick([0, 1, 2, 3] as const) })
    }

    const esc: Escenario = { tipo, controles, agente, vehiculos, peatones }
    const sol = resolver(esc)
    if (!sol) continue
    const ids = [...vehiculos.map((v) => v.id), ...peatones.map((p) => p.id)]
    // Que haga falta pensar: al menos dos tandas y que cada usuario tenga algún conflicto.
    if (profundidad(ids, sol.aristas) < 2) continue
    if (ids.some((id) => !sol.aristas.some((a) => a.antes === id || a.despues === id))) continue
    // En peatón, el peatón debe afectar a alguien.
    if (tipo === 'peaton' && !sol.aristas.some((a) => a.regla === 'peaton')) continue
    if (tipo === 'agente' && !sol.aristas.some((a) => a.regla === 'agente')) continue
    if (tipo === 'senales' && !sol.aristas.some((a) => a.regla === 'senal')) continue
    if (tipo === 'semaforo' && !sol.aristas.some((a) => a.regla === 'semaforo')) continue
    if (tipo === 'urgencia' && !sol.aristas.some((a) => a.regla === 'urgencia')) continue
    return { esc, sol }
  }
  throw new Error('No se pudo generar un escenario válido')
}
