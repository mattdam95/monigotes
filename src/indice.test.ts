import { describe, expect, it } from "vitest";
import { indiceCatalogo, type EntradaIndice } from "./indice.js";

const dirFixtures = new URL("./__fixtures__/indice", import.meta.url).pathname;
const dirEjercicios = new URL("../../ejercicios", import.meta.url).pathname;

const IDs_ORDENADOS = ["estiramiento-hombro", "sentadilla-peso-libre"];

function entradaPorId(entradas: EntradaIndice[], id: string): EntradaIndice {
  const entrada = entradas.find((e) => e.id === id);
  if (!entrada) throw new Error(`falta la entrada "${id}" en el índice`);
  return entrada;
}

describe("índice del catálogo", () => {
  describe("con los fixtures de src/__fixtures__/indice", () => {
    const entradas = indiceCatalogo(dirFixtures);

    it("tiene 2 entradas ordenadas por id y no aparece el archivo inválido", () => {
      expect(entradas.map((e) => e.id)).toEqual(IDs_ORDENADOS);
      expect(entradas.map((e) => e.id)).not.toContain(
        "roto-artinulacion-invalida",
      );
    });

    it("duracionPasoSegundos de sentadilla-peso-libre (1.6s + 1.2s) es 2.8, con tolerancia de 0.01", () => {
      const sentadilla = entradaPorId(entradas, "sentadilla-peso-libre");
      expect(
        Math.abs(sentadilla.duracionPasoSegundos - 2.8),
      ).toBeLessThanOrEqual(0.01);
    });

    it("nombre, tipo, poseInicial, pasos y repeticiones coinciden con lo escrito en cada fixture", () => {
      const esperados = [
        {
          id: "estiramiento-hombro",
          nombre: "Estiramiento de hombro",
          tipo: "stretch",
          poseInicial: "neutral",
          pasos: ["Inclinación", "Retorno"],
          repeticiones: 3,
        },
        {
          id: "sentadilla-peso-libre",
          nombre: "Sentadilla con peso libre",
          tipo: "exercise",
          poseInicial: "standing",
          pasos: ["Bajar", "Subir"],
          repeticiones: 8,
        },
      ];
      for (const esperado of esperados) {
        const entrada = entradaPorId(entradas, esperado.id);
        expect(entrada.nombre).toBe(esperado.nombre);
        expect(entrada.tipo).toBe(esperado.tipo);
        expect(entrada.poseInicial).toBe(esperado.poseInicial);
        expect(entrada.pasos).toEqual(esperado.pasos);
        expect(entrada.repeticiones).toBe(esperado.repeticiones);
      }
    });
  });

  describe("sobre la carpeta real ejercicios/", () => {
    const entradas = indiceCatalogo(dirEjercicios);

    it("cada entrada tiene nombre no vacío y al menos un paso", () => {
      expect(entradas.length).toBeGreaterThan(0);
      for (const entrada of entradas) {
        expect(entrada.nombre.length).toBeGreaterThan(0);
        expect(entrada.pasos.length).toBeGreaterThan(0);
      }
    });
  });
});
