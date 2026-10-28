// Piezas comunes de los minijuegos: barra superior, avisos de combo, puntos que saltan
// y el cierre de la partida (XP, estrellas, guardado y pantalla de resultados).
import { useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useJuego, claveNivel } from '../../store/useJuego'
import { calcularListo } from '../../learning/estoyListo'
import { todasLasPreguntas } from '../../content/banco'
import { calcularEstrellas, hitoCombo } from '../../game/nivel'
import { xpFinNivel } from '../../game/progreso'
import { sfx, vibrar } from '../../audio/sfx'
import type { ConfigPartida, ResultadoPartida } from '../Nivel'
import { Cruz, Llama } from '../iconos'

export function BarraJuego({ titulo, onSalir, ronda, total, puntos, combo }: { titulo: string; onSalir: () => void; ronda: number; total: number; puntos: number; combo: number }) {
  return (
    <div className="barra-juego">
      <button className="icono-boton" onClick={onSalir} aria-label="Salir del juego"><Cruz /></button>
      <div className="barra-juego-centro">
        <b>{titulo}</b>
        <div className="barra"><motion.i initial={false} animate={{ width: `${(ronda / total) * 100}%` }} /></div>
      </div>
      <div className="puntos" aria-label={`${puntos} puntos`}>
        <span>{puntos}</span>
        {combo >= 3 && <span className="combo-chip"><Llama /> x{combo}</span>}
      </div>
    </div>
  )
}

/** Avisos grandes ("¡EN LLAMAS!") y textos que saltan ("+20"). */
export function useEfectos() {
  const [hito, setHito] = useState<{ id: number; texto: string } | null>(null)
  const [flot, setFlot] = useState<{ id: number; x: number; y: number; texto: string } | null>(null)
  const avisarCombo = (combo: number) => {
    const t = hitoCombo(combo)
    if (!t) return
    setTimeout(() => {
      setHito({ id: Date.now(), texto: t })
      sfx.combo()
      vibrar([30, 40, 30])
    }, 200)
  }
  const saltar = (x: number, y: number, texto: string) => setFlot({ id: Date.now(), x, y, texto })
  const capa: ReactNode = (
    <>
      <AnimatePresence>
        {flot && (
          <motion.span key={flot.id} className="flotante" style={{ left: flot.x, top: flot.y }}
            initial={{ opacity: 0, y: 10, scale: 0.6 }} animate={{ opacity: [0, 1, 1, 0], y: -50, scale: 1.1 }}
            transition={{ duration: 0.9, ease: 'easeOut' }} onAnimationComplete={() => setFlot(null)}>
            {flot.texto}
          </motion.span>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {hito && (
          <motion.div key={hito.id} className="hito" initial={{ x: '-50%', scale: 0.3, rotate: -8, opacity: 0 }}
            animate={{ scale: [0.3, 1.2, 1, 1], rotate: [-8, 4, -3, -3], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.2, times: [0, 0.25, 0.75, 1] }} onAnimationComplete={() => setHito(null)}>
            {hito.texto}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
  return { avisarCombo, saltar, capa }
}

/** Datos del inicio de la partida y función para cerrarla igual que un nivel de preguntas. */
export function usePartida(config: ConfigPartida, onTerminar: (r: ResultadoPartida) => void) {
  const { perfil, sumarXp, guardarNivel, guardarRecord } = useJuego()
  const inicio = useRef<{ t: number; xp: number; prob: number; temario: number } | null>(null)
  if (!inicio.current) {
    const { estados, simulacros } = useJuego.getState()
    const l = calcularListo(todasLasPreguntas(), estados, simulacros, Date.now())
    inicio.current = { t: Date.now(), xp: perfil.xp, prob: l.prob, temario: l.temario }
  }
  return (aciertos: number, total: number, xpGanada: number, mejorCombo: number, fallos: ResultadoPartida['fallos'], puntos: number) => {
    const ini = inicio.current!
    const segundos = Math.round((Date.now() - ini.t) / 1000)
    const estrellas = calcularEstrellas(aciertos, total, 0)
    const bonus = xpFinNivel(estrellas)
    sumarXp(bonus)
    if (config.tipo === 'juego') {
      guardarRecord(config.juego, puntos)
      if (config.mundo && config.nivel) guardarNivel(claveNivel(config.mundo, config.nivel), estrellas, aciertos)
    }
    onTerminar({
      config, listoAntes: ini.prob, temarioAntes: ini.temario, aciertos, total, segundos, estrellas,
      xpGanada: xpGanada + bonus, xpAntes: ini.xp, mejorCombo, fallos,
    })
  }
}
