// Simulacro Oficial: 30 preguntas, 30 minutos, 27 aciertos para aprobar, sin ayudas.
// Reparto por mundos según su peso en el examen (método del mayor resto) y solo con
// preguntas contrastadas (las marcadas "revisar" no entran).
import type { Pregunta } from '../content/tipos'
import { MUNDOS } from '../content/mundos'
import { barajar, type Rng } from '../game/nivel'

export const PREGUNTAS_SIMULACRO = 30
export const MINUTOS_SIMULACRO = 30
export const APROBADO_SIMULACRO = 27

export function repartoPorMundo(disponibles: Record<string, number>, total = PREGUNTAS_SIMULACRO): Record<string, number> {
  const pesoTotal = MUNDOS.reduce((a, m) => a + (disponibles[m.id] ? m.peso : 0), 0)
  const base = MUNDOS.map((m) => {
    const ideal = disponibles[m.id] ? (m.peso / pesoTotal) * total : 0
    return { id: m.id, n: Math.min(Math.floor(ideal), disponibles[m.id] ?? 0), resto: ideal - Math.floor(ideal) }
  })
  let faltan = total - base.reduce((a, b) => a + b.n, 0)
  // Reparte lo que falta por mayor resto, sin pasarse de las preguntas disponibles.
  while (faltan > 0) {
    const cand = base.filter((b) => b.n < (disponibles[b.id] ?? 0)).sort((a, b) => b.resto - a.resto)
    if (!cand.length) break
    cand[0].n++
    cand[0].resto = -1 + cand[0].resto
    faltan--
  }
  return Object.fromEntries(base.map((b) => [b.id, b.n]))
}

export function elegirSimulacro(banco: Pregunta[], rng: Rng = Math.random): Pregunta[] {
  const validas = banco.filter((p) => !p.revisar)
  const disp: Record<string, number> = {}
  for (const p of validas) disp[p.mundo] = (disp[p.mundo] ?? 0) + 1
  const reparto = repartoPorMundo(disp)
  const elegidas = MUNDOS.flatMap((m) => barajar(validas.filter((p) => p.mundo === m.id), rng).slice(0, reparto[m.id] ?? 0))
  return barajar(elegidas, rng)
}
