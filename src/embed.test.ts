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

describe("scriptReproductor", () => {
  it("usa exactamente la versión VERSION_EMBED (0.5.0) y el host unpkg.com", () => {
    expect(VERSION_EMBED).toBe("0.5.0");
    const script = scriptReproductor();
    expect(script).toBe(`<script src="${URL_ESPERADA}"></script>`);
    expect(script).toContain("unpkg.com");
    expect(script).not.toContain("jsdelivr");
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
