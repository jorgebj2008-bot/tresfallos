import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from 'motion/react'
import { AFIRMACIONES, type Afirmacion } from '../../content/afirmaciones'
import { juegoPorId, multiplicador, preguntaFicticia, siguienteDificultad } from '../../game/juegos'
import { barajar } from '../../game/nivel'
import { useJuego } from '../../store/useJuego'
import { estaVencida } from '../../learning/sm2'
import { sfx, vibrar } from '../../audio/sfx'
import { explosion } from '../particulas'
import { BarraJuego, useEfectos, usePartida } from './Marco'
import type { ConfigPartida, ResultadoPartida } from '../Nivel'
import { Check, Cruz } from '../iconos'

/** Elige afirmaciones: primero las que toca repasar, luego nuevas (del mundo si lo hay) y el resto. */
function elegir(n: number, mundo?: string): Afirmacion[] {
  const { estados } = useJuego.getState()
  const ahora = Date.now()
  const vencidas = AFIRMACIONES.filter((a) => estados[a.id] && estaVencida(estados[a.id], ahora))
  const nuevasMundo = barajar(AFIRMACIONES.filter((a) => !estados[a.id] && a.mundo === mundo))
  const nuevas = barajar(AFIRMACIONES.filter((a) => !estados[a.id]))
  const resto = [...AFIRMACIONES].sort((a, b) => (estados[a.id]?.proxima ?? 0) - (estados[b.id]?.proxima ?? 0))
  const out: Afirmacion[] = []
  for (const a of [...vencidas, ...nuevasMundo, ...nuevas, ...resto]) {
    if (out.length >= n) break
    if (!out.includes(a)) out.push(a)
  }
  return barajar(out)
}

function Carta({ a, onSoltar, bloqueada }: { a: Afirmacion; onSoltar: (v: boolean) => void; bloqueada: boolean }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-14, 14])
  const verdad = useTransform(x, [20, 110], [0, 1])
  const trampa = useTransform(x, [-110, -20], [1, 0])
  const alSoltar = (_: unknown, i: PanInfo) => {
    if (i.offset.x > 90 || i.velocity.x > 600) onSoltar(true)
    else if (i.offset.x < -90 || i.velocity.x < -600) onSoltar(false)
  }
  return (
    <motion.article className="carta pegatina" style={{ x, rotate }} drag={bloqueada ? false : 'x'} dragSnapToOrigin onDragEnd={alSoltar}
      initial={{ scale: 0.85, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}>
      <motion.span className="sello sello-verdad" style={{ opacity: verdad }}>VERDAD</motion.span>
      <motion.span className="sello sello-trampa" style={{ opacity: trampa }}>TRAMPA</motion.span>
      <p>{a.texto}</p>
    </motion.article>
  )
}

export function VerdadTrampa({ config, onSalir, onTerminar }: { config: ConfigPartida; onSalir: () => void; onTerminar: (r: ResultadoPartida) => void }) {
  const info = juegoPorId('verdad')
  const registrar = useJuego((s) => s.registrarRespuesta)
  const sumarXp = useJuego((s) => s.sumarXp)
  const terminar = usePartida(config, onTerminar)
  const { avisarCombo, saltar, capa } = useEfectos()
  const lista = useMemo(() => elegir(info.rondas, config.tipo === 'juego' ? config.mundo : undefined), [info.rondas, config])
  const st = useRef({ dif: 1, racha: 0, aciertos: 0, combo: 0, mejorCombo: 0, puntos: 0, xp: 0, fallos: [] as ResultadoPartida['fallos'], t0: Date.now() }).current
  const [i, setI] = useState(0)
  const [fallo, setFallo] = useState<null | { a: Afirmacion; tiempo: boolean }>(null)
  const [anterior, setAnterior] = useState<Afirmacion | null>(null)
  const [, repintar] = useState(0)
  const zonaRef = useRef<HTMLDivElement>(null)
  const a = lista[i]
  const segundos = Math.max(7, 13 - st.dif)

  function avanzar() {
    if (i + 1 >= lista.length) {
      terminar(st.aciertos, lista.length, st.xp, st.mejorCombo, st.fallos, st.puntos)
      return
    }
    setFallo(null)
    setI(i + 1)
    st.t0 = Date.now()
  }

  function responder(diceVerdad: boolean | null) {
    if (fallo || !a) return
    const ok = diceVerdad === a.verdadera
    registrar(a.id, ok, ok ? null : a.error_tipo, Date.now() - st.t0)
    if (ok) {
      const c = ++st.combo
      const ganados = 10 * multiplicador(c)
      st.aciertos++
      st.mejorCombo = Math.max(st.mejorCombo, c)
      st.puntos += ganados
      st.xp += 6
      sumarXp(6)
      st.racha++
      st.dif = siguienteDificultad(st.dif, true, st.racha)
      sfx.acierto(Math.min(c, 6))
      vibrar(20)
      const r = zonaRef.current?.getBoundingClientRect()
      if (r) {
        explosion(r.left + (diceVerdad ? r.width * 0.8 : r.width * 0.2), r.top + r.height / 2, 18 + c * 2)
        saltar(r.left + r.width / 2 - 30, r.top + 10, `+${ganados}`)
      }
      avisarCombo(c)
      setAnterior(a)
      repintar((n) => n + 1)
      avanzar()
    } else {
      st.combo = 0
      st.racha = 0
      st.dif = siguienteDificultad(st.dif, false, 0)
      sfx.fallo()
      vibrar(80)
      st.fallos.push({
        pregunta: preguntaFicticia(a.id, a.mundo, `¿Verdad o trampa? «${a.texto}»`, a.verdadera ? 'Verdad' : 'Trampa', a.fuente),
        elegida: diceVerdad === null ? 'Se acabó el tiempo' : diceVerdad ? 'Verdad' : 'Trampa',
      })
      setAnterior(null)
      setFallo({ a, tiempo: diceVerdad === null })
    }
  }

  return (
    <main className="juego">
      <BarraJuego titulo={info.nombre} onSalir={onSalir} ronda={i} total={lista.length} puntos={st.puntos} combo={st.combo} />
      <p className="consigna"><b>¿Es verdad o es una trampa?</b> Desliza la carta: derecha verdad, izquierda trampa.</p>

      <div className="tiempo-carta">
        {!fallo && a && <motion.i key={i} initial={{ width: '100%' }} animate={{ width: '0%' }} transition={{ duration: segundos, ease: 'linear' }} onAnimationComplete={() => responder(null)} />}
      </div>

      <div ref={zonaRef} className="mesa-cartas">
        <AnimatePresence mode="wait">{a && <Carta key={a.id} a={a} bloqueada={!!fallo} onSoltar={responder} />}</AnimatePresence>
      </div>

      <div className="opciones-lado">
        <button className="opcion-lado trampa" onClick={() => responder(false)} disabled={!!fallo}><Cruz /> Trampa</button>
        <button className="opcion-lado verdad" onClick={() => responder(true)} disabled={!!fallo}>Verdad <Check /></button>
      </div>

      <AnimatePresence>
        {anterior && !fallo && (
          <motion.p key={anterior.id} className="anterior pegatina" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}>
            <Check /> <span><b>{anterior.verdadera ? 'Era verdad.' : 'Era trampa.'}</b> {anterior.explicacion}</span>
          </motion.p>
        )}
      </AnimatePresence>

      {fallo && <div className="hoja-espacio" />}
      <AnimatePresence>
        {fallo && (
          <motion.section key="hoja" className="hoja mal" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}>
            <h3><Cruz /> {fallo.tiempo ? 'Se acabó el tiempo' : fallo.a.verdadera ? 'Era verdad' : 'Era una trampa'}</h3>
            <p>{fallo.a.explicacion}</p>
            <span className="fuente">Norma: {fallo.a.fuente}</span>
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
