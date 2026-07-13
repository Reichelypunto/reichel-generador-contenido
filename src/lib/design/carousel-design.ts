/**
 * carousel-design.ts
 *
 * Sistema de diseño visual para los carruseles de "Vida Emprendedora".
 * Esto es lo que hoy le falta al generador (src/lib/api/generate.functions.ts):
 * la skill "carruseles-skill.md" produce copy validado, pero la app solo
 * lo muestra como texto plano (<pre>{output}</pre> en generador.tsx).
 *
 * Este módulo convierte ese copy en HTML de slides diseñadas, listas para
 * previsualizar y exportar como imagen — igual que hace el método de
 * Maverick Maltin, pero con la paleta y tipografía reales de Vida
 * Emprendedora (tomadas de src/styles.css), no genéricas.
 *
 * Colócalo en: src/lib/design/carousel-design.ts
 */

// ---------------------------------------------------------------------------
// 1. TOKENS DE MARCA — extraídos de src/styles.css (:root, "Vida Emprendedora palette")
// ---------------------------------------------------------------------------

export const BRAND = {
  // oklch(0.48 0.19 0) del CSS original
  PRIMARY: "#a3134b",
  // versión aclarada ~20% — para tags sobre fondo oscuro, pills
  LIGHT: "#c9527f",
  // versión oscurecida ~30% — CTA text, ancla del degradado
  DARK: "#6e0d34",
  // oklch(0.972 0.025 90) — crema cálido, nunca blanco puro
  LIGHT_BG: "#f9f2e2",
  // ligeramente más oscuro que LIGHT_BG
  LIGHT_BORDER: "#e9dcc0",
  // negro cálido con tinte magenta (coherente con --accent peach del CSS)
  DARK_BG: "#211018",
  // acento cálido (oklch(0.88 0.06 25))
  ACCENT_PEACH: "#e9c6ab",
} as const;

export const GRADIENT = `linear-gradient(165deg, ${BRAND.DARK} 0%, ${BRAND.PRIMARY} 55%, ${BRAND.LIGHT} 100%)`;

// Tipografía real del proyecto (ya cargada en styles.css vía Google Fonts)
export const FONTS = {
  heading: "'Cormorant Garamond', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
  googleFontsUrl:
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap",
} as const;

export const HANDLE = "@reichelypunto"; // TODO: mover a config/perfil si se vuelve multi-marca

// ---------------------------------------------------------------------------
// 2. TIPOS
// ---------------------------------------------------------------------------

export interface CarouselSlideData {
  /** 1-indexado, igual que en la tabla que genera la skill */
  index: number;
  /** Texto del slide (viene de la columna "Copy" de la tabla del LLM) */
  copy: string;
}

export interface CarouselBuildOptions {
  slides: CarouselSlideData[];
  /** Alterna fondo claro/oscuro empezando en claro, salvo overrides puntuales */
  backgroundOverride?: Record<number, "light" | "dark" | "gradient">;
  logoUrl?: string;
  brandName?: string;
  handle?: string;
}

// ---------------------------------------------------------------------------
// 3. COMPONENTES REUTILIZABLES (idénticos en espíritu al master prompt de Maverick,
//    pero con los tokens de arriba)
// ---------------------------------------------------------------------------

function progressBar(index: number, total: number, isLight: boolean): string {
  const pct = ((index + 1) / total) * 100;
  const track = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)";
  const fill = isLight ? BRAND.PRIMARY : "#fff";
  const label = isLight ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.4)";
  return `<div style="position:absolute;bottom:0;left:0;right:0;padding:16px 28px 20px;z-index:10;display:flex;align-items:center;gap:10px;">
    <div style="flex:1;height:3px;background:${track};border-radius:2px;overflow:hidden;">
      <div style="height:100%;width:${pct}%;background:${fill};border-radius:2px;"></div>
    </div>
    <span style="font-family:${FONTS.body};font-size:11px;color:${label};font-weight:500;">${index + 1}/${total}</span>
  </div>`;
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

function logoLockup(logoUrl: string | undefined, brandName: string): string {
  const icon = logoUrl
    ? `<img src="${logoUrl}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" />`
    : `<div style="width:40px;height:40px;border-radius:50%;background:${BRAND.PRIMARY};display:flex;align-items:center;justify-content:center;color:#fff;font-family:${FONTS.heading};font-size:18px;">${brandName.charAt(0)}</div>`;
  return `<div style="display:flex;align-items:center;gap:12px;">
    ${icon}
    <span style="font-family:${FONTS.body};font-size:13px;font-weight:600;letter-spacing:0.5px;">${brandName}</span>
  </div>`;
}

// ---------------------------------------------------------------------------
// 4. RENDER DE UN SLIDE
// ---------------------------------------------------------------------------

type BgType = "light" | "dark" | "gradient";

function bgFor(index: number, total: number, override?: BgType): { type: BgType; css: string; isLight: boolean } {
  if (override) {
    return {
      type: override,
      css: override === "gradient" ? GRADIENT : override === "dark" ? BRAND.DARK_BG : BRAND.LIGHT_BG,
      isLight: override === "light",
    };
  }
  // Primer slide claro, último degradado (CTA), resto alterna
  if (index === 0) return { type: "light", css: BRAND.LIGHT_BG, isLight: true };
  if (index === total - 1) return { type: "gradient", css: GRADIENT, isLight: false };
  const isLight = index % 2 === 0;
  return { type: isLight ? "light" : "dark", css: isLight ? BRAND.LIGHT_BG : BRAND.DARK_BG, isLight };
}

function renderSlide(
  slide: CarouselSlideData,
  total: number,
  opts: CarouselBuildOptions
): string {
  const idx = slide.index - 1;
  const isLast = slide.index === total;
  const isFirst = slide.index === 1;
  const override = opts.backgroundOverride?.[slide.index];
  const bg = bgFor(idx, total, override);
  const textColor = bg.isLight ? BRAND.DARK_BG : "#fff";
  const tagColor = bg.type === "gradient" ? "rgba(255,255,255,0.6)" : bg.isLight ? BRAND.PRIMARY : BRAND.LIGHT;

  const justify = isFirst || isLast ? "center" : "flex-end";

  return `<div class="slide" data-index="${idx}" style="position:relative;width:420px;height:525px;flex-shrink:0;background:${bg.css};display:flex;flex-direction:column;justify-content:${justify};padding:0 36px 52px;overflow:hidden;box-sizing:border-box;">
    ${isFirst ? `<div style="position:absolute;top:40px;left:36px;">${logoLockup(opts.logoUrl, opts.brandName ?? "Vida Emprendedora")}</div>` : ""}
    <span style="font-family:${FONTS.body};font-size:10px;font-weight:600;letter-spacing:2px;color:${tagColor};text-transform:uppercase;margin-bottom:16px;">${isLast ? "Conclusión" : isFirst ? "Empieza aquí" : `Slide ${slide.index}`}</span>
    <p style="font-family:${FONTS.heading};font-weight:${isFirst ? 600 : 500};font-size:${isFirst ? "32px" : "26px"};line-height:1.15;letter-spacing:-0.4px;color:${textColor};margin:0;white-space:pre-wrap;">${escapeHtml(slide.copy)}</p>
    ${progressBar(idx, total, bg.isLight)}
    ${isLast ? "" : swipeArrow(bg.isLight)}
  </div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ---------------------------------------------------------------------------
// 5. DOCUMENTO COMPLETO (marco estilo Instagram + track deslizable)
//    — el mismo patrón de "Instagram Frame" del master prompt de Maverick.
// ---------------------------------------------------------------------------

export function buildCarouselHtml(opts: CarouselBuildOptions): string {
  const total = opts.slides.length;
  const slidesHtml = opts.slides.map((s) => renderSlide(s, total, opts)).join("\n");
  const handle = opts.handle ?? HANDLE;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<link rel="stylesheet" href="${FONTS.googleFontsUrl}" />
<style>
  * { box-sizing: border-box; }
  body { margin:0; padding:40px; background:#efe6d2; display:flex; justify-content:center; font-family:${FONTS.body}; }
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
    // swipe manual solo para la previsualización en navegador;
    // el script de exportación (export-carousel.ts) mueve el track directamente.
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
