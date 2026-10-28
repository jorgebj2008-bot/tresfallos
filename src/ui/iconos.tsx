// Iconos SVG propios: sin dependencias y con el contorno grueso del estilo.

export function Estrella({ llena = true }: { llena?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z"
        fill={llena ? 'var(--gold)' : 'var(--off)'}
        stroke="var(--line)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export const Candado = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2.5" {...trazo} /><path d="M8 11V8a4 4 0 0 1 8 0v3" {...trazo} /></svg>
)
export const Check = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" {...trazo} strokeWidth={3.2} /></svg>
)
export const Cruz = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" {...trazo} strokeWidth={3.2} /></svg>
)
export const Altavoz = ({ on }: { on: boolean }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" {...trazo} />
    {on ? <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" {...trazo} /> : <path d="M16 9.5l5 5M21 9.5l-5 5" {...trazo} />}
  </svg>
)
export const Nota = ({ on }: { on: boolean }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 18V5l11-2v13" {...trazo} />
    <circle cx="6.5" cy="18" r="2.6" {...trazo} />
    <circle cx="17.5" cy="16" r="2.6" {...trazo} />
    {!on && <path d="M3 3l18 18" {...trazo} />}
  </svg>
)
export const Luna = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" {...trazo} /></svg>
)
export const Sol = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="4" {...trazo} />
    <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" {...trazo} />
  </svg>
)
export const Auto = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" {...trazo} /><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor" /></svg>
)
export const Llama = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16">
    <path d="M12 2.5c1 3.5 5.5 5.5 5.5 10.5a5.5 5.5 0 0 1-11 0c0-2.5 1.5-4 2.5-5 .3 2 1.3 3 2.3 3.2C10.6 8 11 5 12 2.5z" fill="var(--bad)" stroke="var(--line)" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
)

export const IconoMapa = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 6.5l5.5-2 6 2 5.5-2v13l-5.5 2-6-2-5.5 2z M9 4.5v13 M15 6.5v13" {...trazo} /></svg>
)
export const IconoMedidor = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17a8 8 0 1 1 16 0" {...trazo} /><path d="M12 17l4-6" {...trazo} /><circle cx="12" cy="17" r="1.6" fill="currentColor" /></svg>
)
export const IconoCuaderno = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3.5" width="14" height="17" rx="2" {...trazo} /><path d="M9 8h6M9 12h6M9 16h3" {...trazo} /></svg>
)
export const IconoMando = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8h10a4 4 0 0 1 4 4.5l-.6 3.2a2.3 2.3 0 0 1-4 1L15 15H9l-1.4 1.7a2.3 2.3 0 0 1-4-1L3 12.5A4 4 0 0 1 7 8z" {...trazo} /><path d="M8 11v3M6.5 12.5h3" {...trazo} /><circle cx="15.5" cy="12" r="1.1" fill="currentColor" /><circle cx="17.5" cy="13.6" r="1.1" fill="currentColor" /></svg>
)
