import { describe, expect, it } from 'vitest'
import { Trazo, distanciaA, longitudes, puntoEn, repartir } from './ruta'

describe('Trazo', () => {
  it('una recta mide lo que debe', () => {
    const t = new Trazo(0, 100).linea(0, 0)
    const cum = longitudes(t.pts)
    expect(cum[cum.length - 1]).toBeCloseTo(100)
  })

  it('una rotonda gira en sentido antihorario (ángulo decreciente)', () => {
    // Entra por abajo (90°) y sale por arriba a la derecha (-45°): pasa por la derecha.
    const t = new Trazo(0, 50).arco(0, 0, 50, -45)
    const pasaPorDerecha = t.pts.some((p) => p.x > 49)
    expect(pasaPorDerecha).toBe(true)
    expect(t.fin.x).toBeCloseTo(50 * Math.cos(-Math.PI / 4))
  })

  it('la espiral cambia de radio', () => {
    const t = new Trazo(0, 100).arco(0, 0, 100, -270, 50)
    expect(Math.hypot(t.fin.x, t.fin.y)).toBeCloseTo(50)
  })

  it('las esquinas acaban en el último punto', () => {
    const t = new Trazo(0, 200).esquinas([[0, 100], [100, 100], [100, 0]])
    expect(t.fin).toEqual({ x: 100, y: 0 })
  })
})

describe('repartir', () => {
  it('coloca los puntos a la misma distancia', () => {
    const t = new Trazo(0, 1000).linea(0, 0)
    const ps = repartir(t.pts, 5, 100, 100)
    expect(ps.map((p) => Math.round(p.y))).toEqual([900, 700, 500, 300, 100])
  })
  it('da la dirección de la carretera', () => {
    const t = new Trazo(0, 0).linea(100, 0)
    const p = puntoEn(t.pts, longitudes(t.pts), 50)
    expect(p.ang).toBeCloseTo(0)
  })
})

describe('distanciaA', () => {
  it('mide la distancia a la carretera', () => {
    const t = new Trazo(0, 100).linea(0, 0)
    expect(distanciaA(t.pts, { x: 30, y: 50 })).toBeCloseTo(30, 0)
  })
})
