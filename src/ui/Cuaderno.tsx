import { useConFallos } from '../store/selectores'
import { infoError } from '../learning/errores'
import { preguntaPorId } from '../content/banco'
import type { ConfigPartida } from './Nivel'
import { SenalSVG } from './SenalSVG'

export function Cuaderno({ onJugar }: { onJugar: (c: ConfigPartida) => void }) {
  const conFallos = useConFallos()
  // Agrupa por el tipo del último error cometido.
  const grupos = new Map<string, typeof conFallos>()
  for (const e of [...conFallos].sort((a, b) => b.fallos - a.fallos)) {
    const k = e.ultimoError ?? 'otros'
    grupos.set(k, [...(grupos.get(k) ?? []), e])
  }
  const todos = [...conFallos].sort((a, b) => b.fallos - a.fallos).map((e) => e.id)

  return (
    <main className="pantalla">
      <h1 className="titulo-pantalla">Cuaderno de errores</h1>
      {conFallos.length === 0 ? (
        <p className="vacio pegatina" style={{ padding: 16 }}>
          Aquí aparecerá cada pregunta que falles, agrupada por el tipo de error. Desaparece cuando la aciertas 3 veces seguidas.
        </p>
      ) : (
        <>
          <section className="pegatina recomendacion">
            <p>
              Tienes <b>{conFallos.length}</b> {conFallos.length === 1 ? 'pregunta' : 'preguntas'} por dominar.
            </p>
            <button className="boton" onClick={() => onJugar({ tipo: 'repaso', titulo: 'Mis fallos', ids: todos })}>
              Repasar mis fallos
            </button>
          </section>

          {[...grupos].map(([tipo, lista]) => {
            const info = infoError(tipo)
            return (
              <section key={tipo} className="bloque">
                <div className="grupo-cabecera">
                  <div>
                    <h2>{info.nombre}</h2>
                    <p className="nota">{info.consejo}</p>
                  </div>
                  <button className="boton secundario mini" onClick={() => onJugar({ tipo: 'repaso', titulo: info.nombre, ids: lista.map((e) => e.id) })}>
                    Repasar
                  </button>
                </div>
                {lista.map((e) => {
                  const p = preguntaPorId(e.id)
                  if (!p) return null
                  const correcta = p.opciones.find((o) => o.correcta)!
                  return (
                    <article key={e.id} className="pegatina fallo">
                      {p.imagen?.startsWith('senal:') && <SenalSVG id={p.imagen.slice(6)} size={64} />}
                      <p className="enunciado">{p.enunciado}</p>
                      <p>
                        <span className="rotulo">Correcta</span>
                        {correcta.texto}
                      </p>
                      <p className="nota">{correcta.explicacion}</p>
                      <p className="nota">
                        {e.fallos} {e.fallos === 1 ? 'fallo' : 'fallos'} · {e.repeticiones}/3 aciertos seguidos para dominarla · {p.fuente}
                      </p>
                    </article>
                  )
                })}
              </section>
            )
          })}
        </>
      )}
    </main>
  )
}
