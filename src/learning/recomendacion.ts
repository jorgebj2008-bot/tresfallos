// Recomendación diaria: qué conviene practicar hoy.
import type { InformeListo } from './estoyListo'
import type { PuntoDebil } from './errores'

export type Accion = { tipo: 'repaso-vencidas' } | { tipo: 'punto-debil'; debil: PuntoDebil } | { tipo: 'mapa' } | { tipo: 'simulacro' }

export interface Recomendacion {
  texto: string
  boton: string
  accion: Accion
}

export function recomendar(vencidas: number, debiles: PuntoDebil[], listo: InformeListo, simulacroDisponible: boolean): Recomendacion {
  if (vencidas >= 5) {
    return { texto: `Tienes ${vencidas} preguntas que toca repasar hoy para no olvidarlas.`, boton: `Repasar ${Math.min(vencidas, 10)}`, accion: { tipo: 'repaso-vencidas' } }
  }
  if (debiles.length) {
    const d = debiles[0]
    return { texto: `Hoy: 5 minutos contra tu punto débil, «${d.nombre}».`, boton: 'Entrenarlo', accion: { tipo: 'punto-debil', debil: d } }
  }
  if (simulacroDisponible && listo.aciertoEsperado >= 0.8 && listo.simulacrosUsados < 3) {
    return { texto: 'Vas bien. Haz un simulacro para que el indicador sea más fiable.', boton: 'Hacer simulacro', accion: { tipo: 'simulacro' } }
  }
  return { texto: `Sigue avanzando por el mapa. Lo que más te sube ahora: «${listo.queFalta[0]?.nombre}».`, boton: 'Ir al mapa', accion: { tipo: 'mapa' } }
}
