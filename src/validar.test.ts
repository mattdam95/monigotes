import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { formatearProblemas, validarTexto } from "./validar.js";

/** Documento mínimo con una articulación que no existe en el rig. */
const CON_ARTICULACION_INEXISTENTE = `posecode exercise "Test"
  rig humanoid
  pose start = standing

  step "A" 1s settle:
    rodillas: flex 30
    ground-lock: feet
`;

/** Documento con un ángulo fuera del rango de movimiento de la rodilla. */
const CON_ANGULO_FUERA_DE_RANGO = `posecode exercise "Test"
  rig humanoid
  pose start = standing

  step "A" 1s settle:
    knees: flex 300
    ground-lock: feet
`;

const sentadilla = readFileSync(
  new URL("../../ejercicios/sentadilla.posecode", import.meta.url),
  "utf8",
);

describe("validarTexto", () => {
  it("da ok: true y sin errores para un documento válido (sentadilla)", () => {
    const resultado = validarTexto(sentadilla);
    expect(resultado.ok).toBe(true);
    expect(resultado.errores).toEqual([]);
  });

  it("da ok: false y al menos un error con linea numérica si la articulación no existe", () => {
    const resultado = validarTexto(CON_ARTICULACION_INEXISTENTE);
    expect(resultado.ok).toBe(false);
    expect(resultado.errores.length).toBeGreaterThan(0);
    expect(resultado.errores.some((p) => typeof p.linea === "number")).toBe(
      true,
    );
  });

  it("reporta al menos un aviso o un error ante un ángulo fuera de rango", () => {
    const resultado = validarTexto(CON_ANGULO_FUERA_DE_RANGO);
    expect(resultado.avisos.length + resultado.errores.length).toBeGreaterThan(
      0,
    );
  });
});

describe("formatearProblemas", () => {
  it("devuelve 'sin problemas' para un resultado sin errores ni avisos", () => {
    const resultado = validarTexto(sentadilla);
    expect(formatearProblemas(resultado)).toBe("sin problemas");
  });

  it("empieza con 'error L' cuando el resultado tiene errores", () => {
    const resultado = validarTexto(CON_ARTICULACION_INEXISTENTE);
    expect(formatearProblemas(resultado)).toMatch(/^error L/);
  });
});
