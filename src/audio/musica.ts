// Música de fondo generada con Web Audio: un bucle corto y suave distinto en cada mundo.
// Sin archivos ni licencias. Volumen bajo para no tapar los efectos.

let ctx: AudioContext | null = null
let salida: GainNode | null = null
let temporizador: number | null = null
let activa = true
let estilo = -1
let paso = 0
let siguienteNota = 0

// Escalas en semitonos y progresión de acordes (grados) por estilo.
const ESTILOS = [
  { bpm: 104, raiz: 60, escala: [0, 2, 4, 7, 9], onda: 'triangle' as OscillatorType },  // alegre
  { bpm: 96, raiz: 57, escala: [0, 3, 5, 7, 10], onda: 'sine' as OscillatorType },      // tranquila
  { bpm: 118, raiz: 62, escala: [0, 2, 4, 7, 9], onda: 'square' as OscillatorType },    // arcade
  { bpm: 84, raiz: 55, escala: [0, 2, 3, 7, 8], onda: 'sine' as OscillatorType },       // noche
  { bpm: 110, raiz: 59, escala: [0, 2, 5, 7, 9], onda: 'triangle' as OscillatorType },  // aventura
]
const ACORDES = [0, 4, 5, 3] // I V vi IV
const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)

function nota(midi: number, t: number, dur: number, onda: OscillatorType, vol: number) {
  if (!ctx || !salida) return
  const o = ctx.createOscillator(), g = ctx.createGain()
  o.type = onda
  o.frequency.setValueAtTime(hz(midi), t)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(salida)
  o.start(t)
  o.stop(t + dur + 0.05)
}

/** Programa notas con algo de antelación (planificador con "lookahead"). */
function programar() {
  if (!ctx || estilo < 0) return
  const e = ESTILOS[estilo]
  const semi = 60 / e.bpm / 2 // corcheas
  while (siguienteNota < ctx.currentTime + 0.25) {
    const compas = Math.floor(paso / 8) % ACORDES.length
    const grado = ACORDES[compas]
    const base = e.raiz + e.escala[grado % e.escala.length] - 12
    if (paso % 4 === 0) nota(base - 12, siguienteNota, semi * 3.5, 'sine', 0.09)
    const arp = [0, 2, 4, 2, 1, 3, 4, 3][paso % 8]
    const m = e.raiz + e.escala[(grado + arp) % e.escala.length] + 12 * Math.floor((grado + arp) / e.escala.length)
    if (paso % 8 !== 7) nota(m, siguienteNota, semi * 0.9, e.onda, e.onda === 'square' ? 0.018 : 0.035)
    siguienteNota += semi
    paso++
  }
}

/** Empieza (o cambia) la música. Debe llamarse tras un toque del jugador la primera vez. */
export function sonarMusica(mundoIndice: number | null) {
  const nuevo = mundoIndice === null ? -1 : mundoIndice % ESTILOS.length
  if (!activa || nuevo < 0) {
    parar()
    return
  }
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    if (!salida) {
      salida = ctx.createGain()
      salida.gain.value = 0.8
      salida.connect(ctx.destination)
    }
  } catch {
    return
  }
  if (nuevo === estilo && temporizador !== null) return
  estilo = nuevo
  paso = 0
  siguienteNota = ctx.currentTime + 0.1
  if (temporizador === null) temporizador = window.setInterval(programar, 80)
}

function parar() {
  if (temporizador !== null) clearInterval(temporizador)
  temporizador = null
  estilo = -1
}

export function setMusica(on: boolean) {
  activa = on
  if (!on) parar()
}

// En segundo plano, silencio (y se retoma al volver).
document.addEventListener('visibilitychange', () => {
  if (!ctx) return
  if (document.visibilityState === 'hidden') void ctx.suspend()
  else if (activa) void ctx.resume()
})
