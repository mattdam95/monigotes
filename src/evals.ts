import {
  GROUND_LOCK_EFFECTOR_NAMES,
  JOINT_NAMES,
  MOVEMENT_KINDS,
  START_POSE_NAMES,
} from "posecode-parser";

/** Los id de los casos van en kebab-case (p. ej. "sentadilla-sumo"). */
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** True si el valor es un objeto plano (no `null` ni array). */
function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

/**
 * Valida los casos de evaluación de la skill (ver `skill/evals/casos.json`)
 * y devuelve una lista de problemas, uno por línea, o un array vacío si todo
 * está bien.
 *
 * Por caso verifica:
 * - `id`: texto no vacío en kebab-case.
 * - `pedido`: texto no vacío (el pedido en español rioplatense).
 * - `esperado.tipo` está en `MOVEMENT_KINDS`.
 * - `esperado.poseInicial` está en `START_POSE_NAMES`.
 * - cada `esperado.articulacionesClave` está en `JOINT_NAMES`.
 * - cada `esperado.contactos` está en `GROUND_LOCK_EFFECTOR_NAMES`.
 *
 * El vocabulario se importa de `posecode-parser` para no duplicar la fuente
 * de verdad (mismo criterio que el resto del catálogo).
 */
export function validarCasos(casos: unknown): string[] {
  if (!Array.isArray(casos)) {
    return ["los casos deben ser un array de objetos"];
  }
  return casos.flatMap((caso, i) => problemasDeCaso(caso, i));
}

/** Etiqueta legible de un caso: índice (desde 1) y su id si lo tiene. */
function etiquetaDeCaso(caso: unknown, indice: number): string {
  const id =
    esObjeto(caso) && typeof caso.id === "string" && caso.id.trim() !== ""
      ? caso.id
      : "sin id";
  return `caso ${indice + 1} (${id})`;
}

/** Los problemas de un caso, uno por línea. */
function problemasDeCaso(caso: unknown, indice: number): string[] {
  if (!esObjeto(caso)) {
    return [`${etiquetaDeCaso(caso, indice)}: el caso debe ser un objeto`];
  }
  const problemas: string[] = [];
  const etiqueta = etiquetaDeCaso(caso, indice);

  const id = caso.id;
  if (typeof id !== "string" || id.trim() === "") {
    problemas.push(`${etiqueta}: falta el campo "id"`);
  } else if (!KEBAB.test(id)) {
    problemas.push(`${etiqueta}: el id "${id}" no está en kebab-case`);
  }

  const pedido = caso.pedido;
  if (typeof pedido !== "string" || pedido.trim() === "") {
    problemas.push(`${etiqueta}: falta el campo "pedido"`);
  }

  const esperado = caso.esperado;
  if (!esObjeto(esperado)) {
    problemas.push(`${etiqueta}: falta el campo "esperado"`);
    return problemas;
  }

  const tipo = esperado.tipo;
  if (typeof tipo !== "string" || tipo.trim() === "") {
    problemas.push(`${etiqueta}: falta el campo "esperado.tipo"`);
  } else if (!(MOVEMENT_KINDS as readonly string[]).includes(tipo)) {
    problemas.push(`${etiqueta}: el tipo "${tipo}" no está en MOVEMENT_KINDS`);
  }

  const poseInicial = esperado.poseInicial;
  if (typeof poseInicial !== "string" || poseInicial.trim() === "") {
    problemas.push(`${etiqueta}: falta el campo "esperado.poseInicial"`);
  } else if (!(START_POSE_NAMES as readonly string[]).includes(poseInicial)) {
    problemas.push(
      `${etiqueta}: la poseInicial "${poseInicial}" no está en START_POSE_NAMES`,
    );
  }

  problemas.push(
    ...problemasDeLista(
      esperado,
      "articulacionesClave",
      "la articulación",
      JOINT_NAMES,
      "JOINT_NAMES",
      etiqueta,
    ),
    ...problemasDeLista(
      esperado,
      "contactos",
      "el contacto",
      GROUND_LOCK_EFFECTOR_NAMES,
      "GROUND_LOCK_EFFECTOR_NAMES",
      etiqueta,
    ),
  );

  return problemas;
}

/**
 * Verifica que `esperado[campo]` sea una lista de textos y que cada texto
 * esté en `vocabulario` (el vocabulario del parser importado, con su nombre
 * para el mensaje).
 */
function problemasDeLista(
  esperado: Record<string, unknown>,
  campo: "articulacionesClave" | "contactos",
  descripcion: string,
  vocabulario: readonly string[],
  nombreVocabulario: string,
  etiqueta: string,
): string[] {
  const valor = esperado[campo];
  if (!Array.isArray(valor)) {
    return [`${etiqueta}: falta el campo "esperado.${campo}"`];
  }
  return valor.flatMap((item) => {
    if (typeof item !== "string" || item.trim() === "") {
      return [`${etiqueta}: "esperado.${campo}" debe ser una lista de textos`];
    }
    if (!vocabulario.includes(item)) {
      return [
        `${etiqueta}: ${descripcion} "${item}" no existe en ${nombreVocabulario}`,
      ];
    }
    return [];
  });
}
