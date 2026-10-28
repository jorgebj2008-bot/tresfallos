// Minijuegos: catálogo, en qué niveles del mapa aparecen y dificultad adaptativa.
import type { MundoId, Pregunta } from '../content/tipos'

export type JuegoId = 'cruce' | 'senales' | 'verdad'

export interface InfoJuego {
  id: JuegoId
  nombre: string
  entrena: string
  descripcion: string
  color: string
  rondas: number
}

export const JUEGOS: InfoJuego[] = [
  { id: 'cruce', nombre: 'Rey del Cruce', entrena: 'Prioridad de paso', descripcion: 'Toca los vehículos en el orden en que deben pasar.', color: '#2EC4B6', rondas: 8 },
  { id: 'senales', nombre: 'Señal Rush', entrena: 'Reconocer señales', descripcion: 'Desliza cada señal hacia su tipo o su significado antes de que pase.', color: '#FF5A5F', rondas: 20 },
  { id: 'verdad', nombre: '¿Verdad o Trampa?', entrena: 'Leer con atención', descripcion: 'Desliza: verdad a la derecha, trampa a la izquierda. Cuidado con «siempre» y «nunca».', color: '#7C5CFF', rondas: 12 },
]

export const juegoPorId = (id: JuegoId) => JUEGOS.find((j) => j.id === id)!

/** Qué niveles del mapa son minijuegos (el resto son preguntas tipo test). */
export function juegoDeNivel(mundo: MundoId, n: number): JuegoId | null {
  if (mundo === 'prioridad' && n % 3 === 0) return 'cruce'
  if (mundo === 'senales' && n % 3 === 0) return 'senales'
  if (n === 5) return 'verdad'
  return null
}

/**
 * Dificultad adaptativa de 1 a 5: sube tras 2 aciertos seguidos y baja tras un fallo.
 * Así quien va sobrado se aburre menos y quien falla mucho refuerza lo básico.
 */
export function siguienteDificultad(d: number, acierto: boolean, racha: number): number {
  if (!acierto) return Math.max(1, d - 1)
  return racha >= 2 ? Math.min(5, d + 1) : d
}

/** Multiplicador de puntos por combo: x2 desde 3, x3 desde 6, x5 desde 10. */
export const multiplicador = (combo: number) => (combo >= 10 ? 5 : combo >= 6 ? 3 : combo >= 3 ? 2 : 1)

/** Pregunta "de mentira" para listar un fallo de minijuego en la pantalla de resultados. */
export const preguntaFicticia = (id: string, mundo: MundoId, enunciado: string, correcta: string, fuente: string): Pregunta => ({
  id, mundo, subtema: 'juego', dificultad: 2, tipo: 'test', enunciado, imagen: null,
  opciones: [{ texto: correcta, correcta: true, explicacion: '' }], error_tipo: [], fuente, revisar: false,
})
