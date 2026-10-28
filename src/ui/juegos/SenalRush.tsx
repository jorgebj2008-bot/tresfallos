import { useRef, useState } from 'react'
import { AnimatePresence, motion, type PanInfo } from 'motion/react'
import { NOMBRE_CATEGORIA, SENALES, senalPorId, type Categoria, type Senal } from '../../content/senales'
import { juegoPorId, multiplicador, preguntaFicticia, siguienteDificultad } from '../../game/juegos'
import { useJuego } from '../../store/useJuego'
import { estaVencida } from '../../learning/sm2'
import { sfx, vibrar } from '../../audio/sfx'
import { explosion } from '../particulas'
import { BarraJuego, useEfectos, usePartida } from './Marco'
import type { ConfigPartida, ResultadoPartida } from '../Nivel'
import { SenalSVG } from '../SenalSVG'
import { Cruz } from '../iconos'

// Categorías que más se confunden entre sí: el distractor sale de aquí.
const CONFUNDE: Record<Categoria, Categoria[]> = {
  peligro: ['prioridad', 'prohibicion'],
  prohibicion: ['obligacion', 'fin'],
  obligacion: ['prohibicion', 'indicacion'],
  indicacion: ['obligacion', 'peligro'],
  prioridad: ['peligro', 'prohibicion'],
  fin: ['prohibicion', 'indicacion'],
}

interface Reto {
  n: number
  senal: Senal
  modo: 'categoria' | 'significado'
  izq: string
  der: string
  correcta: 'izq' | 'der'
}

function crearReto(n: number, dif: number, anterior: string | null): Reto {
  const { estados } = useJuego.getState()
  const ahora = Date.now()
  // Primero las que toca repasar o se fallaron; si no, cualquiera.
  const pendientes = SENALES.filter((s) => s.id !== anterior && estados[`SEN-${s.id}`] && (estaVencida(estados[`SEN-${s.id}`], ahora) || estados[`SEN-${s.id}`].repeticiones === 0))
  const pool = pendientes.length && Math.random() < 0.5 ? pendientes : SENALES.filter((s) => s.id !== anterior)
  const senal = pool[Math.floor(Math.random() * pool.length)]
  const modo = dif <= 2 || Math.random() < 0.4 ? 'categoria' : 'significado'
  let buena: string, mala: string
  if (modo === 'categoria') {
    buena = NOMBRE_CATEGORIA[senal.categoria]
    const ops = CONFUNDE[senal.categoria]
    mala = NOMBRE_CATEGORIA[ops[Math.floor(Math.random() * ops.length)]]
  } else {
    buena = senal.nombre
    const parecidas = senal.parecidas.length ? senal.parecidas.map(senalPorId) : SENALES.filter((s) => s.categoria === senal.categoria && s.id !== senal.id)
    mala = parecidas[Math.floor(Math.random() * parecidas.length)].nombre
  }
  const correcta = Math.random() < 0.5 ? 'izq' : 'der'
  return { n, senal, modo, izq: correcta === 'izq' ? buena : mala, der: correcta === 'der' ? buena : mala, correcta }
}

export function SenalRush({ config, onSalir, onTerminar }: { config: ConfigPartida; onSalir: () => void; onTerminar: (r: ResultadoPartida) => void }) {
  const info = juegoPorId('senales')
  const registrar = useJuego((s) => s.registrarRespuesta)
  const sumarXp = useJuego((s) => s.sumarXp)
  const terminar = usePartida(config, onTerminar)
  const { avisarCombo, saltar, capa } = useEfectos()
  const st = useRef({ dif: 1, racha: 0, aciertos: 0, combo: 0, mejorCombo: 0, puntos: 0, xp: 0, fallos: [] as ResultadoPartida['fallos'], t0: Date.now() }).current
  const [reto, setReto] = useState<Reto>(() => crearReto(0, 1, null))
  const [respuesta, setRespuesta] = useState<null | { lado: 'izq' | 'der' | 'tiempo'; ok: boolean }>(null)
  const [, repintar] = useState(0)
  const zonaRef = useRef<HTMLDivElement>(null)

  const duracion = Math.max(1.8, 4.6 - 0.45 * (st.dif - 1) - 0.04 * st.combo)

  function siguiente() {
    if (reto.n + 1 >= info.rondas) {
      terminar(st.aciertos, info.rondas, st.xp, st.mejorCombo, st.fallos, st.puntos)
      return
    }
    setRespuesta(null)
    setReto(crearReto(reto.n + 1, st.dif, reto.senal.id))
    st.t0 = Date.now()
  }

  function responder(lado: 'izq' | 'der' | 'tiempo') {
    if (respuesta) return
    const ok = lado === reto.correcta
    setRespuesta({ lado, ok })
    registrar(`SEN-${reto.senal.id}`, ok, ok ? null : 'confunde_senales', Date.now() - st.t0)
    if (ok) {
      const c = ++st.combo
      const ganados = 10 * multiplicador(c)
      st.aciertos++
      st.mejorCombo = Math.max(st.mejorCombo, c)
      st.puntos += ganados
      st.xp += 4
      sumarXp(4)
      st.racha++
      st.dif = siguienteDificultad(st.dif, true, st.racha)
      sfx.acierto(Math.min(c, 6))
      vibrar(20)
      const r = zonaRef.current?.getBoundingClientRect()
      if (r) {
        explosion(lado === 'izq' ? r.left + r.width * 0.2 : r.left + r.width * 0.8, r.top + r.height * 0.6, 16 + c * 2)
        saltar(lado === 'izq' ? r.left + 20 : r.right - 90, r.top + r.height * 0.5, `+${ganados}`)
      }
      avisarCombo(c)
      setTimeout(siguiente, 380)
    } else {
      st.combo = 0
      st.racha = 0
      st.dif = siguienteDificultad(st.dif, false, 0)
      sfx.fallo()
      vibrar(80)
      const buena = reto.correcta === 'izq' ? reto.izq : reto.der
      st.fallos.push({
        pregunta: preguntaFicticia(`SEN-${reto.senal.id}`, 'senales', reto.modo === 'categoria' ? `¿De qué tipo es la señal «${reto.senal.nombre}»?` : '¿Qué señal es esta?', buena, 'Catálogo oficial de señales'),
        elegida: lado === 'tiempo' ? 'Se te pasó' : lado === 'izq' ? reto.izq : reto.der,
      })
    }
    repintar((n) => n + 1)
  }

  const alSoltar = (_: unknown, i: PanInfo) => {
    if (i.offset.x < -60 || i.velocity.x < -500) responder('izq')
    else if (i.offset.x > 60 || i.velocity.x > 500) responder('der')
  }

  const vuelo = respuesta && respuesta.lado !== 'tiempo' ? { x: respuesta.lado === 'izq' ? -260 : 260, rotate: respuesta.lado === 'izq' ? -30 : 30, opacity: 0 } : null

  return (
    <main className="juego">
      <BarraJuego titulo={info.nombre} onSalir={onSalir} ronda={reto.n + (respuesta?.ok ? 1 : 0)} total={info.rondas} puntos={st.puntos} combo={st.combo} />
      <p className="consigna">
        <b>{reto.modo === 'categoria' ? '¿De qué tipo es?' : '¿Qué señal es?'}</b> Desliza la señal o toca un lado.
      </p>

      <div ref={zonaRef} className="pista-senales pegatina" style={{ animationDuration: `${duracion / 3}s` }}>
        <AnimatePresence mode="popLayout">
          {!(respuesta && !respuesta.ok) && (
            <motion.div
              key={reto.n}
              className="senal-cayendo"
              drag={respuesta ? false : 'x'}
              dragSnapToOrigin
              onDragEnd={alSoltar}
              initial={{ top: '-4%', scale: 0.55, x: 0 }}
              animate={vuelo ?? { top: '62%', scale: 1.15 }}
              transition={vuelo ? { duration: 0.3 } : { duration: duracion, ease: 'linear' }}
              onAnimationComplete={() => !respuesta && responder('tiempo')}
            >
              <SenalSVG id={reto.senal.id} size={120} titulo={reto.senal.nombre} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="opciones-lado">
        <button className={`opcion-lado ${respuesta && reto.correcta === 'izq' && !respuesta.ok ? 'era' : ''}`} onClick={() => responder('izq')} disabled={!!respuesta}>
          <span aria-hidden="true">←</span> {reto.izq}
        </button>
        <button className={`opcion-lado ${respuesta && reto.correcta === 'der' && !respuesta.ok ? 'era' : ''}`} onClick={() => responder('der')} disabled={!!respuesta}>
          {reto.der} <span aria-hidden="true">→</span>
        </button>
      </div>

      {respuesta && !respuesta.ok && <div className="hoja-espacio" />}
      <AnimatePresence>
        {respuesta && !respuesta.ok && (
          <motion.section key="hoja" className="hoja mal" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}>
            <div className="hoja-senal">
              <SenalSVG id={reto.senal.id} size={84} titulo={reto.senal.nombre} />
              <div>
                <h3><Cruz /> {respuesta.lado === 'tiempo' ? '¡Se te pasó!' : 'No era esa'}</h3>
                <p><b>{reto.senal.nombre}</b> · {NOMBRE_CATEGORIA[reto.senal.categoria]}</p>
              </div>
            </div>
            <p>{reto.senal.significado}</p>
            {reto.senal.parecidas[0] && <p className="fuente">No la confundas con: {reto.senal.parecidas.map((id) => senalPorId(id).nombre).join(', ')}.</p>}
            <button className="boton" autoFocus onClick={() => { sfx.toque(); siguiente() }}>
              {reto.n + 1 >= info.rondas ? 'Ver resultado' : 'Seguir'}
            </button>
          </motion.section>
        )}
      </AnimatePresence>
      {capa}
    </main>
  )
}
