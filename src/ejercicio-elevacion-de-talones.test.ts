import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse, type PosecodeIR } from "posecode-parser";
import { describe, expect, it } from "vitest";
import { validarCatalogo } from "./catalogo.js";

const ARCHIVO = "elevacion-de-talones.posecode";
const RUTA = fileURLToPath(
  new URL(`../ejercicios/${ARCHIVO}`, import.meta.url),
);
const CARPETA_EJERCICIOS = fileURLToPath(
  new URL("../ejercicios", import.meta.url),
);

// Cues del ejemplo oficial de Posecode (Apache-2.0, posecode-dev/posecode,
// spec/examples/): el ejercicio tiene que traducirlos al español, no copiarlos.
const CUES_INGLESES = [
  "Press through the balls of the feet and lift the heels",
  "Lower the heels under control",
];

function leer(): string {
  return readFileSync(RUTA, "utf8");
}

function ir(): PosecodeIR {
  const resultado = parse(leer());
  if (resultado.ir === null) {
    throw new Error(
      `posecode-parser no pudo parsear: ${resultado.errors
        .map((e) => String(e.message ?? e))
        .join("; ")}`,
    );
  }
  return resultado.ir;
}

/** Devuelve el texto fuente de cada `step`, en orden de aparición. */
function bloquesDePasos(fuente: string): string[] {
  const inicios = [...fuente.matchAll(/^  step /gm)].map((m) => m.index ?? 0);
  return inicios.map((inicio, i) => fuente.slice(inicio, inicios[i + 1]));
}

describe("Elevación de talones (ejercicios/elevacion-de-talones.posecode)", () => {
  it("existe y validarCatalogo no devuelve errores para él", () => {
    expect(existsSync(RUTA)).toBe(true);
    const resultado = validarCatalogo(CARPETA_EJERCICIOS).find(
      (r) => r.archivo === ARCHIVO,
    );
    expect(resultado).toBeDefined();
    expect(resultado?.errores).toEqual([]);
  });

  it('la primera línea es posecode exercise "Elevación de talones"', () => {
    expect(leer().split(/\r?\n/)[0]).toBe(
      'posecode exercise "Elevación de talones"',
    );
  });

  it("tiene la misma cantidad de pasos que el ejemplo (2) y cada paso tiene un cue no vacío en español", () => {
    const fases = ir().phases;
    expect(fases).toHaveLength(2);
    for (const fase of fases) {
      expect(fase.cue).toBeTypeOf("string");
      expect(fase.cue?.trim().length ?? 0).toBeGreaterThan(0);
      expect(CUES_INGLESES).not.toContain(fase.cue);
    }
  });

  it("el primer paso tiene ankles: plantarflex 35 y el segundo ankles: plantarflex 0", () => {
    const [primero, segundo] = bloquesDePasos(leer());
    expect(primero).toContain("ankles: plantarflex 35");
    expect(segundo).toContain("ankles: plantarflex 0");
  });

  it("tiene repeat 12", () => {
    expect(ir().repeat).toBe(12);
    expect(leer()).toMatch(/^  repeat 12$/m);
  });
});
