import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { revisarEstilo } from "./estilo.js";

/** Texto de ejemplo que cumple todas las reglas de estilo. */
const TEXTO_BIEN = `posecode exercise "Sentadilla"
  rig humanoid
  pose start = standing

  step "Bajar" 1.6s settle:
    hips: flex 80
    cue "Llevá la cadera hacia atrás, pecho erguido"

  step "Subir" 1.2s drive:
    hips: flex 0
    cue "Empujá con los talones hasta quedar parado"

  repeat 8
`;

/** No tiene la línea `posecode <tipo> "<nombre>"`. */
const TEXTO_SIN_LINEA_POSECODE = `  rig humanoid

  step "Bajar" 1.6s settle:
    hips: flex 80
    cue "Llevá la cadera hacia atrás, pecho erguido"

  repeat 8
`;

/** La línea `posecode` tiene el nombre vacío. */
const TEXTO_NOMBRE_VACIO = `posecode exercise ""
  rig humanoid

  step "Bajar" 1.6s settle:
    hips: flex 80
    cue "Llevá la cadera hacia atrás, pecho erguido"

  repeat 8
`;

/** Un paso no tiene `cue`. */
const TEXTO_PASO_SIN_CUE = `posecode exercise "Sentadilla"
  rig humanoid

  step "Bajar" 1.6s settle:
    hips: flex 80

  step "Subir" 1.2s drive:
    hips: flex 0
    cue "Empujá con los talones hasta quedar parado"

  repeat 8
`;

/** Un paso tiene el `cue` vacío. */
const TEXTO_CUE_VACIO = `posecode exercise "Sentadilla"
  rig humanoid

  step "Bajar" 1.6s settle:
    hips: flex 80
    cue ""

  repeat 8
`;

/** No tiene la línea `repeat`. */
const TEXTO_SIN_REPEAT = `posecode exercise "Sentadilla"
  rig humanoid

  step "Bajar" 1.6s settle:
    hips: flex 80
    cue "Llevá la cadera hacia atrás, pecho erguido"
`;

/** Tiene `repeat` con N menor que 1. */
const TEXTO_REPEAT_CERO = `posecode exercise "Sentadilla"
  rig humanoid

  step "Bajar" 1.6s settle:
    hips: flex 80
    cue "Llevá la cadera hacia atrás, pecho erguido"

  repeat 0
`;

/** Un `cue` contiene palabras en inglés. */
const TEXTO_CUE_EN_INGLES = `posecode exercise "Sentadilla"
  rig humanoid

  step "Bajar" 1.6s settle:
    hips: flex 80
    cue "Push with your legs"

  repeat 8
`;

/** El nombre de un paso contiene palabras en inglés. */
const TEXTO_PASO_EN_INGLES = `posecode exercise "Sentadilla"
  rig humanoid

  step "Hold the plank" 1.6s settle:
    hips: flex 80
    cue "Mantené la posición"

  repeat 8
`;

/** Un `cue` contiene la palabra en inglés en mayúsculas. */
const TEXTO_CUE_MAYUSCULAS = `posecode exercise "Sentadilla"
  rig humanoid

  step "Bajar" 1.6s settle:
    hips: flex 80
    cue "PUSH fuerte"

  repeat 8
`;

describe("revisarEstilo", () => {
  it("regla 1: reporta un nombre de archivo que no sea kebab-case ASCII", () => {
    expect(revisarEstilo("Sentadilla.posecode", TEXTO_BIEN)).not.toEqual([]);
    expect(revisarEstilo("sentadilla.pose", TEXTO_BIEN)).not.toEqual([]);
  });

  it("regla 2: reporta la falta de la línea posecode o un nombre vacío", () => {
    expect(
      revisarEstilo("sentadilla.posecode", TEXTO_SIN_LINEA_POSECODE),
    ).not.toEqual([]);
    expect(
      revisarEstilo("sentadilla.posecode", TEXTO_NOMBRE_VACIO),
    ).not.toEqual([]);
  });

  it("regla 3: reporta un paso sin cue o con cue vacío", () => {
    expect(
      revisarEstilo("sentadilla.posecode", TEXTO_PASO_SIN_CUE),
    ).not.toEqual([]);
    expect(revisarEstilo("sentadilla.posecode", TEXTO_CUE_VACIO)).not.toEqual(
      [],
    );
  });

  it("regla 4: reporta la falta de repeat o un repeat menor que 1", () => {
    expect(revisarEstilo("sentadilla.posecode", TEXTO_SIN_REPEAT)).not.toEqual(
      [],
    );
    expect(revisarEstilo("sentadilla.posecode", TEXTO_REPEAT_CERO)).not.toEqual(
      [],
    );
  });

  it("regla 5: reporta palabras en inglés en cues o nombres de paso", () => {
    expect(
      revisarEstilo("sentadilla.posecode", TEXTO_CUE_EN_INGLES),
    ).not.toEqual([]);
    expect(
      revisarEstilo("sentadilla.posecode", TEXTO_PASO_EN_INGLES),
    ).not.toEqual([]);
    expect(
      revisarEstilo("sentadilla.posecode", TEXTO_CUE_MAYUSCULAS),
    ).not.toEqual([]);
  });

  it("un texto correcto da una lista vacía", () => {
    expect(revisarEstilo("sentadilla.posecode", TEXTO_BIEN)).toEqual([]);
  });
});

describe("catálogo de ejercicios", () => {
  const dir = new URL("../ejercicios", import.meta.url).pathname;
  const archivos = readdirSync(dir)
    .filter((f) => f.endsWith(".posecode"))
    .sort();

  it("tiene al menos un ejercicio", () => {
    expect(archivos.length).toBeGreaterThan(0);
  });

  it.each(archivos)("%s cumple las reglas de estilo", (archivo) => {
    const texto = readFileSync(join(dir, archivo), "utf8");
    expect(revisarEstilo(archivo, texto)).toEqual([]);
  });
});
