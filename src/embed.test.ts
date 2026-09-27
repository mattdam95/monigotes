import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  VERSION_EMBED,
  fragmentoReproductor,
  scriptReproductor,
} from "./embed.js";

const POSECODE_SIMPLE = [
  'posecode exercise "Sentadilla"',
  "  rig humanoid",
  "  pose start = standing",
  "",
  '  step "Bajar" 1.6s settle:',
  "    hips: flex 80",
  '    cue "Llevá la cadera hacia atrás, pecho erguido"',
  "",
  '  step "Subir" 1.2s drive:',
  "    hips: flex 0",
  '    cue "Empujá con los talones hasta quedar parado"',
  "",
  "  repeat 8",
].join("\n");

const POSECODE_ESPECIAL = [
  'posecode exercise "Sentadilla"',
  "  rig humanoid",
  "  pose start = standing",
  "",
  '  step "Bajar" 1.6s settle:',
  "    hips: flex 80",
  '    cue "Bajá hasta < 90° & mantené el pecho arriba"',
  "",
  "  repeat 8",
].join("\n");

const URL_ESPERADA = `https://unpkg.com/posecode-embed@${VERSION_EMBED}/dist/posecode-embed.js`;

function contenidoDe(html: string): string {
  const apertura = html.indexOf(">");
  const cierre = html.lastIndexOf("</posecode-player>");
  return html.slice(apertura + 1, cierre);
}

function sinEntidades(texto: string): string {
  return texto
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function urlsDe(html: string): string[] {
  return html.match(/https?:\/\/[^\s"'<>()]+/g) ?? [];
}

/** Captura el error que lanza `fn`; si no lanza, el test falla con un mensaje claro. */
function errorAlLlamar(fn: () => string, etiqueta: string): Error {
  try {
    fn();
  } catch (error) {
    if (error instanceof Error) return error;
    throw new Error(
      `${etiqueta}: lanzó algo que no es un Error: ${String(error)}`,
    );
  }
  throw new Error(
    `${etiqueta}: se esperaba que fragmentoReproductor lanzara un error`,
  );
}

/** Extrae el bloque de comentario JSDoc que precede a una función en la fuente. */
function comentarioSobre(funcion: string, fuente: string): string {
  const posicion = fuente.indexOf(`function ${funcion}`);
  if (posicion === -1) return "";
  const antes = fuente.slice(0, posicion);
  const fin = antes.lastIndexOf("*/");
  const inicio = antes.lastIndexOf("/**");
  if (inicio === -1 || fin < inicio) return "";
  return fuente.slice(inicio, fin + 2);
}

describe("scriptReproductor", () => {
  it("usa exactamente la versión VERSION_EMBED (0.5.0) y el host unpkg.com", () => {
    expect(VERSION_EMBED).toBe("0.5.0");
    const script = scriptReproductor();
    expect(script).toBe(`<script src="${URL_ESPERADA}"></script>`);
    expect(script).toContain("unpkg.com");
    expect(script).not.toContain("jsdelivr");
  });

  it("documenta en su comentario que el script viene de unpkg sin integrity y que la versión la fija VERSION_EMBED", () => {
    const fuente = readFileSync(new URL("./embed.ts", import.meta.url), "utf8");
    const comentario = comentarioSobre("scriptReproductor", fuente);
    expect(comentario.length).toBeGreaterThan(0);
    expect(comentario).toContain("unpkg");
    expect(comentario).toContain("integrity");
    expect(comentario).toContain("VERSION_EMBED");
  });
});

describe("fragmentoReproductor", () => {
  it('siempre incluye character="off"', () => {
    expect(fragmentoReproductor(POSECODE_SIMPLE)).toContain('character="off"');
    expect(
      fragmentoReproductor(POSECODE_ESPECIAL, {
        alto: 500,
        autorotar: true,
        titulo: "Sentadilla",
      }),
    ).toContain('character="off"');
  });

  it("usa los valores por defecto: autorotate=false, alto 320 y sin aria-label", () => {
    const html = fragmentoReproductor(POSECODE_SIMPLE);
    expect(html).toMatch(/^<posecode-player[\s>]/);
    expect(html.endsWith("</posecode-player>")).toBe(true);
    expect(html).toContain('autorotate="false"');
    expect(html).toContain("display:block;width:100%;height:320px");
    expect(html).not.toContain("aria-label");
  });

  it("escapa < y & del posecode y deja el resto del texto intacto", () => {
    const html = fragmentoReproductor(POSECODE_ESPECIAL);
    expect(html).toContain("&lt;");
    expect(html).toContain("&amp;");
    const contenido = contenidoDe(html);
    expect(contenido).not.toContain("<");
    expect(contenido).not.toMatch(/&(?!lt;|gt;|amp;)/);
    expect(sinEntidades(contenido)).toBe(POSECODE_ESPECIAL);
  });

  it('alto: 400 produce height:400px y autorotar: true produce autorotate="true"', () => {
    const html = fragmentoReproductor(POSECODE_SIMPLE, {
      alto: 400,
      autorotar: true,
    });
    expect(html).toContain("height:400px");
    expect(html).toContain('autorotate="true"');
  });

  it("un titulo con comillas queda escapado dentro de aria-label", () => {
    const html = fragmentoReproductor(POSECODE_SIMPLE, {
      titulo: 'Sentadilla "pesada"',
    });
    expect(html).toContain('aria-label="Sentadilla &quot;pesada&quot;"');
  });

  it("no contiene ninguna URL que no sea la del script (posecode.org, .glb)", () => {
    const urlsScript = urlsDe(scriptReproductor());
    expect(urlsScript).toEqual([URL_ESPERADA]);

    const fragmentos = [
      fragmentoReproductor(POSECODE_SIMPLE),
      fragmentoReproductor(POSECODE_ESPECIAL, {
        alto: 400,
        autorotar: true,
        titulo: 'Sentadilla "pesada"',
      }),
    ];
    for (const fragmento of fragmentos) {
      expect(fragmento).not.toMatch(/https?:\/\//);
      expect(fragmento).not.toContain("posecode.org");
      expect(fragmento).not.toContain(".glb");
    }
  });
});

describe("validación de alto en fragmentoReproductor", () => {
  const ALTOS_INVALIDOS: ReadonlyArray<{ alto: number; etiqueta: string }> = [
    { alto: NaN, etiqueta: "NaN" },
    { alto: -5, etiqueta: "un negativo (-5)" },
    { alto: 0, etiqueta: "0" },
    { alto: Infinity, etiqueta: "Infinity" },
  ];

  it.each(ALTOS_INVALIDOS)(
    "lanza un RangeError con mensaje en español si alto es $etiqueta",
    ({ alto, etiqueta }) => {
      const error = errorAlLlamar(
        () => fragmentoReproductor(POSECODE_SIMPLE, { alto }),
        `alto=${etiqueta}`,
      );
      expect(error, `alto=${etiqueta}`).toBeInstanceOf(RangeError);
      expect(error.message, `alto=${etiqueta}`).toMatch(/alto|altura/i);
    },
  );

  it("conserva un alto decimal (320.5) sin romper el atributo style", () => {
    const html = fragmentoReproductor(POSECODE_SIMPLE, { alto: 320.5 });
    expect(html).toContain('style="display:block;width:100%;height:320.5px"');
    expect(html).toMatch(/height:320\.5px/);
  });

  it("un alto entero válido (320 por defecto) sigue generando el atributo completo", () => {
    const html = fragmentoReproductor(POSECODE_SIMPLE);
    expect(html).toContain('style="display:block;width:100%;height:320px"');
  });
});
