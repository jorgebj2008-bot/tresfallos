// Minijuego «Velocímetro»: lees la situación (vía, vehículo, señales) y giras la aguja
// hasta el límite exacto. Entrena los números de velocidad, el error más típico del examen.
import { useMemo, useRef, useState, type PointerEvent as EventoPuntero } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { NOMBRE_VEHICULO, NOMBRE_VIA, SITUACIONES_VELOCIDAD, type SituacionVelocidad } from '../../content/velocimetro'
import { juegoPorId, multiplicador, preguntaFicticia } from '../../game/juegos'
import { useJuego } from '../../store/useJuego'
import { sfx, vibrar } from '../../audio/sfx'
import { explosion } from '../particulas'
import { BarraJuego, elegirParaRepaso, useEfectos, usePartida } from './Marco'
import type { ConfigPartida, ResultadoPartida } from '../Nivel'
import { Check, Cruz } from '../iconos'

const MAX = 130
const CX = 150
const CY = 158
const R = 128

/** Ángulo (en grados, 0 = izquierda) para una velocidad. */
const grados = (v: number) => (v / MAX) * 180
/** Punto del arco para una velocidad, a una distancia r del centro. */
function punto(v: number, r: number) {
  const a = Math.PI - (v / MAX) * Math.PI
  return { x: CX + r * Math.cos(a), y: CY - r * Math.sin(a) }
}

/** Señal circular de velocidad: roja si es máxima, azul si es mínima. */
export function SenalVelocidad({ tipo, valor, size = 64 }: { tipo: 'maxima' | 'minima'; valor: number; size?: number }) {
  const minima = tipo === 'minima'
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={`Señal de velocidad ${minima ? 'mínima' : 'máxima'} ${valor}`}>
      <circle cx={50} cy={50} r={46} fill={minima ? '#1F6FD1' : '#fff'} stroke={minima ? '#fff' : '#D62828'} strokeWidth={minima ? 3 : 12} />
      {minima && <circle cx={50} cy={50} r={47} fill="none" stroke="#1E1B2E" strokeWidth={2} />}
      {!minima && <circle cx={50} cy={50} r={48} fill="none" stroke="#1E1B2E" strokeWidth={2} />}
      <text x={50} y={64} textAnchor="middle" fontSize={valor >= 100 ? 34 : 42} fontWeight={900} fontFamily="Arial" fill={minima ? '#fff' : '#1E1B2E'}>{valor}</text>
    </svg>
  )
}

function Dial({ valor, onCambiar, correcto, bloqueado }: { valor: number; onCambiar: (v: number) => void; correcto: number | null; bloqueado: boolean }) {
  const ref = useRef<SVGSVGElement>(null)
  const arrastrando = useRef(false)

  // Convierte la posición del dedo en una velocidad (de 5 en 5).
  function desdePuntero(e: EventoPuntero<SVGSVGElement>) {
    const r = ref.current!.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * 300
    const y = ((e.clientY - r.top) / r.height) * 180
    let a = Math.atan2(CY - y, x - CX)
    if (a < 0) a = x < CX ? Math.PI : 0
    const v = Math.round(((1 - a / Math.PI) * MAX) / 5) * 5
    if (v !== valor) {
      onCambiar(v)
      sfx.toque()
      vibrar(5)
    }
  }

  const marcas = []
  for (let v = 0; v <= MAX; v += 5) {
    const larga = v % 10 === 0
    const a = punto(v, R - 4)
    const b = punto(v, R - (larga ? 18 : 11))
    marcas.push(<line key={v} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--ink)" strokeWidth={larga ? 3 : 1.5} strokeLinecap="round" />)
    if (larga && v % 20 === 0) {
      const t = punto(v, R - 34)
      marcas.push(<text key={`t${v}`} x={t.x} y={t.y + 5} textAnchor="middle" fontSize={14} fontWeight={800} fill="var(--ink)">{v}</text>)
    }
  }
  const fin = punto(valor, R - 2)
  const pc = correcto !== null ? punto(correcto, R + 8) : null

  return (
    <svg
      ref={ref}
      className="dial"
      viewBox="0 0 300 180"
      role="slider"
      tabIndex={0}
      aria-label="Velocidad"
      aria-valuemin={0}
      aria-valuemax={MAX}
      aria-valuenow={valor}
      aria-valuetext={`${valor} km/h`}
      onPointerDown={(e) => {
        if (bloqueado) return
        arrastrando.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
        desdePuntero(e)
      }}
      onPointerMove={(e) => arrastrando.current && !bloqueado && desdePuntero(e)}
      onPointerUp={() => (arrastrando.current = false)}
      onPointerCancel={() => (arrastrando.current = false)}
      onKeyDown={(e) => {
        if (bloqueado) return
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onCambiar(Math.min(MAX, valor + 5))
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onCambiar(Math.max(0, valor - 5))
      }}
    >
      {/* Esfera */}
      <path d={`M ${CX - R - 10} ${CY + 18} L ${CX - R - 10} ${CY} A ${R + 10} ${R + 10} 0 0 1 ${CX + R + 10} ${CY} L ${CX + R + 10} ${CY + 18} Z`} fill="var(--panel)" stroke="var(--line)" strokeWidth={4} />
      <path d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${fin.x} ${fin.y}`} fill="none" stroke="var(--gold)" strokeWidth={8} strokeLinecap="round" opacity={0.85} />
      {marcas}
      {/* Marca verde con la respuesta correcta cuando fallas */}
      {pc && <circle cx={pc.x} cy={pc.y} r={8} fill="var(--good)" stroke="var(--line)" strokeWidth={2.5} />}
      {/* Aguja */}
      <g transform={`rotate(${grados(valor)} ${CX} ${CY})`}>
        <path d={`M ${CX - R + 16} ${CY} L ${CX} ${CY - 6} L ${CX + 14} ${CY} L ${CX} ${CY + 6} Z`} fill="var(--bad)" stroke="var(--line)" strokeWidth={2.5} strokeLinejoin="round" />
      </g>
      <circle cx={CX} cy={CY} r={11} fill="var(--ink)" stroke="var(--line)" strokeWidth={2} />
      <text x={CX} y={CY - 46} textAnchor="middle" fontSize={40} fontWeight={900} fill="var(--ink)" fontFamily="var(--font-d)">{valor}</text>
      <text x={CX} y={CY - 26} textAnchor="middle" fontSize={13} fontWeight={800} fill="var(--muted)">km/h</text>
    </svg>
  )
}

function Situacion({ s }: { s: SituacionVelocidad }) {
  return (
    <motion.article key={s.id} className="pegatina situacion-velo" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} transition={{ type: 'spring', bounce: 0.3, duration: 0.35 }}>
      <div>
        <span className="rotulo">{NOMBRE_VIA[s.via]}</span>
        <h2>{NOMBRE_VEHICULO[s.vehiculo]}</h2>
        {s.detalle && <p>{s.detalle}</p>}
        <p className={`pide ${s.pide}`}>{s.pide === 'maxima' ? '¿Velocidad máxima?' : '¿Velocidad mínima?'}</p>
      </div>
      {s.senal && <SenalVelocidad tipo={s.senal.tipo} valor={s.senal.valor} />}
    </motion.article>
  )
}

export function Velocimetro({ config, onSalir, onTerminar }: { config: ConfigPartida; onSalir: () => void; onTerminar: (r: ResultadoPartida) => void }) {
  const info = juegoPorId('velocimetro')
  const registrar = useJuego((s) => s.registrarRespuesta)
  const sumarXp = useJuego((s) => s.sumarXp)
  const terminar = usePartida(config, onTerminar)
  const { avisarCombo, saltar, capa } = useEfectos()
  const lista = useMemo(() => elegirParaRepaso(SITUACIONES_VELOCIDAD, info.rondas), [info.rondas])
  const st = useRef({ aciertos: 0, combo: 0, mejorCombo: 0, puntos: 0, xp: 0, fallos: [] as ResultadoPartida['fallos'], t0: Date.now() }).current
  const [i, setI] = useState(0)
  const [valor, setValor] = useState(0)
  const [fallo, setFallo] = useState<null | { s: SituacionVelocidad; marcado: number }>(null)
  const [anterior, setAnterior] = useState<SituacionVelocidad | null>(null)
  const zonaRef = useRef<HTMLDivElement>(null)
  const s = lista[i]

  function avanzar() {
    if (i + 1 >= lista.length) {
      terminar(st.aciertos, lista.length, st.xp, st.mejorCombo, st.fallos, st.puntos)
      return
    }
    setFallo(null)
    setValor(0)
    setI(i + 1)
    st.t0 = Date.now()
  }

  function fijar() {
    if (fallo || !s) return
    const ok = valor === s.respuesta
    registrar(s.id, ok, ok ? null : 'numero_velocidad', Date.now() - st.t0)
    if (ok) {
      const c = ++st.combo
      const ganados = 15 * multiplicador(c)
      st.aciertos++
      st.mejorCombo = Math.max(st.mejorCombo, c)
      st.puntos += ganados
      st.xp += 7
      sumarXp(7)
      sfx.acierto(Math.min(c, 6))
      vibrar(20)
      const r = zonaRef.current?.getBoundingClientRect()
      if (r) {
        explosion(r.left + r.width / 2, r.top + r.height * 0.45, 22 + c * 2)
        saltar(r.left + r.width / 2 - 40, r.top + 10, `¡Clavado! +${ganados}`)
      }
      avisarCombo(c)
      setAnterior(s)
      avanzar()
    } else {
      st.combo = 0
      sfx.fallo()
      vibrar(80)
      const enunciado = `${NOMBRE_VIA[s.via]}, ${NOMBRE_VEHICULO[s.vehiculo].toLowerCase()}${s.detalle ? ` (${s.detalle.toLowerCase()})` : ''}${s.senal ? `, señal de ${s.senal.tipo === 'maxima' ? 'máxima' : 'mínima'} ${s.senal.valor}` : ''}: ¿velocidad ${s.pide === 'maxima' ? 'máxima' : 'mínima'}?`
      st.fallos.push({ pregunta: preguntaFicticia(s.id, 'velocidad', enunciado, `${s.respuesta} km/h`, s.fuente), elegida: `${valor} km/h` })
      setAnterior(null)
      setFallo({ s, marcado: valor })
    }
  }

  const cambiar = (v: number) => !fallo && setValor(Math.max(0, Math.min(MAX, v)))

  return (
    <main className="juego">
      <BarraJuego titulo={info.nombre} onSalir={onSalir} ronda={i} total={lista.length} puntos={st.puntos} combo={st.combo} />
      <p className="consigna"><b>Gira la aguja hasta el límite exacto</b> y pulsa «Fijar».</p>

      <AnimatePresence mode="wait">{s && <Situacion key={s.id} s={s} />}</AnimatePresence>

      <div ref={zonaRef} className="zona-dial">
        <Dial valor={valor} onCambiar={cambiar} correcto={fallo ? fallo.s.respuesta : null} bloqueado={!!fallo} />
      </div>

      <div className="controles-dial">
        <button className="boton secundario" onClick={() => { sfx.toque(); cambiar(valor - 5) }} disabled={!!fallo} aria-label="Bajar 5 km/h">−5</button>
        <button className="boton" onClick={fijar} disabled={!!fallo}>Fijar velocidad</button>
        <button className="boton secundario" onClick={() => { sfx.toque(); cambiar(valor + 5) }} disabled={!!fallo} aria-label="Subir 5 km/h">+5</button>
      </div>

      <AnimatePresence>
        {anterior && !fallo && (
          <motion.p key={anterior.id} className="anterior pegatina" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}>
            <Check /> <span><b>{anterior.respuesta} km/h.</b> {anterior.explicacion}</span>
          </motion.p>
        )}
      </AnimatePresence>

      {fallo && <div className="hoja-espacio" />}
      <AnimatePresence>
        {fallo && (
          <motion.section key="hoja" className="hoja mal" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}>
            <h3><Cruz /> Era {fallo.s.respuesta} km/h</h3>
            <span className="rotulo">Tú marcaste {fallo.marcado} km/h</span>
            <p>{fallo.s.explicacion}</p>
            <span className="fuente">Norma: {fallo.s.fuente}</span>
            <button className="boton" autoFocus onClick={() => { sfx.toque(); avanzar() }}>
              {i + 1 >= lista.length ? 'Ver resultado' : 'Siguiente'}
            </button>
          </motion.section>
        )}
      </AnimatePresence>
      {capa}
    </main>
  )
}
