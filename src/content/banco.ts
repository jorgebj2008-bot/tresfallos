// Carga del banco de preguntas: todos los JSON de content/preguntas/ entran solos.
import type { MundoId, Pregunta } from './tipos'

const archivos = import.meta.glob<Pregunta[]>('../../content/preguntas/*.json', { eager: true, import: 'default' })
const COMPLETO: Pregunta[] = Object.values(archivos).flat()
// Las preguntas marcadas «revisar» no salen en el juego hasta que alguien confirme el dato.
const BANCO: Pregunta[] = COMPLETO.filter((p) => !p.revisar)
const POR_ID = new Map(BANCO.map((p) => [p.id, p]))

/** Preguntas que se juegan (sin las pendientes de revisar). */
export const todasLasPreguntas = (): Pregunta[] => BANCO

/** Todas, también las pendientes de revisar (para el panel de administración y las pruebas). */
export const bancoCompleto = (): Pregunta[] => COMPLETO

export const preguntasDe = (mundo: MundoId): Pregunta[] => BANCO.filter((p) => p.mundo === mundo)

export const preguntaPorId = (id: string): Pregunta | undefined => POR_ID.get(id)

/** Un mundo es jugable si tiene preguntas suficientes para un nivel. */
export const mundoTieneContenido = (mundo: MundoId) => preguntasDe(mundo).length >= 8
