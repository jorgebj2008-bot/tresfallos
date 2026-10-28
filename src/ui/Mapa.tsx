import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { MUNDOS, type Mundo } from '../content/mundos'
import { mundoTieneContenido } from '../content/banco'
import { claveNivel, useJuego } from '../store/useJuego'
import type { ResultadoNivel } from '../store/db'
import type { MundoId } from '../content/tipos'
import { Candado, Estrella } from './iconos'

const PASO = 96 // separación vertical entre niveles, en px

type Estado = 'hecho' | 'disponible' | 'bloqueado'

function mundoCompleto(m: Mundo, niveles: Record<string, ResultadoNivel>) {
  for (let n = 1; n <= m.niveles; n++) if (!niveles[claveNivel(m.id, n)]?.estrellas) return false
  return true
}

/** Un mundo se abre cuando el anterior tiene al menos 1 estrella en todos sus niveles. */
function mundoAbierto(i: number, niveles: Record<string, ResultadoNivel>) {
  if (!mundoTieneContenido(MUNDOS[i].id)) return false
  return i === 0 || mundoCompleto(MUNDOS[i - 1], niveles)
}

function estadoNivel(m: Mundo, abierto: boolean, n: number, niveles: Record<string, ResultadoNivel>): Estado {
  if (!abierto) return 'bloqueado'
  if (niveles[claveNivel(m.id, n)]?.estrellas) return 'hecho'
  if (n === 1 || niveles[claveNivel(m.id, n - 1)]?.estrellas) return 'disponible'
  return 'bloqueado'
}

export function Mapa({ onJugar }: { onJugar: (mundo: MundoId, nivel: number) => void }) {
  const niveles = useJuego((s) => s.niveles)
  const actualRef = useRef<HTMLButtonElement>(null)

  // Al entrar, centra la pantalla en el siguiente nivel por jugar.
  useEffect(() => {
    actualRef.current?.scrollIntoView({ block: 'center' })
  }, [])

  // El primer nivel disponible del mapa es el "actual" (late para llamar la atención).
  let actualMarcado = false

  return (
    <main className="mapa">
      {MUNDOS.map((m, mi) => {
        const abierto = mundoAbierto(mi, niveles)
        const conContenido = mundoTieneContenido(m.id)
        const total = m.niveles + 1
        const alto = total * PASO + 20
        const puntos = Array.from({ length: total }, (_, i) => ({
          x: i === m.niveles ? 50 : 50 + 27 * Math.sin(i * 1.05 + mi * 2),
          y: alto - 56 - i * PASO,
        }))
        // Carretera: curva suave que pasa por el centro de cada nivel.
        let d = `M50 ${alto + 20} L${puntos[0].x} ${puntos[0].y}`
        for (let i = 1; i < puntos.length; i++) {
          const a = puntos[i - 1], b = puntos[i]
          d += ` C${a.x} ${a.y - PASO / 2} ${b.x} ${b.y + PASO / 2} ${b.x} ${b.y}`
        }
        d += ` L50 -20`
        const estrellas = Array.from({ length: m.niveles }, (_, i) => niveles[claveNivel(m.id, i + 1)]?.estrellas ?? 0).reduce((a, b) => a + b, 0)

        return (
          <section key={m.id} className="mundo" style={{ '--color': m.color } as CSSProperties}>
            <div className={`banner pegatina ${abierto ? '' : 'bloqueado'}`} style={{ position: 'relative', zIndex: 3 }}>
              <span className="num">{m.numero}</span>
              <div className="info">
                <h2>{m.nombre}</h2>
                <p>Jefe: {m.jefe}</p>
              </div>
              <span className="estrellas-mundo" aria-label={`${estrellas} de ${m.niveles * 3} estrellas`}>
                <Estrella /> {estrellas}/{m.niveles * 3}
              </span>
            </div>

            <div className="camino" style={{ height: alto }}>
              <svg className="carretera" viewBox={`0 0 100 ${alto}`} preserveAspectRatio="none" aria-hidden="true">
                <path className="borde" d={d} vectorEffect="non-scaling-stroke" />
                <path className="asfalto" d={d} vectorEffect="non-scaling-stroke" />
                <path className="raya" d={d} vectorEffect="non-scaling-stroke" />
              </svg>

              {!conContenido && <div className="etiqueta-pronto pegatina">Contenido en preparación</div>}

              {puntos.map((p, i) => {
                const pos = { left: `${p.x}%`, top: p.y }
                if (i === m.niveles) {
                  return (
                    <button key="jefe" className="nodo jefe" style={pos} disabled title="Los jefes llegan en la Fase 5" aria-label={`Jefe: ${m.jefe}. Bloqueado`}>
                      <Candado />
                      JEFE
                    </button>
                  )
                }
                const n = i + 1
                const estado = estadoNivel(m, abierto, n, niveles)
                const esActual = estado === 'disponible' && !actualMarcado
                if (esActual) actualMarcado = true
                const res = niveles[claveNivel(m.id, n)]
                return (
                  <button
                    key={n}
                    ref={esActual ? actualRef : undefined}
                    className={`nodo ${esActual ? 'actual' : ''}`}
                    style={pos}
                    disabled={estado === 'bloqueado'}
                    onClick={() => onJugar(m.id, n)}
                    aria-label={`Nivel ${n}${estado === 'bloqueado' ? ', bloqueado' : ''}${res ? `, ${res.estrellas} estrellas` : ''}`}
                  >
                    {estado === 'bloqueado' ? <Candado /> : n}
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
