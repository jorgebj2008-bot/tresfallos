// Repetición espaciada: SM-2 simplificado (ver GDD 5.1).
// Cada pregunta guarda cuándo debe volver a salir. Las que fallas vuelven
// enseguida; las que dominas, cada vez más tarde.

export const DIA = 24 * 60 * 60 * 1000

export interface EstadoPregunta {
  id: string
  /** Factor de facilidad (1.3 a 2.8). Sube con aciertos rápidos, baja con fallos. */
  facilidad: number
  /** Días hasta la próxima revisión. 0 = vuelve en esta misma sesión. */
  intervalo: number
  /** Aciertos seguidos desde el último fallo. */
  repeticiones: number
  /** Momento (ms) en que vuelve a tocar. */
  proxima: number
  vistas: number
  aciertos: number
  fallos: number
  ultima: number
  /** Tipo del último error cometido en esta pregunta (para el cuaderno). */
  ultimoError: string | null
}

export const nuevoEstado = (id: string): EstadoPregunta => ({
  id, facilidad: 2.5, intervalo: 0, repeticiones: 0, proxima: 0, vistas: 0, aciertos: 0, fallos: 0, ultima: 0, ultimoError: null,
})

/** Una respuesta es "lenta" si tarda más de este tiempo: se considera que dudó. */
export const MS_LENTO = 20_000

export function actualizar(e: EstadoPregunta, correcta: boolean, ms: number, ahora: number, errorTipo: string | null = null): EstadoPregunta {
  const s = { ...e, vistas: e.vistas + 1, ultima: ahora }
  if (!correcta) {
    s.fallos++
    s.repeticiones = 0
    s.intervalo = 0
    s.facilidad = Math.max(1.3, e.facilidad - 0.2)
    s.proxima = ahora // vuelve ya
    s.ultimoError = errorTipo
    return s
  }
  s.aciertos++
  s.repeticiones = e.repeticiones + 1
  const lenta = ms > MS_LENTO
  if (s.repeticiones === 1) s.intervalo = lenta ? 0.5 : 1
  else if (s.repeticiones === 2) s.intervalo = lenta ? 2 : 3
  else s.intervalo = Math.round(e.intervalo * (lenta ? 1.2 : e.facilidad) * 10) / 10
  s.facilidad = Math.min(2.8, Math.max(1.3, e.facilidad + (lenta ? -0.05 : 0.1)))
  s.proxima = ahora + s.intervalo * DIA
  return s
}

export const estaVencida = (e: EstadoPregunta, ahora: number) => e.vistas > 0 && e.proxima <= ahora

/**
 * Probabilidad estimada de acertar esta pregunta hoy (0-1).
 * Sin ver: 1/3, que es acertar al azar con 3 opciones (lo honesto).
 * Con fallo reciente: baja. Con varios aciertos espaciados: alta.
 * Si se pasa la fecha de repaso, se va olvidando poco a poco.
 */
export function probabilidadAcierto(e: EstadoPregunta | undefined, ahora: number): number {
  if (!e || e.vistas === 0) return 1 / 3
  const base = [0.4, 0.7, 0.82, 0.9, 0.95][Math.min(e.repeticiones, 4)]
  if (e.repeticiones === 0) return base
  const retraso = (ahora - e.proxima) / DIA
  if (retraso <= 0) return base
  const olvido = Math.pow(0.5, retraso / Math.max(e.intervalo, 1))
  return 1 / 3 + (base - 1 / 3) * Math.max(olvido, 0.3)
}
