# Referencia de sintaxis de Posecode

Lenguaje de versión 0.4. Vocabulario cerrado exportado por `posecode-parser`.

## Tipos de movimiento

- `exercise`
- `stretch`
- `posture`

## Poses iniciales

- `neutral`
- `standing`
- `first-position`
- `plank`
- `supine`
- `prone`
- `seated`

## Modos de timing de un paso

Modos (se indican después de la duración, ej. `1.2s settle`):

- `flow`
- `settle`
- `drive`
- `snap`
- `linear`

Curvas de easing (modos y alias legados):

- `flow`
- `settle`
- `drive`
- `snap`
- `linear`
- `ease-in`
- `ease-out`
- `ease-in-out`

## Contactos (ground-lock, pin, reach)

Apoyos en el piso (`ground-lock`):

- `hands`
- `hand_left`
- `hand_right`
- `forearms`
- `elbow_left`
- `elbow_right`
- `feet`
- `foot_left`
- `foot_right`
- `back`

Puntos fijos que trasladan el cuerpo a un anclaje (`pin`):

- `hands`
- `fists`
- `forearms`
- `knees`
- `feet`
- `hand_left`
- `hand_right`
- `fist_left`
- `fist_right`
- `elbow_left`
- `elbow_right`
- `knee_left`
- `knee_right`
- `foot_left`
- `foot_right`
- `pelvis`

Efectores que se llevan a un punto por IK (`reach`):

- `hands`
- `fists`
- `forearms`
- `knees`
- `feet`
- `hand_left`
- `hand_right`
- `fist_left`
- `fist_right`
- `elbow_left`
- `elbow_right`
- `knee_left`
- `knee_right`
- `foot_left`
- `foot_right`

## Elementos (props)

- `chair`
- `wall`
- `bar`
- `box`
- `dip-bars`

## Plantilla mínima

```
posecode exercise "Nombre"
  rig humanoid
  pose start = standing

  step "Paso" 1.2s settle:
    knees: flex 30
    ground-lock: feet
    cue "Indicación en español"

  repeat 8
```
