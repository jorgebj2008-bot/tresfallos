// Estado global del juego (Zustand) sincronizado con el guardado local.
import { create } from 'zustand'
import { seguro, type Perfil, type ResultadoNivel } from './db'
import { setSonido } from '../audio/sfx'
import { actualizar, nuevoEstado, type EstadoPregunta } from '../learning/sm2'
import type { Simulacro } from '../learning/estoyListo'

const PERFIL_INICIAL: Perfil = { id: 'yo', xp: 0, sonido: true, tema: 'auto' }

interface EstadoJuego {
  cargado: boolean
  perfil: Perfil
  niveles: Record<string, ResultadoNivel>
  /** Estado de repetición espaciada de cada pregunta vista. */
  estados: Record<string, EstadoPregunta>
  simulacros: Simulacro[]
  cargar: () => Promise<void>
  sumarXp: (xp: number) => void
  registrarRespuesta: (preguntaId: string, correcta: boolean, errorTipo: string | null, ms: number) => void
  guardarNivel: (clave: string, estrellas: number, aciertos: number) => void
  guardarSimulacro: (s: Simulacro) => void
  guardarRecord: (juego: string, puntos: number) => void
  alternarSonido: () => void
  cambiarTema: () => void
}

const guardarPerfil = (p: Perfil) => void seguro((db) => db.perfil.put(p))

export const useJuego = create<EstadoJuego>((set, get) => ({
  cargado: false,
  perfil: PERFIL_INICIAL,
  niveles: {},
  estados: {},
  simulacros: [],

  async cargar() {
    const perfil = { ...PERFIL_INICIAL, ...((await seguro((db) => db.perfil.get('yo'))) ?? {}) }
    const niveles = (await seguro((db) => db.niveles.toArray())) ?? []
    const estados = (await seguro((db) => db.estados.toArray())) ?? []
    const simulacros = (await seguro((db) => db.simulacros.toArray())) ?? []
    setSonido(perfil.sonido)
    set({
      cargado: true,
      perfil,
      niveles: Object.fromEntries(niveles.map((n) => [n.clave, n])),
      estados: Object.fromEntries(estados.map((e) => [e.id, e])),
      simulacros,
    })
  },

  sumarXp(xp) {
    const perfil = { ...get().perfil, xp: get().perfil.xp + xp }
    set({ perfil })
    guardarPerfil(perfil)
  },

  registrarRespuesta(preguntaId, correcta, errorTipo, ms) {
    const ahora = Date.now()
    const previo = get().estados[preguntaId] ?? nuevoEstado(preguntaId)
    const estado = actualizar(previo, correcta, ms, ahora, errorTipo)
    set({ estados: { ...get().estados, [preguntaId]: estado } })
    void seguro((db) => db.estados.put(estado))
    void seguro((db) => db.respuestas.add({ preguntaId, correcta, errorTipo, ms, fecha: ahora }))
  },

  guardarNivel(clave, estrellas, aciertos) {
    const previo = get().niveles[clave]
    const nuevo: ResultadoNivel = {
      clave,
      estrellas: Math.max(previo?.estrellas ?? 0, estrellas),
      mejorAciertos: Math.max(previo?.mejorAciertos ?? 0, aciertos),
      jugadas: (previo?.jugadas ?? 0) + 1,
    }
    set({ niveles: { ...get().niveles, [clave]: nuevo } })
    void seguro((db) => db.niveles.put(nuevo))
  },

  guardarSimulacro(s) {
    set({ simulacros: [...get().simulacros, s] })
    void seguro((db) => db.simulacros.add(s))
  },

  guardarRecord(juego, puntos) {
    const records = get().perfil.records ?? {}
    if ((records[juego] ?? 0) >= puntos) return
    const perfil = { ...get().perfil, records: { ...records, [juego]: puntos } }
    set({ perfil })
    guardarPerfil(perfil)
  },

  alternarSonido() {
    const perfil = { ...get().perfil, sonido: !get().perfil.sonido }
    setSonido(perfil.sonido)
    set({ perfil })
    guardarPerfil(perfil)
  },

  cambiarTema() {
    const orden: Perfil['tema'][] = ['auto', 'claro', 'noche']
    const tema = orden[(orden.indexOf(get().perfil.tema) + 1) % orden.length]
    const perfil = { ...get().perfil, tema }
    set({ perfil })
    guardarPerfil(perfil)
  },
}))

export const claveNivel = (mundo: string, nivel: number) => `${mundo}-${nivel}`
