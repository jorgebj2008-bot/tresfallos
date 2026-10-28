# TresFallos

Juego para aprobar el teórico del permiso B de la DGT. Diseño completo en `docs/GDD.md`.

## Cómo verlo en tu ordenador

Necesitas tener instalado [Node.js](https://nodejs.org) (versión 20 o superior). Abre una terminal en esta carpeta y ejecuta, la primera vez:

```bash
npm install
```

Después, cada vez que quieras jugar:

```bash
npm run dev
```

Abre en el navegador la dirección que aparece (`http://localhost:5173`).

## Cómo verlo en tu móvil

Con el móvil conectado a la misma red wifi que el ordenador, ejecuta `npm run dev` y abre en el móvil la dirección que aparece como `Network` (algo como `http://192.168.1.20:5173`).

## Otros comandos

| Comando | Qué hace |
|---|---|
| `npm test` | Ejecuta las pruebas automáticas de la lógica del juego |
| `npm run build` | Genera la versión final en la carpeta `dist` |
| `npm run validar` | Revisa el banco de preguntas (una correcta, explicaciones, fuente, duplicados) |
| `npm run build:demo` | Genera la página de pruebas en un solo archivo (`dist-demo/tresfallos.html`) |

## Carpetas

- `content/preguntas/` banco de preguntas (un JSON por mundo)
- `src/content/` tipos y lista de mundos
- `src/game/` lógica del juego (sin pantallas, con tests)
- `src/learning/` motor de aprendizaje (Fase 2)
- `src/audio/` sonidos sintetizados y vibración
- `src/store/` estado y guardado local (IndexedDB)
- `src/ui/` pantallas
- `docs/` diseño y normativa consultada

## Panel de administración

Añade `#admin` al final de la dirección (por ejemplo `http://localhost:5173/#admin`). Desde ahí puedes filtrar, editar y marcar preguntas como revisadas. Los cambios se guardan en tu navegador: pulsa «Exportar» y pega el JSON en `content/preguntas/`.

## Estado

- Fase 0 a 5 hechas: mapa con 13 mundos, motor de aprendizaje, 3 minijuegos, 152 preguntas, jefes, Simulacro Oficial, racha, misiones, cofres, garaje y logros.
- Pendiente: Fase 6 (cuentas y nube), Fase 7 (pagos, PWA y despliegue) y Fase 8 (más minijuegos y 1.500 preguntas).
