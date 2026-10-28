// Guardado local en IndexedDB (Dexie). Si el navegador no deja usar IndexedDB
// (modo privado, vista previa...), el juego sigue funcionando sin guardar.
import Dexie, { type Table } from 'dexie'

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

/** Historial de respuestas: lo usará el motor de aprendizaje en la Fase 2. */
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
  constructor() {
    super('tresfallos')
    this.version(1).stores({
      perfil: 'id',
      niveles: 'clave',
      respuestas: '++id, preguntaId, fecha',
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
