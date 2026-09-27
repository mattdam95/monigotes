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

  // Criterio: referenciaSintaxis() coincide con skill/references/sintaxis.md.
  // El matcher de snapshot devuelve una promesa: el test es async y la espera.
  it("coincide con skill/references/sintaxis.md (snapshot de archivo)", async () => {
    await expect(texto).toMatchFileSnapshot("../skill/references/sintaxis.md");
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

  // Criterio: la sección Contactos se reescribe sin erratas y con las
  // descripciones de pin y reach respaldadas por la documentación de
  // posecode-parser (node_modules/posecode-parser/dist/types.d.ts):
  // - PinTarget: "translate the whole figure so effector sits on a fixed
  //   world anchor" (el que se traslada es el cuerpo, no la extremidad).
  // - ReachTarget: "drive an effector to a world point solved by
  //   inverse kinematics".
  describe("redacción de la sección Contactos", () => {
    // Criterio: en la descripción de pin, "traslanzan" se reemplaza por
    // "trasladan" (o una redacción clara equivalente).
    it("la errata 'traslanzan' ya no aparece en el texto", () => {
      expect(texto).not.toContain("traslanzan");
    });

    // Criterio: "Effectores" pasa a "Efectores".
    it("la errata 'Effectores' ya no aparece en el texto", () => {
      expect(texto).not.toContain("Effectores");
    });

    describe("descripciones de pin y reach (según la doc de posecode-parser)", () => {
      it("pin: lo que se traslada es el cuerpo, hasta un anclaje fijo", () => {
        expect(lineaDescripcion(texto, "pin")).toMatch(/cuerpo/i);
        expect(lineaDescripcion(texto, "pin")).toMatch(/anclaje/i);
      });

      it("reach: el effector se lleva a un punto resuelto por IK", () => {
        expect(lineaDescripcion(texto, "reach")).toMatch(/IK/i);
        expect(lineaDescripcion(texto, "reach")).toMatch(/punto/i);
      });
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

/** Extrae la línea de descripción de un contacto (`pin` o `reach`). */
function lineaDescripcion(texto: string, contacto: "pin" | "reach"): string {
  const linea = texto.split("\n").find((l) => l.includes(`(${contacto}):`));
  if (!linea) {
    throw new Error(`no se encontró la descripción de \`${contacto}\``);
  }
  return linea;
}

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
