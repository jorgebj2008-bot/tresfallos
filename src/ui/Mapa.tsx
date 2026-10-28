import { useEffect, useMemo, useRef } from 'react'
import type { CSSProperties } from 'react'
import { MUNDOS, type Mundo } from '../content/mundos'
import { mundoTieneContenido } from '../content/banco'
import { claveNivel, useJuego } from '../store/useJuego'
import type { ResultadoNivel } from '../store/db'
import type { MundoId } from '../content/tipos'
import { Candado, Estrella, IconoMando } from './iconos'
import { juegoDeNivel, juegoPorId } from '../game/juegos'
import { W, construirEscena, type EscenaConstruida } from './mapa/escenas'
import { Coche } from './mapa/decorado'
import { cochePorId } from '../game/retencion'

type Estado = 'hecho' | 'disponible' | 'bloqueado'

function mundoCompleto(m: Mundo, niveles: Record<string, ResultadoNivel>) {
  for (let n = 1; n <= m.niveles; n++) if (!niveles[claveNivel(m.id, n)]?.estrellas) return false
  return true
}

/** Un mundo se abre al vencer al jefe del mundo anterior. */
function mundoAbierto(i: number, jefes: string[]) {
  if (!mundoTieneContenido(MUNDOS[i].id)) return false
  return i === 0 || jefes.includes(MUNDOS[i - 1].id)
}

function estadoNivel(m: Mundo, abierto: boolean, n: number, niveles: Record<string, ResultadoNivel>): Estado {
  if (!abierto) return 'bloqueado'
  if (niveles[claveNivel(m.id, n)]?.estrellas) return 'hecho'
  if (n === 1 || niveles[claveNivel(m.id, n - 1)]?.estrellas) return 'disponible'
  return 'bloqueado'
}

/** Carretera con borde, asfalto y raya discontinua (y aceras en los mundos de ciudad). */
function Carretera({ d, esc, ancho = 36 }: { d: string; esc: EscenaConstruida; ancho?: number }) {
  return (
    <>
      {esc.aceras && <path d={d} className="acera" strokeWidth={ancho + 26} />}
      <path d={d} className="borde" strokeWidth={ancho + 7} />
      <path d={d} className={esc.noche ? 'asfalto noche' : 'asfalto'} strokeWidth={ancho} />
      <path d={d} className={esc.noche ? 'raya noche' : 'raya'} />
    </>
  )
}

export function Mapa({ onJugar, onJefe }: { onJugar: (mundo: MundoId, nivel: number) => void; onJefe: (mundo: MundoId) => void }) {
  const niveles = useJuego((s) => s.niveles)
  const jefes = useJuego((s) => s.perfil.stats?.jefes) ?? []
  const colorCoche = cochePorId(useJuego((s) => s.perfil.coche)).color
  const actualRef = useRef<HTMLButtonElement>(null)
  // Las escenas no dependen del progreso: se generan una sola vez.
  const escenas = useMemo(() => MUNDOS.map((m, i) => construirEscena(i, m.niveles)), [])

  useEffect(() => {
    actualRef.current?.scrollIntoView({ block: 'center' })
  }, [])

  let actualMarcado = false

  return (
    <main className="mapa">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <radialGradient id="halo">
            <stop offset="0" stopColor="#FFE27A" stopOpacity="0.7" />
            <stop offset="1" stopColor="#FFE27A" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      {MUNDOS.map((m, mi) => {
        const esc = escenas[mi]
        const abierto = mundoAbierto(mi, jefes)
        const vencido = jefes.includes(m.id)
        const retable = abierto && mundoCompleto(m, niveles)
        const conContenido = mundoTieneContenido(m.id)
        const estrellas = Array.from({ length: m.niveles }, (_, i) => niveles[claveNivel(m.id, i + 1)]?.estrellas ?? 0).reduce((a, b) => a + b, 0)
        const estados = Array.from({ length: m.niveles }, (_, i) => estadoNivel(m, abierto, i + 1, niveles))
        let iActual = actualMarcado ? -1 : estados.indexOf('disponible')
        if (iActual < 0 && !actualMarcado && retable && !vencido) iActual = m.niveles
        if (iActual >= 0) actualMarcado = true
        const coche = iActual >= 0 ? esc.nodos[iActual] : null

        return (
          <section key={m.id} className="mundo" style={{ '--color': m.color } as CSSProperties}>
            <div className={`banner pegatina ${abierto ? '' : 'bloqueado'}`}>
              <span className="num">{m.numero}</span>
              <div className="info">
                <h2>{m.nombre}</h2>
                <p>{conContenido ? `Jefe: ${m.jefe}` : 'Próximamente · contenido en preparación'}</p>
              </div>
              <span className="estrellas-mundo" aria-label={`${estrellas} de ${m.niveles * 3} estrellas`}>
                <Estrella /> {estrellas}/{m.niveles * 3}
              </span>
            </div>

            <div className="escena-caja" style={{ aspectRatio: `${W} / ${esc.H}` }}>
              <svg className="escena" viewBox={`0 0 ${W} ${esc.H}`} aria-hidden="true">
                <rect width={W} height={esc.H} fill={esc.suelo} />
                {esc.fondo}
                {esc.extras.map((d, i) => <Carretera key={i} d={d} esc={esc} ancho={30} />)}
                <Carretera d={esc.d} esc={esc} />
                {esc.sobre}
                {esc.decor}
                {coche && (
                  <g className="mi-coche">
                    <Coche x={coche.x - Math.cos(coche.ang) * 48} y={coche.y - Math.sin(coche.ang) * 48} ang={(coche.ang * 180) / Math.PI} c={colorCoche} s={1.15} />
                  </g>
                )}
                {!esc.noche && <rect width={W} height={esc.H} className="velo-noche" />}
                {!abierto && <rect width={W} height={esc.H} className="velo-bloqueo" />}
              </svg>

              {esc.nodos.map((p, i) => {
                const pos = { left: `${(p.x / W) * 100}%`, top: `${(p.y / esc.H) * 100}%` }
                if (i === m.niveles) {
                  return (
                    <button
                      key="jefe"
                      ref={iActual === m.niveles ? actualRef : undefined}
                      className={`nodo jefe ${vencido ? 'vencido' : ''} ${iActual === m.niveles ? 'actual' : ''}`}
                      style={pos}
                      disabled={!retable}
                      onClick={() => onJefe(m.id)}
                      title={retable ? `Retar a ${m.jefe}` : 'Consigue al menos 1 estrella en todos los niveles del mundo'}
                      aria-label={`Jefe: ${m.jefe}${vencido ? ', vencido' : retable ? ', disponible' : ', bloqueado'}`}
                    >
                      {retable ? <Estrella llena={vencido} /> : <Candado />}
                      {vencido ? 'VENCIDO' : 'JEFE'}
                    </button>
                  )
                }
                const n = i + 1
                const estado = estados[i]
                const esActual = i === iActual
                const res = niveles[claveNivel(m.id, n)]
                const juego = juegoDeNivel(m.id, n)
                return (
                  <button
                    key={n}
                    ref={esActual ? actualRef : undefined}
                    className={`nodo ${esActual ? 'actual' : ''} ${juego ? 'es-juego' : ''}`}
                    style={pos}
                    disabled={estado === 'bloqueado'}
                    onClick={() => onJugar(m.id, n)}
                    aria-label={`Nivel ${n}${juego ? `, minijuego ${juegoPorId(juego).nombre}` : ''}${estado === 'bloqueado' ? ', bloqueado' : ''}${res ? `, ${res.estrellas} estrellas` : ''}`}
                  >
                    {estado === 'bloqueado' ? <Candado /> : juego ? <IconoMando /> : n}
                    {estado === 'hecho' && (
                      <span className="mini-estrellas">
                        {[1, 2, 3].map((k) => <Estrella key={k} llena={(res?.estrellas ?? 0) >= k} />)}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}
    </main>
  )
}
