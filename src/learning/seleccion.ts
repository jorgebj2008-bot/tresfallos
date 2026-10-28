// Qué preguntas salen en cada partida.
// Mezcla: ~60 % vencidas (toca repasarlas), ~25 % nuevas y ~15 % de otros mundos
// ya vistos (intercalado, para no aprender "por posición").

import type { Pregunta } from '../content/tipos'
import { barajar, type Rng } from '../game/nivel'
import { estaVencida, type EstadoPregunta } from './sm2'

export function elegirPreguntas(
  pool: Pregunta[],
  estados: Record<string, EstadoPregunta>,
  n: number,
  ahora: number,
  rng: Rng = Math.random,
  otros: Pregunta[] = [],
): Pregunta[] {
  const elegidas: Pregunta[] = []
  const usadas = new Set<string>()
  const tomar = (lista: Pregunta[], cuantas: number) => {
    for (const p of lista) {
      if (elegidas.length >= n || cuantas <= 0) break
      if (usadas.has(p.id)) continue
      usadas.add(p.id)
      elegidas.push(p)
      cuantas--
    }
  }

  // Vencidas primero, las más atrasadas antes.
  const vencidas = pool.filter((p) => estaVencida(estados[p.id] ?? ({ vistas: 0 } as EstadoPregunta), ahora))
    .sort((a, b) => estados[a.id].proxima - estados[b.id].proxima)
  const nuevas = barajar(pool.filter((p) => !estados[p.id]?.vistas), rng)
  const intercaladas = barajar(otros.filter((p) => estados[p.id]?.vistas && estaVencida(estados[p.id], ahora)), rng)

  tomar(vencidas, Math.round(n * 0.6))
  tomar(intercaladas, Math.round(n * 0.15))
  tomar(nuevas, n - elegidas.length)
  // Si faltan, se completa con el resto del mundo (las que antes tocan, primero).
  const resto = [...pool].sort((a, b) => (estados[a.id]?.proxima ?? 0) - (estados[b.id]?.proxima ?? 0))
  tomar(resto, n - elegidas.length)
  return barajar(elegidas, rng)
}
