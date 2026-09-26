import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  actionAxis,
  expandJoint,
  parse,
  type Phase,
  type PosecodeIR,
} from "posecode-parser";
import { validarCatalogo } from "./catalogo.js";

const DIR_EJERCICIOS = new URL("../ejercicios", import.meta.url).pathname;
const ARCHIVO = "remo-inclinado.posecode";
const PRIMERA_LINEA = 'posecode exercise "Remo inclinado"';

// El ejemplo oficial (posecode-dev/posecode, spec/examples) tiene 4 pasos
// y `repeat 8`.
const PASOS_DEL_EJEMPLO = 4;
const REPETICIONES_DEL_EJEMPLO = 8;

// Los cues en español rioplatense usan imperativos de voseo acentuados
// ("Incliná", "Remá"); los cues en inglés del ejemplo no llevan acento.
const TIENE_ESPANOL = /[ÁÉÍÓÚÑáéíóúñ¡¿]/u;

const HUESOS_DEL_CODO = expandJoint("elbows"); // ["elbow_left", "elbow_right"]
const EJE_FLEX = actionAxis("flex")!.axis;

function leer(): string {
  try {
    return readFileSync(join(DIR_EJERCICIOS, ARCHIVO), "utf8");
  } catch {
    throw new Error(`Falta el archivo ejercicios/${ARCHIVO}`);
  }
}

function irRemo(): PosecodeIR {
  const { ir, errors } = parse(leer());
  if (ir === null) {
    throw new Error(
      `El parser no devolvió un IR: ${errors.map((e) => e.message).join("; ")}`,
    );
  }
  return ir;
}

/** Magnitud (en grados) de la flexión de `hueso` dentro de `paso`. */
function flexionDe(paso: Phase, hueso: string): number {
  const objetivo = paso.targets.find((t) => t.boneId === hueso);
  return objetivo ? Math.abs(objetivo.euler[EJE_FLEX]) : NaN;
}

describe("ejercicio Remo inclinado", () => {
  it("existe y validarCatalogo no devuelve errores para él", () => {
    expect(existsSync(join(DIR_EJERCICIOS, ARCHIVO))).toBe(true);
    const resultado = validarCatalogo(DIR_EJERCICIOS).find(
      (r) => r.archivo === ARCHIVO,
    );
    expect(resultado, "el archivo no aparece en el catálogo").toBeDefined();
    expect(resultado!.errores).toEqual([]);
  });

  it('tiene como primera línea posecode exercise "Remo inclinado"', () => {
    expect(leer().split("\n")[0]).toBe(PRIMERA_LINEA);
  });

  it("tiene los mismos pasos que el ejemplo, cada uno con cue no vacío en español", () => {
    const ir = irRemo();
    expect(ir.phases).toHaveLength(PASOS_DEL_EJEMPLO);
    for (const paso of ir.phases) {
      const cue = paso.cue ?? "";
      expect(
        cue.trim(),
        `el paso "${paso.name}" no tiene cue`,
      ).not.toHaveLength(0);
      expect(
        TIENE_ESPANOL.test(cue),
        `el cue del paso "${paso.name}" no parece español`,
      ).toBe(true);
    }
  });

  it("tiene 4 pasos y el paso de remar lleva los codos en flexión de 95", () => {
    const ir = irRemo();
    expect(ir.phases).toHaveLength(4);
    // El paso de remar es el de mayor flexión de codos (en el ejemplo los
    // demás pasos están en 10° o menos).
    const flexionMax = (paso: Phase) =>
      Math.max(...HUESOS_DEL_CODO.map((h) => flexionDe(paso, h)));
    const pasoRemar = ir.phases.reduce((a, b) =>
      flexionMax(b) > flexionMax(a) ? b : a,
    );
    for (const hueso of HUESOS_DEL_CODO) {
      expect(flexionDe(pasoRemar, hueso)).toBe(95);
    }
  });

  it("tiene repeat 8", () => {
    expect(irRemo().repeat).toBe(REPETICIONES_DEL_EJEMPLO);
  });
});
