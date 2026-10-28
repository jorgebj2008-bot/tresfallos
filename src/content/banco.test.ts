// Validación del banco: se ejecuta con "npm run validar" (y con "npm test").
import { describe, expect, it } from 'vitest'
import { bancoCompleto } from './banco'
import { AFIRMACIONES } from './afirmaciones'
import { validarBanco } from './validar'
import { MUNDOS } from './mundos'

describe('banco de preguntas', () => {
  const banco = bancoCompleto()
  const problemas = validarBanco(banco, AFIRMACIONES)

  it('no tiene errores graves', () => {
    const graves = problemas.filter((p) => p.grave).map((p) => `${p.id}: ${p.texto}`)
    expect(graves).toEqual([])
  })

  it('tiene al menos 150 preguntas y todos los mundos son jugables', () => {
    expect(banco.length).toBeGreaterThanOrEqual(150)
    for (const m of MUNDOS) expect(banco.filter((p) => p.mundo === m.id).length, m.id).toBeGreaterThanOrEqual(10)
  })

  it('informa del resumen y los avisos', () => {
    const porMundo = MUNDOS.map((m) => `${m.nombre}: ${banco.filter((p) => p.mundo === m.id).length}`)
    const revisar = banco.filter((p) => p.revisar).map((p) => p.id)
    const avisos = problemas.filter((p) => !p.grave).map((p) => `${p.id}: ${p.texto}`)
    console.log(`\nPreguntas: ${banco.length} · Afirmaciones: ${AFIRMACIONES.length}\n${porMundo.join('\n')}`)
    console.log(`\nMarcadas para revisar (${revisar.length}): ${revisar.join(', ')}`)
    if (avisos.length) console.log(`\nAvisos (${avisos.length}):\n${avisos.join('\n')}`)
    expect(true).toBe(true)
  })
})
