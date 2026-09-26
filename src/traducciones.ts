import { BONES } from "posecode-parser";

/**
 * Diccionario español → Posecode: ayuda al agente a traducir pedidos en
 * español ("flexioná las rodillas") al vocabulario de `posecode-parser`.
 *
 * - `ARTICULACIONES_ES` cubre cada grupo de `JOINT_GROUP_NAMES` (más los
 *   huesos axiales sin lado, como `spine` → `columna`).
 * - `ACCIONES_ES` cubre cada valor de `ACTION_NAMES` con su verbo en español.
 * - `aPosecode` busca un término en los dos diccionarios, ignorando
 *   mayúsculas y tildes.
 *
 * Regla de lado: los huesos con lado (`knee_left`) no tienen entrada propia en
 * los diccionarios; el singular español más el lado resuelve al hueso concreto
 * cuando el grupo tiene versión con lado en `BONES`
 * (p. ej. `rodilla izquierda` → `knee_left`, `codo derecho` → `elbow_right`).
 * `forearms` y `fingers` quedan afuera: en `BONES` no existe un hueso de un
 * solo lado para ellos.
 */

export const ARTICULACIONES_ES: Record<string, string> = {
  // Grupos simétricos (JOINT_GROUP_NAMES).
  shoulders: "hombros",
  elbows: "codos",
  forearms: "antebrazos",
  wrists: "muñecas",
  hips: "caderas",
  knees: "rodillas",
  ankles: "tobillos",
  fingers: "dedos",
  fingers_left: "dedos izquierdos",
  fingers_right: "dedos derechos",
  // Huesos axiales sin lado (JOINT_NAMES).
  pelvis: "pelvis",
  spine: "columna",
  chest: "pecho",
  neck: "cuello",
  head: "cabeza",
};

export const ACCIONES_ES: Record<string, string> = {
  // ACTION_NAMES → verbo en español.
  flex: "flexionar",
  extend: "extender",
  abduct: "abducir",
  adduct: "aducir",
  "rotate-in": "rotar internamente",
  "rotate-out": "rotar externamente",
  "twist-left": "torcer a la izquierda",
  "twist-right": "torcer a la derecha",
  supinate: "supinar",
  pronate: "pronar",
  dorsiflex: "dorsiflexionar",
  plantarflex: "plantiflexionar",
  hinge: "bisagrear",
};

/**
 * Singular español → hueso base, solo para los grupos cuyo hueso tiene
 * versión con lado en `BONES` (regla de lado de `aPosecode`).
 */
const SINGULAR_ES: Record<string, string> = {
  hombro: "shoulder",
  codo: "elbow",
  muneca: "wrist",
  cadera: "hip",
  rodilla: "knee",
  tobillo: "ankle",
};

/** Lado en español → sufijo del id de hueso. */
const LADO_ES: Record<string, string> = {
  izquierda: "left",
  izquierdo: "left",
  derecha: "right",
  derecho: "right",
};

const BONES_SET = new Set<string>(BONES);

/** Minúsculas, sin tildes y sin espacios al borde, para comparar sin acentos. */
function normalizar(termino: string): string {
  return termino
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Traducción inversa (español normalizado → Posecode) de los dos diccionarios. */
const ESPANOL_A_POSECODE = new Map<string, string>();
for (const [posecode, es] of Object.entries(ARTICULACIONES_ES)) {
  ESPANOL_A_POSECODE.set(normalizar(es), posecode);
}
for (const [posecode, es] of Object.entries(ACCIONES_ES)) {
  ESPANOL_A_POSECODE.set(normalizar(es), posecode);
}

/**
 * Busca un término en español y devuelve su nombre en Posecode, o
 * `undefined` si no lo reconoce. Ignora mayúsculas y tildes:
 * `aPosecode("Rodillas")` y `aPosecode("rodíllas")` devuelven `knees`.
 *
 * Además resuelve articulaciones con lado por la regla de
 * `SINGULAR_ES`: `aPosecode("rodilla izquierda")` devuelve `knee_left`.
 */
export function aPosecode(termino: string): string | undefined {
  const limpio = normalizar(termino);
  const posecode = ESPANOL_A_POSECODE.get(limpio);
  if (posecode) return posecode;
  return huesoConLado(limpio);
}

/**
 * Regla de lado: `<singular> <lado>` → `<hueso>_<left|right>`, solo cuando el
 * resultado existe en `BONES` (p. ej. `rodilla izquierda` → `knee_left`).
 */
function huesoConLado(limpio: string): string | undefined {
  const partes = limpio.split(/\s+/);
  if (partes.length !== 2) return undefined;
  const [singular, lado] = partes;
  const base = SINGULAR_ES[singular];
  const sufijo = LADO_ES[lado];
  if (!base || !sufijo) return undefined;
  const hueso = `${base}_${sufijo}`;
  return BONES_SET.has(hueso) ? hueso : undefined;
}
