import { describe, expect, it } from "vitest";
import { validarCatalogo } from "./catalogo.js";

describe("catálogo de ejercicios", () => {
  const resultados = validarCatalogo(
    new URL("../ejercicios", import.meta.url).pathname,
  );

  it("tiene al menos un ejercicio", () => {
    expect(resultados.length).toBeGreaterThan(0);
  });

  it.each(resultados.map((r) => [r.archivo, r.errores] as const))(
    "%s no tiene errores del parser",
    (_archivo, errores) => {
      expect(errores).toEqual([]);
    },
  );
});
