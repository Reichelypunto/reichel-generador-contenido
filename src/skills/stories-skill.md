---
name: generador-de-historias
description: Generate viral Instagram Stories sequences (4-8 max) with psychological analysis, narrative structure selection, 15-element validation, batch generation (3-10 angles), emotional progression, and optional visual direction.
argument-hint: [oferta] [audience-consciousness?] [--batch=3-10] [--structure=problema|promesa|oferta-stars] [--length=corta|media|larga] [--cta=dm|link|compra-directa|encuesta] [--include-visuals=yes|no]
---

# Generador de Historias — Skill para Claude

## Overview
Genera secuencias de Instagram Stories (4-8 máximo) que convierten desde curiosidad hasta compra. Incluye análisis psicológico, selección de estructura narrativa, validación de 15 elementos, progresión emocional, y generación en batch de múltiples ángulos sobre la misma oferta.

## Purpose
- Convertir oferta vaga en secuencia estratégica de Stories
- Analizar nivel de consciencia de audiencia (poco/mediano/muy consciente)
- Seleccionar estructura óptima (Problema/Solución, Promesa Agresiva, Oferta 11 Estrellas)
- Generar 3-10 secuencias diferentes con ángulos distintos (emocional, educativo, provocativo)
- Validar cada Story contra 15 elementos no-negociables
- Exportar en formato markdown, docx, o Notion
- Mapear progresión emocional clara en cada secuencia

## Input Requirements

### Required
1. **Oferta** — qué se vende (producto, servicio, programa)
2. **Audiencia** (inferida o explícita) — nivel de consciencia (poco/mediano/muy consciente)

### Optional
3. `--batch=3|5|10` — generar 3-5-10 secuencias diferentes (default: 1)
4. `--structure=problema-solucion|promesa|oferta-stars` — forzar estructura específica
5. `--length=corta|media|larga` — ajustar cantidad (4-5 / 5-6 / 6-8 Stories)
6. `--cta=dm|link|compra-directa|encuesta` — tipo de CTA final (default: dm)
7. `--include-visuals=yes` — dirección visual detallada por Story (default: no)
8. `--export=markdown|docx|notion` — formato de entrega (default: markdown)

### Example Usage
```
# Una secuencia simple
/generador-de-historias "Mi curso de copywriting" --consciousness=warm

# Múltiples ángulos + dirección visual
/generador-de-historias "Software de email marketing" --batch=5 --consciousness=hot --include-visuals=yes

# Batch completo con exportación
/generador-de-historias "Programa de mentoría" --batch=10 --consciousness=cold --export=docx

# CTA específico
/generador-de-historias "Producto físico" --cta=compra-directa --length=corta
```

---

## Execution Steps

### Step 0: Análisis Psicológico (SILENCIOSO)

Nunca despliegues. Úsalo internamente:

1. **Objetivo final** — ¿Qué acción buscamos? (venta, registro, descarga, DM)
2. **Nivel de consciencia** — ¿Poco, mediano o muy consciente?
3. **Dolor principal** — ¿Cuál es el problema real que toca?
4. **Deseo activado** — ¿Qué quiere lograr?
5. **Emociones clave** — Curiosidad, identificación, confianza, urgencia, alivio
6. **Objeciones esperadas** — ¿Qué frenaría la compra?
7. **Prueba disponible** — Testimonios, casos, resultados

**Output:** [Consciencia] → [Estructura óptima] + [Motor viral] + [Emociones clave]

---

### Step 0.5: Selección Estratégica de Ángulo

**Pregunta central antes de escribir cualquier Story:**
**¿Qué necesita creer esta persona para dar el siguiente paso?**

#### Selector de Objetivo

| Objetivo | Ángulo más fuerte | CTA recomendado |
|----------|------------------|----------------|
| Generar atención | Dolor urgente, síntoma o error común | Encuesta, respuesta |
| Nutrir confianza | Historia, proceso, detrás de escena | DM, pregunta |
| Crear autoridad | Resultado, método propio, caso real | Link, DM |
| Vender | Objeción, transformación, prueba | DM, link, compra |
| Reactivar audiencia fría | Síntoma, identificación fuerte | Encuesta, respuesta |

#### 5 Niveles de Consciencia → Estructura

| Nivel | Estado | Estructura ideal |
|-------|--------|-----------------|
| No consciente | Siente frustración, no sabe el problema | Problema/Solución (7-8 Stories) |
| Consciente del problema | Sabe qué le duele | Problema/Solución (6-7 Stories) |
| Consciente de la solución | Busca opciones, compara | Promesa Agresiva (5-7 Stories) |
| Consciente del producto | Te conoce, duda en comprar | Oferta 11 Estrellas (5-6 Stories) |
| Muy consciente | Solo necesita decidir | Oferta 11 Estrellas (4-5 Stories) |

#### Objeción Principal → Ángulo

| Objeción | Ángulo de Stories |
|----------|------------------|
| "No tengo tiempo" | Simplicidad, sistema rápido |
| "Es muy caro" | Coste de no actuar, transformación |
| "No sé si me servirá" | Especificidad, casos reales |
| "Ya lo intenté" | Nuevo mecanismo, por qué antes no funcionó |
| "Puedo hacerlo sola" | Límite del DIY, acompañamiento |

---

### Step 1: Seleccionar Estructura según Consciencia

**Poco Consciente (COLD)** → **Problema/Solución** (6-8 Stories)
- Estructura: Problema → Agravamiento → Frustración → Solución → Cómo funciona → Prueba → Oferta
- Motor: Alivio, identificación, transformación
- Tono: Directo, sin urgencia fabricada

**Medianamente Consciente (WARM)** → **Promesa Agresiva** (5-7 Stories)
- Estructura: Hook provocador → Lo que nadie dice → Por qué funciona → Resultado posible → Acceso limitado
- Motor: Curiosidad, deseo, confianza
- Tono: Psicológico, sin ser manipulador

**Muy Consciente (HOT)** → **Oferta 11 Estrellas** (4-6 Stories)
- Estructura: Gancho específico → Proposición de valor → Stack de beneficios → Prueba → CTA directo
- Motor: Decisión, acción inmediata
- Tono: Confianza extrema, sin explicaciones innecesarias

---

### Step 2: Diseñar Gancho Inicial (Story 1)

**Story 1 DEBE detener el dedo.** Opciones:

- **Provocadora:** Afirmación contraria a creencia común
- **Específica:** Número, métrica, resultado cuantificable
- **Reconocible:** "Si tú eres [perfil], esto es para ti"
- **Confesión:** Verdad personal que la audiencia siente

---

### Step 3: Estructurar Cada Story (6 elementos)

Para CADA story, define:

1. **Intención** — ¿Para qué existe esta Story?
2. **Gancho/Entrada** — Primera línea que hace quedarse
3. **Desarrollo breve** — Una idea principal máximo
4. **Remate/Microavance** — Frase que cierra o abre curiosidad
5. **Visual** — Dirección de imagen/video (si `--include-visuals=yes`)
6. **Interacción/CTA** — Microacción acorde al momento

---

### Step 4: Progresión Emocional

**OBLIGATORIA. NUNCA SALTAR:**

Curiosidad → Identificación → Tensión → Alivio → Deseo → Confianza → Decisión → Acción

Cada Story debe avanzar emocionalmente. Si una no suma, reescribir.

---

### Step 5: Validación de 15 Elementos

**NADA se entrega sin pasar estos 15 checks:**

1. ✓ **Gancho específico** — No genérico
2. ✓ **Patrón narrativo claro** — Contraste, error, punto de vista, confesión, hábito, lista
3. ✓ **Objetivo definido** — Qué queremos que haga el viewer
4. ✓ **Contenido specifico** — Referencia a la oferta real, no ejemplos vagos
5. ✓ **Motor viral identificado** — Aspiración, educación, impacto, reflejo
6. ✓ **Emociones activadas** — Curiosidad, identificación, confianza, urgencia
7. ✓ **Objeciones resueltas** — Al menos 2 miedos principales atajados
8. ✓ **Prueba/Credibilidad** — Testimonio, caso, métrica, resultado
9. ✓ **Coherencia tonal** — Mismo tono start-to-finish
10. ✓ **Promesa cumplida** — No es clickbait, entrega lo que promete
11. ✓ **Progresión clara** — Cada Story avanza narrativa/emocionalmente
12. ✓ **CTA definido** — DM, Link, Compra, Encuesta (específico)
13. ✓ **Urgencia real** — Si existe, debe ser verdadera (no "hoy es el último día")
14. ✓ **Duración técnica** — 4-8 Stories máximo total
15. ✓ **Valor real** — Audiencia obtiene algo (insight, validación, alivio)

Si ALGUNO falla → REESCRIBIR.

---

### Step 6: Batch Generation (si `--batch=3|5|10`)

Generar N secuencias DIFERENTES sobre MISMA oferta. Ángulos:

**Ángulo 1: Emocional** — Toca el dolor, el deseo, la transformación personal
**Ángulo 2: Educativo** — Enseña cómo/por qué funciona, data, transparencia
**Ángulo 3: Provocativo** — Desafía creencias, contrarian take, audaz
**Ángulo 4: Social Proof** — Resultado real, testimonios, antes/después
**Ángulo 5: FOMO** — Acceso limitado, exclusividad, ventana de tiempo
**Ángulo 6: Curiosidad Pura** — Secreto, lo que nadie dice, confesión
**Ángulo 7: Comparación** — Vs. competencia, vs. hacer nada, vs. método antiguo
**Ángulo 8: Negativo** — Error común que frena, obstáculo, frustración
**Ángulo 9: Simplificación** — Descomplicar algo complejo, fórmula simple
**Ángulo 10: Identidad** — Si tú eres [tipo de persona], necesitas esto

Distribuir ángulos entre 3-10 secuencias.

---

### Step 7: Output Format

**Default: Tabla markdown**

```
| # | Story | Intención | Copy | CTA | Visual (si incluye) |
|---|-------|-----------|------|-----|-----|
| 1 | Gancho | Detener dedo | [Texto] | Story siguiente | [Descripción] |
| 2 | Desarrollo | Identificación | [Texto] | Story siguiente | [Descripción] |
...
```

**Con `--batch`:  Múltiples secuencias separadas por ángulo**

---

## Quality Gates (NO NEGOTIABLE)

NUNCA entregues si:

- [ ] No pasa validación de 15 elementos
- [ ] Tiene menos de 4 o más de 8 Stories
- [ ] Suena a anuncio frío o publicitario
- [ ] Tiene dolor genérico o deseo vago
- [ ] No muestra progresión narrativa clara
- [ ] No tiene CTA definido
- [ ] Usa urgencia inventada
- [ ] No resuelve al menos 2 objeciones principales
- [ ] Las emociones no progresan Story a Story

Si ALGUNO falla → REESCRIBIR SECCIÓN.

---

## Preguntas Clarificadoras

Solo haz si:
- No está claro el objetivo final
- El nivel de consciencia es ambiguo
- La oferta está demasiado vaga
- No sabes cuál es el dolor real

NO hagas si:
- Puedes inferir del contexto
- El usuario fue específico
- Hay suficiente información para proceder

---

## Output Confirmation

1. Número de secuencias generadas (1 o `--batch`)
2. Estructura seleccionada (Problema/Solución, Promesa, Oferta Stars)
3. Ángulos cubiertos (si batch)
4. Story count por secuencia (4-8)
5. CTA final utilizado
6. Status de validación (15 elementos ✓)
7. Listo para copiar/pegar en Instagram Stories

---

## Brand Voice

- **Tono:** Directo, psicológico, narrativo
- **Evitar:** Urgencia falsa, clickbait, genericidad
- **Abrazar:** Especificidad, progresión clara, transformación
- **CTAs:** DM, Link a landing, Compra directa, Encuesta

---

**Version:** 1.0 — Generador de Historias para Claude
**Status:** Ready for production
**Created:** May 4, 2026
**For:** Alumnas + Reichel
