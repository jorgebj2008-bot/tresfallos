// Afirmaciones verdadero/falso para "¿Verdad o Trampa?" (content/afirmaciones.json).
import type { MundoId } from './tipos'
import datos from '../../content/afirmaciones.json'

export interface Afirmacion {
  id: string
  mundo: MundoId
  texto: string
  verdadera: boolean
  explicacion: string
  error_tipo: string
  fuente: string
}

export const AFIRMACIONES = datos as Afirmacion[]
export const afirmacionPorId = (id: string) => AFIRMACIONES.find((a) => a.id === id)
