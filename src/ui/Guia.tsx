// Guía rápida de cómo se juega, la primera vez (después de la de instalar).
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Estrella, IconoMedidor, Llama } from './iconos'
import { JefeRetrato } from './JefeRetrato'
import { Cofre } from './Retos'

const CLAVE = 'tresfallos-guia-vista'

export function debeMostrarseGuia() {
  try {
    return !localStorage.getItem(CLAVE)
  } catch {
    return false
  }
}

const PASOS = [
  {
    titulo: 'Recorre el mapa',
    texto: 'Cada mundo es un tema del examen. Toca el nivel que parpadea para jugar: preguntas tipo test o minijuegos (los del icono de mando). Tu coche siempre te espera en el siguiente nivel.',
    dibujo: (
      <div className="guia-nodos">
        <span className="guia-nodo hecho">1</span>
        <span className="guia-camino" />
        <span className="guia-nodo actual">2</span>
      </div>
    ),
  },
  {
    titulo: 'Estrellas y jefes',
    texto: 'Con 9 de 10 aciertos y sin entretenerte sacas 3 estrellas: es el nivel del examen. Al final de cada mundo te espera un jefe: puedes fallar tres veces, como en el examen real. Al cuarto fallo, pierdes.',
    dibujo: (
      <div className="guia-fila">
        <span className="guia-estrellas"><Estrella /><Estrella /><Estrella /></span>
        <JefeRetrato mundo="prioridad" size={84} />
      </div>
    ),
  },
  {
    titulo: 'Aprendes de tus fallos',
    texto: 'Cada fallo trae su explicación y su norma. Lo que fallas vuelve pronto y lo que dominas, cada vez más tarde. Tus fallos quedan en la pestaña Errores para repasarlos.',
    dibujo: <div className="guia-fallo pegatina"><b>Tranqui, se aprende así</b><span>La correcta: 8 puntos. Norma: Ley de Tráfico, art. 63</span></div>,
  },
  {
    titulo: '¿Estoy listo?',
    texto: 'Te dice, sin inflarlo, tu probabilidad real de aprobar hoy. Para pedir fecha de examen: 90 % o más y 3 simulacros seguidos con 28 aciertos.',
    dibujo: <div className="guia-medidor"><IconoMedidor /><b>90 %</b></div>,
  },
  {
    titulo: 'Retos de cada día',
    texto: 'Juega un poco cada día para mantener la racha, cumple misiones y abre cofres con monedas y coches para tu garaje. Todo se gana jugando.',
    dibujo: (
      <div className="guia-fila">
        <span className="guia-racha"><Llama /> 7</span>
        <Cofre tipo="jefe" size={80} />
      </div>
    ),
  },
]

export function Guia({ onCerrar }: { onCerrar: () => void }) {
  const [i, setI] = useState(0)
  const cerrar = () => {
    try {
      localStorage.setItem(CLAVE, '1')
    } catch {
      /* se volverá a mostrar */
    }
    onCerrar()
  }
  const p = PASOS[i]
  const ultimo = i === PASOS.length - 1
  return (
    <div className="velo-modal">
      <section className="pegatina bienvenida guia" role="dialog" aria-label="Cómo se juega">
        <AnimatePresence mode="wait">
          <motion.div key={i} className="guia-paso" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="guia-dibujo">{p.dibujo}</div>
            <h2>{p.titulo}</h2>
            <p>{p.texto}</p>
          </motion.div>
        </AnimatePresence>
        <div className="guia-puntos" aria-label={`Paso ${i + 1} de ${PASOS.length}`}>
          {PASOS.map((_, k) => <i key={k} className={k === i ? 'si' : ''} />)}
        </div>
        <div className="nav-examen">
          {i === 0 ? <button className="boton secundario" onClick={cerrar}>Saltar</button> : <button className="boton secundario" onClick={() => setI(i - 1)}>Atrás</button>}
          <button className="boton" onClick={() => (ultimo ? cerrar() : setI(i + 1))}>{ultimo ? '¡A jugar!' : 'Siguiente'}</button>
        </div>
      </section>
    </div>
  )
}
