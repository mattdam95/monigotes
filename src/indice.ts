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

/** Suma de las duraciones de los pasos: la duración de una repetición. */
function duracionTotal(ir: PosecodeIR): number {
  return ir.phases.reduce((total, fase) => total + fase.durationSec, 0);
}

/**
 * El IR solo expone `startPose` si el archivo la escribe; si no, se toma del
 * texto (y sin ninguna de las dos, la pose neutra es la que usa el parser).
 */
function poseInicial(ir: PosecodeIR, texto: string): string {
  if (ir.startPose) return ir.startPose;
  const enTexto = /pose\s+start\s*=\s*([\p{L}-]+)/iu.exec(texto);
  return enTexto ? enTexto[1] : "neutral";
}

/**
 * El IR siempre trae `repeat` como número (1 por defecto), así que el texto
 * dice si el ejercicio repite de a propósito: sin `repeat`, no hay repeticiones.
 */
function repeticiones(ir: PosecodeIR, texto: string): number | null {
  return /^\s*repeat\s+\d+/mu.test(texto) ? ir.repeat : null;
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
