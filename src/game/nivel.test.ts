import { describe, expect, it } from 'vitest'
import { barajar, calcularEstrellas, crearNivel, hitoCombo } from './nivel'
import { rangoDe, xpRespuesta } from './progreso'
import { preguntasDe } from '../content/banco'

// Generador pseudoaleatorio con semilla para que los tests sean repetibles.
const rngSemilla = (s: number) => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646

describe('barajar', () => {
  it('conserva todos los elementos', () => {
    const r = barajar([1, 2, 3, 4, 5], rngSemilla(7))
    expect([...r].sort()).toEqual([1, 2, 3, 4, 5])
  })
})

describe('crearNivel', () => {
  const pool = preguntasDe('conductor')
  it('saca 10 preguntas distintas con 3 opciones y una correcta', () => {
    const nivel = crearNivel(pool, 10, rngSemilla(3))
    expect(nivel).toHaveLength(10)
    expect(new Set(nivel.map((p) => p.pregunta.id)).size).toBe(10)
    for (const p of nivel) {
      expect(p.opciones).toHaveLength(3)
      expect(p.opciones.filter((o) => o.correcta)).toHaveLength(1)
    }
  })
  it('no pide más preguntas de las que hay', () => {
    expect(crearNivel(pool.slice(0, 4), 10)).toHaveLength(4)
  })
})

describe('calcularEstrellas', () => {
  it('3 estrellas con nivel de examen y a tiempo', () => expect(calcularEstrellas(9, 10, 150)).toBe(3))
  it('2 estrellas si es lento aunque acierte', () => expect(calcularEstrellas(10, 10, 400)).toBe(2))
  it('1 estrella con la mitad', () => expect(calcularEstrellas(5, 10, 100)).toBe(1))
  it('0 estrellas por debajo de la mitad', () => expect(calcularEstrellas(4, 10, 100)).toBe(0))
})

describe('combos y XP', () => {
  it('marca hitos en 3, 5 y 10', () => {
    expect(hitoCombo(3)).toBeTruthy()
    expect(hitoCombo(4)).toBeNull()
    expect(hitoCombo(10)).toBe('¡EN LLAMAS!')
  })
  it('da bonus de combo y nada al fallar', () => {
    expect(xpRespuesta(true, 1)).toBe(10)
    expect(xpRespuesta(true, 3)).toBe(15)
    expect(xpRespuesta(false, 9)).toBe(0)
  })
})

describe('rangoDe', () => {
  it('empieza en Peatón', () => expect(rangoDe(0).nombre).toBe('Peatón'))
  it('calcula lo que falta', () => {
    const r = rangoDe(250)
    expect(r.nombre).toBe('Patinete')
    expect(r.faltan).toBe(50)
    expect(r.progreso).toBeCloseTo(0.75)
  })
  it('el último rango no tiene siguiente', () => expect(rangoDe(99999).siguiente).toBeNull())
})
