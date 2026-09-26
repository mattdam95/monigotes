/** Versión del reproductor `posecode-embed` que incrustamos en los artifacts. */
export const VERSION_EMBED = "0.5.0";

export interface OpcionesReproductor {
  /** Alto del reproductor en píxeles (por defecto 320). */
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

/** Script que carga el reproductor `posecode-embed` desde unpkg. */
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
