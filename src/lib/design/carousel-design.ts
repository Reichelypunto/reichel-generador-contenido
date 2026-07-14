/**
 * carousel-design.ts
 *
 * Sistema de diseño visual para los carruseles del generador. Convierte el
 * copy validado (JSON de la skill) en HTML de slides diseñadas, listas
 * para previsualizar y exportar como imagen — igual que hace el método de
 * Maverick Maltin, pero con la paleta y tipografía reales de cada marca
 * tuya (ver brands.ts), no genéricas.
 *
 * v2: ahora es multi-marca. Antes tenía la paleta de Vida Emprendedora fija;
 * ahora recibe `brandId` y resuelve los tokens vía getBrandTokens().
 *
 * Colócalo en: src/lib/design/carousel-design.ts
 */

import { getBrandTokens, deriveGradientLight, FONTS, type BrandId, type BrandTokens } from "./brands";

// ---------------------------------------------------------------------------
// 1. TIPOS
// ---------------------------------------------------------------------------

export interface CarouselSlideData {
  /** 1-indexado, igual que en la tabla que genera la skill */
  index: number;
  /** Texto del slide (viene de la columna "Copy" de la tabla del LLM) */
  copy: string;
}

export interface CarouselBuildOptions {
  slides: CarouselSlideData[];
  /** Qué marca aplicar (paleta, tipografía, nombre, handle). Default: vida-emprendedora */
  brandId?: BrandId;
  backgroundOverride?: Record<number, "light" | "dark" | "gradient">;
  logoUrl?: string;
  /** Sobrescribe el nombre de marca mostrado (si no, usa el de brands.ts) */
  brandName?: string;
  /** Sobrescribe el handle mostrado (si no, usa el de brands.ts) */
  handle?: string;
}

type BgType = "light" | "dark" | "gradient";

// ---------------------------------------------------------------------------
// 2. COMPONENTES REUTILIZABLES (reciben los tokens de marca por parámetro)
// ---------------------------------------------------------------------------

function progressBar(index: number, total: number, isLight: boolean, brand: BrandTokens): string {
  const pct = ((index + 1) / total) * 100;
  const track = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)";
  const fill = isLight ? brand.PRIMARY : "#fff";
  const label = isLight ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.4)";
  return `<div style="position:absolute;bottom:0;left:0;right:0;padding:16px 28px 20px;z-index:10;display:flex;align-items:center;gap:10px;">
    <div style="flex:1;height:3px;background:${track};border-radius:2px;overflow:hidden;">
      <div style="height:100%;width:${pct}%;background:${fill};border-radius:2px;"></div>
    </div>
    <span style="font-family:${brand.body};font-size:11px;color:${label};font-weight:500;">${index + 1}/${total}</span>
  </div>`;
}

/** Contador tipográfico en la esquina — alternativa al progress-bar para marcas con counterStyle:"numeral". */
function numeralCounter(index: number, total: number, isLight: boolean, isGradient: boolean, brand: BrandTokens): string {
  const color = isGradient ? "rgba(255,255,255,0.55)" : isLight ? "rgba(57,46,46,0.28)" : "rgba(255,255,255,0.35)";
  const n = String(index + 1).padStart(2, "0");
  const t = String(total).padStart(2, "0");
  return `<div style="position:absolute;top:36px;right:36px;font-family:${brand.heading};font-size:15px;font-weight:600;color:${color};letter-spacing:0.5px;z-index:10;">${n} / ${t}</div>`;
}

function swipeArrow(isLight: boolean): string {
  const bg = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)";
  const stroke = isLight ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.35)";
  return `<div style="position:absolute;right:0;top:0;bottom:0;width:48px;z-index:9;display:flex;align-items:center;justify-content:center;background:linear-gradient(to right,transparent,${bg});">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M9 6l6 6-6 6" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>`;
}

function logoLockup(logoUrl: string | undefined, brandName: string, brand: BrandTokens): string {
  const icon = logoUrl
    ? `<img src="${logoUrl}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" />`
    : `<div style="width:40px;height:40px;border-radius:50%;background:${brand.PRIMARY};display:flex;align-items:center;justify-content:center;color:#fff;font-family:${brand.heading};font-size:18px;">${brandName.charAt(0)}</div>`;
  return `<div style="display:flex;align-items:center;gap:12px;">
    ${icon}
    <span style="font-family:${brand.body};font-size:13px;font-weight:600;letter-spacing:0.5px;">${brandName}</span>
  </div>`;
}

// ---------------------------------------------------------------------------
// 3. RENDER DE UN SLIDE
// ---------------------------------------------------------------------------

function bgFor(
  index: number,
  total: number,
  brand: BrandTokens,
  override?: BgType
): { type: BgType; css: string; isLight: boolean } {
  // El tercer tono se deriva del PRIMARY (aclarado vía HSL) en vez de usar
  // brand.LIGHT — mezclar un color de marca sin relación con el PRIMARY es
  // lo que producía el degradado "turbio". Ver brands.ts para el porqué.
  const gradient = `linear-gradient(165deg, ${brand.DARK} 0%, ${brand.PRIMARY} 55%, ${deriveGradientLight(brand.PRIMARY)} 100%)`;
  if (override) {
    return {
      type: override,
      css: override === "gradient" ? gradient : override === "dark" ? brand.DARK_BG : brand.LIGHT_BG,
      isLight: override === "light",
    };
  }
  if (index === 0) return { type: "light", css: brand.LIGHT_BG, isLight: true };
  if (index === total - 1) return { type: "gradient", css: gradient, isLight: false };
  const isLight = index % 2 === 0;
  // Alterna entre los dos neutros claros de la marca para que la serie de
  // slides claros no repita siempre el mismo tono.
  const lightTone = index % 4 === 0 ? brand.LIGHT_BG : brand.LIGHT_BG_ALT;
  return { type: isLight ? "light" : "dark", css: isLight ? lightTone : brand.DARK_BG, isLight };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderSlide(
  slide: CarouselSlideData,
  total: number,
  opts: CarouselBuildOptions,
  brand: BrandTokens
): string {
  const idx = slide.index - 1;
  const isLast = slide.index === total;
  const isFirst = slide.index === 1;
  const override = opts.backgroundOverride?.[slide.index];
  const bg = bgFor(idx, total, brand, override);
  const textColor = bg.isLight ? brand.DARK_BG : "#fff";
  const tagColor = bg.type === "gradient" ? "rgba(255,255,255,0.6)" : bg.isLight ? brand.PRIMARY : brand.LIGHT;
  const brandName = opts.brandName ?? brand.name;

  // Vida Emprendedora alterna el anclaje del texto (abajo / arriba) en los
  // slides intermedios para romper la monotonía de "todo pegado abajo".
  let justify = isFirst || isLast ? "center" : "flex-end";
  let paddingTop = "";
  if (!isFirst && !isLast && brand.id === "vida-emprendedora" && idx % 2 === 0) {
    justify = "flex-start";
    paddingTop = "padding-top:64px;";
  }

  const counter = brand.counterStyle === "numeral"
    ? numeralCounter(idx, total, bg.isLight, bg.type === "gradient", brand)
    : progressBar(idx, total, bg.isLight, brand);

  const fontSize = brand.id === "vida-emprendedora" ? (isFirst ? "40px" : "24px") : (isFirst ? "32px" : "26px");

  return `<div class="slide" data-index="${idx}" style="position:relative;width:420px;height:525px;flex-shrink:0;background:${bg.css};display:flex;flex-direction:column;justify-content:${justify};${paddingTop}padding-left:36px;padding-right:36px;padding-bottom:52px;overflow:hidden;box-sizing:border-box;">
    ${isFirst ? `<div style="position:absolute;top:40px;left:36px;">${logoLockup(opts.logoUrl, brandName, brand)}</div>` : ""}
    <span style="font-family:${brand.body};font-size:10px;font-weight:600;letter-spacing:2px;color:${tagColor};text-transform:uppercase;margin-bottom:16px;">${isLast ? "Conclusión" : isFirst ? "Empieza aquí" : `Slide ${slide.index}`}</span>
    <p style="font-family:${brand.heading};font-weight:${isFirst ? 600 : 500};font-size:${fontSize};line-height:1.15;letter-spacing:-0.4px;color:${textColor};margin:0;white-space:pre-wrap;">${escapeHtml(slide.copy)}</p>
    ${counter}
    ${isLast ? "" : swipeArrow(bg.isLight)}
  </div>`;
}

// ---------------------------------------------------------------------------
// 4. DOCUMENTO COMPLETO (marco estilo Instagram + track deslizable)
// ---------------------------------------------------------------------------

export function buildCarouselHtml(opts: CarouselBuildOptions): string {
  const brand = getBrandTokens(opts.brandId);
  const total = opts.slides.length;
  const slidesHtml = opts.slides.map((s) => renderSlide(s, total, opts, brand)).join("\n");
  const handle = opts.handle ?? brand.handle ?? brand.name;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<link rel="stylesheet" href="${FONTS.googleFontsUrl}" />
<style>
  * { box-sizing: border-box; }
  body { margin:0; padding:40px; background:#efe6d2; display:flex; justify-content:center; font-family:${brand.body}; }
  .ig-frame { width:420px; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.15); }
  .ig-header { display:flex; align-items:center; gap:10px; padding:12px 16px; }
  .ig-header img { width:32px;height:32px;border-radius:50%; }
  .ig-header span { font-weight:600; font-size:13px; }
  .carousel-viewport { width:420px; height:525px; overflow:hidden; position:relative; }
  .carousel-track { display:flex; width:${420 * total}px; height:525px; transition: transform 0.3s ease; }
  .ig-dots { display:flex; gap:5px; justify-content:center; padding:10px 0; }
  .ig-dots span { width:5px;height:5px;border-radius:50%;background:rgba(0,0,0,0.15); }
  .ig-actions { padding: 8px 16px; font-size: 20px; }
  .ig-caption { padding: 0 16px 16px; font-size: 13px; line-height:1.4; }
</style>
</head>
<body>
  <div class="ig-frame">
    <div class="ig-header">
      ${opts.logoUrl ? `<img src="${opts.logoUrl}" />` : ""}
      <span>${handle}</span>
    </div>
    <div class="carousel-viewport">
      <div class="carousel-track" id="track">
        ${slidesHtml}
      </div>
    </div>
    <div class="ig-dots">${opts.slides.map(() => "<span></span>").join("")}</div>
    <div class="ig-actions">♡ ⤵ ✈ 🔖</div>
    <div class="ig-caption"><strong>${handle}</strong> — desliza para leer el carrusel completo →</div>
  </div>
  <script>
    let startX = 0, current = 0;
    const track = document.getElementById('track');
    const totalSlides = ${total};
    document.querySelector('.carousel-viewport').addEventListener('pointerdown', (e) => { startX = e.clientX; });
    document.querySelector('.carousel-viewport').addEventListener('pointerup', (e) => {
      const dx = e.clientX - startX;
      if (dx < -40 && current < totalSlides - 1) current++;
      if (dx > 40 && current > 0) current--;
      track.style.transform = 'translateX(-' + (current * 420) + 'px)';
    });
  </script>
</body>
</html>`;
}
