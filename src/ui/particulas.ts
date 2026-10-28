// Partículas y confeti en un único canvas a pantalla completa.
// Se crea al primer uso y se para solo cuando no queda nada que dibujar.

interface Particula {
  x: number; y: number; vx: number; vy: number
  vida: number; max: number; tam: number; color: string; giro: number; vgiro: number; rect: boolean
}

const reducido = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let parts: Particula[] = []
let animando = false

function asegurarCanvas() {
  if (canvas) return
  canvas = document.createElement('canvas')
  canvas.className = 'particulas'
  canvas.setAttribute('aria-hidden', 'true')
  document.body.appendChild(canvas)
  ctx = canvas.getContext('2d')
  const ajustar = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas!.width = innerWidth * dpr
    canvas!.height = innerHeight * dpr
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  ajustar()
  addEventListener('resize', ajustar)
}

function bucle() {
  if (!ctx || !canvas) return
  ctx.clearRect(0, 0, innerWidth, innerHeight)
  parts = parts.filter((p) => p.vida < p.max)
  for (const p of parts) {
    p.vida++
    p.vy += 0.32
    p.vx *= 0.985
    p.x += p.vx
    p.y += p.vy
    p.giro += p.vgiro
    ctx.globalAlpha = 1 - p.vida / p.max
    ctx.fillStyle = p.color
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.giro)
    if (p.rect) ctx.fillRect(-p.tam / 2, -p.tam / 4, p.tam, p.tam / 2)
    else {
      ctx.beginPath()
      ctx.arc(0, 0, p.tam / 2, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }
  ctx.globalAlpha = 1
  if (parts.length) requestAnimationFrame(bucle)
  else animando = false
}

function lanzar(nuevas: Particula[]) {
  if (reducido()) return
  asegurarCanvas()
  parts.push(...nuevas)
  if (!animando) {
    animando = true
    requestAnimationFrame(bucle)
  }
}

const COLORES = ['#FFD23F', '#4ADE80', '#7C5CFF', '#FF5A5F', '#3DA5FF', '#FFFFFF']

/** Explosión pequeña desde un punto (acierto). */
export function explosion(x: number, y: number, cantidad = 26) {
  lanzar(
    Array.from({ length: cantidad }, () => {
      const ang = Math.random() * Math.PI * 2
      const vel = 3 + Math.random() * 6
      return {
        x, y, vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel - 4,
        vida: 0, max: 40 + Math.random() * 20, tam: 5 + Math.random() * 6,
        color: COLORES[(Math.random() * COLORES.length) | 0], giro: 0, vgiro: 0, rect: false,
      }
    }),
  )
}

/** Confeti cayendo desde arriba (logros grandes). */
export function confeti(cantidad = 140) {
  lanzar(
    Array.from({ length: cantidad }, () => ({
      x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.4,
      vx: (Math.random() - 0.5) * 4, vy: Math.random() * 3,
      vida: 0, max: 110 + Math.random() * 60, tam: 8 + Math.random() * 8,
      color: COLORES[(Math.random() * COLORES.length) | 0],
      giro: Math.random() * 6, vgiro: (Math.random() - 0.5) * 0.3, rect: true,
    })),
  )
}
