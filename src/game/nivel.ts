// Lógica pura de un nivel de preguntas tipo test. Sin React ni sonido: se testea sola.
import type { Opcion, Pregunta } from '../content/tipos'

export type Rng = () => number

export interface PreguntaEnJuego {
  pregunta: Pregunta
  /** Opciones barajadas: así no se aprende "la correcta es la B". */
  opciones: Opcion[]
}

export const PREGUNTAS_POR_NIVEL = 10
/** Segundos por pregunta para conseguir la tercera estrella. */
export const SEGUNDOS_TRES_ESTRELLAS = 20

export function barajar<T>(lista: readonly T[], rng: Rng = Math.random): T[] {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

/** Elige preguntas al azar del mundo y baraja sus opciones. */
export function crearNivel(pool: readonly Pregunta[], n = PREGUNTAS_POR_NIVEL, rng: Rng = Math.random): PreguntaEnJuego[] {
  return barajar(pool, rng)
    .slice(0, Math.min(n, pool.length))
    .map((pregunta) => ({ pregunta, opciones: barajar(pregunta.opciones, rng) }))
}

/**
 * Estrellas de 0 a 3. El listón de 3 estrellas es el del examen real:
 * 90 % de aciertos (27 de 30) y sin pasarse de tiempo.
 */
export function calcularEstrellas(aciertos: number, total: number, segundos: number): 0 | 1 | 2 | 3 {
  if (total === 0) return 0
  const ratio = aciertos / total
  if (ratio >= 0.9 && segundos <= total * SEGUNDOS_TRES_ESTRELLAS) return 3
  if (ratio >= 0.7) return 2
  if (ratio >= 0.5) return 1
  return 0
}

/** Mensaje de combo según aciertos seguidos (null si no hay hito). */
export function hitoCombo(combo: number): string | null {
  if (combo === 3) return '¡Combo x3!'
  if (combo === 5) return '¡En racha!'
  if (combo === 10) return '¡EN LLAMAS!'
  if (combo > 5 && combo % 5 === 0) return `¡Combo x${combo}!`
  return null
}
