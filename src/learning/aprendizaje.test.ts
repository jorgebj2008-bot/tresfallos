import { describe, expect, it } from 'vitest'
import { DIA, actualizar, estaVencida, nuevoEstado, probabilidadAcierto } from './sm2'
import { calcularListo, probAlMenos } from './estoyListo'
import { puntosDebiles } from './errores'
import { elegirPreguntas } from './seleccion'
import { preguntasDe, todasLasPreguntas } from '../content/banco'

const T0 = Date.UTC(2026, 9, 1)

describe('SM-2', () => {
  it('los aciertos alargan el intervalo: 1, 3 y luego × facilidad', () => {
    let e = nuevoEstado('x')
    e = actualizar(e, true, 3000, T0)
    expect(e.intervalo).toBe(1)
    e = actualizar(e, true, 3000, T0 + DIA)
    expect(e.intervalo).toBe(3)
    e = actualizar(e, true, 3000, T0 + 4 * DIA)
    expect(e.intervalo).toBeGreaterThan(7)
  })
  it('un fallo la hace volver ya y baja la facilidad', () => {
    let e = actualizar(nuevoEstado('x'), true, 3000, T0)
    e = actualizar(e, false, 3000, T0 + DIA, 'dato_numerico')
    expect(e.intervalo).toBe(0)
    expect(e.repeticiones).toBe(0)
    expect(e.facilidad).toBeLessThan(2.6)
    expect(estaVencida(e, T0 + DIA)).toBe(true)
    expect(e.ultimoError).toBe('dato_numerico')
  })
  it('la facilidad nunca baja de 1,3', () => {
    let e = nuevoEstado('x')
    for (let i = 0; i < 20; i++) e = actualizar(e, false, 3000, T0)
    expect(e.facilidad).toBe(1.3)
  })
  it('acertar lento cuenta menos que acertar rápido', () => {
    const base = actualizar(actualizar(nuevoEstado('x'), true, 3000, T0), true, 3000, T0 + DIA)
    const rapido = actualizar(base, true, 3000, T0 + 4 * DIA)
    const lento = actualizar(base, true, 30000, T0 + 4 * DIA)
    expect(lento.intervalo).toBeLessThan(rapido.intervalo)
  })
  it('una pregunta no vista vale lo que el azar (1/3)', () => {
    expect(probabilidadAcierto(undefined, T0)).toBeCloseTo(1 / 3)
  })
  it('se olvida si te pasas de la fecha de repaso', () => {
    let e = nuevoEstado('x')
    for (let i = 0; i < 4; i++) e = actualizar(e, true, 3000, T0 + i * DIA)
    const aTiempo = probabilidadAcierto(e, e.proxima)
    const tarde = probabilidadAcierto(e, e.proxima + 60 * DIA)
    expect(tarde).toBeLessThan(aTiempo)
    expect(tarde).toBeGreaterThan(1 / 3)
  })
})

describe('probAlMenos (binomial)', () => {
  it('casos límite', () => {
    expect(probAlMenos(30, 27, 1)).toBeCloseTo(1)
    expect(probAlMenos(30, 27, 0)).toBeCloseTo(0)
  })
  it('acertar el 90 % de media da solo ~65 % de aprobar', () => {
    expect(probAlMenos(30, 27, 0.9)).toBeCloseTo(0.647, 2)
  })
})

describe('Estoy listo', () => {
  const banco = todasLasPreguntas()
  it('sin jugar, la probabilidad y el temario son casi 0', () => {
    const r = calcularListo(banco, {}, [], T0)
    expect(r.prob).toBeLessThan(0.001)
    expect(r.temario).toBeCloseTo(0)
  })
  it('sin simulacros nunca pasa del 70 %', () => {
    const estados = Object.fromEntries(banco.map((p) => {
      let e = nuevoEstado(p.id)
      for (let i = 0; i < 5; i++) e = actualizar(e, true, 2000, T0 + i * DIA)
      return [p.id, e]
    }))
    const r = calcularListo(banco, estados, [], T0 + 5 * DIA)
    expect(r.prob).toBeLessThanOrEqual(0.7)
  })
  it('con buenos simulacros y dominio alto puede pasar del 70 %', () => {
    // Banco ficticio: todas las preguntas de todos los mundos dominadas.
    const ficticio = banco.flatMap((p) => ['conductor', 'via', 'senales', 'velocidad', 'prioridad', 'maniobras', 'alumbrado', 'autopistas', 'alcohol', 'seguridad', 'accidentes', 'eficiente', 'sanciones']
      .flatMap((m) => Array.from({ length: 4 }, (_, k) => ({ ...p, id: `${m}-${p.id}-${k}`, mundo: m as typeof p.mundo }))))
    const estados = Object.fromEntries(ficticio.map((p) => {
      let e = nuevoEstado(p.id)
      for (let i = 0; i < 5; i++) e = actualizar(e, true, 2000, T0 + i * DIA)
      return [p.id, e]
    }))
    const sims = [29, 30, 29, 30].map((a, i) => ({ fecha: T0 + i, aciertos: a, total: 30, segundos: 900 }))
    const r = calcularListo(ficticio, estados, sims, T0 + 5 * DIA)
    expect(r.prob).toBeGreaterThan(0.7)
    expect(r.rango[0]).toBeLessThanOrEqual(r.prob)
  })
})

describe('puntos débiles', () => {
  it('ordena por los errores más repetidos y recientes', () => {
    const estados = {
      a: actualizar(nuevoEstado('a'), false, 1000, T0, 'trampa_siempre_nunca'),
      b: actualizar(nuevoEstado('b'), false, 1000, T0, 'trampa_siempre_nunca'),
      c: actualizar(nuevoEstado('c'), false, 1000, T0 - 60 * DIA, 'dato_numerico'),
    }
    const d = puntosDebiles(estados, T0)
    expect(d[0].tipo).toBe('trampa_siempre_nunca')
    expect(d[0].preguntas).toHaveLength(2)
    expect(d[0].nombre).toMatch(/siempre/)
  })
})

describe('selección de preguntas', () => {
  const pool = preguntasDe('conductor')
  it('las vencidas salen primero', () => {
    const estados = { [pool[0].id]: actualizar(nuevoEstado(pool[0].id), false, 1000, T0) }
    for (let i = 0; i < 10; i++) {
      const sel = elegirPreguntas(pool, estados, 5, T0 + 1000)
      expect(sel.map((p) => p.id)).toContain(pool[0].id)
    }
  })
  it('no repite preguntas', () => {
    const sel = elegirPreguntas(pool, {}, 10, T0)
    expect(new Set(sel.map((p) => p.id)).size).toBe(10)
  })
})
