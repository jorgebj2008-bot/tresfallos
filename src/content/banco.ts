// Carga del banco de preguntas. Cada mundo vive en content/preguntas/NN-mundo.json.
import type { MundoId, Pregunta } from './tipos'
import conductor from '../../content/preguntas/01-conductor.json'

const BANCO: Pregunta[] = [...(conductor as Pregunta[])]

export const preguntasDe = (mundo: MundoId): Pregunta[] => BANCO.filter((p) => p.mundo === mundo)

/** Un mundo es jugable si tiene preguntas suficientes para un nivel. */
export const mundoTieneContenido = (mundo: MundoId) => preguntasDe(mundo).length >= 8
