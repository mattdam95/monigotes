export interface Entrada {
  id: string;
  nombre: string;
  alias?: string[];
}

export interface Resultado {
  id: string;
  puntaje: number;
}

/** Normaliza un texto: minúsculas, sin tildes, sin signos, sin plural simple. */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((palabra) =>
      palabra.length > 3 && palabra.endsWith("s")
        ? palabra.slice(0, -1)
        : palabra,
    )
    .join(" ");
}

/** Puntúa una consulta contra un texto normalizado. Devuelve 0 si no hay relación. */
function puntajar(consulta: string, texto: string): number {
  if (texto === consulta) return 100;
  if (texto.startsWith(consulta)) return 50;
  if (texto.includes(consulta)) return 30;
  const palabras = consulta.split(" ").filter(Boolean);
  const delTexto = new Set(texto.split(" ").filter(Boolean));
  const comunes = palabras.filter((p) => delTexto.has(p)).length;
  return comunes * 5;
}

/**
 * Busca en el catálogo un ejercicio a partir de una consulta en español.
 * Función pura: no lee archivos. Devuelve solo resultados con puntaje > 0,
 * ordenados de mayor a menor puntaje.
 */
export function buscarEjercicio(
  consulta: string,
  entradas: Entrada[],
): Resultado[] {
  const normalizada = normalizar(consulta);
  if (!normalizada) return [];
  return entradas
    .map((entrada) => {
      const textos = [entrada.nombre, ...(entrada.alias ?? [])].map(normalizar);
      const puntaje = Math.max(
        0,
        ...textos.map((t) => puntajar(normalizada, t)),
      );
      return { id: entrada.id, puntaje };
    })
    .filter((r) => r.puntaje > 0)
    .sort((a, b) => b.puntaje - a.puntaje || a.id.localeCompare(b.id));
}
