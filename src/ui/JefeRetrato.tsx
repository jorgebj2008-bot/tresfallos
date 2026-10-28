// Retratos de los examinadores-jefe: caras en estilo pegatina, con un accesorio por mundo.
import { MUNDOS } from '../content/mundos'
import type { MundoId } from '../content/tipos'

const L = '#1E1B2E'

const ACCESORIO: Record<MundoId, React.ReactNode> = {
  conductor: <><rect x={22} y={10} width={56} height={14} rx={4} fill="#3A2F6E" stroke={L} strokeWidth={3} /><circle cx={70} cy={70} r={9} fill="#FF5A5F" stroke={L} strokeWidth={2.5} /><text x={70} y={74} textAnchor="middle" fontSize={9} fontWeight={900} fill="#fff" fontFamily="Arial">OK</text></>,
  via: <><path d="M18 30Q50 0 82 30Z" fill="#FFF3E0" stroke={L} strokeWidth={3} /><circle cx={50} cy={14} r={5} fill="#FF5A5F" stroke={L} strokeWidth={2} /></>,
  senales: <><path d="M20 30H80L74 14H26Z" fill="#1C64C8" stroke={L} strokeWidth={3} /><rect x={44} y={16} width={12} height={8} fill="#FFD23F" /><circle cx={78} cy={66} r={6} fill="#C9CDD9" stroke={L} strokeWidth={2} /></>,
  velocidad: <><path d="M24 28Q50 4 76 28Z" fill="#1E1B2E" /><rect x={20} y={26} width={60} height={6} fill="#1E1B2E" /><rect x={30} y={44} width={40} height={10} rx={5} fill="#2A2D3E" stroke={L} strokeWidth={2} /></>,
  prioridad: <><path d="M18 30Q50 6 82 30Z" fill="#2EC4B6" stroke={L} strokeWidth={3} /><circle cx={50} cy={20} r={6} fill="none" stroke="#fff" strokeWidth={3} strokeDasharray="6 4" /></>,
  maniobras: <><rect x={22} y={14} width={56} height={16} rx={8} fill="#E15FBF" stroke={L} strokeWidth={3} /><path d="M40 62Q50 70 60 62" stroke={L} strokeWidth={3} fill="none" /></>,
  alumbrado: <><path d="M26 30L34 10L42 22L50 6L58 22L66 10L74 30Z" fill="#FFD23F" stroke={L} strokeWidth={3} strokeLinejoin="round" /></>,
  autopistas: <><rect x={22} y={14} width={56} height={14} rx={3} fill="#0FA968" stroke={L} strokeWidth={3} /><rect x={30} y={26} width={40} height={5} fill="#1E1B2E" /></>,
  alcohol: <><rect x={70} y={50} width={12} height={22} rx={3} fill="#C9CDD9" stroke={L} strokeWidth={2.5} /><rect x={73} y={44} width={6} height={8} fill="#2A2D3E" /><path d="M24 26Q50 10 76 26" stroke={L} strokeWidth={4} fill="none" /></>,
  seguridad: <><circle cx={38} cy={44} r={9} fill="#CFEAFF" stroke={L} strokeWidth={3} /><circle cx={62} cy={44} r={9} fill="#CFEAFF" stroke={L} strokeWidth={3} /><path d="M47 44H53" stroke={L} strokeWidth={3} /><path d="M30 16H70" stroke="#fff" strokeWidth={5} /><path d="M46 10V22M40 16H52" stroke="#EF4444" strokeWidth={4} /></>,
  accidentes: <><path d="M22 30Q50 2 78 30Z" fill="#5A6B3A" stroke={L} strokeWidth={3} /><rect x={20} y={26} width={60} height={6} fill="#4A5A2E" stroke={L} strokeWidth={2} /></>,
  eficiente: <><path d="M30 28Q50 0 70 28Z" fill="#22C55E" stroke={L} strokeWidth={3} /><path d="M50 8Q60 2 64 10Q56 14 50 8Z" fill="#A3E635" stroke={L} strokeWidth={2} /></>,
  sanciones: <><path d="M20 34Q20 8 50 8Q80 8 80 34Q70 26 50 26Q30 26 20 34Z" fill="#F4F1EA" stroke={L} strokeWidth={3} /><path d="M22 34Q26 44 24 52M78 34Q74 44 76 52" stroke="#F4F1EA" strokeWidth={8} strokeLinecap="round" /></>,
}

export function JefeRetrato({ mundo, size = 72, enfadado = false }: { mundo: MundoId; size?: number; enfadado?: boolean }) {
  const m = MUNDOS.find((x) => x.id === mundo)!
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={m.jefe}>
      <circle cx={50} cy={54} r={36} fill={m.color} stroke={L} strokeWidth={3.5} />
      <circle cx={38} cy={50} r={5} fill={L} />
      <circle cx={62} cy={50} r={5} fill={L} />
      <path d={enfadado ? 'M30 38L44 44M70 38L56 44' : 'M30 40L44 40M56 40L70 40'} stroke={L} strokeWidth={4} strokeLinecap="round" />
      <path d={enfadado ? 'M38 74Q50 66 62 74' : 'M38 70Q50 78 62 70'} stroke={L} strokeWidth={4} fill="none" strokeLinecap="round" />
      {ACCESORIO[mundo]}
    </svg>
  )
}
