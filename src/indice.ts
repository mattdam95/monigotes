import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse, type PosecodeIR } from "posecode-parser";

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
 * Quita el comentario de la línea con el mismo algoritmo que `stripComment`
 * del lexer del parser (`dist/tokenizer.js`): corta en el primer `#` o `//`
 * que no esté dentro de un string entre comillas.
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
 * El IR expone `startPose` solo si el archivo la escribe: el schema la deja
 * opcional y un nombre inválido ya devuelve `ir: null`, así que para un
 * archivo que llega aquí el IR trae la pose si está escrita y la búsqueda en
 * el texto (sintaxis exacta del parser: `pose start = <nombre>`, palabra
 * según la regla del lexer) es una defensa extra. Verificado contra el
 * parser: sin `pose start` el IR deja `startPose` en `undefined` (el README
 * no define pose por defecto), así que el índice reporta "neutral" como
 * convención propia.
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
 */
export function indiceCatalogo(dir: string): EntradaIndice[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".posecode"))
    .map((archivo) => {
      const id = archivo.slice(0, -".posecode".length);
      return entradaPara(id, readFileSync(join(dir, archivo), "utf8"));
    })
    .filter((entrada): entrada is EntradaIndice => entrada !== null)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
