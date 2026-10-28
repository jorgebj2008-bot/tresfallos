// Guardado local en IndexedDB (Dexie). Si el navegador no deja usar IndexedDB
// (modo privado, vista previa...), el juego sigue funcionando sin guardar.
import Dexie, { type Table } from 'dexie'
import type { EstadoPregunta } from '../learning/sm2'
import type { Simulacro } from '../learning/estoyListo'

export interface Perfil {
  id: 'yo'
  xp: number
  sonido: boolean
  tema: 'auto' | 'claro' | 'noche'
}

export interface ResultadoNivel {
  /** Clave "mundo-nivel", por ejemplo "conductor-3". */
  clave: string
  estrellas: number
  mejorAciertos: number
  jugadas: number
}

/** Historial de respuestas (para analítica y para recalcular si cambia el algoritmo). */
export interface Respuesta {
  id?: number
  preguntaId: string
  correcta: boolean
  errorTipo: string | null
  ms: number
  fecha: number
}

class BaseDatos extends Dexie {
  declare perfil: Table<Perfil, string>
  declare niveles: Table<ResultadoNivel, string>
  declare respuestas: Table<Respuesta, number>
  declare estados: Table<EstadoPregunta, string>
  declare simulacros: Table<Simulacro, number>
  constructor() {
    super('tresfallos')
    this.version(1).stores({
      perfil: 'id',
      niveles: 'clave',
      respuestas: '++id, preguntaId, fecha',
    })
    // Fase 2: estado de repetición espaciada por pregunta y simulacros.
    this.version(2).stores({
      estados: 'id, proxima',
      simulacros: '++id, fecha',
    })
  }
}

let db: BaseDatos | null = null
try {
  db = new BaseDatos()
} catch {
  db = null
}

/** Ejecuta una operación de guardado; si falla, avisa por consola y sigue. */
export async function seguro<T>(op: (db: BaseDatos) => Promise<T>): Promise<T | undefined> {
  if (!db) return undefined
  try {
    return await op(db)
  } catch (e) {
    console.warn('Guardado local no disponible:', e)
    return undefined
  }
}
