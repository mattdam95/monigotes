import {
  EASINGS,
  GROUND_LOCK_EFFECTOR_NAMES,
  MODES,
  MOVEMENT_KINDS,
  PIN_EFFECTOR_NAMES,
  POSECODE_VERSION,
  PROP_TYPES,
  REACH_EFFECTOR_NAMES,
  START_POSE_NAMES,
} from "posecode-parser";

const PLANTILLA_MINIMA = `posecode exercise "Nombre"
  rig humanoid
  pose start = standing

  step "Paso" 1.2s settle:
    knees: flex 30
    ground-lock: feet
    cue "Indicación en español"

  repeat 8`;

/** Lista Markdown de valores cerrados, cada uno entre `` ` ``. */
function lista(valores: readonly string[]): string {
  return valores.map((valor) => `- \`${valor}\``).join("\n");
}

/** Genera la referencia de sintaxis de Posecode (Markdown, en español). */
export function referenciaSintaxis(): string {
  const lineas = [
    "# Referencia de sintaxis de Posecode",
    "",
    `Lenguaje de versión ${POSECODE_VERSION}. Vocabulario cerrado exportado por \`posecode-parser\`.`,
    "",
    "## Tipos de movimiento",
    "",
    lista(MOVEMENT_KINDS),
    "",
    "## Poses iniciales",
    "",
    lista(START_POSE_NAMES),
    "",
    "## Modos de timing de un paso",
    "",
    "Modos (se indican después de la duración, ej. `1.2s settle`):",
    "",
    lista(MODES),
    "",
    "Curvas de easing (modos y alias legados):",
    "",
    lista(EASINGS),
    "",
    "## Contactos (ground-lock, pin, reach)",
    "",
    "Apoyos en el piso (`ground-lock`):",
    "",
    lista(GROUND_LOCK_EFFECTOR_NAMES),
    "",
    "Puntos fijos que trasladan el cuerpo a un anclaje (`pin`):",
    "",
    lista(PIN_EFFECTOR_NAMES),
    "",
    "Efectores que se llevan a un punto por IK (`reach`):",
    "",
    lista(REACH_EFFECTOR_NAMES),
    "",
    "## Elementos (props)",
    "",
    lista(PROP_TYPES),
    "",
    "## Plantilla mínima",
    "",
    "```",
    PLANTILLA_MINIMA,
    "```",
  ];
  return lineas.join("\n") + "\n";
}
