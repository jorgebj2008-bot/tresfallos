import { describe, expect, it } from 'vitest'
import { PREGUNTAS_SIMULACRO, elegirSimulacro, repartoPorMundo } from './simulacro'
import { todasLasPreguntas } from '../content/banco'

describe('Simulacro Oficial', () => {
  it('reparte exactamente 30 preguntas según el peso de cada mundo', () => {
    const r = repartoPorMundo(Object.fromEntries(['conductor', 'via', 'senales', 'velocidad', 'prioridad', 'maniobras', 'alumbrado', 'autopistas', 'alcohol', 'seguridad', 'accidentes', 'eficiente', 'sanciones'].map((m) => [m, 20])))
    expect(Object.values(r).reduce((a, b) => a + b, 0)).toBe(30)
    expect(r.senales).toBeGreaterThan(r.alumbrado) // señalización pesa más que alumbrado
  })
  it('elige 30 preguntas distintas y ninguna pendiente de revisar', () => {
    const s = elegirSimulacro(todasLasPreguntas())
    expect(s).toHaveLength(PREGUNTAS_SIMULACRO)
    expect(new Set(s.map((p) => p.id)).size).toBe(30)
    expect(s.every((p) => !p.revisar)).toBe(true)
  })
})
