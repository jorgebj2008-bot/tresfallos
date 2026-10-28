// Intro animada al abrir la app.
// Dura siempre 3 segundos: carretera, coche, logo y confeti, y se cierra sola.
// Con «reducir movimiento», se muestra quieta durante ese tiempo.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useJuego } from '../store/useJuego'
import { cochePorId } from '../game/retencion'
import { confeti } from './particulas'

const DURACION_MS = 3000
const L = '#1E1B2E'

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
  const [fase, setFase] = useState<'entrada' | 'logo' | 'listo' | 'salida'>('entrada')
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches
  const coche = cochePorId(useJuego((s) => s.perfil.coche))
  // La función de cierre puede cambiar en cada render de la app: se guarda en una referencia.
  const terminar = useRef(onTerminar)
  terminar.current = onTerminar

  // Siempre dura 3 segundos: carretera y coche, logo, confeti y salida.
  useEffect(() => {
    const t = [
      setTimeout(() => setFase('logo'), reducido ? 0 : 1100),
      setTimeout(() => setFase('listo'), 1900),
      setTimeout(() => setFase('salida'), 2450),
      setTimeout(() => terminar.current(), DURACION_MS),
    ]
    return () => t.forEach(clearTimeout)
  }, [reducido])

  useEffect(() => {
    if (fase === 'listo' && !reducido) confeti(110)
  }, [fase, reducido])

  const logoVisible = fase !== 'entrada'

  return (
    <motion.div
      className="intro"
      role="dialog"
      aria-label="TresFallos"
      initial={{ opacity: 1 }}
      animate={fase === 'salida' ? { opacity: 0, scale: 1.04 } : { opacity: 1, scale: 1 }}
      transition={{ duration: fase === 'salida' ? 0.5 : 0.3, ease: 'easeIn' }}
    >
      {/* Carretera que se dibuja de abajo arriba, con las rayas en movimiento */}
      <motion.div className="intro-carretera" initial={{ scaleY: reducido ? 1 : 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
        <div className="intro-rayas" />
      </motion.div>

      {/* El coche sube, frena con un pequeño rebote y al final sale disparado */}
      <motion.div
        className="intro-coche"
        initial={{ y: reducido ? 0 : '60vh' }}
        animate={fase === 'salida' && !reducido ? { y: '-80vh' } : { y: 0 }}
        transition={fase === 'salida' ? { duration: 0.5, ease: [0.6, 0, 0.9, 0.4] } : { type: 'spring', stiffness: 90, damping: 13, delay: 0.35 }}
      >
        <CocheIntro color={coche.color} franja={coche.franja} />
      </motion.div>

      <div className="intro-logo">
        <AnimatePresence>
          {logoVisible && (
            <motion.div key="tres" className="intro-tres" initial={{ scale: reducido ? 1 : 0, rotate: -25 }} animate={{ scale: 1, rotate: -6 }} transition={{ type: 'spring', bounce: 0.55, duration: 0.7 }}>
              3
            </motion.div>
          )}
        </AnimatePresence>
        <div className="intro-palabras">
          <motion.span initial={{ x: reducido ? 0 : '-120vw' }} animate={logoVisible ? { x: 0 } : {}} transition={{ type: 'spring', bounce: 0.35, duration: 0.7, delay: 0.15 }}>Tres</motion.span>
          <motion.b initial={{ x: reducido ? 0 : '120vw' }} animate={logoVisible ? { x: 0 } : {}} transition={{ type: 'spring', bounce: 0.35, duration: 0.7, delay: 0.25 }}>Fallos</motion.b>
        </div>
        <motion.p className="intro-lema" initial={{ opacity: 0, y: 10 }} animate={logoVisible ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.55 }}>
          Aprueba el teórico jugando
        </motion.p>
      </div>
    </motion.div>
  )
}
