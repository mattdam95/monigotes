import { describe, expect, it } from "vitest";
import {
  BONES,
  actionsForJoint,
  expandJoint,
  JOINT_GROUP_NAMES,
  romFor,
} from "posecode-parser";
import { referenciaArticulaciones } from "./ref-articulaciones.js";

/**
 * Celdas de todas las filas de datos de las tablas Markdown del documento
 * (sin encabezados ni filas separadoras).
 */
function celdasDeFilas(texto: string): string[][] {
  return texto
    .split("\n")
    .map((linea) => linea.trim())
    .filter((linea) => linea.startsWith("|"))
    .map((linea) =>
      linea
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((celda) => celda.trim()),
    )
    .filter(
      (celdas) => celdas[0] !== "Articulación" && !/^:?-+:?$/.test(celdas[0]),
    );
}

/** Celdas de la fila `| articulacion | accion | ... |`, o undefined si no existe. */
function filaDe(
  texto: string,
  articulacion: string,
  accion: string,
): string[] | undefined {
  return celdasDeFilas(texto).find(
    (celdas) => celdas[0] === articulacion && celdas[1] === accion,
  );
}

describe("referenciaArticulaciones", () => {
  it("coincide con skill/references/articulaciones.md (snapshot de archivo)", async () => {
    await expect(referenciaArticulaciones()).toMatchFileSnapshot(
      "../skill/references/articulaciones.md",
    );
  });

  it("tiene el título `# Articulaciones de Posecode`", () => {
    expect(referenciaArticulaciones()).toContain(
      "# Articulaciones de Posecode",
    );
  });

  it.each([...JOINT_GROUP_NAMES, ...BONES])("menciona %s", (nombre) => {
    expect(referenciaArticulaciones()).toContain(nombre);
  });

  it("la fila knees/flex muestra el mínimo y máximo que devuelve el parser", () => {
    expect(actionsForJoint("knees")).toContain("flex");
    const texto = referenciaArticulaciones();
    for (const hueso of expandJoint("knees")) {
      const rom = romFor(hueso, "flex");
      expect(rom, `rom para ${hueso}/flex`).not.toBeNull();
      if (rom === null) continue;
      const celdas = filaDe(texto, "knees", "flex");
      expect(celdas, "fila knees/flex en la referencia").toBeDefined();
      if (celdas === undefined) continue;
      expect(celdas[2]).toBe(String(rom.min));
      expect(celdas[3]).toBe(String(rom.max));
    }
  });

  it("no tiene filas duplicadas (misma articulación y acción)", () => {
    const claves = celdasDeFilas(referenciaArticulaciones()).map(
      (celdas) => `${celdas[0]}|${celdas[1]}`,
    );
    const repetidas = claves.filter((clave, i) => claves.indexOf(clave) !== i);
    expect(repetidas).toEqual([]);
  });
});
