// Datos calculados a partir del estado: "Estoy listo", puntos débiles, vencidas...
import { useMemo } from 'react'
import { useJuego } from './useJuego'
import { todasLasPreguntas } from '../content/banco'
import { calcularListo } from '../learning/estoyListo'
import { preguntasConFallos, puntosDebiles } from '../learning/errores'
import { estaVencida } from '../learning/sm2'

export function useListo() {
  const estados = useJuego((s) => s.estados)
  const simulacros = useJuego((s) => s.simulacros)
  return useMemo(() => calcularListo(todasLasPreguntas(), estados, simulacros, Date.now()), [estados, simulacros])
}

export function useDebiles() {
  const estados = useJuego((s) => s.estados)
  return useMemo(() => puntosDebiles(estados, Date.now()), [estados])
}

export function useVencidas() {
  const estados = useJuego((s) => s.estados)
  return useMemo(() => {
    const ahora = Date.now()
    return Object.values(estados).filter((e) => estaVencida(e, ahora)).sort((a, b) => a.proxima - b.proxima).map((e) => e.id)
  }, [estados])
}

export function useConFallos() {
  const estados = useJuego((s) => s.estados)
  return useMemo(() => preguntasConFallos(estados), [estados])
}

/** "Estoy listo" en porcentaje entero, para mostrar. */
export const pct = (x: number) => Math.round(x * 100)
