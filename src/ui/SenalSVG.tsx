// Dibujo de señales en SVG, por código, con forma y colores normativos simplificados.
// viewBox 100×100. Rojo, azul, amarillo y gris del catálogo, sin depender de imágenes con derechos.

const ROJO = '#D8232A'
const AZUL = '#1C5EB8'
const AMARILLO = '#F5C400'
const NEGRO = '#1A1A1A'
const GRIS = '#8A8F98'

const Triangulo = ({ children }: { children?: React.ReactNode }) => (
  <>
    <path d="M50 8L94 86H6Z" fill="#fff" stroke={ROJO} strokeWidth={10} strokeLinejoin="round" />
    {children}
  </>
)
const CirculoRojo = ({ children, fondo = '#fff' }: { children?: React.ReactNode; fondo?: string }) => (
  <>
    <circle cx={50} cy={50} r={42} fill={fondo} stroke={ROJO} strokeWidth={11} />
    {children}
  </>
)
const CirculoAzul = ({ children }: { children?: React.ReactNode }) => (
  <>
    <circle cx={50} cy={50} r={46} fill={AZUL} stroke="#fff" strokeWidth={3} />
    {children}
  </>
)
const CuadradoAzul = ({ children }: { children?: React.ReactNode }) => (
  <>
    <rect x={6} y={6} width={88} height={88} rx={8} fill={AZUL} stroke="#fff" strokeWidth={3} />
    {children}
  </>
)
const Numero = ({ n, color = NEGRO, y = 63, size = 38 }: { n: string; color?: string; y?: number; size?: number }) => (
  <text x={50} y={y} textAnchor="middle" fontSize={size} fontWeight={900} fill={color} fontFamily="Arial, Helvetica, sans-serif">{n}</text>
)
const Flecha = ({ d, color = '#fff', w = 9 }: { d: string; color?: string; w?: number }) => (
  <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
)
const Peaton = ({ x = 50, y = 50, s = 1, color = NEGRO }: { x?: number; y?: number; s?: number; color?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={color} stroke={color} strokeLinecap="round" strokeWidth={5}>
    <circle cx={2} cy={-20} r={5} stroke="none" />
    <path d="M1-12L-2 6M-2 6L-9 20M-2 6L6 20M0-9L-10 0M0-9L10-2" fill="none" />
  </g>
)

const DIBUJOS: Record<string, () => React.ReactNode> = {
  'otros-peligros': () => <Triangulo><rect x={45} y={34} width={10} height={30} rx={3} fill={NEGRO} /><circle cx={50} cy={74} r={6} fill={NEGRO} /></Triangulo>,
  'semaforos-aviso': () => (
    <Triangulo>
      <rect x={40} y={33} width={20} height={46} rx={5} fill={NEGRO} />
      <circle cx={50} cy={42} r={5} fill={ROJO} /><circle cx={50} cy={56} r={5} fill={AMARILLO} /><circle cx={50} cy={70} r={5} fill="#1FA34A" />
    </Triangulo>
  ),
  'glorieta-aviso': () => (
    <Triangulo>
      <circle cx={50} cy={60} r={14} fill="none" stroke={NEGRO} strokeWidth={6} strokeDasharray="20 8" />
      <path d="M62 46l4 10-10-2Z M38 74l-4-10 10 2Z" fill={NEGRO} />
    </Triangulo>
  ),
  'curva-derecha': () => <Triangulo><Flecha d="M42 78V60Q42 44 58 40" color={NEGRO} w={8} /><path d="M54 32L68 40L55 48Z" fill={NEGRO} /></Triangulo>,
  'interseccion-prioridad': () => <Triangulo><path d="M50 32V80" stroke={NEGRO} strokeWidth={12} /><path d="M28 58H72" stroke={NEGRO} strokeWidth={6} /></Triangulo>,
  'interseccion-prioridad-derecha': () => <Triangulo><path d="M50 32V80" stroke={NEGRO} strokeWidth={12} /><path d="M50 56H72" stroke={NEGRO} strokeWidth={6} /></Triangulo>,
  'peatones-aviso': () => <Triangulo><Peaton y={60} s={1} /></Triangulo>,
  'perfil-irregular': () => <Triangulo><path d="M24 72Q32 54 40 72Q48 54 56 72Q64 54 72 72" fill="none" stroke={NEGRO} strokeWidth={7} strokeLinecap="round" /></Triangulo>,

  'circulacion-prohibida': () => <CirculoRojo />,
  'entrada-prohibida': () => (
    <>
      <circle cx={50} cy={50} r={46} fill={ROJO} stroke="#fff" strokeWidth={3} />
      <rect x={18} y={41} width={64} height={18} fill="#fff" />
    </>
  ),
  'velocidad-50': () => <CirculoRojo><Numero n="50" /></CirculoRojo>,
  'adelantamiento-prohibido': () => (
    <CirculoRojo>
      <rect x={24} y={36} width={20} height={30} rx={6} fill={ROJO} />
      <rect x={56} y={36} width={20} height={30} rx={6} fill={NEGRO} />
    </CirculoRojo>
  ),
  'parada-estacionamiento-prohibido': () => (
    <CirculoRojo fondo={AZUL}>
      <path d="M22 22L78 78M78 22L22 78" stroke={ROJO} strokeWidth={10} />
    </CirculoRojo>
  ),
  'estacionamiento-prohibido': () => (
    <CirculoRojo fondo={AZUL}>
      <path d="M22 22L78 78" stroke={ROJO} strokeWidth={10} />
    </CirculoRojo>
  ),
  'fin-prohibiciones': () => (
    <>
      <circle cx={50} cy={50} r={44} fill="#fff" stroke={NEGRO} strokeWidth={2} />
      {[-12, -4, 4, 12].map((k) => <path key={k} d={`M${22 + k} ${78 + k}L${78 + k} ${22 + k}`} stroke={GRIS} strokeWidth={4} />)}
    </>
  ),
  'fin-velocidad-50': () => (
    <>
      <circle cx={50} cy={50} r={44} fill="#fff" stroke={NEGRO} strokeWidth={2} />
      <Numero n="50" color={GRIS} />
      <path d="M22 78L78 22" stroke={GRIS} strokeWidth={8} />
    </>
  ),

  'sentido-obligatorio': () => <CirculoAzul><Flecha d="M50 78V26M32 44L50 26L68 44" /></CirculoAzul>,
  'paso-obligatorio': () => <CirculoAzul><Flecha d="M34 30L66 66M66 44V66H44" /></CirculoAzul>,
  'giratorio-obligatorio': () => (
    <CirculoAzul>
      {[0, 120, 240].map((a) => (
        <g key={a} transform={`rotate(${a} 50 50)`}>
          <path d="M50 22A28 28 0 0 0 26 36" fill="none" stroke="#fff" strokeWidth={7} />
          <path d="M20 30L24 44L34 34Z" fill="#fff" />
        </g>
      ))}
    </CirculoAzul>
  ),
  'velocidad-minima-50': () => <CirculoAzul><Numero n="50" color="#fff" /></CirculoAzul>,

  ceda: () => <path d="M8 14H92L50 90Z" fill="#fff" stroke={ROJO} strokeWidth={11} strokeLinejoin="round" />,
  stop: () => (
    <>
      <polygon points="31,4 69,4 96,31 96,69 69,96 31,96 4,69 4,31" fill={ROJO} stroke="#fff" strokeWidth={4} />
      <text x={50} y={60} textAnchor="middle" fontSize={27} fontWeight={900} fill="#fff" fontFamily="Arial, Helvetica, sans-serif">STOP</text>
    </>
  ),
  'calzada-prioridad': () => (
    <g transform="rotate(45 50 50)">
      <rect x={18} y={18} width={64} height={64} fill="#fff" stroke={NEGRO} strokeWidth={2} />
      <rect x={30} y={30} width={40} height={40} fill={AMARILLO} />
    </g>
  ),
  'fin-prioridad': () => (
    <>
      <g transform="rotate(45 50 50)">
        <rect x={18} y={18} width={64} height={64} fill="#fff" stroke={NEGRO} strokeWidth={2} />
        <rect x={30} y={30} width={40} height={40} fill={AMARILLO} />
      </g>
      <path d="M22 78L78 22" stroke={NEGRO} strokeWidth={6} />
      <path d="M30 84L84 30M16 70L70 16" stroke={NEGRO} strokeWidth={3} />
    </>
  ),

  'paso-peatones': () => (
    <CuadradoAzul>
      <path d="M50 16L84 82H16Z" fill="#fff" />
      <Peaton y={60} s={0.85} />
    </CuadradoAzul>
  ),
  estacionamiento: () => <CuadradoAzul><Numero n="P" color="#fff" y={70} size={62} /></CuadradoAzul>,
  'velocidad-aconsejada-50': () => <CuadradoAzul><Numero n="50" color="#fff" /></CuadradoAzul>,
  'sentido-unico': () => <CuadradoAzul><path d="M50 18L72 44H58V82H42V44H28Z" fill="#fff" /></CuadradoAzul>,
}

export function SenalSVG({ id, size = 96, titulo }: { id: string; size?: number; titulo?: string }) {
  const dibujo = DIBUJOS[id]
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={titulo ?? id}>
      {dibujo ? dibujo() : <circle cx={50} cy={50} r={40} fill="#ccc" />}
    </svg>
  )
}
