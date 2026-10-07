---
name: monigotes
description: Arma planes de entrenamiento con muñecos 3D animados dentro de un artifact. Busca cada ejercicio en el catálogo en español (carpeta `ejercicios/`), si no está lo escribe en Posecode, lo valida y lo incrusta con el reproductor `posecode-embed`. Usala cuando pidan una rutina, un plan de ejercicios o "mostrame cómo se hace X" con animación.
---

# monigotes

Catálogo de ejercicios en español escritos en [Posecode](https://posecode.org), un lenguaje de texto que se renderiza como un muñeco 3D animado. Esta skill te deja armar un plan de entrenamiento en un artifact donde cada ejercicio tiene su muñeco.

Todas las rutas son relativas a la raíz del repo `monigotes` (donde está `ejercicios/`). El repo tiene que tener las dependencias instaladas: `pnpm install --frozen-lockfile`.

## Flujo

1. **Entendé el pedido.** Qué ejercicios, para qué objetivo, qué equipo hay, qué nivel. Si falta algo que cambia el plan (equipo, lesiones, días por semana), preguntá una sola vez; si no, elegí un default razonable y decilo.
2. **Buscá cada ejercicio en el catálogo.** Mirá `ejercicios/*.json` (campo `nombre`) y `ejercicios/*.posecode`. Hacé la búsqueda sin tildes ni plurales ("flexiones" = "flexión"). Si existe, usalo tal cual: no lo reescribas.
3. **Si no existe, escribilo.** Seguí [Cómo escribir un ejercicio](#cómo-escribir-un-ejercicio). Guardalo en `ejercicios/<id>.posecode` con su `ejercicios/<id>.json` si el usuario quiere sumarlo al catálogo; si es solo para este plan, escribilo en un archivo temporal.
4. **Validá** cada ejercicio nuevo (ver [Validar](#validar)). Corregí hasta que no haya errores **ni avisos**.
5. **Armá el artifact** (ver [Incrustar en un artifact](#incrustar-en-un-artifact)). Un muñeco por ejercicio, con series, repeticiones, descanso e indicaciones.
6. **Contale al usuario** qué ejercicios salieron del catálogo y cuáles escribiste vos, y marcá estos últimos como "a revisar la forma" (no hay forma de ver el movimiento sin abrir el artifact).

## Cómo escribir un ejercicio

Referencias (vocabulario cerrado, **generado desde el parser**, no se edita a mano):

- `skill/references/sintaxis.md`: tipos, poses iniciales, modos de timing, contactos y props.
- `skill/references/articulaciones.md`: cada articulación, sus acciones y el rango en grados.

Copiá la estructura de `ejercicios/sentadilla.posecode` (ejercicio de pie) o `ejercicios/zancada.posecode` (un lado distinto del otro, con `pin` y `reach`). No inventes articulaciones, acciones ni contactos que no estén en las referencias o en un ejemplo del catálogo.

Reglas del catálogo:

- Archivo `ejercicios/<nombre-en-kebab-case-sin-tildes>.posecode`. Sintaxis en inglés (`step`, `flex`, `cue`), pero **nombre del ejercicio, nombres de paso y `cue` en español rioplatense** ("Bajá", "Empujá"), sin palabras en inglés sueltas.
- Cada `step` lleva al menos un `cue` y una duración con modo (`1.4s settle`). Termina con `repeat N`, N ≥ 1.
- Un ejercicio repetido tiene que **volver a la posición de partida** en el último paso (los ángulos vuelven a 0), si no el bucle salta.
- Contactos (**verificado con el parser**): `pin` no se combina con `ground-lock` en el mismo paso, y hay **un solo `pin` por paso**; para apoyar otro punto, sumá un `reach` junto al `pin` (como en `zancada.posecode`). Un `reach` a `wall`, `chair`, etc. exige declarar antes ese `prop`.
- Los ángulos se recortan al rango de cada articulación. Si el parser avisa que recortó, bajá el ángulo: el muñeco no va a hacer más de lo que dice el rango.
- Usá `pose start = standing` salvo que el ejercicio empiece en el piso (`supine`, `prone`, `plank`, `seated`).
- **No agregues el puente de glúteos** ni otros ejercicios con `pose start = supine` apoyando la pelvis: se ven mal en el reproductor (**verificado por el usuario**).
- Si el pedido necesita algo que Posecode no puede expresar (peso externo, agarre complejo, secuencias anidadas como supersets), decíselo al usuario y proponé la variante más cercana en vez de forzarlo.

Metadatos `ejercicios/<id>.json`, todos obligatorios:

```json
{
  "nombre": "Sentadilla",
  "musculosPrincipales": ["cuádriceps", "glúteos"],
  "musculosSecundarios": ["isquiotibiales", "core"],
  "equipo": [],
  "nivel": "principiante",
  "instrucciones": ["3 a 6 frases en imperativo rioplatense"]
}
```

`nivel` es `principiante`, `intermedio` o `avanzado`. `equipo` va vacío si no usa nada.

## Validar

```bash
node skill/scripts/validar.mjs ejercicios/nuevo.posecode   # un archivo
node skill/scripts/validar.mjs ejercicios                  # todo el catálogo
```

Imprime `ok` o los problemas con archivo y línea, y sale con código 1 si hay errores **o avisos**. Un aviso significa que el parser recortó un ángulo fuera de rango.

No uses `posecode-parser validate`: con el symlink de pnpm termina sin imprimir nada y con código 0, aunque el archivo esté mal (**verificado**). Tampoco `pnpm dlx`: el registry del Mac no responde.

Si estás dentro del repo, `pnpm lint && pnpm typecheck && pnpm test && pnpm build` además corre las reglas de estilo y de metadatos del catálogo.

## Incrustar en un artifact

Los artifacts solo dejan cargar scripts de unpkg, jsdelivr y cdnjs. Por eso el reproductor se carga desde unpkg y el personaje va apagado (`character="off"`): el personaje se descargaría de posecode.org y el artifact lo bloquea.

Un solo `<script>` por página, y un `<posecode-player>` por ejercicio con el texto Posecode adentro. En el texto hay que escapar `&`, `<` y `>`.

```html
<script src="https://unpkg.com/posecode-embed@0.5.0/dist/posecode-embed.js"></script>

<posecode-player
  character="off"
  autorotate="false"
  style="display:block;width:100%;height:320px"
  aria-label="Sentadilla"
  >posecode exercise "Sentadilla" rig humanoid pose start = standing ... repeat
  8</posecode-player
>
```

El módulo `src/embed.ts` hace exactamente esto (`fragmentoReproductor`, `scriptReproductor`); si estás en el repo, usalo como referencia del HTML que se espera. Altura por defecto 320 px.

Diseño del plan: para cada ejercicio, el muñeco, el nombre, series × repeticiones (o tiempo), descanso, el equipo y las `instrucciones` del `.json`. Que se lea bien en el celular (una columna, sin scroll horizontal). Antes de armar la página, cargá la skill de diseño de artifacts si tu entorno la tiene.

## Límites conocidos

- La versión del reproductor está fija en `posecode-embed@0.5.0` y la del parser en `0.5.0`. No subas una sin la otra.
- Licencia: el parser es Apache-2.0, pero el renderer y el embed son **AGPL-3.0**. Para uso personal por CDN no hay problema; si el plan se va a compartir públicamente o vender, avisá al usuario que revise la licencia (**a verificar**, no es asesoramiento legal).
- No hay forma de "ver" el muñeco desde acá: un ejercicio que valida bien puede verse raro. Por eso los ejercicios nuevos salen marcados como a revisar.
- Este `SKILL.md` está sin probar con un pedido real de punta a punta. Los casos para medirlo están en `skill/evals/` (PR #56, todavía sin mergear).
