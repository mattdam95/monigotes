import { describe, expect, it } from "vitest";
import { saludar } from "./saludar.js";

describe("saludar", () => {
  it('devuelve "Hola, {nombre}!"', () => {
    expect(saludar("Camila")).toBe("Hola, Camila!");
  });

  it("funciona con nombres con espacios", () => {
    expect(saludar("María José")).toBe("Hola, María José!");
  });

  it("con nombre vacío saluda igual", () => {
    expect(saludar("")).toBe("Hola, !");
  });
});
