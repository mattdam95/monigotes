import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "posecode-parser";

export interface ResultadoArchivo {
  archivo: string;
  errores: string[];
}

/** Valida con el parser de Posecode cada `.posecode` de una carpeta. */
export function validarCatalogo(dir: string): ResultadoArchivo[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".posecode"))
    .sort()
    .map((archivo) => {
      const { errors } = parse(readFileSync(join(dir, archivo), "utf8"));
      return { archivo, errores: errors.map((e) => String(e.message ?? e)) };
    });
}
