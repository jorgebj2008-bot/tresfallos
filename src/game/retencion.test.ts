import { describe, expect, it } from 'vitest'
import {
  COCHES, RACHA_INICIAL, STATS_INICIALES, abrirCofre, actualizarRacha, avanzarMisiones, diaLocal, logrosNuevos,
  misionesDelDia, rachaVisible, semanaLocal, sumarEstadisticas, type EventoPartida,
} from './retencion'
import { rngSemilla } from './ruta'

const ev = (extra: Partial<EventoPartida> = {}): EventoPartida => ({ tipo: 'nivel', aciertos: 8, total: 10, estrellas: 2, mejorCombo: 3, hora: new Date(2026, 9, 28, 18).getTime(), ...extra })

describe('racha', () => {
  it('sube un día tras otro y no cambia el mismo día', () => {
    let r = actualizarRacha(RACHA_INICIAL, '2026-10-01').racha
    expect(r.actual).toBe(1)
    expect(actualizarRacha(r, '2026-10-01').cambio).toBe('igual')
    r = actualizarRacha(r, '2026-10-02').racha
    expect(r.actual).toBe(2)
  })
  it('un protector salva un día perdido', () => {
    const r = { actual: 5, mejor: 5, ultimoDia: '2026-10-01', protectores: 1 }
    const res = actualizarRacha(r, '2026-10-03')
    expect(res.cambio).toBe('protegida')
    expect(res.racha.actual).toBe(6)
    expect(res.racha.protectores).toBe(0)
  })
  it('sin protector, se reinicia y la racha visible baja a 0', () => {
    const r = { actual: 5, mejor: 5, ultimoDia: '2026-10-01', protectores: 0 }
    expect(rachaVisible(r, '2026-10-03')).toBe(0)
    expect(actualizarRacha(r, '2026-10-03').racha.actual).toBe(1)
  })
  it('cada 7 días se gana un protector', () => {
    const r = { actual: 6, mejor: 6, ultimoDia: '2026-10-06', protectores: 0 }
    const res = actualizarRacha(r, '2026-10-07')
    expect(res.protectorGanado).toBe(true)
    expect(res.racha.protectores).toBe(1)
  })
  it('funciona entre meses', () => expect(actualizarRacha({ actual: 3, mejor: 3, ultimoDia: '2026-10-31', protectores: 0 }, '2026-11-01').racha.actual).toBe(4))
})

describe('misiones', () => {
  const ahora = new Date(2026, 9, 28, 12).getTime()
  it('cada día salen 3 misiones distintas y siempre las mismas', () => {
    const a = misionesDelDia('2026-10-28'), b = misionesDelDia('2026-10-28')
    expect(a).toHaveLength(3)
    expect(new Set(a.map((m) => m.texto)).size).toBe(3)
    expect(a.map((m) => m.id)).toEqual(b.map((m) => m.id))
  })
  it('avanzan con las partidas y se cumplen una sola vez', () => {
    let est = undefined
    let cumplidas = 0
    for (let i = 0; i < 40; i++) {
      const r = avanzarMisiones(est, ev({ aciertos: 10, total: 10, estrellas: 3, mejorCombo: 6, tipo: i % 2 ? 'repaso' : 'nivel' }), ahora)
      est = r.estado
      cumplidas += r.nuevas.length
    }
    expect(cumplidas).toBe(est!.cumplidas.length)
    expect(new Set(est!.cumplidas).size).toBe(est!.cumplidas.length)
  })
  it('al cambiar de día se olvidan las misiones de ayer', () => {
    const ayer = avanzarMisiones(undefined, ev(), ahora).estado
    const hoy = avanzarMisiones(ayer, ev(), ahora + 86400000).estado
    expect(Object.keys(hoy.progreso).every((id) => !id.includes(diaLocal(ahora)) || id.startsWith('s-'))).toBe(true)
  })
  it('la semana empieza en lunes', () => expect(semanaLocal(new Date(2026, 9, 28).getTime())).toBe('2026-10-26'))
})

describe('cofres', () => {
  it('dan monedas en su rango y nunca un coche que ya tienes', () => {
    const rng = rngSemilla(5)
    for (let i = 0; i < 200; i++) {
      const p = abrirCofre('misiones', rng, ['rayo-lima'], 0)
      expect(p.monedas).toBeGreaterThanOrEqual(40)
      expect(p.monedas).toBeLessThanOrEqual(120)
      expect(p.coche).not.toBe('rayo-lima')
    }
  })
  it('no dan protectores si ya tienes el máximo', () => {
    const rng = rngSemilla(9)
    for (let i = 0; i < 100; i++) expect(abrirCofre('jefe', rng, [], 2).protector).toBe(false)
  })
  it('el garaje tiene un coche gratis y el resto se gana', () => expect(COCHES.filter((c) => c.precio === 0)).toHaveLength(1))
})

describe('logros', () => {
  it('se desbloquean al cumplir su condición', () => {
    const stats = sumarEstadisticas(STATS_INICIALES, ev({ aciertos: 10, total: 10, estrellas: 3, mejorCombo: 10, hora: new Date(2026, 9, 28, 23, 30).getTime() }))
    const ids = logrosNuevos({ stats, rachaMejor: 1, nivelesCompletados: 1, simulacros: [], coches: 1 }, []).map((l) => l.id)
    expect(ids).toEqual(expect.arrayContaining(['primera-marcha', 'matricula', 'cero-multas', 'en-llamas', 'buho']))
    expect(ids).not.toContain('apto')
  })
})
