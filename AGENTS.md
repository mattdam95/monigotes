# monigotes

Catálogo de ejercicios en español, escritos en [Posecode](https://posecode.org) (lenguaje de texto que se renderiza como un muñeco 3D animado), más una skill/plantilla para incrustarlos en artifacts con planes de entrenamiento.

## Reglas para el agente

- Los ejercicios viven en `ejercicios/<nombre-en-kebab-case>.posecode`. Textos (`cue`, nombres) en **español rioplatense**, sintaxis de Posecode en inglés.
- Cada ejercicio se valida con `posecode-parser` (`src/catalogo.ts`). Un ejercicio nuevo tiene que pasar sin errores ni avisos.
- Tomá como referencia los ejemplos de `ejercicios/`. Usá solo articulaciones y acciones que ya aparezcan ahí o en la spec de Posecode.
- Código en TypeScript, cada módulo con su `*.test.ts` al lado.
- Verificación: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Formato: `pnpm exec prettier --write .`.
- Usá solo `pnpm`. No agregues dependencias ni toques `package.json`, `pnpm-workspace.yaml` ni el lockfile salvo que la tarea lo pida.

## Estructura de la skill

La skill le permite a un agente armar planes de ejercicio con muñecos animados: busca el ejercicio en el catálogo, si no existe lo escribe en Posecode, lo valida y lo incrusta en un artifact.

- `skill/SKILL.md`: instrucciones para el agente (se escribe aparte, no lo toques salvo que la tarea lo pida).
- `skill/references/*.md`: **generados** desde el parser por tests con `toMatchFileSnapshot`. No se editan a mano: se regeneran con `pnpm test -- -u` y se commitean. Prettier los ignora.
- `skill/evals/`: casos de prueba para medir la skill.
- `src/<modulo>.ts` con su `src/<modulo>.test.ts`. Los fixtures de tests van en `src/__fixtures__/<modulo>/`.
- `ejercicios/<id>.posecode` y, opcional, `ejercicios/<id>.json` con metadatos en español.
- El vocabulario de Posecode (articulaciones, acciones, rangos, poses) se importa de `posecode-parser` (`JOINT_NAMES`, `ACTION_NAMES`, `actionsForJoint`, `romFor`, `START_POSE_NAMES`, …). Leé sus tipos en `node_modules/posecode-parser/dist/*.d.ts` en vez de adivinar.
- **Creá solo los archivos que la tarea lista.** Varias tareas corren la misma noche desde el mismo `main`: si tocás archivos de otra tarea, las PRs chocan al mergear.

## Estado conocido

- El **puente de glúteos** (pose `supine`) se ve mal en el reproductor: no lo agregues hasta que una tarea lo pida.
- Los artifacts solo permiten scripts de unpkg/jsdelivr/cdnjs: el reproductor se carga con `posecode-embed` y `character="off"`.
