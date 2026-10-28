import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  NOMBRE_BRAZO, generar, motivoEspera, nombreVehiculo, puedePasar, trayectoria,
  type Arista, type Brazo, type Escenario, type Peaton, type Regla, type Solucion, type Vehiculo,
} from '../../game/prioridad'
import { juegoPorId, multiplicador, preguntaFicticia, siguienteDificultad } from '../../game/juegos'
import { useJuego } from '../../store/useJuego'
import { sfx, vibrar } from '../../audio/sfx'
import { explosion } from '../particulas'
import { BarraJuego, useEfectos, usePartida } from './Marco'
import type { ConfigPartida, ResultadoPartida } from '../Nivel'
import { Check, Cruz } from '../iconos'

// Cruce: cuadrado de 120 px en el centro de un lienzo de 400 × 400. 1 unidad = 60 px.
const U = 60
const pant = (p: { x: number; y: number }) => ({ x: 200 + p.x * U, y: 200 - p.y * U })
const giros = (b: Brazo) => (2 - b + 4) % 4
const rotar = (p: { x: number; y: number }, b: Brazo) => {
  let { x, y } = p
  for (let k = 0; k < giros(b); k++) [x, y] = [-y, x]
  return { x, y }
}
const anguloEspera = (b: Brazo) => -90 * giros(b)

const ERROR_DE_REGLA: Record<Regla, string> = {
  derecha: 'prioridad_derecha', senal: 'prioridad_senales', izquierda: 'giro_izquierda',
  urgencia: 'prioridad_urgencia', semaforo: 'jerarquia_senales', agente: 'jerarquia_senales', peaton: 'prioridad_peaton',
}
const PISTA: Record<Escenario['tipo'], string> = {
  'sin-senales': 'Cruce sin señales.',
  senales: 'Fíjate en las señales de cada calle.',
  semaforo: 'Cruce con semáforos.',
  agente: 'Un agente regula el cruce.',
  urgencia: 'Se acerca una ambulancia en servicio de urgencia.',
  peaton: 'Hay un peatón cruzando.',
}
const MOV = { recto: 'sigue recto', derecha: 'gira a la derecha', izquierda: 'gira a la izquierda' }

/** Recorrido completo de un vehículo: espera → cruce → salida, en coordenadas de pantalla. */
function recorrido(v: Vehiculo, hasta = 1) {
  const t = trayectoria(v.brazo, v.mov, 12)
  const ultimo = t[t.length - 1], penult = t[t.length - 2]
  const dx = ultimo.x - penult.x, dy = ultimo.y - penult.y, l = Math.hypot(dx, dy)
  const pts = [rotar({ x: 0.5, y: -1.8 }, v.brazo), ...t, { x: ultimo.x + (dx / l) * 2.6, y: ultimo.y + (dy / l) * 2.6 }].map(pant)
  const corte = pts.slice(0, Math.max(2, Math.round(pts.length * hasta)))
  const angs: number[] = []
  let prev = anguloEspera(v.brazo)
  corte.forEach((_, i) => {
    const q = corte[Math.min(i + 1, corte.length - 1)], o = corte[Math.max(i - 1, 0)]
    let a = (Math.atan2(q.x - o.x, -(q.y - o.y)) * 180) / Math.PI
    while (a - prev > 180) a -= 360
    while (a - prev < -180) a += 360
    angs.push(i === 0 ? prev : a)
    prev = angs[angs.length - 1]
  })
  return { xs: corte.map((p) => p.x), ys: corte.map((p) => p.y), rs: angs }
}

function DibujoVehiculo({ v }: { v: Vehiculo }) {
  const L = '#1E1B2E'
  const lado = v.mov === 'derecha' ? 1 : v.mov === 'izquierda' ? -1 : 0
  return (
    <g>
      {v.tipo === 'coche' && (
        <>
          <rect x={-13} y={-22} width={26} height={44} rx={8} fill={v.color} stroke={L} strokeWidth={3} />
          <rect x={-9.5} y={-13} width={19} height={9} rx={3} fill="#CFEAFF" stroke={L} strokeWidth={2} />
          <rect x={-9.5} y={9} width={19} height={6} rx={2} fill="#CFEAFF" stroke={L} strokeWidth={2} />
        </>
      )}
      {v.tipo === 'ambulancia' && (
        <>
          <rect x={-14} y={-25} width={28} height={50} rx={6} fill="#fff" stroke={L} strokeWidth={3} />
          <path d="M0-4V12M-8 4H8" stroke="#E3262E" strokeWidth={5} />
          <rect x={-10} y={-18} width={9} height={5} rx={1.5} fill="#3DA5FF" className="destello" />
          <rect x={1} y={-18} width={9} height={5} rx={1.5} fill="#E3262E" className="destello-alt" />
        </>
      )}
      {(v.tipo === 'moto' || v.tipo === 'bici') && (
        <>
          <rect x={v.tipo === 'moto' ? -6 : -3.5} y={-20} width={v.tipo === 'moto' ? 12 : 7} height={40} rx={5} fill={v.tipo === 'moto' ? v.color : '#555B78'} stroke={L} strokeWidth={2.5} />
          <circle cy={2} r={9} fill={v.color} stroke={L} strokeWidth={2.5} />
          <circle cy={2} r={4} fill="#FFD5B0" />
        </>
      )}
      {lado !== 0 && <circle cx={lado * 11} cy={-19} r={4.5} fill="#FF9F1C" stroke={L} strokeWidth={1.5} className="destello" />}
    </g>
  )
}

function DibujoPeaton() {
  return (
    <g>
      <circle r={13} fill="#FFD23F" stroke="#1E1B2E" strokeWidth={3} />
      <circle cy={-3} r={5} fill="#FFD5B0" stroke="#1E1B2E" strokeWidth={2} />
      <path d="M-5 8h10" stroke="#1E1B2E" strokeWidth={3} strokeLinecap="round" />
    </g>
  )
}

/** Fondo del cruce: calzadas, marcas, pasos de peatones, señales, semáforos y agente. */
function Cruce({ esc }: { esc: Escenario }) {
  const L = '#1E1B2E'
  return (
    <g>
      <rect width={400} height={400} fill="#9EE6B0" />
      <rect x={140} y={0} width={120} height={400} fill="#4A4E69" />
      <rect x={0} y={140} width={400} height={120} fill="#4A4E69" />
      <path d="M140 0V140H0M260 0V140H400M140 400V260H0M260 400V260H400" fill="none" stroke={L} strokeWidth={3} />
      <path d="M200 0V140M200 260V400M0 200H140M260 200H400" stroke="#fff" strokeWidth={3} strokeDasharray="14 12" />
      {esc.peatones.map((p) => {
        const a = pant(rotar({ x: -1, y: -1.3 }, p.brazo)), b = pant(rotar({ x: 1, y: -1.3 }, p.brazo))
        const horizontal = Math.abs(a.y - b.y) < 1
        return (
          <g key={`cz${p.id}`}>
            {Array.from({ length: 6 }, (_, k) => {
              const t = (k + 0.5) / 6
              const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t
              return <rect key={k} x={horizontal ? x - 5 : x - 14} y={horizontal ? y - 14 : y - 5} width={horizontal ? 10 : 28} height={horizontal ? 28 : 10} fill="#fff" />
            })}
          </g>
        )
      })}
      {([0, 1, 2, 3] as Brazo[]).map((b) => {
        const c = esc.controles[b]
        if (c === 'ninguna') return null
        const pos = pant(rotar({ x: 1.45, y: -1.55 }, b))
        const l1 = pant(rotar({ x: 0, y: -1.05 }, b)), l2 = pant(rotar({ x: 1, y: -1.05 }, b))
        return (
          <g key={`c${b}`}>
            {(c === 'stop' || c === 'ceda') && (
              <path d={`M${l1.x} ${l1.y}L${l2.x} ${l2.y}`} stroke="#fff" strokeWidth={c === 'stop' ? 5 : 4} strokeDasharray={c === 'ceda' ? '7 5' : undefined} />
            )}
            <g transform={`translate(${pos.x} ${pos.y})`}>
              {c === 'stop' && (
                <>
                  <polygon points="-8,-19 8,-19 19,-8 19,8 8,19 -8,19 -19,8 -19,-8" fill="#E3262E" stroke="#fff" strokeWidth={2.5} />
                  <text y={4} textAnchor="middle" fontSize={10} fontWeight={900} fill="#fff" fontFamily="Arial">STOP</text>
                </>
              )}
              {c === 'ceda' && <path d="M-19-15H19L0 18Z" fill="#fff" stroke="#E3262E" strokeWidth={6} strokeLinejoin="round" />}
              {(c === 'verde' || c === 'rojo') && (
                <>
                  <rect x={-11} y={-27} width={22} height={46} rx={5} fill="#2A2D3E" stroke={L} strokeWidth={2} />
                  <circle cy={-15} r={7} fill={c === 'rojo' ? '#FF3B3B' : '#4A1515'} />
                  <circle cy={5} r={7} fill={c === 'verde' ? '#2BE07A' : '#123A22'} />
                  <rect x={-17} y={22} width={34} height={13} rx={3} fill="#fff" stroke={L} strokeWidth={1.5} />
                  <text y={32} textAnchor="middle" fontSize={9} fontWeight={900} fill={L} fontFamily="Arial">{c === 'rojo' ? 'ROJO' : 'VERDE'}</text>
                </>
              )}
            </g>
          </g>
        )
      })}
      {esc.agente && (
        <g transform="translate(70 70)">
          <circle r={20} fill="#1C64C8" stroke={L} strokeWidth={3} />
          <circle cy={-6} r={7} fill="#FFD5B0" stroke={L} strokeWidth={2} />
          <rect x={-9} y={-16} width={18} height={5} rx={2} fill="#fff" stroke={L} strokeWidth={1.5} />
          <path d={esc.agente.includes(1) ? 'M-34 6H34' : 'M0-34V34'} stroke="#fff" strokeWidth={5} strokeLinecap="round" />
        </g>
      )}
    </g>
  )
}

interface Ronda {
  esc: Escenario
  sol: Solucion
}

export function ReyDelCruce({ config, onSalir, onTerminar }: { config: ConfigPartida; onSalir: () => void; onTerminar: (r: ResultadoPartida) => void }) {
  const info = juegoPorId('cruce')
  const registrar = useJuego((s) => s.registrarRespuesta)
  const sumarXp = useJuego((s) => s.sumarXp)
  const terminar = usePartida(config, onTerminar)
  const { avisarCombo, saltar, capa } = useEfectos()
  const svgRef = useRef<SVGSVGElement>(null)

  // Marcador en una referencia: los temporizadores siempre leen el valor actual.
  const st = useRef({ dif: 1, racha: 0, nRonda: 0, aciertos: 0, combo: 0, mejorCombo: 0, puntos: 0, xp: 0, fallos: [] as ResultadoPartida['fallos'] }).current
  const [, repintar] = useState(0)
  const [ronda, setRonda] = useState<Ronda>(() => generar(1))
  const [hechos, setHechos] = useState<string[]>([])
  const [fase, setFase] = useState<'jugando' | 'bien' | 'choque' | 'explicacion'>('jugando')
  const [motivo, setMotivo] = useState<{ tocado: string; arista: Arista } | null>(null)

  const { esc, sol } = ronda
  const ids = useMemo(() => [...esc.vehiculos.map((v) => v.id), ...esc.peatones.map((p) => p.id)], [esc])
  const nombre = (id: string) => (id.startsWith('p') ? 'el peatón' : nombreVehiculo(esc.vehiculos.find((v) => v.id === id)!))
  const ordenCorrecto = useMemo(() => {
    const h = new Set<string>(), out: string[] = []
    while (out.length < ids.length) {
      const id = ids.find((x) => !h.has(x) && puedePasar(x, h, sol.aristas))!
      h.add(id)
      out.push(id)
    }
    return out
  }, [ids, sol])

  function siguienteRonda(nuevaDif: number) {
    if (st.nRonda + 1 >= info.rondas) {
      terminar(st.aciertos, info.rondas, st.xp, st.mejorCombo, st.fallos, st.puntos)
      return
    }
    st.nRonda++
    st.dif = nuevaDif
    setRonda(generar(nuevaDif))
    setHechos([])
    setMotivo(null)
    setFase('jugando')
  }

  function tocar(id: string, e: React.MouseEvent) {
    if (fase !== 'jugando' || hechos.includes(id)) return
    const ya = new Set(hechos)
    if (puedePasar(id, ya, sol.aristas)) {
      const nuevos = [...hechos, id]
      setHechos(nuevos)
      sfx.toque()
      vibrar(15)
      if (nuevos.length === ids.length) {
        // Ronda perfecta.
        const c = ++st.combo
        const ganados = 100 * multiplicador(c)
        const xpRonda = 15 + (c >= 3 ? 5 : 0)
        setFase('bien')
        st.aciertos++
        st.mejorCombo = Math.max(st.mejorCombo, c)
        st.puntos += ganados
        st.xp += xpRonda
        sumarXp(xpRonda)
        new Set(sol.aristas.map((a) => a.regla)).forEach((r) => registrar(`CRUCE-${r}`, true, null, 4000))
        setTimeout(() => {
          sfx.acierto(c)
          vibrar(30)
          const r = svgRef.current?.getBoundingClientRect()
          if (r) explosion(r.left + r.width / 2, r.top + r.height / 2, 30 + c * 3)
          saltar(e.clientX - 30, e.clientY - 30, `+${ganados}`)
          avisarCombo(c)
        }, 450)
        st.racha++
        setTimeout(() => siguienteRonda(siguienteDificultad(st.dif, true, st.racha)), 1500)
      }
      return
    }
    // Error: alguien tenía que pasar antes.
    const arista = motivoEspera(id, ya, sol.aristas)!
    setMotivo({ tocado: id, arista })
    setFase('choque')
    st.combo = 0
    st.racha = 0
    repintar((n) => n + 1)
    sfx.fallo()
    vibrar([80, 40, 120])
    registrar(`CRUCE-${arista.regla}`, false, ERROR_DE_REGLA[arista.regla], 4000)
    st.fallos.push(
      {
        pregunta: preguntaFicticia(`CRUCE-${st.nRonda}`, 'prioridad', `Rey del Cruce: ${nombre(id)} quiso pasar antes que ${nombre(arista.antes)}.`, arista.texto, arista.fuente),
        elegida: `Dejar pasar primero a ${nombre(id)}`,
      },
    )
    setTimeout(() => setFase('explicacion'), 1100)
  }

  const chocando = fase === 'choque' || fase === 'explicacion'

  return (
    <main className="juego">
      <BarraJuego titulo={info.nombre} onSalir={onSalir} ronda={st.nRonda + (fase === 'bien' ? 1 : 0)} total={info.rondas} puntos={st.puntos} combo={st.combo} />
      <p className="consigna">
        <b>{PISTA[esc.tipo]}</b> Toca en orden quién pasa primero.
      </p>
      {esc.agente && <p className="globo-agente">El agente da paso a quien viene del {esc.agente.map((b) => NOMBRE_BRAZO[b]).join(' y del ')}.</p>}

      <motion.div className="lienzo-cruce pegatina" animate={chocando ? { x: [0, -8, 7, -5, 3, 0] } : { x: 0 }} transition={{ duration: 0.45 }}>
        <svg ref={svgRef} viewBox="0 0 400 400" role="img" aria-label="Cruce visto desde arriba">
          <Cruce esc={esc} />
          {/* Flechas con la trayectoria que quiere seguir cada vehículo */}
          {esc.vehiculos.filter((v) => !hechos.includes(v.id)).map((v) => {
            const pts = trayectoria(v.brazo, v.mov, 16).map(pant)
            const d = 'M' + pts.map((p) => `${p.x} ${p.y}`).join('L')
            const a = pts[pts.length - 2], b = pts[pts.length - 1]
            const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
            return (
              <g key={`f${v.id}`} opacity={0.75}>
                <path d={d} fill="none" stroke={v.color === '#FFFFFF' ? '#E3262E' : v.color} strokeWidth={5} strokeDasharray="8 7" strokeLinecap="round" />
                <path d="M-8-8L6 0L-8 8Z" transform={`translate(${b.x} ${b.y}) rotate(${ang})`} fill={v.color === '#FFFFFF' ? '#E3262E' : v.color} stroke="#1E1B2E" strokeWidth={1.5} />
              </g>
            )
          })}
          {esc.peatones.map((p: Peaton) => {
            const ini = pant(rotar({ x: -1.25, y: -1.3 }, p.brazo)), fin = pant(rotar({ x: 1.25, y: -1.3 }, p.brazo))
            const cruzando = hechos.includes(p.id)
            return (
              <motion.g key={p.id} initial={false} animate={cruzando ? { x: fin.x, y: fin.y } : { x: ini.x, y: ini.y }} transition={{ duration: 1.1 }}
                onClick={(e) => tocar(p.id, e)} style={{ cursor: 'pointer' }} role="button" aria-label="Peatón">
                <circle r={30} fill="transparent" />
                <DibujoPeaton />
              </motion.g>
            )
          })}
          {esc.vehiculos.map((v) => {
            const pasando = hechos.includes(v.id)
            const esChoque = chocando && motivo && (motivo.tocado === v.id || motivo.arista.antes === v.id)
            const r = recorrido(v, pasando ? 1 : esChoque ? 0.45 : 0)
            const destino = pasando || esChoque ? { x: r.xs, y: r.ys, rotate: r.rs } : { x: r.xs[0], y: r.ys[0], rotate: r.rs[0] }
            return (
              <motion.g key={v.id} initial={{ x: r.xs[0], y: r.ys[0], rotate: r.rs[0] }} animate={destino}
                transition={{ duration: pasando ? 1.2 : 0.7, ease: pasando ? 'easeIn' : 'easeOut' }}
                style={{ transformBox: 'fill-box', transformOrigin: 'center', cursor: 'pointer' }}
                onClick={(e) => tocar(v.id, e)} role="button" aria-label={`${nombreVehiculo(v)}, viene del ${NOMBRE_BRAZO[v.brazo]} y ${MOV[v.mov]}`}>
                <circle r={32} fill="transparent" />
                <DibujoVehiculo v={v} />
              </motion.g>
            )
          })}
          <AnimatePresence>
            {fase === 'choque' && (
              <motion.g key="pum" initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.3, 1], opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.5, duration: 0.35 }}
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                <path d="M200 140L214 176L252 168L226 196L256 224L216 222L208 262L190 228L152 244L172 210L140 186L180 182Z" fill="#FFD23F" stroke="#1E1B2E" strokeWidth={3} />
                <text x={200} y={208} textAnchor="middle" fontSize={22} fontWeight={900} fill="#1E1B2E" fontFamily="Baloo 2, sans-serif">¡PUM!</text>
              </motion.g>
            )}
          </AnimatePresence>
        </svg>
      </motion.div>

      <ul className="leyenda-cruce">
        {esc.vehiculos.map((v) => (
          <li key={v.id} className={hechos.includes(v.id) ? 'hecho' : ''}>
            <i style={{ background: v.color }} /> {nombreVehiculo(v)}: viene del {NOMBRE_BRAZO[v.brazo]} y {MOV[v.mov]}
          </li>
        ))}
      </ul>

      {fase === 'explicacion' && <div className="hoja-espacio" />}
      <AnimatePresence>
        {fase === 'explicacion' && motivo && (
          <motion.section key="hoja" className="hoja mal" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}>
            <h3><Cruz /> ¡Choque! Pasaba antes {nombre(motivo.arista.antes)}</h3>
            <p>{motivo.arista.texto}</p>
            <p><span className="rotulo">Orden correcto</span>{ordenCorrecto.map((id, i) => `${i + 1}. ${nombre(id)}`).join('  ·  ')}</p>
            <span className="fuente">Norma: {motivo.arista.fuente}</span>
            <button className="boton" autoFocus onClick={() => { sfx.toque(); siguienteRonda(siguienteDificultad(st.dif, false, 0)) }}>
              {st.nRonda + 1 >= info.rondas ? 'Ver resultado' : 'Siguiente cruce'}
            </button>
          </motion.section>
        )}
      </AnimatePresence>
      {fase === 'bien' && (
        <motion.div className="sello-bien" initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: -6 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.4 }}>
          <Check /> ¡Cruce perfecto!
        </motion.div>
      )}
      {capa}
    </main>
  )
}
