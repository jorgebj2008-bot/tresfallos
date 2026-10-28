import { useEffect, useState } from 'react'
import { useJuego } from '../store/useJuego'
import type { MundoId } from '../content/tipos'
import { Cabecera } from './Cabecera'
import { Mapa } from './Mapa'
import { Nivel, type ResultadoPartida } from './Nivel'
import { Resultados } from './Resultados'
import { sfx } from '../audio/sfx'

type Pantalla =
  | { tipo: 'mapa' }
  | { tipo: 'nivel'; mundo: MundoId; nivel: number; partida: number }
  | { tipo: 'resultado'; r: ResultadoPartida }

export function App() {
  const { cargado, cargar, perfil } = useJuego()
  const [pantalla, setPantalla] = useState<Pantalla>({ tipo: 'mapa' })

  useEffect(() => {
    void cargar()
  }, [cargar])

  // Tema: "auto" sigue al móvil; "claro" y "noche" lo fuerzan.
  useEffect(() => {
    const raiz = document.documentElement
    if (perfil.tema === 'auto') raiz.removeAttribute('data-theme')
    else raiz.setAttribute('data-theme', perfil.tema === 'claro' ? 'light' : 'dark')
  }, [perfil.tema])

  // Cada cambio de pantalla empieza arriba (el mapa se recoloca solo).
  useEffect(() => {
    if (pantalla.tipo !== 'mapa') window.scrollTo(0, 0)
  }, [pantalla])

  if (!cargado) return <div className="app"><div className="cargando">Tres<span style={{ color: 'var(--bad)' }}>Fallos</span></div></div>

  const jugar = (mundo: MundoId, nivel: number) => {
    sfx.toque()
    setPantalla({ tipo: 'nivel', mundo, nivel, partida: Date.now() })
  }

  return (
    <div className="app">
      {pantalla.tipo === 'mapa' && (
        <>
          <Cabecera />
          <Mapa onJugar={jugar} />
        </>
      )}
      {pantalla.tipo === 'nivel' && (
        <Nivel
          key={pantalla.partida}
          mundo={pantalla.mundo}
          nivel={pantalla.nivel}
          onSalir={() => setPantalla({ tipo: 'mapa' })}
          onTerminar={(r) => setPantalla({ tipo: 'resultado', r })}
        />
      )}
      {pantalla.tipo === 'resultado' && (
        <Resultados
          r={pantalla.r}
          onRepetir={() => jugar(pantalla.r.mundo, pantalla.r.nivel)}
          onMapa={() => setPantalla({ tipo: 'mapa' })}
        />
      )}
    </div>
  )
}
