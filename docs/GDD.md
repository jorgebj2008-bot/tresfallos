# TresFallos – Documento de diseño (GDD)

> Versión 0.2 · aprobado.
>
> **Decisiones tomadas (28‑oct‑2026):** nombre **TresFallos**; estilo **Pegatina Pop** de día y **Asfalto Neón** de noche; **gratis al principio** (pagos más adelante, con feature flags preparados); **sin revisor humano**: cada dato se contrasta con BOE/dgt.es y lo dudoso va con `revisar: true` y fuera del simulacro (ver `docs/normativa.md`); se construyen **los 13 mundos**.

---

## 1. Resumen en una frase

Un juego web para móvil, en vertical, de partidas de 2 a 5 minutos, donde cada mecánica divertida te obliga a aplicar una norma real de tráfico, y cuya pantalla estrella es un **porcentaje honesto de probabilidad de aprobar** el teórico del permiso B.

**Promesa medible:** quien llegue a ≥ 90 % de "Estoy listo" y apruebe 3 simulacros seguidos con 28+ aciertos debería aprobar el examen real.

---

## 2. Datos del examen (verificados en búsqueda web, pendientes de contrastar con fuente oficial)

| Dato | Valor | Estado |
|---|---|---|
| Preguntas / tiempo / opciones | 30 / 30 min / 3 opciones | Confirmado en varias fuentes |
| Fallos permitidos | 3 (27 aciertos para aprobar) | Confirmado |
| Catálogo de señales actualizado | En vigor desde 1‑jul‑2025 y ya se pregunta | Una fuente, **revisar en dgt.es** |
| Preguntas con vídeo (percepción de riesgo) | Fuentes contradictorias sobre si ya están activas | **Revisar en dgt.es** antes de la Fase 4 |
| Baliza V‑16 conectada | Obligatoria desde 1‑ene‑2026, sustituye a los triángulos (RD 159/2021) | Varias fuentes (DGT, Interior). Dudas en motos |
| Límites urbanos genéricos | 20 km/h plataforma única · 30 km/h un carril por sentido · 50 km/h dos o más carriles por sentido (RD 970/2020, art. 50 RGC, en vigor desde 11‑may‑2021) | Confirmado, **verificar texto consolidado en BOE** |

Regla del proyecto: cualquier dato legal que no esté contrastado con BOE o dgt.es lleva `"revisar": true` y no sale en el Simulacro Oficial.

---

## 3. Los 13 mundos (temario) y su peso en el "Estoy listo"

El peso es una **estimación inicial** (hay que calibrarla con datos reales de simulacros; la DGT no publica la distribución exacta).

| # | Mundo | Ambientación | Jefe | Peso |
|---|---|---|---|---|
| 1 | Conductor y vehículo (documentos, permisos, puntos) | Autoescuela | El Funcionario Sellos | 6 % |
| 2 | La vía y sus usuarios | Barrio y carriles | Doña Arcén | 6 % |
| 3 | Señalización | Ciudad de día | El Agente Silbato | 14 % |
| 4 | Velocidad y distancias | Autopista al amanecer | Capitán Radar | 9 % |
| 5 | Prioridad de paso | Rotonda gigante | La Inspectora Rotonda | 12 % |
| 6 | Maniobras | Circuito de pruebas | Míster Adelanto | 9 % |
| 7 | Alumbrado y señales acústicas | Ciudad nocturna | La Duquesa Luces | 4 % |
| 8 | Autopistas, túneles, pasos a nivel | Túnel y vías del tren | El Jefe de Estación | 6 % |
| 9 | Alcohol, drogas, fatiga, móvil | Local de ocio y gasolinera | El Soplón | 8 % |
| 10 | Seguridad activa y pasiva | Taller | Doctor Airbag | 6 % |
| 11 | Accidentes y primeros auxilios (PAS, V‑16) | Carretera secundaria | Sargento Rescate | 7 % |
| 12 | Conducción eficiente y mecánica | Gasolinera y taller | Ingeniera Eco | 6 % |
| 13 | Infracciones, sanciones y puntos | Juzgado de tráfico | El Juez Multas | 7 % |

Para el MVP se construyen los **mundos 3, 4 y 5** (donde caben los 3 minijuegos MVP y donde más se falla).

---

## 4. Bucles de juego

- **30 s:** situación → decisión rápida → feedback (celebración o explicación) → recompensa.
- **5 min:** nivel de 8‑10 preguntas o un minijuego → XP, monedas, estrellas → barra del mundo.
- **Diario:** misiones → racha → cofre → ver subir el "Estoy listo".
- **Largo:** vencer jefes → rangos → Simulacro Oficial → ≥ 90 % → examen real → compartir.

Rangos: Peatón → Patinete → Ciclista → Novel → Conductor → Piloto → Instructor → Examinador → Leyenda del Asfalto.

---

## 5. Motor de aprendizaje (separado del juego)

### 5.1 Repetición espaciada
Algoritmo **SM‑2 simplificado** (el más fácil de testear y explicar). Cada pregunta, por jugador, guarda: `facilidad`, `intervalo` (días), `repeticiones`, `proxima_revision`, `fallos_recientes`.

- Acierto rápido → intervalo × facilidad. Acierto lento (> 1,5× la mediana) → intervalo × 1,2.
- Fallo → intervalo = 0 (vuelve en la misma sesión o la siguiente), facilidad − 0,2 (mínimo 1,3).
- Al empezar una partida se mezclan: ~60 % preguntas vencidas, ~25 % nuevas, ~15 % de repaso intercalado de otros temas.
- Más adelante se puede cambiar por FSRS si hay datos suficientes. El motor tendrá una interfaz `Scheduler` para poder cambiarlo sin tocar el resto.

### 5.2 Etiquetas de error
Cada opción incorrecta lleva un `error_tipo` (ej. `confunde_senales_parecidas`, `trampa_siempre_nunca`, `numero_velocidad`, `prioridad_glorieta`). Se acumulan por jugador y se muestran como "Tus 3 puntos débiles".

### 5.3 "¿Estoy listo?" (versión 1, conservadora)
1. **Dominio por mundo** `d_m` (0‑1): media ponderada por recencia de los aciertos esperados del jugador en las preguntas del mundo, usando su estado SM‑2 (una pregunta con intervalo largo y sin fallos recientes cuenta casi 1; una no vista cuenta 0).
2. **Acierto esperado en examen** `p = Σ peso_m · d_m_ajustado`, donde `d_m_ajustado` descuenta la fiabilidad si el jugador ha visto pocas preguntas del mundo (se encoge hacia 0,5 con pocos datos; el objetivo es no inflar).
3. **Probabilidad de aprobar** = P(Binomial(30, p) ≥ 27), calculada exactamente.
4. **Mezcla con simulacros:** con ≥ 3 simulacros, se promedia `p` con la tasa real de acierto de los últimos 5 simulacros (peso 50 %). Sin simulacros, el indicador **no puede superar el 70 %**: sin el jefe final no hay certeza.
5. Se muestra siempre el **rango**, no solo el número: "entre 62 % y 78 %".

Regla: ante duda, el número baja. Se valida con datos reales en la Fase 8 (¿quien marca 90 % aprueba simulacros?).

---

## 6. Minijuegos

**MVP (Fase 3):** Rey del Cruce, Señal Rush, ¿Verdad o Trampa?
**Fase 8:** Velocímetro, Detective de Puntos, Control de Alcoholemia, PAS al Rescate, Examen Relámpago.
**Los dejo para el final y te explico por qué:** Frenada Perfecta (física + calibrar bien, riesgo de que enseñe valores incorrectos) y Glorieta Master (el más caro de programar; se puede aproximar primero con una versión de "elige carril y salida" mucho más simple).

Cada minijuego declara qué `error_tipo` entrena y qué preguntas de test cubre, de modo que todo alimenta el mismo motor de aprendizaje.

### Rey del Cruce – diseño de la parte difícil
Un **motor de reglas de prioridad** (puro, sin gráficos, con tests) recibe un escenario `{vehículos, señales, geometría}` y devuelve el orden correcto de paso con la **regla aplicada** (para la explicación). El generador procedural solo crea escenarios que el motor sabe resolver sin ambigüedad. El dibujo es solo la capa visual.

---

## 7. Jugo, ética y retención

Todo lo de la sección 7 de tu documento, con estas decisiones cerradas:
- Monedas y cofres **solo se ganan jugando**. Cero compras con dinero real dentro del juego.
- Cosmética sin ventaja de aprendizaje.
- Notificaciones: como máximo 1 al día, desactivables, tono neutro. Sin culpa ("¡tu racha muere!").
- Protector de racha: se gana jugando; fallar un día con protector no rompe la racha.
- Vidas: nunca bloquean estudiar; sin vidas pasa a "modo repaso" sin penalización.
- Accesibilidad: no depender solo del color (forma + icono en semáforos), `prefers-reduced-motion`, contraste AA.

---

## 8. Tecnología (decisiones y alternativas)

| Decisión | Elegido | Alternativas | Por qué |
|---|---|---|---|
| Framework UI | **React + TypeScript + Vite** | Svelte, Next.js | Tu preferencia; ecosistema grande; Vite es rápido y simple |
| Motor de minijuegos | **PixiJS** | Phaser 3 | Nuestros minijuegos son 2D simples (tocar, arrastrar, deslizar). Pixi es un renderizador ligero (~lo justo para 60 fps en móvil de gama media) y se integra limpio en componentes React. Phaser trae física, escenas y cargadores que no necesitamos y pesa más |
| Animación de interfaz | **Motion (antes Framer Motion)** | CSS puro, GSAP | API declarativa en React, resortes y rebotes naturales |
| Estado | **Zustand** | Redux, Context | Mínimo y fácil de testear |
| Guardado local | **IndexedDB con Dexie** | localStorage | Capacidad y estructura; funciona offline |
| PWA / offline | **vite-plugin-pwa** | Workbox a mano | Instalable y jugable sin conexión |
| Sonido | **Web Audio API, sonidos sintetizados por código** | Librerías de samples | Sin licencias, peso casi cero; música de loops por mundo en fase posterior (te propondré packs CC0) |
| Tests | **Vitest** | Jest | Mismo config que Vite |
| Nube (Fase 6) | **Supabase** | Firebase | Postgres, auth, tiempo real para ligas |
| Pagos (Fase 7) | **Stripe** | Paddle, Lemon Squeezy | Tu preferencia. Ojo: Paddle/Lemon Squeezy gestionan el IVA por ti; lo valoramos en la Fase 7 |
| Despliegue | **Vercel** (gratis) | Netlify | Un `git push` publica |

### Estructura de carpetas

```
carnet-quest/
├─ docs/                  GDD, decisiones, normativa consultada
├─ content/               banco de preguntas (JSON) + escenas SVG + señales
│  ├─ preguntas/          un archivo por mundo
│  └─ senales/
├─ scripts/               validar-banco, utilidades
├─ src/
│  ├─ learning/           MOTOR DE APRENDIZAJE (sin UI): sm2, estoyListo, errores
│  ├─ game/               MOTOR DE JUEGO: reglas de prioridad, generadores, minijuegos (Pixi)
│  ├─ content/            carga y tipos del banco
│  ├─ ui/                 pantallas React: mapa, nivel, resultados, estadísticas
│  ├─ audio/              sintetizador y háptica
│  ├─ store/              estado y guardado local
│  └─ admin/              panel de revisión (solo para ti)
└─ tests/
```

Regla de dependencias: `learning` y `game` **no importan** de `ui`. Así se testean solos.

---

## 9. Modelo de negocio (opciones para decidir en Fase 7)

| Opción | Precio | Pros | Contras |
|---|---|---|---|
| A. Suscripción mensual | 7,99 €/mes | Ingreso recurrente | La gente estudia 1‑3 meses y cancela; fricción de suscribirse |
| B. Pack "hasta que apruebes" | 24,99 € pago único (acceso 6 meses) | Encaja con el uso real, fácil de entender | Ingreso único por usuario |
| C. Ambas | 7,99 €/mes o 24,99 € pack | Cubre perfiles | Más que explicar |

**Recomendación:** C, con garantía "si no apruebas a la primera, otro mes gratis". Referencia: las autoescuelas online cobran entre 20 y 60 €, así que 24,99 € queda en la parte baja. Los precios son una hipótesis a probar con usuarios reales, no un dato.
Paywall solo tras vencer a un jefe. Feature flags desde el día 1.

---

## 10. Cosas que te tengo que decir con sinceridad

1. **"Más adictivo que TikTok" no es un objetivo realista ni sano.** Sí es realista que alguien que prepara el teórico lo abra todos los días porque ve subir su porcentaje. Ese es el objetivo de diseño.
2. **1.500 preguntas propias con fuente y explicación por opción es el trabajo más grande del proyecto**, mucho más que el código. Plan: 150 en MVP, ampliar por mundos, y que tú (o un profesor de autoescuela) revisen las marcadas `revisar`.
3. **El % de "Estoy listo" es una estimación, no una garantía.** Hasta que haya cientos de jugadores con resultado de examen real, no se puede demostrar la correlación. Lo diremos así en la app.
4. **No podemos copiar preguntas de la DGT ni de otras apps.** Las escribimos nosotros con los mismos conocimientos. Más lento, pero legal.
5. **Riesgo de contenido desactualizado:** la normativa cambia (V‑16, señales, vídeos). Cada pregunta lleva fuente y fecha de revisión para poder actualizar.
6. **Ligas y cuentas en Fase 6** solo merecen la pena si ya hay usuarios que vuelven. Si la retención día 7 es baja, mejoramos el juego antes de añadir nube.

---

## 11. Nombres propuestos

1. **TresFallos** – el límite del examen es su nombre. Memorable, corto.
2. **Carnetazo** – coloquial, suena a TikTok.
3. **Rotonda** – corto y visual (aunque solo cubre un tema).
4. **Aprobao** – coloquial, muy de móvil.
5. **Pisa Fondo** – ligero, juvenil.

**Mi recomendación: TresFallos.** Hay que comprobar que el dominio y las cuentas sociales estén libres antes de decidir.

---

## 12. Direcciones visuales

Ver `docs/direcciones-visuales.html` (también publicado como página para verlo en el móvil). Tres opciones: **Asfalto Neón**, **Mapa de Carreteras**, **Pegatina Pop**.

---

## 13. Qué sigue

Si apruebas este documento (y eliges nombre y dirección visual), la **Fase 1** crea el proyecto y entrega: mapa de mundos navegable, un nivel de preguntas con feedback, XP, sonido, animaciones de acierto/fallo y guardado local.

### Preguntas que necesito que me contestes
1. ¿Nombre: TresFallos u otro?
2. ¿Dirección visual: A, B o C (o mezcla)?
3. ¿Modelo de negocio: C como recomiendo?
4. ¿Alguien que sea profesor de autoescuela puede revisar las preguntas marcadas `revisar`?
5. ¿Empezamos los mundos 3, 4 y 5, como propongo?
