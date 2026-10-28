// Simulacro Oficial: formato idéntico al examen real. Sin ayudas, sin pistas y sin
// saber si aciertas hasta corregir. Se puede volver atrás y cambiar respuestas.
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { todasLasPreguntas } from '../content/banco'
import { APROBADO_SIMULACRO, MINUTOS_SIMULACRO, elegirSimulacro } from '../learning/simulacro'
import { calcularListo } from '../learning/estoyListo'
import { barajar } from '../game/nivel'
import { useJuego } from '../store/useJuego'
import { sfx, vibrar } from '../audio/sfx'
import { confeti } from './particulas'
import { SenalSVG } from './SenalSVG'
import type { ConfigPartida, ResultadoPartida } from './Nivel'
import { Check, Cruz } from './iconos'

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export function Simulacro({ config, onSalir, onTerminar }: { config: ConfigPartida; onSalir: () => void; onTerminar: (r: ResultadoPartida) => void }) {
  const { registrarRespuesta, guardarSimulacro, sumarXp, perfil } = useJuego()
  const preguntas = useMemo(() => elegirSimulacro(todasLasPreguntas()).map((p) => ({ p, opciones: barajar(p.opciones) })), [])
  const [fase, setFase] = useState<'intro' | 'examen' | 'confirmar' | 'correccion'>('intro')
  const [i, setI] = useState(0)
  const [resp, setResp] = useState<(number | null)[]>(() => preguntas.map(() => null))
  const [restante, setRestante] = useState(MINUTOS_SIMULACRO * 60)
  const inicio = useRef(0)
  const antes = useRef<{ prob: number; temario: number; xp: number } | null>(null)
  const [nota, setNota] = useState<{ aciertos: number; segundos: number } | null>(null)

  useEffect(() => {
    if (fase !== 'examen' && fase !== 'confirmar') return
    const t = setInterval(() => {
      const quedan = MINUTOS_SIMULACRO * 60 - Math.floor((Date.now() - inicio.current) / 1000)
      setRestante(Math.max(0, quedan))
      if (quedan <= 0) corregir()
    }, 500)
    return () => clearInterval(t)
  })

  function empezar() {
    const { estados, simulacros } = useJuego.getState()
    const l = calcularListo(todasLasPreguntas(), estados, simulacros, Date.now())
    antes.current = { prob: l.prob, temario: l.temario, xp: perfil.xp }
    inicio.current = Date.now()
    sfx.toque()
    setFase('examen')
  }

  function corregir() {
    if (nota) return
    const segundos = Math.min(MINUTOS_SIMULACRO * 60, Math.round((Date.now() - inicio.current) / 1000))
    let aciertos = 0
    preguntas.forEach(({ p, opciones }, k) => {
      const r = resp[k]
      const ok = r !== null && opciones[r].correcta
      if (ok) aciertos++
      registrarRespuesta(p.id, ok, r === null ? null : opciones[r].error_tipo ?? null, (segundos * 1000) / preguntas.length)
    })
    guardarSimulacro({ fecha: Date.now(), aciertos, total: preguntas.length, segundos })
    setNota({ aciertos, segundos })
    setFase('correccion')
    window.scrollTo(0, 0)
    if (aciertos >= APROBADO_SIMULACRO) {
      sfx.subida()
      vibrar([40, 60, 40, 60, 120])
      setTimeout(() => confeti(), 300)
    } else sfx.fallo()
  }

  function continuar() {
    const aciertos = nota!.aciertos
    const victoria = aciertos >= APROBADO_SIMULACRO
    const xp = aciertos * 5 + (victoria ? 50 : 0)
    sumarXp(xp)
    onTerminar({
      config, listoAntes: antes.current!.prob, temarioAntes: antes.current!.temario, aciertos, total: preguntas.length,
      segundos: nota!.segundos, estrellas: victoria ? (aciertos >= 29 ? 3 : aciertos >= 28 ? 2 : 1) : 0, xpGanada: xp, xpAntes: antes.current!.xp,
      mejorCombo: 0, victoria,
      fallos: preguntas.flatMap(({ p, opciones }, k) => (resp[k] !== null && opciones[resp[k]!].correcta ? [] : [{ pregunta: p, elegida: resp[k] === null ? 'Sin responder' : opciones[resp[k]!].texto }])),
    })
  }

  if (fase === 'intro')
    return (
      <main className="pantalla simulacro">
        <h1 className="titulo-pantalla">Simulacro Oficial</h1>
        <section className="pegatina reglas">
          <p><b>30 preguntas · 30 minutos · máximo 3 fallos.</b></p>
          <p>Igual que el examen real: sin pistas, sin explicaciones y sin saber si aciertas hasta el final. Puedes volver atrás y cambiar respuestas.</p>
          <p className="nota">Solo entran preguntas con la norma contrastada. Es lo que más mueve tu «¿Estoy listo?».</p>
        </section>
        <button className="boton" onClick={empezar}>Empezar el examen</button>
        <button className="boton secundario" onClick={onSalir}>Ahora no</button>
      </main>
    )

  if (fase === 'correccion' && nota) {
    const apto = nota.aciertos >= APROBADO_SIMULACRO
    return (
      <main className="pantalla simulacro">
        <motion.div className={`sello-examen ${apto ? 'apto' : 'no-apto'}`} initial={{ scale: 2.5, rotate: -25, opacity: 0 }} animate={{ scale: 1, rotate: -8, opacity: 1 }} transition={{ type: 'spring', bounce: 0.4 }}>
          {apto ? 'APTO' : 'NO APTO'}
        </motion.div>
        <p className="nota-examen"><b>{nota.aciertos}/30</b> aciertos · {30 - nota.aciertos} fallos · {mmss(nota.segundos)}</p>
        <p className="nota">{apto ? 'Has aprobado. Para pedir fecha: 3 simulacros seguidos con 28 o más y un 90 % en «¿Estoy listo?».' : `Para aprobar hacen falta 27. Te faltaron ${APROBADO_SIMULACRO - nota.aciertos}. Repasa los fallos de abajo: volverán en tus próximas partidas.`}</p>
        <div className="correccion">
          {preguntas.map(({ p, opciones }, k) => {
            const r = resp[k]
            const ok = r !== null && opciones[r].correcta
            if (ok) return null
            const buena = opciones.find((o) => o.correcta)!
            return (
              <article key={p.id} className="pegatina fallo">
                <p className="enunciado">{k + 1}. {p.enunciado}</p>
                {p.imagen?.startsWith('senal:') && <SenalSVG id={p.imagen.slice(6)} size={56} />}
                <p><span className="rotulo">Tu respuesta</span>{r === null ? 'Sin responder' : opciones[r].texto}</p>
                {r !== null && <p className="nota">{opciones[r].explicacion}</p>}
                <p><span className="rotulo">Correcta</span>{buena.texto}</p>
                <p className="nota">{buena.explicacion} · {p.fuente}</p>
              </article>
            )
          })}
        </div>
        <button className="boton" onClick={continuar}>Continuar</button>
      </main>
    )
  }

  const { p, opciones } = preguntas[i]
  const sinResponder = resp.filter((r) => r === null).length
  return (
    <main className="juego simulacro">
      <div className="barra-examen">
        <span className={`reloj ${restante < 300 ? 'poco' : ''}`} role="timer" aria-label={`Quedan ${mmss(restante)}`}>{mmss(restante)}</span>
        <b>Pregunta {i + 1}/30</b>
        <button className="boton mini" onClick={() => setFase('confirmar')}>Corregir</button>
      </div>

      <div className="tarjeta pegatina">
        {p.imagen?.startsWith('senal:') && <div className="imagen-pregunta"><SenalSVG id={p.imagen.slice(6)} size={100} /></div>}
        <h2>{p.enunciado}</h2>
      </div>
      <div className="opciones">
        {opciones.map((o, k) => (
          <button key={o.texto} className={`opcion ${resp[i] === k ? 'marcada' : ''}`} onClick={() => { sfx.toque(); setResp(resp.map((x, j) => (j === i ? k : x))) }} aria-pressed={resp[i] === k}>
            <span className="letra">{'ABC'[k]}</span>
            <span>{o.texto}</span>
          </button>
        ))}
      </div>

      <div className="nav-examen">
        <button className="boton secundario" disabled={i === 0} onClick={() => setI(i - 1)}>Anterior</button>
        <button className="boton" disabled={i === 29} onClick={() => setI(i + 1)}>Siguiente</button>
      </div>
      <div className="rejilla-examen" aria-label="Ir a una pregunta">
        {preguntas.map((_, k) => (
          <button key={k} className={`${resp[k] !== null ? 'hecha' : ''} ${k === i ? 'actual' : ''}`} onClick={() => setI(k)} aria-label={`Pregunta ${k + 1}${resp[k] !== null ? ', respondida' : ''}`}>{k + 1}</button>
        ))}
      </div>

      {fase === 'confirmar' && (
        <section className="hoja" style={{ background: 'var(--panel)' }}>
          <h3>{sinResponder ? `Te quedan ${sinResponder} sin responder` : '¿Corregir el examen?'}</h3>
          <p>{sinResponder ? 'Las preguntas sin responder cuentan como fallo.' : 'Ya no podrás cambiar las respuestas.'}</p>
          <button className="boton" onClick={corregir}><Check /> Corregir ya</button>
          <button className="boton secundario" onClick={() => setFase('examen')}><Cruz /> Seguir con el examen</button>
        </section>
      )}
    </main>
  )
}
