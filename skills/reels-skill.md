---
name: reels
description: Generate Instagram Reel scripts for three types — B-Roll Puro (5-8s text overlay, 11-element structure, pattern decision tree, ficha visual, 7-part caption), Trial Reel (12-25s cold acquisition), and Normal (15-60s narrated scripts with exact timing). Includes brand onboarding, 7-step ideation process, hook validation system, batch generation with pattern variety distribution.
argument-hint: [tema] [--tipo=broll|normal|trial] [--duracion=15s|30s|60s] [--objetivo=seguidores|leads|ventas|autoridad] [--temperatura=fria|tibia|caliente] [--batch=3-10] [--patron=contraste|error|pov|lista|habito|confesion] [--formula=A|B|C|D|E|TR1-TR6]
---

# Generador de Reels — Skill para Claude v2.0

## Tres tipos de Reel

| Tipo | Duración | Formato | Cuándo usarlo |
|------|---------|---------|---------------|
| **B-Roll Puro** (`--tipo=broll`) | 5-8 segundos | Footage de fondo + texto en pantalla | Adquisición, scroll-stop — el caption convierte |
| **Trial Reel** (`--tipo=trial`) | 12-25 segundos | Reel corto para audiencia fría | Captar seguidores/leads sin arriesgar comunidad |
| **Normal** (`--tipo=normal`) | 15-60 segundos | Guion narrado, tú en cámara o voz | Educación, autoridad, comunidad, ventas |

> **Regla clave del B-Roll Puro:** El vídeo para el scroll. El caption convierte.
> **Regla clave del Trial Reel:** Es contenido de ADQUISICIÓN, no de comunidad. Debe funcionar sin contexto previo.

---

## Input Requirements

### Requerido
1. **Tema/Oferta** — sobre qué va el reel
2. **Tipo** — `--tipo=broll`, `--tipo=trial`, o `--tipo=normal` (default: normal)

### Opcional
3. `--duracion=15s|30s|60s` — duración objetivo para Normal (default: 30s)
4. `--objetivo=seguidores|leads|ventas|autoridad` — acción deseada (default: leads)
5. `--temperatura=fria|tibia|caliente` — temperatura de audiencia (default: fria para trial, tibia para normal)
6. `--batch=3-10` — generar varias versiones con ángulos distintos
7. `--patron=contraste|error|pov|lista|habito|confesion` — forzar patrón (solo B-Roll)
8. `--formula=A|B|C|D|E` — forzar fórmula de guion (solo Normal)

---

## STEP -1: BRAND ONBOARDING (primera vez o usuario nuevo)

Si no hay información de la marca en memoria, hacer estas 7 preguntas ANTES de generar nada:

1. **¿Qué vendes o qué ofreces?** (específico, no genérico)
   > Útil: "asesorías para organizar contenido y dejar de improvisar"

2. **¿A quién ayudas?** (visualizable)
   > Útil: "creadoras que ya publican pero no convierten"

3. **¿Cuál es el problema real que tiene esa persona?**
   > El real: "no sé qué publicar", "publico y no pasa nada", "me bloqueo"

4. **¿Qué resultado consigue trabajando contigo?**
   > Concreto: "sistema de contenido en 2 semanas", "primeras ventas en DM"

5. **¿Cómo es tu tono?**
   > directa/cañera / cercana/tranquila / técnica/estratégica

6. **¿Qué palabras o frases NO quieres usar?**
   > Ejemplo: "facturar 10k", "manifestar", "emprender desde casa"

7. **¿Cuál es tu CTA principal ahora mismo?**
   > Comenta X / DM / link en bio / guardar

**Guardar en memoria con etiqueta [marca] para no volver a preguntar.**

---

## STEP 0: ANÁLISIS (SILENCIOSO)

Antes de escribir, identificar internamente:

1. ¿Tipo de reel? → define estructura y reglas
2. ¿Qué necesita creer esta persona para dar el siguiente paso?
3. ¿Cuál es el dolor o deseo principal?
4. ¿Qué objeción bloquea la acción?
5. ¿Qué prueba o autoridad hay disponible?

---

## STEP 1: PROCESO DE IDEACIÓN (para --batch)

Cuando se generan múltiples ideas, seguir estos 7 pasos:

**Paso 1** — Bajar la oferta a algo concreto (qué transformación, en qué momento entra la persona)
**Paso 2** — Extraer 3-5 problemas reales (no teóricos — los que la persona siente)
**Paso 3** — Convertir cada problema en tensión:
- "No sé qué publicar" → "Tienes ideas… pero no dirección"
- "Publico pero no crezco" → "Publicas… pero no pasa nada"

**Paso 4** — Elegir patrón para cada tensión (usar el árbol del Step 2)
**Paso 5** — Filtrar: ¿esto es visual? ¿se puede representar en una escena simple?
**Paso 6** — Buscar acción visual básica: escribir, borrar, scroll, mirar pantalla, organizar
**Paso 7** — Cruzar: problema + tensión + patrón + acción visual = idea final

**Para 10 ideas:** coge 3-4 problemas y saca 2-3 ángulos de cada uno con distintos patrones.

---

## STEP 2: ÁRBOL DE DECISIÓN DE PATRÓN (solo B-Roll Puro)

**No empieces por el patrón. Empieza por la idea y la intención.**

1. **¿Qué quiero provocar?** → identificación / cuestionamiento / aprendizaje / confianza / acción
2. **¿Impacto o explicación?** → impacto: Contraste/Error/POV | explicación: Lista/Hábito
3. **¿Hay una creencia equivocada?** → error que cometen: **Error** | forma distinta de ver: **POV**
4. **¿Hay dos cosas que chocan?** → esfuerzo vs resultado, cantidad vs calidad → **Contraste** (el más fuerte)
5. **¿Necesita orden?** → varios puntos → **Lista** (⚠️ solo si no cabe en una frase)
6. **¿Quieres mostrar proceso real?** → cómo trabajas → **Hábito** (solo si es genuinamente interesante)
7. **¿Gana si lo humanizas?** → experiencia personal con aprendizaje → **Confesión** (solo si hay insight)

**Filtro final:**
> "¿Esto se puede decir en UNA frase que genere reacción?"
> - Sí → Contraste / Error / POV
> - No → está mal planteado o es Lista

**Referencia rápida:**
| Intención | Patrón |
|-----------|--------|
| Impacto rápido | Contraste / Error / POV |
| Corregir un error | Error |
| Diferenciarte | POV |
| Choque claro | Contraste |
| Ordenar info | Lista |
| Mostrar proceso | Hábito |
| Conectar desde experiencia | Confesión |

---

## STEP 3: SISTEMA DE HOOKS

### Para B-Roll Puro — 5 patrones de hook

| Patrón | Estructura | Ejemplo |
|--------|-----------|---------|
| **Contraste** | [Acción positiva]… pero [resultado negativo] | "Mucho contenido. Cero marca." |
| **Error directo** | Tu problema no es [culpable obvio] | "Tu problema no es la constancia" |
| **Señalar sin suavizar** | Estás [acción] sin [resultado real] | "Estás creando contenido sin sentido" |
| **Falsa creencia** | No necesitas [lo que todos creen] | "No necesitas más ideas" |
| **Esfuerzo vs resultado** | Trabajas en [X]… pero [Y no pasa] | "Trabajas en tu contenido… pero no se nota" |

### Filtros de validación de hook (aplican a todos los tipos)

1. **¿Se entiende en 1 segundo?** Si hay que releerlo → no sirve
2. **¿Es específico?** Si podría servir para cualquier nicho → está flojo
3. **¿Tiene fricción?** Si no incomoda nada → no funciona
4. **¿Apunta a una sola idea?** Un hook = un mensaje
5. **¿Deja algo sin resolver?** Debe abrir un loop que el caption o el reel cierra
6. **¿Encaja con una escena simple?** *(Solo B-Roll)* Si necesita visual compleja → no sirve

**Errores más comunes:**
- ❌ Explicar en el hook: "El motivo por el que tu contenido no está funcionando es…"
- ❌ Sonar bonito pero vacío: "Crea contenido con intención"
- ❌ Motivacional: "No te rindas con tu contenido"
- ❌ Demasiado suave: "Quizá podrías mejorar tu estrategia"

---

## STEP 4: OUTPUT POR TIPO

---

### TIPO B-ROLL PURO — Estructura de 11 elementos

**Especificaciones técnicas:**
- ⏱️ Duración: **5-8 segundos**
- 🎬 Clips: **1 (ideal) / máximo 2-3**
- 🎯 Función: parar el scroll, no explicar

> Si el hook no se entiende con una sola escena simple, ese hook no es para B-Roll Puro.

```
TÍTULO: [Frase interna para identificar la idea]

PATRÓN: [Contraste / Error / POV / Lista / Hábito / Confesión]

OBJETIVO: [Identificación / guardado / comentarios / visitas al perfil / reflexión]

HOOK PRINCIPAL: "[Frase exacta que va en pantalla]"

HOOK ALTERNATIVO: "[Segunda opción para A/B test]"

TEXTO EN PANTALLA:
• Hook: "[Frase principal]"
• Frase secundaria (opcional): "[Solo si suma — si no, eliminar]"

ESTRUCTURA DEL REEL:
1. [Plano principal]
2. [Cambio mínimo si aplica]
(Si necesitas más de 2 clips → ya no es B-Roll Puro)

FICHA VISUAL:
• Escena: [Qué se ve exactamente]
• Tipo de plano: [cenital / detalle / estático / primer plano]
• Sensación: [orden / caos / calma / saturación / repetición]
• Elementos: [objetos específicos visibles]
• Dificultad: [muy fácil / fácil / medio]

CAPTION (300-700 palabras — 7 partes obligatorias):
1. CTA inicial: "Guarda esto si… / Lee esto si… / Escribe X si…"
2. Conexión con el hook: [Retomar lo que decía el Reel — no cambiar de tema]
3. Problema claro: [Sin adornos — aquí la persona piensa "soy yo"]
4. Insight/Giro: [Romper la creencia — "no es falta de X, es Y"]
5. Desarrollo: [Lista / explicación / comparación — frases cortas para móvil]
6. Cierre potente: [Frase memorable que hace guardar el post]
7. CTA final: [Una sola acción: comentar / guardar / DM / perfil]

CTA RECOMENDADO: [Acción específica]

POR QUÉ PUEDE FUNCIONAR:
• Emoción: [incomodidad / curiosidad / identificación / urgencia]
• Dolor que toca: [descripción]
• Por qué genera interacción: [razón concreta]
```

#### Guía de escenas por patrón

La escena nace del hook. Proceso: **hook literal → emoción → acción simple → plano.**

| Patrón | Tipo de visual | Planos | Sensación |
|--------|---------------|--------|-----------|
| **Contraste** | Diferencia, choque | Comparación, repetición que satura | Saturación |
| **Error** | Acción concreta "lo que haces mal" | Detalle (mano, móvil, pantalla) | Real, no conceptual |
| **POV** | Visual neutra, sin ruido | Escribir, trabajar, mirar pantalla | Limpia, clara |
| **Confesión** | Íntima, momento personal | Detalle, luz suave | Calmada, real |
| **Hábito** | Proceso repetitivo visible | Cenital, secuencia | Práctico |
| **Lista** | Simple, casi decorativa | Sin protagonismo visual | Neutral |

**Criterio de validación:**
> "Si quito el texto, ¿la escena sigue teniendo sentido con la idea?"

**Errores en la ficha visual:**
- ❌ Escena bonita pero sin conexión con el hook
- ❌ Visual genérica siempre igual (siempre café + portátil)
- ❌ Demasiados elementos → distrae del texto
- ❌ Escena que necesita explicación

---

### TIPO TRIAL REEL — Sistema de adquisición en frío

**Especificaciones:** 12-25 segundos | Audiencia fría | Función: captar sin contexto previo

#### Estructura ideal

| Sección | Tiempo | Función |
|---------|--------|---------|
| Hook frío | 0-3s | Para quién es + qué problema toca |
| Identificación | 3-6s | "Esta persona entiende lo que vivo" |
| Reencuadre | 6-12s | La idea que cambia la perspectiva |
| Micro-solución | 12-20s | Un paso claro, no una clase completa |
| CTA de baja fricción | 20-25s | Follow, guardar, comentar — no venta directa |

#### 6 Fórmulas para Trial Reels

**TR-1: Dolor → error → ajuste**
```
"Si [problema], no es por [culpable obvio].
Es porque [causa real].
Haz esto: [ajuste concreto].
Sígueme para [resultado]."
```

**TR-2: Creencia falsa → verdad → CTA**
```
"No necesitas [lo que creen que necesitan].
Necesitas [lo que realmente necesitan].
Porque [razón concreta].
Si quieres [resultado], [CTA]."
```

**TR-3: Mini diagnóstico**
```
"Si te pasa [síntoma 1], [síntoma 2] y [síntoma 3],
tu problema probablemente es [diagnóstico].
El siguiente paso es [solución]."
```

**TR-4: Lista rápida (máxima retención)**
```
"3 señales de que [problema].
Uno: [señal].
Dos: [señal].
Tres: [señal].
Guarda esto si [beneficio]."
```

**TR-5: Haz esto, no esto**
```
"No empieces con [error común].
Empieza con [mejor alternativa].
Porque [razón]."
```

**TR-6: Autoridad rápida**
```
"Después de [experiencia], vi este patrón: [insight].
La solución no es [solución común].
Es [solución real]."
```

---

### TIPO NORMAL — Guiones con tiempos exactos

#### Reel de 15 segundos

| Sección | Tiempo | Función |
|---------|--------|---------|
| Hook | 0-3s | Detener scroll — dolor o promesa específica |
| Desarrollo | 3-10s | Una idea central, sin contexto previo |
| Cierre | 10-13s | Frase memorable, conclusión clara |
| CTA | 13-15s | Acción simple de baja fricción |

#### Reel de 30 segundos

| Sección | Tiempo | Función |
|---------|--------|---------|
| Hook | 0-3s | Captar atención |
| Identificación | 3-7s | "Esto me pasa a mí" |
| Reencuadre | 7-14s | Nueva forma de ver el problema |
| Valor práctico | 14-24s | Paso claro o explicación accionable |
| Cierre | 24-27s | Frase fuerte y memorable |
| CTA | 27-30s | Acción específica |

#### Reel de 45-60 segundos

| Sección | Tiempo | Función |
|---------|--------|---------|
| Hook | 0-3s | Promesa o dolor fuerte |
| Contexto mínimo | 3-8s | Situación, sin introducción larga |
| Tensión | 8-18s | Mostrar el problema o coste real |
| Reencuadre | 18-30s | Nueva perspectiva |
| Solución | 30-45s | Método, pasos o ejemplo concreto |
| Cierre | 45-52s | Insight memorable |
| CTA | 52-60s | Acción directa |

#### 5 Fórmulas de guion para Normal

**Fórmula A: Problema → causa → solución → CTA**
```
Hook: "Si [problema], no es por [culpable obvio]."
Desarrollo: "Es por [causa real]. Haz [solución]."
Cierre: "[Frase memorable]."
CTA: "[Acción específica]."
```

**Fórmula B: Mito → verdad → ejemplo → CTA**
```
Hook: "Te dijeron que [mito]."
Desarrollo: "Pero la verdad es [reencuadre]. Por ejemplo, [ejemplo]."
Cierre: "[Conclusión fuerte]."
CTA: "[Acción]."
```

**Fórmula C: Señales → diagnóstico → siguiente paso**
```
Hook: "3 señales de que [problema]."
Desarrollo: "[Señal 1]. [Señal 2]. [Señal 3]."
Diagnóstico: "Si te pasa esto, necesitas [solución]."
CTA: "[Acción]."
```

**Fórmula D: Story → lección → aplicación**
```
Hook: "Antes pensaba [creencia vieja]."
Desarrollo: "Después descubrí [verdad]. Ahora hago [acción]."
Aplicación: "Tú puedes aplicarlo así: [paso]."
CTA: "[Acción]."
```

**Fórmula E: Objeción → respuesta → prueba → CTA**
```
Hook: "Si piensas [objeción], esto importa."
Desarrollo: "[Respuesta]. [Prueba o ejemplo]."
Cierre: "[Frase fuerte]."
CTA: "[Acción]."
```

---

## STEP 5: CTA POR TEMPERATURA DE AUDIENCIA

| Temperatura | CTAs recomendados | Evitar |
|-------------|------------------|--------|
| Fría | "Sígueme para…", "Guarda esto", "Comenta [palabra]" | Compra directa, DM a vender |
| Tibia | "Mándame [palabra]", "Link en bio", "Comenta y te mando X" | Urgencia forzada |
| Caliente | "DM [palabra]", "Entra a [oferta]", "Reserva aquí" | CTAs vagos |

---

## STEP 6: 7 REGLAS DE RETENCIÓN (Normal y Trial)

1. **El primer segundo debe nombrar algo específico** — no "hoy te cuento sobre…"
2. **Dolor antes que contexto** — la audiencia fría no espera la introducción
3. **Cada 3-5 segundos, nuevo estímulo** — frase visual, cambio, ejemplo, contraste
4. **Frases cortas** — un reel no es un párrafo leído en voz alta
5. **Abre loops** — "hay 3 razones, y la tercera es la que nadie revisa"
6. **Cierra con frase memorable** — algo que se recuerde después de ver el reel
7. **CTA proporcional al nivel de confianza** — no pidas más de lo que la relación justifica

---

## STEP 7: OUTPUT FORMAT

### Para 1 reel

**B-Roll Puro:** ver estructura de 11 elementos en Step 4.

**Trial / Normal:**
```
TIPO: [B-Roll Puro / Trial Reel / Normal]
DURACIÓN: [5-8s / 12-25s / 15s / 30s / 60s]
FÓRMULA: [Patrón B-Roll / TR1-6 / A-E]
TEMPERATURA: [Fría / Tibia / Caliente]
OBJETIVO: [Seguidores / Leads / Ventas / Autoridad]

GUION:
[0-3s] Hook: "[texto exacto]"
[3-Xs] Desarrollo: "[texto exacto]"
[Xs-Ys] Cierre: "[texto exacto]"
[Ys-Zs] CTA: "[texto exacto]"

PUNTUACIÓN:
Hook (¿detiene en <2s?): /5
Claridad (¿se entiende sin contexto?): /5
Relevancia (¿habla a persona específica?): /5
Dolor/Deseo (¿toca algo que importa?): /5
CTA (¿acción clara y proporcional?): /5
TOTAL: /25 → [Listo / Ajustar / Reescribir]
```

### Para `--batch=3-10`

**B-Roll Puro — tabla de resumen + 11 elementos completos por reel:**

| # | Patrón | Hook | CTA | Por qué funciona |
|---|--------|------|-----|-----------------|

**Distribución recomendada para batch de 10 B-Roll:**
- 2-3 Contraste (máximo — satura si se repite)
- 2-3 Error
- 2 POV
- 1 Lista
- 1 Hábito
- 0-1 Confesión

**Check de variedad obligatorio antes de entregar:**
- ¿Variedad de emociones? (incomodidad / claridad / identificación / curiosidad)
- ¿Variedad de intención? (guardar / comentar / reflexionar / DM)
- ¿Variedad de ritmo? (directo / reflexivo / práctico)

> Puedes repetir tema. Puedes repetir problema.
> Pero si repites **forma + tono + patrón** → el contenido se vuelve invisible.

---

## Quality Gates

**NUNCA entregar un reel que:**

### B-Roll Puro
- [ ] El hook necesita más de 5 palabras sin tensión para entenderse
- [ ] La escena no tiene relación directa con el hook
- [ ] El caption no tiene las 7 partes completas
- [ ] Hay más de un CTA o ninguno
- [ ] La duración implícita supera los 8 segundos
- [ ] El patrón mezcla varios estilos

### Trial Reel
- [ ] Pida compra a audiencia fría
- [ ] No responda "¿para quién es esto?" en los primeros 3 segundos
- [ ] Dependa de contexto previo para entenderse

### Normal
- [ ] Empiece con contexto antes del dolor
- [ ] Tenga más de 5 palabras en el primer segundo sin tensión
- [ ] Use el CTA antes de crear suficiente interés
- [ ] Suene genérico — sin problema específico, sin persona específica

---

**Version:** 2.0 — B-Roll Puro + Trial Reel + Normal
**Updated:** Mayo 2026
**Status:** Ready for production + alumnas
