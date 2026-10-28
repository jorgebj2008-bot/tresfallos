import { JUEGOS, type JuegoId } from '../../game/juegos'
import { useJuego } from '../../store/useJuego'
import { SenalSVG } from '../SenalSVG'

const MINIATURA: Record<JuegoId, React.ReactNode> = {
  cruce: (
    <svg viewBox="0 0 80 80" aria-hidden="true">
      <rect width={80} height={80} rx={12} fill="#9EE6B0" />
      <rect x={28} width={24} height={80} fill="#4A4E69" />
      <rect y={28} width={80} height={24} fill="#4A4E69" />
      <rect x={42} y={56} width={8} height={14} rx={3} fill="#FF5A5F" stroke="#1E1B2E" strokeWidth={2} />
      <rect x={10} y={42} width={14} height={8} rx={3} fill="#3DA5FF" stroke="#1E1B2E" strokeWidth={2} />
    </svg>
  ),
  senales: <SenalSVG id="stop" size={64} titulo="STOP" />,
  verdad: (
    <svg viewBox="0 0 80 80" aria-hidden="true">
      <rect x={14} y={10} width={44} height={58} rx={8} fill="#fff" stroke="#1E1B2E" strokeWidth={3} transform="rotate(-10 36 39)" />
      <rect x={24} y={12} width={44} height={58} rx={8} fill="#7C5CFF" stroke="#1E1B2E" strokeWidth={3} transform="rotate(8 46 41)" />
      <text x={47} y={50} textAnchor="middle" fontSize={26} fontWeight={900} fill="#fff" fontFamily="Arial">?</text>
    </svg>
  ),
}

export function Juegos({ onJugar, incrustado = false }: { onJugar: (j: JuegoId) => void; incrustado?: boolean }) {
  const records = useJuego((s) => s.perfil.records) ?? {}
  const Contenedor = incrustado ? 'section' : 'main'
  return (
    <Contenedor className={incrustado ? 'bloque' : 'pantalla'}>
      {incrustado ? <h2>Minijuegos</h2> : <h1 className="titulo-pantalla">Minijuegos</h1>}
      <p className="nota">Partidas rápidas para entrenar lo que más se falla. Todo lo que juegas aquí también cuenta para tu repaso.</p>
      {JUEGOS.map((j) => (
        <article key={j.id} className="pegatina tarjeta-juego" style={{ '--color': j.color } as React.CSSProperties}>
          <div className="miniatura">{MINIATURA[j.id]}</div>
          <div className="info-juego">
            <span className="rotulo">{j.entrena}</span>
            <h2>{j.nombre}</h2>
            <p>{j.descripcion}</p>
            {records[j.id] ? <p className="nota">Tu récord: {records[j.id]} puntos</p> : null}
          </div>
          <button className="boton mini" onClick={() => onJugar(j.id)}>Jugar</button>
        </article>
      ))}
    </Contenedor>
  )
}
