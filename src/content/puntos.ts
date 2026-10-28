// Casos para el minijuego «Detective de Puntos».
// Fuentes: Ley de Tráfico (RDL 6/2015, art. 80 y anexo II) y Código Penal (arts. 379, 383 y 384).
// Solo cifras confirmadas; las dudosas siguen marcadas como «revisar» en el banco de preguntas.

export type PistaTipo = 'puntos' | 'multa' | 'delito'

export interface CasoPuntos {
  id: string
  infraccion: string
  pide: PistaTipo
  respuesta: string
  explicacion: string
  fuente: string
}

/** Opciones fijas según lo que se pregunta (siempre 4, para que no haya pistas). */
export const OPCIONES_PISTA: Record<PistaTipo, string[]> = {
  puntos: ['0 puntos', '2 puntos', '4 puntos', '6 puntos'],
  multa: ['Hasta 100 €', '200 €', '500 €', '1.000 €'],
  delito: ['Multa sin puntos', 'Multa y 4 puntos', 'Multa y 6 puntos', 'Delito'],
}

export const PREGUNTA_PISTA: Record<PistaTipo, string> = {
  puntos: '¿Cuántos puntos quita?',
  multa: '¿Qué multa le cae?',
  delito: '¿Qué es esto?',
}

export const CASOS_PUNTOS: CasoPuntos[] = [
  { id: 'PUNTOS-01', infraccion: 'Conduce con el móvil en la mano, hablando por teléfono.', pide: 'puntos', respuesta: '6 puntos', explicacion: 'Sujetar el móvil al volante quita 6 puntos desde 2022.', fuente: 'RDL 6/2015, anexo II' },
  { id: 'PUNTOS-02', infraccion: 'Circula sin abrocharse el cinturón de seguridad.', pide: 'puntos', respuesta: '4 puntos', explicacion: 'No usar el cinturón quita 4 puntos.', fuente: 'RDL 6/2015, anexo II' },
  { id: 'PUNTOS-03', infraccion: 'Lleva a un niño pequeño sin sistema de retención infantil.', pide: 'puntos', respuesta: '4 puntos', explicacion: 'No usar la silla o el elevador del niño quita 4 puntos.', fuente: 'RDL 6/2015, anexo II' },
  { id: 'PUNTOS-04', infraccion: 'Un motorista circula sin casco.', pide: 'puntos', respuesta: '4 puntos', explicacion: 'No llevar casco quita 4 puntos.', fuente: 'RDL 6/2015, anexo II' },
  { id: 'PUNTOS-05', infraccion: 'Se salta un semáforo en rojo.', pide: 'puntos', respuesta: '4 puntos', explicacion: 'Saltarse un semáforo en rojo quita 4 puntos.', fuente: 'RDL 6/2015, anexo II' },
  { id: 'PUNTOS-06', infraccion: 'No se detiene en una señal de STOP.', pide: 'puntos', respuesta: '4 puntos', explicacion: 'No respetar un STOP quita 4 puntos.', fuente: 'RDL 6/2015, anexo II' },
  { id: 'PUNTOS-07', infraccion: 'No cede el paso en un «ceda el paso» y obliga a frenar a otro coche.', pide: 'puntos', respuesta: '4 puntos', explicacion: 'No respetar la señal de ceda el paso quita 4 puntos.', fuente: 'RDL 6/2015, anexo II' },
  { id: 'PUNTOS-08', infraccion: 'Un conductor general da 0,35 mg/l de alcohol en aire espirado.', pide: 'puntos', respuesta: '4 puntos', explicacion: 'Entre 0,25 y 0,50 mg/l en aire: 4 puntos (y 500 €).', fuente: 'RDL 6/2015, anexo II' },
  { id: 'PUNTOS-09', infraccion: 'Un conductor general da 0,55 mg/l de alcohol en aire espirado.', pide: 'puntos', respuesta: '6 puntos', explicacion: 'Más de 0,50 mg/l en aire: 6 puntos (y 1.000 €).', fuente: 'RDL 6/2015, anexo II' },
  { id: 'PUNTOS-10', infraccion: 'Conduce con restos de cannabis en el organismo.', pide: 'puntos', respuesta: '6 puntos', explicacion: 'Conducir con presencia de drogas quita 6 puntos, aunque no se note el efecto.', fuente: 'RDL 6/2015, anexo II' },
  { id: 'PUNTOS-11', infraccion: 'Comete una infracción grave cualquiera.', pide: 'multa', respuesta: '200 €', explicacion: 'La multa general de una infracción grave es de 200 €.', fuente: 'RDL 6/2015, art. 80' },
  { id: 'PUNTOS-12', infraccion: 'Comete una infracción muy grave cualquiera.', pide: 'multa', respuesta: '500 €', explicacion: 'La multa general de una infracción muy grave es de 500 €.', fuente: 'RDL 6/2015, art. 80' },
  { id: 'PUNTOS-13', infraccion: 'Comete una infracción leve.', pide: 'multa', respuesta: 'Hasta 100 €', explicacion: 'Las infracciones leves se multan con hasta 100 €.', fuente: 'RDL 6/2015, art. 80' },
  { id: 'PUNTOS-14', infraccion: 'Un conductor general da 0,35 mg/l de alcohol en aire espirado.', pide: 'multa', respuesta: '500 €', explicacion: 'Entre 0,25 y 0,50 mg/l en aire: 500 € y 4 puntos.', fuente: 'RDL 6/2015, art. 80' },
  { id: 'PUNTOS-15', infraccion: 'Un conductor general da 0,55 mg/l de alcohol en aire espirado.', pide: 'multa', respuesta: '1.000 €', explicacion: 'Más de 0,50 mg/l en aire: 1.000 € y 6 puntos.', fuente: 'RDL 6/2015, art. 80' },
  { id: 'PUNTOS-17', infraccion: 'Da 0,70 mg/l de alcohol en aire espirado.', pide: 'delito', respuesta: 'Delito', explicacion: 'Más de 0,60 mg/l en aire ya es delito contra la seguridad vial.', fuente: 'Código Penal, art. 379.2' },
  { id: 'PUNTOS-18', infraccion: 'Un agente le pide hacer la prueba de alcoholemia y se niega.', pide: 'delito', respuesta: 'Delito', explicacion: 'Negarse a las pruebas de alcohol o drogas es delito.', fuente: 'Código Penal, art. 383' },
  { id: 'PUNTOS-19', infraccion: 'Circula a 95 km/h por una calle limitada a 30.', pide: 'delito', respuesta: 'Delito', explicacion: 'Superar en más de 60 km/h el límite en vía urbana es delito.', fuente: 'Código Penal, art. 379.1' },
  { id: 'PUNTOS-20', infraccion: 'Circula a 210 km/h por una autovía limitada a 120.', pide: 'delito', respuesta: 'Delito', explicacion: 'Superar en más de 80 km/h el límite en vía interurbana es delito.', fuente: 'Código Penal, art. 379.1' },
  { id: 'PUNTOS-21', infraccion: 'Conduce un coche sin haber obtenido nunca el permiso.', pide: 'delito', respuesta: 'Delito', explicacion: 'Conducir sin haber tenido nunca permiso es delito.', fuente: 'Código Penal, art. 384' },
  { id: 'PUNTOS-22', infraccion: 'Sigue conduciendo después de haber perdido todos sus puntos.', pide: 'delito', respuesta: 'Delito', explicacion: 'Conducir con el permiso perdido por puntos es delito.', fuente: 'Código Penal, art. 384' },
  { id: 'PUNTOS-23', infraccion: 'Un conductor general da 0,35 mg/l de alcohol en aire espirado.', pide: 'delito', respuesta: 'Multa y 4 puntos', explicacion: 'Entre 0,25 y 0,50 mg/l es infracción administrativa: 500 € y 4 puntos, no delito.', fuente: 'RDL 6/2015, anexo II' },
  { id: 'PUNTOS-24', infraccion: 'Usa el móvil sujetándolo con la mano mientras conduce.', pide: 'delito', respuesta: 'Multa y 6 puntos', explicacion: 'El móvil en la mano es infracción grave: 200 € y 6 puntos, no delito.', fuente: 'RDL 6/2015, anexo II' },
]
