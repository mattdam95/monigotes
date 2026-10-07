import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "posecode-parser";
import { describe, expect, it } from "vitest";
import { PALABRAS_EN_INGLES, revisarEstilo } from "./estilo.js";

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

/** Comentarios `#` al final de las líneas `cue` y `repeat`; `parse()` los acepta. */
const TEXTO_COMENTARIO_HASHTAG = `posecode exercise "Sentadilla"
  rig humanoid
  pose start = standing

  step "Bajar" 1.6s settle:
    hips: flex 80
    cue "Llevá la cadera hacia atrás, pecho erguido" # nota al final

  repeat 8 # veces
`;

/** Comentarios `//` al final de las líneas `cue` y `repeat`; `parse()` los acepta. */
const TEXTO_COMENTARIO_DOS_PUNTOS = `posecode exercise "Sentadilla"
  rig humanoid
  pose start = standing

  step "Bajar" 1.6s settle:
    hips: flex 80
    cue "Llevá la cadera hacia atrás, pecho erguido" // otra nota

  repeat 8 // veces
`;

/** Un `cue` con comillas escapadas: `parse()` rechaza el texto. */
const TEXTO_CUE_COMILLAS_ESCAPADAS = `posecode exercise "Sentadilla"
  rig humanoid
  pose start = standing

  step "Bajar" 1.6s settle:
    hips: flex 80
    cue "Sostén la \\"posición\\" firme"

  repeat 8
`;

/** Un paso tiene el `cue` con solo espacios. */
const TEXTO_CUE_SOLO_ESPACIOS = `posecode exercise "Sentadilla"
  rig humanoid

  step "Bajar" 1.6s settle:
    hips: flex 80
    cue "   "

  repeat 8
`;

/** Un paso sin `cue` y sin `repeat`: viola dos reglas a la vez. */
const TEXTO_DOS_VIOLACIONES = `posecode exercise "Sentadilla"
  rig humanoid

  step "Bajar" 1.6s settle:
    hips: flex 80
`;

/** Un paso con dos `cue`, uno vacío y otro no: pasa. */
const TEXTO_DOS_CUES_UNO_VACIO = `posecode exercise "Sentadilla"
  rig humanoid

  step "Bajar" 1.6s settle:
    hips: flex 80
    cue ""
    cue "Llevá la cadera hacia atrás, pecho erguido"

  repeat 8
`;

/** Textos de ejemplo: cada uno viola exactamente una regla. */
const TEXTOS_CON_UN_PROBLEMA: { archivo: string; texto: string }[] = [
  // Regla 1: nombre de archivo.
  { archivo: "Sentadilla.posecode", texto: TEXTO_BIEN },
  { archivo: "sentadilla.pose", texto: TEXTO_BIEN },
  // Regla 2: línea posecode.
  { archivo: "sentadilla.posecode", texto: TEXTO_SIN_LINEA_POSECODE },
  { archivo: "sentadilla.posecode", texto: TEXTO_NOMBRE_VACIO },
  // Regla 3: cues del paso.
  { archivo: "sentadilla.posecode", texto: TEXTO_PASO_SIN_CUE },
  { archivo: "sentadilla.posecode", texto: TEXTO_CUE_VACIO },
  // Regla 4: línea repeat.
  { archivo: "sentadilla.posecode", texto: TEXTO_SIN_REPEAT },
  { archivo: "sentadilla.posecode", texto: TEXTO_REPEAT_CERO },
  // Regla 5: palabras en inglés.
  { archivo: "sentadilla.posecode", texto: TEXTO_CUE_EN_INGLES },
  { archivo: "sentadilla.posecode", texto: TEXTO_PASO_EN_INGLES },
  { archivo: "sentadilla.posecode", texto: TEXTO_CUE_MAYUSCULAS },
];

describe("revisarEstilo", () => {
  it("regla 1: reporta un nombre de archivo que no sea kebab-case ASCII", () => {
    expect(revisarEstilo("Sentadilla.posecode", TEXTO_BIEN)).toEqual([
      'El nombre de archivo "Sentadilla.posecode" no es kebab-case ASCII',
    ]);
    expect(revisarEstilo("sentadilla.pose", TEXTO_BIEN)).toEqual([
      'El nombre de archivo "sentadilla.pose" no es kebab-case ASCII',
    ]);
  });

  it("regla 2: reporta la falta de la línea posecode o un nombre vacío", () => {
    expect(
      revisarEstilo("sentadilla.posecode", TEXTO_SIN_LINEA_POSECODE),
    ).toEqual(['Falta la línea `posecode <tipo> "<nombre>"`']);
    expect(revisarEstilo("sentadilla.posecode", TEXTO_NOMBRE_VACIO)).toEqual([
      "La línea posecode tiene el nombre vacío",
    ]);
  });

  it("regla 3: reporta un paso sin cue o con cue vacío", () => {
    expect(revisarEstilo("sentadilla.posecode", TEXTO_PASO_SIN_CUE)).toEqual([
      'El paso "Bajar" no tiene ningún cue',
    ]);
    expect(revisarEstilo("sentadilla.posecode", TEXTO_CUE_VACIO)).toEqual([
      'El paso "Bajar" tiene el cue vacío',
    ]);
  });

  it("regla 4: reporta la falta de repeat o un repeat menor que 1", () => {
    expect(revisarEstilo("sentadilla.posecode", TEXTO_SIN_REPEAT)).toEqual([
      "Falta la línea `repeat N` con la cantidad de repeticiones",
    ]);
    expect(revisarEstilo("sentadilla.posecode", TEXTO_REPEAT_CERO)).toEqual([
      "La línea repeat debe indicar una cantidad de repeticiones mayor o igual a 1",
    ]);
  });

  it("regla 5: reporta palabras en inglés en cues o nombres de paso", () => {
    expect(revisarEstilo("sentadilla.posecode", TEXTO_CUE_EN_INGLES)).toEqual([
      'El cue del paso "Bajar" contiene palabras en inglés: "your", "with", "push"',
    ]);
    expect(revisarEstilo("sentadilla.posecode", TEXTO_PASO_EN_INGLES)).toEqual([
      'El nombre del paso "Hold the plank" contiene palabras en inglés: "the", "hold"',
    ]);
    expect(revisarEstilo("sentadilla.posecode", TEXTO_CUE_MAYUSCULAS)).toEqual([
      'El cue del paso "Bajar" contiene palabras en inglés: "push"',
    ]);
  });

  it("un texto correcto da una lista vacía", () => {
    expect(revisarEstilo("sentadilla.posecode", TEXTO_BIEN)).toEqual([]);
  });

  it("cada texto de ejemplo viola solo una regla", () => {
    for (const { archivo, texto } of TEXTOS_CON_UN_PROBLEMA) {
      expect(revisarEstilo(archivo, texto), texto).toHaveLength(1);
    }
  });

  it("no da falsos positivos con comentarios # o // al final de cue y repeat", () => {
    const textos = [TEXTO_COMENTARIO_HASHTAG, TEXTO_COMENTARIO_DOS_PUNTOS];
    for (const texto of textos) {
      // Primero se verifica que el parser acepta el texto.
      expect(parse(texto).errors, texto).toEqual([]);
      expect(revisarEstilo("sentadilla.posecode", texto), texto).toEqual([]);
    }
  });

  it("una cue con comillas escapadas es inválida para parse() y la regla 3 la reporta", () => {
    // El parser no admite comillas escapadas dentro de una cue (ver LINEA_CUE).
    expect(parse(TEXTO_CUE_COMILLAS_ESCAPADAS).errors).not.toEqual([]);
    expect(
      revisarEstilo("sentadilla.posecode", TEXTO_CUE_COMILLAS_ESCAPADAS),
    ).toEqual(['El paso "Bajar" no tiene ningún cue']);
  });

  it("los mensajes están en español", () => {
    const mensajes = TEXTOS_CON_UN_PROBLEMA.flatMap(({ archivo, texto }) =>
      revisarEstilo(archivo, texto),
    );
    expect(mensajes).toHaveLength(TEXTOS_CON_UN_PROBLEMA.length);
    for (const mensaje of mensajes) {
      // Fuera de las citas entre comillas no debe quedar ninguna palabra de la lista.
      const sinCitas = mensaje.replace(/"[^"]*"/g, " ");
      const enIngles = PALABRAS_EN_INGLES.filter((p) =>
        new RegExp(`\\b${p}\\b`, "i").test(sinCitas),
      );
      expect(enIngles, `mensaje: ${mensaje}`).toEqual([]);
    }
  });
});

describe("casos de borde", () => {
  it("un cue con solo espacios se reporta como cue vacío", () => {
    expect(
      revisarEstilo("sentadilla.posecode", TEXTO_CUE_SOLO_ESPACIOS),
    ).toEqual(['El paso "Bajar" tiene el cue vacío']);
  });

  it("un texto que viola dos reglas a la vez devuelve dos problemas", () => {
    expect(revisarEstilo("sentadilla.posecode", TEXTO_DOS_VIOLACIONES)).toEqual(
      [
        'El paso "Bajar" no tiene ningún cue',
        "Falta la línea `repeat N` con la cantidad de repeticiones",
      ],
    );
  });

  it("un paso con dos cues donde solo uno está vacío pasa", () => {
    expect(
      revisarEstilo("sentadilla.posecode", TEXTO_DOS_CUES_UNO_VACIO),
    ).toEqual([]);
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
