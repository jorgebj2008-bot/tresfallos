// Intro animada al abrir la app.
// Primera vez: completa (carretera, coche, logo, confeti) y termina con «Toca para empezar».
// Las siguientes: versión corta que se cierra sola. Con «reducir movimiento», solo un fundido.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useJuego } from '../store/useJuego'
import { cochePorId } from '../game/retencion'
import { sfx, vibrar } from '../audio/sfx'
import { confeti } from './particulas'

const CLAVE = 'tresfallos-intro-vista'
const L = '#1E1B2E'

function primeraVez() {
  try {
    return !localStorage.getItem(CLAVE)
  } catch {
    return true
  }
}

function CocheIntro({ color, franja }: { color: string; franja: string }) {
  return (
    <svg viewBox="0 0 60 100" width={66} height={110} aria-hidden="true">
      <ellipse cx={30} cy={94} rx={24} ry={6} fill="rgba(0,0,0,.25)" />
      <rect x={6} y={6} width={48} height={86} rx={16} fill={color} stroke={L} strokeWidth={4} />
      <rect x={25} y={6} width={10} height={86} fill={franja} opacity={0.9} />
      <rect x={12} y={22} width={36} height={16} rx={5} fill="#CFEAFF" stroke={L} strokeWidth={3} />
      <rect x={12} y={68} width={36} height={12} rx={4} fill="#CFEAFF" stroke={L} strokeWidth={3} />
      <circle cx={14} cy={9} r={4} fill="#FFF4C2" stroke={L} strokeWidth={2} />
      <circle cx={46} cy={9} r={4} fill="#FFF4C2" stroke={L} strokeWidth={2} />
    </svg>
  )
}

export function Intro({ onTerminar }: { onTerminar: () => void }) {
  const [larga] = useState(primeraVez)
  const [fase, setFase] = useState<'entrada' | 'logo' | 'listo' | 'salida'>('entrada')
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches
  const coche = cochePorId(useJuego((s) => s.perfil.coche))
  // La función de cierre puede cambiar en cada render de la app: se guarda en una referencia.
  const terminar = useRef(onTerminar)
  terminar.current = onTerminar

  useEffect(() => {
    if (reducido) {
      const t = setTimeout(() => setFase('salida'), larga ? 900 : 400)
      return () => clearTimeout(t)
    }
    const tiempos = larga ? [1300, 2600] : [450, 1000]
    const t1 = setTimeout(() => setFase('logo'), tiempos[0])
    const t2 = setTimeout(() => {
      if (larga) setFase('listo')
      else setFase('salida')
    }, tiempos[1])
    return () => [t1, t2].forEach(clearTimeout)
  }, [larga, reducido])

  useEffect(() => {
    if (fase === 'listo') confeti(110)
    if (fase === 'salida') {
      const t = setTimeout(() => terminar.current(), reducido ? 250 : 650)
      return () => clearTimeout(t)
    }
  }, [fase, reducido])

  function empezar() {
    if (fase === 'salida') return
    try {
      localStorage.setItem(CLAVE, '1')
    } catch {
      /* se verá entera otra vez */
    }
    // El primer toque permite al navegador reproducir sonido.
    sfx.subida()
    vibrar([30, 40, 60])
    setFase('salida')
  }

  const logoVisible = fase !== 'entrada'

  return (
    <motion.div
      className="intro"
      onClick={empezar}
      role="dialog"
      aria-label="TresFallos"
      initial={{ opacity: 1 }}
      animate={fase === 'salida' ? { opacity: 0, scale: 1.04 } : { opacity: 1, scale: 1 }}
      transition={{ duration: fase === 'salida' ? 0.55 : 0.3, ease: 'easeIn' }}
    >
      {/* Carretera que se dibuja de abajo arriba, con las rayas en movimiento */}
      <motion.div className="intro-carretera" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: reducido ? 0 : larga ? 0.7 : 0.3, ease: 'easeOut' }}>
        <div className="intro-rayas" />
      </motion.div>

      {/* El coche sube, frena con un pequeño rebote y al final sale disparado */}
      <motion.div
        className="intro-coche"
        initial={{ y: '60vh' }}
        animate={fase === 'salida' ? { y: '-80vh' } : { y: 0 }}
        transition={fase === 'salida' ? { duration: 0.55, ease: [0.6, 0, 0.9, 0.4] } : { type: 'spring', stiffness: 90, damping: 13, delay: reducido ? 0 : larga ? 0.35 : 0.05 }}
      >
        <CocheIntro color={coche.color} franja={coche.franja} />
      </motion.div>

      <div className="intro-logo">
        <AnimatePresence>
          {logoVisible && (
            <motion.div key="tres" className="intro-tres" initial={{ scale: 0, rotate: -25 }} animate={{ scale: 1, rotate: -6 }} transition={{ type: 'spring', bounce: 0.55, duration: 0.7 }}>
              3
            </motion.div>
          )}
        </AnimatePresence>
        <div className="intro-palabras">
          <motion.span initial={{ x: '-120vw' }} animate={logoVisible ? { x: 0 } : {}} transition={{ type: 'spring', bounce: 0.35, duration: 0.7, delay: 0.15 }}>Tres</motion.span>
          <motion.b initial={{ x: '120vw' }} animate={logoVisible ? { x: 0 } : {}} transition={{ type: 'spring', bounce: 0.35, duration: 0.7, delay: 0.25 }}>Fallos</motion.b>
        </div>
        <motion.p className="intro-lema" initial={{ opacity: 0, y: 10 }} animate={logoVisible ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.55 }}>
          Aprueba el teórico jugando
        </motion.p>
      </div>

      <AnimatePresence>
        {fase === 'listo' && (
          <motion.button
            key="empezar"
            className="intro-empezar"
            onClick={empezar}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, scale: [1, 1.05, 1] }}
            transition={{ opacity: { duration: 0.3 }, y: { duration: 0.3 }, scale: { repeat: Infinity, duration: 1.4 } }}
          >
            Toca para empezar
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
