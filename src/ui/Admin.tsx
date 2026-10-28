// Panel de administración (solo para el autor): se abre añadiendo #admin a la dirección.
// Permite revisar, editar y marcar preguntas como revisadas. Los cambios se guardan
// en este navegador y se exportan como JSON para pegarlos en content/preguntas/.
import { useMemo, useState } from 'react'
import { todasLasPreguntas } from '../content/banco'
import { MUNDOS } from '../content/mundos'
import type { MundoId, Pregunta } from '../content/tipos'
import { validarPregunta } from '../content/validar'
import { ERRORES } from '../learning/errores'
import { ImagenPregunta } from './EscenaSVG'

const CLAVE = 'tresfallos-admin-cambios'

function leerCambios(): Record<string, Pregunta> {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) ?? '{}')
  } catch {
    return {}
  }
}
function guardarCambios(c: Record<string, Pregunta>) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(c))
  } catch {
    /* sin almacenamiento: los cambios viven solo en esta pestaña */
  }
}

export function Admin() {
  const [cambios, setCambios] = useState<Record<string, Pregunta>>(leerCambios)
  const [mundo, setMundo] = useState<MundoId | 'todos'>('todos')
  const [soloRevisar, setSoloRevisar] = useState(false)
  const [busca, setBusca] = useState('')
  const [abierta, setAbierta] = useState<string | null>(null)
  const [exportado, setExportado] = useState<string | null>(null)
  const [aviso, setAviso] = useState('')

  const banco = useMemo(() => todasLasPreguntas().map((p) => cambios[p.id] ?? p), [cambios])
  const lista = banco.filter(
    (p) =>
      (mundo === 'todos' || p.mundo === mundo) &&
      (!soloRevisar || p.revisar) &&
      (!busca || `${p.id} ${p.enunciado} ${p.fuente}`.toLowerCase().includes(busca.toLowerCase())),
  )
  const editando = abierta ? banco.find((p) => p.id === abierta) ?? null : null

  const actualizar = (p: Pregunta) => {
    const nuevos = { ...cambios, [p.id]: p }
    setCambios(nuevos)
    guardarCambios(nuevos)
  }
  const descartar = (id: string) => {
    const { [id]: _, ...resto } = cambios
    void _
    setCambios(resto)
    guardarCambios(resto)
  }

  function exportar() {
    const m = mundo === 'todos' ? null : mundo
    const datos = banco.filter((p) => !m || p.mundo === m)
    const json = JSON.stringify(datos, null, 2) + '\n'
    setExportado(json)
    navigator.clipboard?.writeText(json).then(
      () => setAviso('JSON copiado al portapapeles.'),
      () => setAviso('No se pudo copiar: selecciona el texto de abajo y cópialo a mano.'),
    )
  }

  const numCambios = Object.keys(cambios).length
  const numRevisar = banco.filter((p) => p.revisar).length

  return (
    <main className="admin">
      <h1 className="titulo-pantalla">Panel de preguntas</h1>
      <p className="nota">
        {banco.length} preguntas · {numRevisar} por revisar · {numCambios} con cambios sin exportar. Los cambios se guardan en este navegador: expórtalos y pégalos en <code>content/preguntas/</code>.
      </p>

      <div className="admin-filtros">
        <select id="admin-mundo" value={mundo} onChange={(e) => setMundo(e.target.value as MundoId | 'todos')} aria-label="Mundo">
          <option value="todos">Todos los mundos</option>
          {MUNDOS.map((m) => <option key={m.id} value={m.id}>{m.numero}. {m.nombre}</option>)}
        </select>
        <label><input id="admin-revisar" type="checkbox" checked={soloRevisar} onChange={(e) => setSoloRevisar(e.target.checked)} /> Solo por revisar</label>
        <input id="admin-busca" type="search" placeholder="Buscar texto, id o norma" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      <div className="admin-acciones">
        <button className="boton" onClick={exportar}>Exportar {mundo === 'todos' ? 'todo' : 'este mundo'} (JSON)</button>
        <a className="boton secundario" href="#">Volver al juego</a>
      </div>
      {aviso && <p className="nota" role="status">{aviso}</p>}
      {exportado && <pre tabIndex={0}>{exportado}</pre>}

      <div className="admin-lista">
        {lista.map((p) => {
          const problemas = validarPregunta(p).filter((x) => x.grave)
          if (editando && editando.id === p.id)
            return (
              <Editor
                key={p.id}
                p={editando}
                cambiada={!!cambios[p.id]}
                onGuardar={actualizar}
                onDescartar={() => descartar(p.id)}
                onCerrar={() => setAbierta(null)}
              />
            )
          return (
            <button key={p.id} className="admin-fila" onClick={() => setAbierta(p.id)}>
              <span className="id">{p.id}</span>
              <span className="txt">{p.enunciado}</span>
              {p.revisar && <span className="chip-revisar">Revisar</span>}
              {problemas.length > 0 && <span className="chip-error">{problemas.length} error</span>}
              {cambios[p.id] && <span className="chip-revisar">Editada</span>}
            </button>
          )
        })}
      </div>
    </main>
  )
}

function Editor({ p, cambiada, onGuardar, onDescartar, onCerrar }: { p: Pregunta; cambiada: boolean; onGuardar: (p: Pregunta) => void; onDescartar: () => void; onCerrar: () => void }) {
  const [b, setB] = useState<Pregunta>(structuredClone(p))
  const problemas = validarPregunta(b)
  const set = <K extends keyof Pregunta>(k: K, v: Pregunta[K]) => setB({ ...b, [k]: v })
  const setOpcion = (i: number, cambios: Partial<Pregunta['opciones'][number]>) =>
    setB({ ...b, opciones: b.opciones.map((o, j) => (j === i ? { ...o, ...cambios } : o)) })
  const marcarCorrecta = (i: number) => setB({ ...b, opciones: b.opciones.map((o, j) => ({ ...o, correcta: j === i })) })

  return (
    <section className="pegatina admin-editor" aria-label={`Editar ${p.id}`}>
      <h2>{p.id} · {MUNDOS.find((m) => m.id === p.mundo)?.nombre}</h2>
      <ImagenPregunta imagen={b.imagen} pequena />
      <label>Enunciado<textarea id={`ed-${p.id}-enunciado`} value={b.enunciado} onChange={(e) => set('enunciado', e.target.value)} /></label>
      {b.opciones.map((o, i) => (
        <div key={i} className="admin-opcion">
          <div className="fila">
            <input id={`ed-${p.id}-correcta-${i}`} type="radio" name={`correcta-${p.id}`} checked={o.correcta} onChange={() => marcarCorrecta(i)} />
            <span>Opción {'ABC'[i]} {o.correcta ? '(correcta)' : ''}</span>
          </div>
          <input id={`ed-${p.id}-texto-${i}`} type="text" value={o.texto} onChange={(e) => setOpcion(i, { texto: e.target.value })} aria-label={`Texto de la opción ${'ABC'[i]}`} />
          <textarea id={`ed-${p.id}-expl-${i}`} value={o.explicacion} onChange={(e) => setOpcion(i, { explicacion: e.target.value })} aria-label={`Explicación de la opción ${'ABC'[i]}`} />
          {!o.correcta && (
            <select id={`ed-${p.id}-error-${i}`} value={o.error_tipo ?? ''} onChange={(e) => setOpcion(i, { error_tipo: e.target.value || undefined })} aria-label="Tipo de error">
              <option value="">Sin tipo de error</option>
              {Object.entries(ERRORES).map(([k, v]) => <option key={k} value={k}>{v.nombre}</option>)}
            </select>
          )}
        </div>
      ))}
      <label>Fuente (artículo o norma)<input id={`ed-${p.id}-fuente`} type="text" value={b.fuente} onChange={(e) => set('fuente', e.target.value)} /></label>
      <label>
        Dificultad
        <select id={`ed-${p.id}-dif`} value={b.dificultad} onChange={(e) => set('dificultad', Number(e.target.value) as Pregunta['dificultad'])}>
          {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </label>
      <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8, color: 'var(--ink)' }}>
        <input id={`ed-${p.id}-revisar`} type="checkbox" checked={!b.revisar} onChange={(e) => set('revisar', !e.target.checked)} /> Revisada: el dato legal está contrastado
      </label>
      {problemas.length > 0 && (
        <ul className="nota">{problemas.map((x, i) => <li key={i} style={{ color: x.grave ? 'var(--bad)' : undefined }}>{x.texto}</li>)}</ul>
      )}
      <div className="admin-acciones">
        <button className="boton" disabled={problemas.some((x) => x.grave)} onClick={() => { onGuardar({ ...b, error_tipo: [...new Set(b.opciones.flatMap((o) => (o.error_tipo ? [o.error_tipo] : [])))].sort() }); onCerrar() }}>Guardar</button>
        {cambiada && <button className="boton secundario" onClick={() => { onDescartar(); onCerrar() }}>Descartar mis cambios</button>}
        <button className="boton secundario" onClick={onCerrar}>Cerrar</button>
      </div>
    </section>
  )
}
