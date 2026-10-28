import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimate } from 'motion/react'
import type { MundoId, Pregunta } from '../content/tipos'
import { preguntasDe } from '../content/banco'
import { mundoPorId } from '../content/mundos'
import { calcularEstrellas, crearNivel, hitoCombo } from '../game/nivel'
import { xpFinNivel, xpRespuesta } from '../game/progreso'
import { claveNivel, useJuego } from '../store/useJuego'
import { sfx, vibrar } from '../audio/sfx'
import { explosion } from './particulas'
import { Check, Cruz, Llama } from './iconos'

export interface ResultadoPartida {
  mundo: MundoId
  nivel: number
  aciertos: number
  total: number
  segundos: number
  estrellas: 0 | 1 | 2 | 3
  xpGanada: number
  xpAntes: number
  mejorCombo: number
  fallos: { pregunta: Pregunta; elegida: string }[]
}

const FRASES_BIEN = ['¡Bien visto!', '¡Exacto!', '¡Eso es!', 'Como un profesional', '¡Al loro!']
const FRASES_MAL = ['Esta tenía truco', 'Casi. Vamos a verlo', 'Tranqui, se aprende así', 'Ups, la próxima es tuya']
const elegir = (lista: string[]) => lista[(Math.random() * lista.length) | 0]

interface Props {
  mundo: MundoId
  nivel: number
  onSalir: () => void
  onTerminar: (r: ResultadoPartida) => void
}

export function Nivel({ mundo, nivel, onSalir, onTerminar }: Props) {
  const { perfil, sumarXp, registrarRespuesta, guardarNivel } = useJuego()
  const preguntas = useMemo(() => crearNivel(preguntasDe(mundo)), [mundo])
  const xpAntes = useRef(perfil.xp)
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
    if (idx + 1 < preguntas.length) {
      setIdx(idx + 1)
      setElegida(null)
      inicioPregunta.current = Date.now()
      return
    }
    const aciertos = resultados.filter(Boolean).length
    const segundos = Math.round((Date.now() - inicioNivel.current) / 1000)
    const estrellas = calcularEstrellas(aciertos, preguntas.length, segundos)
    const bonus = xpFinNivel(estrellas)
    sumarXp(bonus)
    guardarNivel(claveNivel(mundo, nivel), estrellas, aciertos)
    onTerminar({
      mundo, nivel, aciertos, total: preguntas.length, segundos, estrellas,
      xpGanada: xpGanada + bonus, xpAntes: xpAntes.current, mejorCombo, fallos,
    })
  }

  const correcta = actual.opciones.find((o) => o.correcta)!

  return (
    <main className="nivel">
      <div className="nivel-top">
        <button className="icono-boton" onClick={onSalir} aria-label="Salir del nivel">
          <Cruz />
        </button>
        <div className="segmentos" aria-label={`Pregunta ${idx + 1} de ${preguntas.length}`}>
          {preguntas.map((_, i) => (
            <i key={i} className={i < resultados.length ? (resultados[i] ? 'ok' : 'mal') : i === idx ? 'ahora' : ''} />
          ))}
        </div>
        <AnimatePresence>
          {combo >= 3 && (
            <motion.span className="combo-chip" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} key="combo">
              <Llama /> x{combo}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

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
              {mundoPorId(mundo).nombre} · Nivel {nivel}
            </div>
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
