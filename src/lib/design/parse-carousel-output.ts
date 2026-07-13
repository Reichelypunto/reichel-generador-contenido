/**
 * parse-carousel-output.ts
 *
 * Hoy `generarContenido()` (src/lib/api/generate.functions.ts) devuelve un
 * único string de texto libre — la skill le pide al modelo una tabla
 * markdown "| Slide | Copy |", pero nada en el código la parsea: la app
 * solo hace `<pre>{output}</pre>`. Por eso no se puede renderizar como
 * carrusel visual ni exportar a imagen.
 *
 * Este módulo convierte ese texto en datos estructurados que
 * carousel-design.ts puede consumir.
 *
 * Colócalo en: src/lib/design/parse-carousel-output.ts
 *
 * IMPORTANTE (recomendación, ver informe): la forma más robusta de arreglar
 * esto de raíz es pedirle al modelo un bloque ```json en vez de una tabla
 * markdown (ver "Opción A" en el informe). Este parser es el fallback que
 * funciona con el formato ACTUAL de la skill sin tocar el prompt.
 */

import type { CarouselSlideData } from "./carousel-design";

export interface ParsedCarousel {
  slides: CarouselSlideData[];
  caption: string | null;
}

/**
 * Intenta parsear, en este orden:
 * 1. Un bloque ```json { "slides": [...], "caption": "..." } ``` — si en el futuro
 *    se actualiza el prompt para pedir JSON (recomendado).
 * 2. Una tabla markdown "| Slide | Copy |".
 * 3. Líneas sueltas tipo "Slide 3: texto" o "3. texto" (fallback laxo).
 */
export function parseCarouselOutput(raw: string): ParsedCarousel {
  const jsonBlock = tryParseJsonBlock(raw);
  if (jsonBlock) return jsonBlock;

  const table = tryParseMarkdownTable(raw);
  if (table.slides.length > 0) return table;

  return tryParseLooseLines(raw);
}

// ---------------------------------------------------------------------------
// 1. Bloque JSON
// ---------------------------------------------------------------------------

function tryParseJsonBlock(raw: string): ParsedCarousel | null {
  const match = raw.match(/```json\s*([\s\S]*?)```/i);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    if (!Array.isArray(parsed.slides)) return null;
    const slides: CarouselSlideData[] = parsed.slides.map((s: any, i: number) => ({
      index: typeof s.index === "number" ? s.index : i + 1,
      copy: String(s.copy ?? s.text ?? "").trim(),
    }));
    return { slides, caption: typeof parsed.caption === "string" ? parsed.caption : null };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 2. Tabla markdown "| Slide | Copy |"
// ---------------------------------------------------------------------------

function tryParseMarkdownTable(raw: string): ParsedCarousel {
  const lines = raw.split("\n");
  const slides: CarouselSlideData[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;

    // separar celdas, ignorando la fila separadora "|---|---|"
    const cells = trimmed
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (cells.length < 2) continue;
    if (/^-+$/.test(cells[0].replace(/:/g, ""))) continue; // fila separadora
    if (/^slide$/i.test(cells[0]) || /^copy$/i.test(cells[1])) continue; // encabezado

    const indexMatch = cells[0].match(/\d+/);
    if (!indexMatch) continue;

    slides.push({
      index: parseInt(indexMatch[0], 10),
      copy: cells.slice(1).join(" — ").trim(),
    });
  }

  slides.sort((a, b) => a.index - b.index);

  return { slides, caption: extractCaption(raw) };
}

// ---------------------------------------------------------------------------
// 3. Fallback laxo: "Slide 3: ..." / "3. ..." / "3) ..."
// ---------------------------------------------------------------------------

function tryParseLooseLines(raw: string): ParsedCarousel {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const slides: CarouselSlideData[] = [];

  const pattern = /^(?:slide\s*)?(\d{1,2})[.):-]\s*(.+)$/i;

  for (const line of lines) {
    const m = line.match(pattern);
    if (!m) continue;
    const idx = parseInt(m[1], 10);
    if (idx < 1 || idx > 20) continue; // filtra falsos positivos ("2026", horas, etc.)
    slides.push({ index: idx, copy: m[2].trim() });
  }

  slides.sort((a, b) => a.index - b.index);

  return { slides, caption: extractCaption(raw) };
}

// ---------------------------------------------------------------------------
// Caption: la skill genera un caption estratégico aparte de la tabla de slides.
// Suele venir bajo un encabezado "Caption" o después de la tabla.
// ---------------------------------------------------------------------------

function extractCaption(raw: string): string | null {
  const match = raw.match(/caption[:\s]*\n?([\s\S]{10,600}?)(?:\n{2,}|$)/i);
  return match ? match[1].trim() : null;
}
