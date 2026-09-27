import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validarCatalogo } from "./catalogo.js";

const carpeta = new URL("../ejercicios", import.meta.url).pathname;
const archivo = "elevacion-lateral.posecode";
const ruta = join(carpeta, archivo);
const RE_INICIO_PASO = /^[ \t]*step[ \t]*"/gm;

function textoDelEjercicio(): string {
  return readFileSync(ruta, "utf8");
}

/** Devuelve los bloques de texto de cada `step` del ejercicio. */
function pasosDelEjercicio(): string[] {
  return textoDelEjercicio().split(RE_INICIO_PASO).slice(1);
}

describe("ejercicio: elevación lateral", () => {
  it("existe ejercicios/elevacion-lateral.posecode", () => {
    expect(existsSync(ruta)).toBe(true);
  });

  it("validarCatalogo no devuelve errores para él", () => {
    const resultado = validarCatalogo(carpeta).find(
      (r) => r.archivo === archivo,
    );
    expect(resultado).toBeDefined();
    expect(resultado?.errores).toEqual([]);
  });

  it('se llama "Elevación lateral" (con tilde) y es de tipo exercise', () => {
    expect(textoDelEjercicio()).toMatch(
      /^posecode\s+exercise\s+"Elevación lateral"\s*$/m,
    );
  });

  it("tiene exactamente 2 pasos", () => {
    expect(pasosDelEjercicio()).toHaveLength(2);
  });

  it("un paso lleva shoulders: abduct hasta 90", () => {
    expect(
      pasosDelEjercicio().filter((p) => /shoulders:\s*abduct\s+90\b/.test(p)),
    ).toHaveLength(1);
  });

  it("otro paso vuelve a shoulders: abduct 0", () => {
    expect(
      pasosDelEjercicio().filter((p) => /shoulders:\s*abduct\s+0\b/.test(p)),
    ).toHaveLength(1);
  });

  it("cada paso tiene un cue no vacío", () => {
    for (const paso of pasosDelEjercicio()) {
      expect(paso).toMatch(/cue\s+"[^"]+"/);
    }
  });

  it("tiene repeat con un valor entre 8 y 15", () => {
    const m = /(?:^|\n)\s*repeat\s+(\d+)/.exec(textoDelEjercicio());
    expect(m).not.toBeNull();
    const veces = m ? Number(m[1]) : NaN;
    expect(veces).toBeGreaterThanOrEqual(8);
    expect(veces).toBeLessThanOrEqual(15);
  });
});
