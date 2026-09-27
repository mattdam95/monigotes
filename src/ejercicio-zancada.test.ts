import { existsSync, readFileSync } from "node:fs";
import { parse, type PosecodeIR } from "posecode-parser";
import { describe, expect, it } from "vitest";
import { validarCatalogo } from "./catalogo.js";

const RUTA_EJERCICIOS = new URL("../ejercicios", import.meta.url).pathname;
const RUTA_ZANCADA = new URL("../ejercicios/zancada.posecode", import.meta.url)
  .pathname;

// El ejemplo oficial de Posecode ("Forward lunge") tiene estos dos pasos y cues.
const EJEMPLO = {
  pasos: 2,
  cuesEnIngles: [
    "Step forward and lower the back knee toward the floor",
    "Push through the front heel to stand tall",
  ],
};

// Funciones y preposiciones básicas del español rioplatense para comprobar
// que un cue fue traducido y no quedó en inglés.
const PALABRAS_ESPANOL = [
  "el",
  "la",
  "los",
  "las",
  "un",
  "una",
  "unos",
  "unas",
  "al",
  "de",
  "del",
  "en",
  "con",
  "por",
  "para",
  "hacia",
  "hasta",
  "que",
  "se",
  "tu",
  "te",
  "lo",
  "le",
];

function fuenteZancada(): string {
  expect(
    existsSync(RUTA_ZANCADA),
    "Falta el archivo ejercicios/zancada.posecode",
  ).toBe(true);
  return readFileSync(RUTA_ZANCADA, "utf8");
}

function irZancada(): PosecodeIR {
  const { ir, errors } = parse(fuenteZancada());
  expect(errors).toEqual([]);
  if (ir === null) {
    throw new Error("El parser no devolvió un IR para zancada.posecode");
  }
  return ir;
}

function esEnEspañol(texto: string): boolean {
  const palabras = texto
    .toLowerCase()
    .split(/[^a-záéíóúüñ]+/)
    .filter(Boolean);
  return palabras.some((p) => PALABRAS_ESPANOL.includes(p));
}

describe('ejercicio "Zancada"', () => {
  it("existe ejercicios/zancada.posecode y validarCatalogo no devuelve errores para él", () => {
    expect(existsSync(RUTA_ZANCADA)).toBe(true);
    const resultados = validarCatalogo(RUTA_EJERCICIOS);
    const zancada = resultados.find((r) => r.archivo === "zancada.posecode");
    expect(zancada, "zancada.posecode no aparece en el catálogo").toBeDefined();
    expect(zancada?.errores).toEqual([]);
  });

  it('tiene como primera línea posecode exercise "Zancada"', () => {
    const primera = fuenteZancada().split(/\r?\n/)[0];
    expect(primera).toBe('posecode exercise "Zancada"');
  });

  it("tiene la misma cantidad de pasos que el ejemplo y cada paso tiene un cue no vacío en español", () => {
    const ir = irZancada();
    expect(ir.phases).toHaveLength(EJEMPLO.pasos);
    for (const fase of ir.phases) {
      expect(fase.cue?.trim().length ?? 0).toBeGreaterThan(0);
      expect(EJEMPLO.cuesEnIngles).not.toContain(fase.cue?.trim());
      expect(esEnEspañol(fase.cue ?? "")).toBe(true);
    }
  });

  it("el primer paso tiene knee_right: flex 95, knee_left: flex 80, pin: foot_left floor y reach: foot_right floor", () => {
    const primerPaso = irZancada().phases[0];
    const objetivo = (boneId: string) =>
      primerPaso.targets.find((t) => t.boneId === boneId);

    expect(objetivo("knee_right")?.euler).toEqual({ x: 95, y: 0, z: 0 });
    expect(objetivo("knee_left")?.euler).toEqual({ x: 80, y: 0, z: 0 });
    expect(primerPaso.pins).toEqual([
      { effector: "foot_left", anchor: "floor" },
    ]);
    expect(primerPaso.reaches).toEqual([
      { effector: "foot_right", target: "floor" },
    ]);
  });

  it("tiene repeat 6", () => {
    expect(irZancada().repeat).toBe(6);
  });
});
