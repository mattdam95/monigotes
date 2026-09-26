import {
  ACTION_NAMES,
  BONES,
  JOINT_GROUP_NAMES,
  actionsForJoint,
  expandJoint,
  romFor,
} from "posecode-parser";

interface Fila {
  articulacion: string;
  accion: string;
  min: number;
  max: number;
}

/**
 * Rango de un grupo simétrico para una acción: la intersección de los rangos
 * de sus huesos (el máximo de los mínimos y el mínimo de los máximos), para
 * que el mismo ángulo pedido lo alcance cada hueso a la vez. Devuelve null si
 * algún hueso del grupo no define la acción.
 *
 * Exportado para que los tests comparen la fila de un grupo contra esta
 * intersección calculada dinámicamente, no contra el ROM de un hueso aislado.
 */
export function rangoDeGrupo(
  grupo: string,
  accion: string,
): { min: number; max: number } | null {
  let min = -Infinity;
  let max = Infinity;
  for (const hueso of expandJoint(grupo)) {
    const rom = romFor(hueso, accion);
    if (rom === null) return null;
    min = Math.max(min, rom.min);
    max = Math.min(max, rom.max);
  }
  return { min, max };
}

function filasDeGrupo(grupo: string): Fila[] {
  return actionsForJoint(grupo).flatMap((accion) => {
    const rom = rangoDeGrupo(grupo, accion);
    return rom === null
      ? []
      : [{ articulacion: grupo, accion, min: rom.min, max: rom.max }];
  });
}

function filasDeHueso(hueso: string): Fila[] {
  return ACTION_NAMES.flatMap((accion) => {
    const rom = romFor(hueso, accion);
    return rom === null
      ? []
      : [{ articulacion: hueso, accion, min: rom.min, max: rom.max }];
  });
}

function tablaMarkdown(filas: Fila[]): string {
  const lineas = [
    "| Articulación | Acción | Mínimo | Máximo |",
    "| --- | --- | --- | --- |",
  ];
  for (const fila of filas) {
    lineas.push(
      `| ${fila.articulacion} | ${fila.accion} | ${fila.min} | ${fila.max} |`,
    );
  }
  return lineas.join("\n");
}

/**
 * Genera `skill/references/articulaciones.md` (snapshot de archivo) con cada
 * articulación de Posecode, las acciones que acepta y el rango de cada acción,
 * todo leído de `posecode-parser`.
 */
export function referenciaArticulaciones(): string {
  const lineas = [
    "# Articulaciones de Posecode",
    "",
    "Referencia generada automáticamente desde `posecode-parser` (no editar a mano: se regenera con `pnpm test -- -u`). Muestra cada articulación de Posecode, las acciones que acepta y el rango de cada acción, en grados.",
    "",
    "## Grupos simétricos",
    "",
    "Los grupos mueven ambos lados del cuerpo a la vez. El rango de cada acción de un grupo es la intersección de los rangos de sus huesos (el máximo de los mínimos y el mínimo de los máximos): dentro de ese rango, el mismo ángulo pedido lo alcanza cada hueso del grupo a la vez.",
    "",
    tablaMarkdown(JOINT_GROUP_NAMES.flatMap(filasDeGrupo)),
    "",
    "## Huesos",
    "",
    "Cada hueso del rig por separado: los huesos con lado (`knee_left`, `knee_right`, …) y los del eje central (`pelvis`, `spine`, `chest`, `neck`, `head`).",
    "",
    tablaMarkdown(BONES.flatMap(filasDeHueso)),
  ];
  // El salto de línea final evita `\ No newline at end of file` en el snapshot.
  return lineas.join("\n") + "\n";
}
