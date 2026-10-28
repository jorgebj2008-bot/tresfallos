// Primera vez: bienvenida y cómo añadir la app a la pantalla de inicio (iPhone y Android).
// No se muestra si la app ya se abre instalada.
import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

const CLAVE = 'tresfallos-bienvenida-vista'

export const esInstalada = () =>
  matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

export const esIphone = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export function debeMostrarseBienvenida() {
  if (esInstalada()) return false
  try {
    return !localStorage.getItem(CLAVE)
  } catch {
    return false
  }
}

const IcoCompartir = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3M7 8l5-5 5 5M5 12v8h14v-8" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /></svg>
)

// Evento de Chrome en Android que permite instalar con un botón propio.
interface EventoInstalar extends Event {
  prompt: () => Promise<void>
}
let eventoInstalar: EventoInstalar | null = null
addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  eventoInstalar = e as EventoInstalar
})

export function Bienvenida({ onCerrar }: { onCerrar: () => void }) {
  const [so, setSo] = useState<'iphone' | 'android'>(esIphone() ? 'iphone' : 'android')
  const [puedeInstalar, setPuedeInstalar] = useState(!!eventoInstalar)

  useEffect(() => {
    const f = () => setPuedeInstalar(true)
    addEventListener('beforeinstallprompt', f)
    return () => removeEventListener('beforeinstallprompt', f)
  }, [])

  const cerrar = () => {
    try {
      localStorage.setItem(CLAVE, '1')
    } catch {
      /* sin almacenamiento: se volverá a mostrar */
    }
    onCerrar()
  }

  return (
    <div className="velo-modal">
      <motion.section className="pegatina bienvenida" role="dialog" aria-label="Instala TresFallos" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.4 }}>
        <h2>¡Bienvenido a TresFallos!</h2>
        <p>Aprueba el teórico jugando. Para usarlo como una app (pantalla completa, sin conexión y con tu progreso guardado), añádelo a tu pantalla de inicio:</p>

        <div className="pestanas-so" role="tablist">
          <button role="tab" aria-selected={so === 'iphone'} className={so === 'iphone' ? 'activa' : ''} onClick={() => setSo('iphone')}>iPhone</button>
          <button role="tab" aria-selected={so === 'android'} className={so === 'android' ? 'activa' : ''} onClick={() => setSo('android')}>Android</button>
        </div>

        {so === 'iphone' ? (
          <ol className="pasos">
            <li><span>Abre esta página en <b>Safari</b> (no funciona desde otras apps).</span></li>
            <li><span>Pulsa el botón <span className="icono-paso">⋯</span> de la barra de abajo y después <b>Compartir</b> <span className="icono-paso"><IcoCompartir /></span>. En iPhones antiguos el botón <span className="icono-paso"><IcoCompartir /></span> está directamente en la barra.</span></li>
            <li><span>Baja en el menú y pulsa <b>Ver más</b> si no ves la opción.</span></li>
            <li><span>Pulsa <b>Añadir a pantalla de inicio</b>.</span></li>
            <li><span>Pulsa <b>Añadir</b>, arriba a la derecha. ¡Listo! Ábrela desde el icono del «3».</span></li>
          </ol>
        ) : (
          <>
            {puedeInstalar && (
              <button className="boton" onClick={async () => { await eventoInstalar?.prompt(); cerrar() }}>Instalar ahora</button>
            )}
            <ol className="pasos">
              <li><span>Abre esta página en <b>Chrome</b>.</span></li>
              <li><span>Pulsa el menú <span className="icono-paso">⋮</span> de arriba a la derecha.</span></li>
              <li><span>Pulsa <b>Añadir a pantalla de inicio</b> (o <b>Instalar aplicación</b>).</span></li>
              <li><span>Pulsa <b>Instalar</b>. ¡Listo! Ábrela desde el icono del «3».</span></li>
            </ol>
          </>
        )}

        <p className="nota">Tu progreso se guarda en este móvil. Puedes volver a ver estas instrucciones en Retos.</p>
        <button className="boton" onClick={cerrar}>Empezar a jugar</button>
      </motion.section>
    </div>
  )
}
