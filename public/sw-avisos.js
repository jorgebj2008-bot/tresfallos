// Aviso diario (lo carga el service worker de la app).
// Android + app instalada: el navegador despierta este código más o menos una vez al día
// (Periodic Background Sync). Solo avisa si hoy aún no has jugado, por la tarde, y una vez al día.

const diaLocal = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function leerPerfil() {
  return new Promise((ok) => {
    const r = indexedDB.open('tresfallos')
    r.onerror = () => ok(null)
    r.onsuccess = () => {
      try {
        const q = r.result.transaction('perfil').objectStore('perfil').get('yo')
        q.onsuccess = () => ok(q.result ?? null)
        q.onerror = () => ok(null)
      } catch {
        ok(null)
      }
    }
  })
}

async function avisar() {
  const hoy = diaLocal()
  if (new Date().getHours() < 17) return
  const cache = await caches.open('tresfallos-avisos')
  const ultimo = await cache.match('/ultimo-aviso')
  if (ultimo && (await ultimo.text()) === hoy) return
  const perfil = await leerPerfil()
  if (perfil?.racha?.ultimoDia === hoy) return
  const racha = perfil?.racha?.actual ?? 0
  await self.registration.showNotification('¿Un ratito de TresFallos?', {
    body: racha > 0 ? `Llevas ${racha} ${racha === 1 ? 'día' : 'días'} de racha. Una partida de 3 minutos y sigue viva.` : 'Una partida de 3 minutos y estarás un poco más cerca de aprobar.',
    icon: '/icono-192.png',
    badge: '/icono-192.png',
    tag: 'recordatorio',
  })
  await cache.put('/ultimo-aviso', new Response(hoy))
}

self.addEventListener('periodicsync', (e) => {
  if (e.tag === 'recordatorio') e.waitUntil(avisar())
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((ventanas) => (ventanas[0] ? ventanas[0].focus() : self.clients.openWindow('/'))),
  )
})
