import { useEffect, useState } from 'react'
import { useJuego } from '../store/useJuego'
import { pct, useConFallos, useListo, useVencidas } from '../store/selectores'
import type { MundoId } from '../content/tipos'
import { todasLasPreguntas } from '../content/banco'
import type { Accion } from '../learning/recomendacion'
import { Cabecera } from './Cabecera'
import { Mapa } from './Mapa'
import { Nivel, type ConfigPartida, type ResultadoPartida } from './Nivel'
import { Resultados } from './Resultados'
import { EstoyListo } from './EstoyListo'
import { Cuaderno } from './Cuaderno'
import { IconoCuaderno, IconoMapa, IconoMedidor } from './iconos'
import { sfx } from '../audio/sfx'

type Tab = 'mapa' | 'listo' | 'errores'
type Pantalla =
  | { tipo: 'tab'; tab: Tab }
  | { tipo: 'partida'; config: ConfigPartida; id: number }
  | { tipo: 'resultado'; r: ResultadoPartida }

export function App() {
  const { cargado, cargar, perfil } = useJuego()
  const [pantalla, setPantalla] = useState<Pantalla>({ tipo: 'tab', tab: 'mapa' })
  const listo = useListo()
  const vencidas = useVencidas()
  const conFallos = useConFallos()

  useEffect(() => {
    void cargar()
  }, [cargar])

  // Tema: "auto" sigue al móvil; "claro" y "noche" lo fuerzan.
  useEffect(() => {
    const raiz = document.documentElement
    if (perfil.tema === 'auto') raiz.removeAttribute('data-theme')
    else raiz.setAttribute('data-theme', perfil.tema === 'claro' ? 'light' : 'dark')
  }, [perfil.tema])

  useEffect(() => {
    if (!(pantalla.tipo === 'tab' && pantalla.tab === 'mapa')) window.scrollTo(0, 0)
  }, [pantalla])

  if (!cargado) return <div className="app"><div className="cargando">Tres<span style={{ color: 'var(--bad)' }}>Fallos</span></div></div>

  const jugar = (config: ConfigPartida) => {
    sfx.toque()
    setPantalla({ tipo: 'partida', config, id: Date.now() })
  }
  const jugarNivel = (mundo: MundoId, nivel: number) => jugar({ tipo: 'nivel', mundo, nivel })
  const irA = (tab: Tab) => {
    sfx.toque()
    setPantalla({ tipo: 'tab', tab })
  }

  const accion = (a: Accion) => {
    if (a.tipo === 'repaso-vencidas') jugar({ tipo: 'repaso', titulo: 'Repaso del día', ids: vencidas.slice(0, 10) })
    else if (a.tipo === 'punto-debil') {
      // Las preguntas falladas de ese tipo, más otras que entrenan el mismo error.
      const mismas = todasLasPreguntas().filter((p) => p.error_tipo.includes(a.debil.tipo)).map((p) => p.id)
      jugar({ tipo: 'repaso', titulo: a.debil.nombre, ids: [...new Set([...a.debil.preguntas, ...mismas])] })
    } else irA('mapa')
  }

  const tab = pantalla.tipo === 'tab' ? pantalla.tab : null

  return (
    <div className="app">
      {tab === 'mapa' && (
        <>
          <Cabecera />
          <Mapa onJugar={jugarNivel} />
        </>
      )}
      {tab === 'listo' && <EstoyListo onAccion={accion} simulacroDisponible={false} />}
      {tab === 'errores' && <Cuaderno onJugar={jugar} />}

      {pantalla.tipo === 'partida' && (
        <Nivel
          key={pantalla.id}
          config={pantalla.config}
          onSalir={() => setPantalla({ tipo: 'tab', tab: 'mapa' })}
          onTerminar={(r) => setPantalla({ tipo: 'resultado', r })}
        />
      )}
      {pantalla.tipo === 'resultado' && (
        <Resultados
          r={pantalla.r}
          onRepetir={() => jugar(pantalla.r.config)}
          onMapa={() => setPantalla({ tipo: 'tab', tab: 'mapa' })}
        />
      )}

      {tab && (
        <nav className="pestanas" aria-label="Secciones">
          <button className={tab === 'mapa' ? 'activa' : ''} onClick={() => irA('mapa')}>
            <IconoMapa />
            <span>Mapa</span>
          </button>
          <button className={tab === 'listo' ? 'activa' : ''} onClick={() => irA('listo')}>
            <IconoMedidor />
            <span>Listo {pct(listo.prob)} %</span>
          </button>
          <button className={tab === 'errores' ? 'activa' : ''} onClick={() => irA('errores')}>
            <IconoCuaderno />
            <span>Errores</span>
            {conFallos.length > 0 && <b className="globo">{conFallos.length}</b>}
          </button>
        </nav>
      )}
    </div>
  )
}
