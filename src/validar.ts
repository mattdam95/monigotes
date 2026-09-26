import { parse, type ParseError, type Warning } from "posecode-parser";

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

function problemaDeError(e: ParseError): Problema {
  return { linea: e.line, codigo: null, mensaje: e.message };
}

function problemaDeAviso(w: Warning): Problema {
  const mensaje = `${w.joint} ${w.action} ${w.requested}° fuera de rango (${w.limit.min}° a ${w.limit.max}°): se limita a ${w.clamped}°`;
  return { linea: w.line, codigo: null, mensaje };
}
