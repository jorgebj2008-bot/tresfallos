// Efectos de sonido sintetizados con Web Audio: sin archivos y sin licencias.
// El navegador solo deja sonar audio después de un toque del jugador; por eso
// el contexto se crea la primera vez que se pide un sonido.

let ctx: AudioContext | null = null
let activo = true

export function setSonido(on: boolean) {
  activo = on
}

function audio(): AudioContext | null {
  if (!activo) return null
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

/** Una nota corta con envolvente suave. */
function nota(frec: number, inicio: number, dur: number, tipo: OscillatorType = 'triangle', vol = 0.18) {
  const a = audio()
  if (!a) return
  const t = a.currentTime + inicio
  const osc = a.createOscillator()
  const gan = a.createGain()
  osc.type = tipo
  osc.frequency.setValueAtTime(frec, t)
  gan.gain.setValueAtTime(0.0001, t)
  gan.gain.exponentialRampToValueAtTime(vol, t + 0.012)
  gan.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(gan).connect(a.destination)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

// Escala pentatónica: cualquier combinación suena bien.
const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51]

export const sfx = {
  toque() {
    nota(880, 0, 0.05, 'sine', 0.06)
  },
  /** Sube de tono con el combo: el oído nota que vas encadenando. */
  acierto(combo: number) {
    const base = Math.min(combo, PENTA.length - 2)
    nota(PENTA[base], 0, 0.12)
    nota(PENTA[base + 1] * 1.5, 0.07, 0.22)
  },
  /** Suave y grave, nunca castigador. */
  fallo() {
    nota(311.13, 0, 0.18, 'sine', 0.14)
    nota(261.63, 0.12, 0.28, 'sine', 0.12)
  },
  combo() {
    ;[0, 2, 4, 5].forEach((i, k) => nota(PENTA[i] * 2, k * 0.06, 0.14, 'square', 0.06))
  },
  estrella(i: number) {
    nota(PENTA[3 + i * 2] ?? 1318.51, 0, 0.3, 'triangle', 0.16)
  },
  subida() {
    ;[0, 2, 4, 7].forEach((i, k) => nota(PENTA[i], k * 0.09, 0.3, 'triangle', 0.16))
  },
}

/**
 * iPhone no tiene navigator.vibrate. Desde iOS 18, pulsar un interruptor
 * <input type="checkbox" switch> produce un toque háptico del sistema:
 * lo creamos oculto y lo pulsamos por código.
 */
function toqueIOS() {
  const etiqueta = document.createElement('label')
  etiqueta.ariaHidden = 'true'
  etiqueta.style.display = 'none'
  const interruptor = document.createElement('input')
  interruptor.type = 'checkbox'
  interruptor.setAttribute('switch', '')
  etiqueta.appendChild(interruptor)
  document.head.appendChild(etiqueta)
  etiqueta.click()
  etiqueta.remove()
}

/**
 * Vibración háptica.
 * - Android: navigator.vibrate. Chrome la bloquea si el juego va dentro de un
 *   iframe de otro dominio (la página de pruebas); en la web propia funciona.
 * - iPhone: un toque por cada pulso del patrón (iOS no permite duraciones).
 */
export function vibrar(patron: number | number[]) {
  if (!activo) return
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(patron)
      return
    }
    const pulsos = Array.isArray(patron) ? patron.filter((_, i) => i % 2 === 0) : [patron]
    pulsos.forEach((_, i) => (i === 0 ? toqueIOS() : setTimeout(toqueIOS, i * 90)))
  } catch {
    /* sin vibración */
  }
}
