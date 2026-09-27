import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "posecode-parser";
import { describe, expect, it } from "vitest";
import { validarMetadatos } from "./metadatos.js";

const DIR = new URL("../ejercicios", import.meta.url).pathname;

const base = {
  nombre: "Sentadilla",
  musculosPrincipales: ["cuádriceps", "glúteos"],
  musculosSecundarios: ["isquiotibiales", "core"],
  equipo: [],
  nivel: "principiante",
  instrucciones: [
    "Pies al ancho de los hombros.",
    "Bajá llevando la cadera hacia atrás, con el pecho erguido.",
    "Llegá los muslos casi paralelos al piso.",
    "Empujá con los talones para volver a quedarte de pie.",
  ],
};

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

const LISTAS_CON_ELEMENTO_VACIO: Record<Lista, string[]> = {
  musculosPrincipales: ["", "glúteos"],
  musculosSecundarios: ["isquiotibiales", ""],
  equipo: ["mancuernas", ""],
  instrucciones: ["Pies al ancho de los hombros.", "Bajá.", "Subí.", ""],
};

function sinCampo(campo: Campo): Record<string, unknown> {
  const copia: Record<string, unknown> = { ...base };
  delete copia[campo];
  return copia;
}

describe("validarMetadatos", () => {
  it("un objeto correcto no reporta problemas", () => {
    expect(validarMetadatos(base)).toEqual([]);
  });

  it("acepta 3 y 6 instrucciones (los límites)", () => {
    expect(
      validarMetadatos({
        ...base,
        instrucciones: base.instrucciones.slice(0, 3),
      }),
    ).toEqual([]);
    expect(
      validarMetadatos({
        ...base,
        instrucciones: [
          ...base.instrucciones,
          "Mantené la mirada al frente.",
          "Respirá de forma constante.",
        ],
      }),
    ).toEqual([]);
  });

  describe("falta de campos", () => {
    it.each(CAMPOS.map((campo) => [campo] as const))(
      "reporta cuando falta %s",
      (campo: Campo) => {
        const problemas = validarMetadatos(sinCampo(campo));
        expect(problemas.length).toBeGreaterThan(0);
        expect(problemas.join(" ").toLowerCase()).toContain(
          campo.toLowerCase(),
        );
      },
    );

    it("reporta cuando el dato no es un objeto", () => {
      expect(validarMetadatos(null).length).toBeGreaterThan(0);
      expect(validarMetadatos("sentadilla").length).toBeGreaterThan(0);
    });
  });

  describe("nivel inválido", () => {
    it.each(["experto", 5] as const)(
      "reporta cuando nivel es %s",
      (nivel: string | number) => {
        const problemas = validarMetadatos({ ...base, nivel });
        expect(problemas.length).toBeGreaterThan(0);
        expect(problemas.join(" ").toLowerCase()).toContain("nivel");
      },
    );
  });

  describe("cantidad de instrucciones", () => {
    it("reporta cuando hay menos de 3", () => {
      const problemas = validarMetadatos({
        ...base,
        instrucciones: ["Pies al ancho de los hombros.", "Bajá despacio."],
      });
      expect(problemas.length).toBeGreaterThan(0);
      expect(problemas.join(" ").toLowerCase()).toContain("instrucciones");
    });

    it("reporta cuando hay más de 6", () => {
      const muchas = Array.from({ length: 7 }, (_, i) => `Frase ${i + 1}.`);
      const problemas = validarMetadatos({ ...base, instrucciones: muchas });
      expect(problemas.length).toBeGreaterThan(0);
      expect(problemas.join(" ").toLowerCase()).toContain("instrucciones");
    });
  });

  describe("listas con elementos vacíos", () => {
    it.each(LISTAS.map((lista) => [lista] as const))(
      "reporta elementos vacíos en %s",
      (lista: Lista) => {
        const problemas = validarMetadatos({
          ...base,
          [lista]: LISTAS_CON_ELEMENTO_VACIO[lista],
        });
        expect(problemas.length).toBeGreaterThan(0);
        expect(problemas.join(" ").toLowerCase()).toContain(
          lista.toLowerCase(),
        );
      },
    );
  });

  describe("nombre vacío o de solo espacios", () => {
    it.each(["", "   ", " \t\n "] as const)(
      "reporta con un mensaje que nombra el campo cuando nombre es %j",
      (nombre: string) => {
        const problemas = validarMetadatos({ ...base, nombre });
        expect(problemas.length).toBeGreaterThan(0);
        expect(problemas.join(" ")).toContain("nombre");
      },
    );
  });

  describe("musculosPrincipales", () => {
    it("reporta cuando la lista está vacía (debe tener al menos un músculo)", () => {
      const problemas = validarMetadatos({
        ...base,
        musculosPrincipales: [],
      });
      expect(problemas.length).toBeGreaterThan(0);
      expect(problemas.join(" ")).toContain("musculosPrincipales");
    });

    it("acepta musculosSecundarios y equipo vacíos", () => {
      expect(
        validarMetadatos({ ...base, musculosSecundarios: [], equipo: [] }),
      ).toEqual([]);
    });
  });
});

describe("metadatos en ejercicios/", () => {
  const archivosJson = readdirSync(DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();
  const archivosPosecode = readdirSync(DIR)
    .filter((f) => f.endsWith(".posecode"))
    .sort();

  it.each(archivosPosecode.map((f) => [f] as const))(
    "todo .posecode tiene su .json con el mismo id: %s",
    (archivo: string) => {
      const id = archivo.slice(0, -".posecode".length);
      expect(existsSync(join(DIR, `${id}.json`))).toBe(true);
    },
  );

  it("existen los .json de los ejercicios de las PRs #2 y #27 a #30", () => {
    for (const id of [
      "elevacion-de-talones",
      "elevacion-lateral",
      "peso-muerto",
      "remo-inclinado",
      "zancada",
    ]) {
      expect(existsSync(join(DIR, `${id}.json`))).toBe(true);
    }
  });

  it("existe al menos un .json", () => {
    expect(archivosJson.length).toBeGreaterThan(0);
  });

  it("tiene los JSON pedidos: sentadilla y curl-de-biceps", () => {
    for (const id of ["curl-de-biceps", "sentadilla"]) {
      expect(existsSync(join(DIR, `${id}.json`))).toBe(true);
    }
  });

  it.each(archivosJson.map((f) => [f] as const))(
    "%s tiene un .posecode con el mismo id",
    (archivo: string) => {
      const id = archivo.slice(0, -".json".length);
      expect(existsSync(join(DIR, `${id}.posecode`))).toBe(true);
    },
  );

  it.each(archivosJson.map((f) => [f] as const))(
    "%s es válido según validarMetadatos",
    (archivo: string) => {
      const dato = JSON.parse(readFileSync(join(DIR, archivo), "utf8"));
      expect(validarMetadatos(dato)).toEqual([]);
    },
  );

  it.each(archivosJson.map((f) => [f] as const))(
    "%s: el nombre coincide con el de su .posecode",
    (archivo: string) => {
      const id = archivo.slice(0, -".json".length);
      const dato = JSON.parse(readFileSync(join(DIR, archivo), "utf8")) as {
        nombre: string;
      };
      const { ir } = parse(readFileSync(join(DIR, `${id}.posecode`), "utf8"));
      expect(ir).not.toBeNull();
      expect(ir?.name).toBe(dato.nombre);
    },
  );
});
