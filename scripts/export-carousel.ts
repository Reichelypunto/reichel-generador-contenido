/**
 * export-carousel.ts
 *
 * Esto es la pieza que HOY NO EXISTE en el repo: un exportador que convierte
 * el HTML del carrusel (carousel-design.ts) en imágenes PNG 1080×1350 listas
 * para subir a Instagram — el mismo enfoque de Playwright que usa el método
 * de Maverick (device_scale_factor, viewport fijo a 420px, clip exacto),
 * adaptado a Node/TypeScript para encajar con el stack bun + TanStack Start
 * de este proyecto.
 *
 * USO LOCAL (manual, mientras no haya endpoint serverless):
 *   bun add -d playwright
 *   bunx playwright install chromium
 *   bun run scripts/export-carousel.ts ./carrusel.html ./out
 *
 * USO PROGRAMÁTICO (desde un server function, ver informe "Opción B"):
 *   import { exportCarouselHtml } from "./export-carousel";
 *   const pngBuffers = await exportCarouselHtml(html, totalSlides);
 *
 * Nota sobre despliegue serverless (Vercel/Netlify functions, etc.):
 * Playwright normal no corre ahí por el tamaño del binario de Chromium.
 * Para producción sin servidor propio, sustituye el import de "playwright"
 * por "playwright-core" + "@sparticuz/chromium" (ver comentario al final).
 */

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const VIEW_W = 420;
const VIEW_H = 525;
const SCALE = 1080 / VIEW_W; // 2.5714...

/**
 * Recibe el HTML completo generado por buildCarouselHtml() y el número
 * total de slides, devuelve un PNG (Buffer) por slide.
 */
export async function exportCarouselHtml(html: string, totalSlides: number): Promise<Buffer[]> {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: VIEW_W, height: VIEW_H },
    deviceScaleFactor: SCALE,
  });

  await page.setContent(html, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500); // deja cargar Cormorant Garamond + DM Sans

  // Oculta la "chrome" del marco de Instagram (header, dots, actions, caption)
  // y fija el viewport al tamaño exacto del carrusel — igual que hace el
  // master prompt de Maverick antes de capturar.
  await page.evaluate(() => {
    document
      .querySelectorAll(".ig-header, .ig-dots, .ig-actions, .ig-caption")
      .forEach((el) => ((el as HTMLElement).style.display = "none"));

    const frame = document.querySelector<HTMLElement>(".ig-frame");
    if (frame) {
      frame.style.cssText =
        "width:420px;height:525px;max-width:none;border-radius:0;box-shadow:none;overflow:hidden;margin:0;";
    }
    const viewport = document.querySelector<HTMLElement>(".carousel-viewport");
    if (viewport) {
      viewport.style.cssText = "width:420px;height:525px;overflow:hidden;cursor:default;";
    }
    document.body.style.cssText = "padding:0;margin:0;display:block;overflow:hidden;";
  });
  await page.waitForTimeout(300);

  const buffers: Buffer[] = [];

  for (let i = 0; i < totalSlides; i++) {
    await page.evaluate((idx) => {
      const track = document.getElementById("track");
      if (track) {
        track.style.transition = "none";
        track.style.transform = `translateX(-${idx * 420}px)`;
      }
    }, i);
    await page.waitForTimeout(200);

    const buf = await page.screenshot({
      clip: { x: 0, y: 0, width: VIEW_W, height: VIEW_H },
    });
    buffers.push(buf);
  }

  await browser.close();
  return buffers;
}

// ---------------------------------------------------------------------------
// CLI: bun run scripts/export-carousel.ts <input.html> <output-dir> [totalSlides]
// ---------------------------------------------------------------------------

async function main() {
  const [, , inputPath, outputDir, totalArg] = process.argv;
  if (!inputPath || !outputDir) {
    console.error("Uso: bun run export-carousel.ts <input.html> <output-dir> [totalSlides]");
    process.exit(1);
  }

  const html = await Bun.file(inputPath).text();
  const totalSlides = totalArg ? parseInt(totalArg, 10) : countSlidesInHtml(html);

  await mkdir(outputDir, { recursive: true });
  const buffers = await exportCarouselHtml(html, totalSlides);

  for (let i = 0; i < buffers.length; i++) {
    const file = path.join(outputDir, `slide_${i + 1}.png`);
    await writeFile(file, buffers[i]);
    console.log(`✓ ${file}`);
  }
}

function countSlidesInHtml(html: string): number {
  const matches = html.match(/class="slide"/g);
  return matches ? matches.length : 0;
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

/**
 * ---------------------------------------------------------------------------
 * VARIANTE SERVERLESS (para exportar directo desde la app, sin paso manual)
 * ---------------------------------------------------------------------------
 * Si quieres que "Exportar PNGs" en CarouselPreview.tsx funcione en producción
 * sin un servidor con Chromium propio, cambia el import de arriba por:
 *
 *   import chromium from "@sparticuz/chromium";
 *   import { chromium as playwrightCore } from "playwright-core";
 *
 *   const browser = await playwrightCore.launch({
 *     args: chromium.args,
 *     executablePath: await chromium.executablePath(),
 *     headless: true,
 *   });
 *
 * Y expón exportCarouselHtml() detrás de un createServerFn (igual que
 * generarContenido en generate.functions.ts), devolviendo los PNGs como
 * base64 o subiéndolos a un bucket de Supabase Storage y devolviendo URLs.
 * Esa segunda opción es la recomendada: ver "server-export.functions.ts"
 * en el informe.
 */
