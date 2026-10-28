// Pestaña "Retos": racha, cofres, misiones, Simulacro Oficial, minijuegos, garaje y logros.
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useJuego } from '../store/useJuego'
import { abrirCofre, comprarCoche, elegirCoche } from '../store/progresoDiario'
import {
  COCHES, LOGROS, MAX_PROTECTORES, RACHA_INICIAL, cochePorId, diaLocal, misionesDeSemana, misionesDelDia, rachaVisible, semanaLocal,
  type Premio, type TipoCofre,
} from '../game/retencion'
import { APROBADO_SIMULACRO } from '../learning/simulacro'
import { sfx, vibrar } from '../audio/sfx'
import { confeti, explosion } from './particulas'
import { Juegos } from './juegos/Juegos'
import type { JuegoId } from '../game/juegos'
import { Candado, Llama } from './iconos'
import { BotonCompartir } from './Resultados'
import { AvisoDiario } from './AvisoDiario'

const NOMBRE_COFRE: Record<TipoCofre, string> = { diario: 'Cofre diario', misiones: 'Cofre de misiones', jefe: 'Cofre de jefe' }
const COLOR_COFRE: Record<TipoCofre, string> = { diario: '#C98B4A', misiones: '#7C5CFF', jefe: '#FFD23F' }

export function Cofre({ tipo, size = 64, abierto = false }: { tipo: TipoCofre; size?: number; abierto?: boolean }) {
  const c = COLOR_COFRE[tipo]
  return (
    <svg viewBox="0 0 80 70" width={size} height={size * 0.875} aria-hidden="true">
      <rect x={8} y={30} width={64} height={34} rx={6} fill={c} stroke="#1E1B2E" strokeWidth={3.5} />
      <g transform={abierto ? 'rotate(-28 8 30)' : undefined}>
        <path d="M8 30V22Q8 8 40 8Q72 8 72 22V30Z" fill={c} stroke="#1E1B2E" strokeWidth={3.5} />
      </g>
      <rect x={34} y={26} width={12} height={16} rx={3} fill="#FFE27A" stroke="#1E1B2E" strokeWidth={3} />
      <path d="M8 46H72" stroke="#1E1B2E" strokeWidth={3} />
    </svg>
  )
}

export function CocheGrande({ id, size = 96 }: { id: string; size?: number }) {
  const c = cochePorId(id)
  return (
    <svg viewBox="0 0 60 100" width={size * 0.6} height={size} aria-hidden="true">
      <rect x={6} y={6} width={48} height={88} rx={16} fill={c.color} stroke="#1E1B2E" strokeWidth={4} />
      <rect x={25} y={6} width={10} height={88} fill={c.franja} opacity={0.9} />
      <rect x={12} y={24} width={36} height={16} rx={5} fill="#CFEAFF" stroke="#1E1B2E" strokeWidth={3} />
      <rect x={12} y={68} width={36} height={12} rx={4} fill="#CFEAFF" stroke="#1E1B2E" strokeWidth={3} />
    </svg>
  )
}

function Progreso({ texto, valor, objetivo, monedas, hecha }: { texto: string; valor: number; objetivo: number; monedas: number; hecha: boolean }) {
  return (
    <div className={`mision ${hecha ? 'hecha' : ''}`}>
      <div className="fila"><span>{texto}</span><b>+{monedas}</b></div>
      <div className="barra fina"><i style={{ width: `${(Math.min(valor, objetivo) / objetivo) * 100}%`, background: hecha ? 'var(--good)' : 'var(--accent)' }} /></div>
      <span className="nota">{hecha ? 'Cumplida' : `${valor}/${objetivo}`}</span>
    </div>
  )
}

export function Retos({ onJuego, onSimulacro, onInstalar, onGuia }: { onJuego: (j: JuegoId) => void; onSimulacro: () => void; onInstalar: () => void; onGuia: () => void }) {
  const perfil = useJuego((s) => s.perfil)
  const simulacros = useJuego((s) => s.simulacros)
  const [vista, setVista] = useState<'retos' | 'garaje' | 'logros'>('retos')
  const [aprobadoReal, setAprobadoReal] = useState(false)
  const [apertura, setApertura] = useState<{ tipo: TipoCofre; premio: Premio | null } | null>(null)

  const ahora = Date.now()
  const hoy = diaLocal(ahora)
  const racha = perfil.racha ?? RACHA_INICIAL
  const rachaHoy = rachaVisible(racha, hoy)
  const jugadoHoy = racha.ultimoDia === hoy
  const mis = perfil.misiones
  const progreso = (id: string) => (mis && (mis.dia === hoy || id.startsWith('s-')) ? mis.progreso[id] ?? 0 : 0)
  const cumplida = (id: string) => !!mis?.cumplidas.includes(id)
  const simulacroAbierto = (perfil.stats?.jefes.length ?? 0) >= 1
  const mejorSim = simulacros.reduce((a, s) => Math.max(a, s.aciertos), 0)

  function abrir(i: number, tipo: TipoCofre) {
    setApertura({ tipo, premio: null })
    sfx.toque()
    vibrar([20, 60, 20, 60, 20])
    setTimeout(() => {
      const premio = abrirCofre(i)
      setApertura({ tipo, premio })
      sfx.subida()
      vibrar(60)
      explosion(innerWidth / 2, innerHeight / 2 - 40, 60)
      if (premio?.coche) confeti()
    }, 1100)
  }

  if (vista === 'garaje') return <Garaje onVolver={() => setVista('retos')} />
  if (vista === 'logros') return <Logros onVolver={() => setVista('retos')} />

  return (
    <main className="pantalla">
      <h1 className="titulo-pantalla">Retos</h1>

      <section className="pegatina tarjeta-racha">
        <span className="llama-grande"><Llama /></span>
        <div>
          <b>{rachaHoy} {rachaHoy === 1 ? 'día' : 'días'} de racha</b>
          <p className="nota">
            {jugadoHoy ? 'Hoy ya has sumado tu día.' : rachaHoy ? 'Juega una partida hoy para sumar un día más.' : 'Juega hoy para empezar una racha.'} Protectores: {racha.protectores}/{MAX_PROTECTORES}
            {' '}(salvan un día sin jugar; se ganan cada 7 días de racha o en cofres).
          </p>
        </div>
      </section>

      <AvisoDiario />

      <div className="accesos">
        <button className="boton secundario" onClick={() => setVista('garaje')}>Garaje · {perfil.monedas ?? 0} monedas</button>
        <button className="boton secundario" onClick={() => setVista('logros')}>Logros · {(perfil.logros ?? []).length}/{LOGROS.length}</button>
      </div>

      {(perfil.cofres ?? []).length > 0 && (
        <section className="bloque">
          <h2>Cofres para abrir</h2>
          <div className="cofres">
            {(perfil.cofres ?? []).map((t, i) => (
              <button key={i} className="pegatina cofre" onClick={() => abrir(i, t)} aria-label={`Abrir ${NOMBRE_COFRE[t]}`}>
                <motion.span animate={{ rotate: [0, -6, 6, -4, 0] }} transition={{ repeat: Infinity, repeatDelay: 2, duration: 0.6 }}><Cofre tipo={t} /></motion.span>
                <span>{NOMBRE_COFRE[t]}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="bloque">
        <h2>Misiones de hoy</h2>
        <div className="pegatina misiones">
          {misionesDelDia(hoy).map((m) => <Progreso key={m.id} texto={m.texto} valor={progreso(m.id)} objetivo={m.objetivo} monedas={m.monedas} hecha={cumplida(m.id)} />)}
          <p className="nota">Cumple las tres y ganas un cofre de misiones.</p>
        </div>
        <h2>Misiones de la semana</h2>
        <div className="pegatina misiones">
          {misionesDeSemana(semanaLocal(ahora)).map((m) => <Progreso key={m.id} texto={m.texto} valor={progreso(m.id)} objetivo={m.objetivo} monedas={m.monedas} hecha={cumplida(m.id)} />)}
        </div>
      </section>

      <section className="pegatina simulacro-tarjeta">
        <div>
          <span className="rotulo">El jefe final</span>
          <h2>Simulacro Oficial</h2>
          <p>30 preguntas, 30 minutos, máximo 3 fallos. Igual que el examen de la DGT.</p>
          {simulacros.length > 0 && <p className="nota">Tu mejor nota: {mejorSim}/30 · {simulacros.filter((s) => s.aciertos >= APROBADO_SIMULACRO).length} aprobados</p>}
          {!simulacroAbierto && <p className="nota"><Candado /> Se desbloquea al vencer a tu primer jefe (El Funcionario Sellos, al final del mundo 1).</p>}
        </div>
        <button className="boton" disabled={!simulacroAbierto} onClick={onSimulacro}>{simulacroAbierto ? 'Hacer simulacro' : 'Bloqueado'}</button>
      </section>

      <Juegos onJugar={onJuego} incrustado />

      <section className="pegatina examen-real">
        {aprobadoReal ? (
          <>
            <h2>¡Enhorabuena, conductor!</h2>
            <p>Has aprobado el teórico de verdad. Compártelo y ayuda a tus amigos a conseguirlo.</p>
            <BotonCompartir sello="APROBADO" titulo="¡Aprobé el teórico!" detalle="A la primera, con TresFallos" />
          </>
        ) : (
          <>
            <h2>¿Ya te has examinado?</h2>
            <p>Si has aprobado el examen real de la DGT, celébralo aquí.</p>
            <button className="boton" onClick={() => { setAprobadoReal(true); confeti(200); sfx.subida(); vibrar([60, 60, 60, 60, 160]) }}>¡He aprobado el examen real!</button>
          </>
        )}
      </section>

      <button className="boton secundario" onClick={onGuia}>Cómo se juega</button>
      <button className="boton secundario" onClick={onInstalar}>Cómo instalar la app en tu móvil</button>

      <AnimatePresence>
        {apertura && (
          <motion.div className="velo-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => apertura.premio && setApertura(null)}>
            <motion.div className="pegatina modal-cofre" initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={NOMBRE_COFRE[apertura.tipo]}>
              <motion.div animate={apertura.premio ? { scale: [1, 1.3, 1] } : { rotate: [0, -10, 10, -14, 14, -8, 0], y: [0, -4, 0, -6, 0] }} transition={{ duration: apertura.premio ? 0.4 : 1.1 }}>
                <Cofre tipo={apertura.tipo} size={130} abierto={!!apertura.premio} />
              </motion.div>
              {apertura.premio ? (
                <>
                  <h3>¡{apertura.premio.monedas} monedas!</h3>
                  {apertura.premio.protector && <p>+1 protector de racha</p>}
                  {apertura.premio.coche && (
                    <div className="premio-coche">
                      <CocheGrande id={apertura.premio.coche} size={80} />
                      <p>¡Coche nuevo: <b>{cochePorId(apertura.premio.coche).nombre}</b>!</p>
                    </div>
                  )}
                  <button className="boton" onClick={() => setApertura(null)}>Genial</button>
                </>
              ) : (
                <h3>Abriendo…</h3>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

function Garaje({ onVolver }: { onVolver: () => void }) {
  const perfil = useJuego((s) => s.perfil)
  const coches = perfil.coches ?? ['pegatino']
  const actual = perfil.coche ?? 'pegatino'
  const monedas = perfil.monedas ?? 0
  return (
    <main className="pantalla">
      <div className="cabecera-sub">
        <button className="boton secundario mini" onClick={onVolver}>← Retos</button>
        <h1 className="titulo-pantalla">Garaje</h1>
      </div>
      <p className="nota">{monedas} monedas. Los coches son solo estéticos: se ven en el mapa. Se consiguen jugando, nunca con dinero real.</p>
      <div className="garaje">
        {COCHES.map((c) => {
          const tengo = coches.includes(c.id)
          return (
            <div key={c.id} className={`pegatina coche-celda ${actual === c.id ? 'en-uso' : ''}`}>
              <CocheGrande id={c.id} size={84} />
              <b>{c.nombre}</b>
              {tengo ? (
                <button className="boton mini" disabled={actual === c.id} onClick={() => { sfx.toque(); elegirCoche(c.id) }}>{actual === c.id ? 'En uso' : 'Usar'}</button>
              ) : (
                <button className="boton mini" disabled={monedas < c.precio} onClick={() => { if (comprarCoche(c.id, c.precio)) { sfx.subida(); confeti(60) } }}>
                  {monedas < c.precio ? `Faltan ${c.precio - monedas}` : `${c.precio} monedas`}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </main>
  )
}

function Logros({ onVolver }: { onVolver: () => void }) {
  const tengo = useJuego((s) => s.perfil.logros) ?? []
  return (
    <main className="pantalla">
      <div className="cabecera-sub">
        <button className="boton secundario mini" onClick={onVolver}>← Retos</button>
        <h1 className="titulo-pantalla">Logros</h1>
      </div>
      <div className="logros">
        {LOGROS.map((l) => (
          <div key={l.id} className={`pegatina logro ${tengo.includes(l.id) ? 'si' : 'no'}`}>
            <span className="medalla" aria-hidden="true">{tengo.includes(l.id) ? '★' : '?'}</span>
            <div>
              <b>{l.nombre}</b>
              <p>{l.descripcion}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
