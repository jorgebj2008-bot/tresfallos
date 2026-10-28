import { SenalSVG as SenalImg } from './SenalSVG'

// Escenas de tráfico vistas desde arriba para las preguntas con imagen ("escena:<id>").
// Mismo estilo que el resto del juego. Tu coche siempre es el rojo con la etiqueta «TÚ».

const L = '#1E1B2E'
const ASF = '#4A4E69'
const CES = '#9EE6B0'

/** Coche visto desde arriba. ang en grados (0 = hacia arriba). */
function Coche({ x, y, ang = 0, c = '#3DA5FF', tu = false, s = 1 }: { x: number; y: number; ang?: number; c?: string; tu?: boolean; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${ang}) scale(${s})`}>
      <rect x={-11} y={-19} width={22} height={38} rx={7} fill={tu ? '#FF5A5F' : c} stroke={L} strokeWidth={2.5} />
      <rect x={-8} y={-11} width={16} height={8} rx={2.5} fill="#CFEAFF" stroke={L} strokeWidth={1.6} />
      {tu && (
        <g transform={`rotate(${-ang})`}>
          <rect x={-15} y={-33} width={30} height={15} rx={5} fill="#FFD23F" stroke={L} strokeWidth={2} />
          <text y={-22} textAnchor="middle" fontSize={11} fontWeight={900} fill={L} fontFamily="Arial">TÚ</text>
        </g>
      )}
    </g>
  )
}
const Camion = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-13} y={-34} width={26} height={68} rx={4} fill="#FF9F1C" stroke={L} strokeWidth={2.5} />
    <rect x={-10} y={-30} width={20} height={10} rx={2} fill="#CFEAFF" stroke={L} strokeWidth={1.5} />
  </g>
)
const Flecha = ({ d, c = '#FF5A5F' }: { d: string; c?: string }) => (
  <path d={d} fill="none" stroke={c} strokeWidth={4} strokeDasharray="8 6" strokeLinecap="round" markerEnd="url(#punta)" />
)
const Defs = () => (
  <defs>
    <marker id="punta" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
      <path d="M0 0L10 5L0 10Z" fill="#FF5A5F" />
    </marker>
  </defs>
)
const Cruce = () => (
  <>
    <rect width={300} height={220} fill={CES} />
    <rect x={115} y={0} width={70} height={220} fill={ASF} />
    <rect x={0} y={75} width={300} height={70} fill={ASF} />
    <path d="M150 0V75M150 145V220M0 110H115M185 110H300" stroke="#fff" strokeWidth={2.5} strokeDasharray="10 9" />
  </>
)
const Stop = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <polygon points="-6,-14 6,-14 14,-6 14,6 6,14 -6,14 -14,6 -14,-6" fill="#E3262E" stroke="#fff" strokeWidth={2} />
    <text y={3.5} textAnchor="middle" fontSize={7.5} fontWeight={900} fill="#fff" fontFamily="Arial">STOP</text>
  </g>
)

const ESCENAS: Record<string, { titulo: string; dibujo: React.ReactNode }> = {
  'glorieta-entrar': {
    titulo: 'Glorieta: vas a entrar y otro coche ya circula dentro',
    dibujo: (
      <>
        <rect width={300} height={220} fill={CES} />
        <rect x={125} y={150} width={50} height={70} fill={ASF} />
        <rect x={0} y={90} width={70} height={40} fill={ASF} />
        <circle cx={150} cy={105} r={78} fill={ASF} />
        <circle cx={150} cy={105} r={36} fill="#6FD08C" stroke="#fff" strokeWidth={3} />
        <circle cx={150} cy={105} r={57} fill="none" stroke="#fff" strokeWidth={2} strokeDasharray="8 8" />
        <path d="M128 175H172" stroke="#fff" strokeWidth={3} strokeDasharray="6 5" />
        <Coche x={150} y={198} tu />
        <Coche x={93} y={92} ang={160} c="#3DA5FF" />
      </>
    ),
  },
  'cruce-derecha': {
    titulo: 'Cruce sin señales: llegas a la vez que otro coche',
    dibujo: (
      <>
        <Cruze />
        <Coche x={167} y={185} tu />
        <Coche x={255} y={93} ang={-90} />
      </>
    ),
  },
  'cruce-stop': {
    titulo: 'Tienes un STOP y por la vía principal se acerca un coche por tu izquierda',
    dibujo: (
      <>
        <Cruze />
        <path d="M150 150H185" stroke="#fff" strokeWidth={4} />
        <Stop x={200} y={168} />
        <Coche x={167} y={185} tu />
        <Coche x={45} y={127} ang={90} />
      </>
    ),
  },
  'giro-izquierda': {
    titulo: 'Quieres girar a la izquierda y viene un coche de frente',
    dibujo: (
      <>
        <Defs />
        <Cruze />
        <Flecha d="M167 160Q167 95 95 93" />
        <Coche x={167} y={185} tu />
        <Coche x={133} y={30} ang={180} c="#22C55E" />
      </>
    ),
  },
  'adelantar-continua': {
    titulo: 'Detrás de un camión, con línea continua en el centro',
    dibujo: (
      <>
        <rect width={300} height={220} fill={CES} />
        <rect x={90} y={0} width={120} height={220} fill={ASF} />
        <path d="M150 0V220" stroke="#fff" strokeWidth={4} />
        <Camion x={180} y={70} />
        <Coche x={180} y={170} tu />
      </>
    ),
  },
  'adelantar-ciclista': {
    titulo: 'Vas a adelantar a un ciclista',
    dibujo: (
      <>
        <rect width={300} height={220} fill={CES} />
        <rect x={90} y={0} width={120} height={220} fill={ASF} />
        <path d="M150 0V220" stroke="#fff" strokeWidth={2.5} strokeDasharray="12 10" />
        <g transform="translate(195 80)">
          <rect x={-3} y={-16} width={6} height={32} rx={3} fill="#555B78" stroke={L} strokeWidth={2} />
          <circle r={7} fill="#7C5CFF" stroke={L} strokeWidth={2} />
        </g>
        <Coche x={135} y={95} tu />
        <path d="M150 68H190" stroke="#FFD23F" strokeWidth={3} />
        <path d="M150 62V74M190 62V74" stroke="#FFD23F" strokeWidth={3} />
        <text x={170} y={58} textAnchor="middle" fontSize={11} fontWeight={900} fill="#fff" fontFamily="Arial">?</text>
      </>
    ),
  },
  'paso-peatones': {
    titulo: 'Un peatón ha empezado a cruzar por el paso de peatones',
    dibujo: (
      <>
        <rect width={300} height={220} fill="#DCD5C4" />
        <rect x={90} y={0} width={120} height={220} fill={ASF} />
        {[0, 1, 2, 3, 4, 5].map((k) => <rect key={k} x={96 + k * 19} y={70} width={11} height={34} fill="#fff" />)}
        <circle cx={128} cy={87} r={9} fill="#FFD23F" stroke={L} strokeWidth={2.5} />
        <Coche x={180} y={170} tu />
      </>
    ),
  },
  incorporacion: {
    titulo: 'Te incorporas a una autovía por el carril de aceleración',
    dibujo: (
      <>
        <rect width={300} height={220} fill={CES} />
        <rect x={80} y={0} width={120} height={220} fill={ASF} />
        <path d="M140 0V220" stroke="#fff" strokeWidth={2.5} strokeDasharray="12 10" />
        <path d="M200 220L200 40L210 0H260L240 120V220Z" fill={ASF} />
        <path d="M200 40V200" stroke="#fff" strokeWidth={2.5} strokeDasharray="6 8" />
        <Coche x={225} y={170} tu />
        <Coche x={170} y={130} c="#3DA5FF" />
      </>
    ),
  },
  'autovia-carriles': {
    titulo: 'Autovía de tres carriles con el carril derecho libre',
    dibujo: (
      <>
        <rect width={300} height={220} fill={CES} />
        <rect x={60} y={0} width={180} height={220} fill={ASF} />
        <path d="M120 0V220M180 0V220" stroke="#fff" strokeWidth={2.5} strokeDasharray="12 10" />
        <Coche x={150} y={140} tu />
        <Coche x={90} y={50} c="#22C55E" />
      </>
    ),
  },
  'paso-nivel': {
    titulo: 'Paso a nivel con las luces rojas encendidas',
    dibujo: (
      <>
        <rect width={300} height={220} fill={CES} />
        <rect x={115} y={0} width={70} height={220} fill={ASF} />
        <rect x={0} y={70} width={300} height={34} fill="#A99C8A" />
        {Array.from({ length: 20 }, (_, k) => <rect key={k} x={k * 15} y={71} width={6} height={32} fill="#7A5A3A" />)}
        <path d="M0 78H300M0 96H300" stroke="#5B6178" strokeWidth={3} />
        <g transform="translate(200 120)"><rect x={-3} y={0} width={6} height={30} fill="#9AA0B4" /><circle cx={-6} cy={-2} r={6} fill="#FF3B3B" stroke={L} strokeWidth={2} /><circle cx={8} cy={-2} r={6} fill="#FF3B3B" stroke={L} strokeWidth={2} /></g>
        <Coche x={167} y={180} tu />
      </>
    ),
  },
  'tunel': {
    titulo: 'Entrada a un túnel',
    dibujo: (
      <>
        <rect width={300} height={220} fill={CES} />
        <path d="M0 110Q60 10 150 20Q240 10 300 110V0H0Z" fill="#8FA36B" stroke={L} strokeWidth={3} />
        <rect x={105} y={60} width={90} height={160} fill={ASF} />
        <path d="M105 80A45 45 0 0 1 195 80V100H105Z" fill="#14121F" />
        <path d="M150 100V220" stroke="#fff" strokeWidth={2.5} strokeDasharray="12 10" />
        <Coche x={170} y={175} tu />
      </>
    ),
  },
}

/** Fondo de cruce (alias con nombre propio para leer mejor las escenas). */
function Cruze() {
  return <Cruce />
}

export const ESCENAS_IDS = Object.keys(ESCENAS)

export function EscenaSVG({ id, ancho = 300 }: { id: string; ancho?: number }) {
  const e = ESCENAS[id]
  if (!e) return null
  return (
    <svg viewBox="0 0 300 220" width={ancho} height={(ancho * 220) / 300} role="img" aria-label={e.titulo} style={{ maxWidth: '100%', height: 'auto', borderRadius: 14, border: `3px solid ${L}` }}>
      {e.dibujo}
    </svg>
  )
}

/** Imagen de una pregunta: señal o escena. */
export function ImagenPregunta({ imagen, pequena = false }: { imagen: string | null; pequena?: boolean }) {
  if (!imagen) return null
  const [tipo, id] = imagen.split(':')
  return <div className="imagen-pregunta">{tipo === 'escena' ? <EscenaSVG id={id} ancho={pequena ? 160 : 300} /> : <SenalImg id={id} size={pequena ? 64 : 110} />}</div>
}

