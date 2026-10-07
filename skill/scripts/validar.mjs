// Valida archivos .posecode con posecode-parser (el del repo, instalado con pnpm).
// Uso: node skill/scripts/validar.mjs <archivo.posecode | carpeta> [...]
// Sale con 1 si hay errores o avisos de rango (un aviso = el parser recortó un ángulo).
// No usamos `posecode-parser validate`: con el symlink de pnpm termina en silencio y con código 0.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse } from "posecode-parser";

function archivosDe(ruta) {
  if (!statSync(ruta).isDirectory()) return [ruta];
  return readdirSync(ruta)
    .filter((f) => f.endsWith(".posecode"))
    .sort()
    .map((f) => join(ruta, f));
}

const rutas = process.argv.slice(2);
if (rutas.length === 0) {
  console.error(
    "Uso: node skill/scripts/validar.mjs <archivo.posecode | carpeta> [...]",
  );
  process.exit(2);
}

let fallos = 0;
for (const archivo of rutas.flatMap(archivosDe)) {
  const { errors, warnings } = parse(readFileSync(archivo, "utf8"));
  for (const e of errors) {
    console.log(`${archivo}:${e.line ?? "?"}: error: ${e.message}`);
  }
  for (const w of warnings) {
    console.log(
      `${archivo}:${w.line ?? "?"}: aviso: ${w.joint} ${w.action} ${w.requested}° fuera de rango (${w.limit.min}° a ${w.limit.max}°), se recorta a ${w.clamped}°`,
    );
  }
  if (errors.length + warnings.length > 0) fallos++;
  else console.log(`${archivo}: ok`);
}
process.exit(fallos > 0 ? 1 : 0);
