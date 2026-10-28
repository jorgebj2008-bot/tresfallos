import { motion } from 'motion/react'
import { useJuego } from '../store/useJuego'
import { rangoDe } from '../game/progreso'
import { Altavoz, Auto, Llama, Luna, Nota, Sol } from './iconos'
import { RACHA_INICIAL, diaLocal, rachaVisible } from '../game/retencion'

const NOMBRE_TEMA = { auto: 'Tema automático', claro: 'Tema de día', noche: 'Tema de noche' }

export function Cabecera() {
  const { perfil, alternarSonido, alternarMusica, cambiarTema } = useJuego()
  const rango = rangoDe(perfil.xp)
  const racha = rachaVisible(perfil.racha ?? RACHA_INICIAL, diaLocal(Date.now()))

  return (
    <header className="cabecera">
      <div className="marca" aria-label="TresFallos">
        Tres<b>Fallos</b>
      </div>
      <div className="chips-cabecera">
        <span className="chip-cab" aria-label={`Racha de ${racha} días`}><Llama /> {racha}</span>
        <span className="chip-cab" aria-label={`${perfil.monedas ?? 0} monedas`}><i className="moneda" /> {perfil.monedas ?? 0}</span>
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
      <button className="icono-boton" onClick={alternarMusica} aria-label={perfil.musica === false ? 'Activar música' : 'Quitar música'}>
        <Nota on={perfil.musica !== false} />
      </button>
      <button className="icono-boton" onClick={alternarSonido} aria-label={perfil.sonido ? 'Silenciar' : 'Activar sonido'}>
        <Altavoz on={perfil.sonido} />
      </button>
    </header>
  )
}
