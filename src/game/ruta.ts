// Motor de rutas del mapa: construye una carretera con rectas, curvas, arcos
// (rotondas, horquillas, espirales) y la convierte en una lista densa de puntos.
// Con esos puntos se dibuja la carretera y se reparten los niveles por distancia.

export interface Pt {
  x: number
  y: number
}
export interface PuntoRuta extends Pt {
  /** Dirección de la carretera en ese punto, en radianes. */
  ang: number
}

const PASO = 4 // px entre puntos de muestreo
const rad = (g: number) => (g * Math.PI) / 180

export class Trazo {
  pts: Pt[]
  constructor(x: number, y: number) {
    this.pts = [{ x, y }]
  }

  get fin(): Pt {
    return this.pts[this.pts.length - 1]
  }

  /** Dirección unitaria actual (la del último tramo). */
  get dir(): Pt {
    const n = this.pts.length
    if (n < 2) return { x: 0, y: -1 }
    const a = this.pts[n - 2], b = this.pts[n - 1]
    const l = Math.hypot(b.x - a.x, b.y - a.y) || 1
    return { x: (b.x - a.x) / l, y: (b.y - a.y) / l }
  }

  linea(x: number, y: number) {
    const a = this.fin
    const n = Math.max(1, Math.ceil(Math.hypot(x - a.x, y - a.y) / PASO))
    for (let i = 1; i <= n; i++) this.pts.push({ x: a.x + ((x - a.x) * i) / n, y: a.y + ((y - a.y) * i) / n })
    return this
  }

  curva(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number) {
    const a = this.fin
    const aprox = Math.hypot(c1x - a.x, c1y - a.y) + Math.hypot(c2x - c1x, c2y - c1y) + Math.hypot(x - c2x, y - c2y)
    const n = Math.max(2, Math.ceil(aprox / PASO))
    for (let i = 1; i <= n; i++) {
      const t = i / n, u = 1 - t
      this.pts.push({
        x: u * u * u * a.x + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x,
        y: u * u * u * a.y + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y,
      })
    }
    return this
  }

  /**
   * Curva suave hasta (x, y), saliendo en la dirección actual y llegando con
   * la dirección (dx, dy). k controla lo abierta que es la curva.
   */
  hacia(x: number, y: number, dx = 0, dy = -1, k = 70) {
    const a = this.fin, d = this.dir
    return this.curva(a.x + d.x * k, a.y + d.y * k, x - dx * k, y - dy * k, x, y)
  }

  /**
   * Arco alrededor de (cx, cy) desde el punto actual hasta el ángulo a1 (grados).
   * Ángulo decreciente = sentido antihorario en pantalla (el de las rotondas en España).
   * Si se da rFin, el radio cambia poco a poco (espiral).
   */
  arco(cx: number, cy: number, r: number, a1: number, rFin = r) {
    const a = this.fin
    const a0 = Math.atan2(a.y - cy, a.x - cx)
    const fin = rad(a1)
    const n = Math.max(4, Math.ceil((Math.abs(fin - a0) * Math.max(r, rFin)) / PASO))
    for (let i = 1; i <= n; i++) {
      const t = i / n
      const ang = a0 + (fin - a0) * t
      const rr = r + (rFin - r) * t
      this.pts.push({ x: cx + rr * Math.cos(ang), y: cy + rr * Math.sin(ang) })
    }
    return this
  }

  /** Recorrido de calles en ángulo recto con las esquinas redondeadas. */
  esquinas(lista: [number, number][], r = 34) {
    for (let i = 0; i < lista.length; i++) {
      const [px, py] = lista[i]
      const sig = lista[i + 1]
      if (!sig) {
        this.linea(px, py)
        break
      }
      const a = this.fin
      const l1 = Math.hypot(px - a.x, py - a.y) || 1
      const l2 = Math.hypot(sig[0] - px, sig[1] - py) || 1
      const rr = Math.min(r, l1 / 2, l2 / 2)
      const ex = px - ((px - a.x) / l1) * rr, ey = py - ((py - a.y) / l1) * rr
      const sx = px + ((sig[0] - px) / l2) * rr, sy = py + ((sig[1] - py) / l2) * rr
      this.linea(ex, ey).curva(ex + (px - ex) * 0.55, ey + (py - ey) * 0.55, sx + (px - sx) * 0.55, sy + (py - sy) * 0.55, sx, sy)
    }
    return this
  }

  /** Curva definida por una función t ∈ [0, 1] → punto (por ejemplo, un slalom). */
  funcion(fn: (t: number) => Pt, muestras = 200) {
    for (let i = 1; i <= muestras; i++) this.pts.push(fn(i / muestras))
    return this
  }

  /** Camino SVG ("d") de la carretera. */
  d(): string {
    return 'M' + this.pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('L')
  }
}

/** Distancias acumuladas a lo largo de la ruta. */
export function longitudes(pts: Pt[]): number[] {
  const cum = [0]
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y))
  return cum
}

/** Punto (con dirección) a una distancia s del inicio. */
export function puntoEn(pts: Pt[], cum: number[], s: number): PuntoRuta {
  s = Math.max(0, Math.min(s, cum[cum.length - 1]))
  let lo = 0, hi = cum.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (cum[mid] < s) lo = mid
    else hi = mid
  }
  const a = pts[lo], b = pts[hi]
  const t = cum[hi] === cum[lo] ? 0 : (s - cum[lo]) / (cum[hi] - cum[lo])
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, ang: Math.atan2(b.y - a.y, b.x - a.x) }
}

/** n puntos a la misma distancia entre sí, dejando márgenes al principio y al final. */
export function repartir(pts: Pt[], n: number, margenIni = 80, margenFin = 80): PuntoRuta[] {
  const cum = longitudes(pts)
  const total = cum[cum.length - 1]
  const util = total - margenIni - margenFin
  return Array.from({ length: n }, (_, i) => puntoEn(pts, cum, margenIni + (n === 1 ? 0 : (util * i) / (n - 1))))
}

/** Distancia mínima de un punto a la ruta (para no poner árboles encima). */
export function distanciaA(pts: Pt[], p: Pt): number {
  let min = Infinity
  for (let i = 0; i < pts.length; i += 2) {
    const d = (pts[i].x - p.x) ** 2 + (pts[i].y - p.y) ** 2
    if (d < min) min = d
  }
  return Math.sqrt(min)
}

/** Aleatorio con semilla: el mismo mundo siempre se dibuja igual. */
export function rngSemilla(semilla: number) {
  let s = semilla % 2147483647
  if (s <= 0) s += 2147483646
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}
