import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse, type Phase } from "posecode-parser";
import { validarCatalogo } from "./catalogo.js";

const DIR_EJERCICIOS = new URL("../ejercicios", import.meta.url).pathname;
const RUTA_PESO_MUERTO = new URL(
  "../ejercicios/peso-muerto.posecode",
  import.meta.url,
).pathname;

// El ejemplo oficial de Posecode ("Deadlift") tiene 2 pasos.
const CANTIDAD_PASOS_EJEMPLO = 2;

// Cues del ejemplo original en inglés: el ejercicio debe traducirlos al español.
const CUES_ORIGINALES_EN_INGLES = [
  "Push the hips back with a flat back as the arms hang below the shoulders",
  "Drive the hips forward and return to a tall stance",
];

function leerPesoMuerto(): string {
  return readFileSync(RUTA_PESO_MUERTO, "utf8");
}

function parsearPesoMuerto() {
  return parse(leerPesoMuerto());
}

function hingeDePelvis(fase: Phase | undefined): number | undefined {
  return fase?.targets.find((t) => t.boneId === "pelvis")?.euler.x;
}

describe('ejercicio "Peso muerto"', () => {
  it("existe en el catálogo y validarCatalogo no devuelve errores para él", () => {
    const resultados = validarCatalogo(DIR_EJERCICIOS);
    const pesoMuerto = resultados.find(
      (r) => r.archivo === "peso-muerto.posecode",
    );
    expect(pesoMuerto).toBeDefined();
    expect(pesoMuerto?.errores).toEqual([]);
  });

  it('la primera línea es `posecode exercise "Peso muerto"`', () => {
    const primeraLinea = leerPesoMuerto().split(/\r?\n/)[0];
    expect(primeraLinea).toBe('posecode exercise "Peso muerto"');
  });

  it("tiene la misma cantidad de pasos que el ejemplo y cada paso tiene un cue no vacío en español", () => {
    const { ir, errors } = parsearPesoMuerto();
    expect(errors).toEqual([]);
    expect(ir?.phases).toHaveLength(CANTIDAD_PASOS_EJEMPLO);
    for (const fase of ir?.phases ?? []) {
      expect(fase.cue?.trim().length ?? 0).toBeGreaterThan(0);
      expect(CUES_ORIGINALES_EN_INGLES).not.toContain(fase.cue);
    }
  });

  it("el primer paso tiene pelvis: hinge 75 y el segundo pelvis: hinge 0", () => {
    const { ir, errors } = parsearPesoMuerto();
    expect(errors).toEqual([]);
    expect(hingeDePelvis(ir?.phases[0])).toBe(75);
    expect(hingeDePelvis(ir?.phases[1])).toBe(0);
  });

  it("tiene repeat 8", () => {
    const { ir, errors } = parsearPesoMuerto();
    expect(errors).toEqual([]);
    expect(ir?.repeat).toBe(8);
  });
});
