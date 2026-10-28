import { motion } from 'motion/react'
import { useJuego } from '../store/useJuego'
import { pct, useDebiles, useListo, useVencidas } from '../store/selectores'
import { ACIERTOS_APROBAR, PREGUNTAS_EXAMEN, probAlMenos } from '../learning/estoyListo'
import { recomendar, type Accion } from '../learning/recomendacion'
import { MUNDOS } from '../content/mundos'

/** Acierto medio por pregunta necesario para tener un 90 % de probabilidad de aprobar. */
function aciertoNecesario(objetivo = 0.9) {
  let lo = 0.8, hi = 1
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2
    if (probAlMenos(PREGUNTAS_EXAMEN, ACIERTOS_APROBAR, mid) < objetivo) lo = mid
    else hi = mid
  }
  return hi
}
const NECESARIO = aciertoNecesario()

export function EstoyListo({ onAccion, simulacroDisponible }: { onAccion: (a: Accion) => void; simulacroDisponible: boolean }) {
  const listo = useListo()
  const debiles = useDebiles()
  const vencidas = useVencidas()
  const simulacros = useJuego((s) => s.simulacros)
  const rec = recomendar(vencidas.length, debiles, listo, simulacroDisponible)
  const valor = pct(listo.prob)
  const R = 70, C = 2 * Math.PI * R
  const sinDatos = listo.mundos.every((m) => m.vistas === 0)

  return (
    <main className="pantalla">
      <h1 className="titulo-pantalla">¿Estoy listo?</h1>

      <section className="pegatina medidor">
        <svg viewBox="0 0 180 180" className="anillo" role="img" aria-label={`${valor} % de probabilidad de aprobar`}>
          <circle cx="90" cy="90" r={R} className="pista" />
          <motion.circle
            cx="90" cy="90" r={R} className="valor"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C * (1 - listo.prob) }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            transform="rotate(-90 90 90)"
          />
          <text x="90" y="98" textAnchor="middle" className="cifra-grande">{valor}%</text>
          <text x="90" y="122" textAnchor="middle" className="cifra-sub">de aprobar</text>
        </svg>
        <div className="medidor-texto">
          {sinDatos ? (
            <p>Juega unos niveles y verás aquí tu probabilidad real de aprobar el teórico hoy.</p>
          ) : (
            <>
              <p>
                Entre <b>{pct(listo.rango[0])} %</b> y <b>{pct(listo.rango[1])} %</b>. Ahora aciertas de media el <b>{pct(listo.aciertoEsperado)} %</b> de las preguntas.
              </p>
              <p className="nota">Para tener un 90 % de probabilidad hay que acertar alrededor del {pct(NECESARIO)} % de media: con 4 fallos se suspende.</p>
            </>
          )}
          {!sinDatos && (
            <div className="temario">
              <div className="fila"><span>Temario dominado</span><b>{pct(listo.temario)} %</b></div>
              <span className="barra fina"><i style={{ width: `${pct(listo.temario)}%`, background: 'var(--accent)' }} /></span>
            </div>
          )}
          {listo.topado && <p className="nota">El indicador se queda en el 70 % hasta que apruebes 3 simulacros. Sin pasar el examen de prueba, no hay certeza.</p>}
        </div>
      </section>

      <section className="pegatina recomendacion">
        <span className="rotulo">Para hoy</span>
        <p>{rec.texto}</p>
        <button className="boton" onClick={() => onAccion(rec.accion)}>{rec.boton}</button>
      </section>

      <section className="bloque">
        <h2>Tus puntos débiles</h2>
        {debiles.length === 0 ? (
          <p className="vacio">Aún no hay suficientes fallos para saberlo. ¡Buena señal!</p>
        ) : (
          debiles.map((d, i) => (
            <div key={d.tipo} className="pegatina debil">
              <span className="puesto">{i + 1}</span>
              <div>
                <b>{d.nombre}</b>
                <p>{d.consejo}</p>
              </div>
              <button className="boton secundario mini" onClick={() => onAccion({ tipo: 'punto-debil', debil: d })}>Entrenar</button>
            </div>
          ))
        )}
      </section>

      <section className="bloque">
        <h2>Dominio por mundo</h2>
        <div className="pegatina tabla-mundos">
          {listo.mundos.map((m) => {
            const color = MUNDOS.find((x) => x.id === m.mundo)!.color
            return (
              <div key={m.mundo} className="fila-mundo">
                <span className="nombre">{m.nombre}</span>
                <span className="barra fina"><i style={{ width: `${pct(m.dominio)}%`, background: color }} /></span>
                <span className="dato">{m.vistas ? `${pct(m.dominio)} %` : '—'}</span>
              </div>
            )
          })}
        </div>
        {!sinDatos && <p className="nota">Lo que más te sube ahora: {listo.queFalta.map((m) => m.nombre).join(' y ')}.</p>}
      </section>

      <section className="bloque">
        <h2>Simulacros</h2>
        {simulacros.length === 0 ? (
          <p className="vacio">Todavía no has hecho ninguno. El Simulacro Oficial tiene 30 preguntas y 30 minutos, como el examen real.</p>
        ) : (
          <div className="pegatina tabla-mundos">
            {[...simulacros].reverse().slice(0, 8).map((s) => (
              <div key={s.fecha} className="fila-mundo">
                <span className="nombre">{new Date(s.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                <span className={s.aciertos >= ACIERTOS_APROBAR ? 'chip-ok' : 'chip-mal'}>{s.aciertos >= ACIERTOS_APROBAR ? 'Apto' : 'No apto'}</span>
                <span className="dato">{s.aciertos}/{s.total} · {Math.round(s.segundos / 60)} min</span>
              </div>
            ))}
          </div>
        )}
        <p className="nota">Cuándo pedir fecha de examen: con 90 % o más aquí y 3 simulacros seguidos aprobados con 28 aciertos o más.</p>
      </section>
    </main>
  )
}
