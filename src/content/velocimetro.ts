// Situaciones para el minijuego «Velocímetro».
// Solo límites confirmados en el Reglamento General de Circulación (RGC).
// Las cifras dudosas (autobuses, remolques…) se quedan fuera hasta revisarlas.

export type Via = 'autopista' | 'autovia' | 'convencional' | 'urbana' | 'travesia' | 'residencial' | 'obras'
export type Vehiculo = 'turismo' | 'moto' | 'ciclomotor'

export interface SituacionVelocidad {
  id: string
  via: Via
  vehiculo: Vehiculo
  /** Detalle que cambia la respuesta (carriles, señal, adelantamiento…). */
  detalle?: string
  /** Señal que se ve en la vía: máxima (círculo rojo) o mínima (círculo azul). */
  senal?: { tipo: 'maxima' | 'minima'; valor: number }
  /** Qué se pregunta: la velocidad máxima (lo normal) o la mínima. */
  pide: 'maxima' | 'minima'
  respuesta: number
  explicacion: string
  fuente: string
}

export const NOMBRE_VIA: Record<Via, string> = {
  autopista: 'Autopista',
  autovia: 'Autovía',
  convencional: 'Carretera convencional',
  urbana: 'Vía urbana',
  travesia: 'Travesía',
  residencial: 'Calle residencial',
  obras: 'Zona de obras',
}

export const NOMBRE_VEHICULO: Record<Vehiculo, string> = {
  turismo: 'Turismo',
  moto: 'Motocicleta',
  ciclomotor: 'Ciclomotor',
}

export const SITUACIONES_VELOCIDAD: SituacionVelocidad[] = [
  { id: 'VELO-01', via: 'autopista', vehiculo: 'turismo', pide: 'maxima', respuesta: 120, explicacion: 'En autopista y autovía, turismos y motos pueden ir a 120 km/h como máximo.', fuente: 'RGC art. 48' },
  { id: 'VELO-02', via: 'autovia', vehiculo: 'turismo', pide: 'maxima', respuesta: 120, explicacion: 'Autovía y autopista tienen el mismo límite genérico para turismos: 120 km/h.', fuente: 'RGC art. 48' },
  { id: 'VELO-03', via: 'autopista', vehiculo: 'moto', pide: 'maxima', respuesta: 120, explicacion: 'Las motocicletas tienen el mismo límite que los turismos: 120 km/h en autopista.', fuente: 'RGC art. 48' },
  { id: 'VELO-04', via: 'convencional', vehiculo: 'turismo', pide: 'maxima', respuesta: 90, explicacion: 'En carretera convencional el límite genérico de turismos y motos es 90 km/h.', fuente: 'RGC art. 48' },
  { id: 'VELO-05', via: 'convencional', vehiculo: 'moto', pide: 'maxima', respuesta: 90, explicacion: 'Moto en carretera convencional: 90 km/h, igual que un turismo.', fuente: 'RGC art. 48' },
  { id: 'VELO-06', via: 'urbana', vehiculo: 'turismo', detalle: 'Un solo carril por sentido', pide: 'maxima', respuesta: 30, explicacion: 'En ciudad, si la calle tiene un único carril por sentido, el límite es 30 km/h.', fuente: 'RGC art. 50' },
  { id: 'VELO-07', via: 'urbana', vehiculo: 'turismo', detalle: 'Dos o más carriles por sentido', pide: 'maxima', respuesta: 50, explicacion: 'Con dos o más carriles por sentido, el límite urbano genérico es 50 km/h.', fuente: 'RGC art. 50' },
  { id: 'VELO-08', via: 'urbana', vehiculo: 'turismo', detalle: 'Plataforma única: calzada y acera al mismo nivel', pide: 'maxima', respuesta: 20, explicacion: 'En las calles de plataforma única el límite es 20 km/h.', fuente: 'RGC art. 50' },
  { id: 'VELO-09', via: 'travesia', vehiculo: 'turismo', detalle: 'Un solo carril por sentido', pide: 'maxima', respuesta: 30, explicacion: 'Las travesías siguen los límites urbanos: con un carril por sentido, 30 km/h.', fuente: 'RGC art. 50' },
  { id: 'VELO-10', via: 'convencional', vehiculo: 'ciclomotor', pide: 'maxima', respuesta: 45, explicacion: 'Un ciclomotor no puede pasar de 45 km/h en ninguna vía.', fuente: 'RGC art. 48' },
  { id: 'VELO-11', via: 'urbana', vehiculo: 'ciclomotor', detalle: 'Dos o más carriles por sentido', pide: 'maxima', respuesta: 45, explicacion: 'Aunque la calle permita 50, el ciclomotor está limitado a 45 km/h.', fuente: 'RGC arts. 48 y 50' },
  { id: 'VELO-12', via: 'residencial', vehiculo: 'turismo', detalle: 'Señal de calle residencial', pide: 'maxima', respuesta: 20, explicacion: 'En una calle residencial señalizada el máximo es 20 km/h y los peatones tienen prioridad.', fuente: 'RGC art. 159 (S-28)' },
  { id: 'VELO-13', via: 'autovia', vehiculo: 'turismo', senal: { tipo: 'maxima', valor: 80 }, pide: 'maxima', respuesta: 80, explicacion: 'La señal manda sobre el límite genérico: si marca 80, vas a 80 como máximo.', fuente: 'RGC art. 48 y 154' },
  { id: 'VELO-14', via: 'convencional', vehiculo: 'turismo', senal: { tipo: 'maxima', valor: 70 }, pide: 'maxima', respuesta: 70, explicacion: 'Una señal de 70 baja el límite de la carretera: 70 km/h como máximo.', fuente: 'RGC art. 154' },
  { id: 'VELO-15', via: 'convencional', vehiculo: 'turismo', detalle: 'Estás adelantando a un camión', pide: 'maxima', respuesta: 90, explicacion: 'Desde 2022 no se puede superar el límite para adelantar: sigues a 90 como máximo.', fuente: 'RGC art. 48 (RD 970/2020)' },
  { id: 'VELO-16', via: 'autopista', vehiculo: 'turismo', pide: 'minima', respuesta: 60, explicacion: 'En autopista y autovía no se puede circular a menos de 60 km/h sin causa justificada.', fuente: 'RGC art. 49' },
  { id: 'VELO-17', via: 'convencional', vehiculo: 'turismo', pide: 'minima', respuesta: 45, explicacion: 'La mínima es la mitad de la genérica de la vía: la mitad de 90 son 45 km/h.', fuente: 'RGC art. 49' },
  { id: 'VELO-18', via: 'urbana', vehiculo: 'turismo', detalle: 'Dos carriles por sentido', senal: { tipo: 'maxima', valor: 30 }, pide: 'maxima', respuesta: 30, explicacion: 'Aunque la calle tenga dos carriles por sentido, la señal de 30 manda.', fuente: 'RGC arts. 50 y 154' },
  { id: 'VELO-19', via: 'autopista', vehiculo: 'turismo', detalle: 'Panel luminoso de velocidad variable', senal: { tipo: 'maxima', valor: 100 }, pide: 'maxima', respuesta: 100, explicacion: 'Los paneles de velocidad variable son señales obligatorias: si marcan 100, vas a 100.', fuente: 'RGC art. 154' },
  { id: 'VELO-20', via: 'obras', vehiculo: 'turismo', detalle: 'Obras en una autovía', senal: { tipo: 'maxima', valor: 40 }, pide: 'maxima', respuesta: 40, explicacion: 'Las señales de obras prevalecen sobre las fijas: 40 km/h en todo el tramo de obras.', fuente: 'RGC art. 154' },
  { id: 'VELO-21', via: 'autovia', vehiculo: 'turismo', senal: { tipo: 'minima', valor: 70 }, pide: 'minima', respuesta: 70, explicacion: 'La señal azul de velocidad mínima obliga a ir, al menos, a esa velocidad si se puede.', fuente: 'RGC art. 154' },
]
