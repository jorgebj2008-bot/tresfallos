// Convierte dist-demo/index.html (todo en un archivo) en la página de pruebas publicable:
// quita <!doctype>, <html>, <head> y <body>, porque la página de pruebas pone los suyos.
import { readFileSync, writeFileSync } from 'node:fs'

const html = readFileSync('dist-demo/index.html', 'utf8')
const cabeza = html.match(/<head>([\s\S]*?)<\/head>/)[1]
const cuerpo = html.match(/<body>([\s\S]*?)<\/body>/)[1]
const limpio = cabeza.replace(/<meta charset[^>]*>\s*/, '').replace(/<meta name="viewport"[^>]*>\s*/, '')
writeFileSync('dist-demo/tresfallos.html', `${limpio.trim()}\n${cuerpo.trim()}\n`)
console.log('Página de pruebas lista: dist-demo/tresfallos.html')
