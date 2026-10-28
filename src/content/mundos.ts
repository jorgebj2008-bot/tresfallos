import type { MundoId } from './tipos'

export interface Mundo {
  id: MundoId
  numero: number
  nombre: string
  jefe: string
  /** Peso estimado en el examen real (suma 1). Ver GDD, sección 3. */
  peso: number
  /** Color de la pegatina del mundo en el mapa. */
  color: string
  niveles: number
  /** Frase con la que el jefe te recibe. */
  lema: string
}

// Orden del mapa: de abajo (mundo 1) a arriba (mundo 13).
export const MUNDOS: Mundo[] = [
  { id: 'conductor', numero: 1, nombre: 'Conductor y vehículo', jefe: 'El Funcionario Sellos', peso: 0.06, color: '#7C5CFF', niveles: 10, lema: 'Sin el papel correcto, aquí no pasa nadie.' },
  { id: 'via', numero: 2, nombre: 'La vía y sus usuarios', jefe: 'Doña Arcén', peso: 0.06, color: '#3DA5FF', niveles: 10, lema: 'A ver si sabes por dónde va cada uno, criatura.' },
  { id: 'senales', numero: 3, nombre: 'Señalización', jefe: 'El Agente Silbato', peso: 0.14, color: '#FF5A5F', niveles: 12, lema: '¡Piiii! Aquí mando yo, más que cualquier señal.' },
  { id: 'velocidad', numero: 4, nombre: 'Velocidad y distancias', jefe: 'Capitán Radar', peso: 0.09, color: '#FF9F1C', niveles: 10, lema: 'Te tengo cronometrado desde el kilómetro cero.' },
  { id: 'prioridad', numero: 5, nombre: 'Prioridad de paso', jefe: 'La Inspectora Rotonda', peso: 0.12, color: '#2EC4B6', niveles: 12, lema: 'En mi glorieta, el que está dentro manda.' },
  { id: 'maniobras', numero: 6, nombre: 'Maniobras', jefe: 'Míster Adelanto', peso: 0.09, color: '#E15FBF', niveles: 10, lema: '¿Adelantar por la derecha? Eso ya lo veremos.' },
  { id: 'alumbrado', numero: 7, nombre: 'Alumbrado y avisos', jefe: 'La Duquesa Luces', peso: 0.04, color: '#5B6CFF', niveles: 8, lema: 'Querido, no me deslumbres con las largas.' },
  { id: 'autopistas', numero: 8, nombre: 'Autopistas, túneles y pasos a nivel', jefe: 'El Jefe de Estación', peso: 0.06, color: '#0FA968', niveles: 8, lema: 'Cuando bajan las barreras, el tren no espera.' },
  { id: 'alcohol', numero: 9, nombre: 'Alcohol, drogas y fatiga', jefe: 'El Soplón', peso: 0.08, color: '#C2410C', niveles: 10, lema: 'Sopla aquí… y luego responde si puedes.' },
  { id: 'seguridad', numero: 10, nombre: 'Seguridad activa y pasiva', jefe: 'Doctor Airbag', peso: 0.06, color: '#0EA5E9', niveles: 8, lema: 'El cinturón primero. Luego hablamos.' },
  { id: 'accidentes', numero: 11, nombre: 'Accidentes y primeros auxilios', jefe: 'Sargento Rescate', peso: 0.07, color: '#EF4444', niveles: 8, lema: 'Proteger, avisar, socorrer. ¡En ese orden, recluta!' },
  { id: 'eficiente', numero: 12, nombre: 'Conducción eficiente y mecánica', jefe: 'Ingeniera Eco', peso: 0.06, color: '#22C55E', niveles: 8, lema: '¿Punto muerto cuesta abajo? Qué derroche.' },
  { id: 'sanciones', numero: 13, nombre: 'Infracciones y sanciones', jefe: 'El Juez Multas', peso: 0.07, color: '#A855F7', niveles: 8, lema: 'Silencio en la sala. Cada fallo, una multa.' },
]

export const mundoPorId = (id: MundoId) => MUNDOS.find((m) => m.id === id)!
