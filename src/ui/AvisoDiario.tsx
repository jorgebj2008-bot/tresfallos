// Interruptor del aviso diario. Honesto sobre dónde funciona y dónde no.
import { useEffect, useState } from 'react'
import { esIphone, esInstalada } from './Bienvenida'

const CLAVE = 'tresfallos-aviso-diario'
type Estado = 'cargando' | 'activo' | 'inactivo' | 'iphone' | 'no-instalada' | 'no-compatible' | 'denegado'

interface RegistroPeriodico extends ServiceWorkerRegistration {
  periodicSync?: { register: (tag: string, o: { minInterval: number }) => Promise<void>; unregister: (tag: string) => Promise<void> }
}

export function AvisoDiario() {
  const [estado, setEstado] = useState<Estado>('cargando')

  useEffect(() => {
    if (esIphone()) return setEstado('iphone')
    if (!esInstalada()) return setEstado('no-instalada')
    if (!('serviceWorker' in navigator) || !('Notification' in window)) return setEstado('no-compatible')
    void navigator.serviceWorker.ready.then((r) => {
      if (!(r as RegistroPeriodico).periodicSync) return setEstado('no-compatible')
      let activo = false
      try { activo = localStorage.getItem(CLAVE) === '1' } catch { /* sin almacenamiento */ }
      setEstado(Notification.permission === 'denied' ? 'denegado' : activo && Notification.permission === 'granted' ? 'activo' : 'inactivo')
    })
  }, [])

  async function cambiar() {
    const r = (await navigator.serviceWorker.ready) as RegistroPeriodico
    if (estado === 'activo') {
      await r.periodicSync?.unregister('recordatorio')
      try { localStorage.setItem(CLAVE, '0') } catch { /* nada */ }
      return setEstado('inactivo')
    }
    const permiso = await Notification.requestPermission()
    if (permiso !== 'granted') return setEstado('denegado')
    try {
      await r.periodicSync!.register('recordatorio', { minInterval: 12 * 60 * 60 * 1000 })
      localStorage.setItem(CLAVE, '1')
      setEstado('activo')
    } catch {
      setEstado('no-compatible')
    }
  }

  const textos: Record<Estado, string> = {
    cargando: '',
    activo: 'Activado. Si una tarde aún no has jugado, te llegará un aviso (como mucho uno al día).',
    inactivo: 'Un aviso por la tarde si ese día aún no has jugado. Como mucho uno al día y sin agobios.',
    iphone: 'En iPhone, los avisos necesitan un servidor que los envíe. Llegarán cuando activemos las cuentas en la nube.',
    'no-instalada': 'Para recibir avisos, primero instala la app en tu pantalla de inicio.',
    'no-compatible': 'Este navegador no permite avisos programados. Prueba con Chrome en Android y la app instalada.',
    denegado: 'Has bloqueado las notificaciones. Puedes permitirlas en los ajustes de la app en tu móvil.',
  }

  return (
    <section className="pegatina aviso-diario">
      <div>
        <h2>Aviso diario</h2>
        <p className="nota">{textos[estado]}</p>
      </div>
      {(estado === 'activo' || estado === 'inactivo') && (
        <button className={`interruptor ${estado === 'activo' ? 'on' : ''}`} role="switch" aria-checked={estado === 'activo'} aria-label="Aviso diario" onClick={() => void cambiar()}>
          <i />
        </button>
      )}
    </section>
  )
}
