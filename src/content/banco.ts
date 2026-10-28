// Carga del banco de preguntas: todos los JSON de content/preguntas/ entran solos.
import type { MundoId, Pregunta } from './tipos'

const archivos = import.meta.glob<Pregunta[]>('../../content/preguntas/*.json', { eager: true, import: 'default' })
const BANCO: Pregunta[] = Object.values(archivos).flat()
const POR_ID = new Map(BANCO.map((p) => [p.id, p]))

export const todasLasPreguntas = (): Pregunta[] => BANCO

export const preguntasDe = (mundo: MundoId): Pregunta[] => BANCO.filter((p) => p.mundo === mundo)

export const preguntaPorId = (id: string): Pregunta | undefined => POR_ID.get(id)

/** Un mundo es jugable si tiene preguntas suficientes para un nivel. */
export const mundoTieneContenido = (mundo: MundoId) => preguntasDe(mundo).length >= 8
