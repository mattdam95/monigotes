import { describe, expect, it } from "vitest";
import { ACTION_NAMES, BONES, JOINT_GROUP_NAMES } from "posecode-parser";
import { ACCIONES_ES, ARTICULACIONES_ES, aPosecode } from "./traducciones.js";

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
});
