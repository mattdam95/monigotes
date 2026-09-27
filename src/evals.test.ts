import { readFileSync } from "node:fs";
import {
  GROUND_LOCK_EFFECTOR_NAMES,
  JOINT_NAMES,
  MOVEMENT_KINDS,
  START_POSE_NAMES,
} from "posecode-parser";
import { describe, expect, it } from "vitest";
import { validarCasos } from "./evals.js";

const RUTA_CASOS = new URL("../skill/evals/casos.json", import.meta.url)
  .pathname;

const KEBA = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const CAMPOS_ESPERADO = [
  "tipo",
  "poseInicial",
  "articulacionesClave",
  "contactos",
] as const;

type CampoEsperado = (typeof CAMPOS_ESPERADO)[number];

type Esperado = {
  tipo: string;
  poseInicial: string;
  articulacionesClave: string[];
  contactos: string[];
};

type Caso = {
  id: string;
  pedido: string;
  esperado: Esperado;
};

/** Lee el JSON de casos de evaluación sin tiparlo. */
function leerCasos(): unknown {
  return JSON.parse(readFileSync(RUTA_CASOS, "utf8"));
}

/** Los casos de evaluación, tipados. */
function casosTipados(): Caso[] {
  return leerCasos() as Caso[];
}

/** Una copia suelta del caso del índice dado, lista para modificar. */
function copiaDe(indice: number): Record<string, unknown> {
  const original: Record<string, unknown> = {
    ...(leerCasos() as Record<string, unknown>[])[indice],
  };
  return {
    ...original,
    esperado: { ...(original.esperado as Record<string, unknown>) },
  };
}

describe("skill/evals/casos.json", () => {
  describe("estructura", () => {
    it("tiene exactamente 20 casos", () => {
      expect(leerCasos()).toHaveLength(20);
    });

    it("todos los id son únicos y en kebab-case", () => {
      const ids = casosTipados().map((caso) => caso.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) {
        expect(typeof id).toBe("string");
        if (typeof id === "string") {
          expect(id).toMatch(KEBA);
        }
      }
    });

    it("cada caso tiene un pedido en texto", () => {
      for (const caso of casosTipados()) {
        expect(typeof caso.pedido).toBe("string");
        expect(caso.pedido.trim()).not.toBe("");
      }
    });
  });

  describe("vocabulario de Posecode", () => {
    it("cada tipo está en MOVEMENT_KINDS", () => {
      for (const caso of casosTipados()) {
        expect(MOVEMENT_KINDS).toContain(caso.esperado.tipo);
      }
    });

    it("cada poseInicial está en START_POSE_NAMES", () => {
      for (const caso of casosTipados()) {
        expect(START_POSE_NAMES).toContain(caso.esperado.poseInicial);
      }
    });

    it("cada articulación clave está en JOINT_NAMES", () => {
      for (const caso of casosTipados()) {
        for (const articulacion of caso.esperado.articulacionesClave) {
          expect(JOINT_NAMES).toContain(articulacion);
        }
      }
    });

    it("cada contacto está en GROUND_LOCK_EFFECTOR_NAMES", () => {
      for (const caso of casosTipados()) {
        for (const contacto of caso.esperado.contactos) {
          expect(GROUND_LOCK_EFFECTOR_NAMES).toContain(contacto);
        }
      }
    });
  });

  describe("variedad de movimientos", () => {
    it("hay al menos 4 casos de tipo stretch", () => {
      const cantidad = casosTipados().filter(
        (caso) => caso.esperado.tipo === "stretch",
      ).length;
      expect(cantidad).toBeGreaterThanOrEqual(4);
    });

    it("hay al menos 3 casos de tipo posture", () => {
      const cantidad = casosTipados().filter(
        (caso) => caso.esperado.tipo === "posture",
      ).length;
      expect(cantidad).toBeGreaterThanOrEqual(3);
    });

    it("hay al menos 5 casos con poseInicial distinta de standing", () => {
      const cantidad = casosTipados().filter(
        (caso) => caso.esperado.poseInicial !== "standing",
      ).length;
      expect(cantidad).toBeGreaterThanOrEqual(5);
    });
  });
});

describe("validarCasos", () => {
  it("no reporta problemas con los casos del archivo", () => {
    expect(validarCasos(leerCasos())).toEqual([]);
  });

  it.each(CAMPOS_ESPERADO.map((campo) => [campo] as const))(
    "reporta un caso con el campo esperado.%s faltante",
    (campo: CampoEsperado) => {
      const copia = copiaDe(0);
      delete (copia.esperado as Record<string, unknown>)[campo];
      const problemas = validarCasos([copia]);
      expect(problemas.length).toBeGreaterThan(0);
      expect(problemas.join(" ")).toContain(campo);
    },
  );

  it("reporta un caso con el campo pedido faltante", () => {
    const copia = copiaDe(0);
    delete copia.pedido;
    const problemas = validarCasos([copia]);
    expect(problemas.length).toBeGreaterThan(0);
    expect(problemas.join(" ")).toContain("pedido");
  });

  it("reporta un caso con una articulación inexistente", () => {
    const copia = copiaDe(0);
    (copia.esperado as Record<string, unknown>).articulacionesClave = [
      "rodillas",
    ];
    const problemas = validarCasos([copia]);
    expect(problemas.length).toBeGreaterThan(0);
    expect(problemas.join(" ")).toContain(String(copia.id));
  });
});
