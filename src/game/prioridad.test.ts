import { describe, expect, it } from 'vitest'
import { conflictoVehiculos, decidir, derechaDe, generar, puedePasar, resolver, salida, type Escenario, type Vehiculo } from './prioridad'
import { rngSemilla } from './ruta'

const coche = (id: string, brazo: 0 | 1 | 2 | 3, mov: Vehiculo['mov'], tipo: Vehiculo['tipo'] = 'coche'): Vehiculo => ({ id, tipo, brazo, mov, color: '#f00', nombreColor: id })
const esc = (vehiculos: Vehiculo[], extra: Partial<Escenario> = {}): Escenario => ({
  tipo: 'sin-senales', controles: ['ninguna', 'ninguna', 'ninguna', 'ninguna'], vehiculos, peatones: [], ...extra,
})

describe('geometría', () => {
  it('salidas con circulación por la derecha', () => {
    expect(salida(2, 'recto')).toBe(0) // del sur al norte
    expect(salida(2, 'derecha')).toBe(1) // del sur al este
    expect(salida(2, 'izquierda')).toBe(3) // del sur al oeste
  })
  it('a la derecha de quien sube desde el sur está el este', () => expect(derechaDe(2)).toBe(1))
  it('dos rectos opuestos no se cruzan', () => expect(conflictoVehiculos(coche('a', 2, 'recto'), coche('b', 0, 'recto'))).toBe(false))
  it('dos rectos perpendiculares se cruzan', () => expect(conflictoVehiculos(coche('a', 2, 'recto'), coche('b', 1, 'recto'))).toBe(true))
  it('un giro a la derecha no se cruza con el recto del brazo de su izquierda... salvo si salen al mismo sitio', () => {
    expect(conflictoVehiculos(coche('a', 2, 'derecha'), coche('b', 1, 'recto'))).toBe(false)
    expect(conflictoVehiculos(coche('a', 2, 'derecha'), coche('b', 3, 'recto'))).toBe(true) // ambos salen al este
  })
  it('girar a la izquierda cruza al que viene de frente', () => expect(conflictoVehiculos(coche('a', 2, 'izquierda'), coche('b', 0, 'recto'))).toBe(true))
})

describe('normas', () => {
  it('sin señales: prioridad a la derecha', () => {
    const d = decidir(esc([]), coche('sur', 2, 'recto'), coche('este', 1, 'recto'))
    expect(d && d !== 'ambiguo' && d.gana).toBe('este')
  })
  it('el STOP cede ante la vía principal aunque venga por la derecha', () => {
    const e = esc([], { controles: ['ninguna', 'stop', 'ninguna', 'stop'] })
    const d = decidir(e, coche('sur', 2, 'recto'), coche('este', 1, 'recto'))
    expect(d && d !== 'ambiguo' && d.gana).toBe('sur')
  })
  it('quien gira a la izquierda cede al que viene de frente', () => {
    const d = decidir(esc([]), coche('sur', 2, 'izquierda'), coche('norte', 0, 'recto'))
    expect(d && d !== 'ambiguo' && d.gana).toBe('norte')
  })
  it('la ambulancia pasa antes aunque tenga STOP', () => {
    const e = esc([], { controles: ['ninguna', 'stop', 'ninguna', 'stop'] })
    const d = decidir(e, coche('sur', 2, 'recto'), coche('amb', 1, 'recto', 'ambulancia'))
    expect(d && d !== 'ambiguo' && d.gana).toBe('amb')
  })
  it('el semáforo en rojo espera', () => {
    const e = esc([], { controles: ['verde', 'rojo', 'verde', 'rojo'] })
    const d = decidir(e, coche('sur', 2, 'recto'), coche('este', 1, 'recto'))
    expect(d && d !== 'ambiguo' && d.gana).toBe('sur')
  })
  it('el agente manda más que el semáforo', () => {
    const e = esc([], { controles: ['verde', 'rojo', 'verde', 'rojo'], agente: [1, 3] })
    const d = decidir(e, coche('sur', 2, 'recto'), coche('este', 1, 'recto'))
    expect(d && d !== 'ambiguo' && d.gana).toBe('este')
  })
  it('dos giros a la izquierda enfrentados son ambiguos (no se generan)', () => {
    expect(decidir(esc([]), coche('a', 2, 'izquierda'), coche('b', 0, 'izquierda'))).toBe('ambiguo')
  })
  it('el peatón en el paso pasa antes que quien entra o sale por ese brazo', () => {
    const s = resolver(esc([coche('a', 2, 'derecha')], { peatones: [{ id: 'p', brazo: 1 }] }))!
    expect(puedePasar('a', new Set(), s.aristas)).toBe(false)
    expect(puedePasar('a', new Set(['p']), s.aristas)).toBe(true)
  })
  it('detecta el bloqueo de cuatro coches sin señales (todos tienen a alguien a la derecha)', () => {
    expect(resolver(esc([coche('n', 0, 'recto'), coche('e', 1, 'recto'), coche('s', 2, 'recto'), coche('o', 3, 'recto')]))).toBeNull()
  })
})

describe('generador', () => {
  it('genera 300 escenarios válidos y resolubles en todas las dificultades', () => {
    const rng = rngSemilla(42)
    for (let d = 1; d <= 5; d++)
      for (let i = 0; i < 60; i++) {
        const { esc: e, sol } = generar(d, rng)
        expect(resolver(e)).not.toBeNull()
        expect(sol.aristas.length).toBeGreaterThan(0)
      }
  })
})
