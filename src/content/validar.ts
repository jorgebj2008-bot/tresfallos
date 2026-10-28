// Validación del banco de preguntas y de las afirmaciones.
// Se usa en los tests (npm run validar) y en el panel de administración.
import type { Pregunta } from './tipos'
import type { Afirmacion } from './afirmaciones'
import { MUNDOS } from './mundos'
import { SENALES } from './senales'
import { ERRORES } from '../learning/errores'
import { ESCENAS_IDS } from '../ui/EscenaSVG'

export interface Problema {
  id: string
  grave: boolean
  texto: string
}

const normal = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
const MUNDOS_VALIDOS = new Set(MUNDOS.map((m) => m.id))
const SENALES_VALIDAS = new Set(SENALES.map((s) => s.id))

export function validarPregunta(p: Pregunta): Problema[] {
  const out: Problema[] = []
  const grave = (texto: string) => out.push({ id: p.id, grave: true, texto })
  const aviso = (texto: string) => out.push({ id: p.id, grave: false, texto })
  if (!/^[A-Z]{3}-\d{4}$/.test(p.id)) grave('El id debe tener el formato ABC-0000')
  if (!MUNDOS_VALIDOS.has(p.mundo)) grave(`Mundo desconocido: ${p.mundo}`)
  if (!p.enunciado?.trim()) grave('Falta el enunciado')
  if (!p.fuente?.trim()) grave('Falta la fuente (artículo o norma)')
  if (!(p.dificultad >= 1 && p.dificultad <= 5)) grave('La dificultad debe ir de 1 a 5')
  if (p.opciones.length !== 3) grave(`Debe tener 3 opciones (tiene ${p.opciones.length})`)
  const correctas = p.opciones.filter((o) => o.correcta).length
  if (correctas !== 1) grave(`Debe tener exactamente una correcta (tiene ${correctas})`)
  p.opciones.forEach((o, i) => {
    if (!o.texto?.trim()) grave(`La opción ${i + 1} no tiene texto`)
    if (!o.explicacion?.trim()) grave(`La opción ${i + 1} no tiene explicación`)
    else if (o.explicacion.split(/[.!?](?:\s|$)/).filter(Boolean).length > 2) aviso(`La explicación de la opción ${i + 1} pasa de 2 frases`)
    if (!o.correcta && !o.error_tipo) aviso(`La opción incorrecta ${i + 1} no tiene error_tipo`)
    if (o.error_tipo && !ERRORES[o.error_tipo]) aviso(`error_tipo sin nombre claro: ${o.error_tipo}`)
  })
  if (new Set(p.opciones.map((o) => normal(o.texto))).size !== p.opciones.length) grave('Hay opciones repetidas')
  if (p.imagen) {
    const [tipo, id] = p.imagen.split(':')
    const valida = (tipo === 'senal' && SENALES_VALIDAS.has(id)) || (tipo === 'escena' && ESCENAS_IDS.includes(id))
    if (!valida) grave(`Imagen desconocida: ${p.imagen}`)
  }
  return out
}

export function validarBanco(banco: Pregunta[], afirmaciones: Afirmacion[] = []): Problema[] {
  const out = banco.flatMap(validarPregunta)
  const ids = new Map<string, number>()
  const enunciados = new Map<string, string>()
  for (const p of banco) {
    ids.set(p.id, (ids.get(p.id) ?? 0) + 1)
    const k = `${normal(p.enunciado)}|${p.imagen ?? ''}`
    if (enunciados.has(k)) out.push({ id: p.id, grave: true, texto: `Enunciado duplicado de ${enunciados.get(k)}` })
    else enunciados.set(k, p.id)
  }
  for (const [id, n] of ids) if (n > 1) out.push({ id, grave: true, texto: `Id repetido ${n} veces` })
  const idsA = new Set<string>()
  for (const a of afirmaciones) {
    if (idsA.has(a.id)) out.push({ id: a.id, grave: true, texto: 'Id de afirmación repetido' })
    idsA.add(a.id)
    if (!a.texto?.trim() || !a.explicacion?.trim() || !a.fuente?.trim()) out.push({ id: a.id, grave: true, texto: 'Afirmación incompleta' })
    if (!MUNDOS_VALIDOS.has(a.mundo)) out.push({ id: a.id, grave: true, texto: `Mundo desconocido: ${a.mundo}` })
  }
  return out
}
