// Estado global del juego (Zustand) sincronizado con el guardado local.
import { create } from 'zustand'
import { seguro, type Perfil, type ResultadoNivel } from './db'
import { setSonido } from '../audio/sfx'

const PERFIL_INICIAL: Perfil = { id: 'yo', xp: 0, sonido: true, tema: 'auto' }

interface EstadoJuego {
  cargado: boolean
  perfil: Perfil
  niveles: Record<string, ResultadoNivel>
  cargar: () => Promise<void>
  sumarXp: (xp: number) => void
  registrarRespuesta: (preguntaId: string, correcta: boolean, errorTipo: string | null, ms: number) => void
  guardarNivel: (clave: string, estrellas: number, aciertos: number) => void
  alternarSonido: () => void
  cambiarTema: () => void
}

const guardarPerfil = (p: Perfil) => void seguro((db) => db.perfil.put(p))

export const useJuego = create<EstadoJuego>((set, get) => ({
  cargado: false,
  perfil: PERFIL_INICIAL,
  niveles: {},

  async cargar() {
    const perfil = (await seguro((db) => db.perfil.get('yo'))) ?? PERFIL_INICIAL
    const lista = (await seguro((db) => db.niveles.toArray())) ?? []
    setSonido(perfil.sonido)
    set({ cargado: true, perfil, niveles: Object.fromEntries(lista.map((n) => [n.clave, n])) })
  },

  sumarXp(xp) {
    const perfil = { ...get().perfil, xp: get().perfil.xp + xp }
    set({ perfil })
    guardarPerfil(perfil)
  },

  registrarRespuesta(preguntaId, correcta, errorTipo, ms) {
    void seguro((db) => db.respuestas.add({ preguntaId, correcta, errorTipo, ms, fecha: Date.now() }))
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
