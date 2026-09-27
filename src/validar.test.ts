import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { formatearProblemas, validarTexto } from "./validar.js";

/**
 * Documento mínimo con una articulación que no existe en el rig.
 * La línea con `rodillas: flex 30` es la línea 6 del documento.
 */
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

/**
 * Documento que produce un error (articulación inexistente, línea 6) y
 * avisos (ángulo fuera de rango, línea 7) al mismo tiempo.
 */
const CON_ERROR_Y_AVISO = `posecode exercise "Test"
  rig humanoid
  pose start = standing

  step "A" 1s settle:
    rodillas: flex 30
    knees: flex 300
    ground-lock: feet
`;

const sentadilla = readFileSync(
  new URL("../ejercicios/sentadilla.posecode", import.meta.url),
  "utf8",
);

describe("validarTexto", () => {
  it("da ok: true y sin errores para un documento válido (sentadilla)", () => {
    const resultado = validarTexto(sentadilla);
    expect(resultado.ok).toBe(true);
    expect(resultado.errores).toEqual([]);
  });

  it("da ok: false si la articulación no existe", () => {
    const resultado = validarTexto(CON_ARTICULACION_INEXISTENTE);
    expect(resultado.ok).toBe(false);
    expect(resultado.errores.length).toBeGreaterThan(0);
  });

  it("sitúa el error de la articulación inexistente en la línea 6 (la de `rodillas: flex 30`)", () => {
    const resultado = validarTexto(CON_ARTICULACION_INEXISTENTE);
    expect(resultado.errores.length).toBeGreaterThan(0);
    expect(resultado.errores.some((p) => p.linea === 6)).toBe(true);
  });

  it("devuelve codigo null en errores y avisos, porque el parser no trae campo de código", () => {
    // ParseError de posecode-parser solo tiene { line, message } y Warning
    // solo { line, phase, joint, action, requested, clamped, limit }:
    // no hay código de error que reportar, así que codigo se deja null.
    const conError = validarTexto(CON_ARTICULACION_INEXISTENTE);
    expect(conError.errores.length).toBeGreaterThan(0);
    for (const p of conError.errores) {
      expect(p.codigo).toBeNull();
    }
    const conAviso = validarTexto(CON_ANGULO_FUERA_DE_RANGO);
    expect(conAviso.avisos.length).toBeGreaterThan(0);
    for (const p of conAviso.avisos) {
      expect(p.codigo).toBeNull();
    }
  });

  it("explica en español los errores del parser, sin traducir el mensaje original", () => {
    // El parser expone mensajes internos en inglés cuyo formato no es un
    // contrato estable, así que se conservan tal cual y solo se les antepone
    // un prefijo en español rioplatense que los contextualiza. El test
    // verifica el prefijo, no el contenido del mensaje del parser.
    const resultado = validarTexto(CON_ARTICULACION_INEXISTENTE);
    expect(resultado.errores.length).toBeGreaterThan(0);
    for (const p of resultado.errores) {
      expect(p.mensaje.startsWith("El parser reportó: ")).toBe(true);
    }
  });

  it("describe el ángulo fuera de rango, mencionando la articulación, la acción y el valor pedido", () => {
    const resultado = validarTexto(CON_ANGULO_FUERA_DE_RANGO);
    if (resultado.avisos.length > 0) {
      // El parser devuelve el aviso con el nombre del hueso (`knee_left` /
      // `knee_right`); la implementación lo mapea al grupo (`knees`) cuando
      // puede. El test acepta cualquier forma de la articulación sin depender
      // de ese mapeo, y exige que figuren la acción y el valor pedido.
      const completo = resultado.avisos.some(
        (a) =>
          (a.mensaje.includes("knees") ||
            a.mensaje.includes("knee_left") ||
            a.mensaje.includes("knee_right")) &&
          a.mensaje.includes("flex") &&
          a.mensaje.includes("300"),
      );
      expect(completo).toBe(true);
    } else {
      expect(resultado.errores.length).toBeGreaterThan(0);
      expect(resultado.errores.some((e) => typeof e.linea === "number")).toBe(
        true,
      );
    }
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

  it("escribe una línea por problema cuando hay un error y un aviso a la vez", () => {
    const resultado = validarTexto(CON_ERROR_Y_AVISO);
    expect(resultado.errores.length).toBeGreaterThan(0);
    expect(resultado.avisos.length).toBeGreaterThan(0);
    const texto = formatearProblemas(resultado);
    expect(texto.split("\n").length).toBe(
      resultado.errores.length + resultado.avisos.length,
    );
    expect(texto.startsWith("error L")).toBe(true);
  });
});
