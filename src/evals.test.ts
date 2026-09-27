import { readFileSync } from "node:fs";
import {
  GROUND_LOCK_EFFECTOR_NAMES,
  JOINT_NAMES,
  MOVEMENT_KINDS,
  START_POSE_NAMES,
} from "posecode-parser";
import { describe, expect, it } from "vitest";
import { validarCasos } from "./evals.js";

/**
 * Casos de evaluación de la skill: pedidos reales en español rioplatense con
 * lo que se espera del ejercicio que la skill deba generar (ver spec).
 */
interface Esperado {
  tipo: string;
  poseInicial: string;
  articulacionesClave: string[];
  contactos: string[];
}

interface Caso {
  id: string;
  pedido: string;
  esperado: Esperado;
}

const ARCHIVO = new URL("../skill/evals/casos.json", import.meta.url);
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function cargarCasos(): Caso[] {
  const dato = JSON.parse(readFileSync(ARCHIVO, "utf8"));
  if (!Array.isArray(dato)) {
    throw new Error("skill/evals/casos.json debe contener un array de casos");
  }
  return dato as Caso[];
}

describe("skill/evals/casos.json", () => {
  it("hay exactamente 20 casos", () => {
    expect(cargarCasos().length).toBe(20);
  });

  it("los id son únicos", () => {
    const ids = cargarCasos().map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("cada id está en kebab-case", () => {
    const malos = cargarCasos()
      .filter((c) => typeof c.id !== "string" || !KEBAB.test(c.id))
      .map((c) => String(c.id));
    expect(malos).toEqual([]);
  });

  it("cada caso tiene id, pedido (texto no vacío) y esperado completo", () => {
    const incompletos = cargarCasos()
      .filter((c) => {
        const e = c.esperado;
        return (
          typeof c.id !== "string" ||
          c.id.trim() === "" ||
          typeof c.pedido !== "string" ||
          c.pedido.trim() === "" ||
          typeof e?.tipo !== "string" ||
          typeof e?.poseInicial !== "string" ||
          !Array.isArray(e?.articulacionesClave) ||
          !Array.isArray(e?.contactos)
        );
      })
      .map((c) => String(c.id));
    expect(incompletos).toEqual([]);
  });

  it("cada tipo está en MOVEMENT_KINDS", () => {
    const tipos = MOVEMENT_KINDS as readonly string[];
    const invalidos = cargarCasos()
      .filter((c) => !tipos.includes(c.esperado.tipo))
      .map((c) => c.id);
    expect(invalidos).toEqual([]);
  });

  it("cada poseInicial está en START_POSE_NAMES", () => {
    const poses = START_POSE_NAMES as readonly string[];
    const invalidos = cargarCasos()
      .filter((c) => !poses.includes(c.esperado.poseInicial))
      .map((c) => c.id);
    expect(invalidos).toEqual([]);
  });

  it("cada articulación clave está en JOINT_NAMES", () => {
    const invalidos = cargarCasos()
      .filter((c) =>
        c.esperado.articulacionesClave.some((a) => !JOINT_NAMES.includes(a)),
      )
      .map((c) => c.id);
    expect(invalidos).toEqual([]);
  });

  it("cada contacto está en GROUND_LOCK_EFFECTOR_NAMES", () => {
    const contactos = GROUND_LOCK_EFFECTOR_NAMES as readonly string[];
    const invalidos = cargarCasos()
      .filter((c) => c.esperado.contactos.some((x) => !contactos.includes(x)))
      .map((c) => c.id);
    expect(invalidos).toEqual([]);
  });

  it("hay al menos 4 casos de tipo stretch", () => {
    const stretch = cargarCasos().filter((c) => c.esperado.tipo === "stretch");
    expect(stretch.length).toBeGreaterThanOrEqual(4);
  });

  it("hay al menos 3 casos de tipo posture", () => {
    const posture = cargarCasos().filter((c) => c.esperado.tipo === "posture");
    expect(posture.length).toBeGreaterThanOrEqual(3);
  });

  it("hay al menos 5 casos con poseInicial distinta de standing", () => {
    const otros = cargarCasos().filter(
      (c) => c.esperado.poseInicial !== "standing",
    );
    expect(otros.length).toBeGreaterThanOrEqual(5);
  });
});

describe("validarCasos", () => {
  const valido = {
    id: "sentadilla-sumo",
    pedido: "Mostrame una sentadilla sumo, con las piernas bien abiertas",
    esperado: {
      tipo: "exercise",
      poseInicial: "standing",
      articulacionesClave: ["hips", "knees"],
      contactos: ["feet"],
    },
  };

  it("no reporta problemas para un caso válido", () => {
    expect(validarCasos([valido])).toEqual([]);
  });

  it("reporta un caso con un campo faltante", () => {
    const sinPedido = {
      id: "sentadilla-sumo",
      esperado: valido.esperado,
    };
    const problemas = validarCasos([sinPedido]);
    expect(problemas.length).toBeGreaterThan(0);
    expect(problemas.join(" ")).toContain("pedido");
  });

  it("reporta un caso con una articulación inexistente", () => {
    const problemas = validarCasos([
      {
        ...valido,
        esperado: { ...valido.esperado, articulacionesClave: ["rodillas"] },
      },
    ]);
    expect(problemas.length).toBeGreaterThan(0);
    expect(problemas.join(" ")).toContain("rodillas");
  });
});
