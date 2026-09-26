import { describe, expect, it } from "vitest";
import { buscarEjercicio } from "./buscar.js";

describe("buscarEjercicio", () => {
  const entradas = [
    { id: "sentadilla", nombre: "Sentadilla", alias: ["squat"] },
    { id: "curl-de-biceps", nombre: "Curl de bíceps" },
    { id: "elevacion-lateral", nombre: "Elevación lateral" },
    { id: "sentadilla-sencilla", nombre: "Sentadilla sencilla" },
  ];

  it('"sentadillas" encuentra sentadilla primero', () => {
    const resultados = buscarEjercicio("sentadillas", entradas);
    expect(resultados.length).toBeGreaterThan(0);
    expect(resultados[0].id).toBe("sentadilla");
  });

  it('"curl biceps" encuentra curl-de-biceps', () => {
    const resultados = buscarEjercicio("curl biceps", entradas);
    expect(resultados.length).toBeGreaterThan(0);
    expect(resultados[0].id).toBe("curl-de-biceps");
  });

  it('"ELEVACION" encuentra "Elevación lateral"', () => {
    const resultados = buscarEjercicio("ELEVACION", entradas);
    expect(resultados.length).toBeGreaterThan(0);
    expect(resultados[0].id).toBe("elevacion-lateral");
  });

  it("un alias funciona: buscar 'squat' encuentra la entrada que lo tiene", () => {
    const resultados = buscarEjercicio("squat", entradas);
    expect(resultados.map((r) => r.id)).toContain("sentadilla");
  });

  it('"natación" no devuelve resultados sobre esas entradas', () => {
    expect(buscarEjercicio("natación", entradas)).toEqual([]);
  });

  it("con dos coincidencias, la exacta queda antes que la parcial", () => {
    const resultados = buscarEjercicio("sentadilla", entradas);
    const ids = resultados.map((r) => r.id);
    expect(ids).toContain("sentadilla");
    expect(ids).toContain("sentadilla-sencilla");
    expect(ids.indexOf("sentadilla")).toBeLessThan(
      ids.indexOf("sentadilla-sencilla"),
    );
  });

  it("solo devuelve resultados con puntaje > 0, de mayor a menor", () => {
    const resultados = buscarEjercicio("sentadilla", entradas);
    expect(resultados.length).toBeGreaterThan(1);
    for (const r of resultados) {
      expect(r.puntaje).toBeGreaterThan(0);
    }
    for (let i = 1; i < resultados.length; i++) {
      expect(resultados[i - 1].puntaje).toBeGreaterThanOrEqual(
        resultados[i].puntaje,
      );
    }
  });
});
