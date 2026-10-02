import { describe, expect, it } from "vitest";
import { iniciales } from "./iniciales.js";

describe("iniciales", () => {
  it("exporta una función que recibe y devuelve strings", () => {
    expect(typeof iniciales).toBe("function");
    expect(iniciales("ana maría pérez")).toBeTypeOf("string");
  });

  it('iniciales("ana maría pérez") devuelve "AMP"', () => {
    expect(iniciales("ana maría pérez")).toBe("AMP");
  });

  it("los espacios de más no generan iniciales vacías", () => {
    expect(iniciales("  luis   gómez ")).toBe("LG");
  });

  it('iniciales("") devuelve ""', () => {
    expect(iniciales("")).toBe("");
  });

  it('las letras con tilde se conservan: iniciales("ángel órtiz") devuelve "ÁÓ"', () => {
    expect(iniciales("ángel órtiz")).toBe("ÁÓ");
  });
});
