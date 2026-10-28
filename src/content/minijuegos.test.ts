import { describe, expect, it } from 'vitest'
import { SITUACIONES_VELOCIDAD } from './velocimetro'
import { CASOS_PUNTOS, OPCIONES_PISTA } from './puntos'

describe('datos de los minijuegos', () => {
  it('Velocímetro: ids únicos y respuestas que se pueden marcar en la aguja', () => {
    expect(new Set(SITUACIONES_VELOCIDAD.map((s) => s.id)).size).toBe(SITUACIONES_VELOCIDAD.length)
    for (const s of SITUACIONES_VELOCIDAD) {
      expect(s.respuesta % 5, s.id).toBe(0)
      expect(s.respuesta, s.id).toBeGreaterThan(0)
      expect(s.respuesta, s.id).toBeLessThanOrEqual(130)
      expect(s.explicacion && s.fuente, s.id).toBeTruthy()
      // Si hay señal del mismo tipo que lo que se pide, la señal manda.
      if (s.senal && s.senal.tipo === s.pide) expect(s.respuesta, s.id).toBe(s.senal.valor)
    }
  })

  it('Detective de Puntos: ids únicos y la respuesta está entre las opciones', () => {
    expect(new Set(CASOS_PUNTOS.map((c) => c.id)).size).toBe(CASOS_PUNTOS.length)
    for (const c of CASOS_PUNTOS) {
      expect(OPCIONES_PISTA[c.pide], c.id).toContain(c.respuesta)
      expect(c.explicacion && c.fuente, c.id).toBeTruthy()
    }
  })
})
