/** Devuelve las iniciales en mayúscula de cada palabra del nombre. */
export function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter((palabra) => palabra.length > 0)
    .map((palabra) => palabra[0].toUpperCase())
    .join("");
}
