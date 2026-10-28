// XP y rangos del jugador.

export const RANGOS = [
  { nombre: 'Peatón', xp: 0 },
  { nombre: 'Patinete', xp: 100 },
  { nombre: 'Ciclista', xp: 300 },
  { nombre: 'Novel', xp: 600 },
  { nombre: 'Conductor', xp: 1000 },
  { nombre: 'Piloto', xp: 1600 },
  { nombre: 'Instructor', xp: 2400 },
  { nombre: 'Examinador', xp: 3500 },
  { nombre: 'Leyenda del Asfalto', xp: 5000 },
] as const

export interface EstadoRango {
  indice: number
  nombre: string
  siguiente: string | null
  /** XP que faltan para el siguiente rango (0 si ya es el último). */
  faltan: number
  /** Progreso dentro del rango actual, de 0 a 1. */
  progreso: number
}

export function rangoDe(xp: number): EstadoRango {
  let indice = 0
  for (let i = 0; i < RANGOS.length; i++) if (xp >= RANGOS[i].xp) indice = i
  const actual = RANGOS[indice]
  const sig = RANGOS[indice + 1]
  if (!sig) return { indice, nombre: actual.nombre, siguiente: null, faltan: 0, progreso: 1 }
  return {
    indice,
    nombre: actual.nombre,
    siguiente: sig.nombre,
    faltan: sig.xp - xp,
    progreso: (xp - actual.xp) / (sig.xp - actual.xp),
  }
}

/** XP de una respuesta: 10 por acierto, +5 si llevas un combo de 3 o más. */
export function xpRespuesta(correcta: boolean, combo: number): number {
  if (!correcta) return 0
  return 10 + (combo >= 3 ? 5 : 0)
}

/** Bonus al terminar el nivel: 20 por completarlo y 10 por estrella. */
export function xpFinNivel(estrellas: number): number {
  return 20 + estrellas * 10
}
