/** Palabras en inglés prohibidas como palabra completa en cues y nombres de paso. */
const PALABRAS_EN_INGLES = [
  "the",
  "and",
  "your",
  "with",
  "push",
  "lift",
  "lower",
  "keep",
  "knee",
  "knees",
  "hips",
  "back",
  "arms",
  "step",
  "hold",
  "stand",
];

const NOMBRE_KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*\.posecode$/;
const LINEA_POSECODE = /^posecode\s+(\S+)\s+"(.*)"\s*$/;
const LINEA_PASO = /^\s*step\s+"([^"]*)"/;
const LINEA_CUE = /^\s*cue\s+"([^"]*)"\s*$/;
const LINEA_REPEAT = /^\s*repeat\s+(\d+)\s*$/;

interface Paso {
  nombre: string;
  cues: string[];
}

/** Devuelve las palabras de la lista que aparecen como palabra completa en el texto. */
function palabrasInglesas(texto: string): string[] {
  return PALABRAS_EN_INGLES.filter((p) =>
    new RegExp(`\\b${p}\\b`, "i").test(texto),
  );
}

/**
 * Revisa un archivo `.posecode` contra las reglas de estilo del catálogo.
 * Devuelve una lista de problemas en español; vacía si el archivo está bien.
 */
export function revisarEstilo(archivo: string, texto: string): string[] {
  const problemas: string[] = [];
  const lineas = texto.split(/\r?\n/);

  // Regla 1: el nombre de archivo es kebab-case ASCII.
  if (!NOMBRE_KEBAB.test(archivo)) {
    problemas.push(`El nombre de archivo "${archivo}" no es kebab-case ASCII`);
  }

  // Regla 2: hay una línea `posecode <tipo> "<nombre>"` con nombre no vacío.
  const lineaPosecode = lineas.find((l) => l.startsWith("posecode"));
  if (!lineaPosecode) {
    problemas.push('Falta la línea `posecode <tipo> "<nombre>"`');
  } else {
    const m = LINEA_POSECODE.exec(lineaPosecode);
    if (!m) {
      problemas.push(
        `La línea posecode está incompleta: ${JSON.stringify(lineaPosecode)}`,
      );
    } else if (m[2].trim() === "") {
      problemas.push("La línea posecode tiene el nombre vacío");
    }
  }

  // Regla 3: cada step tiene al menos un cue no vacío.
  // Regla 5: los cues y los nombres de paso no traen palabras en inglés.
  const pasos: Paso[] = [];
  for (const linea of lineas) {
    const paso = LINEA_PASO.exec(linea);
    if (paso) {
      pasos.push({ nombre: paso[1], cues: [] });
      continue;
    }
    const cue = LINEA_CUE.exec(linea);
    if (cue && pasos.length > 0) {
      pasos[pasos.length - 1].cues.push(cue[1]);
    }
  }

  for (const paso of pasos) {
    if (paso.cues.length === 0) {
      problemas.push(`El paso "${paso.nombre}" no tiene ningún cue`);
    } else if (!paso.cues.some((c) => c.trim() !== "")) {
      problemas.push(`El paso "${paso.nombre}" tiene el cue vacío`);
    }

    const enNombre = palabrasInglesas(paso.nombre);
    if (enNombre.length > 0) {
      problemas.push(
        `El nombre del paso "${paso.nombre}" contiene palabras en inglés: ${enNombre.join(", ")}`,
      );
    }
    for (const cue of paso.cues) {
      const enCue = palabrasInglesas(cue);
      if (enCue.length > 0) {
        problemas.push(
          `El cue del paso "${paso.nombre}" contiene palabras en inglés: ${enCue.join(", ")}`,
        );
      }
    }
  }

  // Regla 4: hay una línea `repeat N` con N mayor o igual a 1.
  let vioRepeat = false;
  for (const linea of lineas) {
    const m = LINEA_REPEAT.exec(linea);
    if (!m) {
      continue;
    }
    vioRepeat = true;
    if (Number(m[1]) < 1) {
      problemas.push(
        "La línea repeat debe indicar una cantidad de repeticiones mayor o igual a 1",
      );
    }
  }
  if (!vioRepeat) {
    problemas.push("Falta la línea `repeat N` con la cantidad de repeticiones");
  }

  return problemas;
}
