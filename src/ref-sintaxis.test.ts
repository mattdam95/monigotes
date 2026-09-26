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
  parse,
} from "posecode-parser";
import { describe, expect, it } from "vitest";
import { referenciaSintaxis } from "./ref-sintaxis.js";

describe("referencia de sintaxis de Posecode", () => {
  const texto = referenciaSintaxis();

  // Criterio: referenciaSintaxis() coincide con skill/references/sintaxis.md
  it("coincide con skill/references/sintaxis.md (snapshot de archivo)", () => {
    expect(texto).toMatchFileSnapshot("../skill/references/sintaxis.md");
  });

  // Criterio: el texto incluye cada valor de las constantes del parser
  // (se comparan contra las constantes, no contra listas escritas a mano).
  describe("incluye cada valor de las constantes de posecode-parser", () => {
    it.each(MOVEMENT_KINDS)("tipos de movimiento: %s", (valor) => {
      expect(texto).toContain(valor);
    });

    it.each(START_POSE_NAMES)("poses iniciales: %s", (valor) => {
      expect(texto).toContain(valor);
    });

    it.each(GROUND_LOCK_EFFECTOR_NAMES)(
      "contactos ground-lock: %s",
      (valor) => {
        expect(texto).toContain(valor);
      },
    );

    it.each(MODES)("modos de timing de un paso: %s", (valor) => {
      expect(texto).toContain(valor);
    });

    it.each(EASINGS)("curvas de easing: %s", (valor) => {
      expect(texto).toContain(valor);
    });

    it.each(PIN_EFFECTOR_NAMES)("contactos pin: %s", (valor) => {
      expect(texto).toContain(valor);
    });

    it.each(REACH_EFFECTOR_NAMES)("contactos reach: %s", (valor) => {
      expect(texto).toContain(valor);
    });

    it.each(PROP_TYPES)("elementos (props): %s", (valor) => {
      expect(texto).toContain(valor);
    });

    it("menciona la versión del lenguaje", () => {
      expect(texto).toContain(POSECODE_VERSION);
    });
  });

  // Criterio: el bloque de la plantilla mínima, extraído del texto,
  // pasa parse() sin errores.
  describe("plantilla mínima", () => {
    it("el bloque extraído del texto pasa parse() sin errores", () => {
      const { errors } = parse(bloquePlantilla(texto));
      expect(errors).toEqual([]);
    });
  });
});

/** Extrae el primer bloque de código de la sección «Plantilla mínima». */
function bloquePlantilla(texto: string): string {
  const inicio = texto.indexOf("## Plantilla mínima");
  if (inicio === -1) {
    throw new Error("no se encontró la sección «## Plantilla mínima»");
  }
  const coincidencia = texto.slice(inicio).match(/```[^\n]*\n([\s\S]*?)```/);
  if (!coincidencia) {
    throw new Error(
      "la sección «Plantilla mínima» no tiene un bloque de código",
    );
  }
  return coincidencia[1];
}
