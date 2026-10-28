// Minijuego «Detective de Puntos»: cada caso es una infracción y tienes que adivinar
// cuántos puntos quita, qué multa tiene o si ya es delito. Entrena las sanciones.
import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CASOS_PUNTOS, OPCIONES_PISTA, PREGUNTA_PISTA, type CasoPuntos } from '../../content/puntos'
import { juegoPorId, multiplicador, preguntaFicticia } from '../../game/juegos'
import { useJuego } from '../../store/useJuego'
import { sfx, vibrar } from '../../audio/sfx'
import { explosion } from '../particulas'
import { BarraJuego, elegirParaRepaso, useEfectos, usePartida } from './Marco'
import type { ConfigPartida, ResultadoPartida } from '../Nivel'
import { Check, Cruz } from '../iconos'

/** Si respondes en menos de este tiempo, ganas puntos extra. */
const RAPIDO_MS = 5000

function Lupa() {
  return (
    <svg viewBox="0 0 48 48" width={44} height={44} aria-hidden="true">
      <circle cx={20} cy={20} r={13} fill="#CFEAFF" stroke="#1E1B2E" strokeWidth={4} />
      <path d="M14 15 a8 8 0 0 1 8 -4" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
      <path d="M30 30 L42 42" stroke="#1E1B2E" strokeWidth={7} strokeLinecap="round" />
      <path d="M30 30 L42 42" stroke="#FFB627" strokeWidth={3} strokeLinecap="round" />
    </svg>
  )
}

export function DetectivePuntos({ config, onSalir, onTerminar }: { config: ConfigPartida; onSalir: () => void; onTerminar: (r: ResultadoPartida) => void }) {
  const info = juegoPorId('puntos')
  const registrar = useJuego((s) => s.registrarRespuesta)
  const sumarXp = useJuego((s) => s.sumarXp)
  const terminar = usePartida(config, onTerminar)
  const { avisarCombo, saltar, capa } = useEfectos()
  const lista = useMemo(() => elegirParaRepaso(CASOS_PUNTOS, info.rondas), [info.rondas])
  const st = useRef({ aciertos: 0, combo: 0, mejorCombo: 0, puntos: 0, xp: 0, fallos: [] as ResultadoPartida['fallos'], t0: Date.now() }).current
  const [i, setI] = useState(0)
  const [fallo, setFallo] = useState<null | { c: CasoPuntos; elegida: string }>(null)
  const [anterior, setAnterior] = useState<CasoPuntos | null>(null)
  const caso = lista[i]

  function avanzar() {
    if (i + 1 >= lista.length) {
      terminar(st.aciertos, lista.length, st.xp, st.mejorCombo, st.fallos, st.puntos)
      return
    }
    setFallo(null)
    setI(i + 1)
    st.t0 = Date.now()
  }

  function elegir(opcion: string, boton: HTMLElement) {
    if (fallo || !caso) return
    const ms = Date.now() - st.t0
    const ok = opcion === caso.respuesta
    registrar(caso.id, ok, ok ? null : 'sanciones', ms)
    if (ok) {
      const c = ++st.combo
      const rapido = ms < RAPIDO_MS
      const ganados = 10 * multiplicador(c) + (rapido ? 5 : 0)
      st.aciertos++
      st.mejorCombo = Math.max(st.mejorCombo, c)
      st.puntos += ganados
      st.xp += 6
      sumarXp(6)
      sfx.acierto(Math.min(c, 6))
      vibrar(20)
      const r = boton.getBoundingClientRect()
      explosion(r.left + r.width / 2, r.top + r.height / 2, 18 + c * 2)
      saltar(r.left + r.width / 2 - 30, r.top - 10, rapido ? `¡Rápido! +${ganados}` : `+${ganados}`)
      avisarCombo(c)
      setAnterior(caso)
      avanzar()
    } else {
      st.combo = 0
      sfx.fallo()
      vibrar(80)
      st.fallos.push({ pregunta: preguntaFicticia(caso.id, 'sanciones', `${caso.infraccion} ${PREGUNTA_PISTA[caso.pide]}`, caso.respuesta, caso.fuente), elegida: opcion })
      setAnterior(null)
      setFallo({ c: caso, elegida: opcion })
    }
  }

  return (
    <main className="juego">
      <BarraJuego titulo={info.nombre} onSalir={onSalir} ronda={i} total={lista.length} puntos={st.puntos} combo={st.combo} />
      <p className="consigna"><b>Resuelve el caso.</b> Si contestas rápido, ganas puntos extra.</p>

      <AnimatePresence mode="wait">
        {caso && (
          <motion.article key={caso.id} className="pegatina expediente" initial={{ rotate: -4, y: 30, opacity: 0 }} animate={{ rotate: -1, y: 0, opacity: 1 }} exit={{ rotate: 3, x: -60, opacity: 0 }} transition={{ type: 'spring', bounce: 0.35, duration: 0.4 }}>
            <div className="expediente-cabecera">
              <span className="rotulo">Caso nº {i + 1}</span>
              <Lupa />
            </div>
            <p className="expediente-texto">{caso.infraccion}</p>
            <p className="expediente-pregunta">{PREGUNTA_PISTA[caso.pide]}</p>
          </motion.article>
        )}
      </AnimatePresence>

      {caso && (
        <div className="pistas">
          {OPCIONES_PISTA[caso.pide].map((o) => {
            const marca = fallo ? (o === fallo.c.respuesta ? 'buena' : o === fallo.elegida ? 'mala' : '') : ''
            return (
              <button key={o} className={`pista ${marca} ${o === 'Delito' ? 'delito' : ''}`} disabled={!!fallo} onClick={(e) => elegir(o, e.currentTarget)}>
                {o}
              </button>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {anterior && !fallo && (
          <motion.p key={anterior.id} className="anterior pegatina" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}>
            <Check /> <span><b>{anterior.respuesta}.</b> {anterior.explicacion}</span>
          </motion.p>
        )}
      </AnimatePresence>

      {fallo && <div className="hoja-espacio" />}
      <AnimatePresence>
        {fallo && (
          <motion.section key="hoja" className="hoja mal" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}>
            <h3><Cruz /> Era: {fallo.c.respuesta}</h3>
            <p>{fallo.c.explicacion}</p>
            <span className="fuente">Norma: {fallo.c.fuente}</span>
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
