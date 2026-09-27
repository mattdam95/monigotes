import {
  expandJoint,
  JOINT_GROUP_NAMES,
  parse,
  type ParseError,
  type Warning,
} from "posecode-parser";

/** Un problema (error o aviso) con información lista para mostrar. */
export interface Problema {
  linea: number | null;
  codigo: string | null;
  mensaje: string;
}

/** Resultado de validar un texto Posecode. `ok` es true si no hay errores. */
export interface ResultadoValidacion {
  ok: boolean;
  errores: Problema[];
  avisos: Problema[];
}

/**
 * Valida un texto Posecode con el parser y convierte los `ParseError` y
 * `Warning` en problemas listos para mostrar en español.
 */
export function validarTexto(texto: string): ResultadoValidacion {
  const { errors, warnings } = parse(texto);
  return {
    ok: errors.length === 0,
    errores: errors.map((e) => problemaDeError(e)),
    avisos: warnings.map((w) => problemaDeAviso(w)),
  };
}

/** Devuelve el texto de los problemas, uno por línea, o "sin problemas". */
export function formatearProblemas(r: ResultadoValidacion): string {
  const lineas: string[] = [];
  for (const e of r.errores) {
    lineas.push(
      e.linea === null
        ? `error: ${e.mensaje}`
        : `error L${e.linea}: ${e.mensaje}`,
    );
  }
  for (const a of r.avisos) {
    lineas.push(
      a.linea === null
        ? `aviso: ${a.mensaje}`
        : `aviso L${a.linea}: ${a.mensaje}`,
    );
  }
  return lineas.length === 0 ? "sin problemas" : lineas.join("\n");
}

/**
 * Convierte un `ParseError` en un problema. El tipo solo trae `{ line,
 * message }` (sin campo de código), así que `codigo` se deja `null`.
 * El mensaje del parser es interno y en inglés, y no es un contrato
 * estable, así que se conserva tal cual y se le anteponen contexto en
 * español rioplatense en vez de traducirlo.
 */
function problemaDeError(e: ParseError): Problema {
  return {
    linea: e.line,
    codigo: null,
    mensaje: `El parser reportó: ${e.message}`,
  };
}

/**
 * Convierte un `Warning` en un problema. El tipo solo trae `{ line, phase,
 * joint, action, requested, clamped, limit }` (sin campo de código), así
 * que `codigo` se deja `null`.
 */
function problemaDeAviso(w: Warning): Problema {
  const mensaje = `${nombreDeArticulacion(w.joint)} ${w.action} ${w.requested}° fuera de rango (${w.limit.min}° a ${w.limit.max}°): se limita a ${w.clamped}°`;
  return { linea: w.line, codigo: null, mensaje };
}

/**
 * El parser expande los grupos simétricos al emitir avisos (p. ej.
 * `knees` → avisos por `knee_left` y `knee_right`), así que el campo
 * `joint` trae el nombre del hueso. Si el hueso pertenece a un grupo
 * simétrico, se devuelve el nombre del grupo (el que escribió el autor);
 * si no, el nombre del hueso tal cual.
 */
function nombreDeArticulacion(bone: string): string {
  for (const grupo of JOINT_GROUP_NAMES) {
    if (expandJoint(grupo).includes(bone)) {
      return grupo;
    }
  }
  return bone;
}
