import { useEffect, useState } from 'react'
import { useJuego } from '../store/useJuego'
import { pct, useConFallos, useListo, useVencidas } from '../store/selectores'
import type { MundoId } from '../content/tipos'
import { preguntaPorId, todasLasPreguntas } from '../content/banco'
import type { Accion } from '../learning/recomendacion'
import { juegoDeNivel, type JuegoId } from '../game/juegos'
import { Cabecera } from './Cabecera'
import { Mapa } from './Mapa'
import { Nivel, type ConfigPartida, type ResultadoPartida } from './Nivel'
import { Resultados } from './Resultados'
import { EstoyListo } from './EstoyListo'
import { Cuaderno } from './Cuaderno'
import { Admin } from './Admin'
import { marcarEnPartida } from '../actualizar'
import { Bienvenida, debeMostrarseBienvenida } from './Bienvenida'
import { Retos } from './Retos'
import { Simulacro } from './Simulacro'
import { registrarPartida, type Novedades } from '../store/progresoDiario'
import { ReyDelCruce } from './juegos/ReyDelCruce'
import { SenalRush } from './juegos/SenalRush'
import { VerdadTrampa } from './juegos/VerdadTrampa'
import { IconoCuaderno, IconoMando, IconoMapa, IconoMedidor } from './iconos'
import { sfx } from '../audio/sfx'

type Tab = 'mapa' | 'retos' | 'listo' | 'errores'
type Pantalla =
  | { tipo: 'tab'; tab: Tab }
  | { tipo: 'partida'; config: ConfigPartida; id: number }
  | { tipo: 'resultado'; r: ResultadoPartida; nov: Novedades }

/** Minijuego que entrena cada tipo de error (para puntos débiles sin preguntas de test). */
const JUEGO_PARA_ERROR = (tipo: string): JuegoId =>
  tipo.startsWith('prioridad') || tipo === 'giro_izquierda' || tipo === 'jerarquia_senales' ? 'cruce' : tipo === 'confunde_senales' ? 'senales' : 'verdad'

export function App() {
  const { cargado, cargar, perfil } = useJuego()
  const [pantalla, setPantalla] = useState<Pantalla>({ tipo: 'tab', tab: 'mapa' })
  const listo = useListo()
  const vencidas = useVencidas()
  const conFallos = useConFallos()
  const [admin, setAdmin] = useState(() => location.hash === '#admin')
  const [bienvenida, setBienvenida] = useState(debeMostrarseBienvenida)

  // Panel de administración: se abre con #admin en la dirección.
  useEffect(() => {
    const alCambiar = () => setAdmin(location.hash === '#admin')
    addEventListener('hashchange', alCambiar)
    return () => removeEventListener('hashchange', alCambiar)
  }, [])

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

  // Las actualizaciones esperan a que termines la partida.
  useEffect(() => marcarEnPartida(pantalla.tipo === 'partida'), [pantalla.tipo])

  if (admin) return <div className="app"><Admin /></div>
  if (!cargado) return <div className="app"><div className="cargando">Tres<span style={{ color: 'var(--bad)' }}>Fallos</span></div></div>

  const jugar = (config: ConfigPartida) => {
    sfx.toque()
    setPantalla({ tipo: 'partida', config, id: Date.now() })
  }
  const jugarNivel = (mundo: MundoId, nivel: number) => {
    const juego = juegoDeNivel(mundo, nivel)
    jugar(juego ? { tipo: 'juego', juego, mundo, nivel } : { tipo: 'nivel', mundo, nivel })
  }
  const irA = (tab: Tab) => {
    sfx.toque()
    setPantalla({ tipo: 'tab', tab })
  }

  const accion = (a: Accion) => {
    if (a.tipo === 'repaso-vencidas') {
      const ids = vencidas.filter((id) => preguntaPorId(id)).slice(0, 10)
      if (ids.length) jugar({ tipo: 'repaso', titulo: 'Repaso del día', ids })
      else jugar({ tipo: 'juego', juego: 'verdad' })
    } else if (a.tipo === 'punto-debil') {
      // Las preguntas falladas de ese tipo, más otras que entrenan el mismo error.
      const mismas = todasLasPreguntas().filter((p) => p.error_tipo.includes(a.debil.tipo)).map((p) => p.id)
      const ids = [...new Set([...a.debil.preguntas, ...mismas])].filter((id) => preguntaPorId(id))
      if (ids.length >= 3) jugar({ tipo: 'repaso', titulo: a.debil.nombre, ids })
      else jugar({ tipo: 'juego', juego: JUEGO_PARA_ERROR(a.debil.tipo) })
    } else if (a.tipo === 'simulacro') jugar({ tipo: 'simulacro' })
    else irA('mapa')
  }

  const tab = pantalla.tipo === 'tab' ? pantalla.tab : null
  const volverMapa = () => setPantalla({ tipo: 'tab', tab: 'mapa' })
  // Al terminar cualquier partida: racha, misiones, monedas, logros y cofres.
  const terminar = (r: ResultadoPartida) => setPantalla({ tipo: 'resultado', r, nov: registrarPartida(r) })

  let partida: React.ReactNode = null
  if (pantalla.tipo === 'partida') {
    const c = pantalla.config
    const props = { key: pantalla.id, config: c, onSalir: volverMapa, onTerminar: terminar }
    if (c.tipo === 'simulacro') partida = <Simulacro {...props} />
    else if (c.tipo !== 'juego') partida = <Nivel {...props} />
    else if (c.juego === 'cruce') partida = <ReyDelCruce {...props} />
    else if (c.juego === 'senales') partida = <SenalRush {...props} />
    else partida = <VerdadTrampa {...props} />
  }

  return (
    <div className="app">
      {tab === 'mapa' && (
        <>
          <Cabecera />
          <Mapa onJugar={jugarNivel} onJefe={(mundo) => jugar({ tipo: 'jefe', mundo })} />
        </>
      )}
      {tab === 'retos' && <Retos onJuego={(juego) => jugar({ tipo: 'juego', juego })} onSimulacro={() => jugar({ tipo: 'simulacro' })} onInstalar={() => setBienvenida(true)} />}
      {tab === 'listo' && <EstoyListo onAccion={accion} simulacroDisponible={(perfil.stats?.jefes.length ?? 0) >= 1} />}
      {tab === 'errores' && <Cuaderno onJugar={jugar} />}

      {bienvenida && tab && <Bienvenida onCerrar={() => setBienvenida(false)} />}
      {partida}
      {pantalla.tipo === 'resultado' && <Resultados r={pantalla.r} nov={pantalla.nov} onRepetir={() => jugar(pantalla.r.config)} onMapa={volverMapa} />}

      {tab && (
        <nav className="pestanas" aria-label="Secciones">
          <button className={tab === 'mapa' ? 'activa' : ''} onClick={() => irA('mapa')}>
            <IconoMapa />
            <span>Mapa</span>
          </button>
          <button className={tab === 'retos' ? 'activa' : ''} onClick={() => irA('retos')}>
            <IconoMando />
            <span>Retos</span>
            {(perfil.cofres ?? []).length > 0 && <b className="globo">{(perfil.cofres ?? []).length}</b>}
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
