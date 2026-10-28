// Actualizaciones de la app instalada.
// Cada vez que el jugador vuelve a la app (y cada 30 minutos), se comprueba si hay
// una versión nueva. Si la hay, se aplica en cuanto no está en mitad de una partida.
import { registerSW } from 'virtual:pwa-register'

let pendiente: (() => void) | null = null
let enPartida = false

/** La interfaz avisa de si se está jugando, para no recargar en mitad de una partida. */
export function marcarEnPartida(si: boolean) {
  enPartida = si
  if (!si) aplicar()
}

function aplicar() {
  if (pendiente && !enPartida) {
    const f = pendiente
    pendiente = null
    f()
  }
}

export function iniciarActualizaciones() {
  if (import.meta.env.MODE === 'demo' || !('serviceWorker' in navigator)) return
  const actualizarSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      pendiente = () => void actualizarSW(true)
      aplicar()
    },
    onRegisteredSW(_url, reg) {
      if (!reg) return
      const comprobar = () => void reg.update().catch(() => {})
      setInterval(comprobar, 30 * 60 * 1000)
      document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && comprobar())
    },
  })
}
