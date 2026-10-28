// Indicador "¿Estoy listo?" (ver GDD 5.3). Regla de oro: ante la duda, el número baja.
//
// 1. Por cada mundo, dominio = media de la probabilidad de acertar sus preguntas,
//    "encogida" hacia 1/3 (azar) cuando hay pocas preguntas vistas.
// 2. Acierto esperado en el examen = suma de dominios ponderados por el peso de cada mundo.
// 3. Probabilidad de aprobar = P(Binomial(30, p) >= 27), calculada exacta.
// 4. Con 3 o más simulacros, se mezcla al 50 % con su tasa real de acierto.
//    Sin simulacros, el indicador no pasa del 70 %: sin el jefe final no hay certeza.

import { MUNDOS } from '../content/mundos'
import type { MundoId, Pregunta } from '../content/tipos'
import { probabilidadAcierto, type EstadoPregunta } from './sm2'

export const PREGUNTAS_EXAMEN = 30
export const ACIERTOS_APROBAR = 27
const AZAR = 1 / 3
/** Cuántas preguntas "ficticias" al azar se suman a cada mundo para no fiarse de pocos datos. */
const PRIOR = 10
const TOPE_SIN_SIMULACROS = 0.7

export interface Simulacro {
  id?: number
  fecha: number
  aciertos: number
  total: number
  segundos: number
}

export interface DominioMundo {
  mundo: MundoId
  nombre: string
  peso: number
  dominio: number
  vistas: number
  total: number
}

export interface InformeListo {
  /** Probabilidad de aprobar (0-1). */
  prob: number
  /** Rango honesto [mínimo, máximo]. */
  rango: [number, number]
  /** Acierto esperado por pregunta en el examen. */
  aciertoEsperado: number
  mundos: DominioMundo[]
  /** Mundos que más subirían el indicador si los mejoras. */
  queFalta: DominioMundo[]
  simulacrosUsados: number
  topado: boolean
  /** Parte del temario dominada (0-1): sube desde la primera partida, aunque aún no aprobarías. */
  temario: number
}

/** P(X >= k) con X ~ Binomial(n, p), exacta. */
export function probAlMenos(n: number, k: number, p: number): number {
  p = Math.min(1, Math.max(0, p))
  let total = 0
  let comb = 1 // C(n, i), se va actualizando
  for (let i = 0; i <= n; i++) {
    if (i > 0) comb = (comb * (n - i + 1)) / i
    if (i >= k) total += comb * Math.pow(p, i) * Math.pow(1 - p, n - i)
  }
  return Math.min(1, Math.max(0, total))
}

export function dominioPorMundo(banco: Pregunta[], estados: Record<string, EstadoPregunta>, ahora: number): DominioMundo[] {
  return MUNDOS.map((m) => {
    const preguntas = banco.filter((p) => p.mundo === m.id)
    const vistas = preguntas.filter((p) => estados[p.id]?.vistas)
    const suma = vistas.reduce((acc, p) => acc + probabilidadAcierto(estados[p.id], ahora), 0)
    const dominio = (suma + PRIOR * AZAR) / (vistas.length + PRIOR)
    return { mundo: m.id, nombre: m.nombre, peso: m.peso, dominio, vistas: vistas.length, total: preguntas.length }
  })
}

export function calcularListo(banco: Pregunta[], estados: Record<string, EstadoPregunta>, simulacros: Simulacro[], ahora: number): InformeListo {
  const mundos = dominioPorMundo(banco, estados, ahora)
  let p = mundos.reduce((acc, m) => acc + m.peso * m.dominio, 0)

  const ultimos = [...simulacros].sort((a, b) => b.fecha - a.fecha).slice(0, 5)
  if (ultimos.length >= 3) {
    const tasa = ultimos.reduce((a, s) => a + s.aciertos, 0) / ultimos.reduce((a, s) => a + s.total, 0)
    p = 0.5 * p + 0.5 * tasa
  }

  // Margen de incertidumbre: cuanto menos has jugado, más ancho.
  const vistas = mundos.reduce((a, m) => a + m.vistas, 0) + ultimos.length * 30
  const margen = Math.min(0.08, 0.6 / Math.sqrt(vistas + 10))

  let prob = probAlMenos(PREGUNTAS_EXAMEN, ACIERTOS_APROBAR, p)
  let alto = probAlMenos(PREGUNTAS_EXAMEN, ACIERTOS_APROBAR, p + margen)
  const bajo = probAlMenos(PREGUNTAS_EXAMEN, ACIERTOS_APROBAR, p - margen)
  const topado = ultimos.length < 3 && prob > TOPE_SIN_SIMULACROS
  if (ultimos.length < 3) {
    prob = Math.min(prob, TOPE_SIN_SIMULACROS)
    alto = Math.min(alto, TOPE_SIN_SIMULACROS)
  }

  const queFalta = [...mundos].sort((a, b) => b.peso * (1 - b.dominio) - a.peso * (1 - a.dominio)).slice(0, 2)
  // Lo que sabes por encima del azar, ponderado por el peso de cada mundo en el examen.
  const temario = mundos.reduce((a, m) => a + m.peso * Math.max(0, (m.dominio - AZAR) / (1 - AZAR)), 0)
  return { prob, rango: [Math.min(bajo, prob), alto], aciertoEsperado: p, mundos, queFalta, simulacrosUsados: ultimos.length, topado, temario }
}
