import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse, type PosecodeIR } from "posecode-parser";

/** Carpeta del catálogo resuelta desde el módulo (`src/` → raíz del repo). */
const dirCatalogoDefault = join(
  fileURLToPath(new URL("..", import.meta.url)),
  "ejercicios",
);

export interface EntradaIndice {
  id: string;
  nombre: string;
  tipo: string;
  poseInicial: string;
  pasos: string[];
  repeticiones: number | null;
  duracionPasoSegundos: number;
}

/**
 * Quita el comentario de la línea igual que el lexer del parser: `#...` o
 * `//...` que no estén dentro de un string entre comillas.
 */
function sinComentario(linea: string): string {
  let enString = false;
  for (let i = 0; i < linea.length; i++) {
    if (linea[i] === '"') enString = !enString;
    if (enString) continue;
    if (linea[i] === "#" || linea.startsWith("//", i)) {
      return linea.slice(0, i);
    }
  }
  return linea;
}

/** Suma de las duraciones de los pasos: la duración de una repetición. */
function duracionTotal(ir: PosecodeIR): number {
  return ir.phases.reduce((total, fase) => total + fase.durationSec, 0);
}

/**
 * El IR expone `startPose` solo si el archivo la escribe, así que normalmente
 * alcanza con el IR. La búsqueda en el texto usa la sintaxis exacta del
 * parser (`pose start = <nombre>`, nombre con la regla de palabra de su
 * lexer); sin `pose start` en el archivo, la pose neutra es la que usa el
 * reproductor.
 */
const LINEA_POSE_START =
  /^[ \t]*pose[ \t]+start[ \t]+=[ \t]*([A-Za-z_][A-Za-z0-9_-]*)/;

function poseInicial(ir: PosecodeIR, texto: string): string {
  if (ir.startPose) return ir.startPose;
  for (const linea of texto.split(/\r?\n/)) {
    const enTexto = LINEA_POSE_START.exec(sinComentario(linea));
    if (enTexto) return enTexto[1];
  }
  return "neutral";
}

/**
 * El IR siempre trae `repeat` como número (1 por defecto), así que el IR da
 * el valor y el texto dice si el archivo la escribió. `parse()` devuelve
 * `ir: null` si hay algún error, así que en un archivo que llega al índice,
 * toda línea con la forma exacta de la declaración (dos tokens, `repeat` y
 * un número, como exige el parser) es una declaración válida. Sin esa
 * línea, no hay repeticiones.
 */
const LINEA_REPEAT = /^[ \t]*repeat[ \t]+-?\d+(?:\.\d+)?[ \t]*$/;

function repeticiones(ir: PosecodeIR, texto: string): number | null {
  for (const linea of texto.split(/\r?\n/)) {
    if (LINEA_REPEAT.test(sinComentario(linea))) return ir.repeat;
  }
  return null;
}

/** Entrada del índice para un `.posecode`; null si el archivo no parsea. */
function entradaPara(id: string, texto: string): EntradaIndice | null {
  const { ir } = parse(texto);
  if (!ir) return null;
  return {
    id,
    nombre: ir.name,
    tipo: ir.kind,
    poseInicial: poseInicial(ir, texto),
    pasos: ir.phases.map((fase) => fase.name),
    repeticiones: repeticiones(ir, texto),
    duracionPasoSegundos: duracionTotal(ir),
  };
}

/**
 * Índice del catálogo: un resumen por ejercicio para saber qué hay sin leer
 * cada archivo. Ordenado por `id`; los archivos que no parsean se omiten.
 * Si la carpeta dada no existe, se usa la carpeta `ejercicios/` del repo.
 */
export function indiceCatalogo(dir: string): EntradaIndice[] {
  const dirReal = existsSync(dir) ? dir : dirCatalogoDefault;
  return readdirSync(dirReal)
    .filter((f) => f.endsWith(".posecode"))
    .sort()
    .map((archivo) => {
      const id = archivo.slice(0, -".posecode".length);
      return entradaPara(id, readFileSync(join(dirReal, archivo), "utf8"));
    })
    .filter((entrada): entrada is EntradaIndice => entrada !== null);
}
