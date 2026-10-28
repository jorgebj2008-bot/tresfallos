// Detección de errores tipo: cada opción incorrecta lleva un error_tipo.
// Aquí se les pone nombre claro y un consejo, y se calculan los puntos débiles.

import type { EstadoPregunta } from './sm2'
import { DIA } from './sm2'

export interface InfoError {
  nombre: string
  consejo: string
}

export const ERRORES: Record<string, InfoError> = {
  trampa_siempre_nunca: { nombre: 'Caes en el «siempre / nunca»', consejo: 'Desconfía de las respuestas absolutas. La norma casi siempre tiene excepciones.' },
  lectura_matiz: { nombre: 'Lees demasiado rápido', consejo: 'Fíjate en los matices: «incluido», «solo», «puede», «debe».' },
  dato_numerico: { nombre: 'Bailan las cifras', consejo: 'Repasa los números clave: plazos, kilos, puntos y velocidades.' },
  confunde_conceptos: { nombre: 'Mezclas normas parecidas', consejo: 'Separa cada norma de su gemela: qué dice una y qué dice la otra.' },
  confunde_permisos: { nombre: 'Confundes permisos', consejo: 'Repasa qué autoriza cada permiso y la edad de cada uno.' },
  confunde_senales: { nombre: 'Confundes señales parecidas', consejo: 'Compara forma y color: triángulo avisa, círculo ordena, cuadrado informa.' },
  numero_velocidad: { nombre: 'No te sabes las velocidades', consejo: 'Haz una tabla: tipo de vía × tipo de vehículo.' },
  prioridad_glorieta: { nombre: 'Fallas la prioridad en glorietas', consejo: 'Quien ya está dentro de la glorieta tiene prioridad.' },
  prioridad_derecha: { nombre: 'Olvidas la prioridad de la derecha', consejo: 'Sin señales, pasa primero quien viene por tu derecha.' },
  jerarquia_senales: { nombre: 'Te lías con quién manda', consejo: 'Agente > semáforo > señal vertical > marca vial.' },
  giro_izquierda: { nombre: 'Olvidas ceder al girar a la izquierda', consejo: 'Si giras a la izquierda, quien viene de frente pasa primero.' },
  prioridad_senales: { nombre: 'Te saltas el STOP o el ceda', consejo: 'Con STOP o ceda el paso, cedes a todos los que circulan por la vía principal.' },
  prioridad_urgencia: { nombre: 'No dejas paso a las urgencias', consejo: 'Ambulancia, bomberos o policía con luces y sirena pasan antes que nadie.' },
  prioridad_peaton: { nombre: 'Te olvidas de los peatones', consejo: 'Peatón en el paso o cruzando la calle a la que giras: pasa él primero.' },
  distancias: { nombre: 'Calculas mal las distancias', consejo: 'Distancia de detención = la de reacción + la de frenado.' },
  tasas_alcohol: { nombre: 'Confundes las tasas de alcohol', consejo: 'General 0,25 mg/l en aire; noveles y profesionales 0,15.' },
}

export const infoError = (tipo: string): InfoError =>
  ERRORES[tipo] ?? { nombre: tipo.replace(/_/g, ' '), consejo: 'Repasa estas preguntas con calma.' }

export interface PuntoDebil extends InfoError {
  tipo: string
  peso: number
  preguntas: string[]
}

/**
 * Puntos débiles: tipos de error de preguntas que todavía no dominas.
 * Un fallo pesa más si es reciente y si la pregunta sigue sin dominarse.
 */
export function puntosDebiles(estados: Record<string, EstadoPregunta>, ahora: number, max = 3): PuntoDebil[] {
  const acc: Record<string, PuntoDebil> = {}
  for (const e of Object.values(estados)) {
    if (!e.ultimoError || e.fallos === 0 || e.repeticiones >= 3) continue
    const dias = (ahora - e.ultima) / DIA
    const peso = Math.pow(0.5, dias / 14) * (e.repeticiones === 0 ? 1 : 0.5)
    const p = (acc[e.ultimoError] ??= { tipo: e.ultimoError, ...infoError(e.ultimoError), peso: 0, preguntas: [] })
    p.peso += peso
    p.preguntas.push(e.id)
  }
  return Object.values(acc).sort((a, b) => b.peso - a.peso).slice(0, max)
}

/** Preguntas para el cuaderno de errores: falladas alguna vez y aún no dominadas. */
export const preguntasConFallos = (estados: Record<string, EstadoPregunta>) =>
  Object.values(estados).filter((e) => e.fallos > 0 && e.repeticiones < 3)
