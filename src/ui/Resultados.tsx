import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import type { ResultadoPartida } from './Nivel'
import { rangoDe } from '../game/progreso'
import { sfx, vibrar } from '../audio/sfx'
import { confeti } from './particulas'
import { Estrella } from './iconos'
import { pct, useListo } from '../store/selectores'
import type { Novedades } from '../store/progresoDiario'
import { mundoPorId } from '../content/mundos'
import { Llama } from './iconos'
import { Cofre } from './Retos'
import { compartirImagen } from './compartir'

const TITULOS = ['¡A repasar!', '¡Superado!', '¡Muy bien!', '¡Nivel examen!']

interface Props {
  r: ResultadoPartida
  nov?: Novedades
  onRepetir: () => void
  onMapa: () => void
}

/** Cuenta de 0 al valor final con aceleración suave. */
function useContador(final: number, duracion = 900, retraso = 0) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let raf = 0
    const t0 = performance.now() + retraso
    const paso = (t: number) => {
      const k = Math.min(1, Math.max(0, (t - t0) / duracion))
      setV(Math.round(final * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(paso)
    }
    raf = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(raf)
  }, [final, duracion, retraso])
  return v
}

export function Resultados({ r, nov, onRepetir, onMapa }: Props) {
  const antes = rangoDe(r.xpAntes)
  const despues = rangoDe(r.xpAntes + r.xpGanada)
  const subeRango = despues.indice > antes.indice
  const xp = useContador(r.xpGanada, 900, 300)
  const listo = useListo()
  // Mientras la probabilidad de aprobar sea casi 0, se enseña el temario dominado, que sí se mueve.
  const usarTemario = listo.prob < 0.05 && r.listoAntes < 0.05
  const antesPct = pct(usarTemario ? r.temarioAntes : r.listoAntes), despuesPct = pct(usarTemario ? listo.temario : listo.prob)
  const listoAnim = antesPct + useContador(despuesPct - antesPct, 1200, 900)

  // Sonido de cada estrella al aparecer, y celebración si sube de rango o saca 3.
  useEffect(() => {
    const timers = Array.from({ length: r.estrellas }, (_, i) =>
      setTimeout(() => {
        sfx.estrella(i)
        vibrar(20)
      }, 350 + i * 300),
    )
    if (subeRango || r.estrellas === 3 || r.victoria || (nov && nov.logros.length > 0)) {
      timers.push(
        setTimeout(() => {
          confeti()
          sfx.subida()
          vibrar([40, 50, 40, 50, 80])
        }, 400 + r.estrellas * 300),
      )
    }
    return () => timers.forEach(clearTimeout)
  }, [r.estrellas, subeRango])

  // Momento "casi lo tienes": decir lo poco que falta para algo.
  let casi: string | null = null
  if (r.estrellas < 3 && r.aciertos === r.total - 2) casi = 'Te faltó 1 acierto para las 3 estrellas. ¡Repite y lo clavas!'
  else if (r.config.tipo !== 'juego' && r.estrellas < 3 && r.aciertos >= r.total - 1) casi = 'Acertaste de sobra, pero fuiste lento. Para 3 estrellas: menos de 20 s por pregunta.'
  else if (!subeRango && despues.siguiente && despues.faltan <= 60) casi = `Solo ${despues.faltan} XP para ser ${despues.siguiente}.`

  return (
    <main className="resultados">
      <motion.h1 initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
        {r.config.tipo === 'jefe' ? (r.victoria ? `¡Has vencido a ${mundoPorId(r.config.mundo).jefe}!` : `${mundoPorId(r.config.mundo).jefe} gana esta vez`) : r.config.tipo === 'simulacro' ? (r.victoria ? '¡APTO!' : 'No apto, todavía') : TITULOS[r.estrellas]}
      </motion.h1>
      {r.config.tipo === 'jefe' && (
        <p className="nota">{r.victoria ? 'Se abre el siguiente mundo y ganas un cofre de jefe.' : 'Al cuarto fallo se pierde, como en el examen. Repasa y vuelve a retarle.'}</p>
      )}

      <div className="estrellas-grandes" aria-label={`${r.estrellas} de 3 estrellas`}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', bounce: 0.55, delay: 0.3 + i * 0.3 }}
            style={{ display: 'contents' }}
          >
            <Estrella llena={i < r.estrellas} />
          </motion.span>
        ))}
      </div>

      <div className="cifras">
        <div className="cifra pegatina">
          <b>
            {r.aciertos}/{r.total}
          </b>
          <span>aciertos</span>
        </div>
        <div className="cifra pegatina">
          <b>+{xp}</b>
          <span>XP ganada</span>
        </div>
      </div>

      {nov && (
        <div className="novedades">
          {nov.monedas > 0 && <motion.div className="pegatina novedad" initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1 }}><i className="moneda" /> <b>+{nov.monedas} monedas</b></motion.div>}
          {nov.racha.cambio !== 'igual' && (
            <motion.div className="pegatina novedad" initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1.15 }}>
              <Llama /> <span><b>Racha: {nov.racha.actual} {nov.racha.actual === 1 ? 'día' : 'días'}.</b> {nov.racha.cambio === 'protegida' ? 'Un protector ha salvado tu racha.' : nov.racha.protectorGanado ? '¡Has ganado un protector de racha!' : 'Hoy ya cuenta.'}</span>
            </motion.div>
          )}
          {nov.misiones.map((m, k) => (
            <motion.div key={m.id} className="pegatina novedad" initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1.3 + k * 0.15 }}>
              ✓ <span>Misión cumplida: <b>{m.texto}</b> (+{m.monedas})</span>
            </motion.div>
          ))}
          {nov.logros.map((l, k) => (
            <motion.div key={l.id} className="pegatina novedad logro-nuevo" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.6 + k * 0.2, type: 'spring', bounce: 0.5 }}>
              ★ <span>Logro: <b>{l.nombre}</b>. {l.descripcion}</span>
            </motion.div>
          ))}
          {nov.cofres.length > 0 && (
            <motion.div className="pegatina novedad" initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1.9 }}>
              <Cofre tipo={nov.cofres[0]} size={30} /> <span><b>{nov.cofres.length === 1 ? 'Has ganado un cofre' : `Has ganado ${nov.cofres.length} cofres`}.</b> Ábrelo en Retos.</span>
            </motion.div>
          )}
        </div>
      )}

      {casi && (
        <motion.div className="casi pegatina" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.3 }}>
          {casi}
        </motion.div>
      )}

      <div className="bloque-rango pegatina listo-bloque">
        <div className="fila">
          <span>{usarTemario ? 'Temario dominado' : 'Probabilidad de aprobar'}</span>
          <strong>{listoAnim} %</strong>
        </div>
        <div className="barra">
          <motion.i
            initial={{ width: `${Math.max(2, antesPct)}%` }}
            animate={{ width: `${Math.max(2, despuesPct)}%` }}
            transition={{ delay: 0.9, duration: 1.2, ease: 'easeOut' }}
          />
        </div>
        <div className="fila">
          <span>
            {despuesPct > antesPct ? `¡+${despuesPct - antesPct} puntos en esta partida!` : despuesPct < antesPct ? 'Los fallos de hoy vuelven pronto para que los fijes.' : 'Cada pregunta dominada lo hace subir.'}
          </span>
        </div>
      </div>

      <div className="bloque-rango pegatina">
        <div className="fila">
          <span>{subeRango ? '¡Nuevo rango!' : 'Tu rango'}</span>
          <strong>{despues.nombre}</strong>
        </div>
        <div className="barra">
          <motion.i
            initial={{ width: `${(subeRango ? 0 : antes.progreso) * 100}%` }}
            animate={{ width: `${Math.max(4, despues.progreso * 100)}%` }}
            transition={{ delay: 0.6, duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="fila">
          <span>{despues.siguiente ? `${despues.faltan} XP para ${despues.siguiente}` : 'Rango máximo'}</span>
          {r.mejorCombo >= 3 && <span>Mejor combo x{r.mejorCombo}</span>}
        </div>
      </div>

      {r.fallos.length > 0 && (
        <details className="repaso pegatina">
          <summary>Repasa tus {r.fallos.length} fallos</summary>
          <ul>
            {r.fallos.map(({ pregunta, elegida }) => (
              <li key={pregunta.id}>
                {pregunta.enunciado}
                <span>Respondiste: {elegida}</span>
                <span>Correcta: {pregunta.opciones.find((o) => o.correcta)!.texto}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {r.config.tipo === 'simulacro' && r.victoria && <BotonCompartir sello="APTO" titulo="¡Simulacro aprobado!" detalle={`${r.aciertos}/30 aciertos · ${r.total - r.aciertos} ${r.total - r.aciertos === 1 ? 'fallo' : 'fallos'}`} />}

      <div className="acciones">
        <button className="boton" onClick={onRepetir}>
          Jugar otra vez
        </button>
        <button className="boton secundario" onClick={onMapa}>
          Volver al mapa
        </button>
      </div>
    </main>
  )
}

export function BotonCompartir(props: { sello: string; titulo: string; detalle: string }) {
  const [aviso, setAviso] = useState('')
  return (
    <>
      <button className="boton compartir" onClick={async () => setAviso(await compartirImagen(props))}>Compartir en mis redes</button>
      {aviso && <p className="nota" role="status">{aviso}</p>}
    </>
  )
}
