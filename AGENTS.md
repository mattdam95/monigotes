# monigotes

Catálogo de ejercicios en español, escritos en [Posecode](https://posecode.org) (lenguaje de texto que se renderiza como un muñeco 3D animado), más una skill/plantilla para incrustarlos en artifacts con planes de entrenamiento.

## Reglas para el agente

- Los ejercicios viven en `ejercicios/<nombre-en-kebab-case>.posecode`. Textos (`cue`, nombres) en **español rioplatense**, sintaxis de Posecode en inglés.
- Cada ejercicio se valida con `posecode-parser` (`src/catalogo.ts`). Un ejercicio nuevo tiene que pasar sin errores ni avisos.
- Tomá como referencia los ejemplos de `ejercicios/`. Usá solo articulaciones y acciones que ya aparezcan ahí o en la spec de Posecode.
- Código en TypeScript, cada módulo con su `*.test.ts` al lado.
- Verificación: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Formato: `pnpm exec prettier --write .`.
- Usá solo `pnpm`. No agregues dependencias ni toques `package.json`, `pnpm-workspace.yaml` ni el lockfile salvo que la tarea lo pida.

## Estado conocido

- El **puente de glúteos** (pose `supine`) se ve mal en el reproductor: no lo agregues hasta que una tarea lo pida.
- Los artifacts solo permiten scripts de unpkg/jsdelivr/cdnjs: el reproductor se carga con `posecode-embed` y `character="off"`.
