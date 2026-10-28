// Tipos del banco de preguntas. Ver docs/GDD.md, sección 10 del encargo.

export type MundoId =
  | 'conductor'
  | 'via'
  | 'senales'
  | 'velocidad'
  | 'prioridad'
  | 'maniobras'
  | 'alumbrado'
  | 'autopistas'
  | 'alcohol'
  | 'seguridad'
  | 'accidentes'
  | 'eficiente'
  | 'sanciones'

export interface Opcion {
  texto: string
  correcta: boolean
  explicacion: string
  /** Tipo de error que revela elegir esta opción (solo en las incorrectas). */
  error_tipo?: string
}

export interface Pregunta {
  id: string
  mundo: MundoId
  subtema: string
  dificultad: 1 | 2 | 3 | 4 | 5
  tipo: 'test'
  enunciado: string
  imagen: string | null
  opciones: Opcion[]
  error_tipo: string[]
  /** Artículo o norma en la que se basa la pregunta. */
  fuente: string
  /** true si el dato legal no está contrastado con una fuente oficial. */
  revisar: boolean
}
