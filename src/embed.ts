/** Versión del reproductor `posecode-embed` que incrustamos en los artifacts. */
export const VERSION_EMBED = "0.5.0";

export interface OpcionesReproductor {
  /**
   * Alto del reproductor en píxeles (por defecto 320).
   *
   * Debe ser un número finito y mayor que 0 (por ejemplo 320 o 320.5);
   * de lo contrario `fragmentoReproductor` lanza un `RangeError`. Se
   * prefiere fallar a interpolar un `NaN`, negativo o `Infinity` en el
   * atributo `style`, que rompería el HTML del artifact.
   */
  alto?: number;
  /** Gira la cámara automáticamente (por defecto `false`). */
  autorotar?: boolean;
  /** Título accesible del ejercicio (va en `aria-label`). */
  titulo?: string;
}

/** Escapa `&`, `<` y `>` para usar el texto como contenido HTML. */
function escaparHtml(texto: string): string {
  return texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/** Escapa `&`, `<`, `>`, `"` y `'` para usar el valor dentro de un atributo. */
function escaparAtributo(texto: string): string {
  return escaparHtml(texto).replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

/**
 * Script que carga el reproductor `posecode-embed` desde unpkg.
 *
 * El script viene de unpkg sin atributo `integrity` (no se calcula un
 * hash SRI); la versión del bundle queda fijada por `VERSION_EMBED`.
 */
export function scriptReproductor(): string {
  return `<script src="https://unpkg.com/posecode-embed@${VERSION_EMBED}/dist/posecode-embed.js"></script>`;
}

/**
 * Genera el HTML que incrusta un ejercicio Posecode en un artifact.
 *
 * Siempre usa `character="off"`: el personaje se descarga de posecode.org y
 * los artifacts bloquean descargas que no sean de unpkg/jsdelivr/cdnjs.
 */
export function fragmentoReproductor(
  posecode: string,
  opciones: OpcionesReproductor = {},
): string {
  const { alto = 320, autorotar = false } = opciones;
  if (!Number.isFinite(alto) || alto <= 0) {
    throw new RangeError(
      `alto debe ser un número finito y mayor que 0 (recibido: ${String(alto)})`,
    );
  }
  const atributos = [
    'character="off"',
    `autorotate="${autorotar ? "true" : "false"}"`,
    `style="display:block;width:100%;height:${alto}px"`,
  ];
  if (opciones.titulo) {
    atributos.push(`aria-label="${escaparAtributo(opciones.titulo)}"`);
  }
  return `<posecode-player ${atributos.join(" ")}>${escaparHtml(posecode)}</posecode-player>`;
}
