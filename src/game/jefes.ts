// Jefes de mundo: un examinador con 12 preguntas difíciles.
// Ganas al acertar 9 (le quitas toda la vida). Pierdes al cuarto fallo:
// como en el examen real, solo puedes permitirte tres.
import type { MundoId, Pregunta } from '../content/tipos'
import { MUNDOS } from '../content/mundos'
import { barajar, type Rng } from './nivel'

export const GOLPES_JEFE = 9
export const FALLOS_PERMITIDOS = 3
export const PREGUNTAS_JEFE = GOLPES_JEFE + FALLOS_PERMITIDOS

/** Lo más difícil del mundo (validado primero) y, si no llega, lo más difícil de mundos anteriores. */
export function preguntasJefe(mundo: MundoId, banco: Pregunta[], rng: Rng = Math.random): Pregunta[] {
  const orden = (a: Pregunta, b: Pregunta) => Number(a.revisar) - Number(b.revisar) || b.dificultad - a.dificultad
  const propias = barajar(banco.filter((p) => p.mundo === mundo), rng).sort(orden)
  const idx = MUNDOS.findIndex((m) => m.id === mundo)
  const anteriores = new Set(MUNDOS.slice(0, idx).map((m) => m.id))
  const otras = barajar(banco.filter((p) => anteriores.has(p.mundo) || (idx === 0 && p.mundo !== mundo)), rng).sort(orden)
  return barajar([...propias, ...otras].slice(0, PREGUNTAS_JEFE), rng)
}

export const estrellasJefe = (victoria: boolean, fallos: number): 0 | 1 | 2 | 3 => (victoria ? (Math.max(1, 3 - fallos) as 1 | 2 | 3) : 0)

const GOLPE = ['«¡Ay! Esa te la sabías.»', '«Vaya, vaya… Has estudiado.»', '«No te emociones todavía.»', '«Hmm. Correcto. Siguiente.»', '«¿Quién te ha chivado eso?»']
const DANO = ['«¡Ja! Trampa clásica.»', '«Así no se aprueba, ¿eh?»', '«Lee la pregunta dos veces.»', '«Te queda poco margen…»']
export const fraseJefe = (tipo: 'golpe' | 'dano') => {
  const l = tipo === 'golpe' ? GOLPE : DANO
  return l[Math.floor(Math.random() * l.length)]
}
