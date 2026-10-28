// Escenas del mapa: cada mundo tiene su paisaje, su tipo de carretera y su decorado.
// Todo se genera por código con semilla fija: el mismo mundo siempre se ve igual.
import type { ReactNode } from 'react'
import { Trazo, distanciaA, longitudes, puntoEn, repartir, rngSemilla, type Pt, type PuntoRuta } from '../../game/ruta'
import {
  Ambulancia, Arbol, Arbusto, Autoescuela, Bar, Barrera, Bici, BocaTunel, Cargador, Casa, Cebra, CentroExamen, Coche, CocheV16, Cono,
  Edificio, Farola, Gasolinera, Hospital, Juzgado, L, Meta, Molino, Montana, Nube, PanelSolar, Persona, Pino, Policia,
  Radar, Roca, Semaforo, Senal, Taller,
} from './decorado'

export const W = 400

export interface EscenaConstruida {
  H: number
  suelo: string
  noche: boolean
  /** Ruta principal (la de los niveles). */
  d: string
  /** Otras carreteras: anillos de rotonda, ramales... */
  extras: string[]
  /** Si true, la carretera lleva aceras (mundos de ciudad). */
  aceras: boolean
  nodos: PuntoRuta[]
  fondo: ReactNode[]
  /** Piezas pintadas encima del asfalto (pasos de cebra, vías, túneles). */
  sobre: ReactNode[]
  /** Decorado ordenado por profundidad. */
  decor: ReactNode[]
}

type Item = [number, ReactNode]

interface Ctx {
  H: number
  rng: () => number
  ruta: Pt[]
  nodosS: number[]
  en: (s: number) => PuntoRuta
  /** Distancia a lo largo de la ruta a medio camino entre el nivel k y el k+1. */
  entre: (k: number) => number
  libre: (x: number, y: number, r: number) => boolean
  ocupar: (x: number, y: number, r: number) => void
  esparcir: (n: number, r: number, dibujar: (x: number, y: number, i: number) => ReactNode, zona?: [number, number]) => Item[]
}

/** Punto al lado de la carretera (lado 1 = derecha según la marcha, -1 = izquierda). */
const lado = (p: PuntoRuta, dist: number, sgn: 1 | -1): Pt => ({ x: p.x - Math.sin(p.ang) * dist * sgn, y: p.y + Math.cos(p.ang) * dist * sgn })
const grados = (p: PuntoRuta) => (p.ang * 180) / Math.PI

interface DefEscena {
  suelo: string
  noche?: boolean
  aceras?: boolean
  ruta: (H: number) => Trazo
  extras?: (H: number) => Trazo[]
  fondo?: (c: Ctx) => ReactNode[]
  sobre?: (c: Ctx) => ReactNode[]
  decor: (c: Ctx) => Item[]
}

// ---------- Utilidades de decorado ----------

const manchas = (c: Ctx, color: string, n: number, tam = 40): ReactNode[] =>
  Array.from({ length: n }, (_, i) => (
    <ellipse key={`m${i}`} cx={c.rng() * W} cy={c.rng() * c.H} rx={tam * (0.6 + c.rng())} ry={tam * 0.45 * (0.6 + c.rng())} fill={color} />
  ))

const anillo = (cx: number, cy: number, r: number) => new Trazo(cx + r, cy).arco(cx, cy, r, -360)
const ramal = (cx: number, cy: number, r: number, angG: number, largo = 70) => {
  const a = (angG * Math.PI) / 180
  return new Trazo(cx + Math.cos(a) * r, cy + Math.sin(a) * r).linea(cx + Math.cos(a) * (r + largo), cy + Math.sin(a) * (r + largo))
}

const Neumaticos = ({ x, y }: Pt) => (
  <g transform={`translate(${x} ${y})`}>
    {[0, 1, 2].map((k) => (
      <g key={k}>
        <ellipse cy={-6 - k * 9} rx={13} ry={6} fill="#2A2D3E" stroke={L} strokeWidth={2} />
        <ellipse cy={-6 - k * 9} rx={5} ry={2.4} fill="#555B78" />
      </g>
    ))}
  </g>
)

const IslaRotonda = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#6FD08C" stroke="#fff" strokeWidth={4} />
    <circle cx={cx} cy={cy} r={r} fill="none" stroke={L} strokeWidth={2} />
    <Arbol x={cx} y={cy + 10} s={0.8} c="#3FAF62" />
  </g>
)

const Luna = ({ x, y }: Pt) => (
  <g>
    <circle cx={x} cy={y} r={26} fill="#FFF4C2" stroke={L} strokeWidth={2.5} />
    <circle cx={x + 11} cy={y - 7} r={21} fill="#1B2140" />
  </g>
)

// ---------- Los 13 mundos ----------

const ESCENAS: DefEscena[] = [
  // 1 · Conductor y vehículo: urbanización con autoescuela y circuito alrededor de la manzana.
  {
    suelo: '#BDE8A5',
    ruta: (H) =>
      new Trazo(200, H).linea(200, H - 40).hacia(110, H * 0.82, 0, -1).hacia(300, H * 0.6, 0, -1, 90)
        .esquinas([[300, H * 0.4], [100, H * 0.4], [100, H * 0.2], [200, H * 0.2], [200, 0]], 40),
    fondo: (c) => manchas(c, '#AEE093', 14),
    decor: (c) => [
      [c.H * 0.56, <Autoescuela key="ae" x={196} y={c.H * 0.56} />],
      ...[0, 1, 2].map((k): Item => [c.H * 0.47, <Cono key={`c${k}`} x={150 + k * 40} y={c.H * 0.47} />]),
      ...(() => { [0, 1, 2].forEach((k) => c.ocupar(150 + k * 40, c.H * 0.47, 20)); c.ocupar(196, c.H * 0.53, 60); return [] })(),
      ...c.esparcir(9, 26, (x, y, i) => <Casa key={`ca${i}`} x={x} y={y} techo={['#FF5A5F', '#7C5CFF', '#3DA5FF', '#FF9F1C'][i % 4]} />),
      ...c.esparcir(16, 18, (x, y, i) => (i % 3 ? <Arbol key={`a${i}`} x={x} y={y} s={0.9} /> : <Arbusto key={`a${i}`} x={x} y={y} />)),
      ...[1, 4, 7].map((k): Item => {
        const p = lado(c.en(c.entre(k)), 34, 1)
        return [p.y, <Senal key={`s${k}`} x={p.x} y={p.y} s={0.8} tipo={k === 4 ? 'velocidad' : 'info'} texto={k === 4 ? '30' : k === 1 ? 'L' : 'P'} />]
      }),
      ...c.esparcir(4, 14, (x, y, i) => <Coche key={`co${i}`} x={x} y={y} ang={-90} c={['#FF5A5F', '#FFD23F', '#3DA5FF', '#fff'][i]} />),
    ],
  },

  // 2 · La vía y sus usuarios: ciudad en cuadrícula con aceras, peatones, bicis y semáforos.
  {
    suelo: '#DCD5C4',
    aceras: true,
    ruta: (H) =>
      new Trazo(200, H).esquinas(
        [[200, H * 0.94], [80, H * 0.94], [80, H * 0.78], [320, H * 0.78], [320, H * 0.6], [140, H * 0.6], [140, H * 0.45], [300, H * 0.45], [300, H * 0.28], [80, H * 0.28], [80, H * 0.12], [200, H * 0.12], [200, 0]],
        34,
      ),
    fondo: (c) => manchas(c, '#D0C8B5', 10, 50),
    sobre: (c) => [0, 2, 4, 6, 8].map((k) => <Cebra key={`z${k}`} p={c.en(c.entre(k))} />),
    decor: (c) => [
      ...[0, 2, 4, 6, 8].flatMap((k): Item[] => {
        const p = c.en(c.entre(k))
        const a = lado(p, 34, 1), b = lado(p, 34, -1)
        c.ocupar(a.x, a.y, 16)
        c.ocupar(b.x, b.y, 16)
        return [[a.y, <Semaforo key={`sm${k}`} x={a.x} y={a.y} s={0.75} />], [b.y, <Persona key={`pe${k}`} x={b.x} y={b.y} c={['#FF5A5F', '#7C5CFF', '#22C55E'][k % 3]} />]]
      }),
      ...c.esparcir(13, 30, (x, y, i) => (
        <Edificio key={`e${i}`} x={x} y={y} w={40 + (i % 3) * 8} h={50 + ((i * 17) % 40)} c={['#3DA5FF', '#FF9F1C', '#E15FBF', '#7C5CFF', '#2EC4B6'][i % 5]} />
      )),
      ...c.esparcir(3, 16, (x, y, i) => <Bici key={`b${i}`} x={x} y={y} />),
      ...c.esparcir(8, 16, (x, y, i) => <Arbol key={`a${i}`} x={x} y={y} s={0.75} />),
      ...c.esparcir(4, 12, (x, y, i) => <Persona key={`p${i}`} x={x} y={y} c={['#FFD23F', '#3DA5FF', '#FF5A5F', '#2EC4B6'][i]} />),
    ],
  },

  // 3 · Señalización: puerto de montaña con curvas de horquilla y señales.
  {
    suelo: '#A5DB8E',
    ruta: (H) => {
      const r = 44, xl = 92, xr = 308, zigs = 6
      const paso = (H - 170) / zigs
      const t = new Trazo(200, H).hacia(xr, H - 90, 0.7, -0.7, 50)
      let y = H - 90
      for (let k = 0; k < zigs; k++) {
        if (k % 2 === 0) t.arco(xr, y - r, r, -90).linea(xl, y - paso)
        else t.arco(xl, y - r, r, 270).linea(xr, y - paso)
        y -= paso
      }
      return t.hacia(200, 0, 0, -1, 50)
    },
    fondo: (c) => manchas(c, '#93CF7B', 16),
    decor: (c) => {
      const tipos = ['peligro', 'velocidad', 'ceda', 'prohibido', 'obligacion', 'info', 'stop'] as const
      const senales = Array.from({ length: 11 }, (_, k): Item => {
        const p = lado(c.en(c.entre(k)), 36, k % 2 ? 1 : -1)
        c.ocupar(p.x, p.y, 18)
        return [p.y, <Senal key={`s${k}`} x={p.x} y={p.y} s={0.85} tipo={tipos[k % tipos.length]} texto={['40', '60', '50'][k % 3]} />]
      })
      return [
        ...senales,
        ...c.esparcir(3, 50, (x, y, i) => <Montana key={`m${i}`} x={x} y={y} s={0.8} c={['#8E7CC3', '#7A6DB0', '#9D8FD0'][i]} />),
        ...c.esparcir(22, 16, (x, y, i) => <Pino key={`p${i}`} x={x} y={y} s={0.8 + (i % 3) * 0.12} />),
        ...c.esparcir(8, 12, (x, y, i) => <Roca key={`r${i}`} x={x} y={y} />),
      ]
    },
  },

  // 4 · Velocidad: autopista entre trigales con un lazo de enlace (paso elevado) y radar.
  {
    suelo: '#EBCB74',
    ruta: (H) => {
      const cx = 190, cy = H * 0.55, r = 82
      return new Trazo(200, H).hacia(290, H * 0.8, 0, -1, 90).hacia(cx + r, cy, 0, -1, 80).arco(cx, cy, r, -270)
        .hacia(340, cy - 60, 0, -1, 70).hacia(110, H * 0.22, -0.3, -1, 110).hacia(200, 0, 0, -1, 80)
    },
    fondo: (c) => [
      ...Array.from({ length: Math.ceil(c.H / 34) }, (_, i) => (
        <path key={`f${i}`} d={`M0 ${i * 34 + 12}Q100 ${i * 34} 200 ${i * 34 + 12}T400 ${i * 34 + 12}`} stroke="#DDB95C" strokeWidth={6} fill="none" />
      )),
    ],
    sobre: (c) => {
      // Marcas de distancia de seguridad (chevrones) en una recta.
      const out: ReactNode[] = []
      for (let k = 0; k < 4; k++) {
        const p = c.en(c.entre(0) - 30 + k * 22)
        out.push(
          <path key={`v${k}`} d="M-5-12L5 0L-5 12" transform={`translate(${p.x} ${p.y}) rotate(${grados(p)})`} stroke="#fff" strokeWidth={3.5} fill="none" strokeLinejoin="round" />,
        )
      }
      return out
    },
    decor: (c) => [
      ...[1, 3, 5, 7].map((k): Item => {
        const p = lado(c.en(c.entre(k)), 36, 1)
        c.ocupar(p.x, p.y, 18)
        return [p.y, k === 5 ? <Radar key={`rd${k}`} x={p.x} y={p.y} /> : <Senal key={`v${k}`} x={p.x} y={p.y} s={0.85} tipo="velocidad" texto={['120', '100', '', '90'][(k - 1) / 2] || '120'} />]
      }),
      ...[2, 6].map((k): Item => {
        const p = c.en(c.entre(k))
        return [p.y, <Coche key={`co${k}`} x={p.x} y={p.y} ang={grados(p)} c={k === 2 ? '#FF5A5F' : '#3DA5FF'} />]
      }),
      ...c.esparcir(5, 22, (x, y, i) => <Casa key={`ca${i}`} x={x} y={y} s={0.8} c="#FFF3E0" techo="#C2410C" />),
      ...c.esparcir(10, 16, (x, y, i) => <Arbol key={`a${i}`} x={x} y={y} s={0.85} c="#6BBF59" />),
      ...c.esparcir(3, 26, (x, y, i) => <Nube key={`n${i}`} x={x} y={y} s={0.8} />),
    ],
  },

  // 5 · Prioridad de paso: tres rotondas (se gira en sentido antihorario).
  {
    suelo: '#A8E6CF',
    ruta: (H) => {
      const r = 56
      const c1 = { x: 200, y: H * 0.82 }, c2 = { x: 150, y: H * 0.52 }, c3 = { x: 240, y: H * 0.2 }
      const e2 = { x: c2.x + r * Math.cos(Math.PI / 3), y: c2.y + r * Math.sin(Math.PI / 3) }
      const e3 = { x: c3.x + r * Math.cos((5 * Math.PI) / 6), y: c3.y + r * Math.sin((5 * Math.PI) / 6) }
      return new Trazo(200, H).linea(200, c1.y + r).arco(c1.x, c1.y, r, -40)
        .hacia(e2.x, e2.y, 0.87, -0.5, 70).arco(c2.x, c2.y, r, -50)
        .hacia(e3.x, e3.y, 0.5, 0.87, 90).arco(c3.x, c3.y, r, -30)
        .hacia(200, 0, 0, -1, 60)
    },
    extras: (H) => {
      const r = 56
      return [
        anillo(200, H * 0.82, r), ramal(200, H * 0.82, r, 180), ramal(200, H * 0.82, r, 0),
        anillo(150, H * 0.52, r), ramal(150, H * 0.52, r, 180), ramal(150, H * 0.52, r, 115),
        anillo(240, H * 0.2, r), ramal(240, H * 0.2, r, 30), ramal(240, H * 0.2, r, 90),
      ]
    },
    fondo: (c) => manchas(c, '#97DDBF', 14),
    decor: (c) => {
      const isla = (x: number, y: number): Item => {
        c.ocupar(x, y, 60)
        return [y + 1, <IslaRotonda key={`i${x}`} cx={x} cy={y} r={30} />]
      }
      const ceda = (x: number, y: number, k: string): Item => {
        c.ocupar(x, y, 16)
        return [y, <Senal key={`c${k}`} x={x} y={y} s={0.75} tipo="ceda" />]
      }
      // Coches circulando por el anillo, orientados en sentido antihorario.
      const enAnillo = (cx: number, cy: number, angG: number, col: string, k: string): Item => {
        const a = (angG * Math.PI) / 180
        return [cy + 56 * Math.sin(a), <Coche key={`k${k}`} x={cx + 56 * Math.cos(a)} y={cy + 56 * Math.sin(a)} ang={angG - 90} c={col} s={0.85} />]
      }
      return [
        isla(200, c.H * 0.82), isla(150, c.H * 0.52), isla(240, c.H * 0.2),
        ceda(250, c.H * 0.82 + 82, 'a'), ceda(206, c.H * 0.52 + 84, 'b'), ceda(176, c.H * 0.2 - 4, 'c'),
        enAnillo(200, c.H * 0.82, 200, '#FF5A5F', 'a'), enAnillo(150, c.H * 0.52, 250, '#FFD23F', 'b'), enAnillo(240, c.H * 0.2, 150, '#7C5CFF', 'c'),
        ...c.esparcir(14, 18, (x, y, i) => (i % 2 ? <Arbol key={`a${i}`} x={x} y={y} s={0.85} /> : <Arbusto key={`a${i}`} x={x} y={y} />)),
        ...c.esparcir(5, 24, (x, y, i) => <Casa key={`ca${i}`} x={x} y={y} s={0.85} techo={['#2EC4B6', '#FF5A5F', '#7C5CFF'][i % 3]} />),
      ]
    },
  },

  // 6 · Maniobras: pista de prácticas con slalom de conos, curvas cerradas y aparcamiento.
  {
    suelo: '#D4CEE3',
    ruta: (H) => {
      const y0 = H - 40, y1 = H * 0.6
      return new Trazo(200, H).linea(200, y0)
        .funcion((t) => ({ x: 200 + 72 * Math.sin(t * Math.PI * 4), y: y0 - t * (y0 - y1) }), 260)
        .hacia(300, H * 0.5, 0, -1, 60).arco(240, H * 0.5, 60, -180).arco(130, H * 0.5, 50, 180)
        .linea(80, H * 0.3).esquinas([[80, H * 0.22], [320, H * 0.22], [320, H * 0.1], [200, H * 0.1], [200, 0]], 34)
    },
    fondo: (c) => [
      <rect key="pista" x={20} y={c.H * 0.58} width={360} height={c.H * 0.42 - 20} rx={30} fill="#C5BED8" stroke={L} strokeWidth={2} strokeDasharray="10 8" />,
      // Aparcamiento en batería
      <g key="park">
        <rect x={110} y={c.H * 0.25} width={180} height={c.H * 0.08} rx={6} fill="#B9B2CF" stroke={L} strokeWidth={2} />
        {Array.from({ length: 7 }, (_, k) => (
          <rect key={k} x={118 + k * 25} y={c.H * 0.255} width={3} height={c.H * 0.07} fill="#fff" />
        ))}
      </g>,
    ],
    decor: (c) => {
      const y0 = c.H - 40, y1 = c.H * 0.6
      const conos = [1, 3, 5, 7].map((k): Item => {
        const y = y0 - (k / 8) * (y0 - y1)
        c.ocupar(200, y, 18)
        return [y, <Cono key={`sl${k}`} x={200} y={y} />]
      })
      const aparcados = [0, 2, 3, 5].map((k): Item => {
        const x = 130 + k * 25, y = c.H * 0.29
        c.ocupar(x, y, 14)
        return [y, <Coche key={`ap${k}`} x={x} y={y} ang={-90} s={0.85} c={['#FF5A5F', '#3DA5FF', '#FFD23F', '#22C55E'][k % 4]} />]
      })
      c.ocupar(200, c.H * 0.29, 100)
      return [
        ...conos,
        ...aparcados,
        [c.H * 0.24, <Senal key="p" x={300} y={c.H * 0.24} s={0.8} tipo="info" texto="P" />],
        ...c.esparcir(10, 12, (x, y, i) => <Cono key={`c${i}`} x={x} y={y} s={0.9} />),
        ...c.esparcir(10, 18, (x, y, i) => <Arbusto key={`a${i}`} x={x} y={y} c="#7BCB8C" />),
      ]
    },
  },

  // 7 · Alumbrado: ciudad de noche con farolas encendidas y faros.
  {
    suelo: '#1B2140',
    noche: true,
    aceras: true,
    ruta: (H) => new Trazo(200, H).hacia(110, H * 0.75, 0, -1, 90).hacia(300, H * 0.48, 0, -1, 120).hacia(110, H * 0.2, 0, -1, 120).hacia(200, 0, 0, -1, 70),
    fondo: (c) => [
      ...Array.from({ length: 40 }, (_, i) => <circle key={`e${i}`} cx={c.rng() * W} cy={c.rng() * c.H} r={1 + c.rng() * 1.6} fill="#FFF4C2" opacity={0.8} />),
      <Luna key="luna" x={330} y={70} />,
    ],
    decor: (c) => [
      ...Array.from({ length: 14 }, (_, k): Item => {
        const p = lado(c.en((c.nodosS[0] + (k * (c.nodosS[c.nodosS.length - 1] - c.nodosS[0])) / 13)), 40, k % 2 ? 1 : -1)
        c.ocupar(p.x, p.y, 14)
        return [p.y, <Farola key={`f${k}`} x={p.x} y={p.y} luz />]
      }),
      ...[1, 4, 6].map((k): Item => {
        const p = c.en(c.entre(k))
        return [
          p.y,
          <g key={`co${k}`}>
            <path d="M12-5L60-22V22L12 5Z" transform={`translate(${p.x} ${p.y}) rotate(${grados(p)})`} fill="#FFF4C2" opacity={0.35} />
            <Coche x={p.x} y={p.y} ang={grados(p)} c={['#FF3D81', '#2DE2E6', '#FFD23F'][k % 3]} />
          </g>,
        ]
      }),
      ...c.esparcir(14, 30, (x, y, i) => <Edificio key={`e${i}`} x={x} y={y} w={38 + (i % 3) * 10} h={60 + ((i * 23) % 50)} c={['#2B3270', '#3A2F6E', '#24407A'][i % 3]} luces />),
    ],
  },

  // 8 · Autopistas, túneles y pasos a nivel: vía del tren con barreras y túnel bajo la montaña.
  {
    suelo: '#B7D98B',
    ruta: (H) => new Trazo(200, H).hacia(260, H * 0.85, 0, -1, 60).linea(260, H * 0.62).hacia(140, H * 0.46, 0, -1, 90).linea(140, H * 0.16).hacia(200, 0, 0, -1, 60),
    fondo: (c) => manchas(c, '#A7CF79', 12),
    sobre: (c) => {
      // Paso a nivel entre los niveles 1 y 2; túnel entre el 4 y el 5.
      const pv = c.en(c.entre(1))
      const vias: ReactNode = (
        <g key="vias">
          <rect x={0} y={pv.y - 14} width={W} height={28} fill="#A99C8A" />
          {Array.from({ length: 34 }, (_, k) => <rect key={k} x={k * 12} y={pv.y - 13} width={5} height={26} fill="#7A5A3A" />)}
          <rect x={0} y={pv.y - 8} width={W} height={3} fill="#5B6178" />
          <rect x={0} y={pv.y + 5} width={W} height={3} fill="#5B6178" />
        </g>
      )
      const s1 = c.nodosS[4] + 45, s2 = c.nodosS[5] - 45
      const a = c.en(s1), b = c.en(s2)
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
      const alto = Math.abs(a.y - b.y)
      return [
        vias,
        <g key="tunel">
          <path d={`M${mx - 120} ${my + alto / 2 + 10}Q${mx - 110} ${my - alto / 2 - 30} ${mx - 20} ${my - alto / 2 - 18}Q${mx + 40} ${my - alto / 2 - 50} ${mx + 120} ${my - alto / 2 + 10}Q${mx + 130} ${my + alto / 2} ${mx + 90} ${my + alto / 2 + 14}Z`}
            fill="#8FA36B" stroke={L} strokeWidth={2.5} />
          <Pino x={mx - 60} y={my} s={0.8} />
          <Pino x={mx + 60} y={my - 20} s={0.9} />
          <Pino x={mx + 10} y={my + 30} s={0.7} />
          <BocaTunel p={a} />
          <BocaTunel p={b} salida />
        </g>,
      ]
    },
    decor: (c) => {
      const pv = c.en(c.entre(1))
      const izq = lado(pv, 34, -1), der = lado(pv, 34, 1)
      c.ocupar(izq.x, izq.y + 20, 22)
      c.ocupar(der.x, der.y + 20, 22)
      // Reserva la zona de las vías y del túnel para que no haya árboles encima.
      for (let x = 0; x <= W; x += 30) c.ocupar(x, pv.y + 10, 24)
      const a = c.en(c.nodosS[4] + 45), b = c.en(c.nodosS[5] - 45)
      c.ocupar((a.x + b.x) / 2, (a.y + b.y) / 2, 130)
      return [
        [der.y + 22, <Barrera key="b1" x={der.x} y={der.y + 22} flip />],
        [izq.y - 18, <Barrera key="b2" x={izq.x} y={izq.y - 18} />],
        [pv.y + 6, <g key="tren" transform={`translate(${pv.x > 200 ? 30 : 250} ${pv.y - 12})`}>
          <rect width={110} height={24} rx={8} fill="#FF5A5F" stroke={L} strokeWidth={2.5} />
          {[12, 34, 56, 78].map((k) => <rect key={k} x={k} y={5} width={14} height={8} rx={2} fill="#CFEAFF" stroke={L} strokeWidth={1.5} />)}
        </g>],
        ...[0, 3, 6].map((k): Item => {
          const p = lado(c.en(c.entre(k)), 36, 1)
          c.ocupar(p.x, p.y, 18)
          return [p.y, <Senal key={`s${k}`} x={p.x} y={p.y} s={0.8} tipo={k === 0 ? 'peligro' : 'velocidad'} texto={k === 3 ? '80' : '120'} />]
        }),
        ...c.esparcir(3, 50, (x, y, i) => <Montana key={`m${i}`} x={x} y={y} s={0.75} c="#9A8C7A" />),
        ...c.esparcir(16, 16, (x, y, i) => <Pino key={`p${i}`} x={x} y={y} s={0.8} />),
      ]
    },
  },

  // 9 · Alcohol, drogas y fatiga: carretera al atardecer con bar, gasolinera y control de alcoholemia.
  {
    suelo: '#F6B48F',
    ruta: (H) => {
      const pts: [number, number][] = [[110, 0.88], [290, 0.72], [120, 0.55], [280, 0.38], [130, 0.22], [200, 0]]
      const t = new Trazo(200, H)
      pts.forEach(([x, f]) => t.hacia(x, H * f, 0, -1, 90))
      return t
    },
    fondo: (c) => [
      <circle key="sol" cx={320} cy={60} r={40} fill="#FFD23F" stroke={L} strokeWidth={2.5} />,
      ...manchas(c, '#F1A27A', 12, 50),
    ],
    decor: (c) => {
      const pc = c.en(c.entre(3))
      const pol = lado(pc, 40, 1)
      c.ocupar(pol.x, pol.y, 34)
      return [
        [pol.y, <Policia key="pol" x={pol.x} y={pol.y} ang={grados(pc)} />],
        ...[-24, 24].map((d): Item => {
          const q = lado(c.en(c.entre(3) + d), 26, 1)
          return [q.y, <Cono key={`cc${d}`} x={q.x} y={q.y} s={0.8} />]
        }),
        ...c.esparcir(1, 40, (x, y) => <Bar key="bar" x={x} y={y} />),
        ...c.esparcir(1, 44, (x, y) => <Gasolinera key="gas" x={x} y={y} />),
        ...[1, 6].map((k): Item => {
          const p = lado(c.en(c.entre(k)), 36, -1)
          c.ocupar(p.x, p.y, 18)
          return [p.y, <Senal key={`s${k}`} x={p.x} y={p.y} s={0.8} tipo="peligro" />]
        }),
        ...c.esparcir(14, 16, (x, y, i) => <Arbol key={`a${i}`} x={x} y={y} s={0.85} c={['#E08A3C', '#C9612E', '#6BBF59'][i % 3]} />),
        ...c.esparcir(4, 22, (x, y, i) => <Casa key={`ca${i}`} x={x} y={y} s={0.8} techo="#7C3AED" />),
      ]
    },
  },

  // 10 · Seguridad activa y pasiva: taller y pista de pruebas en espiral.
  {
    suelo: '#BFD7EA',
    ruta: (H) => {
      const cy = H * 0.5
      return new Trazo(200, H).hacia(310, cy, 0, -1, 90).arco(200, cy, 110, -450, 52).hacia(150, H * 0.18, 0, -1, 90).hacia(200, 0, 0, -1, 60)
    },
    fondo: (c) => [<circle key="pista" cx={200} cy={c.H * 0.5} r={140} fill="#AFC9DE" stroke={L} strokeWidth={2} strokeDasharray="12 10" />],
    decor: (c) => {
      c.ocupar(200, c.H * 0.5, 145)
      return [
        ...c.esparcir(1, 40, (x, y) => <Taller key="taller" x={x} y={y} />),
        ...c.esparcir(6, 16, (x, y, i) => <Neumaticos key={`n${i}`} x={x} y={y} />),
        ...c.esparcir(8, 12, (x, y, i) => <Cono key={`c${i}`} x={x} y={y} />),
        ...c.esparcir(8, 16, (x, y, i) => <Arbusto key={`a${i}`} x={x} y={y} c="#7BC4A0" />),
        ...[0, 2, 5].map((k): Item => {
          const p = c.en(c.entre(k))
          return [p.y, <Coche key={`co${k}`} x={p.x} y={p.y} ang={grados(p)} c={['#FF5A5F', '#FFD23F', '#22C55E'][k % 3]} />]
        }),
      ]
    },
  },

  // 11 · Accidentes y primeros auxilios: campo con río y puente, coche averiado con V-16, ambulancia y hospital.
  {
    suelo: '#C9E4A6',
    ruta: (H) => new Trazo(200, H).hacia(120, H * 0.78, 0, -1, 90).hacia(270, H * 0.52, 0, -1, 110).hacia(140, H * 0.25, 0, -1, 110).hacia(200, 0, 0, -1, 60),
    fondo: (c) => {
      const yr = c.H * 0.6
      let d = `M-10 ${yr}`
      for (let x = 0; x <= 420; x += 20) d += `L${x} ${yr + 22 * Math.sin(x / 60)}`
      return [
        ...manchas(c, '#BADB92', 12),
        <path key="rio" d={d} stroke="#3DA5FF" strokeWidth={44} fill="none" strokeLinecap="round" />,
        <path key="rio2" d={d} stroke="#8FD0FF" strokeWidth={10} fill="none" strokeDasharray="20 30" />,
      ]
    },
    sobre: (c) => {
      // Barandillas del puente donde la carretera cruza el río.
      const yr = (x: number) => c.H * 0.6 + 22 * Math.sin(x / 60)
      let mejor = 0, dmin = Infinity
      c.ruta.forEach((p, i) => {
        const d = Math.abs(p.y - yr(p.x))
        if (d < dmin) {
          dmin = d
          mejor = i
        }
      })
      const s = longitudes(c.ruta)[mejor]
      const p = c.en(s)
      return [
        <g key="puente" transform={`translate(${p.x} ${p.y}) rotate(${grados(p)})`}>
          <rect x={-36} y={-25} width={72} height={6} rx={3} fill="#C98B4A" stroke={L} strokeWidth={2} />
          <rect x={-36} y={19} width={72} height={6} rx={3} fill="#C98B4A" stroke={L} strokeWidth={2} />
        </g>,
      ]
    },
    decor: (c) => {
      const yr = c.H * 0.6
      for (let x = 0; x <= W; x += 30) c.ocupar(x, yr + 22 * Math.sin(x / 60) + 10, 30)
      const pv = c.en(c.entre(2))
      const v16 = lado(pv, 30, 1)
      c.ocupar(v16.x, v16.y, 24)
      const pa = c.en(c.entre(5))
      return [
        [v16.y, <CocheV16 key="v16" x={v16.x} y={v16.y} ang={grados(pv)} />],
        [pa.y, <Ambulancia key="amb" x={pa.x} y={pa.y} ang={grados(pa)} />],
        ...c.esparcir(1, 40, (x, y) => <Hospital key="hosp" x={x} y={y} />, [40, c.H * 0.35]),
        ...c.esparcir(16, 16, (x, y, i) => (i % 4 ? <Arbol key={`a${i}`} x={x} y={y} s={0.85} /> : <Pino key={`a${i}`} x={x} y={y} s={0.8} />)),
        ...c.esparcir(4, 22, (x, y, i) => <Casa key={`ca${i}`} x={x} y={y} s={0.8} />),
        ...c.esparcir(3, 26, (x, y, i) => <Nube key={`n${i}`} x={x} y={y} s={0.7} />),
      ]
    },
  },

  // 12 · Conducción eficiente: colinas verdes, molinos, placas solares y cargadores.
  {
    suelo: '#9FE2A0',
    ruta: (H) => {
      const r = 50, cy = H * 0.5
      return new Trazo(200, H).hacia(110, H * 0.78, 0, -1, 90).hacia(200, cy + r, 0, -1, 70).arco(200, cy, r, -45).hacia(290, H * 0.22, 0, -1, 90).hacia(200, 0, 0, -1, 70)
    },
    extras: (H) => [anillo(200, H * 0.5, 50), ramal(200, H * 0.5, 50, 180), ramal(200, H * 0.5, 50, 0)],
    fondo: (c) => [
      ...Array.from({ length: 6 }, (_, i) => (
        <ellipse key={`h${i}`} cx={(i % 2 ? 320 : 80) + c.rng() * 40} cy={(i + 0.5) * (c.H / 6)} rx={150} ry={70} fill="#8DD68F" />
      )),
    ],
    decor: (c) => {
      c.ocupar(200, c.H * 0.5, 55)
      return [
        [c.H * 0.5 + 1, <IslaRotonda key="isla" cx={200} cy={c.H * 0.5} r={26} />],
        ...c.esparcir(6, 26, (x, y, i) => <Molino key={`mo${i}`} x={x} y={y} s={0.85} />),
        ...c.esparcir(6, 22, (x, y, i) => <PanelSolar key={`ps${i}`} x={x} y={y} />),
        ...c.esparcir(3, 16, (x, y, i) => <Cargador key={`cg${i}`} x={x} y={y} />),
        ...c.esparcir(10, 16, (x, y, i) => <Arbol key={`a${i}`} x={x} y={y} s={0.85} c="#3FAF62" />),
        ...[1, 5].map((k): Item => {
          const p = c.en(c.entre(k))
          return [p.y, <Coche key={`co${k}`} x={p.x} y={p.y} ang={grados(p)} c="#22C55E" />]
        }),
      ]
    },
  },

  // 13 · Infracciones y sanciones: ciudad con juzgado y radares; al final, el Centro de Examen.
  {
    suelo: '#D9D2F2',
    aceras: true,
    ruta: (H) =>
      new Trazo(200, H).esquinas([[200, H * 0.9], [320, H * 0.9], [320, H * 0.7], [80, H * 0.7], [80, H * 0.48], [300, H * 0.48], [300, H * 0.28], [200, H * 0.28], [200, 0]], 34),
    fondo: (c) => manchas(c, '#CBC2EA', 10, 50),
    sobre: (c) => [1, 4].map((k) => <Cebra key={`z${k}`} p={c.en(c.entre(k))} />),
    decor: (c) => {
      const fin = c.en(c.nodosS[c.nodosS.length - 1])
      const cx = fin.x < 200 ? fin.x + 110 : fin.x - 110
      c.ocupar(cx, fin.y, 85)
      c.ocupar(fin.x + 34, fin.y + 10, 30)
      return [
        [fin.y + 40, <CentroExamen key="ce" x={cx} y={fin.y + 40} />],
        [fin.y + 30, <Meta key="meta" x={fin.x + 34} y={fin.y + 30} />],
        ...c.esparcir(1, 44, (x, y) => <Juzgado key="juz" x={x} y={y} />, [c.H * 0.3, c.H * 0.9]),
        ...[2, 5].map((k): Item => {
          const p = lado(c.en(c.entre(k)), 36, 1)
          c.ocupar(p.x, p.y, 18)
          return [p.y, <Radar key={`r${k}`} x={p.x} y={p.y} />]
        }),
        ...[3].map((k): Item => {
          const p = lado(c.en(c.entre(k)), 34, -1)
          return [p.y, <Policia key="pol" x={p.x} y={p.y} ang={-90} />]
        }),
        ...c.esparcir(12, 28, (x, y, i) => <Edificio key={`e${i}`} x={x} y={y} w={40 + (i % 3) * 8} h={50 + ((i * 13) % 45)} c={['#A855F7', '#7C5CFF', '#E15FBF', '#5B6CFF'][i % 4]} />),
        ...c.esparcir(6, 16, (x, y, i) => <Arbol key={`a${i}`} x={x} y={y} s={0.75} />),
      ]
    },
  },
]

/** Construye la escena de un mundo: carretera, posición de los niveles y decorado. */
export function construirEscena(indice: number, niveles: number): EscenaConstruida {
  const def = ESCENAS[indice]
  const H = niveles * 120 + 220
  const rng = rngSemilla(indice * 7919 + 13)
  const trazo = def.ruta(H)
  const extras = def.extras?.(H) ?? []
  const ruta = trazo.pts
  const cum = longitudes(ruta)
  const nodos = repartir(ruta, niveles + 1, 90, 90)
  const total = cum[cum.length - 1]
  const util = total - 180
  const nodosS = nodos.map((_, i) => 90 + (util * i) / niveles)
  const todas = [...ruta, ...extras.flatMap((t) => t.pts)]
  const ocupados: { x: number; y: number; r: number }[] = nodos.map((p) => ({ x: p.x, y: p.y, r: 40 }))

  const c: Ctx = {
    H, rng, ruta, nodosS,
    en: (s) => puntoEn(ruta, cum, s),
    entre: (k) => (nodosS[Math.min(k, nodosS.length - 2)] + nodosS[Math.min(k + 1, nodosS.length - 1)]) / 2,
    libre(x, y, r) {
      if (x < r || x > W - r || y < 70 || y > H - 30) return false
      if (distanciaA(todas, { x, y: y - 12 }) < r + 26) return false
      return ocupados.every((o) => Math.hypot(o.x - x, o.y - y) > o.r + r)
    },
    ocupar(x, y, r) {
      ocupados.push({ x, y, r })
    },
    esparcir(n, r, dibujar, zona) {
      const out: Item[] = []
      for (let k = 0, intentos = 0; k < n && intentos < n * 60; intentos++) {
        const x = rng() * W
        const y = zona ? zona[0] + rng() * (zona[1] - zona[0]) : 70 + rng() * (H - 100)
        if (c.libre(x, y, r)) {
          c.ocupar(x, y, r)
          out.push([y, dibujar(x, y, k)])
          k++
        }
      }
      return out
    },
  }

  const fondo = def.fondo?.(c) ?? []
  const sobre = def.sobre?.(c) ?? []
  const decor = def.decor(c).sort((a, b) => a[0] - b[0]).map(([, el]) => el)

  return {
    H, suelo: def.suelo, noche: !!def.noche, aceras: !!def.aceras,
    d: trazo.d(), extras: extras.map((t) => t.d()), nodos, fondo, sobre, decor,
  }
}
