// Catálogo de señales verticales usadas en el juego, por categorías.
// Los dibujos se generan en SVG (ui/SenalSVG.tsx) siguiendo forma y colores normativos.
// No se muestran códigos oficiales en la interfaz: el catálogo se actualizó en julio de 2025
// y algunos códigos pueden haber cambiado (revisar en la Fase 4 contra el catálogo vigente).

export type Categoria = 'peligro' | 'prohibicion' | 'obligacion' | 'indicacion' | 'prioridad' | 'fin'

export const NOMBRE_CATEGORIA: Record<Categoria, string> = {
  peligro: 'Peligro',
  prohibicion: 'Prohibición',
  obligacion: 'Obligación',
  indicacion: 'Indicación',
  prioridad: 'Prioridad',
  fin: 'Fin de prohibición',
}

export interface Senal {
  id: string
  nombre: string
  categoria: Categoria
  /** Qué hacer o qué indica, en una frase. */
  significado: string
  /** Señales con las que se suele confundir (ids). */
  parecidas: string[]
}

export const SENALES: Senal[] = [
  // Peligro: triángulo con borde rojo
  { id: 'otros-peligros', nombre: 'Otros peligros', categoria: 'peligro', significado: 'Peligro distinto de los que tienen señal propia.', parecidas: ['semaforos-aviso'] },
  { id: 'semaforos-aviso', nombre: 'Semáforos', categoria: 'peligro', significado: 'Avisa de un tramo regulado por semáforos.', parecidas: ['otros-peligros'] },
  { id: 'glorieta-aviso', nombre: 'Intersección con circulación giratoria', categoria: 'peligro', significado: 'Avisa de una glorieta próxima.', parecidas: ['giratorio-obligatorio'] },
  { id: 'curva-derecha', nombre: 'Curva peligrosa hacia la derecha', categoria: 'peligro', significado: 'Curva peligrosa por su radio o visibilidad.', parecidas: ['sentido-obligatorio'] },
  { id: 'interseccion-prioridad', nombre: 'Intersección con prioridad', categoria: 'peligro', significado: 'Avisa de un cruce en el que tienes prioridad.', parecidas: ['interseccion-prioridad-derecha', 'calzada-prioridad'] },
  { id: 'interseccion-prioridad-derecha', nombre: 'Intersección con prioridad sobre vía a la derecha', categoria: 'peligro', significado: 'Tienes prioridad sobre la vía que se incorpora por la derecha.', parecidas: ['interseccion-prioridad'] },
  { id: 'peatones-aviso', nombre: 'Peatones', categoria: 'peligro', significado: 'Avisa de un lugar frecuentado por peatones.', parecidas: ['paso-peatones'] },
  { id: 'perfil-irregular', nombre: 'Perfil irregular', categoria: 'peligro', significado: 'Avisa de baches u ondulaciones en la calzada.', parecidas: [] },
  // Prohibición: círculo con borde rojo
  { id: 'circulacion-prohibida', nombre: 'Circulación prohibida', categoria: 'prohibicion', significado: 'Prohibida la circulación de todo vehículo en ambos sentidos.', parecidas: ['entrada-prohibida', 'fin-prohibiciones'] },
  { id: 'entrada-prohibida', nombre: 'Entrada prohibida', categoria: 'prohibicion', significado: 'Prohibido entrar a todo vehículo (calle en sentido contrario).', parecidas: ['circulacion-prohibida'] },
  { id: 'velocidad-50', nombre: 'Velocidad máxima 50', categoria: 'prohibicion', significado: 'Prohibido circular a más de 50 km/h.', parecidas: ['velocidad-minima-50', 'fin-velocidad-50', 'velocidad-aconsejada-50'] },
  { id: 'adelantamiento-prohibido', nombre: 'Adelantamiento prohibido', categoria: 'prohibicion', significado: 'Prohibido adelantar a otros vehículos de motor.', parecidas: ['fin-prohibiciones'] },
  { id: 'parada-estacionamiento-prohibido', nombre: 'Parada y estacionamiento prohibido', categoria: 'prohibicion', significado: 'Prohibido parar y estacionar.', parecidas: ['estacionamiento-prohibido'] },
  { id: 'estacionamiento-prohibido', nombre: 'Estacionamiento prohibido', categoria: 'prohibicion', significado: 'Prohibido estacionar, pero sí se puede parar.', parecidas: ['parada-estacionamiento-prohibido', 'estacionamiento'] },
  // Fin de prohibición: blanco con franjas grises
  { id: 'fin-prohibiciones', nombre: 'Fin de prohibiciones', categoria: 'fin', significado: 'Terminan las prohibiciones indicadas antes.', parecidas: ['circulacion-prohibida'] },
  { id: 'fin-velocidad-50', nombre: 'Fin de velocidad máxima 50', categoria: 'fin', significado: 'Termina la limitación de 50 km/h.', parecidas: ['velocidad-50'] },
  // Obligación: círculo azul
  { id: 'sentido-obligatorio', nombre: 'Sentido obligatorio', categoria: 'obligacion', significado: 'Obligatorio seguir la dirección de la flecha.', parecidas: ['curva-derecha', 'sentido-unico'] },
  { id: 'paso-obligatorio', nombre: 'Paso obligatorio', categoria: 'obligacion', significado: 'Obligatorio pasar por el lado que indica la flecha.', parecidas: ['sentido-obligatorio'] },
  { id: 'giratorio-obligatorio', nombre: 'Intersección de sentido giratorio obligatorio', categoria: 'obligacion', significado: 'Obligatorio circular en el sentido de las flechas (glorieta).', parecidas: ['glorieta-aviso'] },
  { id: 'velocidad-minima-50', nombre: 'Velocidad mínima 50', categoria: 'obligacion', significado: 'Obligatorio circular al menos a 50 km/h (si las condiciones lo permiten).', parecidas: ['velocidad-50', 'velocidad-aconsejada-50'] },
  // Prioridad
  { id: 'ceda', nombre: 'Ceda el paso', categoria: 'prioridad', significado: 'Debes ceder el paso en la próxima intersección.', parecidas: ['stop'] },
  { id: 'stop', nombre: 'Detención obligatoria (STOP)', categoria: 'prioridad', significado: 'Debes detenerte siempre y ceder el paso.', parecidas: ['ceda'] },
  { id: 'calzada-prioridad', nombre: 'Calzada con prioridad', categoria: 'prioridad', significado: 'Tienes prioridad en las próximas intersecciones.', parecidas: ['fin-prioridad', 'interseccion-prioridad'] },
  { id: 'fin-prioridad', nombre: 'Fin de prioridad', categoria: 'prioridad', significado: 'Dejas de tener prioridad en las intersecciones.', parecidas: ['calzada-prioridad'] },
  // Indicación: cuadrado o rectángulo azul
  { id: 'paso-peatones', nombre: 'Situación de un paso para peatones', categoria: 'indicacion', significado: 'Indica dónde está un paso para peatones.', parecidas: ['peatones-aviso'] },
  { id: 'estacionamiento', nombre: 'Estacionamiento', categoria: 'indicacion', significado: 'Lugar donde se permite estacionar.', parecidas: ['estacionamiento-prohibido'] },
  { id: 'velocidad-aconsejada-50', nombre: 'Velocidad máxima aconsejada 50', categoria: 'indicacion', significado: 'Recomienda no superar 50 km/h (no es obligatorio).', parecidas: ['velocidad-50', 'velocidad-minima-50'] },
  { id: 'sentido-unico', nombre: 'Calzada de sentido único', categoria: 'indicacion', significado: 'Indica que la calle es de sentido único.', parecidas: ['sentido-obligatorio'] },
]

export const senalPorId = (id: string) => SENALES.find((s) => s.id === id)!
