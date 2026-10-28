import { motion } from 'motion/react'
import { useJuego } from '../store/useJuego'
import { rangoDe } from '../game/progreso'
import { Altavoz, Auto, Luna, Sol } from './iconos'

const NOMBRE_TEMA = { auto: 'Tema automático', claro: 'Tema de día', noche: 'Tema de noche' }

export function Cabecera() {
  const { perfil, alternarSonido, cambiarTema } = useJuego()
  const rango = rangoDe(perfil.xp)

  return (
    <header className="cabecera">
      <div className="marca" aria-label="TresFallos">
        Tres<b>Fallos</b>
      </div>
      <div className="rango">
        <small>
          {rango.nombre} · {perfil.xp} XP
        </small>
        <div className="barra" role="progressbar" aria-label="Progreso de rango" aria-valuenow={Math.round(rango.progreso * 100)}>
          <motion.i initial={false} animate={{ width: `${Math.max(4, rango.progreso * 100)}%` }} transition={{ type: 'spring', bounce: 0.3 }} />
        </div>
      </div>
      <button className="icono-boton" onClick={cambiarTema} aria-label={NOMBRE_TEMA[perfil.tema]} title={NOMBRE_TEMA[perfil.tema]}>
        {perfil.tema === 'auto' ? <Auto /> : perfil.tema === 'claro' ? <Sol /> : <Luna />}
      </button>
      <button className="icono-boton" onClick={alternarSonido} aria-label={perfil.sonido ? 'Silenciar' : 'Activar sonido'}>
        <Altavoz on={perfil.sonido} />
      </button>
    </header>
  )
}
