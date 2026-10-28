// Imagen vertical (1080×1920, formato historia de TikTok/Instagram) para presumir de aprobado.
// Se comparte con el menú del móvil; si no se puede, se descarga.

interface DatosImagen {
  sello: string
  titulo: string
  detalle: string
}

function rectRedondo(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath()
  c.roundRect(x, y, w, h, r)
}

export async function generarImagen({ sello, titulo, detalle }: DatosImagen): Promise<Blob> {
  await document.fonts.ready
  const W = 1080, H = 1920
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const c = cv.getContext('2d')!
  const L = '#1E1B2E'
  // Fondo con rayas de carretera
  c.fillStyle = '#FFE8A3'
  c.fillRect(0, 0, W, H)
  c.fillStyle = '#4A4E69'
  c.fillRect(W / 2 - 150, 0, 300, H)
  c.fillStyle = '#FFFFFF'
  for (let y = 40; y < H; y += 140) c.fillRect(W / 2 - 10, y, 20, 80)
  // Confeti
  const colores = ['#FFD23F', '#4ADE80', '#7C5CFF', '#FF5A5F', '#3DA5FF']
  for (let i = 0; i < 90; i++) {
    c.save()
    c.translate((i * 397) % W, (i * 613) % H)
    c.rotate(i)
    c.fillStyle = colores[i % colores.length]
    c.fillRect(-14, -7, 28, 14)
    c.restore()
  }
  // Tarjeta
  c.fillStyle = L
  rectRedondo(c, 90, 520 + 16, 900, 860, 60)
  c.fill()
  c.fillStyle = '#FFFFFF'
  c.strokeStyle = L
  c.lineWidth = 12
  rectRedondo(c, 90, 520, 900, 860, 60)
  c.fill()
  c.stroke()
  // Sello
  c.save()
  c.translate(W / 2, 760)
  c.rotate(-0.12)
  c.strokeStyle = '#15803D'
  c.lineWidth = 18
  rectRedondo(c, -330, -110, 660, 220, 30)
  c.stroke()
  c.fillStyle = '#15803D'
  c.font = '800 170px "Baloo 2", Arial, sans-serif'
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillText(sello, 0, 12)
  c.restore()
  // Textos
  c.fillStyle = L
  c.textAlign = 'center'
  c.font = '800 84px "Baloo 2", Arial, sans-serif'
  c.fillText(titulo, W / 2, 1040)
  c.font = '700 54px Nunito, Arial, sans-serif'
  c.fillStyle = '#5C557A'
  c.fillText(detalle, W / 2, 1140)
  c.font = '700 44px Nunito, Arial, sans-serif'
  c.fillText('Teórico del permiso B', W / 2, 1260)
  // Marca
  c.font = '800 120px "Baloo 2", Arial, sans-serif'
  c.lineWidth = 14
  c.strokeStyle = L
  c.strokeText('TresFallos', W / 2, 1620)
  c.fillStyle = '#FFFFFF'
  c.fillText('TresFallos', W / 2, 1620)
  c.font = '700 46px Nunito, Arial, sans-serif'
  c.fillStyle = L
  c.fillText('Aprueba el teórico jugando', W / 2, 1720)
  return new Promise((ok) => cv.toBlob((b) => ok(b!), 'image/png'))
}

/** Comparte la imagen; devuelve un texto para avisar al jugador de qué ha pasado. */
export async function compartirImagen(datos: DatosImagen): Promise<string> {
  const blob = await generarImagen(datos)
  const archivo = new File([blob], 'tresfallos-aprobado.png', { type: 'image/png' })
  const texto = `${datos.titulo} con TresFallos 🚗 ${location.origin}`
  try {
    if (navigator.canShare?.({ files: [archivo] })) {
      await navigator.share({ files: [archivo], text: texto })
      return '¡Compartido!'
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') return ''
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = archivo.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
  return 'Imagen descargada: súbela a tus historias.'
}
