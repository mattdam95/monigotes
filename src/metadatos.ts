/** Niveles de dificultad válidos para un ejercicio. */
export const NIVELES = ["principiante", "intermedio", "avanzado"] as const;

type Nivel = (typeof NIVELES)[number];

const CAMPOS = [
  "nombre",
  "musculosPrincipales",
  "musculosSecundarios",
  "equipo",
  "nivel",
  "instrucciones",
] as const;

type Campo = (typeof CAMPOS)[number];

const LISTAS = [
  "musculosPrincipales",
  "musculosSecundarios",
  "equipo",
  "instrucciones",
] as const;

type Lista = (typeof LISTAS)[number];

const MIN_INSTRUCCIONES = 3;
const MAX_INSTRUCCIONES = 6;

function esObjeto(dato: unknown): dato is Record<string, unknown> {
  return typeof dato === "object" && dato !== null;
}

function esLista(dato: unknown): dato is unknown[] {
  return Array.isArray(dato);
}

function esTexto(dato: unknown): dato is string {
  return typeof dato === "string";
}

function estaFalta(dato: Record<string, unknown>, campo: Campo): boolean {
  return !(campo in dato) || dato[campo] === undefined || dato[campo] === null;
}

/**
 * Valida los metadatos en español de un ejercicio.
 * Devuelve la lista de problemas encontrados (vacía si todo está bien).
 */
export function validarMetadatos(dato: unknown): string[] {
  if (!esObjeto(dato)) {
    return ["Los metadatos deben ser un objeto JSON."];
  }

  const problemas: string[] = [];

  for (const campo of CAMPOS) {
    if (estaFalta(dato, campo)) {
      problemas.push(`Falta el campo ${campo}.`);
    }
  }

  if (!estaFalta(dato, "nombre") && !esTexto(dato.nombre)) {
    problemas.push("nombre debe ser un texto.");
  } else if (esTexto(dato.nombre) && dato.nombre.trim() === "") {
    problemas.push("nombre no puede estar vacío ni ser solo espacios.");
  }

  if (
    !estaFalta(dato, "nivel") &&
    !NIVELES.some((nivel: Nivel) => nivel === dato.nivel)
  ) {
    problemas.push(
      `nivel debe ser uno de: ${NIVELES.join(", ")} (recibido: ${JSON.stringify(
        dato.nivel,
      )}).`,
    );
  }

  for (const lista of LISTAS) {
    if (estaFalta(dato, lista)) {
      continue;
    }
    const valor: unknown = dato[lista];
    if (!esLista(valor)) {
      problemas.push(`${lista} debe ser una lista.`);
      continue;
    }
    if (lista === "musculosPrincipales" && valor.length === 0) {
      problemas.push(
        "musculosPrincipales debe tener al menos un músculo principal.",
      );
      continue;
    }
    const elementos: string[] = valor.filter((e) => esTexto(e));
    const vacios =
      elementos.length !== valor.length ||
      elementos.some((e) => e.trim() === "");
    if (vacios) {
      problemas.push(`${lista} tiene elementos vacíos o no son texto.`);
    }
  }

  const instrucciones: unknown = dato.instrucciones;
  if (esLista(instrucciones)) {
    if (instrucciones.length < MIN_INSTRUCCIONES) {
      problemas.push(
        `instrucciones debe tener al menos ${MIN_INSTRUCCIONES} frases (hay ${instrucciones.length}).`,
      );
    } else if (instrucciones.length > MAX_INSTRUCCIONES) {
      problemas.push(
        `instrucciones debe tener como máximo ${MAX_INSTRUCCIONES} frases (hay ${instrucciones.length}).`,
      );
    }
  }

  return problemas;
}
