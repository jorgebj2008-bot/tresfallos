// Piezas de decorado del mapa en estilo pegatina (contorno grueso, colores planos).
// Cada pieza se ancla en su base (x, y) para poder ordenarlas por profundidad.
import type { ReactNode } from 'react'
import type { PuntoRuta } from '../../game/ruta'

export const L = '#1E1B2E'
const SW = 2.5
const g = (x: number, y: number, s = 1, ang = 0) => `translate(${x} ${y}) rotate(${ang}) scale(${s})`

interface Base {
  x: number
  y: number
  s?: number
}

export const Arbol = ({ x, y, s = 1, c = '#4CC26A' }: Base & { c?: string }) => (
  <g transform={g(x, y, s)}>
    <rect x={-3.5} y={-14} width={7} height={15} rx={2} fill="#A0703F" stroke={L} strokeWidth={SW} />
    <circle cy={-28} r={16} fill={c} stroke={L} strokeWidth={SW} />
    <circle cx={-6} cy={-33} r={4.5} fill="#fff" opacity={0.35} />
  </g>
)

export const Pino = ({ x, y, s = 1, c = '#2F9E5B' }: Base & { c?: string }) => (
  <g transform={g(x, y, s)}>
    <rect x={-3} y={-10} width={6} height={11} fill="#A0703F" stroke={L} strokeWidth={SW} />
    <path d="M0-52L17-22H-17Z M0-38L20-10H-20Z" fill={c} stroke={L} strokeWidth={SW} strokeLinejoin="round" />
  </g>
)

export const Arbusto = ({ x, y, s = 1, c = '#58C878' }: Base & { c?: string }) => (
  <g transform={g(x, y, s)}>
    <path d="M-16 0a9 9 0 0 1 4-15a10 10 0 0 1 17-3a9 9 0 0 1 11 18z" fill={c} stroke={L} strokeWidth={SW} strokeLinejoin="round" />
  </g>
)

export const Casa = ({ x, y, s = 1, c = '#FFF3E0', techo = '#FF5A5F' }: Base & { c?: string; techo?: string }) => (
  <g transform={g(x, y, s)}>
    <rect x={-18} y={-26} width={36} height={26} fill={c} stroke={L} strokeWidth={SW} />
    <path d="M-23-25L0-45L23-25Z" fill={techo} stroke={L} strokeWidth={SW} strokeLinejoin="round" />
    <rect x={-5} y={-14} width={10} height={14} fill={techo} stroke={L} strokeWidth={2} />
    <rect x={-14} y={-20} width={7} height={7} fill="#9ED8FF" stroke={L} strokeWidth={1.8} />
    <rect x={7} y={-20} width={7} height={7} fill="#9ED8FF" stroke={L} strokeWidth={1.8} />
  </g>
)

export const Edificio = ({ x, y, s = 1, w = 44, h = 70, c = '#7C5CFF', luces = false }: Base & { w?: number; h?: number; c?: string; luces?: boolean }) => {
  const ventanas: ReactNode[] = []
  const cols = Math.max(2, Math.floor((w - 8) / 11))
  const filas = Math.max(2, Math.floor((h - 12) / 13))
  for (let f = 0; f < filas; f++)
    for (let k = 0; k < cols; k++) {
      const encendida = luces ? (f * 7 + k * 3) % 5 !== 0 : true
      ventanas.push(
        <rect key={`${f}-${k}`} x={-w / 2 + 6 + k * ((w - 12) / cols)} y={-h + 8 + f * 13} width={(w - 12) / cols - 3} height={7} rx={1}
          fill={encendida ? (luces ? '#FFE27A' : '#CFEAFF') : '#2A2F55'} />,
      )
    }
  return (
    <g transform={g(x, y, s)}>
      <rect x={-w / 2} y={-h} width={w} height={h} rx={3} fill={c} stroke={L} strokeWidth={SW} />
      {ventanas}
    </g>
  )
}

export const Nube = ({ x, y, s = 1 }: Base) => (
  <g transform={g(x, y, s)} opacity={0.9}>
    <path d="M-30 0a12 12 0 0 1 8-18a16 16 0 0 1 29-6a12 12 0 0 1 21 10a9 9 0 0 1 2 14z" fill="#fff" stroke={L} strokeWidth={SW} strokeLinejoin="round" />
  </g>
)

export const Montana = ({ x, y, s = 1, c = '#8E7CC3', nieve = true }: Base & { c?: string; nieve?: boolean }) => (
  <g transform={g(x, y, s)}>
    <path d="M-60 0L-10-80L10-55L25-70L60 0Z" fill={c} stroke={L} strokeWidth={SW} strokeLinejoin="round" />
    {nieve && <path d="M-10-80L-22-60L-12-63L-5-55L2-64L10-55Z" fill="#fff" stroke={L} strokeWidth={2} strokeLinejoin="round" />}
  </g>
)

export const Roca = ({ x, y, s = 1 }: Base) => (
  <g transform={g(x, y, s)}>
    <path d="M-14 0L-10-12L0-17L11-11L14 0Z" fill="#B8B2C8" stroke={L} strokeWidth={SW} strokeLinejoin="round" />
  </g>
)

/** Señal de tráfico con poste. Formas y colores según su tipo. */
export function Senal({ x, y, s = 1, tipo, texto }: Base & { tipo: 'stop' | 'ceda' | 'peligro' | 'velocidad' | 'obligacion' | 'info' | 'prohibido'; texto?: string }) {
  let cara: ReactNode
  switch (tipo) {
    case 'stop':
      cara = (
        <>
          <polygon points="-6.6,-16 6.6,-16 16,-6.6 16,6.6 6.6,16 -6.6,16 -16,6.6 -16,-6.6" fill="#E3262E" stroke="#fff" strokeWidth={2} />
          <polygon points="-6.6,-16 6.6,-16 16,-6.6 16,6.6 6.6,16 -6.6,16 -16,6.6 -16,-6.6" fill="none" stroke={L} strokeWidth={1.5} transform="scale(1.12)" />
          <text y={3.5} textAnchor="middle" fontSize={9.5} fontWeight={900} fill="#fff" fontFamily="Arial, sans-serif">STOP</text>
        </>
      )
      break
    case 'ceda':
      cara = <path d="M-17-13H17L0 16Z" fill="#fff" stroke="#E3262E" strokeWidth={5} strokeLinejoin="round" />
      break
    case 'peligro':
      cara = (
        <>
          <path d="M0-17L17 13H-17Z" fill="#fff" stroke="#E3262E" strokeWidth={5} strokeLinejoin="round" />
          <text y={9} textAnchor="middle" fontSize={14} fontWeight={900} fill={L} fontFamily="Arial, sans-serif">!</text>
        </>
      )
      break
    case 'velocidad':
    case 'prohibido':
      cara = (
        <>
          <circle r={16} fill="#fff" stroke="#E3262E" strokeWidth={5} />
          {tipo === 'prohibido' ? <path d="M-9 9L9-9" stroke="#E3262E" strokeWidth={4} /> : (
            <text y={4.5} textAnchor="middle" fontSize={texto && texto.length > 2 ? 11 : 13} fontWeight={900} fill={L} fontFamily="Arial, sans-serif">{texto}</text>
          )}
        </>
      )
      break
    case 'obligacion':
      cara = (
        <>
          <circle r={16} fill="#1C64C8" stroke="#fff" strokeWidth={2} />
          <path d="M0 9V-8M-6-2L0-9L6-2" stroke="#fff" strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )
      break
    case 'info':
      cara = (
        <>
          <rect x={-15} y={-15} width={30} height={30} rx={3} fill="#1C64C8" stroke="#fff" strokeWidth={2} />
          <text y={6} textAnchor="middle" fontSize={16} fontWeight={900} fill="#fff" fontFamily="Arial, sans-serif">{texto ?? 'P'}</text>
        </>
      )
  }
  return (
    <g transform={g(x, y, s)}>
      <rect x={-2} y={-34} width={4} height={34} fill="#9AA0B4" stroke={L} strokeWidth={1.8} />
      <g transform="translate(0 -46)">{cara}</g>
    </g>
  )
}

export const Cono = ({ x, y, s = 1 }: Base) => (
  <g transform={g(x, y, s)}>
    <path d="M-9 0L-4-20H4L9 0Z" fill="#FF8A1F" stroke={L} strokeWidth={2.2} strokeLinejoin="round" />
    <path d="M-6.5-9H6.5" stroke="#fff" strokeWidth={3.5} />
    <rect x={-11} y={-2} width={22} height={4} rx={1.5} fill="#FF8A1F" stroke={L} strokeWidth={2} />
  </g>
)

export const Farola = ({ x, y, s = 1, luz = false }: Base & { luz?: boolean }) => (
  <g transform={g(x, y, s)}>
    {luz && <circle cx={0} cy={-48} r={28} fill="url(#halo)" />}
    <rect x={-2} y={-46} width={4} height={46} fill="#6F7590" stroke={L} strokeWidth={1.8} />
    <path d="M-10-46H10L6-54H-6Z" fill={luz ? '#FFE27A' : '#C9CDD9'} stroke={L} strokeWidth={2} strokeLinejoin="round" />
  </g>
)

export const Semaforo = ({ x, y, s = 1 }: Base) => (
  <g transform={g(x, y, s)}>
    <rect x={-2} y={-30} width={4} height={30} fill="#6F7590" stroke={L} strokeWidth={1.8} />
    <rect x={-8} y={-62} width={16} height={34} rx={4} fill="#2A2D3E" stroke={L} strokeWidth={2} />
    <circle cy={-54} r={4} fill="#E3262E" />
    <circle cy={-45} r={4} fill="#5A5300" />
    <circle cy={-36} r={4} fill="#0F5A2E" />
  </g>
)

/** Coche visto desde arriba, orientado con la carretera. */
export const Coche = ({ x, y, s = 1, ang = 0, c = '#3DA5FF' }: Base & { ang?: number; c?: string }) => (
  <g transform={g(x, y, s, ang)}>
    <rect x={-12} y={-7.5} width={24} height={15} rx={5} fill={c} stroke={L} strokeWidth={2.2} />
    <rect x={2} y={-5.5} width={6} height={11} rx={2} fill="#CFEAFF" stroke={L} strokeWidth={1.5} />
    <rect x={-9} y={-5} width={4} height={10} rx={1.5} fill="#CFEAFF" stroke={L} strokeWidth={1.5} />
  </g>
)

export const Persona = ({ x, y, s = 1, c = '#FF5A5F' }: Base & { c?: string }) => (
  <g transform={g(x, y, s)}>
    <path d="M-6 0V-9a6 6 0 0 1 12 0V0Z" fill={c} stroke={L} strokeWidth={2} />
    <circle cy={-20} r={5.5} fill="#FFD5B0" stroke={L} strokeWidth={2} />
  </g>
)

export const Bici = ({ x, y, s = 1 }: Base) => (
  <g transform={g(x, y, s)} fill="none" stroke={L} strokeWidth={2.2} strokeLinecap="round">
    <circle cx={-9} cy={-7} r={7} fill="#fff" />
    <circle cx={9} cy={-7} r={7} fill="#fff" />
    <path d="M-9-7L-2-17H7L9-7M-2-17L0-7L7-17" stroke="#7C5CFF" />
    <circle cy={-28} r={4.5} fill="#FFD5B0" stroke={L} />
    <path d="M0-24L-1-15" />
  </g>
)

export const Molino = ({ x, y, s = 1 }: Base) => (
  <g transform={g(x, y, s)}>
    <path d="M-3 0L-1.5-70H1.5L3 0Z" fill="#fff" stroke={L} strokeWidth={2} />
    <g className="aspas" style={{ transformOrigin: `0px -70px` }}>
      {[0, 120, 240].map((a) => (
        <path key={a} d="M0-70L-3-102Q0-108 3-102Z" fill="#fff" stroke={L} strokeWidth={1.8} transform={`rotate(${a} 0 -70)`} />
      ))}
    </g>
    <circle cy={-70} r={4} fill="#FFD23F" stroke={L} strokeWidth={1.8} />
  </g>
)

export const PanelSolar = ({ x, y, s = 1 }: Base) => (
  <g transform={g(x, y, s)}>
    <path d="M-20 0L-14-18H20L14 0Z" fill="#2B4C9B" stroke={L} strokeWidth={2.2} strokeLinejoin="round" />
    <path d="M-17-9H17M-3-18L-6 0M8-18L5 0" stroke="#8FB4FF" strokeWidth={1.5} />
  </g>
)

export const Cargador = ({ x, y, s = 1 }: Base) => (
  <g transform={g(x, y, s)}>
    <rect x={-8} y={-30} width={16} height={30} rx={3} fill="#22C55E" stroke={L} strokeWidth={2.2} />
    <path d="M1-25L-4-15H1L-2-7L5-18H0Z" fill="#fff" stroke={L} strokeWidth={1} />
  </g>
)

export const Gasolinera = ({ x, y, s = 1 }: Base) => (
  <g transform={g(x, y, s)}>
    <rect x={-36} y={-44} width={72} height={10} rx={2} fill="#FF5A5F" stroke={L} strokeWidth={SW} />
    <rect x={-30} y={-34} width={4} height={34} fill="#C9CDD9" stroke={L} strokeWidth={1.8} />
    <rect x={26} y={-34} width={4} height={34} fill="#C9CDD9" stroke={L} strokeWidth={1.8} />
    <rect x={-10} y={-20} width={20} height={20} rx={2} fill="#fff" stroke={L} strokeWidth={2} />
    <rect x={-6} y={-16} width={12} height={6} fill="#9ED8FF" />
  </g>
)

export const Taller = ({ x, y, s = 1 }: Base) => (
  <g transform={g(x, y, s)}>
    <path d="M-34 0V-34L0-48L34-34V0Z" fill="#FFF3E0" stroke={L} strokeWidth={SW} strokeLinejoin="round" />
    <rect x={-22} y={-26} width={44} height={26} fill="#9AA0B4" stroke={L} strokeWidth={2} />
    <path d="M-22-19H22M-22-12H22M-22-5H22" stroke={L} strokeWidth={1.4} />
    <circle cy={-37} r={6} fill="#0EA5E9" stroke={L} strokeWidth={1.8} />
  </g>
)

export const Juzgado = ({ x, y, s = 1 }: Base) => (
  <g transform={g(x, y, s)}>
    <path d="M-40-46L0-66L40-46Z" fill="#E9E4F7" stroke={L} strokeWidth={SW} strokeLinejoin="round" />
    <rect x={-38} y={-46} width={76} height={6} fill="#E9E4F7" stroke={L} strokeWidth={2} />
    {[-28, -14, 0, 14, 28].map((c) => (
      <rect key={c} x={c - 3.5} y={-40} width={7} height={34} fill="#fff" stroke={L} strokeWidth={1.8} />
    ))}
    <rect x={-42} y={-6} width={84} height={6} fill="#E9E4F7" stroke={L} strokeWidth={2} />
  </g>
)

export const Hospital = ({ x, y, s = 1 }: Base) => (
  <g transform={g(x, y, s)}>
    <rect x={-30} y={-50} width={60} height={50} rx={3} fill="#fff" stroke={L} strokeWidth={SW} />
    <rect x={-9} y={-44} width={18} height={18} rx={2} fill="#EF4444" />
    <path d="M0-41V-29M-6-35H6" stroke="#fff" strokeWidth={4} />
    <rect x={-8} y={-16} width={16} height={16} fill="#9ED8FF" stroke={L} strokeWidth={1.8} />
  </g>
)

export const Ambulancia = ({ x, y, s = 1, ang = 0 }: Base & { ang?: number }) => (
  <g transform={g(x, y, s, ang)}>
    <rect x={-15} y={-8} width={30} height={16} rx={4} fill="#fff" stroke={L} strokeWidth={2.2} />
    <rect x={6} y={-6} width={6} height={12} rx={2} fill="#CFEAFF" stroke={L} strokeWidth={1.4} />
    <path d="M-6-4V4M-10 0H-2" stroke="#EF4444" strokeWidth={3} />
    <rect x={-1} y={-9.5} width={5} height={3} fill="#3DA5FF" className="destello" />
  </g>
)

/** Baliza V-16 (luz amarilla intermitente) sobre un coche parado. */
export const CocheV16 = ({ x, y, s = 1, ang = 0 }: Base & { ang?: number }) => (
  <g transform={g(x, y, s)}>
    <Coche x={0} y={0} ang={ang} c="#A0A6BC" />
    <circle cy={-2} r={10} fill="#FFB020" opacity={0.35} className="destello" />
    <circle cy={-2} r={3.5} fill="#FFB020" stroke={L} strokeWidth={1.4} />
  </g>
)

export const Bar = ({ x, y, s = 1 }: Base) => (
  <g transform={g(x, y, s)}>
    <rect x={-26} y={-40} width={52} height={40} rx={3} fill="#FFE1C7" stroke={L} strokeWidth={SW} />
    <rect x={-22} y={-54} width={44} height={14} rx={3} fill="#C2410C" stroke={L} strokeWidth={2} />
    <text y={-43.5} textAnchor="middle" fontSize={10} fontWeight={900} fill="#fff" fontFamily="Arial, sans-serif">BAR</text>
    <rect x={-18} y={-30} width={14} height={14} fill="#FFE27A" stroke={L} strokeWidth={1.8} />
    <rect x={4} y={-28} width={12} height={28} fill="#9A5A2A" stroke={L} strokeWidth={1.8} />
  </g>
)

export const Policia = ({ x, y, s = 1, ang = 0 }: Base & { ang?: number }) => (
  <g transform={g(x, y, s, ang)}>
    <rect x={-13} y={-7.5} width={26} height={15} rx={5} fill="#fff" stroke={L} strokeWidth={2.2} />
    <rect x={-13} y={-2} width={26} height={4} fill="#1C64C8" />
    <rect x={-2} y={-9} width={4} height={3} fill="#3DA5FF" className="destello" />
  </g>
)

export const Radar = ({ x, y, s = 1 }: Base) => (
  <g transform={g(x, y, s)}>
    <rect x={-2.5} y={-36} width={5} height={36} fill="#9AA0B4" stroke={L} strokeWidth={1.8} />
    <rect x={-10} y={-50} width={20} height={16} rx={3} fill="#FFD23F" stroke={L} strokeWidth={2.2} />
    <circle cx={0} cy={-42} r={4.5} fill="#2A2D3E" />
  </g>
)

export const Autoescuela = ({ x, y, s = 1 }: Base) => (
  <g transform={g(x, y, s)}>
    <rect x={-40} y={-44} width={80} height={44} rx={3} fill="#FFF3E0" stroke={L} strokeWidth={SW} />
    <rect x={-34} y={-62} width={68} height={18} rx={4} fill="#7C5CFF" stroke={L} strokeWidth={2.2} />
    <text y={-49} textAnchor="middle" fontSize={10} fontWeight={900} fill="#fff" fontFamily="Arial, sans-serif">AUTOESCUELA</text>
    <rect x={-30} y={-34} width={20} height={16} fill="#9ED8FF" stroke={L} strokeWidth={1.8} />
    <rect x={10} y={-34} width={20} height={34} fill="#7C5CFF" stroke={L} strokeWidth={1.8} />
    <rect x={-8} y={-30} width={12} height={12} rx={2} fill="#22A05A" stroke="#fff" strokeWidth={1.5} />
    <text x={-2} y={-20.5} textAnchor="middle" fontSize={10} fontWeight={900} fill="#fff" fontFamily="Arial, sans-serif">L</text>
  </g>
)

export const CentroExamen = ({ x, y, s = 1 }: Base) => (
  <g transform={g(x, y, s)}>
    <rect x={-58} y={-60} width={116} height={60} rx={4} fill="#fff" stroke={L} strokeWidth={SW} />
    <rect x={-52} y={-80} width={104} height={20} rx={4} fill="#1C64C8" stroke={L} strokeWidth={2.2} />
    <text y={-66} textAnchor="middle" fontSize={11} fontWeight={900} fill="#fff" fontFamily="Arial, sans-serif">CENTRO DE EXAMEN</text>
    {[-40, -16, 8, 32].map((c) => (
      <rect key={c} x={c} y={-50} width={14} height={14} fill="#9ED8FF" stroke={L} strokeWidth={1.8} />
    ))}
    <rect x={-10} y={-28} width={20} height={28} fill="#1C64C8" stroke={L} strokeWidth={1.8} />
  </g>
)

/** Bandera a cuadros de meta. */
export const Meta = ({ x, y, s = 1 }: Base) => (
  <g transform={g(x, y, s)}>
    <rect x={-1.5} y={-48} width={3} height={48} fill="#6F7590" stroke={L} strokeWidth={1.5} />
    <rect x={1.5} y={-48} width={26} height={18} fill="#fff" stroke={L} strokeWidth={2} />
    {[0, 1, 2].map((f) => [0, 1, 2, 3].map((k) => (f + k) % 2 === 0 && <rect key={`${f}${k}`} x={1.5 + k * 6.5} y={-48 + f * 6} width={6.5} height={6} fill={L} />))}
  </g>
)

// ---------- Piezas que se colocan sobre la carretera ----------

/** Paso de cebra orientado con la carretera. */
export const Cebra = ({ p }: { p: PuntoRuta }) => (
  <g transform={g(p.x, p.y, 1, (p.ang * 180) / Math.PI)}>
    {[-13, -6, 1, 8].map((k) => (
      <rect key={k} x={-7} y={k} width={14} height={4.5} fill="#fff" />
    ))}
  </g>
)

/** Línea de detención de STOP o ceda, cruzando la carretera. */
export const LineaDetencion = ({ p }: { p: PuntoRuta }) => (
  <g transform={g(p.x, p.y, 1, (p.ang * 180) / Math.PI)}>
    <rect x={-2} y={-16} width={4} height={32} fill="#fff" />
  </g>
)

/** Boca de túnel orientada con la carretera. */
export const BocaTunel = ({ p, salida = false }: { p: PuntoRuta; salida?: boolean }) => (
  <g transform={g(p.x, p.y, 1, (p.ang * 180) / Math.PI + (salida ? 180 : 0))}>
    <path d="M6-26H-4A26 26 0 0 0-4 26H6Z" fill="#9A8C7A" stroke={L} strokeWidth={SW} strokeLinejoin="round" />
    <path d="M6-20A20 20 0 0 0 6 20Z" fill="#14121F" />
  </g>
)

/** Barrera de paso a nivel junto a la carretera. */
export const Barrera = ({ x, y, s = 1, flip = false }: Base & { flip?: boolean }) => (
  <g transform={`${g(x, y, s)} scale(${flip ? -1 : 1} 1)`}>
    <rect x={-3} y={-22} width={6} height={22} fill="#9AA0B4" stroke={L} strokeWidth={1.8} />
    <rect x={0} y={-22} width={36} height={5} fill="#fff" stroke={L} strokeWidth={1.8} />
    {[6, 18, 30].map((k) => <rect key={k} x={k} y={-22} width={5} height={5} fill="#E3262E" />)}
    <circle cx={0} cy={-26} r={3.5} fill="#E3262E" stroke={L} strokeWidth={1.4} className="destello" />
  </g>
)
