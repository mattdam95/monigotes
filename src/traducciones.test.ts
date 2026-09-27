import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ACTION_NAMES, BONES, JOINT_GROUP_NAMES } from "posecode-parser";
import {
  ACCIONES_ES,
  ARTICULACIONES_ES,
  HUESOS_AXIALES_ES,
  aPosecode,
} from "./traducciones.js";

/** Fuente de `traducciones.ts`, para chequear lo que pasa al importar. */
const FUENTE = readFileSync(
  new URL("./traducciones.ts", import.meta.url).pathname,
  "utf8",
);

describe("traducciones español ↔ Posecode", () => {
  it("traduce cada valor de JOINT_GROUP_NAMES en ARTICULACIONES_ES", () => {
    for (const grupo of JOINT_GROUP_NAMES) {
      expect(
        ARTICULACIONES_ES[grupo],
        `falta la traducción de "${grupo}"`,
      ).toBeTypeOf("string");
    }
  });

  it("traduce cada valor de ACTION_NAMES en ACCIONES_ES", () => {
    for (const accion of ACTION_NAMES) {
      expect(
        ACCIONES_ES[accion],
        `falta la traducción de "${accion}"`,
      ).toBeTypeOf("string");
    }
  });

  it("no repite traducciones dentro de ARTICULACIONES_ES", () => {
    const valores = Object.values(ARTICULACIONES_ES);
    expect(new Set(valores).size).toBe(valores.length);
  });

  it("no repite traducciones dentro de ACCIONES_ES", () => {
    const valores = Object.values(ACCIONES_ES);
    expect(new Set(valores).size).toBe(valores.length);
  });

  it("busca el nombre de Posecode en ambos diccionarios", () => {
    expect(aPosecode("rodillas")).toBe("knees");
    expect(aPosecode("FLEXIONAR")).toBe("flex");
    expect(aPosecode("abducir")).toBe("abduct");
  });

  it("ignora mayúsculas y tildes al buscar", () => {
    expect(aPosecode("Rodillas")).toBe("knees");
    expect(aPosecode("rodíllas")).toBe("knees");
  });

  it("resuelve articulaciones con lado en su hueso: rodilla izquierda → knee_left", () => {
    const resultado = aPosecode("rodilla izquierda");
    expect(resultado).toBe("knee_left");
    expect(BONES).toContain(resultado);
  });

  it("devuelve undefined para términos que no reconoce", () => {
    expect(aPosecode("banana")).toBeUndefined();
  });

  describe("huesos axiales: HUESOS_AXIALES_ES", () => {
    it("traduce cada hueso de BONES sin sufijo _left/_right (contra BONES, sin listas manuales)", () => {
      for (const hueso of BONES) {
        if (/_left$|_right$/.test(hueso)) continue;
        expect(
          HUESOS_AXIALES_ES[hueso],
          `falta la traducción del hueso axial "${hueso}"`,
        ).toBeTypeOf("string");
      }
    });

    it("traduce los ejemplos de la spec: columna → spine, cuello → neck, cabeza → head", () => {
      expect(HUESOS_AXIALES_ES["spine"]).toBe("columna");
      expect(HUESOS_AXIALES_ES["neck"]).toBe("cuello");
      expect(HUESOS_AXIALES_ES["head"]).toBe("cabeza");
    });

    it("aPosecode resuelve cada traducción de HUESOS_AXIALES_ES a su hueso", () => {
      for (const [hueso, es] of Object.entries(HUESOS_AXIALES_ES)) {
        expect(aPosecode(es), `no resuelve "${es}" → ${hueso}`).toBe(hueso);
      }
    });

    it("no repite traducciones dentro de HUESOS_AXIALES_ES", () => {
      const valores = Object.values(HUESOS_AXIALES_ES);
      expect(new Set(valores).size).toBe(valores.length);
    });

    it("no choca con traducciones de ARTICULACIONES_ES ni de ACCIONES_ES", () => {
      const ocupadas = new Set([
        ...Object.values(ARTICULACIONES_ES),
        ...Object.values(ACCIONES_ES),
      ]);
      for (const es of Object.values(HUESOS_AXIALES_ES)) {
        expect(
          ocupadas.has(es),
          `"${es}" ya se usa en ARTICULACIONES_ES o ACCIONES_ES`,
        ).toBe(false);
      }
    });
  });

  it("aPosecode resuelve columna → spine", () => {
    expect(aPosecode("columna")).toBe("spine");
  });

  it("aPosecode resuelve codo derecho → elbow_right", () => {
    expect(aPosecode("codo derecho")).toBe("elbow_right");
  });

  it("aPosecode no resuelve antebrazo izquierdo: no existe hueso de un solo lado", () => {
    expect(aPosecode("antebrazo izquierdo")).toBeUndefined();
  });

  it("no define ni llama a verificarCobertura al importar", () => {
    expect(FUENTE).not.toContain("verificarCobertura");
  });

  it("no contiene el comentario con 'Comproba'", () => {
    expect(FUENTE).not.toContain("Comproba");
  });

  it("tiene una traducción para hinge (el valor queda a verificar por el usuario)", () => {
    expect(ACCIONES_ES["hinge"]).toBeTypeOf("string");
  });
});
