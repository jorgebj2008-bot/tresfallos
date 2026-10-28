// Cierre de cada partida: racha, misiones, monedas, estadísticas, cofres y logros.
// Devuelve las "novedades" para celebrarlas en la pantalla de resultados.
import { useJuego, claveNivel } from './useJuego'
import { seguro } from './db'
import {
  RACHA_INICIAL, STATS_INICIALES, abrirCofre as abrir, actualizarRacha, avanzarMisiones, diaLocal, logrosNuevos,
  monedasPartida, sumarEstadisticas, type CambioRacha, type EventoPartida, type Logro, type Mision, type Premio, type TipoCofre,
} from '../game/retencion'
import type { ResultadoPartida } from '../ui/Nivel'
import { MUNDOS } from '../content/mundos'

export interface Novedades {
  monedas: number
  racha: { actual: number; cambio: CambioRacha; protectorGanado: boolean }
  misiones: Mision[]
  logros: Logro[]
  cofres: TipoCofre[]
}

export function registrarPartida(r: ResultadoPartida, ahora = Date.now()): Novedades {
  const { perfil, niveles, simulacros } = useJuego.getState()
  const c = r.config
  const e: EventoPartida = {
    tipo: c.tipo, juego: c.tipo === 'juego' ? c.juego : undefined, aciertos: r.aciertos, total: r.total,
    estrellas: r.estrellas, mejorCombo: r.mejorCombo, victoria: r.victoria, hora: ahora,
  }
  const hoy = diaLocal(ahora)
  const racha = actualizarRacha(perfil.racha ?? RACHA_INICIAL, hoy)
  const mis = avanzarMisiones(perfil.misiones, e, ahora)
  let stats = sumarEstadisticas(perfil.stats ?? STATS_INICIALES, e)
  if (c.tipo === 'jefe' && r.victoria && !stats.jefes.includes(c.mundo)) stats = { ...stats, jefes: [...stats.jefes, c.mundo] }

  const cofres: TipoCofre[] = []
  if (perfil.ultimoCofreDiario !== hoy) cofres.push('diario')
  const diarias = mis.estado.cumplidas.filter((id) => id.startsWith(`d-${hoy}`))
  if (diarias.length === 3 && mis.nuevas.some((m) => m.id.startsWith('d-'))) cofres.push('misiones')
  if (c.tipo === 'jefe' && r.victoria) cofres.push('jefe')

  const monedas = monedasPartida(e) + mis.nuevas.reduce((a, m) => a + m.monedas, 0)
  const coches = perfil.coches ?? ['pegatino']
  const nivelesCompletados = Object.values(niveles).filter((n) => n.estrellas > 0).length
  const logros = logrosNuevos(
    { stats, rachaMejor: racha.racha.mejor, nivelesCompletados, simulacros, coches: coches.length },
    perfil.logros ?? [],
  )

  const nuevo = {
    ...perfil,
    monedas: (perfil.monedas ?? 0) + monedas,
    racha: racha.racha,
    stats,
    misiones: mis.estado,
    cofres: [...(perfil.cofres ?? []), ...cofres],
    ultimoCofreDiario: hoy,
    coches,
    logros: [...(perfil.logros ?? []), ...logros.map((l) => l.id)],
  }
  useJuego.setState({ perfil: nuevo })
  void seguro((db) => db.perfil.put(nuevo))
  return { monedas, racha: { actual: racha.racha.actual, cambio: racha.cambio, protectorGanado: racha.protectorGanado }, misiones: mis.nuevas, logros, cofres }
}

/** Abre el primer cofre pendiente del tipo indicado y aplica el premio. */
export function abrirCofre(indice: number): Premio | null {
  const { perfil } = useJuego.getState()
  const pendientes = perfil.cofres ?? []
  const tipo = pendientes[indice]
  if (!tipo) return null
  const coches = perfil.coches ?? ['pegatino']
  const premio = abrir(tipo, Math.random, coches, perfil.racha?.protectores ?? 0)
  const racha = perfil.racha ?? RACHA_INICIAL
  const nuevo = {
    ...perfil,
    monedas: (perfil.monedas ?? 0) + premio.monedas,
    cofres: pendientes.filter((_, i) => i !== indice),
    coches: premio.coche ? [...coches, premio.coche] : coches,
    racha: premio.protector ? { ...racha, protectores: racha.protectores + 1 } : racha,
  }
  useJuego.setState({ perfil: nuevo })
  void seguro((db) => db.perfil.put(nuevo))
  return premio
}

export function comprarCoche(id: string, precio: number): boolean {
  const { perfil } = useJuego.getState()
  const coches = perfil.coches ?? ['pegatino']
  if (coches.includes(id) || (perfil.monedas ?? 0) < precio) return false
  const nuevo = { ...perfil, monedas: (perfil.monedas ?? 0) - precio, coches: [...coches, id], coche: id }
  useJuego.setState({ perfil: nuevo })
  void seguro((db) => db.perfil.put(nuevo))
  return true
}

export function elegirCoche(id: string) {
  const { perfil } = useJuego.getState()
  const nuevo = { ...perfil, coche: id }
  useJuego.setState({ perfil: nuevo })
  void seguro((db) => db.perfil.put(nuevo))
}

/** Un jefe se puede retar cuando todos los niveles de su mundo tienen al menos 1 estrella. */
export function jefeDisponible(mundoIdx: number) {
  const { niveles } = useJuego.getState()
  const m = MUNDOS[mundoIdx]
  for (let n = 1; n <= m.niveles; n++) if (!niveles[claveNivel(m.id, n)]?.estrellas) return false
  return true
}
