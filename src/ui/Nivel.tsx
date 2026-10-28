import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimate } from 'motion/react'
import type { MundoId, Pregunta } from '../content/tipos'
import { preguntaPorId, preguntasDe, todasLasPreguntas } from '../content/banco'
import { mundoPorId } from '../content/mundos'
import { PREGUNTAS_POR_NIVEL, barajar, calcularEstrellas, hitoCombo } from '../game/nivel'
import { elegirPreguntas } from '../learning/seleccion'
import type { JuegoId } from '../game/juegos'
import { calcularListo } from '../learning/estoyListo'
import { xpFinNivel, xpRespuesta } from '../game/progreso'
import { claveNivel, useJuego } from '../store/useJuego'
import { sfx, vibrar } from '../audio/sfx'
import { explosion } from './particulas'
import { Check, Cruz, Llama } from './iconos'
import { ImagenPregunta } from './EscenaSVG'
import { JefeRetrato } from './JefeRetrato'
import { FALLOS_PERMITIDOS, GOLPES_JEFE, estrellasJefe, fraseJefe, preguntasJefe } from '../game/jefes'

/** Qué se juega: un nivel del mapa o un repaso (fallos, vencidas, punto débil). */
export type ConfigPartida =
  | { tipo: 'nivel'; mundo: MundoId; nivel: number }
  | { tipo: 'repaso'; titulo: string; ids: string[] }
  | { tipo: 'juego'; juego: JuegoId; mundo?: MundoId; nivel?: number }
  | { tipo: 'jefe'; mundo: MundoId }
  | { tipo: 'simulacro' }

export interface ResultadoPartida {
  config: ConfigPartida
  /** Probabilidad de aprobar y temario dominado al empezar la partida (para animar la subida). */
  listoAntes: number
  temarioAntes: number
  aciertos: number
  total: number
  segundos: number
  estrellas: 0 | 1 | 2 | 3
  xpGanada: number
  xpAntes: number
  mejorCombo: number
  fallos: { pregunta: Pregunta; elegida: string }[]
  /** Jefe vencido o simulacro aprobado. */
  victoria?: boolean
}

const FRASES_BIEN = ['¡Bien visto!', '¡Exacto!', '¡Eso es!', 'Como un profesional', '¡Al loro!']
const FRASES_MAL = ['Esta tenía truco', 'Casi. Vamos a verlo', 'Tranqui, se aprende así', 'Ups, la próxima es tuya']
const elegir = (lista: string[]) => lista[(Math.random() * lista.length) | 0]

interface Props {
  config: ConfigPartida
  onSalir: () => void
  onTerminar: (r: ResultadoPartida) => void
}

export function Nivel({ config, onSalir, onTerminar }: Props) {
  const { perfil, sumarXp, registrarRespuesta, guardarNivel } = useJuego()
  // Preguntas elegidas por el motor de aprendizaje al empezar (no cambian durante la partida).
  const preguntas = useMemo(() => {
    const { estados } = useJuego.getState()
    const lista: Pregunta[] =
      config.tipo === 'nivel'
        ? elegirPreguntas(preguntasDe(config.mundo), estados, PREGUNTAS_POR_NIVEL, Date.now(), Math.random, todasLasPreguntas().filter((p) => p.mundo !== config.mundo))
        : config.tipo === 'repaso'
          ? barajar(config.ids.map(preguntaPorId).filter((p): p is Pregunta => !!p)).slice(0, PREGUNTAS_POR_NIVEL)
          : config.tipo === 'jefe'
            ? preguntasJefe(config.mundo, todasLasPreguntas())
            : []
    return lista.map((pregunta) => ({ pregunta, opciones: barajar(pregunta.opciones) }))
  }, [config])
  const xpAntes = useRef(perfil.xp)
  const antes = useRef<{ prob: number; temario: number } | null>(null)
  if (!antes.current) {
    const { estados, simulacros } = useJuego.getState()
    antes.current = calcularListo(todasLasPreguntas(), estados, simulacros, Date.now())
  }
  const inicioNivel = useRef(Date.now())
  const inicioPregunta = useRef(Date.now())

  const [idx, setIdx] = useState(0)
  const [elegida, setElegida] = useState<number | null>(null)
  const [resultados, setResultados] = useState<boolean[]>([])
  const [combo, setCombo] = useState(0)
  const [mejorCombo, setMejorCombo] = useState(0)
  const [xpGanada, setXpGanada] = useState(0)
  const [fallos, setFallos] = useState<ResultadoPartida['fallos']>([])
  const [flotante, setFlotante] = useState<{ id: number; x: number; y: number; texto: string } | null>(null)
  const [hito, setHito] = useState<{ id: number; texto: string } | null>(null)
  const [frase, setFrase] = useState('')
  const [tarjeta, animarTarjeta] = useAnimate()
  const esJefe = config.tipo === 'jefe'
  const jefe = esJefe ? mundoPorId(config.mundo) : null
  const [dichoJefe, setDichoJefe] = useState(jefe ? `«${jefe.lema}»` : '')
  const [retrato, animarRetrato] = useAnimate()
  const golpes = resultados.filter(Boolean).length
  const fallosJefe = resultados.length - golpes

  const actual = preguntas[idx]
  const respondida = elegida !== null
  const acerto = respondida && actual.opciones[elegida].correcta

  function responder(i: number, e: React.MouseEvent<HTMLButtonElement>) {
    if (respondida) return
    const opcion = actual.opciones[i]
    const ms = Date.now() - inicioPregunta.current
    setElegida(i)
    setResultados((r) => [...r, opcion.correcta])
    registrarRespuesta(actual.pregunta.id, opcion.correcta, opcion.error_tipo ?? null, ms)

    if (opcion.correcta) {
      const nuevoCombo = combo + 1
      const xp = xpRespuesta(true, nuevoCombo)
      setCombo(nuevoCombo)
      setMejorCombo((m) => Math.max(m, nuevoCombo))
      setXpGanada((x) => x + xp)
      sumarXp(xp)
      setFrase(elegir(FRASES_BIEN))
      if (esJefe) {
        setDichoJefe(fraseJefe('golpe'))
        if (retrato.current) void animarRetrato(retrato.current, { x: [0, 12, -10, 6, 0], rotate: [0, 8, -6, 3, 0] }, { duration: 0.45 })
      }
      sfx.acierto(nuevoCombo)
      vibrar(25)
      const r = e.currentTarget.getBoundingClientRect()
      explosion(r.left + r.width / 2, r.top + r.height / 2, 18 + Math.min(nuevoCombo, 10) * 3)
      setFlotante({ id: Date.now(), x: r.right - 70, y: r.top - 10, texto: `+${xp} XP` })
      const texto = hitoCombo(nuevoCombo)
      if (texto) {
        setTimeout(() => {
          setHito({ id: Date.now(), texto })
          sfx.combo()
          vibrar([30, 40, 30])
        }, 250)
      }
    } else {
      setCombo(0)
      setFrase(elegir(FRASES_MAL))
      if (esJefe) setDichoJefe(fraseJefe('dano'))
      setFallos((f) => [...f, { pregunta: actual.pregunta, elegida: opcion.texto }])
      sfx.fallo()
      vibrar(70)
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
        void animarTarjeta(tarjeta.current, { x: [0, -10, 9, -6, 4, 0] }, { duration: 0.4 })
      }
    }
  }

  function continuar() {
    sfx.toque()
    const finJefe = esJefe && (golpes >= GOLPES_JEFE || fallosJefe > FALLOS_PERMITIDOS)
    if (!finJefe && idx + 1 < preguntas.length) {
      setIdx(idx + 1)
      setElegida(null)
      inicioPregunta.current = Date.now()
      return
    }
    const aciertos = resultados.filter(Boolean).length
    const segundos = Math.round((Date.now() - inicioNivel.current) / 1000)
    const victoria = esJefe ? golpes >= GOLPES_JEFE : undefined
    const estrellas = esJefe ? estrellasJefe(!!victoria, fallosJefe) : calcularEstrellas(aciertos, preguntas.length, segundos)
    const bonus = xpFinNivel(estrellas) + (victoria ? 60 : 0)
    sumarXp(bonus)
    if (config.tipo === 'nivel') guardarNivel(claveNivel(config.mundo, config.nivel), estrellas, aciertos)
    onTerminar({
      config, listoAntes: antes.current!.prob, temarioAntes: antes.current!.temario, aciertos, total: resultados.length, segundos, estrellas,
      xpGanada: xpGanada + bonus, xpAntes: xpAntes.current, mejorCombo, fallos, victoria,
    })
  }

  const correcta = actual.opciones.find((o) => o.correcta)!

  return (
    <main className="nivel">
      <div className="nivel-top">
        <button className="icono-boton" onClick={onSalir} aria-label="Salir del nivel">
          <Cruz />
        </button>
        {jefe ? (
          <div className="marcador-jefe">
            <div className="vida-jefe" aria-label={`Vida del jefe: ${GOLPES_JEFE - golpes} de ${GOLPES_JEFE}`}>
              <motion.i initial={false} animate={{ width: `${((GOLPES_JEFE - golpes) / GOLPES_JEFE) * 100}%` }} transition={{ type: 'spring', bounce: 0.3 }} style={{ background: jefe.color }} />
            </div>
            <div className="vidas" aria-label={`Fallos permitidos: ${Math.max(0, FALLOS_PERMITIDOS - fallosJefe)}`}>
              {Array.from({ length: FALLOS_PERMITIDOS }, (_, k) => (
                <motion.span key={k} className={k < FALLOS_PERMITIDOS - fallosJefe ? 'vida' : 'vida rota'} animate={k === FALLOS_PERMITIDOS - fallosJefe ? { scale: [1, 1.4, 1] } : {}}>
                  {k < FALLOS_PERMITIDOS - fallosJefe ? '♥' : '✕'}
                </motion.span>
              ))}
            </div>
          </div>
        ) : (
          <div className="segmentos" aria-label={`Pregunta ${idx + 1} de ${preguntas.length}`}>
            {preguntas.map((_, i) => (
              <i key={i} className={i < resultados.length ? (resultados[i] ? 'ok' : 'mal') : i === idx ? 'ahora' : ''} />
            ))}
          </div>
        )}
        <AnimatePresence>
          {combo >= 3 && (
            <motion.span className="combo-chip" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} key="combo">
              <Llama /> x{combo}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {jefe && (
        <div className="jefe-escena">
          <div ref={retrato} className="jefe-retrato"><JefeRetrato mundo={jefe.id} size={76} enfadado={fallosJefe < golpes} /></div>
          <div className="bocadillo pegatina">
            <b>{jefe.jefe}</b>
            <span>{dichoJefe}</span>
            {fallosJefe === FALLOS_PERMITIDOS && <span className="aviso-ultimo">Un fallo más y pierdes.</span>}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <div ref={tarjeta} className="tarjeta pegatina">
            <div className="meta">
              {config.tipo === 'jefe'
                ? `Jefe · ${golpes}/${GOLPES_JEFE} golpes`
                : config.tipo === 'nivel'
                ? actual.pregunta.mundo === config.mundo
                  ? `${mundoPorId(config.mundo).nombre} · Nivel ${config.nivel}`
                  : `Repaso · ${mundoPorId(actual.pregunta.mundo).nombre}`
                : `${config.tipo === 'repaso' ? config.titulo : 'Repaso'} · ${mundoPorId(actual.pregunta.mundo).nombre}`}
            </div>
            <ImagenPregunta imagen={actual.pregunta.imagen} />
            <h2>{actual.pregunta.enunciado}</h2>
          </div>

          <div className="opciones">
            {actual.opciones.map((o, i) => {
              let clase = ''
              if (respondida) {
                if (o.correcta) clase = 'correcta'
                else if (i === elegida) clase = 'incorrecta'
                else clase = 'apagada'
              }
              return (
                <motion.button
                  key={o.texto}
                  className={`opcion ${clase}`}
                  disabled={respondida}
                  onClick={(e) => responder(i, e)}
                  whileTap={respondida ? undefined : { scale: 0.97 }}
                  animate={respondida && o.correcta ? { scale: [1, 1.04, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <span className="letra">{respondida && o.correcta ? <Check /> : respondida && i === elegida ? <Cruz /> : 'ABC'[i]}</span>
                  <span>{o.texto}</span>
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {respondida && <div className="hoja-espacio" />}

      <AnimatePresence>
        {respondida && (
          <motion.section
            key={`hoja-${idx}`}
            className={`hoja ${acerto ? 'bien' : 'mal'}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
            aria-live="polite"
          >
            <h3>
              {acerto ? <Check /> : <Cruz />} {frase}
            </h3>
            {acerto ? (
              <p>{correcta.explicacion}</p>
            ) : (
              <>
                <p>
                  <span className="rotulo">Tu respuesta</span>
                  {actual.opciones[elegida!].explicacion}
                </p>
                <p>
                  <span className="rotulo">La correcta: {correcta.texto}</span>
                  {correcta.explicacion}
                </p>
              </>
            )}
            <span className="fuente">Norma: {actual.pregunta.fuente}</span>
            <button className="boton" onClick={continuar} autoFocus>
              {idx + 1 < preguntas.length ? 'Continuar' : 'Ver resultado'}
            </button>
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {flotante && (
          <motion.span
            key={flotante.id}
            className="flotante"
            style={{ left: flotante.x, top: flotante.y }}
            initial={{ opacity: 0, y: 10, scale: 0.6 }}
            animate={{ opacity: [0, 1, 1, 0], y: -50, scale: 1.1 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            onAnimationComplete={() => setFlotante(null)}
          >
            {flotante.texto}
          </motion.span>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hito && (
          <motion.div
            key={hito.id}
            className="hito"
            initial={{ x: '-50%', scale: 0.3, rotate: -8, opacity: 0 }}
            animate={{ scale: [0.3, 1.2, 1, 1], rotate: [-8, 4, -3, -3], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.2, times: [0, 0.25, 0.75, 1] }}
            onAnimationComplete={() => setHito(null)}
          >
            {hito.texto}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
