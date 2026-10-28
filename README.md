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
